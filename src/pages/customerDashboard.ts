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
            <i class="fas fa-tire text-purple-600"></i>
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
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Preferred Pickup Date</label>
              <input type="date" id="pickup-date" required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 outline-none bg-white">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Time Preference</label>
              <div class="relative">
                <select id="time-slot"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green focus:ring-2 focus:ring-green-100 outline-none bg-white appearance-none cursor-pointer pr-10">
                  <option value="anytime">Anytime</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                </div>
              </div>
            </div>
          </div>
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
          </div>
        </form>
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
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tires</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody id="pickup-table-body">
            <tr><td colspan="5" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>
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

    // Set min date for pickup
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickup-date').min = today;

    // Axios auth - with safety check
    function setupCustomerAxios() {
      if (typeof axios === 'undefined') {
        console.warn('[RC-Customer] Axios not loaded yet, retrying...');
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

        const tbody = document.getElementById('pickup-table-body');
        if (pickups.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No pickup requests yet. Submit one above!</td></tr>';
          return;
        }
        tbody.innerHTML = pickups.map(p => \`
          <tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-800">\${p.preferred_date || 'N/A'}</td>
            <td class="px-6 py-4 text-sm font-semibold text-gray-800">\${p.estimated_tire_count || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-600 capitalize">\${(p.tire_type || '-').replace('_',' ')}</td>
            <td class="px-6 py-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${statusColors[p.status] || 'bg-gray-100 text-gray-800'}">
                \${p.status.replace('_',' ').toUpperCase()}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">\${p.notes || '-'}</td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error('Failed to load pickups:', err);
      }
    }

    async function submitPickupRequest(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-pickup-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      try {
        await axios.post('/api/customer/pickups', {
          estimated_tire_count: parseInt(document.getElementById('tire-count').value),
          tire_type: document.getElementById('tire-type').value,
          preferred_date: document.getElementById('pickup-date').value,
          preferred_time_slot: document.getElementById('time-slot').value,
          notes: document.getElementById('pickup-notes').value
        });
        document.getElementById('pickup-form').reset();
        loadPickups();
        // Show success
        btn.innerHTML = '<i class="fas fa-check"></i> Request Submitted!';
        btn.className = btn.className.replace('bg-rc-green', 'bg-green-500');
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
