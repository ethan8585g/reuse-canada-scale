import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderJunkRemovalQuoting(): string {
  return layout('Junk Removal Quoting', employeePageWrapper('junk-removal', 'Junk Removal Quoting', `

  <!-- Tab bar -->
  <div class="flex gap-1 mb-4">
    <button id="tab-chat" onclick="switchTab('chat')"
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white shadow-sm border border-gray-200 text-rc-green transition-all">
      <i class="fas fa-robot"></i> New Quote
    </button>
    <button id="tab-history" onclick="switchTab('history')"
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
      <i class="fas fa-history"></i> Quote History
      <span id="history-count" class="bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full hidden"></span>
    </button>
  </div>

  <!-- ── CHAT PANEL ── -->
  <div id="panel-chat">
  <!-- Full-height chat wrapper -->
  <div class="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
    style="height: calc(100vh - 13rem)">

    <!-- Chat header -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-rc-green rounded-xl flex items-center justify-center">
          <i class="fas fa-robot text-white text-sm"></i>
        </div>
        <div>
          <div class="text-sm font-bold text-gray-800">Junk Removal Estimator</div>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span class="text-xs text-gray-500">Powered by GPT-4o</span>
          </div>
        </div>
      </div>
      <button onclick="newChat()"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all">
        <i class="fas fa-plus"></i> New Chat
      </button>
    </div>

    <!-- Messages area -->
    <div id="chat-messages" class="flex-1 overflow-y-auto px-5 py-5 space-y-4">

      <!-- Welcome bubble -->
      <div class="flex items-start gap-3" id="welcome-msg">
        <div class="w-8 h-8 bg-rc-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <i class="fas fa-robot text-white text-xs"></i>
        </div>
        <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
          <p class="text-sm text-gray-800">Hi! I'm your junk removal estimator. Share the job address and some photos of what needs to be removed, and I'll calculate a full quote — including driving routes from the yard to the job, to the dump, and back.</p>
        </div>
      </div>

    </div>

    <!-- Pending image strip -->
    <div id="pending-strip" class="hidden border-t border-gray-100 bg-gray-50 px-4 py-2 flex-shrink-0">
      <div class="flex items-center gap-2 flex-wrap" id="pending-thumbs"></div>
    </div>

    <!-- Input bar -->
    <div class="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
      <div class="flex items-end gap-2">

        <!-- Attach photos -->
        <button onclick="document.getElementById('chat-file-input').click()"
          id="attach-btn"
          class="relative w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          title="Attach photos">
          <i class="fas fa-camera text-gray-500 text-sm"></i>
          <span id="img-badge"
            class="hidden absolute -top-1 -right-1 w-4 h-4 bg-rc-green text-white text-[10px] font-bold rounded-full flex items-center justify-center"></span>
        </button>
        <input id="chat-file-input" type="file" accept="image/*" multiple class="hidden" onchange="handleChatImages(event)" />

        <!-- Message input -->
        <textarea id="chat-input" rows="1"
          placeholder="Enter job address, describe the junk, or ask a question…"
          class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rc-green/50 focus:border-rc-green/50 leading-relaxed"
          style="max-height: 120px"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}"
          oninput="autoGrow(this)"></textarea>

        <!-- Send -->
        <button onclick="sendMsg()" id="send-btn"
          class="w-10 h-10 bg-rc-green hover:bg-rc-green-light text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          title="Send">
          <i class="fas fa-paper-plane text-sm"></i>
        </button>

      </div>
      <p class="text-[11px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line · Up to 6 photos per message</p>
    </div>

  </div>
  </div> <!-- /panel-chat -->

  <!-- ── HISTORY PANEL ── -->
  <div id="panel-history" class="hidden">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-history text-rc-green"></i>
          <h3 class="font-bold text-gray-800">Quote History</h3>
        </div>
        <span id="history-count-label" class="text-xs text-gray-500"></span>
      </div>
      <div id="history-list" class="divide-y divide-gray-50 max-h-[calc(100vh-16rem)] overflow-y-auto">
        <div class="p-8 text-center text-gray-400">
          <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
          <p class="text-sm">Loading history…</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    // ── State ────────────────────────────────────────────────
    let messages = [];        // [{ role, content, hadImages }]
    let pendingImages = [];   // base64 data URLs for current message
    let isLoading = false;

    // ── Image handling ────────────────────────────────────────
    function handleChatImages(e) { processFiles(e.target.files); }

    function processFiles(files) {
      const room = 6 - pendingImages.length;
      const take = Math.min(files.length, room);
      for (let i = 0; i < take; i++) {
        const f = files[i];
        if (!f.type.startsWith('image/')) continue;
        const r = new FileReader();
        r.onload = ev => resizeImg(ev.target.result, 1024, url => {
          pendingImages.push(url);
          renderPendingStrip();
        });
        r.readAsDataURL(f);
      }
      // reset input so same files can be re-attached
      document.getElementById('chat-file-input').value = '';
    }

    function resizeImg(src, maxDim, cb) {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = src;
    }

    function renderPendingStrip() {
      const strip = document.getElementById('pending-strip');
      const thumbs = document.getElementById('pending-thumbs');
      const badge = document.getElementById('img-badge');

      if (!pendingImages.length) {
        strip.classList.add('hidden');
        badge.classList.add('hidden');
        return;
      }
      strip.classList.remove('hidden');
      badge.classList.remove('hidden');
      badge.textContent = pendingImages.length;

      thumbs.innerHTML = pendingImages.map((src, i) => \`
        <div class="relative group w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          <img src="\${src}" class="w-full h-full object-cover" />
          <button onclick="removePending(\${i})"
            class="absolute inset-0 bg-black/50 text-white text-xs hidden group-hover:flex items-center justify-center rounded-lg">
            <i class="fas fa-times"></i>
          </button>
        </div>
      \`).join('') + \`
        <span class="text-xs text-gray-500 self-center ml-1">\${pendingImages.length} photo\${pendingImages.length > 1 ? 's' : ''} ready to send</span>
      \`;
    }

    function removePending(i) {
      pendingImages.splice(i, 1);
      renderPendingStrip();
    }

    // ── Chat logic ────────────────────────────────────────────
    async function sendMsg() {
      if (isLoading) return;
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text && !pendingImages.length) return;

      const imgs = [...pendingImages];
      pendingImages = [];
      renderPendingStrip();
      input.value = '';
      input.style.height = 'auto';

      // Add user message to history + DOM
      messages.push({ role: 'user', content: text, hadImages: imgs.length || 0 });
      appendUserMsg(text, imgs);

      // Show typing indicator
      isLoading = true;
      toggleSend(true);
      const typingEl = appendTyping();

      try {
        const res = await axios.post('/api/junk-removal/chat', {
          messages: messages.slice(0, -1).concat([{ ...messages[messages.length - 1] }]),
          images: imgs
        });
        typingEl.remove();
        const { reply, quoteData } = res.data;
        messages.push({ role: 'assistant', content: reply });
        appendAIMsg(reply, quoteData);
        if (quoteData) saveQuote(quoteData);
      } catch (err) {
        typingEl.remove();
        const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
        appendAIMsg('⚠️ ' + errMsg, null);
      } finally {
        isLoading = false;
        toggleSend(false);
      }
    }

    // ── DOM helpers ───────────────────────────────────────────
    function appendUserMsg(text, imgs) {
      const box = document.getElementById('chat-messages');
      const d = document.createElement('div');
      d.className = 'flex items-end justify-end gap-2';

      const imgHtml = imgs.length ? \`
        <div class="grid gap-1 mb-1 \${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}">
          \${imgs.map(s => \`<img src="\${s}" class="w-24 h-24 object-cover rounded-xl" />\`).join('')}
        </div>
      \` : '';

      d.innerHTML = \`
        <div class="max-w-xs sm:max-w-sm">
          \${imgHtml}
          \${text ? \`<div class="bg-rc-green text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">\${escHtml(text)}</div>\` : ''}
        </div>
        <div class="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5">
          <i class="fas fa-user text-white text-xs"></i>
        </div>
      \`;
      box.appendChild(d);
      scrollBottom();
    }

    function appendAIMsg(text, quoteData) {
      const box = document.getElementById('chat-messages');

      // Text bubble
      if (text) {
        const d = document.createElement('div');
        d.className = 'flex items-start gap-3';
        d.innerHTML = \`
          <div class="w-8 h-8 bg-rc-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <i class="fas fa-robot text-white text-xs"></i>
          </div>
          <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">\${escHtml(text)}</div>
        \`;
        box.appendChild(d);
      }

      // Quote card
      if (quoteData) {
        const card = buildQuoteCard(quoteData);
        box.appendChild(card);
      }

      scrollBottom();
    }

    function appendTyping() {
      const box = document.getElementById('chat-messages');
      const d = document.createElement('div');
      d.className = 'flex items-start gap-3';
      d.id = 'typing-indicator';
      d.innerHTML = \`
        <div class="w-8 h-8 bg-rc-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <i class="fas fa-robot text-white text-xs"></i>
        </div>
        <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
          <div class="flex gap-1 items-center h-4">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></div>
          </div>
        </div>
      \`;
      box.appendChild(d);
      scrollBottom();
      return d;
    }

    function buildQuoteCard(q) {
      const r = q.route;
      const s = q.summary;
      const diffColor = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' };
      const dc = diffColor[q.difficulty] || diffColor.Medium;
      const fmt = n => n ? '$' + Number(n).toLocaleString() : '—';
      const fmtMin = m => m >= 60 ? Math.floor(m/60)+'h '+(m%60)+'m' : m+'m';

      const legs = [
        { label: 'Yard → Job', from: '13140 24 St NE', leg: r?.yard_to_job },
        { label: 'Job → Dump', from: 'Core Waste Mgmt', leg: r?.job_to_dump },
        { label: 'Dump → Yard', from: '4810 68 Ave NW', leg: r?.dump_to_yard }
      ];
      const totalKm = r ? ((r.yard_to_job?.distance_km||0)+(r.job_to_dump?.distance_km||0)+(r.dump_to_yard?.distance_km||0)).toFixed(1) : null;
      const totalDriveMin = r ? ((r.yard_to_job?.duration_min||0)+(r.job_to_dump?.duration_min||0)+(r.dump_to_yard?.duration_min||0)) : null;
      const routeHtml = \`
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <i class="fas fa-route text-gray-400"></i> Route
            </div>
            \${totalKm ? \`<span class="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">\${totalKm} km total · \${totalDriveMin} min driving</span>\` : '<span class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Address not detected — routing unavailable</span>'}
          </div>
          <div class="grid grid-cols-3 gap-2">
            \${legs.map(({ label, from, leg }) => \`
              <div class="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                <div class="text-[9px] text-gray-500 font-bold uppercase tracking-wide mb-1">\${label}</div>
                <div class="text-base font-extrabold text-gray-800 font-mono">\${leg ? leg.distance_km + ' km' : '—'}</div>
                <div class="text-xs text-gray-500 mt-0.5">\${leg ? leg.duration_min + ' min' : '—'}</div>
                <div class="text-[9px] text-gray-400 mt-0.5 truncate">\${from}</div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;

      const timeHtml = s ? \`
        <div class="flex gap-2 mb-4 text-sm">
          <div class="flex-1 bg-orange-50 rounded-xl p-3 border border-orange-100 text-center">
            <div class="text-[10px] text-orange-500 font-semibold uppercase mb-0.5">Drive Time</div>
            <div class="font-bold text-orange-700">\${fmtMin(s.drive_time_min)}</div>
          </div>
          <div class="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
            <div class="text-[10px] text-blue-500 font-semibold uppercase mb-0.5">Job Time</div>
            <div class="font-bold text-blue-700">\${fmtMin(s.job_time_min)}</div>
          </div>
          <div class="flex-1 bg-green-50 rounded-xl p-3 border border-green-100 text-center">
            <div class="text-[10px] text-green-600 font-semibold uppercase mb-0.5">Total</div>
            <div class="font-bold text-green-700">\${s.total_time_label}</div>
          </div>
        </div>
      \` : '';

      const wrap = document.createElement('div');
      wrap.className = 'ml-11'; // align under AI avatar
      wrap.innerHTML = \`
        <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden max-w-md">
          <!-- Card header -->
          <div class="bg-gradient-to-r from-rc-green-dark to-rc-green px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="fas fa-file-invoice-dollar text-white"></i>
              <span class="text-white font-bold text-sm">Job Quote</span>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full \${dc}">\${q.difficulty || 'Medium'}</span>
          </div>
          <div class="p-4">
            <!-- Route -->
            \${routeHtml}
            <!-- Items + Volume -->
            <div class="mb-3">
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Items / Volume</div>
              <p class="text-sm text-gray-800">\${escHtml(q.items_description || '—')}</p>
              \${q.volume_estimate ? \`<span class="inline-block mt-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">\${q.volume_estimate}</span>\` : ''}
            </div>
            <!-- Notes -->
            \${q.special_notes && q.special_notes !== 'None' ? \`
            <div class="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-800">
              <i class="fas fa-exclamation-triangle mr-1"></i>\${escHtml(q.special_notes)}
            </div>\` : ''}
            <!-- Time breakdown -->
            \${timeHtml}
            <!-- Crew + Pricing breakdown -->
            <div class="border-t border-gray-100 pt-3 space-y-1.5">
              \${s ? \`
              <div class="flex justify-between text-xs text-gray-500">
                <span><i class="fas fa-clock mr-1 text-gray-400"></i>Labour (\${(s.total_time_min/60).toFixed(1)} hrs × $150/hr)</span>
                <span class="font-semibold text-gray-700">$\${Math.round(s.total_time_min/60*150).toLocaleString()}</span>
              </div>\` : ''}
              \${q.weight_tonnes ? \`
              <div class="flex justify-between text-xs text-gray-500">
                <span><i class="fas fa-weight mr-1 text-gray-400"></i>Dump fee (~\${q.weight_tonnes} t × $95/t)</span>
                <span class="font-semibold text-gray-700">$\${Math.round(q.weight_tonnes*95).toLocaleString()}</span>
              </div>\` : ''}
              <div class="flex justify-between items-center pt-1.5 border-t border-gray-100">
                <span class="text-sm text-gray-600"><i class="fas fa-users text-gray-400 mr-1"></i>\${q.crew_size || 2} person crew</span>
                <div class="text-right">
                  <div class="text-xs text-gray-400 mb-0.5">Estimated Total</div>
                  <div class="text-xl font-extrabold text-rc-green font-mono">\${fmt(q.price_estimate_low)} – \${fmt(q.price_estimate_high)}</div>
                </div>
              </div>
            </div>
            \${q.quote_summary ? \`<p class="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-3">\${escHtml(q.quote_summary)}</p>\` : ''}
          </div>
        </div>
      \`;
      return wrap;
    }

    function autoGrow(el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }

    function toggleSend(loading) {
      const btn = document.getElementById('send-btn');
      btn.disabled = loading;
      btn.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin text-sm"></i>'
        : '<i class="fas fa-paper-plane text-sm"></i>';
    }

    function scrollBottom() {
      const box = document.getElementById('chat-messages');
      setTimeout(() => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }), 50);
    }

    function escHtml(s) {
      return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function newChat() {
      messages = [];
      pendingImages = [];
      renderPendingStrip();
      document.getElementById('chat-messages').innerHTML = \`
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-rc-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <i class="fas fa-robot text-white text-xs"></i>
          </div>
          <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm">
            <p class="text-sm text-gray-800">Hi! I'm your junk removal estimator. Share the job address and some photos of what needs to be removed, and I'll calculate a full quote — including driving routes from the yard to the job, to the dump, and back.</p>
          </div>
        </div>
      \`;
    }

    // ── Auto-save quote ───────────────────────────────────────
    let saveQuoteInFlight = false;
    async function saveQuote(quoteData) {
      // Guard: GPT-4o sometimes returns the parsed quote twice (model retry,
      // stream resumption). Without this flag both POST and a duplicate row
      // gets persisted.
      if (saveQuoteInFlight) return;
      saveQuoteInFlight = true;
      try {
        await axios.post('/api/junk-removal/save-quote', quoteData);
      } catch (e) { /* silent — don't interrupt UX */ }
      finally { saveQuoteInFlight = false; }
    }

    // ── Tab switching ─────────────────────────────────────────
    function switchTab(tab) {
      const isChat = tab === 'chat';
      document.getElementById('panel-chat').classList.toggle('hidden', !isChat);
      document.getElementById('panel-history').classList.toggle('hidden', isChat);
      document.getElementById('tab-chat').className = isChat
        ? 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white shadow-sm border border-gray-200 text-rc-green transition-all'
        : 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all';
      document.getElementById('tab-history').className = !isChat
        ? 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white shadow-sm border border-gray-200 text-rc-green transition-all'
        : 'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all';
      if (!isChat) loadHistory();
    }

    // ── History ───────────────────────────────────────────────
    async function loadHistory() {
      const list = document.getElementById('history-list');
      list.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i><p class="text-sm">Loading…</p></div>';
      try {
        const res = await axios.get('/api/junk-removal/history');
        const quotes = res.data.quotes || [];
        document.getElementById('history-count-label').textContent = quotes.length + ' quote' + (quotes.length !== 1 ? 's' : '');
        const badge = document.getElementById('history-count');
        if (quotes.length) { badge.textContent = quotes.length; badge.classList.remove('hidden'); }

        if (!quotes.length) {
          list.innerHTML = '<div class="p-10 text-center text-gray-400"><i class="fas fa-history text-3xl mb-3 block opacity-30"></i><p class="text-sm">No quotes yet — generate one from the New Quote tab.</p></div>';
          return;
        }

        const diffColor = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' };
        const fmt = n => n ? '$' + Number(n).toLocaleString() : '—';

        list.innerHTML = quotes.map(q => {
          const dc = diffColor[q.difficulty] || diffColor.Medium;
          const dateStr = q.created_at ? new Date(q.created_at).toLocaleString('en-CA', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
          const hasRoute = q.route_yard_to_job_km;
          return \`
            <div class="px-5 py-4 hover:bg-gray-50/60 transition-all cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full \${dc}">\${q.difficulty || '—'}</span>
                    <span class="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">\${q.volume_estimate || '—'}</span>
                    \${hasRoute ? \`<span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">\${q.total_distance_km} km · \${q.total_drive_min} min drive</span>\` : ''}
                  </div>
                  <div class="font-semibold text-gray-800 text-sm truncate">\${escHtml(q.address)}</div>
                  <div class="text-xs text-gray-400 mt-0.5">\${dateStr}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-lg font-extrabold text-rc-green font-mono">\${fmt(q.price_estimate_low)}–\${fmt(q.price_estimate_high)}</div>
                  <div class="text-xs text-gray-400">\${q.total_time_label || ''}</div>
                </div>
              </div>
            </div>
            <!-- Expanded detail (hidden by default) -->
            <div class="hidden bg-gray-50 border-t border-b border-gray-100 px-5 py-4 text-sm space-y-3">
              \${hasRoute ? \`
              <div class="grid grid-cols-3 gap-2">
                \${[['Yard → Job', q.route_yard_to_job_km, q.route_yard_to_job_min],
                   ['Job → Dump', q.route_job_to_dump_km, q.route_job_to_dump_min],
                   ['Dump → Yard', q.route_dump_to_yard_km, q.route_dump_to_yard_min]].map(([lbl,km,min]) => \`
                  <div class="bg-white rounded-xl p-2.5 text-center border border-gray-200">
                    <div class="text-[9px] text-gray-500 font-bold uppercase tracking-wide mb-1">\${lbl}</div>
                    <div class="text-base font-extrabold text-gray-800 font-mono">\${km ?? '—'} km</div>
                    <div class="text-xs text-gray-500">\${min ?? '—'} min</div>
                  </div>
                \`).join('')}
              </div>\` : ''}
              <div><span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</span><p class="text-gray-700 mt-0.5">\${escHtml(q.items_description || '—')}</p></div>
              \${q.special_notes && q.special_notes !== 'None' ? \`<div class="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-xs text-yellow-800"><i class="fas fa-exclamation-triangle mr-1"></i>\${escHtml(q.special_notes)}</div>\` : ''}
              \${q.quote_summary ? \`<p class="text-xs text-gray-500 italic">\${escHtml(q.quote_summary)}</p>\` : ''}
              <div class="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-200">
                <span><i class="fas fa-users mr-1 text-gray-400"></i>\${q.crew_size || '—'} crew</span>
                \${q.weight_tonnes ? \`<span><i class="fas fa-weight mr-1 text-gray-400"></i>\${q.weight_tonnes} t</span>\` : ''}
                \${q.total_time_label ? \`<span><i class="fas fa-clock mr-1 text-gray-400"></i>\${q.total_time_label} total</span>\` : ''}
              </div>
            </div>
          \`;
        }).join('');
      } catch (e) {
        list.innerHTML = '<div class="p-8 text-center text-red-400 text-sm">Failed to load history.</div>';
      }
    }

  </script>
`))
}
