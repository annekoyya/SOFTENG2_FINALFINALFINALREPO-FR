# 🎯 HR Harmony Suite - Next Steps Action Plan

**Purpose**: Concrete, step-by-step tasks to complete MVP and deploy system  
**Target**: 1-2 weeks to full completion  
**Owner**: Development Team

---

## 🚨 PHASE 1: CRITICAL FIXES (Days 1-2)

### ✅ Task 1.1: Fix Login Page Background Image
**Priority**: 🔴 CRITICAL  
**Time**: 30 mins  
**Owner**: Frontend  

**Current State**:
```tsx
// src/pages/Login.tsx - Line ~45
backgroundImage: `url('/src/assets/hotel.jpg')`
```

**Action Steps**:
1. [ ] Check if file exists: `ls -la src/assets/hotel.jpg`
2. [ ] If missing, download a hotel/office background image OR use gradient fallback
3. [ ] If image exists, fix path:
   ```tsx
   // Option 1: Use gradient fallback
   background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
   
   // Option 2: Fix image path
   backgroundImage: `url(${hotelImage})`
   import hotelImage from '@/assets/hotel.jpg'
   ```
4. [ ] Test login page renders correctly
5. [ ] Commit: `git add src/ && git commit -m "fix: restore login background image"`

**Verification**:
```bash
npm run dev
# Visit http://localhost:5174/login
# Verify background image displays
```

---

### ✅ Task 1.2: Implement Clock In/Out UI
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Owner**: Frontend  
**Depends on**: Backend attend/clocking endpoint working

**Current State**:
```tsx
// src/pages/Attendance.tsx - Only shows mock data
// No clock in/out buttons
```

**Action Steps**:

1. [ ] Create component `src/components/attendance/ClockInOutPanel.tsx`:
```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAttendance } from '@/hooks/useAttendance';
import { useState } from 'react';

export function ClockInOutPanel() {
  const [clockedIn, setClockedIn] = useState(false);
  const { clockIn, clockOut, isLoading } = useAttendance();

  const handleClockIn = async () => {
    try {
      await clockIn({
        timestamp: new Date(),
        shift: 'morning' // Get from employee profile
      });
      setClockedIn(true);
    } catch (error) {
      console.error('Clock in failed:', error);
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut({
        timestamp: new Date()
      });
      setClockedIn(false);
    } catch (error) {
      console.error('Clock out failed:', error);
    }
  };

  return (
    <Card className="p-6 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Time Tracking</h3>
          <p className="text-sm text-gray-600">
            Status: {clockedIn ? '✓ Clocked In' : '✗ Clocked Out'}
          </p>
        </div>
        <div className="space-x-3">
          <Button 
            onClick={handleClockIn} 
            disabled={clockedIn || isLoading}
            variant="default"
          >
            Clock In
          </Button>
          <Button 
            onClick={handleClockOut} 
            disabled={!clockedIn || isLoading}
            variant="outline"
          >
            Clock Out
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

2. [ ] Update `src/pages/Attendance.tsx` to include component:
```tsx
import { ClockInOutPanel } from '@/components/attendance/ClockInOutPanel';

export default function Attendance() {
  return (
    <div className="space-y-6">
      <ClockInOutPanel />
      {/* Existing attendance content */}
    </div>
  );
}
```

3. [ ] Verify backend has endpoint:
```bash
# Check if endpoint exists in backend/routes/api.php
grep -n "clock" backend/routes/api.php
# Should see POST /attendance/clock-in and POST /attendance/clock-out
```

4. [ ] Test clock in/out:
```bash
npm run dev
# Go to Attendance page
# Click "Clock In" - should show success message
# Click "Clock Out" - should show success message
```

5. [ ] Commit: `git add src/ && git commit -m "feat: add clock in/out UI to attendance page"`

---

### ✅ Task 1.3: Complete PDF Payslip Generation
**Priority**: 🔴 CRITICAL  
**Time**: 2 hours  
**Owner**: Backend  

**Current State**:
```php
// backend/app/Http/Controllers/PayslipPdfController.php
// Endpoint exists but template incomplete
```

**Action Steps**:

1. [ ] Create PDF template file `backend/resources/views/payslips/template.blade.php`:
```blade
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 20px; }
        .employee-info { margin-bottom: 20px; }
        .section { margin-top: 20px; page-break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #003366; color: white; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .total { font-weight: bold; background-color: #f5f5f5; }
        .net-salary { font-size: 18px; font-weight: bold; color: #003366; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PAYSLIP</h1>
        <p>{{ $company_name ?? 'HR Harmony Suite Inc.' }}</p>
    </div>

    <div class="employee-info">
        <p><strong>Employee:</strong> {{ $payslip->employee->name }}</p>
        <p><strong>Employee ID:</strong> {{ $payslip->employee->id }}</p>
        <p><strong>Department:</strong> {{ $payslip->employee->department }}</p>
        <p><strong>Position:</strong> {{ $payslip->employee->job_category }}</p>
        <p><strong>Pay Period:</strong> {{ $payslip->payroll->period_start }} to {{ $payslip->payroll->period_end }}</p>
    </div>

    <div class="section">
        <h3>Earnings</h3>
        <table>
            <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
            </tr>
            <tr>
                <td>Basic Salary</td>
                <td style="text-align: right;">₱{{ number_format($payslip->basic_salary, 2) }}</td>
            </tr>
            @if($payslip->allowances > 0)
            <tr>
                <td>Allowances</td>
                <td style="text-align: right;">₱{{ number_format($payslip->allowances, 2) }}</td>
            </tr>
            @endif
            <tr class="total">
                <td>GROSS SALARY</td>
                <td style="text-align: right;">₱{{ number_format($payslip->gross_salary, 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>Deductions</h3>
        <table>
            <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
            </tr>
            <tr>
                <td>SSS Contribution</td>
                <td style="text-align: right;">₱{{ number_format($payslip->sss_deduction, 2) }}</td>
            </tr>
            <tr>
                <td>PhilHealth Contribution</td>
                <td style="text-align: right;">₱{{ number_format($payslip->philhealth_deduction, 2) }}</td>
            </tr>
            <tr>
                <td>PagIBIG Contribution</td>
                <td style="text-align: right;">₱{{ number_format($payslip->pagibig_deduction, 2) }}</td>
            </tr>
            <tr>
                <td>BIR Withholding Tax</td>
                <td style="text-align: right;">₱{{ number_format($payslip->bir_deduction, 2) }}</td>
            </tr>
            @if($payslip->other_deductions > 0)
            <tr>
                <td>Other Deductions</td>
                <td style="text-align: right;">₱{{ number_format($payslip->other_deductions, 2) }}</td>
            </tr>
            @endif
            <tr class="total">
                <td>TOTAL DEDUCTIONS</td>
                <td style="text-align: right;">₱{{ number_format($payslip->total_deductions, 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <table>
            <tr class="net-salary">
                <td style="font-size: 18px;">NET SALARY</td>
                <td style="text-align: right; font-size: 18px;">₱{{ number_format($payslip->net_salary, 2) }}</td>
            </tr>
        </table>
    </div>

    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
        <p>Processed on: {{ now()->format('F j, Y') }}</p>
        <p>This is a computer-generated document and does not require a signature.</p>
    </div>
</body>
</html>
```

2. [ ] Update controller `backend/app/Http/Controllers/PayslipPdfController.php`:
```php
<?php

namespace App\Http\Controllers;

use App\Models\Payslip;
use Barryvdh\DomPDF\Facade\Pdf;

class PayslipPdfController extends Controller
{
    public function show(Payslip $payslip)
    {
        // Check authorization
        if (auth()->user()->id !== $payslip->employee->user_id && 
            !auth()->user()->hasRole(['admin', 'accountant'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pdf = Pdf::loadView('payslips.template', [
            'payslip' => $payslip,
            'company_name' => config('app.name')
        ])->setPaper('a4');

        return $pdf->download("payslip_{$payslip->id}.pdf");
    }

    public function email(Payslip $payslip)
    {
        // Queue email
        Mail::queue(new PayslipNotification($payslip));
        
        return response()->json(['message' => 'Payslip email queued']);
    }
}
```

3. [ ] Add routes in `backend/routes/api.php`:
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payslips/{payslip}/pdf', [PayslipPdfController::class, 'show']);
    Route::post('/payslips/{payslip}/email', [PayslipPdfController::class, 'email']);
});
```

4. [ ] Test PDF generation:
```bash
php artisan serve --port=8000
# GET http://localhost:8000/api/payslips/1/pdf
# Should download PDF with payslip data
```

5. [ ] Commit: `git add backend/ && git commit -m "feat: implement payslip PDF generation with template"`

---

### ✅ Task 1.4: Setup Email Notifications
**Priority**: 🔴 CRITICAL  
**Time**: 1 hour  
**Owner**: Backend  

**Action Steps**:

1. [ ] Update `.env` file:
```bash
# backend/.env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM_ADDRESS=your-company-email@gmail.com
MAIL_FROM_NAME="HR Harmony Suite"
MAIL_USERNAME=your-company-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
```

2. [ ] Create Mailable for payslip: `backend/app/Mail/PayslipNotification.php`:
```php
<?php

namespace App\Mail;

use App\Models\Payslip;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PayslipNotification extends Mailable
{
    public function __construct(public Payslip $payslip) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Payslip - ' . now()->format('F Y'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payslip',
        );
    }
}
```

3. [ ] Create email template `backend/resources/views/emails/payslip.blade.php`:
```blade
<div style="font-family: Arial, sans-serif; max-width: 600px;">
    <h2>Hello {{ $payslip->employee->name }},</h2>
    
    <p>Your payslip for {{ $payslip->payroll->period_start->format('F Y') }} is now available.</p>
    
    <p>
        <strong>Gross Salary:</strong> ₱{{ number_format($payslip->gross_salary, 2) }}<br>
        <strong>Deductions:</strong> ₱{{ number_format($payslip->total_deductions, 2) }}<br>
        <strong>Net Salary:</strong> ₱{{ number_format($payslip->net_salary, 2) }}
    </p>
    
    <p>
        <a href="{{ route('payslips.pdf', $payslip->id) }}">
            Download Full Payslip
        </a>
    </p>
    
    <p>Best regards,<br>HR Harmony Suite Team</p>
</div>
```

4. [ ] Update Payroll approval logic to send email:
```php
// backend/app/Http/Controllers/PayrollController.php
public function approve(Request $request, Payroll $payroll)
{
    $payroll->update(['status' => 'approved']);
    
    // Send payslips to all employees
    foreach ($payroll->payslips as $payslip) {
        Mail::to($payslip->employee->user->email)
            ->send(new PayslipNotification($payslip));
    }
    
    return response()->json(['message' => 'Payroll approved and emails sent']);
}
```

5. [ ] Test email:
```bash
# Test in artisan tinker
php artisan tinker
> Mail::to('test@example.com')->send(new App\Mail\PayslipNotification($payslip));
```

6. [ ] Commit: `git add backend/ && git commit -m "feat: setup email notifications for payslips"`

---

## ✅ PHASE 2: NEW HIRE SYSTEM (Days 3-4)

### Task 2.1: Add Profile Completeness Tracking
**Time**: 2 hours  
**Owner**: Full Stack  

**Implementation**:

1. [ ] Create model trait `backend/app/Models/Traits/HasProfileCompletion.php`:
```php
<?php

trait HasProfileCompletion
{
    public function getProfileCompletenessAttribute()
    {
        $sections = [
            'basic_info' => $this->hasBasicInfo(),
            'employment_docs' => $this->hasEmploymentDocs(),
            'bank_details' => $this->hasBankDetails(),
            'emergency_contact' => $this->hasEmergencyContact(),
            'gov_ids' => $this->hasGovIds(),
        ];
        
        $completed = count(array_filter($sections));
        return ($completed / count($sections)) * 100;
    }
    
    private function hasBasicInfo() {
        return $this->first_name && $this->last_name && 
               $this->email && $this->phone_number;
    }
    
    private function hasEmploymentDocs() {
        return $this->job_posting_id && $this->position && 
               $this->department && $this->employment_type;
    }
    
    private function hasBankDetails() {
        return $this->bank_account_number && $this->bank_name;
    }
    
    private function hasEmergencyContact() {
        return $this->emergency_contact_name && 
               $this->emergency_contact_number;
    }
    
    private function hasGovIds() {
        return $this->sss_number && $this->philhealth_number && 
               $this->pagibig_number && $this->bir_tin;
    }
}
```

2. [ ] Add to NewHire model:
```php
// backend/app/Models/NewHire.php
use Traits\HasProfileCompletion;

class NewHire extends Model
{
    use HasProfileCompletion;
}
```

3. [ ] Create API endpoint to get completeness:
```php
// backend/app/Http/Controllers/NewHireController.php
public function completeness(NewHire $newHire)
{
    return response()->json([
        'percentage' => $newHire->profile_completeness,
        'sections' => [
            'basic_info' => $newHire->hasBasicInfo(),
            'employment_docs' => $newHire->hasEmploymentDocs(),
            'bank_details' => $newHire->hasBankDetails(),
            'emergency_contact' => $newHire->hasEmergencyContact(),
            'gov_ids' => $newHire->hasGovIds(),
        ]
    ]);
}
```

4. [ ] Create frontend component `src/components/employees/CompletionProgress.tsx`:
```tsx
export function CompletionProgress({ newHire }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Profile Completion</span>
        <span className="text-sm font-bold">{newHire.profile_completeness}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${newHire.profile_completeness}%` }}
        />
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <p>✓ Basic Info</p>
        <p>✓ Employment Docs</p>
        <p>✓ Bank Details</p>
        <p>✓ Emergency Contact</p>
        <p>✓ Gov IDs</p>
      </div>
    </div>
  );
}
```

---

### Task 2.2: Auto-Transfer to Employee at 100%
**Time**: 1.5 hours  
**Owner**: Backend  

**Implementation**:

1. [ ] Create event listener `backend/app/Listeners/TransferNewHireToEmployee.php`:
```php
<?php

namespace App\Listeners;

use App\Models\NewHire;
use App\Models\Employee;

class TransferNewHireToEmployee
{
    public function handle($event)
    {
        $newHire = $event->newHire;
        
        if ($newHire->profile_completeness >= 100) {
            // Create employee record
            $employee = Employee::create([
                'user_id' => $newHire->user_id,
                'first_name' => $newHire->first_name,
                'last_name' => $newHire->last_name,
                'home_address' => $newHire->home_address,
                'phone_number' => $newHire->phone_number,
                'email' => $newHire->email,
                'department' => $newHire->department,
                'job_category' => $newHire->job_category,
                'basic_salary' => $newHire->basic_salary,
                'start_date' => $newHire->start_date,
                'shift_sched' => $newHire->shift_sched,
                'sss_number' => $newHire->sss_number,
                'philhealth_number' => $newHire->philhealth_number,
                'pagibig_number' => $newHire->pagibig_number,
                'bir_tin' => $newHire->bir_tin,
                'bank_account_number' => $newHire->bank_account_number,
                'bank_name' => $newHire->bank_name,
                'emergency_contact_name' => $newHire->emergency_contact_name,
                'emergency_contact_number' => $newHire->emergency_contact_number,
            ]);
            
            // Mark new hire as transferred
            $newHire->update(['status' => 'transferred']);
            
            // Create training automatically
            Training::create([
                'employee_id' => $employee->id,
                'department' => $employee->department,
                'status' => 'pending'
            ]);
        }
    }
}
```

2. [ ] Commit: `git add backend/ && git commit -m "feat: auto-transfer new hire to employee at 100% completion"`

---

## ✅ PHASE 3: TRAINING & RECRUITMENT (Days 5-6)

### Task 3.1: Auto-Create Training on Hire
**Time**: 1 hour  
**Owner**: Backend  

**Implementation**:
```php
// Update NewHireController
public function transfer(Request $request, NewHire $newHire)
{
    // Create employee
    $employee = Employee::create($newHire->toArray());
    
    // Auto-create training
    Training::create([
        'employee_id' => $employee->id,
        'department' => $employee->department,
        'created_by' => auth()->id(),
        'status' => 'pending'
    ]);
    
    $newHire->update(['status' => 'transferred']);
    
    return response()->json(['message' => 'Employee hired and training initiated']);
}
```

---

### Task 3.2: Leave Calendar View
**Time**: 2 hours  
**Owner**: Frontend  

**Implementation**:
```tsx
// src/components/leave/LeaveCalendar.tsx
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';

export function LeaveCalendar({ leaveRequests }) {
  const [selectedDate, setSelectedDate] = useState(null);
  
  const getLeaveOnDate = (date) => {
    return leaveRequests.filter(leave => 
      date >= leave.start_date && date <= leave.end_date
    );
  };
  
  return (
    <div>
      <Calendar 
        onSelectDay={(date) => setSelectedDate(date)}
      />
      {selectedDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          {getLeaveOnDate(selectedDate).map(leave => (
            <div key={leave.id} className="mb-2">
              <p className="font-semibold">{leave.leave_type}</p>
              <p className="text-sm text-gray-600">{leave.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📋 TESTING CHECKLIST

- [ ] Login page background image displays
- [ ] Clock in/out buttons functional
- [ ] PDF payslip downloads correctly
- [ ] Email notifications send
- [ ] New hire @ 100% transfers to employee
- [ ] Training auto-created on hire
- [ ] Leave calendar displays correctly
- [ ] All role permissions working
- [ ] Database seeders run without errors
- [ ] Frontend builds with zero errors

---

## 🎯 DEPLOYMENT CHECKLIST

- [ ] All critical fixes tested
- [ ] Database backed up
- [ ] Environment variables configured
- [ ] SMTP credentials verified
- [ ] Payment gateway tested (if applicable)
- [ ] Load tested under 100 concurrent users
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] User training materials prepared
- [ ] Rollback plan documented

---

## 📞 SUPPORT CONTACTS

**Frontend Issues**: Check `npm run dev` output, look for console errors  
**Backend Issues**: Check `php artisan log:tail` or storage/logs/  
**Database Issues**: Use `php artisan tinker` to inspect data  
**Email Issues**: Check mail service logs, verify SMTP config  

---

**Last Updated**: April 5, 2026  
**Status**: Ready for implementation  
**Estimated Completion**: 2 weeks from start  
**Next Sync**: Daily standups recommended
