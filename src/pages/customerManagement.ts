import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderCustomerManagement(): string {
  return layout('Customer Management', employeePageWrapper('customers', 'Customer Onboarding & Management', `
    <!-- Summary strip -->
    <div class="flex flex-wrap items-end justify-end gap-x-10 gap-y-3 mb-5">
      <div class="text-right"><div class="text-2xl font-extrabold text-rc-green" id="stat-active">-</div><div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Active Customers</div></div>
      <div class="text-right"><div class="text-2xl font-extrabold text-gray-400" id="stat-inactive">-</div><div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Inactive</div></div>
      <div class="text-right"><div class="text-2xl font-extrabold text-yellow-600" id="stat-pending">-</div><div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Pending Pickups</div></div>
      <div class="text-right"><div class="text-2xl font-extrabold text-blue-600" id="stat-month">-</div><div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Added This Month</div></div>
    </div>

    <!-- Action Bar -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
          <input type="text" id="search-input" placeholder="Search company, contact, city..." oninput="filterCustomers()"
            class="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none transition-all w-64">
        </div>
        <select id="filter-status" onchange="loadCustomers()" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none bg-white">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="">All statuses</option>
        </select>
        <select id="filter-region" onchange="filterCustomers()" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none bg-white">
          <option value="">All regions</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
        </select>
        <button type="button" onclick="clearCustomerFilters()" id="clear-cust-filters" style="display:none;" class="px-3 py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600"><i class="fas fa-times mr-1"></i>Clear</button>
      </div>
      <div class="flex items-center gap-3">
        <div class="inline-flex bg-gray-100 rounded-xl p-1">
          <button type="button" id="cview-list" onclick="setCustView('list')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">List</button>
          <button type="button" id="cview-cards" onclick="setCustView('cards')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">Cards</button>
          <button type="button" id="cview-compact" onclick="setCustView('compact')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">Compact</button>
        </div>
        <button onclick="openCreateModal()" class="bg-rc-green hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">
          <i class="fas fa-user-plus"></i> New Customer
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-3">
      <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
        <input type="checkbox" id="select-all-customers" onchange="toggleSelectAllCustomers(this.checked)" class="rounded border-gray-300 text-rc-green">
        Select all
      </label>
      <span class="text-xs text-gray-400"><span id="customer-count">0</span> customers</span>
    </div>

    <!-- Floating bulk action bar, shown once anything is selected -->
    <div id="cust-bulk-bar" style="display:none;" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
      <span class="text-sm font-semibold whitespace-nowrap"><span id="cust-bulk-count">0</span> selected</span>
      <div class="w-px h-6 bg-white/20"></div>
      <button type="button" onclick="bulkSetActive(1)" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-rc-green hover:opacity-90 transition-colors whitespace-nowrap"><i class="fas fa-check-circle mr-1.5"></i>Activate</button>
      <button type="button" onclick="bulkSetActive(0)" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-red-500/90 hover:bg-red-500 transition-colors whitespace-nowrap"><i class="fas fa-ban mr-1.5"></i>Deactivate</button>
      <button type="button" onclick="exportCustomersCsv()" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"><i class="fas fa-file-csv mr-1.5"></i>Export CSV</button>
      <button type="button" onclick="clearCustomerSelection()" class="text-white/40 hover:text-white px-1" title="Clear selection"><i class="fas fa-times"></i></button>
    </div>

    <!-- Results: filled by renderCustomers() in whichever view is active -->
    <div id="customers-view">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
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
          selectedCustomers = new Set();
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

      var custView = 'list';
      // Selection survives a view switch. visibleCustomers is whatever the
      // current filters leave on screen -- select-all must not reach past it.
      var selectedCustomers = new Set(), visibleCustomers = [];

      var REGION_CLS = { north:'bg-blue-50 text-blue-700', south:'bg-red-50 text-red-700', east:'bg-green-50 text-green-700', west:'bg-purple-50 text-purple-700' };

      function custCheckbox(c) {
        return '<input type="checkbox" onclick="event.stopPropagation()" onchange="toggleCustSelect(' + c.id + ', this.checked)"' +
          (selectedCustomers.has(c.id) ? ' checked' : '') +
          ' class="rounded border-gray-300 text-rc-green cursor-pointer shrink-0">';
      }
      function custSelClass(c) { return selectedCustomers.has(c.id) ? 'bg-green-50/70' : ''; }

      function regionPill(c) {
        return '<span class="px-2 py-0.5 rounded-full text-xs font-semibold ' + (REGION_CLS[c.region] || 'bg-gray-50 text-gray-600') + '">' +
          escHtml((c.region || 'N/A').toUpperCase()) + '</span>';
      }
      function custStatusPill(c) {
        return '<span class="px-2.5 py-1 rounded-full text-xs font-semibold ' + (c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') + '">' +
          (c.is_active ? 'ACTIVE' : 'INACTIVE') + '</span>';
      }
      function pendingPill(c) {
        return c.pending_pickups > 0
          ? '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">' + c.pending_pickups + ' pending</span>'
          : '<span class="text-xs text-gray-300">0</span>';
      }
      function custLocation(c) {
        return ((c.address ? escHtml(c.address) + ', ' : '') + escHtml(c.city || '') + ' ' + escHtml(c.province || '')).trim() || '-';
      }
      function custActions(c) {
        return '<button onclick="editCustomer(' + c.id + ')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><i class="fas fa-edit"></i></button>' +
          '<button onclick="toggleCustomer(' + c.id + ', ' + (c.is_active ? 1 : 0) + ')" class="p-2 ' +
          (c.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50') + ' rounded-lg" title="' +
          (c.is_active ? 'Deactivate' : 'Activate') + '"><i class="fas fa-' + (c.is_active ? 'ban' : 'check-circle') + '"></i></button>';
      }

      function filterCustomers() {
        const q = (document.getElementById('search-input').value || '').toLowerCase();
        const region = document.getElementById('filter-region').value;
        const status = document.getElementById('filter-status').value;
        document.getElementById('clear-cust-filters').style.display = (q || region || status !== 'active') ? 'block' : 'none';
        let filtered = allCustomers;
        if (q) filtered = filtered.filter(c =>
          (c.company_name || '').toLowerCase().includes(q) ||
          (c.contact_name || '').toLowerCase().includes(q) ||
          (c.city || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        );
        if (region) filtered = filtered.filter(c => c.region === region);
        renderCustomers(filtered);
      }

      function clearCustomerFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-region').value = '';
        document.getElementById('filter-status').value = 'active';
        loadCustomers();
      }

      function renderCustList(list) {
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">' +
          list.map(function(c) {
            return '<div class="px-4 py-3.5 border-l-4 ' + (c.is_active ? 'border-rc-green' : 'border-gray-200') + ' hover:bg-gray-50/80 transition-colors flex items-center gap-4 ' + custSelClass(c) + '">' +
              custCheckbox(c) +
              '<div class="flex-1 min-w-0">' +
                '<div class="text-sm font-bold text-gray-800 truncate">' + escHtml(c.company_name || '') + '</div>' +
                '<div class="text-xs text-gray-400 truncate">' + escHtml(c.phone || 'No phone') + ' &middot; <span class="font-mono">' + escHtml(c.email || '') + '</span></div>' +
              '</div>' +
              '<div class="w-40 shrink-0 hidden lg:block"><div class="text-sm text-gray-700 truncate">' + escHtml(c.contact_name || '-') + '</div></div>' +
              '<div class="w-52 shrink-0 hidden xl:block text-xs text-gray-500 truncate">' + custLocation(c) + '</div>' +
              '<div class="w-20 shrink-0 text-center">' + regionPill(c) + '</div>' +
              '<div class="w-28 shrink-0 text-center">' + pendingPill(c) + '</div>' +
              '<div class="w-24 shrink-0 text-center">' + custStatusPill(c) + '</div>' +
              '<div class="shrink-0 flex items-center gap-1">' + custActions(c) + '</div>' +
            '</div>';
          }).join('') + '</div>';
      }

      function renderCustCards(list) {
        return '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">' +
          list.map(function(c) {
            return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ' + (c.is_active ? 'border-rc-green' : 'border-gray-300') + ' p-5 hover:shadow-md transition-all ' + custSelClass(c) + '">' +
              '<div class="flex items-start justify-between gap-2 mb-1">' +
                '<div class="flex items-start gap-2 min-w-0">' + custCheckbox(c) +
                '<div class="text-sm font-bold text-gray-800 truncate">' + escHtml(c.company_name || '') + '</div></div>' + custStatusPill(c) +
              '</div>' +
              '<div class="text-xs text-gray-400 mb-3">' + escHtml(c.contact_name || 'No contact') + '</div>' +
              '<div class="grid grid-cols-2 gap-2 py-3 border-t border-gray-50">' +
                '<div><div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Region</div><div class="mt-1">' + regionPill(c) + '</div></div>' +
                '<div><div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pickups</div><div class="mt-1">' + pendingPill(c) + '</div></div>' +
              '</div>' +
              '<div class="text-xs text-gray-500 pt-2 border-t border-gray-50 space-y-1">' +
                '<div><i class="fas fa-phone text-gray-300 mr-1.5"></i>' + escHtml(c.phone || 'No phone') + '</div>' +
                '<div class="truncate"><i class="fas fa-user text-gray-300 mr-1.5"></i><span class="font-mono">' + escHtml(c.email || '') + '</span></div>' +
                '<div class="truncate"><i class="fas fa-location-dot text-gray-300 mr-1.5"></i>' + custLocation(c) + '</div>' +
              '</div>' +
              '<div class="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">' + custActions(c) + '</div>' +
            '</div>';
          }).join('') + '</div>';
      }

      function renderCustCompact(list) {
        var head = ['', 'Company', 'Contact', 'Location', 'Region', 'Username', 'Status', 'Pickups', ''];
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm">' +
          '<thead class="bg-gray-50/80"><tr>' + head.map(function(h) {
            return '<th class="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">' + h + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          list.map(function(c) {
            return '<tr class="border-b border-gray-50 hover:bg-gray-50/80 ' + custSelClass(c) + '">' +
              '<td class="px-3 py-2">' + custCheckbox(c) + '</td>' +
              '<td class="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">' + escHtml(c.company_name || '') + '</td>' +
              '<td class="px-3 py-2 text-gray-600 whitespace-nowrap">' + escHtml(c.contact_name || '-') + '</td>' +
              '<td class="px-3 py-2 text-gray-500 whitespace-nowrap">' + custLocation(c) + '</td>' +
              '<td class="px-3 py-2">' + regionPill(c) + '</td>' +
              '<td class="px-3 py-2"><span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">' + escHtml(c.email || '') + '</span></td>' +
              '<td class="px-3 py-2">' + custStatusPill(c) + '</td>' +
              '<td class="px-3 py-2 text-center">' + pendingPill(c) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap"><div class="flex items-center gap-1">' + custActions(c) + '</div></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div></div>';
      }

      function renderCustomers(list) {
        visibleCustomers = list;
        document.getElementById('customer-count').textContent = list.length;
        updateCustBulkBar();
        var host = document.getElementById('customers-view');
        if (!list.length) {
          host.innerHTML = '<div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">' +
            '<div class="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-users text-xl text-gray-300"></i></div>' +
            '<p class="text-sm font-semibold text-gray-400">No customers found</p>' +
            '<p class="text-xs text-gray-300 mt-1">Try clearing the filters, or add a customer.</p></div>';
          return;
        }
        host.innerHTML = custView === 'cards' ? renderCustCards(list)
                       : custView === 'compact' ? renderCustCompact(list)
                       : renderCustList(list);
      }

      function toggleCustSelect(id, on) {
        if (on) selectedCustomers.add(id); else selectedCustomers.delete(id);
        renderCustomers(visibleCustomers);
      }
      function toggleSelectAllCustomers(on) {
        selectedCustomers = new Set(on ? visibleCustomers.map(function(c) { return c.id; }) : []);
        renderCustomers(visibleCustomers);
      }
      function clearCustomerSelection() {
        selectedCustomers = new Set();
        var sa = document.getElementById('select-all-customers');
        if (sa) sa.checked = false;
        renderCustomers(visibleCustomers);
      }
      function updateCustBulkBar() {
        var n = selectedCustomers.size;
        document.getElementById('cust-bulk-count').textContent = n;
        document.getElementById('cust-bulk-bar').style.display = n ? 'flex' : 'none';
        var sa = document.getElementById('select-all-customers');
        if (sa) sa.checked = n > 0 && n === visibleCustomers.length;
      }
      function selectedCustomerRows() {
        return allCustomers.filter(function(c) { return selectedCustomers.has(c.id); });
      }

      // The API only exposes a toggle, so only flip the rows that are not
      // already in the target state -- otherwise "Activate" would deactivate
      // everything that was already active.
      async function bulkSetActive(target) {
        var rows = selectedCustomerRows().filter(function(c) { return (c.is_active ? 1 : 0) !== target; });
        if (!rows.length) { alert('Every selected customer is already ' + (target ? 'active' : 'inactive') + '.'); return; }
        if (!confirm((target ? 'Activate ' : 'Deactivate ') + rows.length + ' customer(s)?')) return;
        var failed = 0;
        for (var i = 0; i < rows.length; i++) {
          try { await axios.post('/api/employee/customers/' + rows[i].id + '/toggle'); }
          catch (e) { failed++; console.error('Toggle failed for ' + rows[i].company_name, e); }
        }
        if (failed) alert('Updated ' + (rows.length - failed) + ' of ' + rows.length + '. ' + failed + ' failed.');
        selectedCustomers = new Set();
        loadCustomers();
      }

      function csvCell(v) {
        var s = (v === null || v === undefined) ? '' : String(v);
        return '"' + s.replace(/"/g, '""') + '"';
      }
      function exportCustomersCsv() {
        var rows = selectedCustomerRows();
        if (!rows.length) return;
        var out = [['Company','Contact','Username','Phone','Address','City','Province','Postal Code','Region','Status','Pending Pickups']];
        rows.forEach(function(c) {
          out.push([c.company_name || '', c.contact_name || '', c.email || '', c.phone || '', c.address || '',
            c.city || '', c.province || '', c.postal_code || '', c.region || '',
            c.is_active ? 'Active' : 'Inactive', c.pending_pickups || 0]);
        });
        var csv = out.map(function(r) { return r.map(csvCell).join(','); }).join('\r\n');
        var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        var a = document.createElement('a');
        a.href = url; a.download = 'customers-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      function setCustView(v) {
        custView = v;
        try { localStorage.setItem('rc_customer_view', v); } catch (e) {}
        ['list', 'cards', 'compact'].forEach(function(k) {
          var b = document.getElementById('cview-' + k);
          if (b) b.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ' +
            (k === v ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700');
        });
        filterCustomers();
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
          var savedView = 'list';
          try { savedView = localStorage.getItem('rc_customer_view') || 'list'; } catch (e) {}
          setCustView(savedView);
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
