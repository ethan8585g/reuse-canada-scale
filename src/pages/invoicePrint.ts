// Printable invoice (A4/Letter, browser-print).
//
// Sits at /employee/invoices/:id/print. The route handler returns this static
// shell unconditionally — no D1 read in the worker — so the page itself can't
// leak invoice PII to an unauthenticated visitor. Rendering happens client-side
// after a Bearer-authenticated GET /api/invoices/:id, the same auth shape used
// by every other employee page.

export function renderInvoicePrint(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice | Reuse Canada</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { font-family: -apple-system, system-ui, sans-serif; color:#222; margin:0; padding:32px; max-width: 8.5in; }
  h1 { margin:0; font-size: 32px; letter-spacing:-0.5px; color:#1B5E20; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:16px; border-bottom:3px solid #1B5E20; }
  .label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#888; margin-bottom:4px; font-weight:600; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:32px; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead th { background:#f5f5f5; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#666; padding:8px; text-align:left; border-bottom:2px solid #ddd; }
  thead th.right { text-align:right; }
  .totals { width: 320px; margin-left: auto; }
  .totals .row { display:flex; justify-content:space-between; padding:4px 0; font-size:14px; }
  .totals .grand { font-size:18px; font-weight:700; border-top:2px solid #222; padding-top:8px; margin-top:8px; }
  .notes { background:#f9f9f9; padding:12px; border-radius:6px; font-size:13px; color:#555; margin-bottom:24px; }
  .footer { margin-top:48px; padding-top:16px; border-top:1px solid #eee; font-size:11px; color:#888; text-align:center; }
  .void-overlay { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-25deg); font-size:120px; color:rgba(220,0,0,0.18); font-weight:900; pointer-events:none; letter-spacing:8px; z-index:1000; }
  .controls { background:#FFF3E0; padding:8px 16px; border:1px solid #F57C00; border-radius:6px; margin-bottom:16px; font-size:13px; }
  .status-msg { padding:48px; text-align:center; color:#666; font-size:14px; }
  .status-msg.err { color:#b71c1c; }
  @media print { .controls { display:none; } body { padding:0; } }
</style>
</head>
<body>
  <div id="invoice-root">
    <div class="status-msg">Loading invoice…</div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script>
    function escHtml(s) {
      if (s === null || s === undefined) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    function money(n) { return '$' + (Number(n) || 0).toFixed(2); }
    function dateOnly(s) { return s ? String(s).split('T')[0].split(' ')[0] : '—'; }

    function showError(msg) {
      document.getElementById('invoice-root').innerHTML =
        '<div class="status-msg err">' + escHtml(msg) + '</div>';
    }

    function render(inv, lines) {
      var e = escHtml;
      var statusBadge =
        inv.status === 'void'  ? '<span style="color:#999;text-decoration:line-through">VOID</span>' :
        inv.status === 'draft' ? '<span style="color:#b58900">DRAFT</span>' : '';

      var lineRows = (lines || []).map(function(li) {
        return '<tr>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;font-size:11px">' + e(li.ticket_number || '—') + '</td>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee">' + e(li.description) + '</td>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + (Number(li.quantity) || 0).toFixed(1) + ' ' + e(li.unit) + '</td>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + money(li.unit_price) + '</td>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + money(li.line_subtotal) + '</td>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">' + money(li.line_tax) + '</td>' +
          '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">' + money(li.line_total) + '</td>' +
        '</tr>';
      }).join('');

      var html =
        (inv.status === 'void' ? '<div class="void-overlay">VOID</div>' : '') +
        '<div class="controls">' +
          '<button onclick="window.print()" style="background:#1B5E20;color:white;border:0;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600">Print</button>' +
          '<span style="margin-left:12px;color:#666">Press <b>Cmd/Ctrl+P</b> or use the button — this banner won\\'t be in the printout.</span>' +
        '</div>' +
        '<div class="header">' +
          '<div>' +
            '<h1>REUSE CANADA</h1>' +
            '<div style="color:#666;font-size:13px;margin-top:4px">Tire Recycling &amp; Reuse</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:28px;font-weight:700;letter-spacing:-0.5px">INVOICE</div>' +
            '<div style="font-family:monospace;font-size:14px;color:#666;margin-top:4px">' + e(inv.invoice_number) + '</div>' +
            (statusBadge ? '<div style="font-size:14px;margin-top:8px;font-weight:600">' + statusBadge + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="grid">' +
          '<div>' +
            '<div class="label">Billed To</div>' +
            '<div style="font-size:16px;font-weight:600;margin-bottom:2px">' + e(inv.company_name || '—') + '</div>' +
            '<div style="font-size:13px;color:#555">' + e(inv.contact_name || '') + '</div>' +
            '<div style="font-size:13px;color:#666">' + e(inv.address || '') + '</div>' +
            '<div style="font-size:13px;color:#666">' + e(inv.city || '') + ' ' + e(inv.province || '') + ' ' + e(inv.postal_code || '') + '</div>' +
            '<div style="font-size:13px;color:#666;margin-top:6px">' + e(inv.phone || '') + '</div>' +
            '<div style="font-size:13px;color:#666">' + e(inv.customer_email || '') + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div style="margin-bottom:8px"><span class="label">Issued</span><div style="font-size:14px">' + (dateOnly(inv.issued_at) || 'Not yet issued') + '</div></div>' +
            '<div style="margin-bottom:8px"><span class="label">Due</span><div style="font-size:14px">' + dateOnly(inv.due_date) + '</div></div>' +
          '</div>' +
        '</div>' +
        '<table>' +
          '<thead><tr>' +
            '<th>Ticket</th><th>Description</th><th class="right">Qty</th><th class="right">Rate</th>' +
            '<th class="right">Subtotal</th><th class="right">Tax</th><th class="right">Total</th>' +
          '</tr></thead>' +
          '<tbody>' + (lineRows || '<tr><td colspan="7" style="padding:24px;text-align:center;color:#999">No line items</td></tr>') + '</tbody>' +
        '</table>' +
        '<div class="totals">' +
          '<div class="row"><span style="color:#666">Subtotal</span><span>' + money(inv.subtotal) + '</span></div>' +
          '<div class="row"><span style="color:#666">GST</span><span>' + money(inv.tax_amount) + '</span></div>' +
          '<div class="row grand"><span>Total Due</span><span>' + money(inv.total) + '</span></div>' +
        '</div>' +
        (inv.notes ? '<div class="notes"><b>Notes:</b> ' + e(inv.notes) + '</div>' : '') +
        '<div class="footer">Reuse Canada · Edmonton, AB · Thank you for your business.</div>';

      document.getElementById('invoice-root').innerHTML = html;
      document.title = inv.invoice_number + ' | Reuse Canada';
      setTimeout(function() { window.print(); }, 400);
    }

    (function init() {
      var session = {};
      try { session = JSON.parse(localStorage.getItem('rc_session') || '{}'); } catch (e) {}
      if (!session.token) {
        showError('You must sign in to view this invoice.');
        setTimeout(function() { window.location.href = '/?next=' + encodeURIComponent(window.location.pathname); }, 1500);
        return;
      }
      var parts = window.location.pathname.split('/');
      var id = parts[parts.length - 2];
      axios.get('/api/invoices/' + id, { headers: { Authorization: 'Bearer ' + session.token } })
        .then(function(res) { render(res.data.invoice, res.data.line_items || []); })
        .catch(function(err) {
          var status = err && err.response && err.response.status;
          if (status === 401 || status === 403) showError('Not authorized to view this invoice.');
          else if (status === 404) showError('Invoice not found.');
          else showError('Failed to load invoice.');
        });
    })();
  </script>
</body>
</html>`;
}
