# Attendance & Timekeeping System - Blue Lotus Hotel

## Overview

The Attendance & Timekeeping System is a comprehensive solution for tracking employee work hours, managing leave requests, and monitoring real-time workforce status. Built with Laravel backend and React frontend, it provides role-based interfaces for employees, managers, and HR personnel.

**Key Features:**
- ✅ Real-time clock in/out with timestamp and device tracking
- ✅ Automatic late detection with 15-minute grace period
- ✅ Daily absence processing via automated Cron job
- ✅ Leave request submission and approval workflow
- ✅ Live workforce dashboard for managers
- ✅ Attendance history and reporting
- ✅ IP address and device tracking for audit trail
- ✅ Leave blocking (employees on approved leave cannot clock in)

---

## System Architecture

### Database Schema

#### `attendances` Table
Tracks employee clock in/out records with status and calculations.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `employee_id` | UUID | Foreign key to employees |
| `date` | DATE | Attendance date |
| `time_in` | TIME | Clock in time (nullable) |
| `time_out` | TIME | Clock out time (nullable) |
| `status` | ENUM | [present, late, absent, on_leave, half_day] |
| `minutes_late` | INT | Minutes after shift start (if late) |
| `hours_worked` | DECIMAL(5,2) | Calculated hours worked |
| `within_grace_period` | BOOLEAN | Whether clocked in within 15-min grace period |
| `clock_in_ip` | VARCHAR(45) | IP address for clock in |
| `clock_out_ip` | VARCHAR(45) | IP address for clock out |
| `device_info` | TEXT | Device/browser user agent |
| `recorded_by` | UUID | User who recorded (nullable for auto-records) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Record update time |

**Indexes:**
- Composite: `(employee_id, date)` - Fast daily lookup
- Single: `status`, `date`

#### `leave_requests` Table
Manages employee leave requests with approval workflow.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `employee_id` | UUID | Foreign key to employees |
| `start_date` | DATE | Leave start date |
| `end_date` | DATE | Leave end date |
| `leave_type` | ENUM | [vacation, sick, emergency, unpaid, maternity, paternity] |
| `status` | ENUM | [pending, approved, rejected, cancelled] |
| `number_of_days` | INT | Calculated days |
| `hours_requested` | DECIMAL(5,2) | Hours (if partial day) |
| `reason` | TEXT | Reason for leave |
| `contact_person` | VARCHAR(255) | Emergency contact name |
| `contact_phone` | VARCHAR(20) | Emergency contact phone |
| `approver_id` | UUID | Manager who approved (nullable) |
| `approved_at` | TIMESTAMP | Approval timestamp (nullable) |
| `rejection_reason` | TEXT | Reason if rejected (nullable) |
| `created_at` | TIMESTAMP | Request creation time |
| `updated_at` | TIMESTAMP | Record update time |

**Indexes:**
- Single: `status`, `employee_id`, `start_date`, `end_date`

---

## Backend Implementation

### Models

#### Attendance Model
**File:** `backend/app/Models/Attendance.php`

**Key Methods:**
```php
// Status Checks
isClockedIn()                          // Check if employee has active clock-in
canClockOut()                          // Validate clock-out prerequisites
isLate(?string $shiftStartTime)       // Check if clocked in late
getStatusColor()                       // Return color code for status

// Calculations
calculateHoursWorked()                // Calculate hours between in/out
calculateMinutesLate()                // Calculate minutes late from shift start
getFormattedTimeIn()                  // Format time_in as H:MM
getFormattedTimeOut()                 // Format time_out as H:MM

// Scopes (Query Builders)
forDate(string $date)                 // Records for specific date
forDateRange($start, $end)            // Records in date range
byStatus(string $status)              // Filter by status
today()                               // Today's records
forMonth(string $year, int $month)   // Month records
```

**Relationships:**
- `employee()` - Belongs to Employee
- `recorder()` - Belongs to User (who recorded)

#### LeaveRequest Model
**File:** `backend/app/Models/LeaveRequest.php`

**Key Methods:**
```php
// Approval Workflow
canApprove()                          // Check if approvable
canReject()                           // Check if rejectable
approve(string $approverId, ?string $reason)
reject(string $approverId, ?string $reason)

// Validation
isDateInLeave(string $date)           // Check if date falls within leave
getLeaveTypeLabel()                   // Get readable leave type name

// Scopes
pending()                             // Pending approvals
approved()                            // Approved leaves
forDateRange($start, $end)            // Leaves in date range
```

**Relationships:**
- `employee()` - Belongs to Employee
- `approver()` - Belongs to User (manager)

### Service Layer

#### AttendanceService
**File:** `backend/app/Services/AttendanceService.php`

**Core Methods:**

```php
// Clock Operations
clockIn(string $employeeId, ?string $ip, ?string $deviceInfo)
  - Validates employee exists
  - Checks if already clocked in (prevent duplicates)
  - Checks if on approved leave
  - Calculates status (late vs on-time)
  - Checks grace period (15 min after 08:00)
  - Records IP and device info
  - Returns Attendance record

clockOut(string $employeeId, ?string $ip, ?string $deviceInfo)
  - Validates clock-in exists
  - Calculates hours_worked
  - Records clock-out time
  - Returns updated Attendance record

// Status Calculations
calculateStatus(string $timeIn, ?string $shiftStart = '08:00'): string
  - 'late' if after shift start
  - 'present' if on-time (within grace period)

calculateMinutesLate(string $timeIn, string $shiftStart = '08:00'): int
  - Minutes between clock-in and shift start

calculateHoursWorked(?string $timeIn, ?string $timeOut): float
  - Hours between in/out times (e.g., 08:00-17:00 = 9 hours)

// Leave Validation
isEmployeeOnLeave(string $employeeId, string $date): bool
  - Checks approved leave requests
  - Blocks clock-in if on leave

// Marking Absences
markAbsent(string $employeeId, string $date, string $reason = 'No Clock-In')
  - Manually mark employee as absent
  - Used by managers for legitimate absences

// Daily Processing (Cron Job)
processDailyAttendance(?string $date = null): int
  - Runs at 17:05 (5 min after shift end)
  - Marks all employees without records as 'absent'
  - Skips weekends (Sat/Sun)
  - Skips employees on approved leave
  - Returns count of processed records

// Reporting
getLiveWorkforceStatus(): LiveWorkforceStatus
  - Real-time grouped status:
    * clocked_in: Currently working
    * clocked_out: Finished for day
    * not_arrived: Expected but not clocked in
    * on_leave: Approved leave
    * absent: No record (after process-daily)

getAttendanceSummary(?string $month, ?string $year): AttendanceSummary
  - Period attendance overview
  - Counts by status
  - Total hours worked
  - Total minutes late

getMonthlyStatistics(int $month, int $year): MonthlyStatistics
  - Monthly reporting data
  - Working days
  - Attendance percentage
  - Aggregate statistics
```

**Constants:**
```php
private const GRACE_PERIOD_MINUTES = 15;      // Grace period for lateness
private const SHIFT_START_TIME = '08:00';     // Shift start time
private const SHIFT_END_TIME = '17:00';       // Shift end time
```

### Controllers

#### AttendanceController
**File:** `backend/app/Http/Controllers/AttendanceController.php`

**Endpoints:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/attendance/clock-in` | Employee clocks in |
| POST | `/api/attendance/clock-out` | Employee clocks out |
| GET | `/api/attendance/live-status` | Real-time workforce status |
| GET | `/api/attendance` | Get attendance records (paginated, filterable) |
| GET | `/api/attendance/summary` | Get attendance summary |
| GET | `/api/attendance/monthly-stats` | Get monthly statistics |
| POST | `/api/attendance/mark` | HR marks attendance manually |
| POST | `/api/attendance/process-daily` | Cron job endpoint (marks absents) |
| POST | `/api/leave-requests` | Create leave request |
| GET | `/api/leave-requests` | List leave requests |
| POST | `/api/leave-requests/{id}/approve` | Approve leave request |
| POST | `/api/leave-requests/{id}/reject` | Reject leave request |

---

## Frontend Implementation

### Components

#### LiveDashboard
**File:** `src/components/attendance/LiveDashboard.tsx`

**Features:**
- Summary cards: Total workforce, Clocked In (green), Not Arrived (yellow), On Leave (blue), Absent (red)
- Attendance rate bar with percentage
- Expandable lists showing employee names, departments, clock times
- Color-coded by status for quick visual scanning
- Real-time updates

**Props:**
```typescript
interface LiveDashboardProps {
  status: LiveWorkforceStatus | null;
  isLoading?: boolean;
}
```

#### ClockInWidget
**File:** `src/components/attendance/ClockInWidget.tsx`

**Features:**
- Large digital clock display (updates every second)
- Green "Clock In" and Red "Clock Out" buttons
- Confirmation dialog with timestamp verification
- Today's summary (status, hours worked, minutes late)
- Device info and IP tracking
- Success/error notifications

**Props:**
```typescript
interface ClockInWidgetProps {
  employee: any;
  onSuccess?: () => void;
}
```

#### AttendanceHistory
**File:** `src/components/attendance/AttendanceHistory.tsx`

**Features:**
- Searchable employee list
- Month/year filter
- Status filter (All/Present/Late/Absent/On Leave/Half Day)
- Table with: Employee, Date, Clock In, Clock Out, Hours, Minutes Late, Status
- Export button
- Shows filtered record count

**Props:**
```typescript
interface AttendanceHistoryProps {
  attendances: Attendance[];
  isLoading?: boolean;
  onExport?: () => void;
}
```

#### LeaveRequestPortal
**File:** `src/components/attendance/LeaveRequestPortal.tsx`

**Employee View:**
- Form to submit leave request
  * Start/End dates
  * Leave type dropdown
  * Duration calculation
  * Reason textarea
  * Emergency contact info
- List of own requests with status badges
- View approved leaves

**Manager View:**
- List of pending approvals with quick approve/reject
- Optional notes/reason input
- Approval history with decisions and dates
- Employee contact info for reference

**Props:**
```typescript
interface LeaveRequestPortalProps {
  leaveRequests: LeaveRequest[];
  isLoading?: boolean;
  isManager?: boolean;
  onSubmit?: (data: Partial<LeaveRequest>) => void;
  onApprove?: (id: string, reason?: string) => void;
  onReject?: (id: string, reason?: string) => void;
}
```

#### Attendance Page
**File:** `src/pages/Attendance.tsx`

**Tabs:**
1. **Dashboard** - LiveDashboard for managers, Today's/Monthly status for employees
2. **Clock In/Out** - ClockInWidget for employees
3. **History** - AttendanceHistory for all users
4. **Leave Requests** - LeaveRequestPortal for employees and managers

### Custom Hook

#### useAttendance
**File:** `src/hooks/useAttendance.ts`

**State:**
```typescript
liveStatus: LiveWorkforceStatus | null
attendances: Attendance[]
leaveRequests: LeaveRequest[]
summary: AttendanceSummary | null
monthlyStats: MonthlyStatistics | null
isLoading: boolean
error: string | null
```

**Methods:**
```typescript
fetchLiveStatus()                             // Get real-time status
fetchAttendance(startDate?, endDate?, filters?)  // Get records
clockIn()                                    // Employee clocks in
clockOut()                                   // Employee clocks out
createLeaveRequest(data)                     // Submit leave request
fetchLeaveRequests()                         // Get leave requests
approveLeaveRequest(id, reason?)             // Approve leave
rejectLeaveRequest(id, reason?)              // Reject leave
getSummary(month?, year?)                    // Get summary stats
getMonthlyStats(month, year)                 // Get monthly report
```

### TypeScript Types

**File:** `src/types/attendance.ts`

```typescript
interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  time_in?: string;
  time_out?: string;
  status: 'present' | 'late' | 'absent' | 'on_leave' | 'half_day';
  minutes_late: number;
  hours_worked: number;
  within_grace_period: boolean;
  clock_in_ip?: string;
  clock_out_ip?: string;
  device_info?: string;
  employee?: Employee;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  leave_type: 'vacation' | 'sick' | 'emergency' | 'unpaid' | 'maternity' | 'paternity';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  number_of_days: number;
  hours_requested: number;
  reason: string;
  contact_person: string;
  contact_phone: string;
  approver_id?: string;
  approved_at?: string;
  employee?: Employee;
}

interface LiveWorkforceStatus {
  clocked_in: Attendance[];
  clocked_out: Attendance[];
  not_arrived: Attendance[];
  on_leave: Attendance[];
  absent: Attendance[];
}

interface AttendanceSummary {
  total_days: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  on_leave_count: number;
  half_day_count: number;
  total_hours: number;
  total_minutes_late: number;
  records: Attendance[];
}

interface MonthlyStatistics {
  month: number;
  year: number;
  working_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  on_leave_days: number;
  total_hours: number;
  attendance_percentage: number;
}
```

---

## API Routes

All attendance routes are prefixed with `/api/`.

### Attendance Routes
```php
// Clock operations
Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn']);
Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut']);

// Status and reports
Route::get('attendance/live-status', [AttendanceController::class, 'getLiveStatus']);
Route::get('attendance', [AttendanceController::class, 'getAttendance']);
Route::get('attendance/summary', [AttendanceController::class, 'getSummary']);
Route::get('attendance/monthly-stats', [AttendanceController::class, 'getMonthlyStats']);

// HR operations
Route::post('attendance/mark', [AttendanceController::class, 'markAttendance']);
Route::post('attendance/process-daily', [AttendanceController::class, 'processDailyAttendance']);
```

### Leave Request Routes
```php
// Employee operations
Route::post('leave-requests', [AttendanceController::class, 'createLeaveRequest']);
Route::get('leave-requests', [AttendanceController::class, 'getLeaveRequests']);

// Manager approvals
Route::post('leave-requests/{id}/approve', [AttendanceController::class, 'approveLeaveRequest']);
Route::post('leave-requests/{id}/reject', [AttendanceController::class, 'rejectLeaveRequest']);
```

---

## Workflow & Business Logic

### Clock In Process
1. Employee clicks "Clock In" button
2. Frontend captures device info and IP (if available)
3. Backend validates:
   - Employee exists
   - Not already clocked in today
   - Not on approved leave
4. Status calculated:
   - `late` if time > 08:00 AND > 15-min grace period
   - `present` if time ≤ 08:15 (within grace period)
5. Record created with time_in, status, IP, device
6. Frontend refreshes live status

### Clock Out Process
1. Employee clicks "Clock Out" button
2. Backend validates:
   - Clock-in record exists
   - Not already clocked out
3. Calculations:
   - `hours_worked = (time_out - time_in) / 60`
4. Record updated with time_out
5. Frontend refreshes status

### Daily Processing (Cron Job)
1. **Trigger:** 17:05 (5 minutes after shift end)
2. **Execution:** `app/Console/Commands/ProcessDailyAttendance.php`
3. **Logic:**
   - Get all active employees
   - For each employee:
     - Skip if on approved leave
     - Skip if it's a weekend
     - Check if attendance record exists for today
     - If missing: create record with status='absent'
4. **Logging:** Records created_at timestamp for audit trail

### Leave Request Workflow
1. **Employee submits request:**
   - Fills form (dates, type, reason, contact info)
   - System calculates `number_of_days`
   - Status set to 'pending'

2. **Manager reviews:**
   - See pending requests in LeaveRequestPortal
   - Click Approve/Reject button
   - Add optional notes
   - Status updated to 'approved' or 'rejected'
   - Timestamp recorded

3. **System effects:**
   - When approved: Employee cannot clock in on those dates
   - When rejected: Employee can submit new request
   - When cancelled: Employee can clock in normally

---

## Grace Period Logic

**Scenario:** Employee arrives at 08:12 (12 minutes late)

**Grace Period:** 15 minutes after shift start (until 08:15)

**Result:**
- `status = 'present'` (within grace period)
- `minutes_late = 0` (not penalized)
- `within_grace_period = true`

**Scenario:** Employee arrives at 08:20 (20 minutes late)

**Result:**
- `status = 'late'` (exceeded grace period)
- `minutes_late = 20` (for reporting)
- `within_grace_period = false`

---

## Installation & Setup

### Backend Setup

1. **Run migrations:**
```bash
php artisan migrate
```

2. **Seed test data (optional):**
```bash
php artisan tinker
# In tinker:
$emp = Employee::first();
$emp->attendances()->create(['date' => now(), 'time_in' => '08:00', 'status' => 'present']);
```

3. **Schedule Cron job (production):**
```bash
# Add to crontab every minute
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

   Or test locally:
```bash
php artisan schedule:work
```

### Frontend Setup

Already configured in `src/hooks/useAttendance.ts` and components.

**Usage in components:**
```tsx
const { liveStatus, attendances, isLoading, fetchLiveStatus, clockIn } = useAttendance();

// On mount
useEffect(() => {
  fetchLiveStatus();
}, []);

// Clock in
const handleClockIn = async () => {
  try {
    await clockIn();
    toast({ title: "Clocked in successfully" });
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  }
};
```

---

## Security Considerations

1. **IP Tracking:** Records IP for audit trail and fraud detection
2. **Device Info:** User agent stored for device verification
3. **Timestamp Validation:** Server-side time (not client) to prevent manipulation
4. **Leave Blocking:** Employees on approved leave cannot clock in
5. **Audit Trail:** recorded_by field tracks who marked attendance
6. **Grace Period:** Prevents system clock differences penalizing employees
7. **Daily Processing:** Automated to prevent manual manipulation

---

## Troubleshooting

### Issue: Employees appearing as absent when they worked

**Solution:**
- Check if `processDailyAttendance` ran successfully
- Verify shift times in `AttendanceService` constants
- Check if employee was on leave (would be excluded from marking)

### Issue: Cron job not running

**Solution (Development):**
```bash
php artisan schedule:work
```

**Solution (Production):**
- Verify crontab entry: `crontab -l`
- Check Laravel logs: `storage/logs/laravel.log`
- Verify artisan schedule command: `php artisan schedule:list`

### Issue: Grace period not working

**Solution:**
- Verify `GRACE_PERIOD_MINUTES` constant in AttendanceService (default: 15)
- Check database time zone settings
- Ensure server time is accurate

---

## Performance Optimization

1. **Indexing:** (employee_id, date) composite index for fast daily lookups
2. **Pagination:** Attendance history uses pagination to prevent loading all records
3. **Caching:** LiveWorkforceStatus can be cached for 1 minute (high-traffic deployments)
4. **Lazy Loading:** Leave requests only loaded when needed

---

## Future Enhancements

1. **Biometric Integration:** Fingerprint/facial recognition
2. **Mobile App:** Native mobile clock in/out
3. **Overtime Calculation:** Auto-calculate overtime hours
4. **Attendance Analytics:** Charts and trends
5. **WhatsApp Notifications:** Leave approval notifications
6. **Shift Flexibility:** Multiple shifts per employee
7. **Geolocation:** GPS check-in verification

---

## Monitoring & Maintenance

### Daily Checks
- Verify Cron job ran successfully
- Check employee clocks for accuracy
- Review leave approvals

### Weekly Reviews
- Generate attendance reports
- Identify patterns (no-shows, chronic lateness)
- Update leave balances

### Monthly Audits
- Verify all records processed correctly
- Check for anomalies
- Archive old records (>2 years)

---

## Support & Documentation

For questions or issues:
1. Check database migrations for schema
2. Review AttendanceService for business logic
3. Check API responses in browser DevTools
4. Review Laravel logs: `storage/logs/laravel.log`

**Related Documentation:**
- [Payroll System](./PAYROLL_SYSTEM.md)
- [Laravel Specs](./LARAVEL_SPECS.md)
