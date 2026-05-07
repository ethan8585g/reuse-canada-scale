import { layout } from '../utils/layout'

export function renderDriverPortal(): string {
  return layout('Driver Portal', `
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Driver Sidebar -->
    <aside id="driver-sidebar" class="fixed lg:static inset-y-0 left-0 z-50 w-64 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 ease-in-out">
      <div class="h-full flex flex-col bg-gradient-to-b from-rc-green via-green-800 to-rc-gray shadow-2xl">
        <!-- Logo -->
        <div class="px-6 pt-6 pb-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i class="fas fa-recycle text-xl text-white"></i>
            </div>
            <div>
              <div class="text-white font-bold text-sm tracking-wider">REUSE CANADA</div>
              <div class="text-green-200 text-xs">Driver Portal</div>
            </div>
          </div>
        </div>

        <!-- Driver Info -->
        <div class="px-6 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-white text-sm"></i>
            </div>
            <div>
              <div class="text-white text-sm font-semibold" id="sidebar-driver-name">Driver</div>
              <div class="text-green-300 text-xs" id="sidebar-driver-role">Driver</div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-4 overflow-y-auto">
          <div class="space-y-1">
            <a href="#" onclick="showDriverTab('dashboard')" id="nav-dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-white/15 font-semibold text-sm">
              <i class="fas fa-tachometer-alt w-5 text-center"></i> Dashboard
            </a>
            <a href="#" onclick="showDriverTab('pickups')" id="nav-pickups" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-truck-pickup w-5 text-center"></i> My Pickups
            </a>
            <a href="#" onclick="showDriverTab('routes')" id="nav-routes" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-route w-5 text-center"></i> Routes
            </a>
            <a href="#" onclick="showDriverTab('scaletickets')" id="nav-scaletickets" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-weight w-5 text-center"></i> Scale Tickets
            </a>
            <a href="/employee/field-form?from=driver" id="nav-fieldform" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm">
              <i class="fas fa-camera w-5 text-center"></i> Field Form
            </a>
          </div>
        </nav>

        <!-- Sign Out -->
        <div class="p-4 border-t border-white/10">
          <button onclick="handleDriverLogout()" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-semibold transition-colors">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile header -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-rc-green text-white px-4 py-3 flex items-center justify-between shadow-lg">
      <button onclick="toggleDriverSidebar()" class="text-white text-xl"><i class="fas fa-bars"></i></button>
      <div class="font-bold">Driver Portal</div>
      <span class="text-xs text-green-200" id="mobile-driver-name"></span>
    </div>
    <div class="lg:hidden fixed inset-0 bg-black/50 z-40" id="driver-sidebar-overlay" style="display:none" onclick="toggleDriverSidebar()"></div>

    <!-- Main Content -->
    <main class="flex-1 lg:ml-0 min-h-screen">
      <div class="pt-16 lg:pt-0 p-4 lg:p-6 max-w-6xl mx-auto">

        <!-- Top Bar -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800" id="page-title">Dashboard</h1>
            <p class="text-sm text-gray-500" id="page-date"></p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Status Toggle -->
            <div class="flex items-center gap-2 bg-white rounded-xl shadow-sm border px-3 py-2">
              <span class="text-xs font-semibold text-gray-500">Status:</span>
              <button onclick="setDriverStatus('idle')" id="btn-idle" class="px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all">
                <i class="fas fa-warehouse mr-1"></i> Yard
              </button>
              <button onclick="setDriverStatus('on_road')" id="btn-onroad" class="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-all">
                <i class="fas fa-road mr-1"></i> On Road
              </button>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: DASHBOARD ═══ -->
        <div id="tab-dashboard">
          <!-- Stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">Assigned Pickups</div>
              <div class="text-2xl font-bold text-yellow-600 mt-1" id="d-stat-pickups">-</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">In Progress</div>
              <div class="text-2xl font-bold text-orange-600 mt-1" id="d-stat-inprogress">-</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">Completed Today</div>
              <div class="text-2xl font-bold text-green-600 mt-1" id="d-stat-completed">-</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div class="text-sm text-gray-500">My Status</div>
              <div class="text-2xl font-bold mt-1" id="d-stat-status">Idle</div>
            </div>
          </div>

          <!-- Assigned Pickups Quick List -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800 flex items-center gap-2">
                <i class="fas fa-tasks text-rc-green"></i> My Assigned Pickups
              </h2>
              <button onclick="loadDriverDashboard()" class="text-gray-400 hover:text-gray-600 text-sm"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div id="dashboard-pickups" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: MY PICKUPS ═══ -->
        <div id="tab-pickups" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800"><i class="fas fa-truck-pickup text-rc-green mr-2"></i> My Assigned Pickups</h2>
              <button onclick="loadDriverPickups()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div id="pickups-list" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: ROUTES ═══ -->
        <div id="tab-routes" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800"><i class="fas fa-route text-blue-600 mr-2"></i> My Routes</h2>
              <button onclick="loadDriverRoutes()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
            </div>
            <div id="routes-list" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: SCALE TICKETS (NO REVENUE) ═══ -->
        <div id="tab-scaletickets" style="display:none">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 class="font-bold text-gray-800"><i class="fas fa-weight text-rc-orange mr-2"></i> Scale Tickets</h2>
              <div class="flex items-center gap-2">
                <button onclick="loadDriverScaleTickets()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-sync-alt"></i></button>
                <a href="/employee/field-form?from=driver" class="px-3 py-1.5 bg-rc-orange text-white text-sm font-semibold rounded-lg hover:bg-rc-orange-light transition-all">
                  <i class="fas fa-plus mr-1"></i> New Field Form
                </a>
              </div>
            </div>
            <div id="scaletickets-list" class="divide-y divide-gray-50">
              <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- Upload Proof of Work Modal -->
    <div id="proof-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-camera mr-2 text-rc-green"></i>Proof of Pickup</h3>
          <button onclick="closeProofModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-5">
          <p class="text-sm text-gray-500 mb-4">Take a photo of the cage/bin to confirm pickup. GPS location and timestamp will be recorded automatically.</p>
          <input type="hidden" id="proof-pickup-id">
          <div class="mb-4">
            <div id="proof-photo-area" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 cursor-pointer hover:border-rc-green hover:bg-green-50 transition-all" onclick="triggerProofCamera()">
              <i class="fas fa-camera text-4xl text-gray-300 mb-3"></i>
              <p class="text-gray-500 font-semibold text-sm">Tap to Take Photo</p>
              <p class="text-gray-400 text-xs">of cage/bin at location</p>
            </div>
            <img id="proof-preview" class="hidden w-full rounded-xl border-2 border-rc-green mt-2" alt="Proof photo">
            <input type="file" id="proof-camera" accept="image/*" capture="environment" class="hidden" onchange="handleProofPhoto(event)">
          </div>
          <div class="bg-blue-50 rounded-xl p-3 mb-4">
            <div class="flex items-center gap-2 text-sm text-blue-700">
              <i class="fas fa-map-marker-alt"></i>
              <span id="proof-gps-status">Getting GPS location...</span>
            </div>
            <div class="text-xs text-blue-500 mt-1" id="proof-gps-coords"></div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea id="proof-notes" rows="2" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none" placeholder="Any notes about the pickup..."></textarea>
          </div>
          <button onclick="submitProof()" id="proof-submit-btn" class="w-full bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50" disabled>
            <i class="fas fa-check mr-1"></i> Submit Proof & Notify Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Success Toast -->
    <div id="proof-toast" class="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform translate-x-full transition-transform duration-300">
      <div class="flex items-center gap-3">
        <i class="fas fa-check-circle text-xl"></i>
        <div>
          <div class="font-bold text-sm">Proof Submitted!</div>
          <div class="text-xs text-green-100" id="proof-toast-msg">Customer notified</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // ═══ AUTH CHECK ═══
    const session = JSON.parse(localStorage.getItem('rc_session') || '{}');
    if (!session.token || session.user_type !== 'employee') {
      window.location.href = '/login';
    }

    // Axios setup
    function setupDriverAxios() {
      if (typeof axios === 'undefined') { setTimeout(setupDriverAxios, 200); return; }
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
    setupDriverAxios();

    // Set names
    document.getElementById('sidebar-driver-name').textContent = session.name || 'Driver';
    document.getElementById('sidebar-driver-role').textContent = (session.role || 'driver').replace('_',' ');
    document.getElementById('mobile-driver-name').textContent = session.name || '';
    document.getElementById('page-date').textContent = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    let proofPhotoData = null;
    let proofLat = null;
    let proofLng = null;

    // ═══ SIDEBAR TOGGLE (mobile) ═══
    function toggleDriverSidebar() {
      const sidebar = document.getElementById('driver-sidebar');
      const overlay = document.getElementById('driver-sidebar-overlay');
      const isOpen = !sidebar.classList.contains('-translate-x-full');
      if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        overlay.style.display = 'none';
      } else {
        sidebar.classList.remove('-translate-x-full');
        overlay.style.display = 'block';
      }
    }

    function handleDriverLogout() {
      localStorage.removeItem('rc_session');
      window.location.href = '/login';
    }

    // ═══ TAB NAVIGATION ═══
    const tabs = ['dashboard', 'pickups', 'routes', 'scaletickets'];
    function showDriverTab(tab) {
      tabs.forEach(t => {
        document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
        const nav = document.getElementById('nav-' + t);
        if (nav) {
          if (t === tab) {
            nav.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-white/15 font-semibold text-sm';
          } else {
            nav.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm';
          }
        }
      });
      const titles = { dashboard: 'Dashboard', pickups: 'My Pickups', routes: 'Routes', scaletickets: 'Scale Tickets' };
      document.getElementById('page-title').textContent = titles[tab] || 'Dashboard';
      // Load data for the tab
      if (tab === 'dashboard') loadDriverDashboard();
      if (tab === 'pickups') loadDriverPickups();
      if (tab === 'routes') loadDriverRoutes();
      if (tab === 'scaletickets') loadDriverScaleTickets();
      // Close mobile sidebar
      const sidebar = document.getElementById('driver-sidebar');
      if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        toggleDriverSidebar();
      }
      return false;
    }

    // ═══ DRIVER STATUS ═══
    async function setDriverStatus(status) {
      try {
        await axios.post('/api/employee/driver-status', {
          employee_id: session.user_id,
          status: status
        });
        updateStatusUI(status);
      } catch (err) { console.error(err); }
    }

    function updateStatusUI(status) {
      const btnIdle = document.getElementById('btn-idle');
      const btnOnRoad = document.getElementById('btn-onroad');
      const statusEl = document.getElementById('d-stat-status');
      if (status === 'on_road') {
        btnOnRoad.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-green-500 text-white';
        btnIdle.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-all';
        statusEl.textContent = 'On Road';
        statusEl.className = 'text-2xl font-bold mt-1 text-green-600';
      } else {
        btnIdle.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-blue-500 text-white';
        btnOnRoad.className = 'px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700 transition-all';
        statusEl.textContent = 'Idle at Yard';
        statusEl.className = 'text-2xl font-bold mt-1 text-blue-600';
      }
    }

    // ═══ DASHBOARD ═══
    async function loadDriverDashboard() {
      try {
        const res = await axios.get('/api/pickups?status=scheduled,in_progress,completed');
        const all = (res.data.pickups || []).filter(p => p.assigned_employee_id === session.user_id);
        const today = new Date().toISOString().split('T')[0];
        const assigned = all.filter(p => p.status === 'scheduled' || p.status === 'in_progress');
        const inProg = all.filter(p => p.status === 'in_progress');
        const completedToday = all.filter(p => p.status === 'completed' && p.updated_at && p.updated_at.startsWith(today));

        document.getElementById('d-stat-pickups').textContent = assigned.length;
        document.getElementById('d-stat-inprogress').textContent = inProg.length;
        document.getElementById('d-stat-completed').textContent = completedToday.length;

        renderPickupCards(assigned, 'dashboard-pickups', true);
      } catch (err) { console.error(err); }
    }

    // ═══ PICKUPS TAB ═══
    async function loadDriverPickups() {
      try {
        const res = await axios.get('/api/pickups?status=scheduled,in_progress');
        const pickups = (res.data.pickups || []).filter(p => p.assigned_employee_id === session.user_id);
        renderPickupCards(pickups, 'pickups-list', false);
      } catch (err) { console.error(err); }
    }

    function renderPickupCards(pickups, containerId, compact) {
      const container = document.getElementById(containerId);
      if (pickups.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-inbox text-3xl mb-2 block"></i>No assigned pickups</div>';
        return;
      }
      container.innerHTML = pickups.map(p => \`
        <div class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="font-bold text-gray-800">\${escHtml(p.company_name || 'Unknown')}</div>
              <div class="text-xs text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>\${escHtml(p.address || '')}, \${escHtml(p.city || '')}</div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${p.status === 'in_progress' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}">
              \${escHtml((p.status || '').replace('_',' ').toUpperCase())}
            </span>
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fas fa-tire mr-1"></i>\${escHtml(p.estimated_tire_count || '?')} tires</span>
            <span><i class="fas fa-calendar mr-1"></i>\${escHtml(p.preferred_date || 'Today')}</span>
            \${p.tire_type ? '<span><i class="fas fa-tag mr-1"></i>' + escHtml(p.tire_type) + '</span>' : ''}
          </div>
          <div class="flex gap-2">
            \${p.status === 'scheduled' ? \`
              <button onclick="startPickup(\${p.id})" class="flex-1 px-3 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200">
                <i class="fas fa-truck mr-1"></i> Start Pickup
              </button>
            \` : ''}
            <button onclick="openProofModal(\${p.id}, '\${(p.company_name || '').replace(/[\\\\'"<>]/g, '')}')" class="flex-1 px-3 py-2 bg-rc-green text-white text-sm font-semibold rounded-lg hover:bg-rc-green-light">
              <i class="fas fa-camera mr-1"></i> Upload Proof
            </button>
            \${p.status === 'in_progress' ? \`
              <button onclick="completePickup(\${p.id})" class="px-3 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200">
                <i class="fas fa-check"></i> Done
              </button>
            \` : ''}
            <a href="/employee/field-form?pickup_id=\${p.id}&from=driver" class="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 text-center">
              <i class="fas fa-camera"></i>
            </a>
          </div>
        </div>
      \`).join('');
    }

    async function startPickup(id) {
      try {
        await axios.post('/api/pickups/' + id + '/status', { status: 'in_progress' });
        setDriverStatus('on_road');
        loadDriverDashboard();
        loadDriverPickups();
      } catch (err) { alert('Failed to start pickup'); }
    }

    async function completePickup(id) {
      if (!confirm('Mark this pickup as completed?')) return;
      try {
        await axios.post('/api/pickups/' + id + '/status', { status: 'completed' });
        loadDriverDashboard();
        loadDriverPickups();
      } catch (err) { alert('Failed to complete pickup'); }
    }

    // ═══ ROUTES TAB ═══
    async function loadDriverRoutes() {
      try {
        const res = await axios.get('/api/routes');
        const routes = (res.data.routes || []).filter(r => r.assigned_employee_id === session.user_id);
        const container = document.getElementById('routes-list');

        if (routes.length === 0) {
          container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-map-signs text-3xl mb-2 block"></i>No routes assigned to you</div>';
          return;
        }

        container.innerHTML = routes.map(r => {
          const statusColors = { planned: 'bg-blue-100 text-blue-700', in_progress: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700' };
          return \`
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between mb-2">
              <div>
                <div class="font-bold text-gray-800">\${escHtml(r.name || 'Route')}</div>
                <div class="text-xs text-gray-500"><i class="fas fa-calendar mr-1"></i>\${escHtml(r.date || '')}</div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${statusColors[r.status] || 'bg-gray-100 text-gray-600'}">
                \${escHtml((r.status || 'planned').replace('_',' ').toUpperCase())}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500">
              \${r.total_distance_km ? '<span><i class="fas fa-road mr-1"></i>' + escHtml(r.total_distance_km) + ' km</span>' : ''}
              \${r.total_duration_minutes ? '<span><i class="fas fa-clock mr-1"></i>' + escHtml(r.total_duration_minutes) + ' min</span>' : ''}
              <span><i class="fas fa-truck mr-1"></i>\${escHtml(r.vehicle || 'No vehicle')}</span>
            </div>
          </div>
          \`;
        }).join('');
      } catch (err) {
        console.error(err);
        document.getElementById('routes-list').innerHTML = '<div class="p-6 text-center text-red-400">Failed to load routes</div>';
      }
    }

    // ═══ SCALE TICKETS TAB (NO REVENUE/PRICING DATA) ═══
    async function loadDriverScaleTickets() {
      try {
        const res = await axios.get('/api/scale-tickets');
        // Show all tickets but filter to those the driver was involved in (or all field tickets)
        const tickets = (res.data.tickets || []).filter(t => 
          t.employee_id === session.user_id || t.status === 'field_pending' || t.status === 'field_complete'
        );
        const container = document.getElementById('scaletickets-list');

        if (tickets.length === 0) {
          container.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-receipt text-3xl mb-2 block"></i>No scale tickets found</div>';
          return;
        }

        const statusColors = {
          field_pending: 'bg-yellow-100 text-yellow-800',
          field_complete: 'bg-blue-100 text-blue-800',
          weighed_in: 'bg-purple-100 text-purple-800',
          completed: 'bg-green-100 text-green-800',
          voided: 'bg-red-100 text-red-800'
        };

        container.innerHTML = tickets.slice(0, 30).map(t => \`
          <div class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-center justify-between mb-1">
              <div>
                <div class="font-mono text-sm font-bold text-rc-green">\${escHtml(t.ticket_number)}</div>
                <div class="text-xs text-gray-500">\${escHtml(t.company_name || t.field_store_name || 'Walk-in')}</div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${statusColors[t.status] || 'bg-gray-100 text-gray-600'}">
                \${escHtml((t.status || '').replace(/_/g,' ').toUpperCase())}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span><i class="fas fa-tag mr-1"></i>\${(t.tire_type || 'mixed').replace('_',' ')}</span>
              \${t.net_weight ? '<span><i class="fas fa-weight mr-1"></i>' + parseFloat(t.net_weight).toFixed(1) + ' kg</span>' : '<span class="text-yellow-600">Pending weigh</span>'}
              <span><i class="fas fa-clock mr-1"></i>\${t.created_at ? new Date(t.created_at).toLocaleDateString('en-CA') : ''}</span>
            </div>
          </div>
        \`).join('');
        // NOTE: No pricing, revenue, or payment data is shown to drivers
      } catch (err) {
        console.error(err);
        document.getElementById('scaletickets-list').innerHTML = '<div class="p-6 text-center text-red-400">Failed to load tickets</div>';
      }
    }

    // ═══ PROOF OF WORK ═══
    function triggerProofCamera() {
      document.getElementById('proof-camera').click();
    }

    function openProofModal(pickupId, customerName) {
      document.getElementById('proof-pickup-id').value = pickupId;
      proofPhotoData = null;
      proofLat = null;
      proofLng = null;
      document.getElementById('proof-preview').classList.add('hidden');
      document.getElementById('proof-photo-area').classList.remove('hidden');
      document.getElementById('proof-notes').value = '';
      document.getElementById('proof-submit-btn').disabled = true;
      document.getElementById('proof-camera').value = '';
      document.getElementById('proof-modal').style.display = 'flex';
      // Get GPS
      if (navigator.geolocation) {
        document.getElementById('proof-gps-status').textContent = 'Getting GPS location...';
        navigator.geolocation.getCurrentPosition(
          pos => {
            proofLat = pos.coords.latitude;
            proofLng = pos.coords.longitude;
            document.getElementById('proof-gps-status').textContent = 'Location captured';
            document.getElementById('proof-gps-coords').textContent = proofLat.toFixed(6) + ', ' + proofLng.toFixed(6);
          },
          err => {
            document.getElementById('proof-gps-status').textContent = 'GPS unavailable - will use timestamp only';
            document.getElementById('proof-gps-coords').textContent = '';
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        document.getElementById('proof-gps-status').textContent = 'GPS not supported on this device';
      }
    }

    function closeProofModal() {
      document.getElementById('proof-modal').style.display = 'none';
    }

    function handleProofPhoto(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Compress image for mobile uploads
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          // Resize if too large (max 1200px wide)
          const maxWidth = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          // Drop quality progressively if the encoded photo exceeds the
          // server's 800,000-char cap (matches src/utils/photo.ts).
          const MAX_PHOTO_LEN = 800_000;
          let q = 0.8;
          proofPhotoData = canvas.toDataURL('image/jpeg', q);
          while (proofPhotoData.length > MAX_PHOTO_LEN && q > 0.2) {
            q -= 0.15;
            proofPhotoData = canvas.toDataURL('image/jpeg', q);
          }
          if (proofPhotoData.length > MAX_PHOTO_LEN) {
            alert('Photo is too large even at low quality — please re-take with the camera framed tighter.');
            proofPhotoData = null;
            return;
          }

          document.getElementById('proof-preview').src = proofPhotoData;
          document.getElementById('proof-preview').classList.remove('hidden');
          document.getElementById('proof-photo-area').classList.add('hidden');
          document.getElementById('proof-submit-btn').disabled = false;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    async function submitProof() {
      const btn = document.getElementById('proof-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Submitting...';
      try {
        const res = await axios.post('/api/employee/pickup-proof', {
          pickup_request_id: parseInt(document.getElementById('proof-pickup-id').value),
          photo_data: proofPhotoData,
          latitude: proofLat,
          longitude: proofLng,
          notes: document.getElementById('proof-notes').value
        });
        closeProofModal();
        // Show toast
        const toast = document.getElementById('proof-toast');
        document.getElementById('proof-toast-msg').textContent = res.data.message || 'Customer notified';
        toast.style.transform = 'translateX(0)';
        setTimeout(() => { toast.style.transform = 'translateX(150%)'; }, 4000);
        loadDriverDashboard();
        loadDriverPickups();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to submit proof');
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check mr-1"></i> Submit Proof & Notify Customer';
    }

    // ═══ INIT ═══
    (function init() {
      if (typeof axios !== 'undefined') { loadDriverDashboard(); }
      else { setTimeout(init, 500); }
    })();
  </script>
  `)
}
