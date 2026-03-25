{{-- ════════════════════════════════════════════════════════════════════════
     resources/views/reports/attendance_report.blade.php
     ════════════════════════════════════════════════════════════════════════ --}}
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DejaVu Sans',sans-serif;font-size:8px;color:#1a1a1a}
  .hdr{text-align:center;border-bottom:1.5px solid #1a1a1a;padding-bottom:8px;margin-bottom:12px}
  .hdr h1{font-size:13px;font-weight:700} .hdr p{font-size:8px;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse}
  thead th{background:#1a1a1a;color:#fff;padding:4px 5px;font-size:7px;font-weight:600;text-align:center}
  thead th:first-child,thead th:nth-child(2){text-align:left}
  tbody tr:nth-child(even){background:#f5f5f5}
  tbody td{padding:3px 5px;border-bottom:0.5px solid #e0e0e0;text-align:center}
  tbody td:first-child,tbody td:nth-child(2){text-align:left}
  tfoot td{font-weight:700;border-top:1.5px solid #1a1a1a;padding:5px;text-align:center}
  .footer{margin-top:14px;font-size:7px;color:#888;text-align:right}
</style></head><body>
<div class="hdr">
  <h1>Blue Lotus Hotel — Attendance Report</h1>
  <p>{{ $monthLabel }}{{ $dept && $dept !== 'All' ? ' · ' . $dept : '' }} &nbsp;·&nbsp; Generated {{ now()->format('F d, Y') }}</p>
</div>
<table>
  <thead><tr>
    <th>Employee</th><th>Department</th>
    <th>Present</th><th>Absent</th><th>Late</th><th>On Leave</th><th>Holiday</th><th>Total Days</th>
  </tr></thead>
  <tbody>
    @foreach($byEmployee as $r)
    <tr>
      <td>{{ $r['name'] }}</td><td>{{ $r['department'] }}</td>
      <td>{{ $r['present'] }}</td><td>{{ $r['absent'] }}</td><td>{{ $r['late'] }}</td>
      <td>{{ $r['on_leave'] }}</td><td>{{ $r['holiday'] }}</td><td><strong>{{ $r['total'] }}</strong></td>
    </tr>
    @endforeach
  </tbody>
  <tfoot><tr>
    <td colspan="2">TOTALS</td>
    <td>{{ $byEmployee->sum('present') }}</td>
    <td>{{ $byEmployee->sum('absent') }}</td>
    <td>{{ $byEmployee->sum('late') }}</td>
    <td>{{ $byEmployee->sum('on_leave') }}</td>
    <td>{{ $byEmployee->sum('holiday') }}</td>
    <td>{{ $byEmployee->sum('total') }}</td>
  </tr></tfoot>
</table>
<div class="footer">Blue Lotus Hotel HR System &nbsp;·&nbsp; CONFIDENTIAL</div>
</body></html>


{{-- ════════════════════════════════════════════════════════════════════════
     resources/views/reports/leave_balance.blade.php
     ════════════════════════════════════════════════════════════════════════ --}}
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DejaVu Sans',sans-serif;font-size:8px;color:#1a1a1a}
  .hdr{text-align:center;border-bottom:1.5px solid #1a1a1a;padding-bottom:8px;margin-bottom:12px}
  .hdr h1{font-size:13px;font-weight:700} .hdr p{font-size:8px;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse}
  thead th{background:#1a1a1a;color:#fff;padding:4px 5px;font-size:7px;font-weight:600;text-align:center}
  thead th:first-child,thead th:nth-child(2){text-align:left}
  tbody tr:nth-child(even){background:#f5f5f5}
  tbody td{padding:3px 5px;border-bottom:0.5px solid #e0e0e0;text-align:center}
  tbody td:first-child,tbody td:nth-child(2){text-align:left}
  .footer{margin-top:14px;font-size:7px;color:#888;text-align:right}
  .low{color:#c0392b;font-weight:700}
</style></head><body>
<div class="hdr">
  <h1>Blue Lotus Hotel — Leave Balance Report {{ $year }}</h1>
  <p>Generated {{ now()->format('F d, Y') }}</p>
</div>
<table>
  <thead><tr>
    <th>Employee</th><th>Department</th>
    <th colspan="3">Vacation</th><th colspan="3">Sick</th>
    <th colspan="3">Emergency</th><th colspan="3">Bereavement</th>
  </tr><tr>
    <th></th><th></th>
    <th>Ent.</th><th>Used</th><th>Rem.</th>
    <th>Ent.</th><th>Used</th><th>Rem.</th>
    <th>Ent.</th><th>Used</th><th>Rem.</th>
    <th>Ent.</th><th>Used</th><th>Rem.</th>
  </tr></thead>
  <tbody>
    @foreach($balances as $r)
    <?php
      $vac  = $r['balances']['vacation']   ?? ['entitled'=>0,'used'=>0,'remaining'=>0];
      $sick = $r['balances']['sick']       ?? ['entitled'=>0,'used'=>0,'remaining'=>0];
      $emer = $r['balances']['emergency']  ?? ['entitled'=>0,'used'=>0,'remaining'=>0];
      $bere = $r['balances']['bereavement']?? ['entitled'=>0,'used'=>0,'remaining'=>0];
    ?>
    <tr>
      <td>{{ $r['name'] }}</td><td>{{ $r['department'] }}</td>
      <td>{{ $vac['entitled'] }}</td><td>{{ $vac['used'] }}</td>
      <td class="{{ $vac['remaining'] <= 2 ? 'low' : '' }}">{{ $vac['remaining'] }}</td>
      <td>{{ $sick['entitled'] }}</td><td>{{ $sick['used'] }}</td>
      <td class="{{ $sick['remaining'] <= 2 ? 'low' : '' }}">{{ $sick['remaining'] }}</td>
      <td>{{ $emer['entitled'] }}</td><td>{{ $emer['used'] }}</td><td>{{ $emer['remaining'] }}</td>
      <td>{{ $bere['entitled'] }}</td><td>{{ $bere['used'] }}</td><td>{{ $bere['remaining'] }}</td>
    </tr>
    @endforeach
  </tbody>
</table>
<div class="footer">Red = 2 days or fewer remaining &nbsp;·&nbsp; Blue Lotus Hotel HR System &nbsp;·&nbsp; CONFIDENTIAL</div>
</body></html>


{{-- ════════════════════════════════════════════════════════════════════════
     resources/views/reports/tax_certificate.blade.php  (BIR 2316-style)
     ════════════════════════════════════════════════════════════════════════ --}}
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DejaVu Sans',sans-serif;font-size:9px;color:#1a1a1a}
  .cert{border:1px solid #1a1a1a;padding:16px;margin-bottom:20px;page-break-inside:avoid}
  .cert-header{text-align:center;border-bottom:1px solid #ccc;padding-bottom:8px;margin-bottom:10px}
  .cert-header h1{font-size:11px;font-weight:700}
  .cert-header p{font-size:8px;color:#555;margin-top:2px}
  .emp-info{display:flex;gap:20px;margin-bottom:10px}
  .emp-field{flex:1}
  .field-label{font-size:7px;color:#888;text-transform:uppercase;letter-spacing:.04em}
  .field-value{font-size:9px;font-weight:600;border-bottom:0.5px solid #ccc;padding-bottom:2px;margin-top:1px}
  .amounts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
  .amount-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #eee;font-size:8.5px}
  .amount-row.total{font-weight:700;border-top:1.5px solid #1a1a1a;border-bottom:none;margin-top:4px;padding-top:4px}
  .amount-val{font-family:'DejaVu Sans Mono',monospace}
  .sig-area{display:flex;gap:20px;margin-top:14px}
  .sig-box{flex:1;border-top:1px solid #1a1a1a;padding-top:4px;font-size:7.5px;text-align:center}
</style></head><body>
@foreach($certificates as $cert)
<div class="cert">
  <div class="cert-header">
    <h1>Certificate of Compensation Payment / Tax Withheld (BIR Form 2316)</h1>
    <p>For the Year {{ $cert['year'] }} &nbsp;·&nbsp; Blue Lotus Hotel &nbsp;·&nbsp; TIN: 000-000-000-000</p>
  </div>
  <div class="emp-info">
    <div class="emp-field">
      <div class="field-label">Employee name</div>
      <div class="field-value">
        {{ $cert['employee'] ? trim($cert['employee']->last_name . ', ' . $cert['employee']->first_name) : '—' }}
      </div>
    </div>
    <div class="emp-field">
      <div class="field-label">TIN</div>
      <div class="field-value">{{ $cert['employee']?->tin_number ?? '—' }}</div>
    </div>
    <div class="emp-field">
      <div class="field-label">SSS No.</div>
      <div class="field-value">{{ $cert['employee']?->sss_number ?? '—' }}</div>
    </div>
    <div class="emp-field">
      <div class="field-label">Pay periods</div>
      <div class="field-value">{{ $cert['periods_count'] }}</div>
    </div>
  </div>
  <div class="amounts">
    <div>
      <div class="amount-row"><span>Gross compensation</span><span class="amount-val">₱ {{ number_format($cert['total_gross'], 2) }}</span></div>
      <div class="amount-row"><span>SSS contributions</span><span class="amount-val">₱ {{ number_format($cert['total_sss'], 2) }}</span></div>
      <div class="amount-row"><span>PhilHealth contributions</span><span class="amount-val">₱ {{ number_format($cert['total_philhealth'], 2) }}</span></div>
      <div class="amount-row"><span>Pag-IBIG contributions</span><span class="amount-val">₱ {{ number_format($cert['total_pagibig'], 2) }}</span></div>
    </div>
    <div>
      <div class="amount-row"><span>Tax withheld</span><span class="amount-val">₱ {{ number_format($cert['total_tax'], 2) }}</span></div>
      <div class="amount-row total"><span>Net compensation</span><span class="amount-val">₱ {{ number_format($cert['total_net'], 2) }}</span></div>
    </div>
  </div>
  <div class="sig-area">
    <div class="sig-box">Authorized Signatory / HR Manager</div>
    <div class="sig-box">Employee Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div>
  </div>
</div>
@endforeach
</body></html>


{{-- ════════════════════════════════════════════════════════════════════════
     resources/views/reports/overtime_summary.blade.php
     ════════════════════════════════════════════════════════════════════════ --}}
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DejaVu Sans',sans-serif;font-size:8px;color:#1a1a1a}
  .hdr{text-align:center;border-bottom:1.5px solid #1a1a1a;padding-bottom:8px;margin-bottom:12px}
  .hdr h1{font-size:13px;font-weight:700} .hdr p{font-size:8px;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse}
  thead th{background:#1a1a1a;color:#fff;padding:4px 5px;font-size:7px;font-weight:600;text-align:right}
  thead th:first-child,thead th:nth-child(2){text-align:left}
  tbody tr:nth-child(even){background:#f5f5f5}
  tbody td{padding:3px 5px;border-bottom:0.5px solid #e0e0e0;text-align:right}
  tbody td:first-child,tbody td:nth-child(2){text-align:left}
  tfoot td{font-weight:700;border-top:1.5px solid #1a1a1a;padding:5px;text-align:right}
  .footer{margin-top:14px;font-size:7px;color:#888;text-align:right}
</style></head><body>
<div class="hdr">
  <h1>Blue Lotus Hotel — Overtime Summary</h1>
  <p>{{ $monthLabel }} &nbsp;·&nbsp; Generated {{ now()->format('F d, Y') }}</p>
</div>
<table>
  <thead><tr>
    <th>Employee</th><th>Department</th>
    <th>Regular OT (hrs)</th><th>Rest Day OT (hrs)</th><th>Holiday OT (hrs)</th>
    <th>Total Hours</th><th>Total Amount</th>
  </tr></thead>
  <tbody>
    @foreach($byEmployee as $r)
    <tr>
      <td>{{ $r['name'] }}</td><td>{{ $r['department'] }}</td>
      <td>{{ number_format($r['regular_ot'], 1) }}</td>
      <td>{{ number_format($r['restday_ot'], 1) }}</td>
      <td>{{ number_format($r['holiday_ot'], 1) }}</td>
      <td><strong>{{ number_format($r['total_hours'], 1) }}</strong></td>
      <td><strong>₱ {{ number_format($r['total_amount'], 2) }}</strong></td>
    </tr>
    @endforeach
  </tbody>
  <tfoot><tr>
    <td colspan="2">TOTALS</td>
    <td>{{ number_format($byEmployee->sum('regular_ot'), 1) }}</td>
    <td>{{ number_format($byEmployee->sum('restday_ot'), 1) }}</td>
    <td>{{ number_format($byEmployee->sum('holiday_ot'), 1) }}</td>
    <td>{{ number_format($byEmployee->sum('total_hours'), 1) }}</td>
    <td>₱ {{ number_format($byEmployee->sum('total_amount'), 2) }}</td>
  </tr></tfoot>
</table>
<div class="footer">Blue Lotus Hotel HR System &nbsp;·&nbsp; CONFIDENTIAL</div>
</body></html>


{{-- ════════════════════════════════════════════════════════════════════════
     resources/views/reports/government_remittance.blade.php
     ════════════════════════════════════════════════════════════════════════ --}}
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DejaVu Sans',sans-serif;font-size:8.5px;color:#1a1a1a}
  .hdr{text-align:center;border-bottom:1.5px solid #1a1a1a;padding-bottom:8px;margin-bottom:14px}
  .hdr h1{font-size:13px;font-weight:700} .hdr p{font-size:8px;color:#555;margin-top:2px}
  .summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
  .summary-card{border:1px solid #ddd;border-radius:4px;padding:10px}
  .summary-card h3{font-size:9px;font-weight:700;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #eee}
  .summary-row{display:flex;justify-content:space-between;padding:2.5px 0;font-size:8px}
  .summary-row.total{font-weight:700;border-top:1px solid #ccc;margin-top:4px;padding-top:4px}
  .mono{font-family:'DejaVu Sans Mono',monospace}
  table{width:100%;border-collapse:collapse;font-size:7.5px}
  thead th{background:#1a1a1a;color:#fff;padding:4px 5px;text-align:right;font-weight:600}
  thead th:first-child,thead th:nth-child(2){text-align:left}
  tbody tr:nth-child(even){background:#f5f5f5}
  tbody td{padding:3px 5px;border-bottom:0.5px solid #e0e0e0;text-align:right}
  tbody td:first-child,tbody td:nth-child(2){text-align:left}
  .footer{margin-top:14px;font-size:7px;color:#888;text-align:right}
</style></head><body>
<div class="hdr">
  <h1>Blue Lotus Hotel — Government Remittance Summary</h1>
  <p>{{ $period->label ?? 'Period #' . $period->id }} &nbsp;·&nbsp; Generated {{ now()->format('F d, Y') }}</p>
</div>

<div class="summary-grid">
  <div class="summary-card">
    <h3>SSS</h3>
    <div class="summary-row"><span>Employee share</span><span class="mono">₱ {{ number_format($summary['sss_employee'], 2) }}</span></div>
    <div class="summary-row"><span>Employer share</span><span class="mono">₱ {{ number_format($summary['sss_employer'], 2) }}</span></div>
    <div class="summary-row total"><span>Total</span><span class="mono">₱ {{ number_format($summary['sss_employee'] + $summary['sss_employer'], 2) }}</span></div>
  </div>
  <div class="summary-card">
    <h3>PhilHealth</h3>
    <div class="summary-row"><span>Employee share</span><span class="mono">₱ {{ number_format($summary['philhealth_employee'], 2) }}</span></div>
    <div class="summary-row"><span>Employer share</span><span class="mono">₱ {{ number_format($summary['philhealth_employer'], 2) }}</span></div>
    <div class="summary-row total"><span>Total</span><span class="mono">₱ {{ number_format($summary['philhealth_employee'] + $summary['philhealth_employer'], 2) }}</span></div>
  </div>
  <div class="summary-card">
    <h3>Pag-IBIG</h3>
    <div class="summary-row"><span>Employee share</span><span class="mono">₱ {{ number_format($summary['pagibig_employee'], 2) }}</span></div>
    <div class="summary-row"><span>Employer share</span><span class="mono">₱ {{ number_format($summary['pagibig_employer'], 2) }}</span></div>
    <div class="summary-row total"><span>Total</span><span class="mono">₱ {{ number_format($summary['pagibig_employee'] + $summary['pagibig_employer'], 2) }}</span></div>
  </div>
  <div class="summary-card">
    <h3>BIR Withholding Tax</h3>
    <div class="summary-row total"><span>Total withheld</span><span class="mono">₱ {{ number_format($summary['bir_tax'], 2) }}</span></div>
  </div>
</div>

<table>
  <thead><tr>
    <th>Employee</th><th>SSS No.</th>
    <th>SSS Emp.</th><th>SSS Er.</th>
    <th>PhilHealth Emp.</th><th>PhilHealth Er.</th>
    <th>Pag-IBIG Emp.</th><th>Pag-IBIG Er.</th>
    <th>Tax</th>
  </tr></thead>
  <tbody>
    @foreach($payslips as $p)
    <tr>
      <td>{{ $p->employee ? trim($p->employee->first_name . ' ' . $p->employee->last_name) : '—' }}</td>
      <td>{{ $p->employee?->sss_number ?? '—' }}</td>
      <td>{{ number_format($p->sss_contribution, 2) }}</td>
      <td>{{ number_format($p->sss_employer_contribution ?? 0, 2) }}</td>
      <td>{{ number_format($p->philhealth_contribution, 2) }}</td>
      <td>{{ number_format($p->philhealth_employer_contribution ?? 0, 2) }}</td>
      <td>{{ number_format($p->pagibig_contribution, 2) }}</td>
      <td>{{ number_format($p->pagibig_employer_contribution ?? 0, 2) }}</td>
      <td>{{ number_format($p->withholding_tax, 2) }}</td>
    </tr>
    @endforeach
  </tbody>
</table>
<div class="footer">Blue Lotus Hotel HR System &nbsp;·&nbsp; CONFIDENTIAL</div>
</body></html>