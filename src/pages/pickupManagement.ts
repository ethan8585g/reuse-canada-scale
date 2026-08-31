import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderPickupManagement(): string {
  return layout('Pickup Management', employeePageWrapper('pickups', 'Tire Pickup Management', `
    <!-- Filter Bar -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <!-- Status tabs: one tap per status, each showing how many are in it -->
      <div class="flex flex-wrap items-center gap-2" id="status-tabs"></div>

      <div class="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <i class="fas fa-compass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            <select id="filter-region" onchange="setRegionFilter(this.value)" class="appearance-none pl-8 pr-9 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 focus:border-rc-green focus:outline-none cursor-pointer transition-all">
              <option value="">All Regions</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
            </select>
            <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
          </div>

          <div class="inline-flex items-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus-within:border-rc-green focus-within:bg-white transition-all">
            <i class="fas fa-calendar-day text-gray-400 text-xs pl-3"></i>
            <input type="date" id="filter-date" onchange="setDateFilter(this.value)" class="bg-transparent pl-2 pr-1 py-2 text-sm font-semibold text-gray-600 outline-none cursor-pointer" title="Filter by preferred date">
            <button id="clear-date" onclick="setDateFilter('')" style="display:none;" class="px-2 py-2 text-gray-400 hover:text-red-500 transition-colors" title="Clear the date filter">
              <i class="fas fa-times-circle"></i>
            </button>
          </div>

          <button onclick="setDateFilter(new Date().toISOString().split('T')[0])" class="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 btn-press transition-all" title="Show only today's preferred date">
            Today
          </button>

          <button id="clear-filters" onclick="clearFilters()" style="display:none;" class="px-3 py-2 rounded-lg text-rc-green text-sm font-semibold hover:bg-green-50 btn-press transition-all">
            <i class="fas fa-filter-circle-xmark mr-1"></i>Clear filters
          </button>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500"><span id="pickup-count" class="font-semibold text-gray-700">0</span> shown</span>
          <button onclick="reloadPickups()" class="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 btn-press transition-all" title="Re-apply the filters">
            <i class="fas fa-rotate-right mr-1"></i>Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Pickup Cards -->
    <div class="grid gap-4" id="pickups-container">
      <div class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading pickup requests...</div>
    </div>

    <!-- Assign Modal -->
    <div id="assign-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-check mr-2 text-rc-green"></i>Assign Pickup</h3>
          <p class="text-sm text-gray-500 mt-1" id="assign-customer-name"></p>
        </div>
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Assign to Driver</label>
            <select id="assign-employee" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
              <option value="">Select driver...</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date</label>
            <input type="date" id="assign-date" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
          </div>
          <!-- Notify Customer Toggle -->
          <div class="mb-4 bg-blue-50 rounded-xl p-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="assign-notify" class="w-5 h-5 text-rc-green rounded border-gray-300 focus:ring-rc-green">
              <div>
                <span class="font-semibold text-sm text-gray-800">Notify Customer</span>
                <p class="text-xs text-gray-500 mt-0.5">Send automated SMS: "Reuse Canada is scheduled for your pickup on [Date]"</p>
              </div>
            </label>
          </div>
          <div class="flex gap-3">
            <button onclick="submitAssignment()" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all">
              <i class="fas fa-check mr-1"></i> Confirm & Schedule
            </button>
            <button onclick="closeAssignModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <script>
      let currentAssignPickupId = null;

      // Filter state lives here: the status row is a set of buttons now, not a
      // <select>, so loadPickups() no longer reads its value off the DOM.
      let filters = { status: 'pending', region: '', date: '' };
      let statusCounts = { pending: 0, confirmed: 0, scheduled: 0, in_progress: 0, completed: 0, cancelled: 0, all: 0 };

      const statusTabs = [
        { key: '',            label: 'All',         icon: 'fas fa-layer-group',  on: 'bg-gray-900 text-white border-gray-900' },
        { key: 'pending',     label: 'Pending',     icon: 'fas fa-clock',        on: 'bg-amber-500 text-white border-amber-500' },
        { key: 'confirmed',   label: 'Confirmed',   icon: 'fas fa-check',        on: 'bg-blue-600 text-white border-blue-600' },
        { key: 'scheduled',   label: 'Scheduled',   icon: 'fas fa-calendar',     on: 'bg-indigo-600 text-white border-indigo-600' },
        { key: 'in_progress', label: 'In Progress', icon: 'fas fa-truck',        on: 'bg-orange-600 text-white border-orange-600' },
        { key: 'completed',   label: 'Completed',   icon: 'fas fa-check-circle', on: 'bg-green-600 text-white border-green-600' },
        { key: 'cancelled',   label: 'Cancelled',   icon: 'fas fa-ban',          on: 'bg-red-600 text-white border-red-600' }
      ];

      // Every action re-renders only the card it touched, so the loaded rows are
      // kept here and mutated locally. Nothing refetches the (filtered) list on its
      // own - a card that no longer matches the filter stays put until Refresh.
      let pickupsById = {};

      const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'fas fa-clock text-yellow-600', bg: 'border-l-yellow-400' },
        confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'fas fa-check text-blue-600', bg: 'border-l-blue-400' },
        scheduled: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: 'fas fa-calendar text-indigo-600', bg: 'border-l-indigo-400' },
        in_progress: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'fas fa-truck text-orange-600', bg: 'border-l-orange-400' },
        completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: 'fas fa-check-circle text-green-600', bg: 'border-l-green-400' },
        cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'fas fa-ban text-red-600', bg: 'border-l-red-400' }
      };

      const regionLabels = { north: 'North', south: 'South', east: 'East', west: 'West' };
      const regionColors = { north: 'bg-blue-50 text-blue-700', south: 'bg-red-50 text-red-700', east: 'bg-green-50 text-green-700', west: 'bg-purple-50 text-purple-700' };
      const statusLabels = { pending: 'Pending', confirmed: 'Confirmed', scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

      function renderStatusTabs() {
        const el = document.getElementById('status-tabs');
        if (!el) return;
        el.innerHTML = statusTabs.map(t => {
          const active = filters.status === t.key;
          const n = t.key ? (statusCounts[t.key] || 0) : (statusCounts.all || 0);
          const shell = active
            ? t.on + ' shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900' + (n === 0 ? ' opacity-60' : '');
          const badge = active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500';
          return \`<button onclick="setStatusFilter('\${t.key}')" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold btn-press transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rc-green focus-visible:ring-offset-1 \${shell}">
            <i class="\${t.icon} text-xs"></i>\${t.label}
            <span class="\${badge} rounded-full px-1.5 min-w-[20px] text-center text-[11px] font-bold">\${n}</span>
          </button>\`;
        }).join('');
      }

      // Keep the region/date controls and the "Clear filters" shortcut showing
      // exactly what is being filtered on.
      function syncFilterControls() {
        document.getElementById('filter-region').value = filters.region;
        document.getElementById('filter-date').value = filters.date;
        document.getElementById('clear-date').style.display = filters.date ? '' : 'none';
        const anyNarrowed = filters.status !== 'pending' || filters.region || filters.date;
        document.getElementById('clear-filters').style.display = anyNarrowed ? '' : 'none';
      }

      function setStatusFilter(status) {
        filters.status = status;
        renderStatusTabs();
        syncFilterControls();
        loadPickups();
      }

      function setRegionFilter(region) {
        filters.region = region;
        reloadPickups();
      }

      function setDateFilter(date) {
        filters.date = date || '';
        reloadPickups();
      }

      function clearFilters() {
        filters = { status: 'pending', region: '', date: '' };
        reloadPickups();
      }

      // Region and date change what every tab counts, so refresh the badges too.
      function reloadPickups() {
        syncFilterControls();
        loadCounts();
        loadPickups();
      }

      async function loadCounts() {
        try {
          let url = '/api/pickups/counts?';
          if (filters.date) url += 'date=' + filters.date + '&';
          if (filters.region) url += 'region=' + filters.region + '&';
          const res = await axios.get(url);
          statusCounts = res.data.counts || statusCounts;
        } catch (err) {
          console.error('Failed to load pickup counts:', err);
        }
        renderStatusTabs();
      }

      // Cards are updated in place rather than refetched, so move the badge counts
      // by hand to keep the tabs honest between refreshes.
      function bumpCounts(from, to) {
        if (!from || !to || from === to) return;
        if (statusCounts[from] > 0) statusCounts[from]--;
        statusCounts[to] = (statusCounts[to] || 0) + 1;
        renderStatusTabs();
      }

      async function loadPickups() {
        try {
          const status = filters.status;
          const date = filters.date;
          const region = filters.region;
          let url = '/api/pickups?';
          if (status) url += 'status=' + status + '&';
          if (date) url += 'date=' + date + '&';
          if (region) url += 'region=' + region + '&';

          const res = await axios.get(url);
          const pickups = res.data.pickups || [];
          document.getElementById('pickup-count').textContent = pickups.length;
          const container = document.getElementById('pickups-container');

          pickupsById = {};
          pickups.forEach(p => {
            p._base = p.status;   // status this card was loaded with, for the filter hint
            p._undo = null;       // the action that can be taken back with one click
            pickupsById[p.id] = p;
          });

          if (pickups.length === 0) {
            container.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-3 block"></i>No pickup requests matching your filters</div>';
            return;
          }

          container.innerHTML = pickups.map(p => pickupCard(p)).join('');
        } catch (err) {
          console.error('Failed to load pickups:', err);
        }
      }

      // Swap one card for its current state without touching the rest of the list,
      // so the request keeps its exact position on screen.
      function refreshCard(p) {
        const el = document.getElementById('pickup-card-' + p.id);
        if (el) el.outerHTML = pickupCard(p);
      }

      function pickupCard(p) {
        const sc = statusConfig[p.status] || statusConfig.pending;
        const regionBadge = p.region ? \`<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold \${regionColors[p.region] || 'bg-gray-100 text-gray-600'} ml-2"><i class="fas fa-compass mr-0.5"></i>\${regionLabels[p.region] || p.region}</span>\` : '';
        return \`
        <div id="pickup-card-\${p.id}" class="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 \${sc.bg} card-hover overflow-hidden">
          <div class="p-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <i class="\${sc.icon}"></i>
                </div>
                <div>
                  <h3 class="font-bold text-gray-800">\${escHtml(p.company_name || 'Unknown Customer')}\${regionBadge}</h3>
                  <p class="text-sm text-gray-500">\${escHtml(p.contact_name || '')} \${p.phone ? '- ' + escHtml(p.phone) : ''}</p>
                  <p class="text-xs text-gray-400 mt-1">
                    <i class="fas fa-map-marker-alt mr-1"></i>\${escHtml(p.address || 'No address')}, \${escHtml(p.city || '')}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 sm:flex-col sm:items-end">
                <span class="px-3 py-1 rounded-full text-xs font-semibold \${sc.color}">
                  \${escHtml((p.status || '').replace('_',' ').toUpperCase())}
                </span>
                <span class="text-xs text-gray-400">#\${p.id}</span>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <div class="text-xs text-gray-500">Est. Tires</div>
                <div class="text-lg font-bold text-gray-800">\${escHtml(p.estimated_tire_count || '-')}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <div class="text-xs text-gray-500">Type</div>
                <div class="text-sm font-semibold text-gray-700 capitalize">\${escHtml((p.tire_type || 'N/A').replace('_',' '))}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <div class="text-xs text-gray-500">Preferred Date</div>
                <div class="text-sm font-semibold text-gray-700">\${escHtml(p.preferred_date || 'No pref')}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <div class="text-xs text-gray-500">Time</div>
                <div class="text-sm font-semibold text-gray-700 capitalize">\${escHtml(p.preferred_time_slot || 'Anytime')}</div>
              </div>
            </div>

            \${p.notes ? \`<div class="mt-3 p-2.5 bg-yellow-50 rounded-lg text-sm text-yellow-800"><i class="fas fa-sticky-note mr-1"></i>\${escHtml(p.notes)}</div>\` : ''}
            \${p.assigned_employee_name ? \`<div class="mt-3 text-xs text-gray-500"><i class="fas fa-user mr-1"></i>Assigned to: <span class="font-semibold">\${escHtml(p.assigned_employee_name)}</span></div>\` : ''}
            \${p.notify_customer ? \`<div class="mt-1 text-xs text-blue-500"><i class="fas fa-bell mr-1"></i>Customer notification enabled</div>\` : ''}

            \${actionButtons(p)}
            \${filterHint(p)}
          </div>
        </div>
        \`;
      }

      // The action just taken, rendered as the button that took it: same colour,
      // now filled in and carrying an Undo tag. Clicking it puts the pickup back.
      function undoButton(p) {
        const u = p._undo;
        const click = u.kind === 'assign' ? 'undoAssign(' + p.id + ')' : 'undoStatus(' + p.id + ')';
        return \`<button onclick="\${click}" title="Click again to undo this action" class="px-4 py-2 \${u.classes} text-white text-sm font-semibold rounded-lg transition-all inline-flex items-center gap-2 shadow-sm">
          <span><i class="\${u.icon} mr-1"></i>\${escHtml(u.label)}</span>
          <span class="text-[11px] font-bold bg-white/25 rounded px-1.5 py-0.5"><i class="fas fa-rotate-left mr-1"></i>Undo</span>
        </button>\`;
      }

      function actionButtons(p) {
        const id = p.id;
        const st = p.status;
        const primary = [];
        const extras = [];

        const assignBtn = \`<button onclick="openAssignModal(\${id})" class="px-4 py-2 bg-rc-green hover:bg-rc-green-light text-white text-sm font-semibold rounded-lg transition-all"><i class="fas fa-user-check mr-1"></i>Assign & Schedule</button>\`;
        const confirmBtn = \`<button onclick="confirmPickup(\${id})" class="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition-all"><i class="fas fa-check mr-1"></i>Confirm</button>\`;
        const fieldFormBtn = \`<button onclick="startFieldForm(\${id})" class="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-all"><i class="fas fa-tablet-alt mr-1"></i>Field Form</button>\`;
        const notifyBtn = \`<button onclick="toggleNotify(\${id})" class="px-3 py-2 \${p.notify_customer ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'} text-sm rounded-lg hover:bg-blue-100 transition-all" title="Toggle auto-notify"><i class="fas fa-bell"></i></button>\`;
        const cancelBtn = \`<button onclick="cancelPickup(\${id})" class="px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg hover:bg-red-100 transition-all" title="Cancel request"><i class="fas fa-ban"></i></button>\`;

        if (st === 'pending') {
          primary.push(assignBtn, confirmBtn);
          extras.push(notifyBtn, cancelBtn);
        } else if (st === 'confirmed') {
          primary.push(assignBtn);
          extras.push(notifyBtn);
        } else if (st === 'scheduled') {
          primary.push(\`<button onclick="startPickup(\${id})" class="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-all"><i class="fas fa-truck mr-1"></i>Start Pickup</button>\`, fieldFormBtn);
          extras.push(notifyBtn);
        } else if (st === 'in_progress') {
          primary.push(fieldFormBtn, \`<button onclick="completePickup(\${id})" class="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition-all"><i class="fas fa-check-circle mr-1"></i>Complete</button>\`);
        }

        if (p._undo) primary.unshift(undoButton(p));

        const html = primary.concat(extras).join('');
        if (!html) return '';
        const busy = p._busy ? 'opacity-50 pointer-events-none' : '';
        return \`<div class="mt-4 flex flex-wrap items-center gap-2 \${busy}">\${html}\${p._busy ? '<i class="fas fa-spinner fa-spin text-gray-400 ml-1"></i>' : ''}</div>\`;
      }

      // The card is deliberately left in place after an action, so say plainly why
      // it no longer looks like the rest of the filtered list.
      function filterHint(p) {
        const filter = filters.status;
        if (!filter || p.status === filter || p.status === p._base) return '';
        return \`<div class="mt-3 text-xs text-gray-400"><i class="fas fa-info-circle mr-1"></i>Now \${escHtml(statusLabels[p.status] || p.status)} - outside the "\${escHtml(statusLabels[filter] || filter)}" filter, but kept here until you refresh.</div>\`;
      }

      // Every card action runs through here: lock the card, call the API, then
      // re-render that one card from the updated local copy.
      async function runCardAction(id, fn) {
        const p = pickupsById[id];
        if (!p || p._busy) return;
        p._busy = true;
        refreshCard(p);
        try {
          await fn(p);
        } catch (err) {
          console.error('Pickup action failed:', err);
          alert((err.response && err.response.data && err.response.data.error) || 'Action failed');
        }
        p._busy = false;
        refreshCard(p);
      }

      function moveStatus(id, status, undoMeta) {
        return runCardAction(id, async (p) => {
          const from = p.status;
          await axios.post('/api/pickups/' + id + '/status', { status });
          p.status = status;
          p._undo = Object.assign({ kind: 'status', to: from }, undoMeta);
          bumpCounts(from, status);
        });
      }

      function confirmPickup(id) {
        return moveStatus(id, 'confirmed', { label: 'Confirmed', icon: 'fas fa-check', classes: 'bg-blue-600 hover:bg-blue-700' });
      }

      function cancelPickup(id) {
        return moveStatus(id, 'cancelled', { label: 'Cancelled', icon: 'fas fa-ban', classes: 'bg-red-600 hover:bg-red-700' });
      }

      function startPickup(id) {
        return moveStatus(id, 'in_progress', { label: 'Pickup Started', icon: 'fas fa-truck', classes: 'bg-orange-600 hover:bg-orange-700' });
      }

      function completePickup(id) {
        return moveStatus(id, 'completed', { label: 'Completed', icon: 'fas fa-check-circle', classes: 'bg-green-600 hover:bg-green-700' });
      }

      function undoStatus(id) {
        return runCardAction(id, async (p) => {
          const to = p._undo ? p._undo.to : p.status;
          const from = p.status;
          await axios.post('/api/pickups/' + id + '/status', { status: to });
          p.status = to;
          p._undo = null;
          bumpCounts(from, to);
        });
      }

      function undoAssign(id) {
        return runCardAction(id, async (p) => {
          const wanted = p._undo ? p._undo.to : 'pending';
          const to = wanted === 'confirmed' ? 'confirmed' : 'pending';
          const from = p.status;
          await axios.post('/api/pickups/' + id + '/unassign', { revert_to: to });
          p.status = to;
          bumpCounts(from, to);
          p.assigned_employee_id = null;
          p.assigned_employee_name = null;
          p._undo = null;
        });
      }

      function toggleNotify(id) {
        return runCardAction(id, async (p) => {
          const value = p.notify_customer ? 0 : 1;
          await axios.post('/api/pickups/' + id + '/notify', { notify_customer: value });
          p.notify_customer = value;
        });
      }

      function openAssignModal(pickupId) {
        const p = pickupsById[pickupId] || {};
        currentAssignPickupId = pickupId;
        document.getElementById('assign-customer-name').textContent = p.company_name || '';
        document.getElementById('assign-date').value = p.preferred_date || new Date().toISOString().split('T')[0];
        document.getElementById('assign-notify').checked = true;
        loadDrivers();
        document.getElementById('assign-modal').style.display = 'flex';
      }

      function closeAssignModal() {
        document.getElementById('assign-modal').style.display = 'none';
        currentAssignPickupId = null;
      }

      async function loadDrivers() {
        try {
          const res = await axios.get('/api/employee/drivers');
          const sel = document.getElementById('assign-employee');
          sel.innerHTML = '<option value="">Select driver...</option>' +
            (res.data.drivers || []).map(d => \`<option value="\${d.id}">\${d.first_name} \${d.last_name} (\${d.role})</option>\`).join('');
        } catch (err) { console.error(err); }
      }

      async function submitAssignment() {
        const sel = document.getElementById('assign-employee');
        const employeeId = sel.value;
        const date = document.getElementById('assign-date').value;
        const notify = document.getElementById('assign-notify').checked;
        if (!employeeId) { alert('Please select a driver'); return; }

        const driverName = (sel.options[sel.selectedIndex].text || '').split(' (')[0];
        const id = currentAssignPickupId;
        closeAssignModal();

        return runCardAction(id, async (p) => {
          const from = p.status;
          await axios.post('/api/pickups/' + id + '/assign', {
            employee_id: parseInt(employeeId),
            scheduled_date: date,
            notify_customer: notify ? 1 : 0
          });
          bumpCounts(from, 'scheduled');
          p.status = 'scheduled';
          p.assigned_employee_name = driverName;
          p.preferred_date = date || p.preferred_date;
          p.notify_customer = notify ? 1 : 0;
          p._undo = {
            kind: 'assign',
            to: from === 'confirmed' ? 'confirmed' : 'pending',
            label: 'Scheduled - ' + driverName,
            icon: 'fas fa-calendar-check',
            classes: 'bg-emerald-700 hover:bg-emerald-800'
          };
        });
      }

      function startFieldForm(pickupId) {
        window.location.href = '/employee/field-form?pickup_id=' + pickupId;
      }

      // Safely call loadPickups - retry if axios isn't ready
      (function initPickups() {
        if (typeof axios !== 'undefined') {
          renderStatusTabs();
          syncFilterControls();
          loadCounts();
          loadPickups();
        } else {
          setTimeout(initPickups, 500);
        }
      })();
    </script>
  `))
}
