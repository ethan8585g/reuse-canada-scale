import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderCustomerManagement(): string {
  return layout('Customer Management', employeePageWrapper('customers', 'Customer Onboarding & Management', `
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <input type="text" id="search-input" placeholder="Search company, contact, city..." oninput="filterCustomers()"
          class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none w-64">
        <select id="filter-status" onchange="loadCustomers()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="">All</option>
        </select>
      </div>
      <button onclick="openCreateModal()" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2">
        <i class="fas fa-user-plus"></i> New Customer
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Total Active</div>
        <div class="text-2xl font-bold text-rc-green" id="stat-active">-</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Total Inactive</div>
        <div class="text-2xl font-bold text-gray-400" id="stat-inactive">-</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">With Pending Pickups</div>
        <div class="text-2xl font-bold text-yellow-600" id="stat-pending">-</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Added This Month</div>
        <div class="text-2xl font-bold text-blue-600" id="stat-month">-</div>
      </div>
    </div>

    <!-- Customer Count -->
    <div class="text-sm text-gray-500 mb-3"><span id="customer-count">0</span> customers found</div>

    <!-- Customer Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Region</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pickups</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody id="customer-table-body" class="divide-y divide-gray-50">
            <tr><td colspan="8" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div id="customer-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800" id="modal-title"><i class="fas fa-user-plus mr-2 text-rc-green"></i>New Customer Account</h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6">
          <form id="customer-form" onsubmit="submitCustomer(event)">
            <input type="hidden" id="edit-id">
            
            <!-- Login Credentials -->
            <div class="mb-6">
              <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-key text-rc-orange"></i> Login Credentials</h4>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Username *</label>
                  <input type="text" id="f-email" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. KALTIRE">
                  <p class="text-xs text-gray-400 mt-1">Customer uses this to log in</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Password *</label>
                  <div class="relative">
                    <input type="password" id="f-password" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none pr-10" placeholder="Set a password">
                    <button type="button" onclick="togglePwdVis()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><i class="fas fa-eye" id="pwd-icon"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Company Info -->
            <div class="mb-6">
              <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-building text-blue-500"></i> Company Information</h4>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Company Name *</label>
                  <input type="text" id="f-company" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. Kal Tire - Edmonton South">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Contact Name *</label>
                  <input type="text" id="f-contact" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="e.g. David Chen">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                  <input type="tel" id="f-phone" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="780-555-0201">
                </div>
              </div>
            </div>

            <!-- Address -->
            <div class="mb-6">
              <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-map-marker-alt text-red-500"></i> Location</h4>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-600 mb-1">Street Address</label>
                  <input type="text" id="f-address" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="3803 Calgary Trail NW">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">City</label>
                  <input type="text" id="f-city" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Edmonton" value="Edmonton">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Province</label>
                  <select id="f-province" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                    <option value="AB" selected>Alberta</option>
                    <option value="BC">British Columbia</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="MB">Manitoba</option>
                    <option value="ON">Ontario</option>
                    <option value="QC">Quebec</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Postal Code</label>
                  <input type="text" id="f-postal" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="T6J 2A8">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">Region</label>
                  <select id="f-region" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-600 mb-1">Internal Notes</label>
              <textarea id="f-notes" rows="2" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Any notes about this customer..."></textarea>
            </div>

            <div class="flex gap-3">
              <button type="submit" id="submit-btn" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <i class="fas fa-check"></i> <span id="submit-text">Create Customer Account</span>
              </button>
              <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      let allCustomers = [];

      function togglePwdVis() {
        const inp = document.getElementById('f-password');
        const icon = document.getElementById('pwd-icon');
        if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
        else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
      }

      async function loadCustomers() {
        try {
          const status = document.getElementById('filter-status').value;
          const res = await axios.get('/api/employee/customers/all' + (status ? '?status=' + status : ''));
          allCustomers = res.data.customers || [];
          filterCustomers();
          updateStats();
        } catch (err) { console.error('Load customers error:', err); }
      }

      async function updateStats() {
        try {
          const [active, inactive, all] = await Promise.all([
            axios.get('/api/employee/customers/all?status=active'),
            axios.get('/api/employee/customers/all?status=inactive'),
            axios.get('/api/employee/customers/all'),
          ]);
          document.getElementById('stat-active').textContent = (active.data.customers || []).length;
          document.getElementById('stat-inactive').textContent = (inactive.data.customers || []).length;
          const thisMonth = new Date().toISOString().substring(0, 7);
          const monthCount = (all.data.customers || []).filter(c => (c.created_at || '').startsWith(thisMonth)).length;
          document.getElementById('stat-month').textContent = monthCount;
          const pendingCount = (all.data.customers || []).reduce((sum, c) => sum + (c.pending_pickups || 0), 0);
          document.getElementById('stat-pending').textContent = pendingCount;
        } catch(e) {}
      }

      function filterCustomers() {
        const q = (document.getElementById('search-input').value || '').toLowerCase();
        const filtered = q ? allCustomers.filter(c =>
          (c.company_name || '').toLowerCase().includes(q) ||
          (c.contact_name || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        ) : allCustomers;
        renderTable(filtered);
      }

      function renderTable(customers) {
        document.getElementById('customer-count').textContent = customers.length;
        const tbody = document.getElementById('customer-table-body');
        if (customers.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-inbox text-2xl mb-2 block"></i>No customers found</td></tr>';
          return;
        }
        tbody.innerHTML = customers.map(c => \`
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="font-semibold text-sm text-gray-800">\${escHtml(c.company_name)}</div>
              <div class="text-xs text-gray-400">\${escHtml(c.phone || 'No phone')}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">\${escHtml(c.contact_name)}</td>
            <td class="px-4 py-3 text-sm text-gray-500">\${c.address ? escHtml(c.address) + ', ' : ''}\${escHtml(c.city || '')} \${escHtml(c.province || '')}</td>
            <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold \${{'north':'bg-blue-50 text-blue-700','south':'bg-red-50 text-red-700','east':'bg-green-50 text-green-700','west':'bg-purple-50 text-purple-700'}[c.region] || 'bg-gray-50 text-gray-600'}">\${escHtml((c.region || 'N/A').toUpperCase())}</span></td>
            <td class="px-4 py-3"><span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">\${escHtml(c.email)}</span></td>
            <td class="px-4 py-3">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                \${c.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              \${c.pending_pickups > 0 ? '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">' + c.pending_pickups + ' pending</span>' : '<span class="text-xs text-gray-400">0</span>'}
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button onclick="editCustomer(\${c.id})" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="toggleCustomer(\${c.id}, \${c.is_active})" class="p-2 \${c.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'} rounded-lg" title="\${c.is_active ? 'Deactivate' : 'Activate'}">
                  <i class="fas fa-\${c.is_active ? 'ban' : 'check-circle'}"></i>
                </button>
              </div>
            </td>
          </tr>
        \`).join('');
      }

      function openCreateModal() {
        document.getElementById('edit-id').value = '';
        document.getElementById('customer-form').reset();
        document.getElementById('f-city').value = 'Edmonton';
        document.getElementById('f-province').value = 'AB';
        document.getElementById('f-region').value = 'north';
        document.getElementById('f-password').required = true;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-plus mr-2 text-rc-green"></i>New Customer Account';
        document.getElementById('submit-text').textContent = 'Create Customer Account';
        document.getElementById('customer-modal').style.display = 'flex';
      }

      function editCustomer(id) {
        const c = allCustomers.find(x => x.id === id);
        if (!c) return;
        document.getElementById('edit-id').value = id;
        document.getElementById('f-email').value = c.email || '';
        document.getElementById('f-password').value = '';
        document.getElementById('f-password').required = false;
        document.getElementById('f-company').value = c.company_name || '';
        document.getElementById('f-contact').value = c.contact_name || '';
        document.getElementById('f-phone').value = c.phone || '';
        document.getElementById('f-address').value = c.address || '';
        document.getElementById('f-city').value = c.city || '';
        document.getElementById('f-province').value = c.province || 'AB';
        document.getElementById('f-postal').value = c.postal_code || '';
        document.getElementById('f-notes').value = c.notes || '';
        document.getElementById('f-region').value = c.region || 'north';
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit mr-2 text-blue-500"></i>Edit Customer: ' + c.company_name;
        document.getElementById('submit-text').textContent = 'Save Changes';
        document.getElementById('customer-modal').style.display = 'flex';
      }

      function closeModal() { document.getElementById('customer-modal').style.display = 'none'; }

      async function submitCustomer(e) {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        const editId = document.getElementById('edit-id').value;
        const data = {
          email: document.getElementById('f-email').value,
          company_name: document.getElementById('f-company').value,
          contact_name: document.getElementById('f-contact').value,
          phone: document.getElementById('f-phone').value,
          address: document.getElementById('f-address').value,
          city: document.getElementById('f-city').value,
          province: document.getElementById('f-province').value,
          postal_code: document.getElementById('f-postal').value,
          notes: document.getElementById('f-notes').value,
          region: document.getElementById('f-region').value,
        };
        const pwd = document.getElementById('f-password').value;
        if (pwd) data.password = pwd;

        try {
          if (editId) {
            await axios.put('/api/employee/customers/' + editId, data);
          } else {
            if (!pwd) { alert('Password is required for new customers'); btn.disabled = false; return; }
            data.password = pwd;
            await axios.post('/api/employee/customers', data);
          }
          closeModal();
          loadCustomers();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to save customer');
        }
        btn.disabled = false;
      }

      async function toggleCustomer(id, currentActive) {
        if (!confirm(currentActive ? 'Deactivate this customer? They will not be able to log in.' : 'Reactivate this customer?')) return;
        try {
          await axios.post('/api/employee/customers/' + id + '/toggle');
          loadCustomers();
        } catch (err) { alert('Failed to update'); }
      }

      (function init() {
        if (typeof axios !== 'undefined') {
          loadCustomers();
          // Auto-open the create modal when arriving from the dashboard "Create Account" chooser.
          if (new URLSearchParams(window.location.search).get('new') === '1') {
            openCreateModal();
          }
        }
        else { setTimeout(init, 500); }
      })();
    </script>
  `))
}
