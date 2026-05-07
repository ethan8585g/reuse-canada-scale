import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderPickupManagement(): string {
  return layout('Pickup Management', employeePageWrapper('pickups', 'Tire Pickup Management', `
    <!-- Filter Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <select id="filter-status" onchange="loadPickups()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
          <option value="">All Statuses</option>
          <option value="pending" selected>Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select id="filter-region" onchange="loadPickups()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
          <option value="">All Regions</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
        </select>
        <input type="date" id="filter-date" onchange="loadPickups()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span id="pickup-count">0</span> requests found
      </div>
    </div>

    <!-- Pickup Cards -->
    <div class="grid gap-4" id="pickups-container">
      <div class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading pickup requests...</div>
    </div>

    <!-- Assign Modal -->
    <div id="assign-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-user-check mr-2 text-rc-green"></i>Assign Pickup</h3>
          <p class="text-sm text-gray-500 mt-1" id="assign-customer-name"></p>
        </div>
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Assign to Driver</label>
            <select id="assign-employee" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
              <option value="">Select driver...</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Scheduled Date</label>
            <input type="date" id="assign-date" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
          </div>
          <!-- Notify Customer Toggle -->
          <div class="mb-4 bg-blue-50 rounded-xl p-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" id="assign-notify" class="w-5 h-5 text-rc-green rounded border-gray-300 focus:ring-rc-green">
              <div>
                <span class="font-semibold text-sm text-gray-800">Notify Customer</span>
                <p class="text-xs text-gray-500 mt-0.5">Send automated SMS: "Reuse Canada is scheduled for your pickup on [Date]"</p>
              </div>
            </label>
          </div>
          <div class="flex gap-3">
            <button onclick="submitAssignment()" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all">
              <i class="fas fa-check mr-1"></i> Confirm & Schedule
            </button>
            <button onclick="closeAssignModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <script>
      let currentAssignPickupId = null;

      const statusConfig = {
        pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'fas fa-clock text-yellow-600', bg: 'border-l-yellow-400' },
        confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'fas fa-check text-blue-600', bg: 'border-l-blue-400' },
        scheduled: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: 'fas fa-calendar text-indigo-600', bg: 'border-l-indigo-400' },
        in_progress: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'fas fa-truck text-orange-600', bg: 'border-l-orange-400' },
        completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: 'fas fa-check-circle text-green-600', bg: 'border-l-green-400' },
        cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'fas fa-ban text-red-600', bg: 'border-l-red-400' }
      };

      const regionLabels = { north: 'North', south: 'South', east: 'East', west: 'West' };
      const regionColors = { north: 'bg-blue-50 text-blue-700', south: 'bg-red-50 text-red-700', east: 'bg-green-50 text-green-700', west: 'bg-purple-50 text-purple-700' };

      async function loadPickups() {
        try {
          const status = document.getElementById('filter-status').value;
          const date = document.getElementById('filter-date').value;
          const region = document.getElementById('filter-region').value;
          let url = '/api/pickups?';
          if (status) url += 'status=' + status + '&';
          if (date) url += 'date=' + date + '&';
          if (region) url += 'region=' + region + '&';
          
          const res = await axios.get(url);
          const pickups = res.data.pickups || [];
          document.getElementById('pickup-count').textContent = pickups.length;
          const container = document.getElementById('pickups-container');

          if (pickups.length === 0) {
            container.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-inbox text-4xl mb-3 block"></i>No pickup requests matching your filters</div>';
            return;
          }

          container.innerHTML = pickups.map(p => {
            const sc = statusConfig[p.status] || statusConfig.pending;
            const regionBadge = p.region ? \`<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold \${regionColors[p.region] || 'bg-gray-100 text-gray-600'} ml-2"><i class="fas fa-compass mr-0.5"></i>\${regionLabels[p.region] || p.region}</span>\` : '';
            return \`
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 \${sc.bg} card-hover overflow-hidden">
              <div class="p-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <i class="\${sc.icon}"></i>
                    </div>
                    <div>
                      <h3 class="font-bold text-gray-800">\${escHtml(p.company_name || 'Unknown Customer')}\${regionBadge}</h3>
                      <p class="text-sm text-gray-500">\${escHtml(p.contact_name || '')} \${p.phone ? '- ' + escHtml(p.phone) : ''}</p>
                      <p class="text-xs text-gray-400 mt-1">
                        <i class="fas fa-map-marker-alt mr-1"></i>\${escHtml(p.address || 'No address')}, \${escHtml(p.city || '')}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold \${sc.color}">
                      \${escHtml((p.status || '').replace('_',' ').toUpperCase())}
                    </span>
                    <span class="text-xs text-gray-400">#\${p.id}</span>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <div class="text-xs text-gray-500">Est. Tires</div>
                    <div class="text-lg font-bold text-gray-800">\${escHtml(p.estimated_tire_count || '-')}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <div class="text-xs text-gray-500">Type</div>
                    <div class="text-sm font-semibold text-gray-700 capitalize">\${escHtml((p.tire_type || 'N/A').replace('_',' '))}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <div class="text-xs text-gray-500">Preferred Date</div>
                    <div class="text-sm font-semibold text-gray-700">\${escHtml(p.preferred_date || 'No pref')}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3 text-center">
                    <div class="text-xs text-gray-500">Time</div>
                    <div class="text-sm font-semibold text-gray-700 capitalize">\${escHtml(p.preferred_time_slot || 'Anytime')}</div>
                  </div>
                </div>

                \${p.notes ? \`<div class="mt-3 p-2.5 bg-yellow-50 rounded-lg text-sm text-yellow-800"><i class="fas fa-sticky-note mr-1"></i>\${escHtml(p.notes)}</div>\` : ''}
                \${p.assigned_employee_name ? \`<div class="mt-3 text-xs text-gray-500"><i class="fas fa-user mr-1"></i>Assigned to: <span class="font-semibold">\${escHtml(p.assigned_employee_name)}</span></div>\` : ''}
                \${p.notify_customer ? \`<div class="mt-1 text-xs text-blue-500"><i class="fas fa-bell mr-1"></i>Customer notification enabled</div>\` : ''}

                <div class="mt-4 flex flex-wrap gap-2">
                  \${p.status === 'pending' ? \`
                    <button onclick="openAssignModal(\${p.id}, '\${(p.company_name || '').replace(/[\\\\'"<>]/g, '')}', '\${(p.preferred_date || '').replace(/[\\\\'"<>]/g, '')}')" class="px-4 py-2 bg-rc-green hover:bg-rc-green-light text-white text-sm font-semibold rounded-lg transition-all"><i class="fas fa-user-check mr-1"></i>Assign & Schedule</button>
                    <button onclick="updatePickupStatus(\${p.id}, 'confirmed')" class="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition-all"><i class="fas fa-check mr-1"></i>Confirm</button>
                    <button onclick="toggleNotify(\${p.id}, \${p.notify_customer ? 0 : 1})" class="px-3 py-2 \${p.notify_customer ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'} text-sm rounded-lg hover:bg-blue-100 transition-all" title="Toggle auto-notify"><i class="fas fa-bell"></i></button>
                    <button onclick="updatePickupStatus(\${p.id}, 'cancelled')" class="px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg hover:bg-red-100 transition-all"><i class="fas fa-ban"></i></button>
                  \` : ''}
                  \${p.status === 'confirmed' ? \`
                    <button onclick="openAssignModal(\${p.id}, '\${(p.company_name || '').replace(/'/g, "\\\\'")}', '\${p.preferred_date || ''}')" class="px-4 py-2 bg-rc-green hover:bg-rc-green-light text-white text-sm font-semibold rounded-lg transition-all"><i class="fas fa-user-check mr-1"></i>Assign & Schedule</button>
                    <button onclick="toggleNotify(\${p.id}, \${p.notify_customer ? 0 : 1})" class="px-3 py-2 \${p.notify_customer ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'} text-sm rounded-lg hover:bg-blue-100 transition-all" title="Toggle auto-notify"><i class="fas fa-bell"></i></button>
                  \` : ''}
                  \${p.status === 'scheduled' ? \`
                    <button onclick="updatePickupStatus(\${p.id}, 'in_progress')" class="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-all"><i class="fas fa-truck mr-1"></i>Start Pickup</button>
                    <button onclick="startFieldForm(\${p.id})" class="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-all"><i class="fas fa-tablet-alt mr-1"></i>Field Form</button>
                    <button onclick="toggleNotify(\${p.id}, \${p.notify_customer ? 0 : 1})" class="px-3 py-2 \${p.notify_customer ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'} text-sm rounded-lg hover:bg-blue-100 transition-all" title="Toggle auto-notify"><i class="fas fa-bell"></i></button>
                  \` : ''}
                  \${p.status === 'in_progress' ? \`
                    <button onclick="startFieldForm(\${p.id})" class="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-all"><i class="fas fa-tablet-alt mr-1"></i>Field Form</button>
                    <button onclick="updatePickupStatus(\${p.id}, 'completed')" class="px-4 py-2 bg-green-100 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-200 transition-all"><i class="fas fa-check-circle mr-1"></i>Complete</button>
                  \` : ''}
                </div>
              </div>
            </div>
            \`;
          }).join('');
        } catch (err) {
          console.error('Failed to load pickups:', err);
        }
      }

      function openAssignModal(pickupId, customerName, preferredDate) {
        currentAssignPickupId = pickupId;
        document.getElementById('assign-customer-name').textContent = customerName;
        document.getElementById('assign-date').value = preferredDate || new Date().toISOString().split('T')[0];
        document.getElementById('assign-notify').checked = true;
        loadDrivers();
        document.getElementById('assign-modal').style.display = 'flex';
      }

      function closeAssignModal() {
        document.getElementById('assign-modal').style.display = 'none';
        currentAssignPickupId = null;
      }

      async function loadDrivers() {
        try {
          const res = await axios.get('/api/employee/drivers');
          const sel = document.getElementById('assign-employee');
          sel.innerHTML = '<option value="">Select driver...</option>' +
            (res.data.drivers || []).map(d => \`<option value="\${d.id}">\${d.first_name} \${d.last_name} (\${d.role})</option>\`).join('');
        } catch (err) { console.error(err); }
      }

      async function submitAssignment() {
        const employeeId = document.getElementById('assign-employee').value;
        const date = document.getElementById('assign-date').value;
        const notify = document.getElementById('assign-notify').checked;
        if (!employeeId) { alert('Please select a driver'); return; }
        try {
          await axios.post('/api/pickups/' + currentAssignPickupId + '/assign', {
            employee_id: parseInt(employeeId),
            scheduled_date: date,
            notify_customer: notify ? 1 : 0
          });
          closeAssignModal();
          loadPickups();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to assign pickup');
        }
      }

      async function updatePickupStatus(id, status) {
        try {
          await axios.post('/api/pickups/' + id + '/status', { status });
          loadPickups();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to update status');
        }
      }

      async function toggleNotify(id, value) {
        try {
          await axios.post('/api/pickups/' + id + '/notify', { notify_customer: value });
          loadPickups();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to toggle notification');
        }
      }

      function startFieldForm(pickupId) {
        window.location.href = '/employee/field-form?pickup_id=' + pickupId;
      }

      // Safely call loadPickups — retry if axios isn't ready
      (function initPickups() {
        if (typeof axios !== 'undefined') {
          loadPickups();
        } else {
          setTimeout(initPickups, 500);
        }
      })();
    </script>
  `))
}
