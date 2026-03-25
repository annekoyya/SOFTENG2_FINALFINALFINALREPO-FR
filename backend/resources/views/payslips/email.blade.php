<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1a1a2e; padding: 28px 32px; text-align: center; }
    .header h1 { color: #facc15; font-size: 22px; margin: 0; }
    .header p  { color: #9ca3af; font-size: 12px; margin: 6px 0 0; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 16px; color: #1a1a2e; margin-bottom: 12px; }
    .body p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 12px; }
    .net-pay-box {
      background: #f0fdf4;
      border: 2px solid #16a34a;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .net-pay-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .net-pay-amount { font-size: 32px; font-weight: bold; color: #16a34a; margin: 6px 0; }
    .net-pay-period { font-size: 12px; color: #9ca3af; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .summary-table td { padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
    .summary-table td:last-child { text-align: right; font-weight: bold; color: #1a1a2e; }
    .note { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 10px 14px; font-size: 12px; color: #92400e; margin: 16px 0; border-radius: 0 4px 4px 0; }
    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 11px; color: #9ca3af; margin: 0; }
    .attachment-note { font-size: 13px; color: #4b5563; margin: 12px 0; }
    .attachment-note span { background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>🪷 Blue Lotus Hotel</h1>
      <p>HR & Payroll Department</p>
    </div>

    <div class="body">
      <div class="greeting">Hello, {{ $employeeName }}!</div>

      <p>
        Your payslip for <strong>{{ $periodLabel }}</strong> is ready.
        Please find your payslip attached to this email as a PDF.
      </p>

      <div class="net-pay-box">
        <div class="net-pay-label">Net Take-Home Pay</div>
        <div class="net-pay-amount">₱{{ number_format($netPay, 2) }}</div>
        <div class="net-pay-period">{{ $periodLabel }}</div>
      </div>

      <table class="summary-table">
        <tr>
          <td>Gross Pay</td>
          <td>₱{{ number_format($grossPay, 2) }}</td>
        </tr>
        <tr>
          <td>Total Deductions</td>
          <td>– ₱{{ number_format($grossPay - $netPay, 2) }}</td>
        </tr>
        <tr>
          <td><strong>Net Pay</strong></td>
          <td><strong>₱{{ number_format($netPay, 2) }}</strong></td>
        </tr>
      </table>

      <p class="attachment-note">
        📎 Attached: <span>payslip_{{ strtolower(str_replace(' ', '-', $employeeName)) }}.pdf</span>
      </p>

      <div class="note">
        If you have any questions or concerns about your payslip,
        please contact the HR department as soon as possible.
      </div>

      <p>
        This payslip is confidential. Please do not share it with others.
      </p>
    </div>

    <div class="footer">
      <p>Blue Lotus Hotel · HR Management System</p>
      <p style="margin-top:4px">This is an automated email. Please do not reply directly.</p>
    </div>

  </div>
</body>
</html>