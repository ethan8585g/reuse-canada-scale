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
            <div class="bg-green-500/20 rounded-lg p-2 text-center">
              <div class="text-lg font-bold text-green-300" id="sidebar-drivers-on-road">-</div>
              <div class="text-[10px] text-green-200/70 uppercase font-semibold">On Road</div>
            </div>
            <div class="bg-blue-500/20 rounded-lg p-2 text-center">
              <div class="text-lg font-bold text-blue-300" id="sidebar-drivers-idle">-</div>
              <div class="text-[10px] text-blue-200/70 uppercase font-semibold">Idle at Yard</div>
            </div>
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
        console.warn('[RC-Auth] Axios not loaded yet, retrying in 200ms...');
        setTimeout(setupAxiosInterceptors, 200);
        return;
      }
      console.log('[RC-Auth] Setting up Axios interceptors with auth token');
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
