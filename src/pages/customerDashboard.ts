import { layout } from '../utils/layout'

export function renderCustomerDashboard(): string {
  return layout('Customer Dashboard', `
  <!-- Mobile Header -->
  <div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-rc-green text-white shadow-lg">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-2">
        <i class="fas fa-recycle text-rc-lime"></i>
        <span class="font-bold">REUSE CANADA</span>
      </div>
      <button onclick="handleLogout()" class="text-sm opacity-80 hover:opacity-100">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 pt-16 lg:pt-8 pb-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-store mr-2 text-rc-green"></i>
          Welcome back, <span id="customer-name">Customer</span>
        </h1>
        <p class="text-gray-500 mt-1">Manage your tire pickup requests</p>
      </div>
      <div class="mt-4 sm:mt-0 flex items-center gap-3">
        <button onclick="handleLogout()" class="hidden lg:block text-sm text-gray-500 hover:text-red-500">
          <i class="fas fa-sign-out-alt mr-1"></i> Sign Out
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-clock text-yellow-600"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800" id="stat-pending">0</div>
            <div class="text-xs text-gray-500">Pending</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-calendar-check text-blue-600"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800" id="stat-scheduled">0</div>
            <div class="text-xs text-gray-500">Scheduled</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-check-circle text-green-600"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800" id="stat-completed">0</div>
            <div class="text-xs text-gray-500">Completed</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-circle-dot text-purple-600"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-800" id="stat-tires">0</div>
            <div class="text-xs text-gray-500">Total Tires</div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Pickup Request -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-plus-circle text-rc-green"></i>
          Request a Tire Pickup
        </h2>
      </div>
      <div class="p-6">
        <form id="pickup-form" onsubmit="submitPickupRequest(event)">
          <div class="grid md:grid-cols-2 gap-x-6 gap-y-6" style="overflow:visible;">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Estimated Number of Tires</label>
              <input type="number" id="tire-count" min="1" required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 outline-none bg-white"
                placeholder="e.g. 50">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Tire Type</label>
              <div class="relative">
                <select id="tire-type" required
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 outline-none bg-white appearance-none cursor-pointer pr-10">
                  <option value="">Select type...</option>
                  <option value="passenger">Passenger / Light Truck</option>
                  <option value="truck">Commercial Truck</option>
                  <option value="mixed">Mixed</option>
                  <option value="off-road">Off-Road / Agricultural</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-4 text-sm text-gray-500"><i class="fas fa-calendar-check mr-1 text-rc-green"></i>No need to pick a day. We will contact you with a confirmed pickup date.</p>
          <div class="mt-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
            <textarea id="pickup-notes" rows="2"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 outline-none"
              placeholder="e.g. Tires are in back lot, cage is full, need flatbed..."></textarea>
          </div>
          <div class="mt-6">
            <button type="submit" id="submit-pickup-btn"
              class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              <i class="fas fa-paper-plane"></i>
              Submit Pickup Request
            </button>
            <!-- Shown once a request is submitted -->
            <div id="pickup-success" class="mt-4 flex items-start gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4" role="status" style="display:none;">
              <i class="fas fa-truck-fast text-rc-green text-xl mt-0.5"></i>
              <div class="text-sm text-gray-700">
                <p id="pickup-success-job" class="text-xs font-bold text-rc-green uppercase tracking-wide" style="display:none;"></p>
                <p class="font-bold text-gray-800 text-base">Thank you! Your pickup request has been received.</p>
                <p class="mt-1">We will get back to you ASAP with a confirmed date for your pickup request.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Pickup confirmed / scheduled popup. Inline display:none for the Tailwind hidden/flex collision. -->
    <div id="pickup-notice-modal" class="fixed inset-0 z-50 items-center justify-center bg-black/50 p-4" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="pickup-notice-title">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="bg-rc-green px-6 py-5 text-white flex items-center gap-3">
          <i class="fas fa-calendar-check text-2xl"></i>
          <h3 id="pickup-notice-title" class="text-lg font-bold">Pickup update</h3>
        </div>
        <div id="pickup-notice-body" class="px-6 py-5 space-y-3 text-sm text-gray-700"></div>
        <div class="px-6 pb-6">
          <button type="button" onclick="dismissPickupNotice()"
            class="w-full bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all">
            OK, got it
          </button>
        </div>
      </div>
    </div>

    <!-- Pickup History -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="p-6 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-history text-rc-green"></i>
          Your Pickup Requests
        </h2>
      </div>
      <!-- Search + filters (client-side over the customer's own requests) -->
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="search" id="ph-search" oninput="setPickupFilter('q', this.value)"
            class="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none bg-white text-sm"
            placeholder="Search by tire type, status, notes, number of tires or date...">
        </div>
        <div class="flex flex-wrap items-center gap-2" id="ph-periods" role="group" aria-label="Time period">
          <button type="button" data-period="all" onclick="setPickupFilter('period','all')">All time</button>
          <button type="button" data-period="today" onclick="setPickupFilter('period','today')">Today</button>
          <button type="button" data-period="week" onclick="setPickupFilter('period','week')">This week</button>
          <button type="button" data-period="month" onclick="setPickupFilter('period','month')">This month</button>
          <button type="button" data-period="last30" onclick="setPickupFilter('period','last30')">Last 30 days</button>
          <button type="button" data-period="year" onclick="setPickupFilter('period','year')">This year</button>
          <button type="button" data-period="custom" onclick="setPickupFilter('period','custom')">Pick a day / range</button>
        </div>
        <div class="flex flex-wrap items-end gap-3 text-sm">
          <div id="ph-range" class="flex flex-wrap items-end gap-3" style="display:none;">
            <label class="flex flex-col text-xs font-semibold text-gray-500">From
              <input type="date" id="ph-from" onchange="setPickupFilter('from', this.value)" class="mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-rc-green outline-none bg-white text-sm text-gray-800">
            </label>
            <label class="flex flex-col text-xs font-semibold text-gray-500">To <span class="font-normal">(leave blank for one day)</span>
              <input type="date" id="ph-to" onchange="setPickupFilter('to', this.value)" class="mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-rc-green outline-none bg-white text-sm text-gray-800">
            </label>
          </div>
          <label class="flex flex-col text-xs font-semibold text-gray-500">Date means
            <select id="ph-dateby" onchange="setPickupFilter('dateBy', this.value)" class="mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-rc-green outline-none bg-white text-sm text-gray-800">
              <option value="created">Day I requested it</option>
              <option value="preferred">Pickup day</option>
            </select>
          </label>
          <label class="flex flex-col text-xs font-semibold text-gray-500">Status
            <select id="ph-status" onchange="setPickupFilter('status', this.value)" class="mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-rc-green outline-none bg-white text-sm text-gray-800">
              <option value="">All statuses</option>
              <option value="open">Open (not finished)</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label class="flex flex-col text-xs font-semibold text-gray-500">Tire type
            <select id="ph-type" onchange="setPickupFilter('type', this.value)" class="mt-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-rc-green outline-none bg-white text-sm text-gray-800">
              <option value="">All types</option>
              <option value="passenger">Passenger / Light Truck</option>
              <option value="truck">Commercial Truck</option>
              <option value="mixed">Mixed</option>
              <option value="off-road">Off-Road / Agricultural</option>
            </select>
          </label>
          <button type="button" id="ph-clear" onclick="clearPickupFilters()" class="px-3 py-2 text-sm font-semibold text-rc-green hover:underline" style="display:none;">
            <i class="fas fa-xmark"></i> Clear filters
          </button>
        </div>
        <p id="ph-summary" class="text-xs text-gray-500"></p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job #</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pickup Date</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tires</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody id="pickup-table-body">
            <tr><td colspan="7" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    // Auth check
    const session = JSON.parse(localStorage.getItem('rc_session') || '{}');
    if (!session.token || session.user_type !== 'customer') {
      window.location.href = '/login';
    }
    document.getElementById('customer-name').textContent = session.company_name || session.name || 'Customer';

    // Axios auth - with safety check
    function setupCustomerAxios() {
      if (typeof axios === 'undefined') {
        setTimeout(setupCustomerAxios, 200);
        return;
      }
      axios.interceptors.request.use(config => {
        const s = JSON.parse(localStorage.getItem('rc_session') || '{}');
        if (s.token) config.headers.Authorization = 'Bearer ' + s.token;
        return config;
      });
      axios.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401) { localStorage.removeItem('rc_session'); window.location.href = '/login'; }
        return Promise.reject(err);
      });
    }
    setupCustomerAxios();

    function handleLogout() {
      localStorage.removeItem('rc_session');
      window.location.href = '/login';
    }

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    async function loadPickups() {
      try {
        const res = await axios.get('/api/customer/pickups');
        const pickups = res.data.pickups || [];
        
        // Update stats
        document.getElementById('stat-pending').textContent = pickups.filter(p => p.status === 'pending').length;
        document.getElementById('stat-scheduled').textContent = pickups.filter(p => ['confirmed','scheduled','in_progress'].includes(p.status)).length;
        document.getElementById('stat-completed').textContent = pickups.filter(p => p.status === 'completed').length;
        document.getElementById('stat-tires').textContent = pickups.reduce((sum, p) => sum + (p.estimated_tire_count || 0), 0);

        allPickups = pickups;
        renderPickupTable();
        announcePickupUpdates(pickups);
      } catch (err) {
        console.error('Failed to load pickups:', err);
      }
    }

    // ═══ Search + filters for "Your Pickup Requests" ═══
    let allPickups = [];
    const pickupFilters = { q: '', period: 'all', dateBy: 'created', from: '', to: '', status: '', type: '' };
    const TIRE_LABELS = { passenger: 'Passenger / Light Truck', truck: 'Commercial Truck', mixed: 'Mixed', 'off-road': 'Off-Road / Agricultural' };

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function localYmd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    // created_at is stored in UTC ("YYYY-MM-DD HH:MM:SS"); show and filter it as the customer's local day.
    function createdYmd(p) {
      if (!p.created_at) return '';
      const d = new Date(String(p.created_at).replace(' ', 'T') + (String(p.created_at).indexOf('Z') === -1 ? 'Z' : ''));
      return isNaN(d.getTime()) ? String(p.created_at).slice(0, 10) : localYmd(d);
    }
    function pickupDay(p) { return pickupFilters.dateBy === 'preferred' ? (p.preferred_date || '') : createdYmd(p); }
    function prettyDay(ymd) {
      if (!ymd) return 'N/A';
      const d = new Date(ymd + 'T12:00:00');
      return isNaN(d.getTime()) ? ymd : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    // Customers no longer pick a day; the office sets it when scheduling.
    function pickupDateCell(p) {
      if (p.preferred_date) return '<span class="text-gray-800">' + escHtml(prettyDay(p.preferred_date)) + '</span>';
      if (p.status === 'pending' || p.status === 'confirmed') return '<span class="text-amber-600 font-semibold">Awaiting confirmed date</span>';
      return '<span class="text-gray-400">-</span>';
    }

    // [from, to] as YYYY-MM-DD for the chosen period, or null for no date limit.
    function periodRange() {
      const now = new Date();
      const today = localYmd(now);
      switch (pickupFilters.period) {
        case 'today': return [today, today];
        case 'week': {
          const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
          const end = new Date(start); end.setDate(start.getDate() + 6);
          return [localYmd(start), localYmd(end)];
        }
        case 'month': return [localYmd(new Date(now.getFullYear(), now.getMonth(), 1)), localYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
        case 'last30': { const s = new Date(now); s.setDate(now.getDate() - 29); return [localYmd(s), today]; }
        case 'year': return [now.getFullYear() + '-01-01', now.getFullYear() + '-12-31'];
        case 'custom': {
          if (!pickupFilters.from && !pickupFilters.to) return null;
          const f = pickupFilters.from || pickupFilters.to, t = pickupFilters.to || pickupFilters.from;
          return f <= t ? [f, t] : [t, f];
        }
        default: return null;
      }
    }

    function filteredPickups() {
      const range = periodRange();
      const q = pickupFilters.q.trim().toLowerCase();
      return allPickups.filter(p => {
        if (pickupFilters.status === 'open') { if (['completed', 'cancelled'].indexOf(p.status) !== -1) return false; }
        else if (pickupFilters.status && p.status !== pickupFilters.status) return false;
        if (pickupFilters.type && p.tire_type !== pickupFilters.type) return false;
        if (range) { const day = pickupDay(p); if (!day || day < range[0] || day > range[1]) return false; }
        if (q) {
          const hay = [p.job_number, p.job_number ? 'j-' + p.job_number : '', p.notes, p.tire_type, TIRE_LABELS[p.tire_type], (p.status || '').replace('_', ' '), p.estimated_tire_count,
            p.preferred_date, prettyDay(p.preferred_date), createdYmd(p), prettyDay(createdYmd(p)), p.preferred_time_slot]
            .filter(Boolean).join(' ').toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
    }

    function filtersActive() {
      return !!(pickupFilters.q.trim() || pickupFilters.period !== 'all' || pickupFilters.status || pickupFilters.type);
    }

    function setPickupFilter(key, value) {
      pickupFilters[key] = value;
      renderPickupTable();
    }
    function clearPickupFilters() {
      Object.assign(pickupFilters, { q: '', period: 'all', from: '', to: '', status: '', type: '' });
      ['ph-search', 'ph-from', 'ph-to', 'ph-status', 'ph-type'].forEach(id => { document.getElementById(id).value = ''; });
      renderPickupTable();
    }

    function renderPickupTable() {
      // Period buttons: highlight the active one.
      document.querySelectorAll('#ph-periods button').forEach(b => {
        const on = b.getAttribute('data-period') === pickupFilters.period;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.className = 'px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ' +
          (on ? 'bg-rc-green border-rc-green text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-rc-green');
      });
      document.getElementById('ph-range').style.display = pickupFilters.period === 'custom' ? 'flex' : 'none';
      document.getElementById('ph-clear').style.display = filtersActive() ? 'inline-block' : 'none';

      const rows = filteredPickups();
      const tbody = document.getElementById('pickup-table-body');
      const summary = document.getElementById('ph-summary');
      const tires = rows.reduce((sum, p) => sum + (p.estimated_tire_count || 0), 0);
      summary.textContent = allPickups.length === 0 ? '' :
        'Showing ' + rows.length + ' of ' + allPickups.length + ' request' + (allPickups.length === 1 ? '' : 's') +
        ' (' + tires.toLocaleString() + ' tires)';

      if (allPickups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">No pickup requests yet. Submit one above!</td></tr>';
        return;
      }
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400">No requests match these filters. ' +
          '<button type="button" onclick="clearPickupFilters()" class="text-rc-green font-semibold hover:underline">Clear filters</button></td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(p =>
        '<tr class="border-b border-gray-50 hover:bg-gray-50">' +
          '<td class="px-6 py-4 text-sm font-bold text-rc-green whitespace-nowrap tabular-nums">' + (p.job_number ? 'J-' + p.job_number : '-') + '</td>' +
          '<td class="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">' + escHtml(prettyDay(createdYmd(p))) + '</td>' +
          '<td class="px-6 py-4 text-sm whitespace-nowrap">' + pickupDateCell(p) + '</td>' +
          '<td class="px-6 py-4 text-sm font-semibold text-gray-800">' + escHtml(p.estimated_tire_count || '-') + '</td>' +
          '<td class="px-6 py-4 text-sm text-gray-600">' + escHtml(TIRE_LABELS[p.tire_type] || p.tire_type || '-') + '</td>' +
          '<td class="px-6 py-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ' + (statusColors[p.status] || 'bg-gray-100 text-gray-800') + '">' +
            escHtml((p.status || 'pending').replace('_', ' ').toUpperCase()) + '</span></td>' +
          '<td class="px-6 py-4 text-sm text-gray-500">' + escHtml(p.notes || '-') + '</td>' +
        '</tr>'
      ).join('');
    }

    // Popup when a request moves to confirmed or scheduled. What the customer
    // has already acknowledged is remembered per browser, so each change pops
    // once; it is only marked seen when they press OK, so closing the tab
    // without reading it means it shows again next visit.
    const NOTICE_STATUSES = { confirmed: 'Confirmed', scheduled: 'Scheduled' };
    let pendingNotices = [];

    function noticeKey() {
      let id = 'me';
      try { id = JSON.parse(localStorage.getItem('rc_session') || '{}').user_id || 'me'; } catch (e) {}
      return 'rc_pickup_notices_' + id;
    }
    function readSeenNotices() {
      try { return JSON.parse(localStorage.getItem(noticeKey()) || '{}'); } catch (e) { return {}; }
    }

    function announcePickupUpdates(pickups) {
      const seen = readSeenNotices();
      pendingNotices = pickups.filter(p => NOTICE_STATUSES[p.status] && seen[p.id] !== p.status);
      if (pendingNotices.length === 0) return;

      const tireLabel = { passenger: 'passenger', truck: 'commercial truck', mixed: 'mixed', 'off-road': 'off-road' };
      document.getElementById('pickup-notice-title').textContent =
        pendingNotices.length === 1
          ? 'Your pickup has been ' + NOTICE_STATUSES[pendingNotices[0].status].toLowerCase()
          : 'Your pickups have been updated';
      document.getElementById('pickup-notice-body').innerHTML = pendingNotices.map(p =>
        '<div class="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3">' +
          '<i class="fas fa-circle-check text-rc-green mt-0.5"></i>' +
          '<div><p class="font-semibold text-gray-800">' + escHtml(NOTICE_STATUSES[p.status]) + ': ' +
            escHtml(p.estimated_tire_count || '') + ' ' + escHtml(tireLabel[p.tire_type] || '') + ' tires</p>' +
          (p.preferred_date ? '<p class="text-gray-800 font-semibold">Pickup date: ' + escHtml(prettyDay(p.preferred_date)) + '</p>' : '') +
          '<p class="text-gray-500">Requested ' + escHtml(String(p.created_at || '').slice(0, 10)) + '</p></div>' +
        '</div>'
      ).join('') +
        '<p>On the day of your pickup, we will send you a message with the approximate time.</p>';
      document.getElementById('pickup-notice-modal').style.display = 'flex';
    }

    function dismissPickupNotice() {
      const seen = readSeenNotices();
      pendingNotices.forEach(p => { seen[p.id] = p.status; });
      try { localStorage.setItem(noticeKey(), JSON.stringify(seen)); } catch (e) {}
      pendingNotices = [];
      document.getElementById('pickup-notice-modal').style.display = 'none';
    }

    // Check for updates while the page stays open, and when the tab comes back.
    setInterval(() => { if (!document.hidden && typeof axios !== 'undefined') loadPickups(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && typeof axios !== 'undefined') loadPickups(); });

    async function submitPickupRequest(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-pickup-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      try {
        const created = await axios.post('/api/customer/pickups', {
          estimated_tire_count: parseInt(document.getElementById('tire-count').value),
          tire_type: document.getElementById('tire-type').value,
          notes: document.getElementById('pickup-notes').value
        });
        document.getElementById('pickup-form').reset();
        loadPickups();
        // Show success
        btn.innerHTML = '<i class="fas fa-check"></i> Request Submitted!';
        btn.className = btn.className.replace('bg-rc-green', 'bg-green-500');
        const jobEl = document.getElementById('pickup-success-job');
        if (created.data && created.data.job_number) { jobEl.textContent = 'Your job number: J-' + created.data.job_number; jobEl.style.display = 'block'; }
        else jobEl.style.display = 'none';
        document.getElementById('pickup-success').style.display = 'flex';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Pickup Request';
          btn.className = btn.className.replace('bg-green-500', 'bg-rc-green');
        }, 2000);
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to submit request');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Pickup Request';
      }
    }

    // Safely call loadPickups — retry if axios isn't ready
    (function initCustomerDash() {
      if (typeof axios !== 'undefined') {
        loadPickups();
      } else {
        setTimeout(initCustomerDash, 500);
      }
    })();
  </script>
  `)
}
