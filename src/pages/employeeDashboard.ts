import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'
import { YARD_LAT, YARD_LNG } from '../utils/yard'

export function renderEmployeeDashboard(): string {
  return layout('Employee Dashboard', employeePageWrapper('dashboard', 'Operations Dashboard', `
    <!-- Create Account Chooser Modal -->
    <div id="create-account-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-plus mr-2 text-rc-green"></i>Create New Account</h3>
          <button onclick="closeCreateAccountChooser()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6 grid grid-cols-1 gap-3">
          <a href="/employee/customers?new=1" class="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-rc-green hover:bg-green-50 transition-all">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><i class="fas fa-building text-xl text-blue-600"></i></div>
            <div class="flex-1">
              <div class="font-bold text-gray-800">New Customer</div>
              <div class="text-xs text-gray-500">Company login + contact, address, region</div>
            </div>
            <i class="fas fa-arrow-right text-gray-300"></i>
          </a>
          <a id="create-account-staff-link" href="/employee/drivers?new=1" class="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-rc-green hover:bg-green-50 transition-all">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"><i class="fas fa-id-badge text-xl text-rc-orange"></i></div>
            <div class="flex-1">
              <div class="font-bold text-gray-800">New Staff / Driver</div>
              <div class="text-xs text-gray-500" id="create-account-staff-hint">Driver, yard operator, manager, or admin</div>
            </div>
            <i class="fas fa-arrow-right text-gray-300"></i>
          </a>
        </div>
      </div>
    </div>

    <!-- Scale Ticket Detail Modal (opened from a Recent Scale Tickets row) -->
    <div id="ticket-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;" onclick="if(event.target===this) closeTicketModal()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 class="text-lg font-bold text-gray-800" id="ticket-modal-title">Ticket</h3>
          <button onclick="closeTicketModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6" id="ticket-modal-content"></div>
      </div>
    </div>

    <!-- Stats Grid - ALL CLICKABLE -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/employee/pickups" class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 shadow-card border border-amber-100/60 card-hover cursor-pointer block btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-rc-green focus-visible:ring-offset-2">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Pending Pickups</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-pending">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-clock text-lg text-rc-orange"></i>
          </div>
        </div>
      </a>
      <a href="/employee/routing" class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 shadow-card border border-emerald-100/60 card-hover cursor-pointer block btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-rc-green focus-visible:ring-offset-2">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Today's Routes</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-routes">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-route text-lg text-rc-green"></i>
          </div>
        </div>
      </a>
      <a href="/employee/scale-tickets" id="stat-tickets-link" class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 shadow-card border border-orange-100/60 card-hover cursor-pointer block btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-rc-green focus-visible:ring-offset-2">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Open Scale Tickets</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-tickets">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-weight text-lg text-rc-orange"></i>
          </div>
        </div>
      </a>
      <a href="/employee/scale-house" class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-card border border-green-100/60 card-hover cursor-pointer block relative overflow-hidden btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-rc-green focus-visible:ring-offset-2">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500 font-medium">Completed Today</div>
            <div class="text-3xl font-extrabold text-gray-900 mt-1" id="stat-completed">-</div>
          </div>
          <div class="w-11 h-11 bg-white/80 rounded-lg shadow-sm ring-1 ring-black/5 flex items-center justify-center">
            <i class="fas fa-check-circle text-lg text-rc-green"></i>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-1" id="completed-summary"></div>
      </a>
    </div>

    <!-- Performance Micro-Graph -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
          <i class="fas fa-chart-bar text-rc-green"></i> Today's Performance
        </h2>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400" id="perf-date"></span>
          <button onclick="openCalendar()" class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 hover:text-gray-900 btn-press transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rc-green focus-visible:ring-offset-1" title="Open the full pickup calendar">
            <i class="fas fa-calendar-days mr-1.5"></i>Calendar
            <i class="fas fa-up-right-and-down-left-from-center ml-1.5 text-[10px] text-gray-400"></i>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600" id="perf-pickups">0</div>
          <div class="text-xs text-gray-500">Pickups</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-rc-gray" id="perf-tires">0</div>
          <div class="text-xs text-gray-500">~Tires</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-rc-orange" id="perf-weight">0</div>
          <div class="text-xs text-gray-500">kg Weighed</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-rc-green" id="perf-tickets">0</div>
          <div class="text-xs text-gray-500">Tickets</div>
        </div>
      </div>
      <!-- Micro bar graph -->
      <div class="flex items-end gap-1 h-16" id="perf-chart">
        <!-- Bars injected by JS -->
      </div>
      <div class="flex justify-between text-[10px] text-gray-400 mt-1" id="perf-chart-labels"></div>
    </div>

    <!-- Mini-Map + Recent sections in 2-column layout -->
    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Dashboard Mini-Map for Today's Pickups -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
            <i class="fas fa-map-marked-alt text-rc-green"></i> Today's Scheduled Pickups
          </h2>
          <span class="text-xs text-gray-400" id="map-pickup-count">0 pickups</span>
        </div>
        <div id="dashboard-map" class="h-[300px] bg-gray-100 relative">
          <div id="dashboard-map-placeholder" class="flex items-center justify-center h-full">
            <div class="text-center">
              <i class="fas fa-map-marked-alt text-4xl text-blue-300 mb-3"></i>
              <p class="text-gray-500 font-semibold text-sm">Loading Map...</p>
              <p class="text-xs text-gray-400 mt-1">Edmonton, Alberta</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Pickup Requests -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
            <i class="fas fa-truck-pickup text-rc-green"></i> Recent Pickup Requests
            <span id="pickups-badge" class="hidden bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"></span>
          </h2>
          <div class="flex items-center gap-3">
            <button onclick="loadDashboard()" class="text-sm text-gray-400 hover:text-rc-green" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
            <a href="/employee/pickups" class="text-sm text-rc-green hover:text-rc-green-light font-medium">View All <i class="fas fa-arrow-right ml-1"></i></a>
          </div>
        </div>
        <div class="divide-y divide-gray-50 max-h-[252px] overflow-y-auto" id="recent-pickups">
          <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading pickup requests...</div>
        </div>
      </div>
    </div>

    <!-- Recent Scale Tickets (full width) -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
          <i class="fas fa-weight text-rc-orange"></i> Recent Scale Tickets
        </h2>
        <a href="/employee/scale-tickets" class="text-sm text-rc-green hover:text-rc-green-light font-medium">View All <i class="fas fa-arrow-right ml-1"></i></a>
      </div>
      <div class="divide-y divide-gray-50" id="recent-tickets">
        <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
      </div>
    </div>

    <!-- Pickup Calendar (expanded from the Today's Performance card) -->
    <div id="calendar-modal" class="fixed inset-0 bg-black/50 z-50 items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col modal-enter">
        <!-- Header: month navigation -->
        <div class="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button onclick="shiftCalendarMonth(-1)" class="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 btn-press transition-all" title="Previous month">
              <i class="fas fa-chevron-left"></i>
            </button>
            <h3 class="text-lg font-bold text-gray-800 min-w-[190px] text-center" id="calendar-title">Calendar</h3>
            <button onclick="shiftCalendarMonth(1)" class="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 btn-press transition-all" title="Next month">
              <i class="fas fa-chevron-right"></i>
            </button>
            <button onclick="goToCalendarToday()" class="ml-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:text-gray-900 btn-press transition-all">Today</button>
          </div>
          <div class="flex items-center gap-3">
            <span class="hidden sm:flex items-center gap-3 text-[11px] text-gray-500">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Pending</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Confirmed</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>Scheduled</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>In Progress</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>Done</span>
            </span>
            <button onclick="closeCalendar()" class="text-gray-400 hover:text-gray-600 px-2" title="Close"><i class="fas fa-times text-xl"></i></button>
          </div>
        </div>

        <!-- Body: month grid + selected-day panel -->
        <div class="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="lg:col-span-2">
            <div class="grid grid-cols-7 gap-1 mb-1">
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">SUN</div>
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">MON</div>
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">TUE</div>
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">WED</div>
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">THU</div>
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">FRI</div>
              <div class="text-center text-[11px] font-bold text-gray-400 py-1">SAT</div>
            </div>
            <div class="grid grid-cols-7 gap-1" id="calendar-grid"></div>
          </div>

          <div class="lg:col-span-1">
            <div class="bg-gray-50 rounded-xl p-4 h-full">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-gray-800 text-sm" id="calendar-day-title">Pick a day</h4>
                <button onclick="openScheduleForm()" id="calendar-add-btn" style="display:none;" class="px-3 py-1.5 rounded-lg bg-rc-green hover:bg-rc-green-light text-white text-xs font-bold btn-press transition-all">
                  <i class="fas fa-plus mr-1"></i>Schedule
                </button>
              </div>
              <div id="calendar-day-list"></div>

              <!-- Inline booking form for the selected day -->
              <div id="schedule-form" style="display:none;" class="mt-4 pt-4 border-t border-gray-200">
                <h5 class="font-bold text-gray-800 text-sm mb-3"><i class="fas fa-plus-circle mr-1 text-rc-green"></i>New pickup</h5>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Customer</label>
                <select id="sched-customer" class="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none bg-white">
                  <option value="">Select customer...</option>
                </select>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Est. tires</label>
                    <input type="number" id="sched-tires" min="1" value="20" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none bg-white">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                    <select id="sched-type" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none bg-white">
                      <option value="mixed">Mixed</option>
                      <option value="passenger">Passenger</option>
                      <option value="light_truck">Light truck</option>
                      <option value="medium_truck">Medium truck</option>
                      <option value="heavy_truck">Heavy truck</option>
                      <option value="truck">Truck</option>
                      <option value="otr">OTR</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Time</label>
                    <select id="sched-slot" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none bg-white">
                      <option value="anytime">Anytime</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Driver</label>
                    <select id="sched-driver" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none bg-white">
                      <option value="">Unassigned</option>
                    </select>
                  </div>
                </div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input type="text" id="sched-notes" placeholder="Optional" class="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green outline-none bg-white">
                <div class="flex gap-2">
                  <button onclick="submitScheduledPickup()" id="sched-submit" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 rounded-lg text-sm btn-press transition-all">
                    <i class="fas fa-check mr-1"></i>Book pickup
                  </button>
                  <button onclick="closeScheduleForm()" class="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 font-semibold rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      let dashboardMap = null;
      let dashboardMapLoaded = false;
      let dashboardMarkers = [];

      // ═══ CREATE ACCOUNT CHOOSER ═══
      // Visibility: backend gates customer create on admin/manager and staff create on admin.
      // Show the quick-action button for admin+manager; non-admins clicking staff get a backend 403,
      // so we also hide that row for managers to avoid a dead-end.
      (function gateCreateAccount() {
        try {
          const s = JSON.parse(localStorage.getItem('rc_session') || '{}');
          const role = s.role || '';
          if (role === 'admin' || role === 'manager') {
            var slot = document.getElementById('page-header-actions');
            if (slot) slot.innerHTML =
              '<button onclick="openCreateAccountChooser()" class="bg-rc-green hover:opacity-90 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">' +
              '<i class="fas fa-user-plus"></i> Create Account</button>';
          }
          if (role !== 'admin') {
            const staffLink = document.getElementById('create-account-staff-link');
            if (staffLink) staffLink.style.display = 'none';
          }
        } catch (e) {}
      })();
      function openCreateAccountChooser() { document.getElementById('create-account-modal').style.display = 'flex'; }
      function closeCreateAccountChooser() { document.getElementById('create-account-modal').style.display = 'none'; }

      async function loadDashboard() {
        const pickupsDiv = document.getElementById('recent-pickups');
        const ticketsDiv = document.getElementById('recent-tickets');
        
        try {
          const res = await axios.get('/api/employee/dashboard');
          const d = res.data;
          
          // Update stats
          document.getElementById('stat-pending').textContent = d.pending_pickups || 0;
          document.getElementById('stat-routes').textContent = d.todays_routes || 0;
          document.getElementById('stat-tickets').textContent = d.open_tickets || 0;
          // One open ticket: jump straight into it. More than one (or none):
          // fall back to the plain list, since there is no single ticket to open.
          const ticketsLink = document.getElementById('stat-tickets-link');
          if (ticketsLink) {
            ticketsLink.href = d.open_ticket_id
              ? '/employee/scale-tickets?ticket=' + d.open_ticket_id
              : '/employee/scale-tickets';
          }
          document.getElementById('stat-completed').textContent = d.completed_today || 0;

          // Show pending badge
          const badge = document.getElementById('pickups-badge');
          if (d.pending_pickups > 0) {
            badge.textContent = d.pending_pickups + ' pending';
            badge.classList.remove('hidden');
          }

          // Performance data
          const perf = d.performance || {};
          document.getElementById('perf-pickups').textContent = perf.completed_pickups || 0;
          document.getElementById('perf-tires').textContent = perf.total_tires || 0;
          document.getElementById('perf-weight').textContent = perf.total_weight ? Math.round(perf.total_weight).toLocaleString() : '0';
          document.getElementById('perf-tickets').textContent = d.completed_today || 0;
          document.getElementById('perf-date').textContent = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });

          // Completed summary text
          const summaryEl = document.getElementById('completed-summary');
          if (perf.completed_pickups > 0) {
            summaryEl.textContent = perf.completed_pickups + ' pickups ~ ' + (perf.total_tires || 0) + ' tires / ' + Math.round(perf.total_weight || 0).toLocaleString() + 'kg';
          }

          // Render micro-graph (last 7 days)
          renderPerfChart(d.daily_stats || []);

          // Recent pickups
          if (d.recent_pickups && d.recent_pickups.length > 0) {
            pickupsDiv.innerHTML = d.recent_pickups.map(p => \`
              <a href="/employee/pickups" class="px-5 py-4 flex items-center justify-between hover:bg-green-50 cursor-pointer transition-colors duration-150 block">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 \${p.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'}">
                    <i class="fas fa-\${p.status === 'pending' ? 'clock text-yellow-600' : 'truck-pickup text-gray-500'} text-xs"></i>
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-gray-800">\${escHtml(p.company_name || 'Unknown')}</div>
                    <div class="text-xs text-gray-500">\${escHtml(p.estimated_tire_count)} \${escHtml(p.tire_type || '')} tires \${p.preferred_date ? '- ' + escHtml(p.preferred_date) : ''}</div>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${getStatusClass(p.status)}">
                  \${escHtml((p.status || '').replace('_',' ').toUpperCase())}
                </span>
              </a>
            \`).join('');
          } else {
            pickupsDiv.innerHTML = '<div class="py-8 text-center"><div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-inbox text-xl text-gray-300"></i></div><p class="text-sm font-medium text-gray-400">No recent pickup requests</p><p class="text-xs text-gray-300 mt-1">New requests will appear here</p></div>';
          }

          // Recent tickets
          if (d.recent_tickets && d.recent_tickets.length > 0) {
            ticketsDiv.innerHTML = d.recent_tickets.map(t => \`
              <div onclick="openTicketModal(\${t.id})" class="px-5 py-4 flex items-center justify-between hover:bg-orange-50 cursor-pointer transition-colors duration-150">
                <div>
                  <div class="font-semibold text-sm text-gray-800">\${escHtml(t.ticket_number)}</div>
                  <div class="text-xs text-gray-500">\${escHtml(t.field_store_name || t.company_name || 'N/A')} - \${t.net_weight ? escHtml(t.net_weight) + ' kg' : 'Pending weigh'}</div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${getTicketStatusClass(t.status)}">
                  \${escHtml((t.status || '').replace('_',' ').toUpperCase())}
                </span>
              </div>
            \`).join('');
          } else {
            ticketsDiv.innerHTML = '<div class="py-8 text-center"><div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-receipt text-xl text-gray-300"></i></div><p class="text-sm font-medium text-gray-400">No recent scale tickets</p><p class="text-xs text-gray-300 mt-1">Completed tickets will appear here</p></div>';
          }

          // Load map data
          loadDashboardMap();
        } catch (err) {
          console.error('[Dashboard] Load error:', err);
          if (pickupsDiv) {
            pickupsDiv.innerHTML = '<div class="p-6 text-center text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i>Failed to load. <button onclick="loadDashboard()" class="text-rc-green underline ml-1">Retry</button></div>';
          }
        }
      }

      // ═══ PERFORMANCE MICRO-GRAPH ═══
      function renderPerfChart(dailyStats) {
        const chartEl = document.getElementById('perf-chart');
        const labelsEl = document.getElementById('perf-chart-labels');
        if (!dailyStats || dailyStats.length === 0) {
          // Show empty state
          chartEl.innerHTML = '<div class="w-full text-center text-gray-300 text-xs">No data for the last 7 days</div>';
          return;
        }
        const maxVal = Math.max(...dailyStats.map(d => d.count), 1);
        chartEl.innerHTML = dailyStats.map(d => {
          const h = Math.max((d.count / maxVal) * 100, 4);
          const color = d.is_today ? 'bg-rc-green' : 'bg-green-200';
          return \`<div class="flex-1 rounded-t-md \${color} transition-all hover:opacity-80 relative group cursor-default" style="height:\${h}%">
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">\${d.count} completed</div>
          </div>\`;
        }).join('');
        labelsEl.innerHTML = dailyStats.map(d => \`<span class="flex-1 text-center \${d.is_today ? 'font-bold text-rc-green' : ''}">\${d.label}</span>\`).join('');
      }

      // ═══ DASHBOARD MINI-MAP ═══
      async function loadDashboardMap() {
        try {
          const res = await axios.get('/api/employee/todays-pickups-map');
          const pickups = res.data.pickups || [];
          document.getElementById('map-pickup-count').textContent = pickups.length + ' pickups';

          if (!dashboardMapLoaded) {
            await initDashboardGoogleMaps(pickups);
          } else {
            plotDashboardMarkers(pickups);
          }
        } catch (err) {
          console.warn('[Dashboard Map]', err);
        }
      }

      async function initDashboardGoogleMaps(pickups) {
        try {
          const res = await axios.get('/api/config/maps-key');
          const key = res.data.key;
          if (!key) {
            showDashboardMapFallback(pickups, 'No Google Maps API key');
            return;
          }
          // Check if Google Maps already loaded (from routing page cache)
          if (typeof google !== 'undefined' && google.maps) {
            createDashboardMap(pickups);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places,geometry&callback=onDashboardMapsReady';
          script.async = true;
          script.defer = true;
          window._pendingDashboardPickups = pickups;
          script.onerror = function() { showDashboardMapFallback(pickups, 'Failed to load Google Maps'); };
          document.head.appendChild(script);
          setTimeout(function() { if (!dashboardMapLoaded) showDashboardMapFallback(pickups, 'Map loading timeout'); }, 12000);
        } catch(e) {
          showDashboardMapFallback(pickups, 'Could not load Maps');
        }
      }

      window.onDashboardMapsReady = function() {
        createDashboardMap(window._pendingDashboardPickups || []);
      };

      // Google calls this if the API key is invalid, referrer-restricted, or billing is disabled.
      // Without it, Google paints its default "Oops! Something went wrong" overlay inside the map div.
      window.gm_authFailure = function() {
        dashboardMapLoaded = true;
        showDashboardMapFallback(window._pendingDashboardPickups || [], 'Map unavailable (check API key / billing)');
      };

      function createDashboardMap(pickups) {
        dashboardMapLoaded = true;
        const mapEl = document.getElementById('dashboard-map');
        dashboardMap = new google.maps.Map(mapEl, {
          center: { lat: ${YARD_LAT}, lng: ${YARD_LNG} },
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }]
        });
        // Add Reuse Canada HQ marker
        new google.maps.Marker({
          position: { lat: ${YARD_LAT}, lng: ${YARD_LNG} },
          map: dashboardMap,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#1B5E20', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          title: 'Reuse Canada Yard'
        });
        plotDashboardMarkers(pickups);
      }

      function plotDashboardMarkers(pickups) {
        if (!dashboardMap) return;
        // Clear old markers
        dashboardMarkers.forEach(m => m.setMap(null));
        dashboardMarkers = [];
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: ${YARD_LAT}, lng: ${YARD_LNG} });

        const statusColors = {
          pending: '#EAB308',
          confirmed: '#3B82F6',
          scheduled: '#6366F1',
          in_progress: '#F97316',
          completed: '#22C55E'
        };

        pickups.forEach((p, i) => {
          if (p.lat && p.lng) {
            const pos = { lat: p.lat, lng: p.lng };
            bounds.extend(pos);
            const marker = new google.maps.Marker({
              position: pos,
              map: dashboardMap,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: statusColors[p.status] || '#6366F1',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2
              },
              title: p.company_name
            });
            const infoWin = new google.maps.InfoWindow({
              content: '<div style="font-family:Inter,sans-serif;min-width:160px"><b>' + (p.company_name || 'Pickup') + '</b><br><span style="font-size:12px;color:#666">' + (p.address || '') + ', ' + (p.city || '') + '<br>' + (p.estimated_tire_count || '?') + ' tires | ' + p.status.replace('_',' ').toUpperCase() + '</span></div>'
            });
            marker.addListener('click', () => infoWin.open(dashboardMap, marker));
            dashboardMarkers.push(marker);
          }
        });

        if (dashboardMarkers.length > 0) {
          dashboardMap.fitBounds(bounds, 40);
        }
      }

      function showDashboardMapFallback(pickups, message) {
        const el = document.getElementById('dashboard-map');
        const count = pickups ? pickups.length : 0;
        el.innerHTML = '<div class="flex items-center justify-center h-full bg-blue-50"><div class="text-center"><i class="fas fa-map-marked-alt text-4xl text-blue-300 mb-2"></i><p class="text-gray-500 text-sm font-semibold">' + message + '</p><p class="text-xs text-gray-400 mt-1">' + count + ' scheduled pickups today</p>' +
          (pickups && pickups.length > 0 ? '<div class="mt-3 text-left max-h-32 overflow-y-auto px-4">' + pickups.slice(0,5).map(p => '<div class="text-xs text-gray-600 py-1 border-b border-gray-200"><i class="fas fa-map-pin text-blue-400 mr-1"></i>' + (p.company_name || 'Unknown') + ' - ' + (p.city || '') + '</div>').join('') + '</div>' : '') +
          '</div></div>';
      }

      function getStatusClass(status) {
        const map = { pending:'bg-yellow-100 text-yellow-800', confirmed:'bg-blue-100 text-blue-800', scheduled:'bg-indigo-100 text-indigo-800', in_progress:'bg-orange-100 text-orange-800', completed:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' };
        return map[status] || 'bg-gray-100 text-gray-800';
      }
      // Opens one ticket in place. A Recent Scale Tickets row used to navigate to
      // /employee/scale-tickets no matter which row was clicked; only "View All"
      // should leave the dashboard. Built with string concatenation rather than a
      // nested template literal so nothing needs escaping inside this page string.
      async function openTicketModal(id) {
        var modal = document.getElementById('ticket-modal');
        var content = document.getElementById('ticket-modal-content');
        document.getElementById('ticket-modal-title').textContent = 'Loading ticket...';
        content.innerHTML = '<div class="py-12 text-center text-gray-300"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
        modal.style.display = 'flex';
        try {
          var res = await axios.get('/api/scale-tickets/' + id);
          var t = res.data.ticket;
          var audit = res.data.audit_trail || [];
          document.getElementById('ticket-modal-title').textContent = 'Ticket ' + t.ticket_number;

          var row = function(label, value) {
            return '<div class="flex justify-between py-1.5 border-b border-gray-50"><span class="text-gray-500">' + label + '</span><span class="font-semibold text-gray-800">' + value + '</span></div>';
          };
          var kg = function(v) { return v ? parseFloat(v).toFixed(1) + ' kg' : '<span class="text-gray-300">Pending</span>'; };

          var html = '<div class="flex items-center justify-between mb-4">' +
            '<span class="font-mono font-bold text-lg text-gray-800">' + escHtml(t.ticket_number) + '</span>' +
            '<span class="px-2.5 py-1 rounded-full text-xs font-semibold ' + getTicketStatusClass(t.status) + '">' +
              escHtml((t.status || '').replace(/_/g, ' ').toUpperCase()) + '</span></div>';

          html += '<div class="grid md:grid-cols-2 gap-x-8 text-sm"><div>' +
            row('Customer', escHtml(t.field_store_name || t.company_name || 'N/A')) +
            row('Operator', escHtml(t.employee_name || 'N/A')) +
            row('Material', escHtml((t.tire_type || 'N/A').replace(/_/g, ' '))) +
            row('Created', new Date(t.created_at).toLocaleString('en-CA')) +
          '</div><div>' +
            row('Weight In (Gross)', kg(t.weight_in)) +
            row('Weight Out (Tare)', kg(t.weight_out)) +
            row('Net Weight', kg(t.net_weight)) +
            row('Total', t.grand_total ? '$' + parseFloat(t.grand_total).toFixed(2) : '<span class="text-gray-300">-</span>') +
          '</div></div>';

          if (t.void_reason) {
            html += '<div class="mt-4 bg-red-50 rounded-xl p-3"><div class="text-xs text-red-600 font-semibold">VOID REASON</div><div class="text-sm text-red-700">' + escHtml(t.void_reason) + '</div></div>';
          }
          if (t.notes) {
            html += '<div class="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600"><i class="fas fa-sticky-note mr-1"></i> ' + escHtml(t.notes) + '</div>';
          }
          var photos = '';
          if (t.photo_in) photos += '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-In</div><img src="' + escAttr(t.photo_in) + '" class="w-full rounded-lg border border-gray-200 cursor-pointer" onclick="window.open(this.src)"></div>';
          if (t.photo_out) photos += '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-Out</div><img src="' + escAttr(t.photo_out) + '" class="w-full rounded-lg border border-gray-200 cursor-pointer" onclick="window.open(this.src)"></div>';
          if (photos) html += '<div class="grid grid-cols-2 gap-3 mt-4">' + photos + '</div>';

          if (audit.length) {
            html += '<div class="mt-6 pt-4 border-t border-gray-100"><div class="text-xs font-bold text-gray-500 uppercase mb-2">Audit Trail</div><div class="space-y-1">' +
              audit.map(function(a) {
                return '<div class="flex items-center gap-2 text-xs text-gray-500"><span class="font-semibold">' + escHtml((a.action || '').replace(/_/g, ' ')) + '</span><span class="text-gray-400">' + escHtml(a.employee_name || '') + '</span><span class="ml-auto text-gray-400">' + new Date(a.created_at).toLocaleString('en-CA', {hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'}) + '</span></div>';
              }).join('') + '</div></div>';
          }

          content.innerHTML = html;
        } catch (err) {
          console.error('openTicketModal(' + id + ') failed:', err);
          document.getElementById('ticket-modal-title').textContent = 'Ticket';
          content.innerHTML = '<div class="py-10 text-center text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i><p class="text-sm">Could not load this ticket.</p><p class="text-xs text-gray-400 mt-1">' + escHtml(err && err.message ? err.message : String(err)) + '</p></div>';
        }
      }

      function closeTicketModal() { document.getElementById('ticket-modal').style.display = 'none'; }

      function getTicketStatusClass(status) {
        const map = { field_pending:'bg-yellow-100 text-yellow-800', field_complete:'bg-blue-100 text-blue-800', weighing_in:'bg-indigo-100 text-indigo-800', weighed_in:'bg-purple-100 text-purple-800', weighing_out:'bg-orange-100 text-orange-800', completed:'bg-green-100 text-green-800', voided:'bg-red-100 text-red-800' };
        return map[status] || 'bg-gray-100 text-gray-800';
      }

      (function initDashboard() {
        if (typeof axios !== 'undefined') { loadDashboard(); }
        else { setTimeout(initDashboard, 500); }
      })();

      /* ── Pickup calendar ─────────────────────────────────────────────────
         Expanded from the Today's Performance card. Reads a whole month from
         /api/pickups/calendar, groups it by preferred_date, and books new
         pickups through POST /api/pickups. */
      let calMonth = null;              // Date pinned to the 1st of the shown month
      let calPickups = {};              // 'YYYY-MM-DD' -> [pickup, ...]
      let calSelectedDay = null;        // 'YYYY-MM-DD'
      let calCustomersLoaded = false;

      const calStatusDot = {
        pending: 'bg-amber-400', confirmed: 'bg-blue-500', scheduled: 'bg-indigo-500',
        in_progress: 'bg-orange-500', completed: 'bg-green-500', cancelled: 'bg-red-400'
      };
      const calStatusChip = {
        pending: 'bg-amber-50 text-amber-800 border-amber-200',
        confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
        scheduled: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        in_progress: 'bg-orange-50 text-orange-800 border-orange-200',
        completed: 'bg-green-50 text-green-800 border-green-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200'
      };

      function calDateKey(d) {
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + m + '-' + day;
      }

      function openCalendar() {
        const today = new Date();
        calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        calSelectedDay = calDateKey(today);
        document.getElementById('calendar-modal').style.display = 'flex';
        loadCalendarMonth();
      }

      function closeCalendar() {
        document.getElementById('calendar-modal').style.display = 'none';
        closeScheduleForm();
      }

      function shiftCalendarMonth(delta) {
        calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1);
        closeScheduleForm();
        loadCalendarMonth();
      }

      function goToCalendarToday() {
        const today = new Date();
        calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        calSelectedDay = calDateKey(today);
        closeScheduleForm();
        loadCalendarMonth();
      }

      async function loadCalendarMonth() {
        const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
        const last = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
        // Pad to whole weeks so the leading/trailing cells show their pickups too.
        const start = new Date(first); start.setDate(first.getDate() - first.getDay());
        const end = new Date(last); end.setDate(last.getDate() + (6 - last.getDay()));

        document.getElementById('calendar-title').textContent =
          calMonth.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

        try {
          const res = await axios.get('/api/pickups/calendar?start=' + calDateKey(start) + '&end=' + calDateKey(end));
          calPickups = {};
          (res.data.pickups || []).forEach(p => {
            if (!p.preferred_date) return;
            (calPickups[p.preferred_date] = calPickups[p.preferred_date] || []).push(p);
          });
        } catch (err) {
          console.error('Failed to load calendar:', err);
          calPickups = {};
        }

        renderCalendarGrid(start, end);
        renderCalendarDay();
      }

      function renderCalendarGrid(start, end) {
        const todayKey = calDateKey(new Date());
        const cells = [];
        const cursor = new Date(start);

        while (cursor <= end) {
          const key = calDateKey(cursor);
          const inMonth = cursor.getMonth() === calMonth.getMonth();
          const items = calPickups[key] || [];
          const isToday = key === todayKey;
          const isSel = key === calSelectedDay;

          const shell = [
            'text-left p-2 rounded-lg border transition-all min-h-[92px] flex flex-col',
            inMonth ? 'bg-white' : 'bg-gray-50/60',
            isSel ? 'border-rc-green ring-2 ring-rc-green/30' : 'border-gray-100 hover:border-gray-300'
          ].join(' ');
          const dayNum = isToday
            ? '<span class="w-6 h-6 rounded-full bg-rc-green text-white text-xs font-bold flex items-center justify-center">' + cursor.getDate() + '</span>'
            : '<span class="text-xs font-bold ' + (inMonth ? 'text-gray-700' : 'text-gray-300') + '">' + cursor.getDate() + '</span>';

          const chips = items.slice(0, 3).map(p =>
            '<div class="flex items-center gap-1 text-[10px] leading-tight truncate">' +
              '<span class="w-1.5 h-1.5 rounded-full flex-shrink-0 ' + (calStatusDot[p.status] || 'bg-gray-300') + '"></span>' +
              '<span class="truncate text-gray-600">' + escHtml(p.company_name || 'Unknown') + '</span>' +
            '</div>'
          ).join('');
          const more = items.length > 3
            ? '<div class="text-[10px] text-gray-400 font-semibold mt-0.5">+' + (items.length - 3) + ' more</div>'
            : '';

          cells.push(
            '<button onclick="selectCalendarDay(\\'' + key + '\\')" class="' + shell + '">' +
              '<div class="flex items-center justify-between mb-1">' + dayNum +
                (items.length ? '<span class="text-[10px] font-bold text-gray-400">' + items.length + '</span>' : '') +
              '</div>' +
              '<div class="space-y-0.5 overflow-hidden">' + chips + more + '</div>' +
            '</button>'
          );
          cursor.setDate(cursor.getDate() + 1);
        }

        document.getElementById('calendar-grid').innerHTML = cells.join('');
      }

      function selectCalendarDay(key) {
        calSelectedDay = key;
        closeScheduleForm();
        renderCalendarGrid(
          (function () { const f = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1); const s = new Date(f); s.setDate(f.getDate() - f.getDay()); return s; })(),
          (function () { const l = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0); const e = new Date(l); e.setDate(l.getDate() + (6 - l.getDay())); return e; })()
        );
        renderCalendarDay();
      }

      function renderCalendarDay() {
        const title = document.getElementById('calendar-day-title');
        const list = document.getElementById('calendar-day-list');
        const addBtn = document.getElementById('calendar-add-btn');

        if (!calSelectedDay) {
          title.textContent = 'Pick a day';
          list.innerHTML = '<p class="text-xs text-gray-400">Select a day to see and book pickups.</p>';
          addBtn.style.display = 'none';
          return;
        }

        const d = new Date(calSelectedDay + 'T12:00:00');
        title.textContent = d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
        addBtn.style.display = '';

        const items = calPickups[calSelectedDay] || [];
        if (items.length === 0) {
          list.innerHTML = '<p class="text-xs text-gray-400 py-3">Nothing booked for this day yet.</p>';
          return;
        }

        list.innerHTML = items.map(p =>
          '<a href="/employee/pickups" class="block bg-white rounded-lg border border-gray-100 p-3 mb-2 hover:border-gray-300 transition-all">' +
            '<div class="flex items-start justify-between gap-2">' +
              '<div class="min-w-0">' +
                '<div class="font-semibold text-sm text-gray-800 truncate">' + escHtml(p.company_name || 'Unknown') + '</div>' +
                '<div class="text-[11px] text-gray-500">' + escHtml(p.city || '') + ' · ' + escHtml(String(p.estimated_tire_count || '-')) + ' tires · ' + escHtml((p.preferred_time_slot || 'anytime')) + '</div>' +
                (p.assigned_employee_name ? '<div class="text-[11px] text-gray-400 mt-0.5"><i class="fas fa-user mr-1"></i>' + escHtml(p.assigned_employee_name) + '</div>' : '') +
              '</div>' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ' + (calStatusChip[p.status] || 'bg-gray-50 text-gray-600 border-gray-200') + '">' +
                escHtml((p.status || '').replace('_', ' ').toUpperCase()) +
              '</span>' +
            '</div>' +
          '</a>'
        ).join('');
      }

      async function openScheduleForm() {
        document.getElementById('schedule-form').style.display = '';
        if (calCustomersLoaded) return;
        try {
          const [cust, drv] = await Promise.all([
            axios.get('/api/employee/customers'),
            axios.get('/api/employee/drivers')
          ]);
          document.getElementById('sched-customer').innerHTML = '<option value="">Select customer...</option>' +
            (cust.data.customers || []).map(c =>
              '<option value="' + c.id + '">' + escHtml(c.company_name) + (c.city ? ' — ' + escHtml(c.city) : '') + '</option>'
            ).join('');
          document.getElementById('sched-driver').innerHTML = '<option value="">Unassigned</option>' +
            (drv.data.drivers || []).map(d =>
              '<option value="' + d.id + '">' + escHtml(d.first_name + ' ' + d.last_name) + '</option>'
            ).join('');
          calCustomersLoaded = true;
        } catch (err) {
          console.error('Failed to load customers/drivers:', err);
        }
      }

      function closeScheduleForm() {
        const form = document.getElementById('schedule-form');
        if (form) form.style.display = 'none';
      }

      async function submitScheduledPickup() {
        const customerId = document.getElementById('sched-customer').value;
        if (!customerId) { alert('Please pick a customer'); return; }
        if (!calSelectedDay) { alert('Please pick a day first'); return; }

        const btn = document.getElementById('sched-submit');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Booking...';
        try {
          await axios.post('/api/pickups', {
            customer_id: parseInt(customerId, 10),
            estimated_tire_count: parseInt(document.getElementById('sched-tires').value, 10),
            tire_type: document.getElementById('sched-type').value,
            preferred_date: calSelectedDay,
            preferred_time_slot: document.getElementById('sched-slot').value,
            notes: document.getElementById('sched-notes').value || null,
            employee_id: document.getElementById('sched-driver').value ? parseInt(document.getElementById('sched-driver').value, 10) : null
          });
          document.getElementById('sched-notes').value = '';
          closeScheduleForm();
          await loadCalendarMonth();
          if (typeof loadDashboard === 'function') loadDashboard();
        } catch (err) {
          alert((err.response && err.response.data && err.response.data.error) || 'Failed to book pickup');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-1"></i>Book pickup';
      }

      // Esc closes the calendar, matching the other modals on this page.
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const modal = document.getElementById('calendar-modal');
        if (modal && modal.style.display === 'flex') closeCalendar();
      });

    </script>
  `))
}
