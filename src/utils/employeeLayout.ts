// ── Employee Sidebar Navigation Component ──
export function employeeSidebar(activePage: string): string {
  // Role-based nav: drivers see less, yard_operators see scale-focused items
  const allNavItems = [
    { id: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', href: '/employee/dashboard', roles: ['admin','manager','yard_operator'] },
    { id: 'scale-house', icon: 'fas fa-balance-scale', label: 'Scale House', href: '/employee/scale-house', roles: ['admin','manager','yard_operator'] },
    { id: 'scale-tickets', icon: 'fas fa-receipt', label: 'Ticket History', href: '/employee/scale-tickets', roles: ['admin','manager','yard_operator'] },
    { id: 'pickups', icon: 'fas fa-truck-pickup', label: 'Pickup Requests', href: '/employee/pickups', roles: ['admin','manager'] },
    { id: 'routing', icon: 'fas fa-route', label: 'Routing', href: '/employee/routing', roles: ['admin','manager'] },
    { id: 'customers', icon: 'fas fa-users', label: 'Customers', href: '/employee/customers', roles: ['admin','manager'] },
    { id: 'drivers', icon: 'fas fa-id-badge', label: 'Drivers & Staff', href: '/employee/drivers', roles: ['admin','manager'] },
    { id: 'invoices', icon: 'fas fa-file-invoice-dollar', label: 'Invoices', href: '/employee/invoices', roles: ['admin','manager'] },
    { id: 'junk-removal', icon: 'fas fa-dumpster', label: 'Junk Removal Quoting', href: '/employee/junk-removal', roles: ['admin','manager','yard_operator'] },
  ];
  // Filter based on role stored in localStorage (checked client-side for nav visibility)
  const navItems = allNavItems;

  return `
  <!-- Mobile Header -->
  <div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-rc-green-dark text-white shadow-lg">
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <button onclick="toggleMobileSidebar()" class="text-xl"><i class="fas fa-bars"></i></button>
        <div class="flex items-center gap-2">
          <i class="fas fa-recycle text-rc-lime"></i>
          <span class="font-bold">REUSE CANADA</span>
        </div>
      </div>
      <button onclick="handleLogout()" class="text-sm opacity-80 hover:opacity-100">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    </div>
  </div>

  <!-- Sidebar Overlay (mobile) -->
  <div id="sidebar-overlay" class="lg:hidden fixed inset-0 bg-black/50 z-40 hidden" onclick="toggleMobileSidebar()"></div>

  <!-- Sidebar -->
  <aside id="sidebar" class="fixed left-0 top-0 bottom-0 w-64 rc-gradient-dark text-white z-50 transform -translate-x-full lg:translate-x-0 transition-transform duration-300">
    <div class="flex flex-col h-full">
      <!-- Logo -->
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-rc-lime/20 rounded-xl flex items-center justify-center ring-1 ring-white/10">
            <i class="fas fa-recycle text-xl text-rc-lime"></i>
          </div>
          <div>
            <div class="font-bold text-lg leading-tight">REUSE CANADA</div>
            <div class="text-xs text-green-200/60">Operations Portal</div>
          </div>
        </div>
      </div>

      <!-- User Info -->
      <div class="px-6 py-4 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-rc-lime/30 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-sm"></i>
          </div>
          <div>
            <div id="sidebar-user-name" class="text-sm font-semibold">Employee</div>
            <div id="sidebar-user-role" class="text-xs text-green-200/60">Role</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 overflow-y-auto">
        ${navItems.map(item => `
        <a href="${item.href}" data-roles="${item.roles.join(',')}"
          class="nav-role-item flex items-center gap-3 px-6 py-3 text-sm transition-all ${
            activePage === item.id
              ? 'bg-white/10 text-white border-l-[3px] border-rc-lime font-semibold rounded-r-lg'
              : 'text-green-100/70 hover:bg-white/8 hover:text-white hover:translate-x-0.5 transition-all duration-200'
          }">
          <i class="${item.icon} w-5 text-center"></i>
          <span>${item.label}</span>
        </a>
        `).join('')}
        
        <div class="my-4 mx-6 border-t border-white/10"></div>
        
        <a href="/employee/field-form" 
          class="flex items-center gap-3 px-6 py-3 text-sm transition-all ${
            activePage === 'field-form'
              ? 'bg-rc-orange/20 text-white border-l-[3px] border-rc-orange font-semibold rounded-r-lg'
              : 'text-orange-200/70 hover:bg-rc-orange/15 hover:text-white hover:translate-x-0.5 transition-all duration-200'
          }">
          <i class="fas fa-camera w-5 text-center"></i>
          <span>Field Form</span>
        </a>
      </nav>

      <!-- Live Driver Status Widget -->
      <div class="px-4 py-3 border-t border-white/10">
        <div class="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 bg-green-400 rounded-full pulse-green"></div>
            <span class="text-xs font-bold text-green-200 uppercase tracking-wide">Live Driver Status</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" onclick="openDriverStatus('on_road')" title="See who is on the road" class="bg-green-500/20 hover:bg-green-500/30 rounded-lg p-2 text-center btn-press transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
              <div class="text-lg font-bold text-green-300" id="sidebar-drivers-on-road">-</div>
              <div class="text-[10px] text-green-200/70 uppercase font-semibold">On Road</div>
            </button>
            <button type="button" onclick="openDriverStatus('idle')" title="See who is idle at the yard" class="bg-blue-500/20 hover:bg-blue-500/30 rounded-lg p-2 text-center btn-press transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
              <div class="text-lg font-bold text-blue-300" id="sidebar-drivers-idle">-</div>
              <div class="text-[10px] text-blue-200/70 uppercase font-semibold">Idle at Yard</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Logout -->
      <div class="p-4 border-t border-white/10">
        <button onclick="handleLogout()" 
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-100/70 hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-all">
          <i class="fas fa-sign-out-alt w-5 text-center"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- Who is behind the Live Driver Status counts -->
  <div id="driver-status-modal" class="fixed inset-0 bg-black/50 z-[60] items-center justify-center p-4" style="display:none;" onclick="if (event.target === this) closeDriverStatus()">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col modal-enter">
      <div class="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800" id="driver-status-title">Drivers</h3>
        <button onclick="closeDriverStatus()" class="text-gray-400 hover:text-gray-600" title="Close"><i class="fas fa-times text-xl"></i></button>
      </div>
      <div class="px-5 pt-4">
        <div class="inline-flex bg-gray-100 rounded-xl p-1 w-full">
          <button type="button" id="ds-tab-on_road" onclick="setDriverStatusTab('on_road')" class="flex-1 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">On Road</button>
          <button type="button" id="ds-tab-idle" onclick="setDriverStatusTab('idle')" class="flex-1 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">Idle at Yard</button>
        </div>
      </div>
      <div class="p-5 overflow-y-auto flex-1" id="driver-status-list">
        <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading drivers...</div>
      </div>
    </div>
  </div>

  <script>
    function toggleMobileSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    }

    // Live driver status polling
    function loadDriverStatus() {
      if (typeof axios === 'undefined') { setTimeout(loadDriverStatus, 500); return; }
      axios.get('/api/employee/driver-status-summary').then(res => {
        const d = res.data;
        const onRoadEl = document.getElementById('sidebar-drivers-on-road');
        const idleEl = document.getElementById('sidebar-drivers-idle');
        if (onRoadEl) onRoadEl.textContent = d.on_road || 0;
        if (idleEl) idleEl.textContent = d.idle || 0;
      }).catch(err => console.warn('[DriverStatus]', err));
    }
    // ── Who is behind those counts ────────────────────────────────────────
    var driverStatusTab = 'on_road';
    var driverStatusRows = [];

    function openDriverStatus(tab) {
      driverStatusTab = tab || 'on_road';
      document.getElementById('driver-status-modal').style.display = 'flex';
      paintDriverStatusTabs();
      loadDriverStatusList();
    }

    function closeDriverStatus() {
      document.getElementById('driver-status-modal').style.display = 'none';
    }

    function setDriverStatusTab(tab) {
      driverStatusTab = tab;
      paintDriverStatusTabs();
      renderDriverStatusList();
    }

    function paintDriverStatusTabs() {
      ['on_road', 'idle'].forEach(function (t) {
        var el = document.getElementById('ds-tab-' + t);
        if (!el) return;
        el.className = 'flex-1 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ' +
          (t === driverStatusTab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700');
      });
      var title = document.getElementById('driver-status-title');
      if (title) title.textContent = driverStatusTab === 'on_road' ? 'On the road' : 'Idle at the yard';
    }

    function loadDriverStatusList() {
      if (typeof axios === 'undefined') { setTimeout(loadDriverStatusList, 300); return; }
      axios.get('/api/employee/driver-status-list').then(function (res) {
        driverStatusRows = res.data.drivers || [];
        renderDriverStatusList();
      }).catch(function (err) {
        console.warn('[DriverStatus]', err);
        document.getElementById('driver-status-list').innerHTML =
          '<p class="text-center py-8 text-sm text-gray-400">Could not load drivers.</p>';
      });
    }

    function driverStatusAgo(ts) {
      if (!ts) return 'no check-in yet';
      var then = new Date(ts.replace(' ', 'T') + (ts.indexOf('Z') === -1 ? 'Z' : ''));
      var mins = Math.floor((Date.now() - then.getTime()) / 60000);
      if (isNaN(mins)) return 'no check-in yet';
      if (mins < 1) return 'just now';
      if (mins < 60) return mins + ' min ago';
      var hrs = Math.floor(mins / 60);
      if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
      return Math.floor(hrs / 24) + 'd ago';
    }

    function renderDriverStatusList() {
      var el = document.getElementById('driver-status-list');
      if (!el) return;
      var rows = driverStatusRows.filter(function (d) {
        return driverStatusTab === 'on_road' ? d.status === 'on_road' : d.status !== 'on_road';
      });

      if (rows.length === 0) {
        el.innerHTML = '<p class="text-center py-8 text-sm text-gray-400">' +
          (driverStatusTab === 'on_road' ? 'Nobody is out on the road right now.' : 'Nobody is idle at the yard right now.') +
          '</p>';
        return;
      }

      el.innerHTML = rows.map(function (d) {
        var name = ((d.first_name || '') + ' ' + (d.last_name || '')).trim() || 'Unnamed driver';
        var onRoad = d.status === 'on_road';
        var dot = onRoad ? 'bg-green-500' : 'bg-blue-400';
        var route = d.route_name
          ? '<div class="text-xs text-gray-500 mt-0.5"><i class="fas fa-route mr-1"></i>' + escHtml(d.route_name) + (d.route_date ? ' &middot; ' + escHtml(d.route_date) : '') + '</div>'
          : '';
        var phone = d.phone
          ? '<a href="tel:' + escHtml(d.phone) + '" class="text-xs text-rc-green font-semibold hover:underline"><i class="fas fa-phone mr-1"></i>' + escHtml(d.phone) + '</a>'
          : '<span class="text-xs text-gray-300">No phone</span>';
        return '<div class="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">' +
            '<span class="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ' + dot + '"></span>' +
            '<div class="min-w-0 flex-1">' +
              '<div class="font-semibold text-gray-800 text-sm">' + escHtml(name) +
                '<span class="ml-2 text-[10px] font-bold uppercase text-gray-400">' + escHtml(d.role || '') + '</span>' +
              '</div>' +
              route +
              '<div class="text-[11px] text-gray-400 mt-0.5">Last update: ' + escHtml(driverStatusAgo(d.last_updated)) + '</div>' +
            '</div>' +
            '<div class="text-right flex-shrink-0">' + phone + '</div>' +
          '</div>';
      }).join('');
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var m = document.getElementById('driver-status-modal');
      if (m && m.style.display === 'flex') closeDriverStatus();
    });

    // Load immediately and poll every 30 seconds
    setTimeout(loadDriverStatus, 1000);
    setInterval(loadDriverStatus, 30000);
  </script>
  `
}

export function employeePageWrapper(activePage: string, pageTitle: string, content: string): string {
  return `
  ${employeeSidebar(activePage)}

  <!-- Auth & Axios interceptor — MUST run before any page scripts that call APIs -->
  <script>
    // Auth check
    const session = JSON.parse(localStorage.getItem('rc_session') || '{}');
    if (!session.token || session.user_type !== 'employee') {
      window.location.href = '/login';
    }

    // Axios auth interceptor — adds Bearer token to every request
    // Safety check in case CDN hasn't loaded yet
    function setupAxiosInterceptors() {
      if (typeof axios === 'undefined') {
        setTimeout(setupAxiosInterceptors, 200);
        return;
      }
      axios.interceptors.request.use(config => {
        const s = JSON.parse(localStorage.getItem('rc_session') || '{}');
        if (s.token) config.headers.Authorization = 'Bearer ' + s.token;
        return config;
      });
      axios.interceptors.response.use(r => r, err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('rc_session');
          window.location.href = '/login';
        }
        return Promise.reject(err);
      });
    }
    setupAxiosInterceptors();

    function handleLogout() {
      localStorage.removeItem('rc_session');
      window.location.href = '/login';
    }
  </script>
  
  <!-- Main Content -->
  <main class="lg:ml-64 min-h-screen pt-14 lg:pt-0">
    <!-- Top bar -->
    <div class="bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 py-4 sticky top-0 lg:top-0 z-30">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold tracking-tight text-gray-900">${pageTitle}</h1>
        <div class="flex items-center gap-4">
          <!-- Per-page header actions. Pages fill this in; it stays empty otherwise. -->
          <div id="page-header-actions" class="flex items-center gap-2"></div>
          <span class="text-sm text-gray-500" id="current-datetime"></span>
          <div class="w-2 h-2 bg-green-400 rounded-full pulse-green" title="Connected"></div>
        </div>
      </div>
    </div>
    
    <!-- Page Content -->
    <div class="p-6">
      ${content}
    </div>
  </main>

  <script>
    // Set user info in sidebar
    document.getElementById('sidebar-user-name').textContent = session.name || 'Employee';
    document.getElementById('sidebar-user-role').textContent = (session.role || 'staff').replace('_', ' ').toUpperCase();

    // Role-based nav filtering
    const userRole = session.role || 'yard_operator';
    document.querySelectorAll('.nav-role-item').forEach(el => {
      const allowedRoles = (el.getAttribute('data-roles') || '').split(',');
      if (!allowedRoles.includes(userRole)) el.style.display = 'none';
    });

    // Kiosk mode detection
    if (window.location.search.includes('kiosk')) {
      document.body.classList.add('kiosk-mode');
    }
    
    // Update datetime
    function updateDateTime() {
      const now = new Date();
      document.getElementById('current-datetime').textContent = now.toLocaleString('en-CA', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    updateDateTime();
    setInterval(updateDateTime, 60000);
  </script>
  `
}
