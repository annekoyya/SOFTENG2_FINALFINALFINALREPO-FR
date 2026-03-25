<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9px; color: #1a1a2e; padding: 20px; }

    .header { border-bottom: 3px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 16px; display: table; width: 100%; }
    .h-left  { display: table-cell; vertical-align: middle; }
    .h-right { display: table-cell; vertical-align: middle; text-align: right; }
    .company { font-size: 18px; font-weight: bold; }
    .doc-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .period-label { background: #1a1a2e; color: #facc15; font-size: 9px; padding: 3px 10px; border-radius: 3px; display: inline-block; margin-top: 4px; }

    .summary-boxes { display: table; width: 100%; margin-bottom: 14px; }
    .sbox { display: table-cell; text-align: center; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; margin: 0 2px; }
    .sbox-val { font-size: 13px; font-weight: bold; }
    .sbox-lbl { font-size: 7.5px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
    .green { color: #16a34a; }
    .red   { color: #dc2626; }
    .blue  { color: #1d4ed8; }

    table.main { width: 100%; border-collapse: collapse; font-size: 8px; }
    table.main th {
      background: #1a1a2e; color: #fff;
      padding: 6px 8px; text-align: left;
      font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    table.main th.right, table.main td.right { text-align: right; }
    table.main td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
    table.main tr:nth-child(even) td { background: #fafafa; }
    table.main .total-row td { background: #f3f4f6 !important; font-weight: bold; border-top: 2px solid #1a1a2e; }
    .status-paid     { background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 3px; font-size: 7px; }
    .status-approved { background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 3px; font-size: 7px; }
    .status-computed { background: #fef9c3; color: #854d0e; padding: 1px 6px; border-radius: 3px; font-size: 7px; }

    .statutory-section { margin-top: 14px; }
    .stat-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #1e40af; background: #eff6ff; padding: 5px 10px; margin-bottom: 0; }
    table.stat { width: 100%; border-collapse: collapse; font-size: 8px; }
    table.stat th { background: #dbeafe; color: #1e40af; padding: 5px 8px; text-align: center; font-size: 7.5px; text-transform: uppercase; }
    table.stat td { padding: 4px 8px; text-align: center; border-bottom: 1px solid #f3f4f6; }
    table.stat .total-row td { font-weight: bold; background: #eff6ff !important; }

    .footer { margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: table; width: 100%; }
    .f-left  { display: table-cell; font-size: 7.5px; color: #9ca3af; vertical-align: bottom; }
    .f-right { display: table-cell; text-align: right; vertical-align: bottom; }
    .sig-line { border-top: 1px solid #1a1a2e; width: 160px; margin-left: auto; margin-top: 20px; padding-top: 3px; font-size: 7.5px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>

  <div class="header">
    <div class="h-left">
      <div class="company">🪷 Blue Lotus Hotel</div>
      <div style="font-size:8px; color:#6b7280; margin-top:2px">HR & Payroll Department</div>
    </div>
    <div class="h-right">
      <div class="doc-title">Payroll Summary Report</div>
      <div><span class="period-label">{{ $period->label }}</span></div>
      <div style="font-size:7.5px; color:#6b7280; margin-top:4px">
        Generated: {{ now()->format('F d, Y h:i A') }}
      </div>
    </div>
  </div>

  {{-- Summary boxes --}}
  <div class="summary-boxes">
    <div class="sbox">
      <div class="sbox-val">{{ $summary['total_employees'] }}</div>
      <div class="sbox-lbl">Employees</div>
    </div>
    <div class="sbox">
      <div class="sbox-val green">₱{{ number_format($summary['total_gross'], 2) }}</div>
      <div class="sbox-lbl">Total Gross</div>
    </div>
    <div class="sbox">
      <div class="sbox-val red">₱{{ number_format($summary['total_deductions'], 2) }}</div>
      <div class="sbox-lbl">Total Deductions</div>
    </div>
    <div class="sbox">
      <div class="sbox-val blue">₱{{ number_format($summary['total_net'], 2) }}</div>
      <div class="sbox-lbl">Total Net Pay</div>
    </div>
  </div>

  {{-- Main payslip table --}}
  <table class="main">
    <thead>
      <tr>
        <th>#</th>
        <th>Employee</th>
        <th>Department</th>
        <th class="right">Gross Pay</th>
        <th class="right">SSS</th>
        <th class="right">PhilHealth</th>
        <th class="right">Pag-IBIG</th>
        <th class="right">BIR Tax</th>
        <th class="right">Other Ded.</th>
        <th class="right">Net Pay</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      @foreach($payslips as $i => $ps)
      <tr>
        <td>{{ $i + 1 }}</td>
        <td>{{ $ps->employee->full_name }}</td>
        <td>{{ $ps->employee->department }}</td>
        <td class="right">₱{{ number_format($ps->gross_pay, 2) }}</td>
        <td class="right">₱{{ number_format($ps->sss_employee, 2) }}</td>
        <td class="right">₱{{ number_format($ps->philhealth_employee, 2) }}</td>
        <td class="right">₱{{ number_format($ps->pagibig_employee, 2) }}</td>
        <td class="right">₱{{ number_format($ps->bir_withholding_tax, 2) }}</td>
        <td class="right">₱{{ number_format($ps->late_deduction + $ps->absent_deduction + $ps->unpaid_leave_deduction + $ps->sss_loan_deduction + $ps->pagibig_loan_deduction + $ps->company_loan_deduction, 2) }}</td>
        <td class="right"><strong>₱{{ number_format($ps->net_pay, 2) }}</strong></td>
        <td><span class="status-{{ $ps->status }}">{{ strtoupper($ps->status) }}</span></td>
      </tr>
      @endforeach
      <tr class="total-row">
        <td colspan="3">TOTALS ({{ $summary['total_employees'] }} employees)</td>
        <td class="right">₱{{ number_format($summary['total_gross'], 2) }}</td>
        <td class="right">₱{{ number_format($summary['total_sss'], 2) }}</td>
        <td class="right">₱{{ number_format($summary['total_philhealth'], 2) }}</td>
        <td class="right">₱{{ number_format($summary['total_pagibig'], 2) }}</td>
        <td class="right">₱{{ number_format($summary['total_bir'], 2) }}</td>
        <td class="right">—</td>
        <td class="right">₱{{ number_format($summary['total_net'], 2) }}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  {{-- Statutory section --}}
  <div class="statutory-section">
    <div class="stat-title">Government Remittance Summary</div>
    <table class="stat">
      <thead>
        <tr>
          <th>Contribution</th>
          <th>Employee Share</th>
          <th>Employer Share</th>
          <th>Total Remittance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>SSS</td>
          <td>₱{{ number_format($summary['total_sss'], 2) }}</td>
          <td>₱{{ number_format($payslips->sum('sss_employer'), 2) }}</td>
          <td>₱{{ number_format($summary['total_sss'] + $payslips->sum('sss_employer'), 2) }}</td>
        </tr>
        <tr>
          <td>PhilHealth</td>
          <td>₱{{ number_format($summary['total_philhealth'], 2) }}</td>
          <td>₱{{ number_format($payslips->sum('philhealth_employer'), 2) }}</td>
          <td>₱{{ number_format($summary['total_philhealth'] + $payslips->sum('philhealth_employer'), 2) }}</td>
        </tr>
        <tr>
          <td>Pag-IBIG</td>
          <td>₱{{ number_format($summary['total_pagibig'], 2) }}</td>
          <td>₱{{ number_format($payslips->sum('pagibig_employer'), 2) }}</td>
          <td>₱{{ number_format($summary['total_pagibig'] + $payslips->sum('pagibig_employer'), 2) }}</td>
        </tr>
        <tr>
          <td>BIR Withholding Tax</td>
          <td>₱{{ number_format($summary['total_bir'], 2) }}</td>
          <td>—</td>
          <td>₱{{ number_format($summary['total_bir'], 2) }}</td>
        </tr>
        <tr class="total-row">
          <td>TOTAL REMITTANCE</td>
          <td>₱{{ number_format($summary['total_sss'] + $summary['total_philhealth'] + $summary['total_pagibig'] + $summary['total_bir'], 2) }}</td>
          <td>₱{{ number_format($payslips->sum('sss_employer') + $payslips->sum('philhealth_employer') + $payslips->sum('pagibig_employer'), 2) }}</td>
          <td>₱{{ number_format($summary['total_sss'] + $summary['total_philhealth'] + $summary['total_pagibig'] + $summary['total_bir'] + $payslips->sum('sss_employer') + $payslips->sum('philhealth_employer') + $payslips->sum('pagibig_employer'), 2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="f-left">
      Period: {{ $period->period_start->format('F d, Y') }} – {{ $period->period_end->format('F d, Y') }}<br>
      @if($period->approver) Approved by: {{ $period->approver->name }} on {{ $period->approved_at?->format('M d, Y') }} @endif
    </div>
    <div class="f-right">
      <div class="sig-line">Prepared by: Accounting / HR Officer</div>
    </div>
  </div>

</body>
</html>