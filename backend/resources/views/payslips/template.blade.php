<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payslip — {{ $employee->full_name }} — {{ $period->label }}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DejaVu Sans', Arial, sans-serif;
      font-size: 10px;
      color: #1a1a2e;
      background: #fff;
      padding: 24px;
    }

    /* ── Header ─────────────────────────────────────────────── */
    .header {
      display: table;
      width: 100%;
      margin-bottom: 20px;
      border-bottom: 3px solid #1a1a2e;
      padding-bottom: 14px;
    }
    .header-left  { display: table-cell; vertical-align: middle; width: 60%; }
    .header-right { display: table-cell; vertical-align: middle; text-align: right; }

    .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #1a1a2e;
      letter-spacing: 1px;
    }
    .company-sub {
      font-size: 9px;
      color: #6b7280;
      margin-top: 2px;
    }
    .payslip-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a1a2e;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .period-badge {
      display: inline-block;
      background: #1a1a2e;
      color: #fff;
      font-size: 8px;
      padding: 3px 8px;
      border-radius: 3px;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ── Employee Info ───────────────────────────────────────── */
    .info-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px;
    }
    .info-col {
      display: table-cell;
      width: 33.33%;
      vertical-align: top;
    }
    .info-label {
      font-size: 8px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 10px;
      font-weight: bold;
      color: #1a1a2e;
    }

    /* ── Earnings / Deductions Tables ───────────────────────── */
    .tables-row {
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    .table-col {
      display: table-cell;
      width: 49%;
      vertical-align: top;
    }
    .table-col-spacer {
      display: table-cell;
      width: 2%;
    }

    .section-title {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #fff;
      padding: 6px 10px;
      margin-bottom: 0;
    }
    .section-title-earnings   { background: #16a34a; }
    .section-title-deductions { background: #dc2626; }

    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    table.items td {
      padding: 5px 10px;
      border-bottom: 1px solid #f3f4f6;
    }
    table.items tr:last-child td { border-bottom: none; }
    table.items .amount { text-align: right; font-weight: bold; }
    table.items .desc {
      font-size: 7.5px;
      color: #9ca3af;
      display: block;
    }
    table.items tr:nth-child(even) td { background: #fafafa; }
    table.items .manual-badge {
      font-size: 7px;
      background: #fef9c3;
      color: #854d0e;
      padding: 1px 4px;
      border-radius: 2px;
      margin-left: 4px;
    }

    .subtotal-row td {
      background: #f3f4f6 !important;
      font-weight: bold;
      border-top: 1.5px solid #d1d5db !important;
    }

    /* ── Statutory Summary ───────────────────────────────────── */
    .statutory-box {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .statutory-header {
      background: #1e40af;
      color: #fff;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 6px 10px;
    }
    .statutory-grid {
      display: table;
      width: 100%;
      padding: 10px;
    }
    .statutory-item {
      display: table-cell;
      text-align: center;
      width: 25%;
      border-right: 1px solid #e5e7eb;
    }
    .statutory-item:last-child { border-right: none; }
    .statutory-name { font-size: 8px; color: #6b7280; text-transform: uppercase; }
    .statutory-emp  { font-size: 9px; font-weight: bold; color: #1a1a2e; margin-top: 2px; }
    .statutory-er   { font-size: 7.5px; color: #9ca3af; margin-top: 1px; }

    /* ── Net Pay ─────────────────────────────────────────────── */
    .net-pay-box {
      background: #1a1a2e;
      color: #fff;
      border-radius: 4px;
      padding: 16px 20px;
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    .net-left  { display: table-cell; vertical-align: middle; }
    .net-right { display: table-cell; vertical-align: middle; text-align: right; }
    .net-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .net-amount { font-size: 24px; font-weight: bold; color: #facc15; margin-top: 2px; }
    .net-meta   { font-size: 8px; color: #6b7280; margin-top: 4px; }
    .gross-label { font-size: 9px; color: #9ca3af; }
    .gross-val   { font-size: 11px; color: #fff; font-weight: bold; }

    /* ── Attendance ───────────────────────────────────────────── */
    .attendance-box {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 16px;
      display: table;
      width: 100%;
    }
    .att-item {
      display: table-cell;
      text-align: center;
      width: 14.28%;
    }
    .att-val   { font-size: 12px; font-weight: bold; color: #1a1a2e; }
    .att-label { font-size: 7.5px; color: #6b7280; text-transform: uppercase; margin-top: 2px; }
    .att-late  { color: #dc2626; }
    .att-ot    { color: #16a34a; }

    /* ── Footer ──────────────────────────────────────────────── */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      display: table;
      width: 100%;
    }
    .footer-left  { display: table-cell; width: 50%; font-size: 8px; color: #9ca3af; vertical-align: bottom; }
    .footer-right { display: table-cell; width: 50%; text-align: right; vertical-align: bottom; }
    .signature-line {
      border-top: 1px solid #1a1a2e;
      width: 160px;
      margin-left: auto;
      margin-top: 24px;
      padding-top: 4px;
      font-size: 8px;
      color: #6b7280;
      text-align: center;
    }

    .confidential {
      text-align: center;
      font-size: 7.5px;
      color: #d1d5db;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 10px;
    }
  </style>
</head>
<body>

  {{-- ── HEADER ──────────────────────────────────────────────── --}}
  <div class="header">
    <div class="header-left">
      <div class="company-name">🪷 Blue Lotus Hotel</div>
      <div class="company-sub">Human Resources Department · Payroll Division</div>
    </div>
    <div class="header-right">
      <div class="payslip-title">Payslip</div>
      <div><span class="period-badge">{{ $period->label }}</span></div>
    </div>
  </div>

  {{-- ── EMPLOYEE INFO ────────────────────────────────────────── --}}
  <div class="info-grid">
    <div class="info-col">
      <div class="info-label">Employee Name</div>
      <div class="info-value">{{ $employee->full_name }}</div>
      <div class="info-label" style="margin-top:6px">Employee ID</div>
      <div class="info-value">#{{ str_pad($employee->id, 5, '0', STR_PAD_LEFT) }}</div>
    </div>
    <div class="info-col">
      <div class="info-label">Department</div>
      <div class="info-value">{{ $employee->department }}</div>
      <div class="info-label" style="margin-top:6px">Position</div>
      <div class="info-value">{{ $employee->job_category }}</div>
    </div>
    <div class="info-col">
      <div class="info-label">Pay Period</div>
      <div class="info-value">
        {{ $period->period_start->format('M d') }} – {{ $period->period_end->format('M d, Y') }}
      </div>
      <div class="info-label" style="margin-top:6px">Employment Type</div>
      <div class="info-value">{{ ucfirst(str_replace('_', ' ', $employee->employment_type)) }}</div>
    </div>
  </div>

  {{-- ── ATTENDANCE SUMMARY ───────────────────────────────────── --}}
  <div class="attendance-box">
    <div class="att-item">
      <div class="att-val">{{ $payslip->working_days_in_period }}</div>
      <div class="att-label">Working Days</div>
    </div>
    <div class="att-item">
      <div class="att-val">{{ $payslip->days_worked }}</div>
      <div class="att-label">Days Worked</div>
    </div>
    <div class="att-item">
      <div class="att-val {{ $payslip->days_absent > 0 ? 'att-late' : '' }}">
        {{ $payslip->days_absent }}
      </div>
      <div class="att-label">Absences</div>
    </div>
    <div class="att-item">
      <div class="att-val">{{ $payslip->days_on_leave }}</div>
      <div class="att-label">Paid Leave</div>
    </div>
    <div class="att-item">
      <div class="att-val {{ $payslip->days_unpaid_leave > 0 ? 'att-late' : '' }}">
        {{ $payslip->days_unpaid_leave }}
      </div>
      <div class="att-label">Unpaid Leave</div>
    </div>
    <div class="att-item">
      <div class="att-val {{ $payslip->minutes_late > 0 ? 'att-late' : '' }}">
        {{ $payslip->minutes_late }}m
      </div>
      <div class="att-label">Minutes Late</div>
    </div>
    <div class="att-item">
      <div class="att-val att-ot">{{ $payslip->overtime_hours }}h</div>
      <div class="att-label">Overtime</div>
    </div>
  </div>

  {{-- ── EARNINGS & DEDUCTIONS ─────────────────────────────────── --}}
  <div class="tables-row">

    {{-- Earnings --}}
    <div class="table-col">
      <div class="section-title section-title-earnings">Earnings</div>
      <table class="items">
        @foreach($earnings as $item)
        <tr>
          <td>
            {{ $item->label }}
            @if($item->is_manual)<span class="manual-badge">MANUAL</span>@endif
            @if($item->description)<span class="desc">{{ $item->description }}</span>@endif
          </td>
          <td class="amount">₱{{ number_format($item->amount, 2) }}</td>
        </tr>
        @endforeach
        <tr class="subtotal-row">
          <td>GROSS PAY</td>
          <td class="amount">₱{{ number_format($payslip->gross_pay, 2) }}</td>
        </tr>
      </table>
    </div>

    <div class="table-col-spacer"></div>

    {{-- Deductions --}}
    <div class="table-col">
      <div class="section-title section-title-deductions">Deductions</div>
      <table class="items">
        @foreach($deductions as $item)
        <tr>
          <td>
            {{ $item->label }}
            @if($item->is_manual)<span class="manual-badge">MANUAL</span>@endif
            @if($item->description)<span class="desc">{{ $item->description }}</span>@endif
          </td>
          <td class="amount">₱{{ number_format($item->amount, 2) }}</td>
        </tr>
        @endforeach
        <tr class="subtotal-row">
          <td>TOTAL DEDUCTIONS</td>
          <td class="amount">₱{{ number_format($payslip->total_deductions, 2) }}</td>
        </tr>
      </table>
    </div>
  </div>

  {{-- ── STATUTORY CONTRIBUTIONS ──────────────────────────────── --}}
  <div class="statutory-box">
    <div class="statutory-header">Government Contributions Summary</div>
    <div class="statutory-grid">
      <div class="statutory-item">
        <div class="statutory-name">SSS</div>
        <div class="statutory-emp">₱{{ number_format($payslip->sss_employee, 2) }}</div>
        <div class="statutory-er">Employer: ₱{{ number_format($payslip->sss_employer, 2) }}</div>
      </div>
      <div class="statutory-item">
        <div class="statutory-name">PhilHealth</div>
        <div class="statutory-emp">₱{{ number_format($payslip->philhealth_employee, 2) }}</div>
        <div class="statutory-er">Employer: ₱{{ number_format($payslip->philhealth_employer, 2) }}</div>
      </div>
      <div class="statutory-item">
        <div class="statutory-name">Pag-IBIG</div>
        <div class="statutory-emp">₱{{ number_format($payslip->pagibig_employee, 2) }}</div>
        <div class="statutory-er">Employer: ₱{{ number_format($payslip->pagibig_employer, 2) }}</div>
      </div>
      <div class="statutory-item">
        <div class="statutory-name">BIR Tax</div>
        <div class="statutory-emp">₱{{ number_format($payslip->bir_withholding_tax, 2) }}</div>
        <div class="statutory-er">Withholding Tax</div>
      </div>
    </div>
  </div>

  {{-- ── NET PAY ───────────────────────────────────────────────── --}}
  <div class="net-pay-box">
    <div class="net-left">
      <div class="net-label">Net Pay</div>
      <div class="net-amount">₱{{ number_format($payslip->net_pay, 2) }}</div>
      <div class="net-meta">
        Basic Salary: ₱{{ number_format($employee->basic_salary, 2) }}/month
        &nbsp;·&nbsp;
        Daily Rate: ₱{{ number_format($employee->basic_salary / 26, 2) }}/day
      </div>
    </div>
    <div class="net-right">
      <div class="gross-label">Gross Pay</div>
      <div class="gross-val">₱{{ number_format($payslip->gross_pay, 2) }}</div>
      <div class="gross-label" style="margin-top:6px">Total Deductions</div>
      <div class="gross-val" style="color:#ef4444">– ₱{{ number_format($payslip->total_deductions, 2) }}</div>
    </div>
  </div>

  {{-- ── FOOTER ───────────────────────────────────────────────── --}}
  <div class="footer">
    <div class="footer-left">
      Generated: {{ now()->format('F d, Y h:i A') }}<br>
      Status: <strong>{{ strtoupper($payslip->status) }}</strong>
      @if($payslip->approvedBy)
        &nbsp;· Approved by: {{ $payslip->approvedBy->name }}
      @endif
    </div>
    <div class="footer-right">
      <div class="signature-line">
        Authorized Signature / HR Officer
      </div>
    </div>
  </div>

  <div class="confidential">
    Confidential — For {{ $employee->full_name }} Only
  </div>

</body>
</html>