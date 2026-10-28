import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'
import { dispatchComposerHtml, DISPATCH_CHAT_SCRIPT } from '../utils/dispatchChat'

// Office end of the dispatch chat. Left: every active driver (plus anyone who
// has written in), newest conversation first, with unread counts. Right: the
// selected conversation. On a phone the two panes take turns.

export function renderDispatch(): string {
  return layout('Dispatch', employeePageWrapper('dispatch', 'Dispatch', `
    <style>
      /* Phone: list and conversation take turns. Done in CSS because Tailwind's
         CDN build lets "flex" beat "hidden" when both are on an element. */
      @media (max-width: 1023px) {
        #dp-wrap.dp-chatting #dp-list-pane { display: none; }
        #dp-wrap:not(.dp-chatting) #dp-chat-pane { display: none; }
      }
    </style>
    <div id="dp-wrap" class="grid lg:grid-cols-[320px_1fr] gap-4" style="height: calc(100vh - 130px); min-height: 480px;">
      <!-- Conversations -->
      <div id="dp-list-pane" class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-0">
        <div class="p-3 border-b border-gray-100">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
            <input id="dp-search" oninput="renderThreads()" placeholder="Search drivers..." class="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none" aria-label="Search drivers">
          </div>
        </div>
        <div id="dp-threads" class="flex-1 overflow-y-auto divide-y divide-gray-50">
          <div class="p-6 text-center text-gray-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
        </div>
      </div>

      <!-- Conversation -->
      <div id="dp-chat-pane" class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-0">
        <div id="dp-chat-empty" class="flex-1 flex items-center justify-center text-center text-gray-400 p-6">
          <div><i class="fas fa-headset text-4xl mb-3 text-gray-300"></i><p class="text-sm">Pick a driver to read and answer their messages.</p></div>
        </div>
        <div id="dp-chat" class="flex-1 flex-col min-h-0" style="display:none;">
          <div class="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-3">
            <button onclick="backToList()" class="lg:hidden w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Back to conversations"><i class="fas fa-arrow-left"></i></button>
            <div class="w-9 h-9 rounded-full bg-green-50 text-rc-green flex items-center justify-center font-bold text-sm" id="dp-avatar"></div>
            <div class="min-w-0 flex-1">
              <div class="font-bold text-gray-800 text-sm truncate" id="dp-name"></div>
              <div class="text-xs text-gray-400" id="dp-sub"></div>
            </div>
            <a id="dp-call" href="#" class="px-3 py-1.5 rounded-lg text-sm font-semibold text-rc-green hover:bg-green-50" style="display:none;"><i class="fas fa-phone mr-1"></i><span class="hidden sm:inline">Call</span></a>
          </div>
          ${dispatchComposerHtml()}
        </div>
      </div>
    </div>

    ${DISPATCH_CHAT_SCRIPT}
    <script>
      var threads = [];
      var threadTimer = null;
      function stopThreadPolling() { if (threadTimer) clearInterval(threadTimer); threadTimer = null; }
      var activeDriver = null;

      function initials(name) { return (name || '?').split(' ').map(function(p) { return p.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
      function ago(s) {
        if (!s) return '';
        var d = new Date(String(s).replace(' ', 'T') + 'Z'), mins = Math.round((Date.now() - d) / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return mins + 'm';
        if (mins < 1440) return Math.round(mins / 60) + 'h';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }

      async function loadThreads() {
        try {
          var res = await axios.get('/api/dispatch/threads');
          threads = res.data.threads || [];
          renderThreads();
        } catch (e) {
          if (e.response && e.response.status === 403) {
            stopThreadPolling();
            document.getElementById('dp-threads').innerHTML = '<div class="p-6 text-center text-gray-500 text-sm"><i class="fas fa-lock text-2xl text-gray-300 mb-2 block"></i>Dispatch is answered by admins and managers.</div>';
            return;
          }
          if (!threads.length) document.getElementById('dp-threads').innerHTML = '<div class="p-6 text-center text-red-500 text-sm">Could not load conversations. <button class="underline" onclick="loadThreads()">Retry</button></div>';
        }
      }

      function renderThreads() {
        var q = (document.getElementById('dp-search').value || '').toLowerCase();
        var list = threads.filter(function(t) { return !q || (t.driver_name || '').toLowerCase().indexOf(q) >= 0; });
        var box = document.getElementById('dp-threads');
        if (!list.length) { box.innerHTML = '<div class="p-6 text-center text-gray-400 text-sm">' + (q ? 'No driver matches' : 'No drivers yet') + '</div>'; return; }
        box.innerHTML = list.map(function(t) {
          var active = activeDriver === t.driver_id;
          var unread = active ? 0 : (t.unread || 0);
          var preview = t.last_id
            ? (t.last_kind === 'dispatch' ? 'You: ' : t.last_kind === 'system' ? '' : '') + (t.last_body || (t.last_files ? 'Sent ' + t.last_files + ' file' + (t.last_files > 1 ? 's' : '') : ''))
            : 'No messages yet';
          var dot = t.driver_status === 'on_road' ? 'bg-green-500' : 'bg-gray-300';
          return '<button type="button" onclick="openThread(' + t.driver_id + ')" class="w-full text-left px-3 py-3 flex items-center gap-3 ' + (active ? 'bg-green-50' : 'hover:bg-gray-50') + '">' +
            '<div class="relative shrink-0"><div class="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">' + escHtml(initials(t.driver_name)) + '</div>' +
              '<span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ' + dot + '" title="' + (t.driver_status === 'on_road' ? 'On road' : 'At yard / idle') + '"></span></div>' +
            '<div class="min-w-0 flex-1">' +
              '<div class="flex items-center justify-between gap-2"><span class="text-sm truncate ' + (unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800') + '">' + escHtml(t.driver_name) + '</span>' +
                '<span class="text-[11px] text-gray-400 shrink-0">' + ago(t.last_at) + '</span></div>' +
              '<div class="flex items-center justify-between gap-2"><span class="text-xs truncate ' + (unread ? 'text-gray-700' : 'text-gray-400') + '">' + (t.last_kind === 'system' ? '<i class="fas fa-circle-info text-amber-500 mr-1"></i>' : '') + escHtml(preview) + '</span>' +
                (unread ? '<span class="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">' + unread + '</span>' : '') + '</div>' +
            '</div></button>';
        }).join('');
      }

      function openThread(id) {
        var t = threads.find(function(x) { return x.driver_id === id; });
        activeDriver = id;
        document.getElementById('dp-chat-empty').style.display = 'none';
        document.getElementById('dp-chat').style.display = 'flex';
        document.getElementById('dp-name').textContent = t ? t.driver_name : 'Driver';
        document.getElementById('dp-avatar').textContent = initials(t ? t.driver_name : '');
        document.getElementById('dp-sub').textContent = t ? (t.driver_status === 'on_road' ? 'On the road' : 'At the yard') + ' · ' + (t.role || 'driver').replace('_', ' ') : '';
        var call = document.getElementById('dp-call');
        if (t && t.phone) { call.href = 'tel:' + t.phone; call.style.display = ''; } else { call.style.display = 'none'; }
        document.getElementById('dp-wrap').classList.add('dp-chatting');
        history.replaceState(null, '', '/employee/dispatch?driver=' + id);
        dcStart({
          threadUrl: '/api/dispatch/threads/' + id,
          sendUrl: '/api/dispatch/threads/' + id,
          mine: 'dispatch',
          emptyText: 'No messages yet. Say hello to start the conversation.',
          onLoaded: function() { if (t && t.unread) { t.unread = 0; renderThreads(); if (window.refreshDispatchBadge) refreshDispatchBadge(); } },
          onSent: loadThreads
        });
        renderThreads();
        if (window.innerWidth >= 1024) setTimeout(function() { document.getElementById('dc-text').focus(); }, 50);
      }

      function backToList() {
        dcStop();
        activeDriver = null;
        document.getElementById('dp-wrap').classList.remove('dp-chatting');
        history.replaceState(null, '', '/employee/dispatch');
        loadThreads();
      }

      (function initDispatch() {
        if (typeof axios === 'undefined' || typeof escHtml === 'undefined') { setTimeout(initDispatch, 300); return; }
        loadThreads().then(function() {
          var d = parseInt(new URLSearchParams(location.search).get('driver') || '', 10);
          if (d) openThread(d);
        });
        threadTimer = setInterval(function() { if (!document.hidden) loadThreads(); }, 10000);
      })();
    </script>
  `))
}
