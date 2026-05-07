import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleTickets(): string {
  return layout('Scale Tickets', employeePageWrapper('scale-tickets', 'Digital Scale Tickets', `
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div class="flex items-center gap-3 flex-wrap">
        <select id="filter-status" onchange="loadTickets()" class="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green focus:ring-2 focus:ring-rc-green/20 outline-none transition-all duration-200">
          <option value="">All Statuses</option>
          <option value="field_pending">Field Pending</option>
          <option value="field_complete">Field Complete</option>
          <option value="weighing_in">Weighing In</option>
          <option value="weighed_in">Weighed In</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
        </select>
        <div class="flex items-center gap-1">
          <input type="date" id="filter-date-from" onchange="loadTickets()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green focus:ring-2 focus:ring-rc-green/20 outline-none transition-all duration-200" placeholder="From">
          <span class="text-gray-400 text-xs">to</span>
          <input type="date" id="filter-date-to" onchange="loadTickets()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rc-green focus:ring-2 focus:ring-rc-green/20 outline-none transition-all duration-200" placeholder="To">
        </div>
        <div class="relative">
          <input type="text" id="filter-search" onkeyup="debounceSearch()" class="px-4 py-2 pl-9 border border-gray-200 rounded-lg text-sm focus:border-rc-green focus:ring-2 focus:ring-rc-green/20 outline-none transition-all duration-200 w-48" placeholder="Search ticket # or customer...">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
        </div>
      </div>
      <button onclick="openNewTicketModal()" class="bg-rc-orange hover:bg-rc-orange-light text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm hover:shadow-md btn-press transition-all duration-200 flex items-center gap-2">
        <i class="fas fa-plus"></i> New Scale Ticket
      </button>
    </div>

    <!-- Tickets Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50/80 sticky top-0">
            <tr>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Ticket #</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Customer</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Operator</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Status</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Weight In</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Weight Out</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Net Weight</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Total</th>
              <th class="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 tracking-wide">Date</th>
              <th class="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody id="tickets-tbody">
            <tr><td colspan="10" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- New Ticket Modal -->
    <div id="new-ticket-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800"><i class="fas fa-weight mr-2 text-rc-orange"></i>New Scale Ticket</h3>
          <button onclick="closeNewTicketModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6">
          <form id="new-ticket-form" onsubmit="createTicket(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Customer</label>
                <select id="ticket-customer" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                  <option value="">Select customer...</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Tire Type</label>
                <select id="ticket-tire-type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                  <option value="mixed">Mixed</option>
                  <option value="passenger">Passenger</option>
                  <option value="truck">Commercial Truck</option>
                  <option value="off-road">Off-Road</option>
                  <option value="shingles">Asphalt Roofing Shingles</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Vehicle</label>
                <select id="ticket-vehicle" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none">
                  <option value="">Select vehicle...</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea id="ticket-notes" rows="2" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rc-orange outline-none" placeholder="Optional notes..."></textarea>
              </div>
            </div>
            <div class="mt-6 flex gap-3">
              <button type="submit" class="flex-1 bg-rc-orange hover:bg-rc-orange-light text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <i class="fas fa-plus"></i> Create Ticket
              </button>
              <button type="button" onclick="closeNewTicketModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Weight Entry Modal -->
    <div id="weight-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-md">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-bold text-gray-800" id="weight-modal-title">Record Weight</h3>
          <p class="text-sm text-gray-500 mt-1" id="weight-modal-ticket"></p>
        </div>
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
            <input type="number" id="weight-value" step="0.1" min="0" required
              class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-2xl font-bold text-center focus:border-rc-green outline-none"
              placeholder="0.0">
            <p class="text-xs text-gray-400 mt-2 text-center">
              <i class="fas fa-info-circle mr-1"></i>Enter reading from Western APX (AM5332C) indicator
            </p>
          </div>
          <div class="flex gap-3">
            <button onclick="submitWeight()" class="flex-1 bg-rc-green hover:bg-rc-green-light text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <i class="fas fa-save"></i> Record Weight
            </button>
            <button onclick="closeWeightModal()" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Void Reason Modal -->
    <div id="void-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-md">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-bold text-red-600"><i class="fas fa-ban mr-2"></i>Void Ticket</h3>
        </div>
        <div class="p-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Reason for voiding <span class="text-red-500">*</span></label>
          <textarea id="void-reason" rows="3" required class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 outline-none" placeholder="Enter reason..."></textarea>
          <input type="hidden" id="void-ticket-id">
          <div class="mt-4 flex gap-3">
            <button onclick="submitVoid()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl"><i class="fas fa-ban mr-1"></i> Void Ticket</button>
            <button onclick="document.getElementById('void-modal').style.display='none'" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Detail Modal -->
    <div id="detail-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-800" id="detail-title">Ticket Details</h3>
          <button onclick="closeDetailModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6" id="detail-content"></div>
      </div>
    </div>

    <script>
      let currentWeightTicketId = null;
      let currentWeightType = null;
      let searchDebounce = null;

      const ticketStatusColors = {
        field_pending: 'bg-yellow-100 text-yellow-800',
        field_complete: 'bg-blue-100 text-blue-800',
        weighing_in: 'bg-indigo-100 text-indigo-800',
        weighed_in: 'bg-purple-100 text-purple-800',
        weighing_out: 'bg-orange-100 text-orange-800',
        completed: 'bg-green-100 text-green-800',
        voided: 'bg-red-100 text-red-800'
      };

      function debounceSearch() {
        if (searchDebounce) clearTimeout(searchDebounce);
        searchDebounce = setTimeout(loadTickets, 300);
      }

      async function loadTickets() {
        try {
          const status = document.getElementById('filter-status').value;
          const dateFrom = document.getElementById('filter-date-from').value;
          const dateTo = document.getElementById('filter-date-to').value;
          const search = document.getElementById('filter-search').value.trim();
          let url = '/api/scale-tickets?';
          if (status) url += 'status=' + status + '&';
          if (dateFrom) url += 'date_from=' + dateFrom + '&';
          if (dateTo) url += 'date_to=' + dateTo + '&';
          if (search) url += 'search=' + encodeURIComponent(search) + '&';
          const res = await axios.get(url);
          const tickets = res.data.tickets || [];
          const tbody = document.getElementById('tickets-tbody');

          if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-gray-400">No scale tickets found</td></tr>';
            return;
          }

          tbody.innerHTML = tickets.map(t => {
            const photoIcon = t.photo_in ? '<i class="fas fa-camera text-green-400 text-[10px] ml-1" title="Has photo"></i>' : '';
            const receiptIcon = t.receipt_printed ? '<i class="fas fa-print text-blue-400 text-[10px] ml-1" title="Receipt printed"></i>' : '';
            const manualIcon = t.manual_entry ? '<i class="fas fa-keyboard text-orange-400 text-[10px] ml-1" title="Manual entry"></i>' : '';
            const voidInfo = t.status === 'voided' && t.void_reason ? ' title="' + escAttr(t.void_reason) + '"' : '';
            return \`
            <tr class="border-b border-gray-100/60 hover:bg-gray-50/80 cursor-pointer transition-colors duration-150" onclick="viewTicket(\${t.id})">
              <td class="px-4 py-3 text-sm font-mono font-bold text-rc-green">\${escHtml(t.ticket_number)}\${photoIcon}\${receiptIcon}\${manualIcon}</td>
              <td class="px-4 py-3 text-sm text-gray-800">\${escHtml(t.company_name || t.field_store_name || 'N/A')}</td>
              <td class="px-4 py-3 text-sm text-gray-600">\${escHtml(t.employee_name || 'N/A')}</td>
              <td class="px-4 py-3">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold \${ticketStatusColors[t.status] || 'bg-gray-100'}" \${voidInfo}>
                  \${escHtml((t.status || '').replace(/_/g,' ').toUpperCase())}
                </span>
              </td>
              <td class="px-4 py-3 text-sm font-mono">\${t.weight_in ? parseFloat(t.weight_in).toFixed(1) + ' kg' : '-'}</td>
              <td class="px-4 py-3 text-sm font-mono">\${t.weight_out ? parseFloat(t.weight_out).toFixed(1) + ' kg' : '-'}</td>
              <td class="px-4 py-3 text-sm font-mono font-bold \${t.net_weight ? 'text-rc-green' : 'text-gray-400'}">\${t.net_weight ? parseFloat(t.net_weight).toFixed(1) + ' kg' : '-'}</td>
              <td class="px-4 py-3 text-sm font-mono \${t.grand_total ? 'text-rc-green font-bold' : 'text-gray-400'}">\${t.grand_total ? '$' + parseFloat(t.grand_total).toFixed(2) : '-'}</td>
              <td class="px-4 py-3 text-sm text-gray-500">\${new Date(t.created_at).toLocaleDateString('en-CA')}</td>
              <td class="px-4 py-3 text-center" onclick="event.stopPropagation()">
                <div class="flex items-center justify-center gap-1">
                  \${getTicketActions(t)}
                </div>
              </td>
            </tr>
          \`}).join('');
        } catch (err) {
          console.error('Failed to load tickets:', err);
        }
      }

      function getTicketActions(t) {
        let actions = '';
        if (t.status === 'field_complete' || t.status === 'field_pending') {
          actions += \`<button onclick="openWeightModal(\${t.id}, 'in', '\${t.ticket_number}')" class="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-200" title="Record Weight In"><i class="fas fa-arrow-down mr-1"></i>Weigh In</button>\`;
        }
        if (t.status === 'weighed_in') {
          actions += \`<button onclick="openWeightModal(\${t.id}, 'out', '\${t.ticket_number}')" class="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200" title="Record Weight Out"><i class="fas fa-arrow-up mr-1"></i>Weigh Out</button>\`;
        }
        if (t.status !== 'completed' && t.status !== 'voided') {
          actions += \`<button onclick="openVoidModal(\${t.id})" class="px-2 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100" title="Void"><i class="fas fa-ban"></i></button>\`;
        }
        return actions || '<span class="text-xs text-gray-400">-</span>';
      }

      function openNewTicketModal() {
        loadCustomersAndVehicles();
        document.getElementById('new-ticket-modal').style.display = 'flex';
      }
      function closeNewTicketModal() {
        document.getElementById('new-ticket-modal').style.display = 'none';
      }

      function openWeightModal(ticketId, type, ticketNumber) {
        currentWeightTicketId = ticketId;
        currentWeightType = type;
        document.getElementById('weight-modal-title').textContent = type === 'in' ? 'Record Weight In (Gross)' : 'Record Weight Out (Tare)';
        document.getElementById('weight-modal-ticket').textContent = 'Ticket: ' + ticketNumber;
        document.getElementById('weight-value').value = '';
        document.getElementById('weight-modal').style.display = 'flex';
        document.getElementById('weight-value').focus();
      }
      function closeWeightModal() {
        document.getElementById('weight-modal').style.display = 'none';
        currentWeightTicketId = null;
        currentWeightType = null;
      }

      async function submitWeight() {
        const weight = parseFloat(document.getElementById('weight-value').value);
        if (!weight || weight <= 0) { alert('Please enter a valid weight'); return; }
        try {
          await axios.post('/api/scale-tickets/' + currentWeightTicketId + '/weight', {
            type: currentWeightType,
            weight: weight
          });
          closeWeightModal();
          loadTickets();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to record weight');
        }
      }

      async function loadCustomersAndVehicles() {
        try {
          const [custRes, vehRes] = await Promise.all([
            axios.get('/api/employee/customers'),
            axios.get('/api/employee/vehicles')
          ]);
          const custSelect = document.getElementById('ticket-customer');
          custSelect.innerHTML = '<option value="">Select customer...</option>' +
            (custRes.data.customers || []).map(c => \`<option value="\${c.id}">\${escHtml(c.company_name)} - \${escHtml(c.contact_name)}</option>\`).join('');
          const vehSelect = document.getElementById('ticket-vehicle');
          vehSelect.innerHTML = '<option value="">Select vehicle...</option>' +
            (vehRes.data.vehicles || []).map(v => \`<option value="\${v.id}">\${escHtml(v.name)} (\${escHtml(v.plate_number)})</option>\`).join('');
        } catch (err) {
          console.error('Failed to load dropdown data:', err);
        }
      }

      async function createTicket(e) {
        e.preventDefault();
        try {
          await axios.post('/api/scale-tickets', {
            customer_id: parseInt(document.getElementById('ticket-customer').value),
            tire_type: document.getElementById('ticket-tire-type').value,
            notes: document.getElementById('ticket-notes').value
          });
          closeNewTicketModal();
          document.getElementById('new-ticket-form').reset();
          loadTickets();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to create ticket');
        }
      }

      // Void with reason
      function openVoidModal(id) {
        document.getElementById('void-ticket-id').value = id;
        document.getElementById('void-reason').value = '';
        document.getElementById('void-modal').style.display = 'flex';
      }

      async function submitVoid() {
        const id = document.getElementById('void-ticket-id').value;
        const reason = document.getElementById('void-reason').value.trim();
        if (!reason) { alert('Please enter a reason for voiding'); return; }
        try {
          await axios.post('/api/scale-tickets/' + id + '/void', { reason });
          document.getElementById('void-modal').style.display = 'none';
          loadTickets();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to void ticket');
        }
      }

      async function viewTicket(id) {
        try {
          const res = await axios.get('/api/scale-tickets/' + id);
          const t = res.data.ticket;
          const auditTrail = res.data.audit_trail || [];
          document.getElementById('detail-title').textContent = 'Ticket ' + t.ticket_number;

          let photosHtml = '';
          if (t.photo_in || t.photo_out) {
            photosHtml = '<div class="grid grid-cols-2 gap-3 mt-4">' +
              (t.photo_in ? '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-In Photo</div><img src="' + t.photo_in + '" class="w-full rounded-lg border border-gray-200 cursor-pointer" onclick="window.open(this.src)" /></div>' : '') +
              (t.photo_out ? '<div><div class="text-xs text-gray-500 font-semibold mb-1">Weigh-Out Photo</div><img src="' + t.photo_out + '" class="w-full rounded-lg border border-gray-200 cursor-pointer" onclick="window.open(this.src)" /></div>' : '') +
            '</div>';
          }

          let auditHtml = '';
          if (auditTrail.length > 0) {
            auditHtml = '<div class="mt-6 pt-4 border-t border-gray-100"><div class="text-xs font-bold text-gray-500 uppercase mb-2">Audit Trail</div>' +
              '<div class="space-y-1">' + auditTrail.map(a => {
                const ts = new Date(a.created_at).toLocaleString('en-CA', {hour:'2-digit',minute:'2-digit',month:'short',day:'numeric'});
                return '<div class="flex items-center gap-2 text-xs text-gray-500"><span class="font-semibold">' + a.action.replace(/_/g,' ') + '</span><span class="text-gray-400">' + (a.employee_name || '') + '</span><span class="ml-auto text-gray-400">' + ts + '</span></div>';
              }).join('') + '</div></div>';
          }

          let voidInfo = '';
          if (t.status === 'voided' && t.void_reason) {
            voidInfo = '<div class="mt-4 bg-red-50 rounded-xl p-3"><div class="text-xs text-red-600 font-semibold">VOID REASON</div><div class="text-sm text-red-700">' + t.void_reason + '</div></div>';
          }

          document.getElementById('detail-content').innerHTML = \`
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-info-circle text-rc-green"></i> Ticket Info</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between"><span class="text-gray-500">Ticket #</span><span class="font-mono font-bold">\${escHtml(t.ticket_number)}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="px-2 py-0.5 rounded-full text-xs font-semibold \${ticketStatusColors[t.status]}">\${escHtml((t.status || '').replace(/_/g,' ').toUpperCase())}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Customer</span><span class="font-semibold">\${escHtml(t.company_name || 'N/A')}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Operator</span><span>\${escHtml(t.employee_name || 'N/A')}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Material</span><span class="capitalize">\${escHtml((t.tire_type || 'N/A').replace('_',' '))}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Created</span><span>\${new Date(t.created_at).toLocaleString('en-CA')}</span></div>
                  \${t.vehicle_tare_used ? '<div class="flex justify-between"><span class="text-gray-500">Method</span><span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Stored Tare</span></div>' : ''}
                  \${t.receipt_printed ? '<div class="flex justify-between"><span class="text-gray-500">Receipt</span><span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold"><i class="fas fa-print mr-1"></i>Printed</span></div>' : ''}
                </div>
              </div>
              <div>
                <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-weight text-rc-orange"></i> Weight Data</h4>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between"><span class="text-gray-500">Weight In (Gross)</span><span class="font-mono font-bold">\${t.weight_in ? parseFloat(t.weight_in).toFixed(1) + ' kg' : 'Pending'}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Weight Out (Tare)</span><span class="font-mono font-bold">\${t.weight_out ? parseFloat(t.weight_out).toFixed(1) + ' kg' : 'Pending'}</span></div>
                  <div class="flex justify-between border-t pt-2 mt-2"><span class="text-gray-700 font-semibold">Net Weight</span><span class="font-mono font-bold text-lg \${t.net_weight ? 'text-rc-green' : 'text-gray-400'}">\${t.net_weight ? parseFloat(t.net_weight).toFixed(1) + ' kg' : '-'}</span></div>
                  \${t.grand_total ? '<div class="flex justify-between mt-2"><span class="text-gray-700 font-semibold">Total</span><span class="font-mono font-bold text-lg text-rc-green">$' + parseFloat(t.grand_total).toFixed(2) + '</span></div>' : ''}
                </div>
              </div>
            </div>
            \${t.field_store_name || t.field_signature_data ? \`
            <div class="mt-6 pt-6 border-t border-gray-100">
              <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2"><i class="fas fa-tablet-alt text-purple-600"></i> Field Data (Customer Site)</h4>
              <div class="grid md:grid-cols-2 gap-4 text-sm">
                <div><span class="text-gray-500">Store Name:</span> <span class="font-semibold">\${escHtml(t.field_store_name || 'N/A')}</span></div>
                <div><span class="text-gray-500">Employee Name:</span> <span class="font-semibold">\${escHtml(t.field_employee_name || 'N/A')}</span></div>
                <div><span class="text-gray-500">Est. Tires:</span> <span class="font-semibold">\${escHtml(t.field_estimated_tires || 'N/A')}</span></div>
                <div><span class="text-gray-500">Field Completed:</span> <span>\${t.field_completed_at ? new Date(t.field_completed_at).toLocaleString('en-CA') : 'N/A'}</span></div>
              </div>
              \${t.field_cage_photo_url ? \`<div class="mt-4"><img src="\${escAttr(t.field_cage_photo_url)}" class="rounded-xl max-h-48 border border-gray-200" alt="Tire cage photo"></div>\` : ''}
              \${t.field_signature_data ? \`<div class="mt-4"><p class="text-xs text-gray-500 mb-1">Customer Signature:</p><img src="\${escAttr(t.field_signature_data)}" class="border border-gray-200 rounded-lg max-h-24 bg-white" alt="Signature"></div>\` : ''}
            </div>
            \` : ''}
            \${t.notes ? \`<div class="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600"><i class="fas fa-sticky-note mr-1"></i> \${escHtml(t.notes)}</div>\` : ''}
          \` + photosHtml + voidInfo + auditHtml;
          document.getElementById('detail-modal').style.display = 'flex';
        } catch (err) {
          alert('Failed to load ticket details');
        }
      }

      function closeDetailModal() {
        document.getElementById('detail-modal').style.display = 'none';
      }

      (function initTicketsPage() {
        if (typeof axios !== 'undefined') { loadTickets(); }
        else { setTimeout(initTicketsPage, 500); }
      })();
    </script>
  `))
}
