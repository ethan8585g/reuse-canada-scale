// Shared dispatch chat UI: the message list, attachments and the composer.
// Used by the driver portal ("Dispatch" tab) and the office page
// (/employee/dispatch), which differ only in which thread they load and which
// side counts as "mine". Each page calls dcStart({ threadUrl, sendUrl, mine }).
//
// This is a template string inserted into other template strings, so the
// client code must contain no backslashes and no backticks.

export function dispatchComposerHtml(): string {
  return `
    <div id="dc-messages" class="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-gray-50" aria-live="polite">
      <div class="text-center text-gray-400 text-sm py-10"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
    </div>
    <div class="border-t border-gray-100 bg-white p-3">
      <div id="dc-pending" class="flex flex-wrap gap-2 mb-2" style="display:none;"></div>
      <div id="dc-error" class="text-xs text-red-600 mb-2" style="display:none;"></div>
      <div class="flex items-end gap-2">
        <button type="button" onclick="document.getElementById('dc-camera-input').click()" class="shrink-0 w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-rc-green" title="Take a photo" aria-label="Take a photo"><i class="fas fa-camera"></i></button>
        <button type="button" onclick="document.getElementById('dc-file-input').click()" class="shrink-0 w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-rc-green" title="Attach photos or files" aria-label="Attach photos or files"><i class="fas fa-paperclip"></i></button>
        <input type="file" id="dc-camera-input" accept="image/*" capture="environment" class="hidden" onchange="dcPickFiles(this)">
        <input type="file" id="dc-file-input" multiple accept="image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" class="hidden" onchange="dcPickFiles(this)">
        <textarea id="dc-text" rows="1" maxlength="4000" placeholder="Type a message..." onkeydown="dcKey(event)" oninput="dcGrow(this)"
          class="flex-1 min-w-0 resize-none px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none max-h-40" aria-label="Message"></textarea>
        <button type="button" id="dc-send-btn" onclick="dcSend()" class="shrink-0 h-10 px-4 rounded-xl bg-rc-green hover:bg-rc-green-light text-white font-semibold text-sm disabled:opacity-50" aria-label="Send"><i class="fas fa-paper-plane"></i><span class="hidden sm:inline ml-2">Send</span></button>
      </div>
    </div>
  `
}

export const DISPATCH_CHAT_SCRIPT = `
<script>
  var DC = { cfg: null, after: 0, timer: null, pending: [], sending: false, blobs: {}, lastDay: '' };
  var DC_MAX_BYTES = 700000;

  function dcStart(cfg) {
    dcStop();
    DC.cfg = cfg; DC.after = 0; DC.lastDay = '';
    document.getElementById('dc-messages').innerHTML = '<div class="text-center text-gray-400 text-sm py-10"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>';
    dcPoll(true);
    DC.timer = setInterval(function() { if (!document.hidden) dcPoll(false); }, 5000);
  }
  function dcStop() { if (DC.timer) clearInterval(DC.timer); DC.timer = null; }

  async function dcPoll(first) {
    if (!DC.cfg) return;
    var cfg = DC.cfg;
    try {
      var res = await axios.get(cfg.threadUrl + (DC.after ? '?after=' + DC.after : ''));
      if (cfg !== DC.cfg) return;
      var msgs = res.data.messages || [];
      if (cfg.onLoaded) cfg.onLoaded(res.data);
      dcAppend(msgs, first);
    } catch (e) {
      if (first) document.getElementById('dc-messages').innerHTML = '<div class="text-center text-red-500 text-sm py-10">Could not load messages. <button class="underline" onclick="dcPoll(true)">Retry</button></div>';
    }
  }

  // created_at is UTC from SQLite ("YYYY-MM-DD HH:MM:SS").
  function dcDate(s) { return new Date(String(s).replace(' ', 'T') + 'Z'); }
  function dcTime(s) { return dcDate(s).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function dcDay(s) {
    var d = dcDate(s), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return 'Today';
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function dcSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function dcText(s) { return escHtml(s || '').split(String.fromCharCode(10)).join('<br>'); }

  function dcAppend(msgs, first) {
    var box = document.getElementById('dc-messages');
    if (first) {
      box.innerHTML = '';
      if (!msgs.length) box.innerHTML = '<div id="dc-empty" class="text-center text-gray-400 text-sm py-10"><i class="fas fa-comments text-3xl mb-2 block text-gray-300"></i>' + escHtml(DC.cfg.emptyText || 'No messages yet.') + '</div>';
    }
    // Two polls can overlap (the 5 s timer and the one after sending); drop
    // anything already on screen.
    msgs = msgs.filter(function(m) { return m.id > DC.after; });
    if (!msgs.length) return;
    var empty = document.getElementById('dc-empty'); if (empty) empty.remove();
    var nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    var html = '';
    msgs.forEach(function(m) {
      var day = dcDay(m.created_at);
      if (day !== DC.lastDay) { html += '<div class="text-center"><span class="text-[11px] font-semibold text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-0.5">' + day + '</span></div>'; DC.lastDay = day; }
      html += dcBubble(m);
      DC.after = Math.max(DC.after, m.id);
    });
    box.insertAdjacentHTML('beforeend', html);
    dcHydrate(box);
    var mineLast = msgs[msgs.length - 1].sender_kind === DC.cfg.mine;
    if (first || nearBottom || mineLast) box.scrollTop = box.scrollHeight;
  }

  function dcBubble(m) {
    if (m.sender_kind === 'system') {
      return '<div class="flex justify-center"><div class="max-w-[85%] text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2"><i class="fas fa-circle-info text-amber-500 mr-1"></i>' + dcText(m.body) + ' <span class="text-gray-400 ml-1">' + dcTime(m.created_at) + '</span></div></div>';
    }
    var mine = m.sender_kind === DC.cfg.mine;
    var who = m.sender_kind === 'dispatch' ? 'Dispatch' + (m.sender_name ? ' · ' + m.sender_name : '') : (m.sender_name || 'Driver');
    var files = (m.attachments || []).map(function(a) {
      if (a.inline && a.mime.indexOf('image/') === 0) {
        return '<button type="button" onclick="dcOpen(' + a.id + ', 1)" class="block mt-1 rounded-lg overflow-hidden border border-black/10 bg-white/40" title="' + escAttr(a.filename) + '">' +
          '<img data-att="' + a.id + '" alt="' + escAttr(a.filename) + '" class="block max-h-56 max-w-full min-w-[6rem] min-h-[4rem] object-cover"></button>';
      }
      return '<button type="button" onclick="dcOpen(' + a.id + ', ' + (a.inline ? 1 : 0) + ')" class="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg text-left ' + (mine ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-100 hover:bg-gray-200') + '">' +
        '<i class="fas ' + (a.mime === 'application/pdf' ? 'fa-file-pdf' : 'fa-file') + '"></i><span class="text-xs"><span class="font-semibold break-all">' + escHtml(a.filename) + '</span><br><span class="opacity-70">' + dcSize(a.size) + (a.inline ? '' : ' · download') + '</span></span></button>';
    }).join('');
    var read = mine && m.read_at ? ' · <i class="fas fa-check-double" title="Seen"></i>' : '';
    return '<div class="flex ' + (mine ? 'justify-end' : 'justify-start') + '">' +
      '<div class="max-w-[85%] sm:max-w-[70%]">' +
        '<div class="text-[11px] mb-0.5 ' + (mine ? 'text-right text-gray-400' : 'text-gray-500 font-semibold') + '">' + (mine ? 'You' : escHtml(who)) + '</div>' +
        '<div class="rounded-2xl px-3.5 py-2 text-sm shadow-sm ' + (mine ? 'bg-rc-green text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md') + '">' +
          (m.body ? '<div class="whitespace-normal break-words">' + dcText(m.body) + '</div>' : '') + files +
        '</div>' +
        '<div class="text-[10px] text-gray-400 mt-0.5 ' + (mine ? 'text-right' : '') + '">' + dcTime(m.created_at) + read + '</div>' +
      '</div></div>';
  }

  // Images need the Bearer token, so they are fetched as blobs, not <img src>.
  async function dcBlob(id) {
    if (DC.blobs[id]) return DC.blobs[id];
    var res = await axios.get('/api/dispatch/attachments/' + id, { responseType: 'blob' });
    DC.blobs[id] = URL.createObjectURL(res.data);
    return DC.blobs[id];
  }
  function dcHydrate(root) {
    root.querySelectorAll('img[data-att]').forEach(function(img) {
      var id = img.getAttribute('data-att');
      img.removeAttribute('data-att');
      dcBlob(id).then(function(u) { img.src = u; }).catch(function() { img.alt = 'Photo could not load'; });
    });
  }
  // Photos and PDFs open in a new tab; anything else downloads, so an
  // uploaded web page can never run on this site.
  async function dcOpen(id, inline) {
    try {
      var res = await axios.get('/api/dispatch/attachments/' + id, { responseType: 'blob' });
      var cd = res.headers['content-disposition'] || '';
      var name = (cd.split('filename="')[1] || 'file').split('"')[0];
      if (inline) { window.open(URL.createObjectURL(res.data), '_blank'); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([res.data], { type: 'application/octet-stream' }));
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { dcError('Could not open that file'); }
  }

  function dcError(msg) {
    var el = document.getElementById('dc-error');
    el.textContent = msg || ''; el.style.display = msg ? 'block' : 'none';
  }

  // Photos are shrunk on the device (max 1600 px, JPEG) so a phone camera
  // shot fits the 700 KB limit; other files must already fit.
  function dcShrink(file) {
    return new Promise(function(resolve, reject) {
      var r = new FileReader();
      r.onload = function() {
        var img = new Image();
        img.onload = function() {
          var scale = Math.min(1, 1600 / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          var q = 0.85, url = cv.toDataURL('image/jpeg', q);
          while (url.length * 0.75 > DC_MAX_BYTES && q > 0.3) { q -= 0.1; url = cv.toDataURL('image/jpeg', q); }
          if (url.length * 0.75 > DC_MAX_BYTES) return reject(new Error(file.name + ' is too large'));
          var base = (file.name || 'photo').replace(/[.][^.]+$/, '');
          resolve({ filename: base + '.jpg', mime: 'image/jpeg', data: url, size: Math.round(url.length * 0.75), preview: url });
        };
        img.onerror = function() { reject(new Error(file.name + ' could not be read')); };
        img.src = r.result;
      };
      r.onerror = function() { reject(new Error(file.name + ' could not be read')); };
      r.readAsDataURL(file);
    });
  }
  function dcRead(file) {
    return new Promise(function(resolve, reject) {
      if (file.size > DC_MAX_BYTES) return reject(new Error(file.name + ' is larger than 700 KB'));
      var r = new FileReader();
      r.onload = function() { resolve({ filename: file.name, mime: file.type || 'application/octet-stream', data: r.result, size: file.size }); };
      r.onerror = function() { reject(new Error(file.name + ' could not be read')); };
      r.readAsDataURL(file);
    });
  }
  async function dcPickFiles(input) {
    dcError('');
    var files = Array.prototype.slice.call(input.files || []);
    input.value = '';
    for (var i = 0; i < files.length; i++) {
      if (DC.pending.length >= 4) { dcError('Up to 4 files per message'); break; }
      var f = files[i];
      try {
        var isPhoto = f.type.indexOf('image/') === 0 && f.type !== 'image/gif';
        DC.pending.push(await (isPhoto ? dcShrink(f) : dcRead(f)));
      } catch (e) { dcError(e.message); }
    }
    dcRenderPending();
  }
  function dcRenderPending() {
    var box = document.getElementById('dc-pending');
    box.style.display = DC.pending.length ? 'flex' : 'none';
    box.innerHTML = DC.pending.map(function(p, i) {
      return '<div class="relative flex items-center gap-2 bg-gray-100 rounded-lg pl-1 pr-7 py-1 max-w-[14rem]">' +
        (p.preview ? '<img src="' + p.preview + '" class="w-10 h-10 rounded object-cover" alt="">' : '<i class="fas fa-file text-gray-400 px-2"></i>') +
        '<span class="text-xs truncate">' + escHtml(p.filename) + '<br><span class="text-gray-400">' + dcSize(p.size) + '</span></span>' +
        '<button type="button" onclick="dcRemovePending(' + i + ')" class="absolute top-1 right-1 w-5 h-5 text-gray-400 hover:text-red-600" aria-label="Remove attachment"><i class="fas fa-times text-xs"></i></button></div>';
    }).join('');
  }
  function dcRemovePending(i) { DC.pending.splice(i, 1); dcRenderPending(); }

  function dcGrow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }
  // Enter sends on a keyboard; Shift+Enter is a new line. Phones keep Enter as a new line.
  function dcKey(e) {
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); dcSend(); }
  }

  async function dcSend() {
    if (DC.sending || !DC.cfg) return;
    var t = document.getElementById('dc-text');
    var body = t.value.trim();
    if (!body && !DC.pending.length) return;
    DC.sending = true;
    var btn = document.getElementById('dc-send-btn');
    btn.disabled = true;
    dcError('');
    try {
      await axios.post(DC.cfg.sendUrl, {
        body: body,
        attachments: DC.pending.map(function(p) { return { filename: p.filename, mime: p.mime, data: p.data }; })
      });
      t.value = ''; dcGrow(t);
      DC.pending = []; dcRenderPending();
      await dcPoll(false);
      if (DC.cfg.onSent) DC.cfg.onSent();
    } catch (e) {
      dcError((e.response && e.response.data && e.response.data.error) || 'Message not sent. Check the connection and try again.');
    } finally {
      DC.sending = false; btn.disabled = false;
    }
  }
</script>
`
