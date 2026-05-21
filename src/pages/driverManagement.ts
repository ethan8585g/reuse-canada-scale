import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderDriverManagement(): string {
  return layout('Driver & Staff Management', employeePageWrapper('drivers', 'Drivers, Staff & Vehicles', `
    <!-- Tab Bar -->
    <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button onclick="switchTab('staff')" id="tab-staff" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all bg-white shadow text-rc-green">
        <i class="fas fa-users mr-1"></i> Staff
      </button>
      <button onclick="switchTab('vehicles')" id="tab-vehicles" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all text-gray-500 hover:text-gray-700">
        <i class="fas fa-truck mr-1"></i> Vehicles
      </button>
    </div>

    <!-- ═══ STAFF TAB ═══ -->
    <div id="panel-staff">
      <!-- Action Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <select id="filter-role" onchange="loadStaff()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
            <option value="">All Roles</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
            <option value="manager">Managers</option>
            <option value="yard_operator">Yard Operators</option>
          </select>
        </div>
        <button onclick="openCreateModal()" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2">
          <i class="fas fa-user-plus"></i> Create Driver / Staff Account
        </button>
      </div>

      <!-- Staff Grid -->
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4" id="staff-container">
        <div class="col-span-full text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
      </div>
    </div>

    <!-- ═══ VEHICLES TAB ═══ -->
    <div id="panel-vehicles" class="hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div class="text-sm text-gray-500"><span id="vehicle-count">0</span> vehicles</div>
        <button onclick="openVehicleModal()" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2">
          <i class="fas fa-truck-loading"></i> Add New Vehicle
        </button>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4" id="vehicle-container">
        <div class="col-span-full text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div id="staff-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800" id="modal-title"><i class="fas fa-user-plus mr-2 text-rc-green"></i>New Driver / Staff</h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6">
          <form id="staff-form" onsubmit="submitStaff(event)">
            <input type="hidden" id="edit-id">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">First Name *</label>
                <input type="text" id="f-first" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Mike">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Last Name *</label>
                <input type="text" id="f-last" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Johnson">
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" id="f-email" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="mike@reusecanada.ca">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-600 mb-1">Password *</label>
              <div class="relative">
                <input type="password" id="f-password" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none pr-10" placeholder="Set a password">
                <button type="button" onclick="togglePwd()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-eye" id="pwd-icon"></i></button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <input type="tel" id="f-phone" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="780-555-0101">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Role *</label>
                <select id="f-role" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                  <option value="driver">Driver</option>
                  <option value="yard_operator">Yard Operator</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button type="submit" id="submit-btn" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <i class="fas fa-check"></i> <span id="submit-text">Create Account</span>
              </button>
              <button type="button" onclick="closeModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Vehicle Modal -->
    <div id="vehicle-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800" id="vehicle-modal-title"><i class="fas fa-truck-loading mr-2 text-rc-green"></i>New Vehicle</h3>
          <button onclick="closeVehicleModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6">
          <form id="vehicle-form" onsubmit="submitVehicle(event)">
            <input type="hidden" id="v-edit-id">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-600 mb-1">Vehicle Name *</label>
              <input type="text" id="v-name" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="Truck 1">
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Plate Number *</label>
                <input type="text" id="v-plate" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="ABC-1234">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">Vehicle Type *</label>
                <select id="v-type" required class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
                  <option value="flatbed">Flatbed</option>
                  <option value="roll-off">Roll-Off</option>
                  <option value="cube_van">Cube Van</option>
                  <option value="pickup">Pickup Truck</option>
                  <option value="trailer">Trailer</option>
                </select>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-600 mb-1">Tare Weight (kg)</label>
              <input type="number" id="v-tare" step="0.1" min="0" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none" placeholder="8200">
            </div>
            <div class="flex gap-3 mt-6">
              <button type="submit" id="v-submit-btn" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <i class="fas fa-check"></i> <span id="v-submit-text">Add Vehicle</span>
              </button>
              <button type="button" onclick="closeVehicleModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      let allStaff = [];
      let allVehicles = [];
      const roleConfig = {
        admin: { color: 'bg-purple-100 text-purple-800', icon: 'fas fa-shield-alt text-purple-500', label: 'Admin' },
        manager: { color: 'bg-blue-100 text-blue-800', icon: 'fas fa-user-tie text-blue-500', label: 'Manager' },
        driver: { color: 'bg-green-100 text-green-800', icon: 'fas fa-truck text-green-600', label: 'Driver' },
        yard_operator: { color: 'bg-orange-100 text-orange-800', icon: 'fas fa-hard-hat text-orange-500', label: 'Yard Operator' },
      };

      function togglePwd() {
        const inp = document.getElementById('f-password');
        const icon = document.getElementById('pwd-icon');
        if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
        else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
      }

      async function loadStaff() {
        try {
          const role = document.getElementById('filter-role').value;
          const res = await axios.get('/api/employee/staff' + (role ? '?role=' + role : ''));
          allStaff = res.data.employees || [];
          renderCards(allStaff);
        } catch (err) { console.error('Load staff error:', err); }
      }

      function renderCards(staff) {
        const container = document.getElementById('staff-container');
        if (staff.length === 0) {
          container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400"><i class="fas fa-users text-4xl mb-3 block"></i>No staff members found</div>';
          return;
        }
        container.innerHTML = staff.map(s => {
          const rc = roleConfig[s.role] || roleConfig.driver;
          return \`
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 card-hover overflow-hidden \${!s.is_active ? 'opacity-60' : ''}">
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <i class="\${rc.icon} text-lg"></i>
                  </div>
                  <div>
                    <div class="font-bold text-gray-800">\${s.first_name} \${s.last_name}</div>
                    <div class="text-xs text-gray-500">\${s.email}</div>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${rc.color}">\${rc.label}</span>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span><i class="fas fa-phone mr-1"></i>\${s.phone || 'No phone'}</span>
                <span class="px-2 py-0.5 rounded text-xs \${s.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">\${s.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              \${s.role === 'driver' ? '<div class="text-xs text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded"><i class="fas fa-mobile-alt mr-1"></i>Has Driver Portal access (pickups, routes, field form)</div>' : ''}
              <div class="flex gap-2">
                <button onclick="editStaff(\${s.id})" class="flex-1 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-all"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="toggleStaff(\${s.id}, \${s.is_active})" class="px-3 py-2 \${s.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} text-sm font-semibold rounded-lg transition-all">
                  <i class="fas fa-\${s.is_active ? 'ban' : 'check-circle'} mr-1"></i>\${s.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
          \`;
        }).join('');
      }

      function openCreateModal() {
        document.getElementById('edit-id').value = '';
        document.getElementById('staff-form').reset();
        document.getElementById('f-role').value = 'driver';
        document.getElementById('f-password').required = true;
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-user-plus mr-2 text-rc-green"></i>Create Driver / Staff Account';
        document.getElementById('submit-text').textContent = 'Create Account';
        document.getElementById('staff-modal').style.display = 'flex';
        updateRoleHint();
      }

      // Show hint about what access the role gets
      function updateRoleHint() {
        const role = document.getElementById('f-role').value;
        let hint = document.getElementById('role-hint');
        if (!hint) {
          hint = document.createElement('div');
          hint.id = 'role-hint';
          hint.className = 'mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700';
          document.getElementById('f-role').parentNode.appendChild(hint);
        }
        const hints = {
          driver: '<i class="fas fa-info-circle mr-1"></i> Drivers get their own login portal with access to pickups, routes, scale tickets (no revenue data), and the iPad field form.',
          yard_operator: '<i class="fas fa-info-circle mr-1"></i> Yard operators get full employee dashboard access.',
          manager: '<i class="fas fa-info-circle mr-1"></i> Managers get full employee dashboard access with all features.',
          admin: '<i class="fas fa-info-circle mr-1"></i> Admins get full access to all features including staff management.',
        };
        hint.innerHTML = hints[role] || '';
      }
      document.getElementById('f-role').addEventListener('change', updateRoleHint);

      function editStaff(id) {
        const s = allStaff.find(x => x.id === id);
        if (!s) return;
        document.getElementById('edit-id').value = id;
        document.getElementById('f-first').value = s.first_name || '';
        document.getElementById('f-last').value = s.last_name || '';
        document.getElementById('f-email').value = s.email || '';
        document.getElementById('f-password').value = '';
        document.getElementById('f-password').required = false;
        document.getElementById('f-phone').value = s.phone || '';
        document.getElementById('f-role').value = s.role || 'driver';
        document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit mr-2 text-blue-500"></i>Edit: ' + s.first_name + ' ' + s.last_name;
        document.getElementById('submit-text').textContent = 'Save Changes';
        document.getElementById('staff-modal').style.display = 'flex';
      }

      function closeModal() { document.getElementById('staff-modal').style.display = 'none'; }

      async function submitStaff(e) {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        const editId = document.getElementById('edit-id').value;
        const data = {
          email: document.getElementById('f-email').value,
          first_name: document.getElementById('f-first').value,
          last_name: document.getElementById('f-last').value,
          phone: document.getElementById('f-phone').value,
          role: document.getElementById('f-role').value,
        };
        const pwd = document.getElementById('f-password').value;
        if (pwd) data.password = pwd;
        try {
          if (editId) {
            await axios.put('/api/employee/staff/' + editId, data);
          } else {
            if (!pwd) { alert('Password is required for new staff'); btn.disabled = false; return; }
            data.password = pwd;
            await axios.post('/api/employee/staff', data);
          }
          closeModal();
          loadStaff();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to save');
        }
        btn.disabled = false;
      }

      async function toggleStaff(id, currentActive) {
        if (!confirm(currentActive ? 'Deactivate this staff member?' : 'Reactivate this staff member?')) return;
        try {
          await axios.post('/api/employee/staff/' + id + '/toggle');
          loadStaff();
        } catch (err) { alert('Failed to update'); }
      }

      // ═══ TAB SWITCHING ═══
      function switchTab(tab) {
        document.getElementById('panel-staff').classList.toggle('hidden', tab !== 'staff');
        document.getElementById('panel-vehicles').classList.toggle('hidden', tab !== 'vehicles');
        document.getElementById('tab-staff').className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all ' + (tab === 'staff' ? 'bg-white shadow text-rc-green' : 'text-gray-500 hover:text-gray-700');
        document.getElementById('tab-vehicles').className = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all ' + (tab === 'vehicles' ? 'bg-white shadow text-rc-green' : 'text-gray-500 hover:text-gray-700');
        if (tab === 'vehicles' && allVehicles.length === 0) loadVehicles();
      }

      // ═══ VEHICLE MANAGEMENT ═══
      async function loadVehicles() {
        try {
          const res = await axios.get('/api/employee/vehicles?all=true');
          allVehicles = res.data.vehicles || [];
          document.getElementById('vehicle-count').textContent = allVehicles.length;
          renderVehicleCards(allVehicles);
        } catch (err) { console.error('Load vehicles error:', err); }
      }

      function renderVehicleCards(vehicles) {
        const container = document.getElementById('vehicle-container');
        if (vehicles.length === 0) {
          container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400"><i class="fas fa-truck text-4xl mb-3 block"></i>No vehicles found</div>';
          return;
        }
        const typeIcons = { flatbed: 'fa-truck-flatbed', 'roll-off': 'fa-dumpster', cube_van: 'fa-shuttle-van', pickup: 'fa-truck-pickup', trailer: 'fa-trailer' };
        container.innerHTML = vehicles.map(v => \`
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 card-hover overflow-hidden \${!v.is_active ? 'opacity-60' : ''}">
            <div class="p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas \${typeIcons[v.vehicle_type] || 'fa-truck'} text-lg text-blue-600"></i>
                  </div>
                  <div>
                    <div class="font-bold text-gray-800">\${v.name}</div>
                    <div class="text-xs text-gray-500 font-mono">\${v.plate_number}</div>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">\${(v.vehicle_type || '').replace('_',' ')}</span>
              </div>
              <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span><i class="fas fa-weight mr-1"></i>Tare: \${v.tare_weight ? v.tare_weight + ' kg' : 'N/A'}</span>
                <span class="px-2 py-0.5 rounded text-xs \${v.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">\${v.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div class="flex gap-2">
                <button onclick="editVehicle(\${v.id})" class="flex-1 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-all"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button onclick="toggleVehicle(\${v.id}, \${v.is_active})" class="px-3 py-2 \${v.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} text-sm font-semibold rounded-lg transition-all">
                  <i class="fas fa-\${v.is_active ? 'ban' : 'check-circle'} mr-1"></i>\${v.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        \`).join('');
      }

      function openVehicleModal() {
        document.getElementById('v-edit-id').value = '';
        document.getElementById('vehicle-form').reset();
        document.getElementById('v-type').value = 'flatbed';
        document.getElementById('vehicle-modal-title').innerHTML = '<i class="fas fa-truck-loading mr-2 text-rc-green"></i>New Vehicle';
        document.getElementById('v-submit-text').textContent = 'Add Vehicle';
        document.getElementById('vehicle-modal').style.display = 'flex';
      }

      function editVehicle(id) {
        const v = allVehicles.find(x => x.id === id);
        if (!v) return;
        document.getElementById('v-edit-id').value = id;
        document.getElementById('v-name').value = v.name || '';
        document.getElementById('v-plate').value = v.plate_number || '';
        document.getElementById('v-type').value = v.vehicle_type || 'flatbed';
        document.getElementById('v-tare').value = v.tare_weight || '';
        document.getElementById('vehicle-modal-title').innerHTML = '<i class="fas fa-edit mr-2 text-blue-500"></i>Edit: ' + v.name;
        document.getElementById('v-submit-text').textContent = 'Save Changes';
        document.getElementById('vehicle-modal').style.display = 'flex';
      }

      function closeVehicleModal() { document.getElementById('vehicle-modal').style.display = 'none'; }

      async function submitVehicle(e) {
        e.preventDefault();
        const btn = document.getElementById('v-submit-btn');
        btn.disabled = true;
        const editId = document.getElementById('v-edit-id').value;
        const data = {
          name: document.getElementById('v-name').value,
          plate_number: document.getElementById('v-plate').value,
          vehicle_type: document.getElementById('v-type').value,
          tare_weight: parseFloat(document.getElementById('v-tare').value) || 0,
        };
        try {
          if (editId) {
            await axios.put('/api/employee/vehicles/' + editId, data);
          } else {
            await axios.post('/api/employee/vehicles', data);
          }
          closeVehicleModal();
          loadVehicles();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to save vehicle');
        }
        btn.disabled = false;
      }

      async function toggleVehicle(id, currentActive) {
        if (!confirm(currentActive ? 'Deactivate this vehicle?' : 'Reactivate this vehicle?')) return;
        try {
          await axios.post('/api/employee/vehicles/' + id + '/toggle');
          loadVehicles();
        } catch (err) { alert('Failed to update'); }
      }

      (function init() {
        if (typeof axios !== 'undefined') {
          loadStaff();
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
