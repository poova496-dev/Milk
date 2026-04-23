// Invoice HTML Template for PDF generation
// Matches the sample invoice style provided by the user

import { formatDate, formatCurrency } from './helpers';

/**
 * Generate invoice HTML for PDF rendering
 * @param {Object} invoiceData - Invoice data object
 * @param {Array} entries - Daily milk entries for the billing period
 * @param {string} logoDataUri - Base64 data URI of the logo
 * @returns {string} HTML string
 */
export const generateInvoiceHTML = (invoiceData, entries = [], logoDataUri = '') => {
  const {
    invoice_number,
    customer_name,
    invoice_date,
    bill_start_date,
    bill_end_date,
    total_liters,
    total_amount,
    paid_amount,
  } = invoiceData;



  const totalDays = entries.length;
  const sortedEntries = [...entries].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
  
  let tableRows = '';
  let summaryRows = '';

  sortedEntries.forEach((e, index) => {
    tableRows += `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td>${formatDate(e.entry_date)}</td>
        <td style="text-align:center">${parseFloat(e.quantity_liters).toFixed(2)}</td>
        <td style="text-align:right">${parseFloat(e.rate_per_liter_used).toFixed(2)}</td>
        <td style="text-align:right">${parseFloat(e.total_amount).toFixed(2)}</td>
      </tr>`;
  });

  if (entries.length === 0) {
    tableRows = `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px;">No entries found for this period</td>
      </tr>`;
  }

  summaryRows = `
    <tr><td><strong>Total Days</strong></td><td style="text-align:right">${totalDays}</td></tr>
    <tr><td><strong>Total Liters</strong></td><td style="text-align:right">${parseFloat(total_liters).toFixed(2)} L</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1C1C1C;
      background: #FFFFFF;
      padding: 20px;
    }
    .invoice-container {
      max-width: 700px;
      margin: 0 auto;
      border: 2px solid #1F4D1C;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 2px solid #1F4D1C;
      padding-bottom: 16px;
    }
    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #1F4D1C;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 11px;
      text-align: center;
      flex-shrink: 0;
    }
    .business-info h1 {
      font-size: 22px;
      color: #1F4D1C;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .business-info .tagline {
      font-size: 12px;
      color: #2E7D32;
      font-style: italic;
      margin-bottom: 6px;
    }
    .business-info .address {
      font-size: 11px;
      color: #444;
      line-height: 1.4;
    }
    .business-info .phone {
      font-size: 11px;
      color: #444;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .invoice-badge {
      background: #1F4D1C;
      color: white;
      padding: 6px 16px;
      font-size: 14px;
      font-weight: 700;
      border: 2px solid #1F4D1C;
      display: inline-block;
      margin-bottom: 8px;
    }
    .invoice-meta {
      font-size: 12px;
      color: #444;
      line-height: 1.6;
    }
    .customer-section {
      background: #E8F3E8;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    .customer-section p {
      font-size: 13px;
      margin-bottom: 4px;
    }
    .customer-section strong {
      color: #1F4D1C;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    table thead th {
      background: #1F4D1C;
      color: white;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
    }
    table tbody td {
      padding: 7px 10px;
      border-bottom: 1px solid #D9D9D9;
      font-size: 12px;
    }
    table tbody tr:nth-child(even) {
      background: #FAFAFA;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 20px;
    }
    .thank-you {
      font-family: 'Georgia', serif;
      font-style: italic;
      font-size: 16px;
      color: #2E7D32;
    }
    .summary-table {
      width: 280px;
    }
    .summary-table table {
      margin-bottom: 0;
    }
    .summary-table td {
      padding: 5px 10px;
      border-bottom: 1px solid #D9D9D9;
      font-size: 12px;
    }
    .total-row {
      background: #1F4D1C !important;
    }
    .total-row td {
      color: white !important;
      font-weight: 700;
      font-size: 14px;
      border-bottom: none;
    }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #D9D9D9;
      text-align: center;
      font-size: 10px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${logoDataUri ? `<img src="${logoDataUri}" class="logo" style="background:transparent; object-fit:contain; border-radius:0;" />` : `<div class="logo">MANJULA<br/>MILK<br/>FORMING</div>`}
        <div class="business-info">
          <h1>MANJULA<br/>MILK FORMING</h1>
          <div class="tagline">Fresh Milk, Healthy Life</div>
          <div class="address">
            📍 Naranikuppam (vil),<br/>
            &nbsp;&nbsp;&nbsp;Kodipall (Po),<br/>
            &nbsp;&nbsp;&nbsp;Krishnagiri (Tk) (Dt),<br/>
            &nbsp;&nbsp;&nbsp;Tamilnadu .635115
          </div>
          <div class="phone">📞 Mob: 9585278394</div>
        </div>
      </div>
      <div class="header-right">
        <div class="invoice-badge">INVOICE</div>
        <div class="invoice-meta">
          <div>Date : ${formatDate(invoice_date)}</div>
          <div>No : ${invoice_number}</div>
        </div>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="customer-section">
      <p><strong>Customer:</strong> ${customer_name}</p>
      <p><strong>Billing Period:</strong> ${formatDate(bill_start_date)} to ${formatDate(bill_end_date)}</p>
    </div>

    <!-- Entry Details Table -->
    <table>
      <thead>
        <tr>
          <th style="width:50px;text-align:center">Sr No.</th>
          <th style="width:130px">Date</th>
          <th style="width:100px;text-align:center">Liter's</th>
          <th style="width:100px;text-align:right">Per Liter Rate (₹)</th>
          <th style="width:120px;text-align:right">Total Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <!-- Summary Section -->
    <div class="summary-section">
      <div>
        <p class="thank-you">Thank you for your business!</p>
      </div>
      <div class="summary-table">
        <table>
          <tbody>
            ${summaryRows}
            <tr class="total-row">
              <td><strong>Total Amount</strong></td>
              <td style="text-align:right"><strong>${parseFloat(total_amount).toFixed(2)}</strong></td>
            </tr>
            ${parseFloat(paid_amount) !== parseFloat(total_amount) ? `
            <tr>
              <td><strong>Paid Amount</strong></td>
              <td style="text-align:right;color:#2E7D32;font-weight:bold">${parseFloat(paid_amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Balance</strong></td>
              <td style="text-align:right;color:#D32F2F;font-weight:bold">${(parseFloat(total_amount) - parseFloat(paid_amount)).toFixed(2)}</td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is a computer generated invoice from Manjula Milk Forming</p>
      <p>For queries contact: 9585278394</p>
    </div>
  </div>
</body>
</html>`;
};
