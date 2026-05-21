import { layout } from '../utils/layout'
import { employeePageWrapper } from '../utils/employeeLayout'

// List + detail page for invoices. The detail view is a slide-over modal so
// it stays on the same screen as the filter state (matches scaleTickets and
// customerManagement patterns). New invoices are created on a dedicated
// builder page (/employee/invoices/new) because the multi-ticket select flow
// doesn't fit inline.
export function renderInvoices(): string {
  return layout('Invoices', employeePageWrapper('invoices', 'Invoicing', `
    <!-- Action Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <select id="filter-status" onchange="loadInvoices()" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="void">Void</option>
        </select>
        <input type="text" id="search-input" placeholder="Search invoice # or customer..." oninput="filterInvoices()"
          class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none w-72">
        <input type="date" id="filter-from" onchange="loadInvoices()" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
        <span class="text-gray-400 text-sm">→</span>
        <input type="date" id="filter-to" onchange="loadInvoices()" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-rc-green outline-none">
      </div>
      <a href="/employee/invoices/new" class="bg-rc-green hover:bg-rc-green-light text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2">
        <i class="fas fa-file-invoice-dollar"></i> New Invoice
      </a>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Drafts</div>
        <div class="text-2xl font-bold text-yellow-600" id="stat-draft">-</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Issued</div>
        <div class="text-2xl font-bold text-rc-green" id="stat-issued">-</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Voided</div>
        <div class="text-2xl font-bold text-gray-400" id="stat-void">-</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="text-sm text-gray-500">Total Issued ($)</div>
        <div class="text-2xl font-bold text-blue-600" id="stat-total">-</div>
      </div>
    </div>

    <div class="text-sm text-gray-500 mb-3"><span id="invoice-count">0</span> invoices</div>

    <!-- Invoice Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issued / Created</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody id="invoice-table-body" class="divide-y divide-gray-50">
            <tr><td colspan="7" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    <div id="detail-modal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style="display:none;">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 class="text-lg font-bold text-gray-800" id="detail-title">Invoice</h3>
          <button onclick="closeDetail()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-6" id="detail-body">
          <div class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
        </div>
      </div>
    </div>

    <script>
      let allInvoices = [];

      function money(n) {
        return '$' + (Number(n) || 0).toFixed(2);
      }
      function statusBadge(s) {
        const map = {
          draft:  'bg-yellow-100 text-yellow-800',
          issued: 'bg-green-100 text-green-800',
          void:   'bg-gray-200 text-gray-600 line-through',
        };
        return '<span class="px-2.5 py-1 rounded-full text-xs font-semibold ' + (map[s] || 'bg-gray-100 text-gray-700') + '">' + escHtml((s || 'unknown').toUpperCase()) + '</span>';
      }
      function dateOnly(s) {
        if (!s) return '—';
        return String(s).split('T')[0].split(' ')[0];
      }

      async function loadInvoices() {
        const status = document.getElementById('filter-status').value;
        const from   = document.getElementById('filter-from').value;
        const to     = document.getElementById('filter-to').value;
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (from)   params.set('date_from', from);
        if (to)     params.set('date_to', to);
        try {
          const res = await axios.get('/api/invoices' + (params.toString() ? '?' + params.toString() : ''));
          allInvoices = res.data.invoices || [];
          filterInvoices();
          updateStats();
        } catch (err) {
          console.error('Load invoices error:', err);
          document.getElementById('invoice-table-body').innerHTML =
            '<tr><td colspan="7" class="px-6 py-8 text-center text-red-500">Failed to load invoices</td></tr>';
        }
      }

      function updateStats() {
        let draft = 0, issued = 0, voided = 0, totalIssued = 0;
        for (const i of allInvoices) {
          if (i.status === 'draft')  draft++;
          if (i.status === 'issued') { issued++; totalIssued += Number(i.total) || 0; }
          if (i.status === 'void')   voided++;
        }
        document.getElementById('stat-draft').textContent = draft;
        document.getElementById('stat-issued').textContent = issued;
        document.getElementById('stat-void').textContent = voided;
        document.getElementById('stat-total').textContent = money(totalIssued);
      }

      function filterInvoices() {
        const q = (document.getElementById('search-input').value || '').toLowerCase();
        const filtered = q ? allInvoices.filter(i =>
          (i.invoice_number || '').toLowerCase().includes(q) ||
          (i.company_name   || '').toLowerCase().includes(q)
        ) : allInvoices;
        renderTable(filtered);
      }

      function renderTable(invoices) {
        document.getElementById('invoice-count').textContent = invoices.length;
        const tbody = document.getElementById('invoice-table-body');
        if (invoices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-400"><i class="fas fa-inbox text-2xl mb-2 block"></i>No invoices found</td></tr>';
          return;
        }
        tbody.innerHTML = invoices.map(i => \`
          <tr class="hover:bg-gray-50 cursor-pointer" onclick="openDetail(\${i.id})">
            <td class="px-4 py-3 font-mono text-sm font-semibold text-gray-800">\${escHtml(i.invoice_number)}</td>
            <td class="px-4 py-3 text-sm text-gray-700">\${escHtml(i.company_name || '—')}</td>
            <td class="px-4 py-3">\${statusBadge(i.status)}</td>
            <td class="px-4 py-3 text-sm text-gray-500">\${dateOnly(i.issued_at || i.created_at)}</td>
            <td class="px-4 py-3 text-sm text-gray-500">\${dateOnly(i.due_date)}</td>
            <td class="px-4 py-3 text-right text-sm font-semibold text-gray-800">\${money(i.total)}</td>
            <td class="px-4 py-3 text-center" onclick="event.stopPropagation()">
              <button onclick="openDetail(\${i.id})" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="View"><i class="fas fa-eye"></i></button>
              <a href="/employee/invoices/\${i.id}/print" target="_blank" class="inline-block p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Print"><i class="fas fa-print"></i></a>
            </td>
          </tr>
        \`).join('');
      }

      async function openDetail(id) {
        document.getElementById('detail-modal').style.display = 'flex';
        document.getElementById('detail-body').innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
        try {
          const res = await axios.get('/api/invoices/' + id);
          renderDetail(res.data.invoice, res.data.line_items || []);
        } catch (err) {
          document.getElementById('detail-body').innerHTML = '<div class="text-center py-8 text-red-500">Failed to load invoice</div>';
        }
      }

      function renderDetail(inv, lines) {
        document.getElementById('detail-title').innerHTML =
          '<span class="font-mono">' + escHtml(inv.invoice_number) + '</span> ' + statusBadge(inv.status);

        const linesHtml = lines.map(li => \`
          <tr class="border-t border-gray-100">
            <td class="px-3 py-2 text-sm font-mono">\${escHtml(li.ticket_number || '—')}</td>
            <td class="px-3 py-2 text-sm">\${escHtml(li.description)}</td>
            <td class="px-3 py-2 text-sm text-right">\${(Number(li.quantity) || 0).toFixed(1)} \${escHtml(li.unit)}</td>
            <td class="px-3 py-2 text-sm text-right">\${money(li.unit_price)}</td>
            <td class="px-3 py-2 text-sm text-right">\${money(li.line_subtotal)}</td>
            <td class="px-3 py-2 text-sm text-right">\${money(li.line_tax)}</td>
            <td class="px-3 py-2 text-sm text-right font-semibold">\${money(li.line_total)}</td>
          </tr>
        \`).join('');

        const canIssue = inv.status === 'draft';
        const canVoid  = inv.status !== 'void';

        document.getElementById('detail-body').innerHTML = \`
          <!-- Customer + meta -->
          <div class="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <div class="text-xs uppercase text-gray-400 font-semibold mb-1">Billed To</div>
              <div class="text-base font-bold text-gray-800">\${escHtml(inv.company_name || '—')}</div>
              <div class="text-sm text-gray-600">\${escHtml(inv.contact_name || '')}</div>
              <div class="text-sm text-gray-500">\${escHtml(inv.address || '')}</div>
              <div class="text-sm text-gray-500">\${escHtml(inv.city || '')} \${escHtml(inv.province || '')} \${escHtml(inv.postal_code || '')}</div>
              <div class="text-sm text-gray-500">\${escHtml(inv.phone || '')}</div>
              <div class="text-sm text-gray-500">\${escHtml(inv.customer_email || '')}</div>
            </div>
            <div class="md:text-right">
              <div class="text-xs uppercase text-gray-400 font-semibold mb-1">Invoice</div>
              <div class="text-sm"><span class="text-gray-500">Issued:</span> \${dateOnly(inv.issued_at) || 'Not yet issued'}</div>
              <div class="text-sm"><span class="text-gray-500">Created:</span> \${dateOnly(inv.created_at)}</div>
              <div class="text-sm"><span class="text-gray-500">Due:</span> \${dateOnly(inv.due_date)}</div>
              <div class="text-sm"><span class="text-gray-500">By:</span> \${escHtml(inv.created_by_name || '—')}</div>
              \${inv.status === 'void' ? '<div class="text-sm text-red-600 mt-2"><b>Voided</b> by ' + escHtml(inv.voided_by_name || '—') + ' on ' + dateOnly(inv.voided_at) + '</div><div class="text-xs text-gray-500">' + escHtml(inv.void_reason || '') + '</div>' : ''}
            </div>
          </div>

          <!-- Line items -->
          <div class="border border-gray-200 rounded-xl overflow-hidden mb-4">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Tax</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>\${linesHtml || '<tr><td colspan="7" class="px-3 py-4 text-center text-gray-400">No line items</td></tr>'}</tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="flex justify-end mb-4">
            <div class="w-full md:w-80 space-y-1">
              <div class="flex justify-between text-sm"><span class="text-gray-500">Subtotal</span><span>\${money(inv.subtotal)}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">GST</span><span>\${money(inv.tax_amount)}</span></div>
              <div class="flex justify-between text-base font-bold border-t border-gray-200 pt-2"><span>Total</span><span>\${money(inv.total)}</span></div>
            </div>
          </div>

          \${inv.notes ? '<div class="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 text-sm text-gray-600"><b class="text-gray-700">Notes:</b> ' + escHtml(inv.notes) + '</div>' : ''}

          <!-- Actions -->
          <div class="flex flex-wrap gap-2 justify-end border-t border-gray-100 pt-4">
            <a href="/employee/invoices/\${inv.id}/print" target="_blank" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl flex items-center gap-2"><i class="fas fa-print"></i> Print</a>
            \${canIssue ? '<button onclick="issueInvoice(' + inv.id + ')" class="px-4 py-2 bg-rc-green hover:bg-rc-green-light text-white font-semibold rounded-xl flex items-center gap-2"><i class="fas fa-paper-plane"></i> Issue</button>' : ''}
            \${canVoid  ? '<button onclick="voidInvoice('  + inv.id + ')" class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl flex items-center gap-2"><i class="fas fa-ban"></i> Void</button>' : ''}
          </div>
        \`;
      }

      function closeDetail() { document.getElementById('detail-modal').style.display = 'none'; }

      async function issueInvoice(id) {
        if (!confirm('Issue this invoice? Once issued, you can only void it, not edit it.')) return;
        try {
          await axios.post('/api/invoices/' + id + '/issue');
          openDetail(id);
          loadInvoices();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to issue invoice');
        }
      }

      async function voidInvoice(id) {
        const reason = prompt('Reason for voiding this invoice? (required)');
        if (!reason || !reason.trim()) return;
        try {
          await axios.post('/api/invoices/' + id + '/void', { reason: reason.trim() });
          openDetail(id);
          loadInvoices();
        } catch (err) {
          alert(err.response?.data?.error || 'Failed to void invoice');
        }
      }

      (function init() {
        if (typeof axios !== 'undefined') { loadInvoices(); }
        else { setTimeout(init, 500); }
      })();
    </script>
  `))
}
