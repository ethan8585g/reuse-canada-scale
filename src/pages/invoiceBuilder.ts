import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

// Standalone page for building a new invoice. Flow:
//   1. Pick a customer (typeahead against /api/employee/customers/all).
//   2. Hits /api/invoices/uninvoiced-tickets/list to get billable tickets.
//   3. Operator multi-selects, sees running totals, sets due date / notes.
//   4. Submits to POST /api/invoices — created as 'draft'. Operator can then
//      open it from the list and click Issue to lock it.
//
// Walk-in customers are excluded server-side; the UI mirrors that by hiding
// the sentinel customer in the picker (filtered on company_name).
export function renderInvoiceBuilder(): string {
  return layout('New Invoice', employeePageWrapper('invoices', 'New Invoice', `
    <div class="mb-4">
      <a href="/employee/invoices" class="text-sm text-gray-500 hover:text-rc-green"><i class="fas fa-arrow-left mr-1"></i> Back to invoices</a>
    </div>

    <!-- Step 1: customer -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
      <h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-user mr-2 text-rc-green"></i>1. Choose Customer</h3>
      <div class="relative">
        <input type="text" id="customer-search" placeholder="Type company name..." autocomplete="off"
          class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
        <div id="customer-results" class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-10 hidden"></div>
      </div>
      <div id="selected-customer" class="hidden mt-3 p-3 bg-rc-green-50 border border-rc-green/20 rounded-xl flex items-center justify-between">
        <div>
          <div class="font-semibold text-gray-800" id="sc-name"></div>
          <div class="text-xs text-gray-500" id="sc-contact"></div>
        </div>
        <button onclick="clearCustomer()" class="text-gray-400 hover:text-red-500"><i class="fas fa-times"></i></button>
      </div>
    </div>

    <!-- Step 2: tickets -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6" id="tickets-section" style="display:none;">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-800"><i class="fas fa-receipt mr-2 text-rc-green"></i>2. Select Tickets</h3>
        <div class="flex gap-2 text-xs">
          <button onclick="selectAll(true)"  class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg">Select all</button>
          <button onclick="selectAll(false)" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg">Clear</button>
        </div>
      </div>
      <div id="tickets-table" class="border border-gray-200 rounded-xl overflow-hidden">
        <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin"></i></div>
      </div>
    </div>

    <!-- Step 3: details + submit -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6" id="details-section" style="display:none;">
      <h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-cog mr-2 text-rc-green"></i>3. Invoice Details</h3>
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Due Date (optional)</label>
          <input type="date" id="f-due" class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Notes (optional)</label>
          <input type="text" id="f-notes" maxlength="1000" placeholder="PO #, references, etc." class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-rc-green outline-none">
        </div>
      </div>

      <!-- Running totals -->
      <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
        <div class="flex justify-between text-sm"><span class="text-gray-500">Tickets selected</span><span id="t-count">0</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Subtotal</span><span id="t-subtotal">$0.00</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">GST</span><span id="t-tax">$0.00</span></div>
        <div class="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2"><span>Total</span><span id="t-total">$0.00</span></div>
      </div>

      <div class="flex gap-3 justify-end">
        <a href="/employee/invoices" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</a>
        <button id="submit-btn" onclick="submitInvoice(false)" class="px-5 py-2.5 bg-white border-2 border-rc-green text-rc-green hover:bg-rc-green-50 font-semibold rounded-xl"><i class="fas fa-save mr-1"></i> Save as Draft</button>
        <button id="submit-issue-btn" onclick="submitInvoice(true)" class="px-5 py-2.5 bg-rc-green hover:bg-rc-green-light text-white font-semibold rounded-xl"><i class="fas fa-paper-plane mr-1"></i> Save &amp; Issue</button>
      </div>
    </div>

    <script>
      let allCustomers = [];
      let selectedCustomer = null;
      let tickets = [];
      const picked = new Set();

      function money(n) { return '$' + (Number(n) || 0).toFixed(2); }
      function dateOnly(s) { return s ? String(s).split('T')[0].split(' ')[0] : '—'; }

      async function loadCustomers() {
        try {
          const res = await axios.get('/api/employee/customers/all?status=active');
          // Sentinel walk-in customer is is_active=0 so it won't appear here,
          // but defence-in-depth: filter by company_name too.
          allCustomers = (res.data.customers || []).filter(c => (c.company_name || '').toLowerCase() !== 'walk-in');
        } catch (err) {
          console.error('customers load:', err);
        }
      }

      function searchCustomers() {
        const q = (document.getElementById('customer-search').value || '').toLowerCase().trim();
        const box = document.getElementById('customer-results');
        if (!q) { box.classList.add('hidden'); return; }
        const matches = allCustomers.filter(c =>
          (c.company_name || '').toLowerCase().includes(q) ||
          (c.contact_name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q)
        ).slice(0, 20);
        if (matches.length === 0) {
          box.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400">No matches</div>';
        } else {
          box.innerHTML = matches.map(c =>
            '<button type="button" onclick="pickCustomer(' + c.id + ')" class="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">' +
              '<div class="font-semibold text-sm text-gray-800">' + escHtml(c.company_name) + '</div>' +
              '<div class="text-xs text-gray-500">' + escHtml(c.contact_name || '') + ' &middot; ' + escHtml(c.email || '') + '</div>' +
            '</button>'
          ).join('');
        }
        box.classList.remove('hidden');
      }

      function pickCustomer(id) {
        const c = allCustomers.find(x => x.id === id);
        if (!c) return;
        selectedCustomer = c;
        document.getElementById('customer-search').value = '';
        document.getElementById('customer-results').classList.add('hidden');
        document.getElementById('sc-name').textContent = c.company_name;
        document.getElementById('sc-contact').textContent = (c.contact_name || '') + ' · ' + (c.email || '');
        document.getElementById('selected-customer').classList.remove('hidden');
        document.getElementById('tickets-section').style.display = 'block';
        loadTickets();
      }

      function clearCustomer() {
        selectedCustomer = null;
        tickets = [];
        picked.clear();
        document.getElementById('selected-customer').classList.add('hidden');
        document.getElementById('tickets-section').style.display = 'none';
        document.getElementById('details-section').style.display = 'none';
        updateTotals();
      }

      async function loadTickets() {
        const box = document.getElementById('tickets-table');
        box.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin"></i></div>';
        try {
          const res = await axios.get('/api/invoices/uninvoiced-tickets/list?customer_id=' + selectedCustomer.id);
          tickets = res.data.tickets || [];
          renderTickets();
        } catch (err) {
          box.innerHTML = '<div class="text-center py-8 text-red-500">Failed to load tickets</div>';
        }
      }

      function renderTickets() {
        const box = document.getElementById('tickets-table');
        if (tickets.length === 0) {
          box.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-2xl mb-2 block"></i>No uninvoiced tickets for this customer</div>';
          document.getElementById('details-section').style.display = 'none';
          return;
        }
        box.innerHTML = \`
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2"><input type="checkbox" id="select-all-cb" onchange="selectAll(this.checked)"></th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Material</th>
                <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Net Weight</th>
                <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th class="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody>\${tickets.map(t => \`
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-3 py-2"><input type="checkbox" data-id="\${t.id}" onchange="toggleTicket(\${t.id}, this.checked)"></td>
                <td class="px-3 py-2 text-sm font-mono">\${escHtml(t.ticket_number)}</td>
                <td class="px-3 py-2 text-sm text-gray-500">\${dateOnly(t.weight_out_at)}</td>
                <td class="px-3 py-2 text-sm">\${escHtml(t.material_description || t.tire_type || '—')}\${t.material_grade ? ' <span class="text-xs text-gray-400">(' + escHtml(t.material_grade) + ')</span>' : ''}</td>
                <td class="px-3 py-2 text-sm text-right">\${(Number(t.net_weight) || 0).toFixed(1)} kg</td>
                <td class="px-3 py-2 text-sm text-right">\${money(t.price_per_kg)}</td>
                <td class="px-3 py-2 text-sm text-right font-semibold">\${money(t.grand_total)}</td>
                <td class="px-3 py-2 text-center text-xs">
                  \${t.payment_status === 'paid' ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Paid at scale</span>' : '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Unpaid</span>'}
                </td>
              </tr>
            \`).join('')}</tbody>
          </table>
        \`;
        // Note: tickets already paid at the scale CAN still be put on an
        // invoice. That's a real workflow — a customer who pays cash for some
        // pickups and runs a NET-30 tab for others wants both on the same
        // statement. Server doesn't block it; we just badge it in the UI.
        document.getElementById('details-section').style.display = 'block';
        updateTotals();
      }

      function selectAll(on) {
        picked.clear();
        document.querySelectorAll('#tickets-table input[type=checkbox][data-id]').forEach(cb => {
          cb.checked = on;
          if (on) picked.add(Number(cb.getAttribute('data-id')));
        });
        const all = document.getElementById('select-all-cb');
        if (all) all.checked = on;
        updateTotals();
      }

      function toggleTicket(id, on) {
        if (on) picked.add(id); else picked.delete(id);
        updateTotals();
      }

      function updateTotals() {
        let sub = 0, tax = 0, tot = 0;
        for (const t of tickets) {
          if (!picked.has(t.id)) continue;
          sub += Number(t.total_amount) || 0;
          tax += Number(t.tax_amount)   || 0;
          tot += Number(t.grand_total)  || 0;
        }
        document.getElementById('t-count').textContent    = picked.size;
        document.getElementById('t-subtotal').textContent = money(sub);
        document.getElementById('t-tax').textContent      = money(tax);
        document.getElementById('t-total').textContent    = money(tot);
        document.getElementById('submit-btn').disabled = picked.size === 0;
        document.getElementById('submit-issue-btn').disabled = picked.size === 0;
      }

      async function submitInvoice(issueAfter) {
        if (!selectedCustomer) { alert('Pick a customer first'); return; }
        if (picked.size === 0) { alert('Select at least one ticket'); return; }
        const draftBtn = document.getElementById('submit-btn');
        const issueBtn = document.getElementById('submit-issue-btn');
        draftBtn.disabled = true; issueBtn.disabled = true;
        try {
          const res = await axios.post('/api/invoices', {
            customer_id: selectedCustomer.id,
            ticket_ids: Array.from(picked),
            due_date: document.getElementById('f-due').value || null,
            notes: document.getElementById('f-notes').value || null,
          });
          const id = res.data.id;
          if (issueAfter) {
            try {
              await axios.post('/api/invoices/' + id + '/issue');
            } catch (e) {
              // Draft was created but issuing failed — send the user to the
              // detail view with an explanation, don't silently land them on
              // the list and let them assume Issue succeeded.
              alert((e.response?.data?.error || 'Failed to issue invoice') + '\\n\\nThe invoice was saved as a draft. Opening it now so you can retry.');
              window.location.href = '/employee/invoices?focus=' + id;
              return;
            }
          }
          window.location.href = '/employee/invoices';
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to create invoice');
          draftBtn.disabled = false; issueBtn.disabled = false;
        }
      }

      document.getElementById('customer-search').addEventListener('input', searchCustomers);
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#customer-search') && !e.target.closest('#customer-results')) {
          document.getElementById('customer-results').classList.add('hidden');
        }
      });

      (function init() {
        if (typeof axios !== 'undefined') { loadCustomers(); }
        else { setTimeout(init, 500); }
      })();
    </script>
  `))
}
