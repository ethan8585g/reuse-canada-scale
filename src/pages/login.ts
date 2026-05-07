import { layout } from '../utils/layout'

export function renderLogin(): string {
  return layout('Login', `
  <div class="min-h-screen rc-gradient flex items-center justify-center p-4">
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.3&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    </div>
    
    <div class="relative z-10 w-full max-w-md">
      <!-- Roof Measurement Report promo banner -->
      <div class="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 transition-all">
        <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-rc-orange/90 flex items-center justify-center shadow-sm">
          <i class="fas fa-house-chimney text-white text-sm"></i>
        </div>
        <div class="flex-1 min-w-0 leading-tight">
          <p class="text-sm font-semibold">Roof Measurement Reports</p>
          <p class="text-xs text-white/70">Accurate, contractor-ready &mdash; from <span class="font-semibold text-white">$5.95</span> per report.</p>
        </div>
      </div>

      <!-- Logo & Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
          <i class="fas fa-recycle text-4xl text-rc-green"></i>
        </div>
        <h1 class="text-4xl font-bold text-white mb-2">REUSE CANADA</h1>
        <p class="text-green-100 text-lg">Operations & CRM Platform</p>
      </div>

      <!-- CUSTOMER LOGIN (shown by default) -->
      <div id="customer-login-card" class="glass rounded-2xl shadow-2xl overflow-hidden card-hover transition-all duration-300">
        <div class="bg-rc-green p-6 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
            <i class="fas fa-store text-3xl text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-white">Customer Portal</h2>
          <p class="text-green-100 text-sm mt-1">Request tire pickups & track status</p>
        </div>
        <div class="p-8">
          <div id="customer-error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"></div>
          <form id="customer-login-form" onsubmit="handleCustomerLogin(event)">
            <div class="mb-5">
              <label for="customer-email" class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-user mr-1 text-rc-green"></i> Username
              </label>
              <input type="text" id="customer-email" name="username" required
                autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 transition-all outline-none"
                placeholder="Enter your username">
            </div>
            <div class="mb-6">
              <label for="customer-password" class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-lock mr-1 text-rc-green"></i> Password
              </label>
              <div class="relative">
                <input type="password" id="customer-password" name="password" required
                  autocomplete="current-password"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter your password">
                <button type="button" onclick="togglePassword('customer-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button type="submit" id="customer-login-btn"
              class="w-full bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              <i class="fas fa-sign-in-alt"></i>
              Sign In to Customer Portal
            </button>
          </form>
          <div class="mt-4 text-center">
            <a href="#" onclick="showRegister('customer')" class="text-rc-green hover:text-rc-green-light text-sm font-medium">
              <i class="fas fa-user-plus mr-1"></i> New customer? Request access
            </a>
          </div>
        </div>
      </div>

      <!-- EMPLOYEE LOGIN (hidden by default) -->
      <div id="employee-login-card" class="glass rounded-2xl shadow-2xl overflow-hidden card-hover transition-all duration-300" style="display:none">
        <div class="bg-rc-gray p-6 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-3">
            <i class="fas fa-hard-hat text-3xl text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-white">Employee Portal</h2>
          <p class="text-gray-300 text-sm mt-1">Scale tickets, routing & operations</p>
        </div>
        <div class="p-8">
          <div id="employee-error" class="hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"></div>
          <form id="employee-login-form" onsubmit="handleEmployeeLogin(event)">
            <div class="mb-5">
              <label for="employee-email" class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-envelope mr-1 text-rc-gray"></i> Employee Email
              </label>
              <input type="email" id="employee-email" name="username" required
                autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="email"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-gray focus:ring-2 focus:ring-gray-100 transition-all outline-none"
                placeholder="name@reuse-canada.ca">
            </div>
            <div class="mb-6">
              <label for="employee-password" class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-lock mr-1 text-rc-gray"></i> Password
              </label>
              <div class="relative">
                <input type="password" id="employee-password" name="password" required
                  autocomplete="current-password"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-gray focus:ring-2 focus:ring-gray-100 transition-all outline-none"
                  placeholder="Enter your password">
                <button type="button" onclick="togglePassword('employee-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button type="submit" id="employee-login-btn"
              class="w-full bg-rc-gray hover:bg-rc-gray-light text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              <i class="fas fa-sign-in-alt"></i>
              Sign In to Employee Portal
            </button>
          </form>
          <div class="mt-4 text-center text-gray-400 text-xs">
            <i class="fas fa-shield-alt mr-1"></i> Authorized Reuse Canada personnel only
          </div>
        </div>
      </div>

      <!-- Toggle Button -->
      <div class="text-center mt-6">
        <button id="toggle-login-btn" onclick="toggleLoginPortal()"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/20">
          <i class="fas fa-hard-hat" id="toggle-icon"></i>
          <span id="toggle-text">Employee Login</span>
        </button>
      </div>
      
      <!-- Footer -->
      <div class="text-center mt-6 text-green-100/60 text-sm">
        <p>&copy; 2026 Reuse Canada | Waste-to-Value Recycling</p>
        <p class="mt-1">Alberta, Canada</p>
      </div>
    </div>
  </div>
  
  <script>
    // Check if already logged in
    const session = localStorage.getItem('rc_session');
    if (session) {
      const data = JSON.parse(session);
      if (data.user_type === 'customer') window.location.href = '/customer/dashboard';
      else if (data.role === 'driver') window.location.href = '/driver/portal';
      else window.location.href = '/employee/dashboard';
    }

    let showingEmployee = false;

    function toggleLoginPortal() {
      showingEmployee = !showingEmployee;
      const custCard = document.getElementById('customer-login-card');
      const empCard = document.getElementById('employee-login-card');
      const toggleText = document.getElementById('toggle-text');
      const toggleIcon = document.getElementById('toggle-icon');

      if (showingEmployee) {
        custCard.style.display = 'none';
        empCard.style.display = 'block';
        toggleText.textContent = 'Customer Login';
        toggleIcon.className = 'fas fa-store';
      } else {
        empCard.style.display = 'none';
        custCard.style.display = 'block';
        toggleText.textContent = 'Employee Login';
        toggleIcon.className = 'fas fa-hard-hat';
      }
    }

    function togglePassword(inputId, btn) {
      const input = document.getElementById(inputId);
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
      }
    }

    async function handleCustomerLogin(e) {
      e.preventDefault();
      const btn = document.getElementById('customer-login-btn');
      const errDiv = document.getElementById('customer-error');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      errDiv.classList.add('hidden');

      try {
        const res = await axios.post('/api/auth/login', {
          email: document.getElementById('customer-email').value,
          password: document.getElementById('customer-password').value,
          user_type: 'customer'
        });
        localStorage.setItem('rc_session', JSON.stringify(res.data));
        window.location.href = '/customer/dashboard';
      } catch (err) {
        errDiv.textContent = err.response?.data?.error || 'Login failed. Please check your credentials.';
        errDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Customer Portal';
      }
    }

    async function handleEmployeeLogin(e) {
      e.preventDefault();
      const btn = document.getElementById('employee-login-btn');
      const errDiv = document.getElementById('employee-error');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
      errDiv.classList.add('hidden');

      try {
        const res = await axios.post('/api/auth/login', {
          email: document.getElementById('employee-email').value,
          password: document.getElementById('employee-password').value,
          user_type: 'employee'
        });
        localStorage.setItem('rc_session', JSON.stringify(res.data));
        // Drivers go to driver portal, everyone else to employee dashboard
        if (res.data.role === 'driver') {
          window.location.href = '/driver/portal';
        } else {
          window.location.href = '/employee/dashboard';
        }
      } catch (err) {
        errDiv.textContent = err.response?.data?.error || 'Login failed. Please check your credentials.';
        errDiv.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to Employee Portal';
      }
    }

    function showRegister(type) {
      alert('Please contact Reuse Canada at info@reusecanada.ca to request access.');
    }
  </script>
  `)
}
