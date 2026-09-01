// Read-only ticket page behind a share link (/t/:token). No session, no sidebar:
// this is what a customer opens from a text or an email, so it has to stand on
// its own and print cleanly to PDF.

type ShareTicket = {
  ticket_number: string
  status: string
  created_at: string
  company_name: string | null
  tire_type: string | null
  driver_display_name: string | null
  weight_in: number | null
  weight_out: number | null
  net_weight: number | null
  grand_total: number | null
}

function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ))
}

const STATUS_LABEL: Record<string, string> = {
  field_pending: 'In field', field_complete: 'To weigh in', weighing_in: 'On scale',
  weighed_in: 'In yard', weighing_out: 'On scale', completed: 'Completed', voided: 'Voided',
}

function kg(v: number | null): string {
  return v === null || v === undefined ? '—' : Number(v).toFixed(1) + ' kg'
}

function row(label: string, value: string, strong = false): string {
  return `<div class="row"><span class="lbl">${esc(label)}</span><span class="${strong ? 'val strong' : 'val'}">${value}</span></div>`
}

export function renderPublicTicket(t: ShareTicket): string {
  const date = t.created_at ? new Date(t.created_at.replace(' ', 'T') + 'Z') : null
  const dateStr = date && !isNaN(date.getTime())
    ? date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'
  const voided = t.status === 'voided'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Scale Ticket ${esc(t.ticket_number)} — Reuse Canada</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f6f4; font-family: 'Inter', -apple-system, sans-serif; color: #1f2937; padding: 24px 16px; }
    .sheet { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.07); overflow: hidden; }
    .head { background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%); color: #fff; padding: 24px; }
    .brand { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; opacity: .8; font-weight: 700; }
    .tnum { font-size: 26px; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .date { opacity: .85; font-size: 13px; margin-top: 2px; }
    .body { padding: 24px; }
    .sect { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #6b7280; font-weight: 700; margin: 20px 0 8px; }
    .sect:first-child { margin-top: 0; }
    .row { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-bottom: 1px solid #f1f2f1; font-size: 14px; }
    .row:last-child { border-bottom: 0; }
    .lbl { color: #6b7280; }
    .val { font-weight: 600; text-align: right; }
    .val.strong { font-size: 18px; font-weight: 800; color: #1B5E20; }
    .total { background: #f0f7f0; border-radius: 12px; padding: 14px 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
    .total .lbl { font-weight: 700; color: #374151; }
    .total .amt { font-size: 22px; font-weight: 800; color: #1B5E20; }
    .void { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; font-weight: 700; text-align: center; margin-bottom: 16px; }
    .foot { padding: 16px 24px 24px; text-align: center; color: #9ca3af; font-size: 12px; }
    .btn { display: inline-block; margin-top: 12px; background: #1B5E20; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 14px; border: 0; cursor: pointer; font-family: inherit; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; max-width: 100%; border-radius: 0; }
      .noprint { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">Reuse Canada · Scale Ticket</div>
      <div class="tnum">${esc(t.ticket_number)}</div>
      <div class="date">${esc(dateStr)}</div>
    </div>
    <div class="body">
      ${voided ? '<div class="void">This ticket has been voided</div>' : ''}
      <div class="sect">Details</div>
      ${row('Customer', esc(t.company_name || 'Walk-In'))}
      ${row('Material', esc((t.tire_type || '—').replace(/_/g, ' ')))}
      ${row('Driver', esc(t.driver_display_name || 'Not recorded'))}
      ${row('Status', esc(STATUS_LABEL[t.status] || t.status))}

      <div class="sect">Weights</div>
      ${row('Weight in (gross)', kg(t.weight_in))}
      ${row('Weight out (tare)', kg(t.weight_out))}
      ${row('Net weight', kg(t.net_weight), true)}

      ${t.grand_total !== null && t.grand_total !== undefined ? `
      <div class="total">
        <span class="lbl">Total</span>
        <span class="amt">$${Number(t.grand_total).toFixed(2)}</span>
      </div>` : ''}
    </div>
    <div class="foot">
      Questions about this ticket? Contact Reuse Canada.
      <div class="noprint"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
    </div>
  </div>
</body>
</html>`
}
