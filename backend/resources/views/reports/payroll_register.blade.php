{{-- resources/views/reports/payroll_register.blade.php --}}
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Sans', sans-serif; font-size: 8px; color: #1a1a1a; }
  .header { text-align: center; margin-bottom: 14px; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 8px; }
  .header h1 { font-size: 13px; font-weight: 700; }
  .header p  { font-size: 8px; color: #555; margin-top: 2px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 7.5px; color: #555; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #1a1a1a; color: #fff; padding: 4px 5px;
    text-align: left; font-size: 7px; font-weight: 600; letter-spacing: .03em;
  }
  thead th.num { text-align: right; }
  tbody tr:nth-child(even) { background: #f5f5f5; }
  tbody td { padding: 3px 5px; border-bottom: 0.5px solid #e0e0e0; vertical-align: middle; }
  tbody td.num { text-align: right; font-family: 'DejaVu Sans Mono', monospace; }
  tfoot td { padding: 5px 5px; font-weight: 700; font-size: 7.5px; border-top: 1.5px solid #1a1a1a; }
  tfoot td.num { text-align: right; font-family: 'DejaVu Sans Mono', monospace; }
  .footer { margin-top: 16px; font-size: 7px; color: #888; text-align: right; }
  .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 6.5px; }
  .badge-paid     { background: #e1f5ee; color: #0f6e56; }
  .badge-approved { background: #e6f1fb; color: #185fa5; }
  .badge-computed { background: #faeeda; color: #854f0b; }
</style>
</head>
<body>
<div class="header">
  <h1>Blue Lotus Hotel — Payroll Register</h1>
  <p>{{ $period->label ?? 'Period #' . $period->id }}
     &nbsp;·&nbsp; Generated {{ now()->format('F d, Y h:i A') }}</p>
</div>

<div class="meta">
  <span>Total employees: {{ $payslips->count() }}</span>
  <span>Status: {{ strtoupper($period->status ?? 'computed') }}</span>
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Employee</th>
      <th>Department</th>
      <th class="num">Basic</th>
      <th class="num">OT</th>
      <th class="num">Allowances</th>
      <th class="num">Bonuses</th>
      <th class="num">Gross</th>
      <th class="num">SSS</th>
      <th class="num">PhilHealth</th>
      <th class="num">Pag-IBIG</th>
      <th class="num">Tax</th>
      <th class="num">Total Ded.</th>
      <th class="num">Net Pay</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    @foreach($payslips as $i => $p)
    <tr>
      <td>{{ $i + 1 }}</td>
      <td>{{ $p->employee ? trim($p->employee->first_name . ' ' . $p->employee->last_name) : '—' }}</td>
      <td>{{ $p->employee?->department ?? '—' }}</td>
      <td class="num">{{ number_format($p->basic_salary, 2) }}</td>
      <td class="num">{{ number_format($p->overtime_amount, 2) }}</td>
      <td class="num">{{ number_format($p->total_allowances, 2) }}</td>
      <td class="num">{{ number_format($p->total_bonuses ?? 0, 2) }}</td>
      <td class="num">{{ number_format($p->gross_pay, 2) }}</td>
      <td class="num">{{ number_format($p->sss_contribution, 2) }}</td>
      <td class="num">{{ number_format($p->philhealth_contribution, 2) }}</td>
      <td class="num">{{ number_format($p->pagibig_contribution, 2) }}</td>
      <td class="num">{{ number_format($p->withholding_tax, 2) }}</td>
      <td class="num">{{ number_format($p->total_deductions, 2) }}</td>
      <td class="num"><strong>{{ number_format($p->net_pay, 2) }}</strong></td>
      <td><span class="badge badge-{{ $p->status }}">{{ strtoupper($p->status) }}</span></td>
    </tr>
    @endforeach
  </tbody>
  <tfoot>
    <tr>
      <td colspan="7">TOTALS</td>
      <td class="num">{{ number_format($totals['gross'], 2) }}</td>
      <td class="num">{{ number_format($totals['sss'], 2) }}</td>
      <td class="num">{{ number_format($totals['philhealth'], 2) }}</td>
      <td class="num">{{ number_format($totals['pagibig'], 2) }}</td>
      <td class="num">{{ number_format($totals['tax'], 2) }}</td>
      <td class="num">{{ number_format($totals['deductions'], 2) }}</td>
      <td class="num">{{ number_format($totals['net'], 2) }}</td>
      <td></td>
    </tr>
  </tfoot>
</table>

<div class="footer">Blue Lotus Hotel HR System &nbsp;·&nbsp; CONFIDENTIAL</div>
</body>
</html>