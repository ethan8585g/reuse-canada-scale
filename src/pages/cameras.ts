import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

// Cameras module. Every tile polls /api/cameras/:id/frame; that read is also
// what tells the scale-bridge relay somebody is watching, so a camera nobody
// looks at uploads nothing. On the scale-house Mac itself the page reads
// frames straight from the local bridge instead, which is much faster.
// See src/routes/cameras.ts for the relay side.

export function renderCameras(): string {
  return layout('Cameras', employeePageWrapper('cameras', 'Cameras', `
    <style>
      .cam-tile-img { width: 100%; height: 100%; object-fit: contain; background: #000; }
      #cam-grid.cam-wall { background: #000; padding: 8px; gap: 8px; overflow: auto; grid-auto-rows: max-content; align-content: start; }
      #cam-grid.cam-wall .cam-tile { border-color: #222; background: #000; color: #fff; }
      #cam-grid.cam-wall .cam-tile-cap { color: #fff; }
      @media (min-width: 640px) { #cam-grid.cam-wall { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (min-width: 1280px) { #cam-grid.cam-wall { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    </style>

    <div id="relay-banner" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm" style="display:none;" role="status"></div>

    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div id="cam-groups" class="flex flex-wrap gap-2" role="group" aria-label="Filter cameras by location"></div>
      <div class="flex items-center gap-2">
        <span id="cam-count" class="text-xs text-gray-400"></span>
        <button type="button" onclick="enterWall()" class="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"><i class="fas fa-tv mr-1"></i> Wall mode</button>
      </div>
    </div>

    <div id="cam-grid" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div class="col-span-full p-10 text-center text-gray-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Loading cameras...</div>
    </div>

    <p class="text-xs text-gray-400 mt-4 leading-relaxed">Pictures refresh about every 2 seconds in the grid and every second when you open a camera. They come from the scale-house computer, which must be on and awake.</p>

    <!-- Focused view -->
    <div id="cam-focus" class="fixed inset-0 z-50 bg-black/95 text-white flex-col" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="cf-title">
      <div class="flex items-center gap-2 px-3 sm:px-5 py-3 border-b border-white/10">
        <button type="button" onclick="focusStep(-1)" class="w-9 h-9 rounded-lg hover:bg-white/10" aria-label="Previous camera"><i class="fas fa-chevron-left"></i></button>
        <div class="min-w-0 flex-1">
          <div id="cf-title" class="font-bold truncate"></div>
          <div id="cf-status" class="text-xs text-white/60 truncate"></div>
        </div>
        <button type="button" onclick="focusStep(1)" class="w-9 h-9 rounded-lg hover:bg-white/10" aria-label="Next camera"><i class="fas fa-chevron-right"></i></button>
        <button type="button" onclick="savePicture()" class="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold"><i class="fas fa-download sm:mr-1"></i><span class="hidden sm:inline"> Save picture</span></button>
        <button type="button" onclick="focusFullscreen()" class="w-9 h-9 rounded-lg hover:bg-white/10" aria-label="Full screen"><i class="fas fa-expand"></i></button>
        <button type="button" id="cf-edit" onclick="editFocused()" class="w-9 h-9 rounded-lg hover:bg-white/10" aria-label="Camera settings" style="display:none;"><i class="fas fa-pen"></i></button>
        <button type="button" onclick="closeFocus()" class="w-9 h-9 rounded-lg hover:bg-white/10" aria-label="Close"><i class="fas fa-times"></i></button>
      </div>
      <div id="cf-stage" class="flex-1 min-h-0 relative flex items-center justify-center p-2">
        <img id="cf-img" alt="" class="max-w-full max-h-full object-contain" crossorigin="anonymous">
        <div id="cf-note" class="absolute inset-0 flex items-center justify-center text-sm text-white/60 p-6 text-center pointer-events-none"></div>
      </div>
    </div>

    <!-- Add / edit -->
    <div id="cam-modal" class="fixed inset-0 z-50 bg-black/50 items-center justify-center p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="cm-title">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="cm-title" class="font-bold text-gray-800">Add a camera</h2>
          <button type="button" onclick="closeCamModal()" class="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Close"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label for="cm-name" class="block text-xs font-semibold text-gray-600 mb-1">Name</label>
            <input id="cm-name" maxlength="60" placeholder="e.g. Shredder infeed" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
          </div>
          <div>
            <label for="cm-location" class="block text-xs font-semibold text-gray-600 mb-1">Location</label>
            <input id="cm-location" maxlength="40" list="cm-locations" placeholder="Processing plant" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
            <datalist id="cm-locations"></datalist>
            <p class="text-[11px] text-gray-400 mt-1">Cameras are grouped by location on the page.</p>
          </div>
          <div>
            <div class="block text-xs font-semibold text-gray-600 mb-1">Camera type</div>
            <div class="grid grid-cols-3 gap-2" role="group" aria-label="Camera type">
              <button type="button" data-kind="reolink" onclick="setKind(&quot;reolink&quot;)" class="cm-kind px-2 py-2 rounded-lg border-2 text-xs font-semibold">Reolink</button>
              <button type="button" data-kind="agent_dvr" onclick="setKind(&quot;agent_dvr&quot;)" class="cm-kind px-2 py-2 rounded-lg border-2 text-xs font-semibold">Agent DVR</button>
              <button type="button" data-kind="snapshot_url" onclick="setKind(&quot;snapshot_url&quot;)" class="cm-kind px-2 py-2 rounded-lg border-2 text-xs font-semibold">Other camera</button>
            </div>
          </div>

          <div id="cm-reolink" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <label for="cm-host" class="block text-xs font-semibold text-gray-600 mb-1">IP address</label>
                <input id="cm-host" placeholder="192.168.1.50" inputmode="decimal" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
              </div>
              <div>
                <label for="cm-channel" class="block text-xs font-semibold text-gray-600 mb-1">Channel</label>
                <input id="cm-channel" type="number" min="0" max="63" value="0" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
              </div>
            </div>
            <p class="text-[11px] text-gray-400 -mt-1">Channel stays 0 for a single camera. Only change it for a camera plugged into a Reolink NVR (first camera = 0).</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="cm-user" class="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                <input id="cm-user" value="admin" autocomplete="off" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
              </div>
              <div>
                <label for="cm-pass" class="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <input id="cm-pass" type="password" autocomplete="new-password" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
              </div>
            </div>
            <details class="text-xs text-gray-500">
              <summary class="cursor-pointer font-semibold">Advanced</summary>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label for="cm-proto" class="block text-xs font-semibold text-gray-600 mb-1">Connection</label>
                  <select id="cm-proto" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="">Automatic</option><option value="1">HTTPS</option><option value="0">HTTP</option>
                  </select>
                </div>
                <div>
                  <label for="cm-port" class="block text-xs font-semibold text-gray-600 mb-1">Port</label>
                  <input id="cm-port" type="number" placeholder="default" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
                </div>
              </div>
            </details>
            <p class="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">Find the IP in the Reolink app under the camera's <b>Settings &rarr; Network</b>. If it says HTTP/HTTPS is off, turn on <b>HTTPS</b> under <b>Network &rarr; Advanced &rarr; Server settings</b>.</p>
          </div>

          <div id="cm-agent" class="space-y-2" style="display:none;">
            <div class="text-xs font-semibold text-gray-600">Agent DVR camera on the scale-house computer</div>
            <div id="cm-dvr-list" class="flex flex-wrap gap-2"></div>
            <input type="hidden" id="cm-oid">
          </div>

          <div id="cm-url" class="space-y-3" style="display:none;">
            <div>
              <label for="cm-snap" class="block text-xs font-semibold text-gray-600 mb-1">Snapshot address (JPEG)</label>
              <input id="cm-snap" placeholder="http://192.168.1.60/snapshot.jpg" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="cm-user2" class="block text-xs font-semibold text-gray-600 mb-1">Username (optional)</label>
                <input id="cm-user2" autocomplete="off" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
              </div>
              <div>
                <label for="cm-pass2" class="block text-xs font-semibold text-gray-600 mb-1">Password (optional)</label>
                <input id="cm-pass2" type="password" autocomplete="new-password" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none">
              </div>
            </div>
          </div>

          <div>
            <label for="cm-rotate" class="block text-xs font-semibold text-gray-600 mb-1">Picture rotation</label>
            <select id="cm-rotate" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="0">None</option><option value="90">90&deg; clockwise</option><option value="180">Upside down (180&deg;)</option><option value="270">90&deg; counter-clockwise</option>
            </select>
          </div>

          <div id="cm-error" class="text-sm text-red-600 font-semibold" role="alert"></div>
        </div>
        <div class="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex items-center gap-2">
          <button type="button" id="cm-remove" onclick="removeCamera()" class="px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50" style="display:none;"><i class="fas fa-trash mr-1"></i> Remove</button>
          <div class="flex-1"></div>
          <button type="button" onclick="closeCamModal()" class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="button" id="cm-save" onclick="saveCamera()" class="px-4 py-2 rounded-lg text-sm font-semibold bg-rc-green text-white hover:opacity-90">Save camera</button>
        </div>
      </div>
    </div>

    <script>
      var cams = [];
      var relay = { age_seconds: null };
      var camGroup = 'all';
      var canEdit = false;
      var tilePollers = {};
      var focusId = null, focusTimer = null, focusGen = 0;
      var editId = null, editKind = 'reolink';
      var localBridge = null;   // set when this computer runs the scale-bridge relay
      var localFail = {};       // camera id -> true while the local bridge cannot get a picture
      var BRIDGE = localStorage.getItem('scale_bridge_url') || 'http://localhost:5555';

      function camVisible() { return cams.filter(function(c) { return camGroup === 'all' || (c.location || 'Other') === camGroup; }); }
      function camById(id) { return cams.find(function(c) { return c.id === id; }) || null; }
      function relayDown() { return relay.age_seconds === null || relay.age_seconds > 120; }

      function ageText(s) {
        if (s === null || s === undefined) return '';
        if (s < 60) return s + ' s ago';
        if (s < 3600) return Math.round(s / 60) + ' min ago';
        return Math.round(s / 3600) + ' h ago';
      }
      // One line saying what the picture is. "fresh" means the relay has
      // uploaded for this viewer recently.
      function statusLine(c, frameAge) {
        if (localBridge) return localFail[c.id]
          ? { dot: 'bg-red-500', text: 'Offline: ' + (c.last_error || 'not answering') }
          : { dot: 'bg-green-500', text: 'Live (this computer)' };
        if (c.status === 'offline') return { dot: 'bg-red-500', text: 'Offline: ' + (c.last_error || 'camera did not answer') };
        if (relayDown()) return { dot: 'bg-gray-400', text: 'Waiting for the scale-house computer' };
        if (frameAge !== null && frameAge !== undefined && frameAge <= 10) return { dot: 'bg-green-500', text: 'Live' };
        if (c.status === 'live') return { dot: 'bg-amber-400', text: frameAge !== null && frameAge !== undefined ? 'Starting... last picture ' + ageText(frameAge) : 'Starting...' };
        return { dot: 'bg-gray-400', text: 'Checking camera...' };
      }

      async function loadCams() {
        try {
          var res = await axios.get('/api/cameras');
          cams = res.data.cameras || [];
          relay = res.data.relay || relay;
          renderBanner();
          renderGroups();
          renderGrid();
        } catch (e) {
          var st = e.response && e.response.status;
          document.getElementById('cam-grid').innerHTML = '<div class="col-span-full p-10 text-center text-sm ' + (st === 403 ? 'text-gray-500' : 'text-red-500') + '">' +
            (st === 403 ? '<i class="fas fa-lock text-2xl text-gray-300 mb-2 block"></i>Cameras are available to admins, managers and yard operators.' : 'Could not load cameras. <button class="underline" onclick="loadCams()">Retry</button>') + '</div>';
        }
      }

      function renderBanner() {
        var b = document.getElementById('relay-banner');
        if (localBridge || !relayDown() || !cams.length) { b.style.display = 'none'; return; }
        b.innerHTML = '<i class="fas fa-plug-circle-exclamation mr-2"></i><b>Feeds are paused.</b> ' +
          (relay.age_seconds === null
            ? 'The scale-house computer has not connected yet. Its scale-bridge needs the camera relay turned on.'
            : 'The scale-house computer last checked in ' + ageText(relay.age_seconds) + '. It may be off, asleep, or the scale-bridge is not running.');
        b.style.display = '';
      }

      function renderGroups() {
        var groups = [];
        cams.forEach(function(c) { var g = c.location || 'Other'; if (groups.indexOf(g) < 0) groups.push(g); });
        if (camGroup !== 'all' && groups.indexOf(camGroup) < 0) camGroup = 'all';
        var pill = function(val, label, n) {
          var on = camGroup === val;
          return '<button type="button" aria-pressed="' + on + '" data-group="' + escHtml(val) + '" onclick="setGroup(this.dataset.group)" class="px-3 py-1.5 rounded-full text-sm font-semibold border ' +
            (on ? 'bg-rc-green text-white border-rc-green' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50') + '">' + escHtml(label) + ' <span class="opacity-70 text-xs">' + n + '</span></button>';
        };
        document.getElementById('cam-groups').innerHTML = (groups.length > 1 ? pill('all', 'All', cams.length) : '') +
          groups.map(function(g) { return pill(g, g, cams.filter(function(c) { return (c.location || 'Other') === g; }).length); }).join('');
        document.getElementById('cam-count').textContent = cams.length + ' camera' + (cams.length === 1 ? '' : 's');
        var dl = document.getElementById('cm-locations');
        var opts = ['Scale', 'Processing plant'];
        groups.forEach(function(g) { if (opts.indexOf(g) < 0 && g !== 'Other') opts.push(g); });
        dl.innerHTML = opts.map(function(o) { return '<option value="' + escHtml(o) + '">'; }).join('');
      }
      function setGroup(g) { camGroup = g; renderGroups(); renderGrid(); }

      function stopTiles() { Object.keys(tilePollers).forEach(function(k) { clearTimeout(tilePollers[k].timer); tilePollers[k].stopped = true; }); tilePollers = {}; }

      function renderGrid() {
        stopTiles();
        var grid = document.getElementById('cam-grid');
        var list = camVisible();
        var addTile = canEdit && !grid.classList.contains('cam-wall')
          ? '<button type="button" onclick="openCamModal(null)" class="rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-rc-green hover:text-rc-green flex flex-col items-center justify-center gap-2 min-h-[180px]"><i class="fas fa-plus text-2xl"></i><span class="text-sm font-semibold">Add camera</span></button>'
          : '';
        if (!list.length) {
          grid.innerHTML = '<div class="col-span-full p-10 text-center text-gray-400 text-sm"><i class="fas fa-video-slash text-3xl text-gray-300 mb-2 block"></i>No cameras yet.</div>' + addTile;
          return;
        }
        grid.innerHTML = list.map(function(c) {
          var s = statusLine(c, c.frame_age);
          return '<div class="cam-tile rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">' +
            '<button type="button" onclick="openFocus(' + c.id + ')" class="block w-full relative bg-black" style="aspect-ratio: 16 / 9;" aria-label="Open ' + escHtml(c.name) + '">' +
              '<img id="tile-img-' + c.id + '" alt="" class="cam-tile-img" style="display:none;">' +
              '<span id="tile-note-' + c.id + '" class="absolute inset-0 flex items-center justify-center text-xs text-white/60 p-4 text-center"><i class="fas fa-spinner fa-spin mr-2"></i>Connecting...</span>' +
            '</button>' +
            '<div class="cam-tile-cap px-3 py-2 flex items-center gap-2">' +
              '<span id="tile-dot-' + c.id + '" class="w-2.5 h-2.5 rounded-full shrink-0 ' + s.dot + '"></span>' +
              '<div class="min-w-0 flex-1"><div class="text-sm font-semibold truncate">' + escHtml(c.name) + '</div>' +
              '<div id="tile-status-' + c.id + '" class="text-[11px] text-gray-400 truncate">' + escHtml(s.text) + '</div></div>' +
              (canEdit ? '<button type="button" onclick="openCamModal(' + c.id + ')" class="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100" aria-label="Settings for ' + escHtml(c.name) + '"><i class="fas fa-pen text-xs"></i></button>' : '') +
            '</div></div>';
        }).join('') + addTile;
        if (focusId === null && !document.hidden) list.forEach(function(c) { startTile(c.id); });
      }

      // Where a frame comes from. Local bridge: a URL straight to the image.
      // Otherwise: the relay's latest upload via the API.
      async function fetchFrame(id, size) {
        if (localBridge) return { src: BRIDGE + '/cams/' + id + '/snapshot?size=' + size + '&t=' + Date.now(), local: true };
        var res = await axios.get('/api/cameras/' + id + '/frame?size=' + size, { timeout: 10000 });
        var c = camById(id);
        if (c) { c.status = res.data.status; c.last_error = res.data.error; c.frame_age = res.data.age_seconds; }
        // An old picture under an "Offline" label reads as live; show the reason instead.
        return { src: res.data.status === 'offline' ? null : res.data.image, age: res.data.age_seconds, local: false };
      }

      function setTileStatus(id) {
        var c = camById(id); if (!c) return;
        var s = statusLine(c, c.frame_age);
        var dot = document.getElementById('tile-dot-' + id), txt = document.getElementById('tile-status-' + id);
        if (dot) dot.className = 'w-2.5 h-2.5 rounded-full shrink-0 ' + s.dot;
        if (txt) txt.textContent = s.text;
      }

      function startTile(id) {
        var p = { stopped: false, timer: 0, lastSrc: null };
        tilePollers[id] = p;
        var img = document.getElementById('tile-img-' + id), note = document.getElementById('tile-note-' + id);
        var tick = async function() {
          if (p.stopped) return;
          var delay = localBridge ? 1000 : 2000;
          try {
            var f = await fetchFrame(id, 'thumb');
            if (p.stopped) return;
            if (f.src && f.src !== p.lastSrc) {
              p.lastSrc = f.src;
              var good = true;
              if (f.local) {
                good = await new Promise(function(ok) { img.onload = function() { ok(true); }; img.onerror = function() { ok(false); }; img.src = f.src; });
                p.lastSrc = null;
              } else img.src = f.src;
              img.style.display = good ? '' : 'none'; note.style.display = good ? 'none' : '';
              if (f.local) localFail[id] = !good;
              if (!good) { var cc = camById(id); note.textContent = (cc && cc.last_error) || 'This camera is not answering.'; delay = 4000; }
            } else if (!f.src) {
              var c = camById(id);
              note.style.display = ''; img.style.display = 'none';
              note.textContent = c && c.status === 'offline' ? (c.last_error || 'Camera offline') : relayDown() ? 'Waiting for the scale-house computer' : 'Waiting for the first picture...';
            }
            setTileStatus(id);
          } catch (e) { delay = 5000; }
          if (!p.stopped) p.timer = setTimeout(tick, delay);
        };
        tick();
      }

      // ── Focused view ──
      function openFocus(id) {
        focusId = id;
        stopTiles();
        var el = document.getElementById('cam-focus');
        el.style.display = 'flex';
        document.getElementById('cf-edit').style.display = canEdit ? '' : 'none';
        showFocus();
      }
      function showFocus() {
        var c = camById(focusId); if (!c) { closeFocus(); return; }
        clearTimeout(focusTimer);
        var gen = ++focusGen;
        document.getElementById('cf-title').textContent = c.name + (c.location ? ' · ' + c.location : '');
        var img = document.getElementById('cf-img'), note = document.getElementById('cf-note');
        img.removeAttribute('src'); img.style.display = 'none';
        note.style.display = ''; note.textContent = 'Connecting...';
        var last = null;
        var tick = async function() {
          if (gen !== focusGen) return;
          var delay = localBridge ? 400 : 1000;
          try {
            var f = await fetchFrame(focusId, 'full');
            if (gen !== focusGen) return;
            if (f.src && f.src !== last) {
              last = f.src;
              var good = true;
              if (f.local) { good = await new Promise(function(ok) { img.onload = function() { ok(true); }; img.onerror = function() { ok(false); }; img.src = f.src; }); last = null; }
              else img.src = f.src;
              img.style.display = good ? '' : 'none'; note.style.display = good ? 'none' : '';
              if (f.local) localFail[focusId] = !good;
              if (!good) { note.textContent = c.last_error || 'This camera is not answering.'; delay = 4000; }
            } else if (!f.src) {
              note.style.display = ''; img.style.display = 'none';
              note.textContent = c.status === 'offline' ? (c.last_error || 'Camera offline') : relayDown() ? 'Waiting for the scale-house computer' : 'Waiting for the first picture...';
            }
            var s = statusLine(c, c.frame_age);
            document.getElementById('cf-status').textContent = s.text + (!localBridge && c.width ? ' · ' + c.width + 'x' + c.height + ' camera' : '');
          } catch (e) { delay = 4000; }
          if (gen === focusGen) focusTimer = setTimeout(tick, delay);
        };
        tick();
      }
      function focusStep(d) {
        var list = camVisible(); if (!list.length) return;
        var i = list.findIndex(function(c) { return c.id === focusId; });
        focusId = list[(i + d + list.length) % list.length].id;
        showFocus();
      }
      function closeFocus() {
        focusGen++; clearTimeout(focusTimer); focusId = null;
        if (document.fullscreenElement) document.exitFullscreen().catch(function() {});
        document.getElementById('cam-focus').style.display = 'none';
        renderGrid();
      }
      function focusFullscreen() {
        var el = document.getElementById('cam-focus');
        if (document.fullscreenElement) document.exitFullscreen().catch(function() {});
        else if (el.requestFullscreen) el.requestFullscreen().catch(function() {});
      }
      function editFocused() { var id = focusId; closeFocus(); openCamModal(id); }
      function savePicture() {
        var img = document.getElementById('cf-img'), c = camById(focusId);
        if (!img.src || !img.naturalWidth || !c) return;
        var stamp = new Date().toISOString().slice(0, 19).split(':').join('-').replace('T', '_');
        var name = (c.name || 'camera').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '_' + stamp + '.jpg';
        var href = img.src;
        if (href.indexOf('data:') !== 0) {
          try { var cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); href = cv.toDataURL('image/jpeg', 0.92); } catch (e) { return; }
        }
        var a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      }

      // ── Wall mode: the grid on its own, full screen, for an office TV ──
      function enterWall() {
        var g = document.getElementById('cam-grid');
        if (!g.requestFullscreen) return;
        g.classList.add('cam-wall');
        renderGrid();
        g.requestFullscreen().catch(function() { g.classList.remove('cam-wall'); renderGrid(); });
      }
      document.addEventListener('fullscreenchange', function() {
        var g = document.getElementById('cam-grid');
        if (!document.fullscreenElement && g.classList.contains('cam-wall')) { g.classList.remove('cam-wall'); renderGrid(); }
      });

      // ── Add / edit ──
      function setKind(k) {
        editKind = k;
        document.querySelectorAll('.cm-kind').forEach(function(b) {
          var on = b.dataset.kind === k;
          b.className = 'cm-kind px-2 py-2 rounded-lg border-2 text-xs font-semibold ' + (on ? 'border-rc-green bg-green-50 text-rc-green' : 'border-gray-200 text-gray-600 hover:bg-gray-50');
          b.setAttribute('aria-pressed', on);
        });
        document.getElementById('cm-reolink').style.display = k === 'reolink' ? '' : 'none';
        document.getElementById('cm-agent').style.display = k === 'agent_dvr' ? '' : 'none';
        document.getElementById('cm-url').style.display = k === 'snapshot_url' ? '' : 'none';
        if (k === 'agent_dvr') loadDvrList();
      }
      async function loadDvrList() {
        var box = document.getElementById('cm-dvr-list');
        box.innerHTML = '<span class="text-xs text-gray-400">Loading...</span>';
        try {
          var res = await axios.get('/api/cameras/agentdvr');
          var list = res.data.cameras || [];
          var cur = Number(document.getElementById('cm-oid').value) || 0;
          if (!list.length) { box.innerHTML = '<span class="text-xs text-gray-500">The scale-house computer has not reported any Agent DVR cameras yet.</span>'; return; }
          box.innerHTML = list.map(function(d) {
            var on = d.id === cur;
            return '<button type="button" data-oid="' + d.id + '" data-name="' + escHtml(d.name) + '" onclick="pickDvr(this)" class="px-3 py-1.5 rounded-lg border-2 text-sm font-semibold ' + (on ? 'border-rc-green bg-green-50 text-rc-green' : 'border-gray-200 text-gray-600') + '"><i class="fas fa-video mr-1"></i>' + escHtml(d.name) + '</button>';
          }).join('');
        } catch (e) { box.innerHTML = '<span class="text-xs text-red-600">Could not load the Agent DVR list.</span>'; }
      }
      function pickDvr(btn) {
        document.getElementById('cm-oid').value = btn.dataset.oid;
        var n = document.getElementById('cm-name');
        if (!n.value.trim()) n.value = btn.dataset.name;
        loadDvrList();
      }
      function openCamModal(id) {
        editId = id;
        var c = id ? camById(id) : null;
        document.getElementById('cm-title').textContent = c ? 'Edit ' + c.name : 'Add a camera';
        document.getElementById('cm-name').value = c ? c.name : '';
        document.getElementById('cm-location').value = c ? (c.location || '') : (camGroup !== 'all' ? camGroup : 'Processing plant');
        document.getElementById('cm-host').value = c && c.host ? c.host : '';
        document.getElementById('cm-channel').value = c ? (c.channel || 0) : 0;
        document.getElementById('cm-user').value = c && c.kind === 'reolink' ? (c.username || '') : 'admin';
        document.getElementById('cm-proto').value = c && c.use_https !== null && c.use_https !== undefined ? String(c.use_https) : '';
        document.getElementById('cm-port').value = c && c.port ? c.port : '';
        document.getElementById('cm-snap').value = c && c.snapshot_url ? c.snapshot_url : '';
        document.getElementById('cm-user2').value = c && c.kind === 'snapshot_url' ? (c.username || '') : '';
        document.getElementById('cm-oid').value = c && c.agent_dvr_oid ? c.agent_dvr_oid : '';
        document.getElementById('cm-rotate').value = String(c ? (c.rotate || 0) : 0);
        ['cm-pass', 'cm-pass2'].forEach(function(f) {
          var el = document.getElementById(f);
          el.value = '';
          el.placeholder = c && c.has_password ? 'Leave blank to keep' : '';
        });
        document.getElementById('cm-error').textContent = '';
        document.getElementById('cm-remove').style.display = c ? '' : 'none';
        setKind(c ? c.kind : 'reolink');
        document.getElementById('cam-modal').style.display = 'flex';
        setTimeout(function() { document.getElementById('cm-name').focus(); }, 30);
      }
      function closeCamModal() { document.getElementById('cam-modal').style.display = 'none'; editId = null; }
      async function saveCamera() {
        var v = function(i) { return document.getElementById(i).value; };
        var body = { name: v('cm-name').trim(), location: v('cm-location').trim(), kind: editKind, rotate: Number(v('cm-rotate')) };
        if (editKind === 'reolink') {
          body.host = v('cm-host').trim(); body.channel = Number(v('cm-channel')) || 0;
          body.username = v('cm-user').trim(); body.password = v('cm-pass');
          body.port = v('cm-port'); body.use_https = v('cm-proto') === '' ? null : Number(v('cm-proto'));
        } else if (editKind === 'agent_dvr') {
          body.agent_dvr_oid = Number(v('cm-oid')) || 0;
        } else {
          body.snapshot_url = v('cm-snap').trim(); body.username = v('cm-user2').trim(); body.password = v('cm-pass2');
        }
        var btn = document.getElementById('cm-save'), err = document.getElementById('cm-error');
        err.textContent = ''; btn.disabled = true;
        try {
          if (editId) await axios.put('/api/cameras/' + editId, body);
          else await axios.post('/api/cameras', body);
          closeCamModal();
          await loadCams();
        } catch (e) {
          err.textContent = (e.response && e.response.data && e.response.data.error) || 'Could not save the camera.';
        } finally { btn.disabled = false; }
      }
      async function removeCamera() {
        var c = camById(editId); if (!c) return;
        if (!confirm('Remove ' + c.name + ' from the Cameras page?')) return;
        try { await axios.delete('/api/cameras/' + editId); closeCamModal(); await loadCams(); }
        catch (e) { document.getElementById('cm-error').textContent = 'Could not remove the camera.'; }
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          if (document.getElementById('cam-modal').style.display !== 'none') closeCamModal();
          else if (focusId !== null && !document.fullscreenElement) closeFocus();
        } else if (focusId !== null && document.getElementById('cam-modal').style.display === 'none') {
          if (e.key === 'ArrowLeft') focusStep(-1);
          if (e.key === 'ArrowRight') focusStep(1);
        }
      });
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) { stopTiles(); focusGen++; clearTimeout(focusTimer); }
        else if (focusId !== null) showFocus();
        else renderGrid();
      });

      // Only a station that already uses the scale-bridge (Scale House camera
      // settings are stored on it) checks for one. Probing localhost from any
      // other computer would raise Chrome's local-network permission prompt.
      async function detectLocalBridge() {
        if (!localStorage.getItem('rc_camera_cfg') && !localStorage.getItem('scale_bridge_url')) return;
        try {
          var ctrl = new AbortController(); var t = setTimeout(function() { ctrl.abort(); }, 1500);
          var r = await fetch(BRIDGE + '/status', { signal: ctrl.signal, cache: 'no-store' });
          clearTimeout(t);
          var d = await r.json();
          if (d && d.camera_relay) localBridge = true;
        } catch (e) {}
      }

      (function initCameras() {
        if (typeof axios === 'undefined' || typeof escHtml === 'undefined') { setTimeout(initCameras, 300); return; }
        var role = '';
        try { role = (JSON.parse(localStorage.getItem('rc_session') || '{}').role) || ''; } catch (e) {}
        canEdit = role === 'admin' || role === 'manager';
        if (canEdit) {
          document.getElementById('page-header-actions').innerHTML = '<button type="button" onclick="openCamModal(null)" class="px-3 py-2 rounded-lg bg-rc-green text-white text-sm font-semibold hover:opacity-90"><i class="fas fa-plus mr-1"></i> Add camera</button>';
        }
        detectLocalBridge().then(loadCams);
        setInterval(function() { if (!document.hidden && focusId === null) axios.get('/api/cameras').then(function(r) { cams = r.data.cameras || cams; relay = r.data.relay || relay; renderBanner(); cams.forEach(function(c) { setTileStatus(c.id); }); }).catch(function() {}); }, 30000);
      })();
    </script>
  `))
}
