import { formatCurrency, formatDate, formatLiters } from './helpers';
import { LOGO_BASE64 } from './logoBase64';

export function generateReportHTML({ periodLabel, summary, customers, daily, byMethod, customerFilter }) {
  const logo = LOGO_BASE64
    ? `<img src="${LOGO_BASE64}" style="width:64px;height:64px;object-fit:contain;" alt="Logo" />`
    : '';

  const customerRows = customers
    .map(
      (c) => `
    <tr>
      <td>${c.customer_name}</td>
      <td style="text-align:center">${c.entryCount}</td>
      <td style="text-align:right">${formatLiters(c.liters)}</td>
      <td style="text-align:right">${formatCurrency(c.amount)}</td>
      <td style="text-align:right">${formatCurrency(c.notBilled)}</td>
      <td style="text-align:right">${formatCurrency(c.collected)}</td>
    </tr>`
    )
    .join('');

  const dailyRows = daily
    .map(
      (d) => `
    <tr>
      <td>${formatDate(d.date)}</td>
      <td style="text-align:center">${d.entries}</td>
      <td style="text-align:right">${formatLiters(d.liters)}</td>
      <td style="text-align:right">${formatCurrency(d.amount)}</td>
      <td style="text-align:right">${formatCurrency(d.notBilled)}</td>
    </tr>`
    )
    .join('');

  const methodRows = byMethod
    .map(
      (m) => `
    <tr>
      <td>${m.method}</td>
      <td style="text-align:right">${formatCurrency(m.amount)}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Manjula Milk Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1c1c1c; padding: 24px; }
    .wrap { max-width: 900px; margin: 0 auto; border: 2px solid #1f4d1c; padding: 24px; }
    .head { display: flex; gap: 16px; align-items: center; border-bottom: 2px solid #1f4d1c; padding-bottom: 16px; margin-bottom: 20px; }
    h1 { font-size: 20px; color: #1f4d1c; }
    .meta { font-size: 12px; color: #444; margin-top: 6px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
    .sum-card { background: #e8f3e8; padding: 12px; border-radius: 6px; }
    .sum-label { font-size: 11px; color: #666; }
    .sum-val { font-size: 16px; font-weight: 700; color: #1f4d1c; }
    h2 { font-size: 14px; color: #1f4d1c; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
    th { background: #1f4d1c; color: #fff; padding: 8px; text-align: left; }
    td { padding: 7px 8px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      ${logo}
      <div>
        <h1>MANJULA MILK FORMING</h1>
        <div class="meta">Business Report</div>
        <div class="meta">Period: ${periodLabel}</div>
        ${customerFilter ? `<div class="meta">Customer: ${customerFilter}</div>` : '<div class="meta">Customer: All</div>'}
        <div class="meta">Generated: ${formatDate(new Date())}</div>
      </div>
    </div>

    <div class="summary">
      <div class="sum-card"><div class="sum-label">Total Liters</div><div class="sum-val">${formatLiters(summary.totalLiters)}</div></div>
      <div class="sum-card"><div class="sum-label">Milk Amount</div><div class="sum-val">${formatCurrency(summary.totalAmount)}</div></div>
      <div class="sum-card"><div class="sum-label">Entries</div><div class="sum-val">${summary.entryCount}</div></div>
      <div class="sum-card"><div class="sum-label">Collected</div><div class="sum-val">${formatCurrency(summary.totalCollected)}</div></div>
      <div class="sum-card"><div class="sum-label">Not Billed</div><div class="sum-val">${formatCurrency(summary.notBilledAmount)}</div></div>
      <div class="sum-card"><div class="sum-label">Payments</div><div class="sum-val">${summary.paymentCount}</div></div>
    </div>

    <h2>By Customer</h2>
    <table>
      <thead>
        <tr>
          <th>Customer</th><th>Entries</th><th>Liters</th><th>Amount</th><th>Not Billed</th><th>Collected</th>
        </tr>
      </thead>
      <tbody>${customerRows || '<tr><td colspan="6">No data</td></tr>'}</tbody>
    </table>

    <h2>By Day</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Entries</th><th>Liters</th><th>Amount</th><th>Not Billed</th></tr>
      </thead>
      <tbody>${dailyRows || '<tr><td colspan="5">No data</td></tr>'}</tbody>
    </table>

    <h2>Collections by Payment Method</h2>
    <table>
      <thead><tr><th>Method</th><th>Amount</th></tr></thead>
      <tbody>${methodRows || '<tr><td colspan="2">No payments</td></tr>'}</tbody>
    </table>

    <div class="footer">Computer generated report — Manjula Milk Forming</div>
  </div>
</body>
</html>`;
}

export function printReport(html) {
  const w = window.open('', '_blank', 'width=900,height=900');
  if (!w) {
    alert('Please allow pop-ups to print the report.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 800);
}
