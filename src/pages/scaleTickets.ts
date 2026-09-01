import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

export function renderScaleTickets(): string {
  return layout('Scale Tickets', employeePageWrapper('scale-tickets', 'Digital Scale Tickets', `
    <!-- Summary strip -->
    <div class="flex flex-wrap items-end justify-end gap-x-10 gap-y-3 mb-5" id="ticket-stats"></div>

    <!-- Action Bar -->
    <div class="flex flex-col xl:flex-row xl:items-center justify-between mb-5 gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
          <input type="text" id="filter-search" onkeyup="debounceSearch()" class="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none transition-all w-56" placeholder="Search ticket # or customer...">
        </div>
        <select id="filter-status" onchange="loadTickets()" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none transition-all bg-white">
          <option value="">All tickets</option>
          <option value="field_pending,field_complete,weighing_in,weighed_in">Open &mdash; needs action</option>
          <optgroup label="Where the load is">
            <option value="field_pending">In field &mdash; not signed off</option>
            <option value="field_complete">To weigh in &mdash; field done</option>
            <option value="weighed_in">In yard &mdash; needs weigh-out</option>
          </optgroup>
          <optgroup label="Finished">
            <option value="completed">Completed</option>
            <option value="voided">Voided &mdash; cancelled</option>
          </optgroup>
        </select>
        <select id="filter-material" onchange="loadTickets()" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none transition-all bg-white">
          <option value="">All materials</option>
        </select>
        <div class="flex items-center gap-1">
          <input type="date" id="filter-date-from" onchange="loadTickets()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none transition-all">
          <span class="text-gray-300 text-xs">to</span>
          <input type="date" id="filter-date-to" onchange="loadTickets()" class="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none transition-all">
        </div>
        <button type="button" onclick="clearTicketFilters()" id="clear-filters" style="display:none;" class="px-3 py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600"><i class="fas fa-times mr-1"></i>Clear</button>
      </div>
      <div class="flex items-center gap-3">
        <div class="inline-flex bg-gray-100 rounded-xl p-1">
          <button type="button" id="view-list" onclick="setView('list')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">List</button>
          <button type="button" id="view-cards" onclick="setView('cards')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">Cards</button>
          <button type="button" id="view-compact" onclick="setView('compact')" class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">Compact</button>
        </div>
        <button onclick="openNewTicketModal()" class="bg-rc-orange hover:opacity-90 text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm btn-press transition-all flex items-center gap-2 whitespace-nowrap">
          <i class="fas fa-plus"></i> New Scale Ticket
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-3">
      <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
        <input type="checkbox" id="select-all-tickets" onchange="toggleSelectAllTickets(this.checked)" class="rounded border-gray-300 text-rc-green">
        Select all
      </label>
      <span class="text-xs text-gray-400"><span id="ticket-count">0</span> shown</span>
    </div>

    <!-- Floating bulk action bar, shown once anything is selected -->
    <div id="bulk-bar" style="display:none;" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
      <span class="text-sm font-semibold whitespace-nowrap"><span id="bulk-count">0</span> selected</span>
      <div class="w-px h-6 bg-white/20"></div>
      <button type="button" onclick="bulkVoidTickets()" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-red-500/90 hover:bg-red-500 transition-colors whitespace-nowrap"><i class="fas fa-ban mr-1.5"></i>Void</button>
      <button type="button" onclick="exportTicketsCsv()" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"><i class="fas fa-file-csv mr-1.5"></i>Export CSV</button>
      <button type="button" onclick="clearTicketSelection()" class="text-white/40 hover:text-white px-1" title="Clear selection"><i class="fas fa-times"></i></button>
    </div>

    <!-- Results: filled by renderTickets() in whichever view is active -->
    <div id="tickets-view">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>
    </div>

    <!-- New Ticket Modal -->
    <div id="new-ticket-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-modal modal-enter w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><i class="fas fa-weight text-rc-orange"></i></div>
            <div>
              <h3 class="text-lg font-bold text-gray-800">New Scale Ticket</h3>
              <p class="text-xs text-gray-400">Choose a customer and driver, then create the ticket</p>
            </div>
          </div>
          <button onclick="closeNewTicketModal()" class="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><i class="fas fa-times"></i></button>
        </div>

        <form id="new-ticket-form" onsubmit="createTicket(event)" class="px-6 py-5 space-y-6">

          <!-- CUSTOMER: one-click pick from a filtered list, or add a new one inline -->
          <section>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-semibold text-gray-700"><i class="fas fa-building text-gray-300 mr-1.5"></i>Customer</label>
              <button type="button" onclick="toggleNewCustomer()" class="text-xs font-semibold text-rc-green hover:opacity-70 flex items-center gap-1"><i class="fas fa-plus"></i> New Customer</button>
            </div>
            <div id="nc-form" style="display:none;" class="mb-3 p-4 rounded-xl border-2 border-dashed border-green-200 bg-green-50/40 space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <input id="nc-company" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rc-green" placeholder="Company name *">
                <input id="nc-contact" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rc-green" placeholder="Contact name">
              </div>
              <input id="nc-phone" type="tel" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rc-green" placeholder="Phone">
              <div class="flex gap-2">
                <button type="button" onclick="saveNewCustomer()" class="flex-1 bg-rc-green hover:opacity-90 text-white text-sm font-semibold py-2 rounded-lg">Save and select</button>
                <button type="button" onclick="toggleNewCustomer()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg">Cancel</button>
              </div>
              <p id="nc-error" style="display:none;" class="text-xs text-red-500"></p>
            </div>
            <div class="relative mb-2">
              <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
              <input id="cust-search" oninput="renderCustomerList()" class="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-rc-orange" placeholder="Search customers...">
            </div>
            <div id="cust-list" class="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-44 overflow-y-auto"></div>
            <input type="hidden" id="ticket-customer">
            <p id="cust-error" style="display:none;" class="text-xs text-red-500 mt-1.5"><i class="fas fa-exclamation-circle mr-1"></i>Pick a customer first.</p>
          </section>

          <!-- MATERIAL: one-click pills instead of a dropdown -->
          <section>
            <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-layer-group text-gray-300 mr-1.5"></i>Material</label>
            <div id="mat-pills" class="flex flex-wrap gap-2"></div>
            <div id="new-material-form" style="display:none;" class="mt-3 p-4 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/40 space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <input id="nm-name" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rc-orange" placeholder="Material name *">
                <input id="nm-price" type="number" step="0.01" min="0" class="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rc-orange" placeholder="Price per kg *">
              </div>
              <div class="flex gap-2">
                <button type="button" onclick="saveNewMaterial()" class="flex-1 bg-rc-orange hover:opacity-90 text-white text-sm font-semibold py-2 rounded-lg">Add material</button>
                <button type="button" onclick="toggleNewMaterial()" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg">Cancel</button>
              </div>
              <p id="nm-error" style="display:none;" class="text-xs text-red-500"></p>
            </div>
            <input type="hidden" id="ticket-tire-type" value="mixed">
          </section>

          <!-- DRIVER: pick from staff to auto-fill the number, still editable -->
          <section>
            <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-id-card text-gray-300 mr-1.5"></i>Driver</label>
            <select id="ticket-driver-select" onchange="onDriverSelected()" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-rc-orange mb-2 bg-white">
              <option value="">Select a driver...</option>
            </select>
            <div class="grid grid-cols-2 gap-3">
              <input id="ticket-driver-name" class="px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-rc-orange" placeholder="Driver name">
              <input id="ticket-driver-phone" type="tel" oninput="onDriverPhoneEdited()" class="px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-rc-orange" placeholder="780-555-0100">
            </div>
            <label id="save-phone-wrap" style="display:none;" class="mt-2 items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" id="save-phone-to-profile" checked class="rounded border-gray-300 text-rc-green">
              <span id="save-phone-label">Save this number to the driver&apos;s profile</span>
            </label>
          </section>

          <section class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-truck text-gray-300 mr-1.5"></i>Vehicle <span class="text-gray-300 font-normal">(optional)</span></label>
              <select id="ticket-vehicle" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-rc-orange bg-white"><option value="">Select vehicle...</option></select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-sticky-note text-gray-300 mr-1.5"></i>Notes <span class="text-gray-300 font-normal">(optional)</span></label>
              <textarea id="ticket-notes" rows="1" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-rc-orange" placeholder="Optional notes..."></textarea>
            </div>
          </section>

          <div class="flex gap-3 pt-1">
            <button type="submit" id="create-ticket-btn" class="flex-1 bg-rc-orange hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"><i class="fas fa-plus"></i> Create Ticket</button>
            <button type="button" onclick="closeNewTicketModal()" class="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">Cancel</button>
          </div>
        </form>
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
            <button type="button" id="pull-bridge-btn" onclick="pullWeightFromBridge()"
              class="mt-3 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="fas fa-satellite-dish"></i>
              <span id="pull-bridge-label">Pull from Scale House</span>
            </button>
            <p id="pull-bridge-status" class="text-xs text-center mt-2 text-gray-400">
              <i class="fas fa-info-circle mr-1"></i>Pulls the live reading from the connected scale-house terminal
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

      const ticketStatusLabel = {
        field_pending: 'IN FIELD',
        field_complete: 'TO WEIGH IN',
        weighing_in: 'ON SCALE',
        weighed_in: 'IN YARD',
        weighing_out: 'ON SCALE',
        completed: 'COMPLETED',
        voided: 'VOIDED'
      };

      function ticketStatusText(status) {
        return ticketStatusLabel[status] || (status || '').replace(/_/g, ' ').toUpperCase();
      }

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

      // ═══ TICKET LIST: three views over one fetched set ═══
      var allTickets = [], ticketView = 'list';
      // Selection is keyed by id and survives a view switch, but is cleared on
      // every load: after a filter change the old ids may not even be on screen.
      var selectedTickets = new Set();

      var statusBorder = {
        field_pending: 'border-yellow-400', field_complete: 'border-blue-400',
        weighing_in: 'border-indigo-400', weighed_in: 'border-purple-400',
        weighing_out: 'border-orange-400', completed: 'border-green-500', voided: 'border-red-400'
      };

      function ticketCheckbox(t) {
        return '<input type="checkbox" onclick="event.stopPropagation()" onchange="toggleTicketSelect(' + t.id + ', this.checked)"' +
          (selectedTickets.has(t.id) ? ' checked' : '') +
          ' class="rounded border-gray-300 text-rc-green cursor-pointer shrink-0">';
      }
      function rowSelClass(t) { return selectedTickets.has(t.id) ? 'bg-green-50/70' : ''; }

      function fmtKg(v) { return v ? parseFloat(v).toFixed(1) + ' kg' : null; }
      function fmtMoney(v) { return v ? '$' + parseFloat(v).toFixed(2) : null; }
      function fmtDate(v) { return new Date(v).toLocaleDateString('en-CA'); }

      function statusPill(t) {
        var vi = t.status === 'voided' && t.void_reason ? ' title="' + escAttr(t.void_reason) + '"' : '';
        return '<span class="px-2.5 py-1 rounded-full text-xs font-semibold ' + (ticketStatusColors[t.status] || 'bg-gray-100') + '"' + vi + '>' +
          escHtml(ticketStatusText(t.status)) + '</span>';
      }
      function ticketIcons(t) {
        return (t.photo_in ? '<i class="fas fa-camera text-green-400 text-[10px] ml-1" title="Has photo"></i>' : '') +
               (t.receipt_printed ? '<i class="fas fa-print text-blue-400 text-[10px] ml-1" title="Receipt printed"></i>' : '') +
               (t.manual_entry ? '<i class="fas fa-keyboard text-orange-400 text-[10px] ml-1" title="Manual entry"></i>' : '');
      }
      function driverCell(t) {
        if (!t.driver_display_name) return '<span class="text-gray-300">-</span>';
        return escHtml(t.driver_display_name) + (t.driver_display_phone ?
          '<div><a href="tel:' + escAttr(t.driver_display_phone) + '" class="text-xs text-rc-green hover:underline" onclick="event.stopPropagation()">' +
          escHtml(t.driver_display_phone) + '</a></div>' : '');
      }

      function renderStats(list) {
        var net = 0, money = 0, open = 0;
        list.forEach(function(t) {
          net += parseFloat(t.net_weight) || 0;
          money += parseFloat(t.grand_total) || 0;
          if (t.status !== 'completed' && t.status !== 'voided') open++;
        });
        function stat(v, label, cls) {
          return '<div class="text-right"><div class="text-2xl font-extrabold ' + (cls || 'text-gray-900') + '">' + v + '</div>' +
            '<div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">' + label + '</div></div>';
        }
        document.getElementById('ticket-stats').innerHTML =
          stat(list.length, 'Tickets') +
          stat(open, 'Open', open ? 'text-rc-orange' : 'text-gray-900') +
          stat(Math.round(net).toLocaleString() + ' kg', 'Net Weight') +
          stat('$' + money.toFixed(2), 'Total Value', 'text-rc-green');
      }

      function renderList(list) {
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">' +
          list.map(function(t) {
            return '<div onclick="viewTicket(' + t.id + ')" class="px-4 py-3.5 border-l-4 ' + (statusBorder[t.status] || 'border-gray-200') +
              ' hover:bg-gray-50/80 cursor-pointer transition-colors flex items-center gap-4 ' + rowSelClass(t) + '">' +
              ticketCheckbox(t) +
              '<div class="w-40 shrink-0">' +
                '<div class="font-mono font-bold text-sm text-rc-green whitespace-nowrap">' + escHtml(t.ticket_number) + ticketIcons(t) + '</div>' +
                '<div class="text-xs text-gray-400">' + fmtDate(t.created_at) + '</div>' +
              '</div>' +
              '<div class="flex-1 min-w-0">' +
                '<div class="text-sm font-semibold text-gray-800 truncate">' + escHtml(t.company_name || t.field_store_name || 'N/A') + '</div>' +
                '<div class="text-xs text-gray-400 truncate">' + escHtml((t.tire_type || '-').replace(/_/g, ' ')) + ' &middot; ' + escHtml(t.employee_name || '') + '</div>' +
              '</div>' +
              '<div class="w-40 shrink-0 text-sm text-gray-600 hidden xl:block">' + driverCell(t) + '</div>' +
              '<div class="w-28 shrink-0 text-right hidden md:block">' +
                (t.net_weight ? '<div class="font-mono font-bold text-sm text-rc-green">' + fmtKg(t.net_weight) + '</div>' : '<div class="text-gray-300 text-sm">-</div>') +
                (t.weight_in ? '<div class="text-[11px] text-gray-400 font-mono">' + parseFloat(t.weight_in).toFixed(0) + ' &rarr; ' + (t.weight_out ? parseFloat(t.weight_out).toFixed(0) : '?') + '</div>' : '') +
              '</div>' +
              '<div class="w-24 shrink-0 text-right font-mono text-sm ' + (t.grand_total ? 'text-rc-green font-bold' : 'text-gray-300') + '">' + (fmtMoney(t.grand_total) || '-') + '</div>' +
              '<div class="w-32 shrink-0 text-center">' + statusPill(t) + '</div>' +
              '<div class="shrink-0 flex items-center gap-1" onclick="event.stopPropagation()">' + getTicketActions(t) + '</div>' +
            '</div>';
          }).join('') + '</div>';
      }

      function renderCards(list) {
        return '<div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">' +
          list.map(function(t) {
            return '<div onclick="viewTicket(' + t.id + ')" class="bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ' +
              (statusBorder[t.status] || 'border-gray-200') + ' p-5 cursor-pointer hover:shadow-md transition-all ' + rowSelClass(t) + '">' +
              '<div class="flex items-start justify-between gap-2 mb-3">' +
                '<div class="flex items-start gap-2">' + ticketCheckbox(t) +
                '<div><div class="font-mono font-bold text-sm text-rc-green">' + escHtml(t.ticket_number) + ticketIcons(t) + '</div>' +
                '<div class="text-xs text-gray-400">' + fmtDate(t.created_at) + '</div></div></div>' + statusPill(t) +
              '</div>' +
              '<div class="text-sm font-semibold text-gray-800 truncate">' + escHtml(t.company_name || t.field_store_name || 'N/A') + '</div>' +
              '<div class="text-xs text-gray-400 mb-3 capitalize">' + escHtml((t.tire_type || '-').replace(/_/g, ' ')) + '</div>' +
              '<div class="grid grid-cols-2 gap-2 py-3 border-t border-gray-50">' +
                '<div><div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Net weight</div>' +
                  '<div class="font-mono font-bold text-sm ' + (t.net_weight ? 'text-rc-green' : 'text-gray-300') + '">' + (fmtKg(t.net_weight) || '-') + '</div></div>' +
                '<div><div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</div>' +
                  '<div class="font-mono font-bold text-sm ' + (t.grand_total ? 'text-rc-green' : 'text-gray-300') + '">' + (fmtMoney(t.grand_total) || '-') + '</div></div>' +
              '</div>' +
              '<div class="text-xs text-gray-500 pt-2 border-t border-gray-50"><i class="fas fa-id-card text-gray-300 mr-1.5"></i>' + driverCell(t) + '</div>' +
              '<div class="flex items-center gap-1 mt-3" onclick="event.stopPropagation()">' + getTicketActions(t) + '</div>' +
            '</div>';
          }).join('') + '</div>';
      }

      function renderCompact(list) {
        var head = ['', 'Ticket #', 'Customer', 'Driver', 'Status', 'In', 'Out', 'Net', 'Total', 'Date', ''];
        return '<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm">' +
          '<thead class="bg-gray-50/80"><tr>' + head.map(function(h) {
            return '<th class="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">' + h + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          list.map(function(t) {
            return '<tr onclick="viewTicket(' + t.id + ')" class="border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer ' + rowSelClass(t) + '">' +
              '<td class="px-3 py-2">' + ticketCheckbox(t) + '</td>' +
              '<td class="px-3 py-2 font-mono font-bold text-rc-green whitespace-nowrap">' + escHtml(t.ticket_number) + '</td>' +
              '<td class="px-3 py-2 text-gray-800 whitespace-nowrap">' + escHtml(t.company_name || t.field_store_name || 'N/A') + '</td>' +
              '<td class="px-3 py-2 text-gray-600 whitespace-nowrap">' + escHtml(t.driver_display_name || '-') + '</td>' +
              '<td class="px-3 py-2">' + statusPill(t) + '</td>' +
              '<td class="px-3 py-2 font-mono text-gray-600 whitespace-nowrap">' + (fmtKg(t.weight_in) || '-') + '</td>' +
              '<td class="px-3 py-2 font-mono text-gray-600 whitespace-nowrap">' + (fmtKg(t.weight_out) || '-') + '</td>' +
              '<td class="px-3 py-2 font-mono font-bold whitespace-nowrap ' + (t.net_weight ? 'text-rc-green' : 'text-gray-300') + '">' + (fmtKg(t.net_weight) || '-') + '</td>' +
              '<td class="px-3 py-2 font-mono whitespace-nowrap ' + (t.grand_total ? 'text-rc-green font-bold' : 'text-gray-300') + '">' + (fmtMoney(t.grand_total) || '-') + '</td>' +
              '<td class="px-3 py-2 text-gray-400 whitespace-nowrap">' + fmtDate(t.created_at) + '</td>' +
              '<td class="px-3 py-2 whitespace-nowrap" onclick="event.stopPropagation()"><div class="flex items-center gap-1">' + getTicketActions(t) + '</div></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div></div>';
      }

      function renderTickets() {
        renderStats(allTickets);
        document.getElementById('ticket-count').textContent = allTickets.length;
        updateBulkBar();
        var host = document.getElementById('tickets-view');
        if (!allTickets.length) {
          host.innerHTML = '<div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">' +
            '<div class="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fas fa-receipt text-xl text-gray-300"></i></div>' +
            '<p class="text-sm font-semibold text-gray-400">No scale tickets found</p>' +
            '<p class="text-xs text-gray-300 mt-1">Try clearing the filters, or create a ticket.</p></div>';
          return;
        }
        host.innerHTML = ticketView === 'cards' ? renderCards(allTickets)
                       : ticketView === 'compact' ? renderCompact(allTickets)
                       : renderList(allTickets);
      }

      function toggleTicketSelect(id, on) {
        if (on) selectedTickets.add(id); else selectedTickets.delete(id);
        renderTickets();
      }
      function toggleSelectAllTickets(on) {
        selectedTickets = new Set(on ? allTickets.map(function(t) { return t.id; }) : []);
        renderTickets();
      }
      function clearTicketSelection() {
        selectedTickets = new Set();
        var sa = document.getElementById('select-all-tickets');
        if (sa) sa.checked = false;
        renderTickets();
      }
      function updateBulkBar() {
        var n = selectedTickets.size;
        document.getElementById('bulk-count').textContent = n;
        document.getElementById('bulk-bar').style.display = n ? 'flex' : 'none';
        var sa = document.getElementById('select-all-tickets');
        if (sa) sa.checked = n > 0 && n === allTickets.length;
      }
      function selectedTicketRows() {
        return allTickets.filter(function(t) { return selectedTickets.has(t.id); });
      }

      // Void every selected ticket that can still be voided, under one reason.
      // Completed and already-voided tickets are skipped, not failed.
      async function bulkVoidTickets() {
        var rows = selectedTicketRows().filter(function(t) { return t.status !== 'completed' && t.status !== 'voided'; });
        if (!rows.length) { alert('None of the selected tickets can be voided (they are completed or already voided).'); return; }
        document.getElementById('void-ticket-id').value = 'bulk';
        document.getElementById('void-reason').value = '';
        document.getElementById('void-modal').style.display = 'flex';
      }

      function csvCell(v) {
        var s = (v === null || v === undefined) ? '' : String(v);
        return '"' + s.replace(/"/g, '""') + '"';
      }
      function downloadCsv(name, rows) {
        var csv = rows.map(function(r) { return r.map(csvCell).join(','); }).join('\\r\\n');
        var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        var a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      function exportTicketsCsv() {
        var rows = selectedTicketRows();
        if (!rows.length) return;
        var out = [['Ticket #','Date','Customer','Material','Operator','Driver','Driver Phone','Status','Weight In (kg)','Weight Out (kg)','Net Weight (kg)','Total']];
        rows.forEach(function(t) {
          out.push([t.ticket_number, fmtDate(t.created_at), t.company_name || t.field_store_name || '', t.tire_type || '',
            t.employee_name || '', t.driver_display_name || '', t.driver_display_phone || '', t.status || '',
            t.weight_in || '', t.weight_out || '', t.net_weight || '', t.grand_total || '']);
        });
        downloadCsv('scale-tickets-' + new Date().toISOString().slice(0, 10) + '.csv', out);
      }

      function setView(v) {
        ticketView = v;
        try { localStorage.setItem('rc_ticket_view', v); } catch (e) {}
        ['list', 'cards', 'compact'].forEach(function(k) {
          var b = document.getElementById('view-' + k);
          if (b) b.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ' +
            (k === v ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700');
        });
        renderTickets();
      }

      function clearTicketFilters() {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-material').value = '';
        loadTickets();
      }

      async function loadTickets() {
        try {
          const status = document.getElementById('filter-status').value;
          const dateFrom = document.getElementById('filter-date-from').value;
          const dateTo = document.getElementById('filter-date-to').value;
          const search = document.getElementById('filter-search').value.trim();
          const material = document.getElementById('filter-material').value;
          document.getElementById('clear-filters').style.display =
            (status || dateFrom || dateTo || search || material) ? 'block' : 'none';
          let url = '/api/scale-tickets?';
          if (status) url += 'status=' + status + '&';
          if (dateFrom) url += 'date_from=' + dateFrom + '&';
          if (dateTo) url += 'date_to=' + dateTo + '&';
          if (search) url += 'search=' + encodeURIComponent(search) + '&';
          if (material) url += 'material=' + encodeURIComponent(material) + '&';
          const res = await axios.get(url);
          allTickets = res.data.tickets || [];
          selectedTickets = new Set();
          renderTickets();
        } catch (err) {
          console.error('Failed to load tickets:', err);
          document.getElementById('tickets-view').innerHTML =
            '<div class="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center text-red-400">' +
            '<i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i>Could not load tickets. ' +
            '<button onclick="loadTickets()" class="text-rc-green underline">Retry</button></div>';
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
        selectedCustomerId = null;
        document.getElementById('new-ticket-form').reset();
        document.getElementById('ticket-customer').value = '';
        document.getElementById('ticket-tire-type').value = 'mixed';
        document.getElementById('cust-search').value = '';
        document.getElementById('nc-form').style.display = 'none';
        document.getElementById('new-material-form').style.display = 'none';
        document.getElementById('nm-error').style.display = 'none';
        document.getElementById('nc-error').style.display = 'none';
        document.getElementById('cust-error').style.display = 'none';
        document.getElementById('save-phone-wrap').style.display = 'none';
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
        document.getElementById('pull-bridge-status').className = 'text-xs text-center mt-2 text-gray-400';
        document.getElementById('pull-bridge-status').innerHTML = '<i class="fas fa-info-circle mr-1"></i>Pulls the live reading from the connected scale-house terminal';
        document.getElementById('weight-modal').style.display = 'flex';
        document.getElementById('weight-value').focus();
        refreshBridgePreview();
      }
      function closeWeightModal() {
        document.getElementById('weight-modal').style.display = 'none';
        currentWeightTicketId = null;
        currentWeightType = null;
      }

      // Show the current scale-bridge reading on the button label so the
      // operator can see at a glance whether the scale house is live before
      // tapping. Best-effort — silent on failure so the modal still works
      // when the user is offline or the bridge is empty.
      async function refreshBridgePreview() {
        const labelEl = document.getElementById('pull-bridge-label');
        const btn = document.getElementById('pull-bridge-btn');
        if (!labelEl || !btn) return;
        labelEl.textContent = 'Pull from Scale House';
        btn.disabled = false;
        try {
          const res = await axios.get('/api/scale-bridge/current');
          const d = res.data || {};
          if (d.fresh && d.weight_kg > 0) {
            labelEl.textContent = 'Pull from Scale House (' + Number(d.weight_kg).toLocaleString('en-CA', {maximumFractionDigits:1}) + ' kg)';
          } else {
            labelEl.textContent = 'Scale House — no live reading';
            btn.disabled = true;
          }
        } catch (e) { /* leave default label */ }
      }

      async function pullWeightFromBridge() {
        const statusEl = document.getElementById('pull-bridge-status');
        try {
          const res = await axios.get('/api/scale-bridge/current');
          const d = res.data || {};
          if (!d.fresh) {
            statusEl.className = 'text-xs text-center mt-2 text-red-600 font-semibold';
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Scale house terminal is not publishing live weight. Ask them to connect the scale, or enter the weight manually.';
            return;
          }
          if (!(d.weight_kg > 0)) {
            statusEl.className = 'text-xs text-center mt-2 text-amber-600 font-semibold';
            statusEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i>Scale shows 0 kg — drive the truck onto the scale.';
            return;
          }
          document.getElementById('weight-value').value = Number(d.weight_kg).toFixed(1);
          const stableTag = d.is_stable ? ' (stable)' : ' (unstable — wait for the truck to settle)';
          const ageTag = d.age_seconds != null ? ' · ' + d.age_seconds + 's old' : '';
          statusEl.className = 'text-xs text-center mt-2 ' + (d.is_stable ? 'text-rc-green' : 'text-amber-600') + ' font-semibold';
          statusEl.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Pulled ' + Number(d.weight_kg).toFixed(1) + ' kg' + stableTag + ageTag;
        } catch (err) {
          statusEl.className = 'text-xs text-center mt-2 text-red-600 font-semibold';
          statusEl.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Failed to reach the scale bridge.';
        }
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

      // ═══ NEW TICKET FORM ═══
      // Caches so the customer list can be filtered and the driver's number
      // looked up without another round trip on every keystroke.
      var custCache = [], vehCache = [], driverCache = [], materialCache = [], selectedCustomerId = null;

      var MATERIALS = [
        ['mixed', 'Tires - Mixed'],
        ['passenger', 'Tires - Passenger'],
        ['truck', 'Commercial Truck'],
        ['off-road', 'Off-Road'],
        ['shingles', 'Roofing Shingles']
      ];

      function renderMaterialPills() {
        var cur = document.getElementById('ticket-tire-type').value || 'mixed';
        // Source of truth is the pricing table, so a material you price shows up
        // here automatically (scrap_metal was priced but missing from the old
        // hardcoded list). MATERIALS is only a fallback if pricing cannot load.
        var list = materialCache.length ? materialCache : MATERIALS.map(function(m) {
          return { material_type: m[0], description: m[1] };
        });
        // &quot; keeps the inline handler quoting simple inside this template string.
        var html = list.map(function(m) {
          var on = m.material_type === cur;
          return '<button type="button" onclick="pickMaterial(&quot;' + m.material_type + '&quot;)" class="px-3.5 py-2 rounded-full text-xs font-semibold border-2 transition-all ' +
            (on ? 'border-rc-orange bg-orange-50 text-rc-orange' : 'border-gray-200 text-gray-500 hover:border-gray-300') + '">' +
            escHtml(m.description || m.material_type) + '</button>';
        }).join('');
        // Empty dashed pill, same height/padding as the others, to add a material.
        html += '<button type="button" onclick="toggleNewMaterial()" title="Add a material" aria-label="Add a material" class="px-3.5 py-2 min-w-[4.5rem] rounded-full text-xs font-semibold border-2 border-dashed border-gray-300 text-gray-400 hover:border-rc-orange hover:text-rc-orange transition-all"><i class="fas fa-plus"></i></button>';
        document.getElementById('mat-pills').innerHTML = html;
      }

      function toggleNewMaterial() {
        var f = document.getElementById('new-material-form');
        var open = f.style.display === 'block';
        f.style.display = open ? 'none' : 'block';
        document.getElementById('nm-error').style.display = 'none';
        if (!open) document.getElementById('nm-name').focus();
      }

      async function saveNewMaterial() {
        var name = document.getElementById('nm-name').value.trim();
        var price = parseFloat(document.getElementById('nm-price').value);
        var err = document.getElementById('nm-error');
        if (!name) { err.textContent = 'Material name is required.'; err.style.display = 'block'; return; }
        if (!isFinite(price) || price < 0) { err.textContent = 'Enter a price per kg (0 is fine).'; err.style.display = 'block'; return; }
        try {
          // The API slugifies material_type itself; description is the pill label.
          var res = await axios.post('/api/pricing', {
            material_type: name, description: name, price_per_kg: price, price_per_tire: 0
          });
          await loadMaterials();
          if (res.data && res.data.material_type) pickMaterial(res.data.material_type);
          document.getElementById('nm-name').value = '';
          document.getElementById('nm-price').value = '';
          document.getElementById('new-material-form').style.display = 'none';
        } catch (e2) {
          err.textContent = (e2.response && e2.response.data && e2.response.data.error) ||
            'Could not add material (admin or manager access required).';
          err.style.display = 'block';
        }
      }

      async function loadMaterials() {
        try {
          const res = await axios.get('/api/pricing');
          materialCache = (res.data.pricing || []).map(function(p) {
            return { material_type: p.material_type, description: p.description || p.material_type };
          });
        } catch (e) { materialCache = []; }
        renderMaterialPills();
        populateMaterialFilter();
      }

      // The filter list is the pricing table, same source as the pills, so a
      // material you can put on a ticket is always one you can filter by.
      function populateMaterialFilter() {
        var sel = document.getElementById('filter-material');
        if (!sel) return;
        var keep = sel.value;
        sel.innerHTML = '<option value="">All materials</option>' +
          materialCache.map(function(m) {
            return '<option value="' + escAttr(m.material_type) + '">' + escHtml(m.description || m.material_type) + '</option>';
          }).join('');
        sel.value = keep;
      }
      function pickMaterial(v) {
        document.getElementById('ticket-tire-type').value = v;
        renderMaterialPills();
      }

      function renderCustomerList() {
        var q = (document.getElementById('cust-search').value || '').toLowerCase();
        var list = custCache.filter(function(c) {
          if (!q) return true;
          return (c.company_name || '').toLowerCase().indexOf(q) >= 0 ||
                 (c.contact_name || '').toLowerCase().indexOf(q) >= 0;
        });
        var el = document.getElementById('cust-list');
        if (!list.length) {
          el.innerHTML = '<div class="px-4 py-6 text-center text-xs text-gray-400">No customers match that search</div>';
          return;
        }
        el.innerHTML = list.map(function(c) {
          var on = String(c.id) === String(selectedCustomerId);
          return '<div onclick="pickCustomer(' + c.id + ')" class="px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ' +
            (on ? 'bg-orange-50' : 'hover:bg-gray-50') + '">' +
            '<div><div class="text-sm font-semibold text-gray-800">' + escHtml(c.company_name || '') + '</div>' +
            '<div class="text-xs text-gray-400">' + escHtml(c.contact_name || '') + '</div></div>' +
            (on ? '<i class="fas fa-check-circle text-rc-orange"></i>' : '') + '</div>';
        }).join('');
      }
      function pickCustomer(id) {
        selectedCustomerId = id;
        document.getElementById('ticket-customer').value = id;
        document.getElementById('cust-error').style.display = 'none';
        renderCustomerList();
      }

      function toggleNewCustomer() {
        var f = document.getElementById('nc-form');
        var open = f.style.display === 'block';
        f.style.display = open ? 'none' : 'block';
        document.getElementById('nc-error').style.display = 'none';
        if (!open) document.getElementById('nc-company').focus();
      }

      async function saveNewCustomer() {
        var company = document.getElementById('nc-company').value.trim();
        var err = document.getElementById('nc-error');
        if (!company) { err.textContent = 'Company name is required.'; err.style.display = 'block'; return; }
        try {
          // Reuses the scale-house quick-customer endpoint: it synthesises the
          // placeholder login the customers table requires, so no password UI here.
          var res = await axios.post('/api/scale-tickets/quick-customer', {
            company_name: company,
            contact_name: document.getElementById('nc-contact').value.trim(),
            phone: document.getElementById('nc-phone').value.trim()
          });
          custCache.unshift({ id: res.data.id, company_name: res.data.company_name, contact_name: res.data.contact_name });
          document.getElementById('nc-company').value = '';
          document.getElementById('nc-contact').value = '';
          document.getElementById('nc-phone').value = '';
          document.getElementById('nc-form').style.display = 'none';
          document.getElementById('cust-search').value = '';
          pickCustomer(res.data.id);
        } catch (e2) {
          err.textContent = (e2.response && e2.response.data && e2.response.data.error) || 'Could not create customer.';
          err.style.display = 'block';
        }
      }

      function renderDriverSelect() {
        document.getElementById('ticket-driver-select').innerHTML =
          '<option value="">Select a driver...</option>' +
          driverCache.map(function(d) {
            var nm = (d.first_name || '') + ' ' + (d.last_name || '');
            return '<option value="' + d.id + '">' + escHtml(nm.trim()) + (d.phone ? ' - ' + escHtml(d.phone) : ' (no number on file)') + '</option>';
          }).join('') +
          '<option value="other">Other / not on staff</option>';
      }

      // Selecting a driver fills the number from their staff record; both fields
      // stay editable because a walk-in driver is not on staff at all.
      function onDriverSelected() {
        var v = document.getElementById('ticket-driver-select').value;
        var nameEl = document.getElementById('ticket-driver-name');
        var phoneEl = document.getElementById('ticket-driver-phone');
        document.getElementById('save-phone-wrap').style.display = 'none';
        if (!v || v === 'other') {
          nameEl.value = ''; phoneEl.value = '';
          if (v === 'other') nameEl.focus();
          return;
        }
        var d = driverCache.filter(function(x) { return String(x.id) === String(v); })[0];
        if (!d) return;
        nameEl.value = ((d.first_name || '') + ' ' + (d.last_name || '')).trim();
        phoneEl.value = d.phone || '';
        if (!d.phone) offerToSavePhone(d);
      }

      function offerToSavePhone(d) {
        document.getElementById('save-phone-label').textContent = "Save this number to " + (d.first_name || 'this driver') + "'s profile";
        document.getElementById('save-phone-wrap').style.display = 'flex';
      }

      // Typing a number that differs from the one on file offers to write it back,
      // so the number travels with the driver instead of living on one ticket.
      function onDriverPhoneEdited() {
        var v = document.getElementById('ticket-driver-select').value;
        if (!v || v === 'other') return;
        var d = driverCache.filter(function(x) { return String(x.id) === String(v); })[0];
        if (!d) return;
        var typed = document.getElementById('ticket-driver-phone').value.trim();
        if (typed && typed !== (d.phone || '')) offerToSavePhone(d);
        else document.getElementById('save-phone-wrap').style.display = 'none';
      }

      async function loadCustomersAndVehicles() {
        try {
          const [custRes, vehRes, staffRes, priceRes] = await Promise.all([
            axios.get('/api/employee/customers'),
            axios.get('/api/employee/vehicles'),
            axios.get('/api/employee/staff'),
            axios.get('/api/pricing')
          ]);
          materialCache = (priceRes.data.pricing || []).map(function(p) {
            return { material_type: p.material_type, description: p.description || p.material_type };
          });
          // Hide the Walk-In sentinel: it is a placeholder row, not a real customer.
          custCache = (custRes.data.customers || []).filter(function(c) { return c.company_name !== 'Walk-In'; });
          vehCache = vehRes.data.vehicles || [];
          // Anyone on staff can end up behind the wheel, but list drivers first.
          driverCache = (staffRes.data.employees || [])
            .filter(function(e) { return e.is_active; })
            .sort(function(a, b) { return (a.role === 'driver' ? 0 : 1) - (b.role === 'driver' ? 0 : 1); });
          renderCustomerList();
          renderDriverSelect();
          renderMaterialPills();
          document.getElementById('ticket-vehicle').innerHTML = '<option value="">Select vehicle...</option>' +
            vehCache.map(function(v) {
              return '<option value="' + v.id + '">' + escHtml(v.name || '') + (v.plate_number ? ' (' + escHtml(v.plate_number) + ')' : '') + '</option>';
            }).join('');
        } catch (err) {
          console.error('Failed to load dropdown data:', err);
        }
      }

      async function createTicket(e) {
        e.preventDefault();
        var custId = document.getElementById('ticket-customer').value;
        if (!custId) {
          document.getElementById('cust-error').style.display = 'block';
          return;
        }
        var btn = document.getElementById('create-ticket-btn');
        btn.disabled = true;
        try {
          var vehVal = document.getElementById('ticket-vehicle').value;
          var driverPhone = document.getElementById('ticket-driver-phone').value.trim() || null;
          var driverSel = document.getElementById('ticket-driver-select').value;
          await axios.post('/api/scale-tickets', {
            customer_id: parseInt(custId),
            tire_type: document.getElementById('ticket-tire-type').value,
            notes: document.getElementById('ticket-notes').value,
            vehicle_id: vehVal ? parseInt(vehVal) : null,
            driver_name: document.getElementById('ticket-driver-name').value.trim() || null,
            driver_phone: driverPhone
          });
          // Write the number back to the driver's staff record so the next ticket
          // fills itself in. Best-effort: a failure here must not lose the ticket.
          if (driverSel && driverSel !== 'other' && driverPhone &&
              document.getElementById('save-phone-wrap').style.display !== 'none' &&
              document.getElementById('save-phone-to-profile').checked) {
            try {
              await axios.post('/api/employee/staff/' + driverSel + '/phone', { phone: driverPhone });
              var d = driverCache.filter(function(x) { return String(x.id) === String(driverSel); })[0];
              if (d) d.phone = driverPhone;
            } catch (e2) {
              console.error('Could not save phone to driver profile:', e2);
            }
          }
          closeNewTicketModal();
          loadTickets();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to create ticket');
        } finally {
          btn.disabled = false;
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
        if (id === 'bulk') {
          var rows = selectedTicketRows().filter(function(t) { return t.status !== 'completed' && t.status !== 'voided'; });
          var failed = 0;
          // Sequential: D1 is a single writer and a partial failure should be
          // reported per ticket rather than aborting the whole batch.
          for (var i = 0; i < rows.length; i++) {
            try { await axios.post('/api/scale-tickets/' + rows[i].id + '/void', { reason }); }
            catch (e) { failed++; console.error('Void failed for ' + rows[i].ticket_number, e); }
          }
          document.getElementById('void-modal').style.display = 'none';
          if (failed) alert('Voided ' + (rows.length - failed) + ' of ' + rows.length + ' tickets. ' + failed + ' failed.');
          loadTickets();
          return;
        }
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

          const shareBar = ticketShareBar(t.id);

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
                  <div class="flex justify-between"><span class="text-gray-500">Status</span><span class="px-2 py-0.5 rounded-full text-xs font-semibold \${ticketStatusColors[t.status]}">\${escHtml(ticketStatusText(t.status))}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Customer</span><span class="font-semibold">\${escHtml(t.company_name || 'N/A')}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Operator</span><span>\${escHtml(t.employee_name || 'N/A')}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Driver</span><span>\${escHtml(t.driver_display_name || 'Not recorded')}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Driver Phone</span><span>\${t.driver_display_phone ? '<a href="tel:' + escAttr(t.driver_display_phone) + '" class="text-rc-green font-semibold hover:underline">' + escHtml(t.driver_display_phone) + '</a>' : 'N/A'}</span></div>
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
          \` + photosHtml + voidInfo + shareBar + auditHtml;
          document.getElementById('detail-modal').style.display = 'flex';
        } catch (err) {
          // Log the real error: a bare alert gave no way to tell a 401 from a
          // missing ticket from a render bug when a deep link failed to open.
          console.error('viewTicket(' + id + ') failed:', err);
          alert('Failed to load ticket details: ' + (err && err.message ? err.message : err));
        }
      }

      function closeDetailModal() {
        document.getElementById('detail-modal').style.display = 'none';
      }

      (function initTicketsPage() {
        if (typeof axios !== 'undefined') {
          var savedView = 'list';
          try { savedView = localStorage.getItem('rc_ticket_view') || 'list'; } catch (e) {}
          setView(savedView);
          loadMaterials();
          loadTickets();
          // Deep link from the dashboard "Open Scale Tickets" card:
          // /employee/scale-tickets?ticket=<id> opens that ticket's detail modal
          // directly. Digits only, so nothing odd reaches the API path.
          var wanted = new URLSearchParams(window.location.search).get('ticket');
          if (wanted && /^[0-9]+$/.test(wanted)) viewTicket(wanted);
        }
        else { setTimeout(initTicketsPage, 500); }
      })();
    </script>
  `))
}
