# 🏢 Blue Lotus Hotel HR Management System - PRD & Implementation Status

**Document Date**: March 23, 2026
**Target Audience**: Development Teams, LLM Context Handoffs
**System Status**: 75% Complete - Payroll System Fully Operative, Employee Management Core Complete

---

## 📑 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Completed Subsystems](#completed-subsystems)
4. [In-Progress Features](#in-progress-features)
5. [Not Started / TODO](#not-started--todo)
6. [Project Structure](#project-structure)
7. [Database Schema](#database-schema)
8. [File Navigation Guide](#file-navigation-guide)
9. [How to Run & Setup](#how-to-run--setup)
10. [Key Integration Points](#key-integration-points)

---

## SYSTEM OVERVIEW

### Purpose
Comprehensive HR management system for Blue Lotus Hotel with 45+ employees. System handles:
- Employee management & onboarding
- Attendance tracking
- Payroll computation & management
- Performance evaluations
- Leave management
- Bank holiday integrations

### Core Users
- **Admin**: Full system access, can perform all operations
- **Accountant**: Payroll management (compute, approve, email payslips)
- **HR Manager**: Employee management, new hire onboarding, leave approvals
- **Manager**: View team performance, attendance, leave requests
- **Employee**: View own payslips, attendance, leave history

### Current Environment
- **Frontend URL**: http://localhost:5173
- **Backend URL**: http://localhost:5000
- **Database**: SQLite (file-based: `backend/emssss`)
- **Date**: March 23, 2026 (hardcoded date for testing)

---

## ARCHITECTURE & TECH STACK

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS
- **Component Library**: Shadcn/UI (custom Vite-based)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Custom hooks (useAuth)
- **HTTP Client**: Fetch API with custom authFetch wrapper

### Backend Stack
- **Framework**: Laravel 12
- **PHP Version**: 8.2.4
- **Database**: SQLite with migrations
- **Authentication**: Laravel Sanctum (token-based)
- **API**: RESTful JSON endpoints
- **PDF Generation**: Custom PayslipPDF service
- **Email**: Laravel Mail (configured for SMTP)

### Key Libraries

**Backend**:
- `laravel/sanctum` - Token authentication
- `barryvdh/laravel-dompdf` - PDF generation
- `phpunit/phpunit` - Testing
- `composer` - Dependency management

**Frontend**:
- `@tanstack/react-query` - Data fetching & caching
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `shadcn/ui` - Pre-built components

---

## COMPLETED SUBSYSTEMS

### ✅ 1. AUTHENTICATION SYSTEM
**Status**: 100% Complete
**Location**: 
- Backend: `backend/app/Http/Controllers/AuthController.php`
- Frontend: `src/hooks/useAuth.ts`

**Features**:
- ✅ Token-based authentication (Laravel Sanctum)
- ✅ Login/logout functionality
- ✅ Role-based access control (5 roles)
- ✅ Permission checking (canApproveLeave, canManagePayroll, etc.)
- ✅ Session persistence
- ✅ Protected routes

**How Users Authenticate**:
1. User enters email + password on login page
2. Backend validates credentials, issues Bearer token
3. Frontend stores token in localStorage
4. All API requests include token in Authorization header
5. Backend validates token on each request
6. System checks user role for feature access

**Code Files**:
```
Backend:
  /app/Http/Controllers/AuthController.php
  /app/Models/User.php
  /routes/api.php (auth endpoints)
  
Frontend:
  /src/hooks/useAuth.ts (main auth hook)
  /src/pages/Login.tsx (login form)
  /src/App.tsx (route protection)
```

---

### ✅ 2. EMPLOYEE MANAGEMENT SYSTEM
**Status**: 95% Complete
**Location**: 
- Backend: `backend/app/Models/Employee.php`, `backend/app/Http/Controllers/EmployeeController.php`
- Frontend: `src/pages/Employees.tsx`, `src/components/employees/`

**Completed Features**:
- ✅ Full CRUD operations on employees
- ✅ Personal information management (name, DOB, contact, address)
- ✅ Government IDs (SSS, PhilHealth, PagIBIG, TIN)
- ✅ Banking information (account for salary disbursement)
- ✅ Employment details (department, job category, salary, start date)
- ✅ Employee listing with search/filter
- ✅ Employee detail view
- ✅ Employee archiving (soft deletes)
- ✅ Photo upload functionality

**Database**: `employees` table with 40+ fields
**API Endpoints**:
```
GET    /api/employees              (list all)
GET    /api/employees/{id}         (get details)
POST   /api/employees              (create)
PATCH  /api/employees/{id}         (update)
DELETE /api/employees/{id}         (soft delete/archive)
POST   /api/employees/{id}/archive (archive employee)
```

**Frontend Files**:
```
/src/pages/Employees.tsx              (main employees page)
/src/components/employees/
  ├── EmployeeForm.tsx                (create/edit form)
  ├── EmployeeTable.tsx               (listing table)
  ├── EmployeeDetail.tsx              (detail view)
  ├── NewHireForm.tsx                 (onboarding form)
  └── EmployeeAvatar.tsx              (photo display)
```

---

### ✅ 3. ATTENDANCE TRACKING SYSTEM
**Status**: 90% Complete
**Location**: 
- Backend: `backend/app/Models/Attendance.php`, `backend/app/Http/Controllers/AttendanceController.php`
- Frontend: `src/pages/Attendance.tsx`, `src/components/attendance/`

**Completed Features**:
- ✅ Daily attendance logging (check-in/check-out)
- ✅ Attendance calendar view
- ✅ Monthly attendance summary
- ✅ Attendance reporting (present, absent, late, on-leave)
- ✅ Filter by employee, date range, status
- ✅ Real-time status indicators
- ✅ Late tracking (automatic calculation)

**Database**: `attendances` table
**Pending**: Advanced analytics, export to Excel

---

### ✅ 4. PAYROLL & ACCOUNTING SYSTEM
**Status**: 100% Complete (Core) - 90% (Enhanced Features)
**Location**:
- Backend: `backend/app/Services/PayslipService.php`, `backend/app/Http/Controllers/PayslipController.php`
- Frontend: `src/pages/Accounting.tsx`, `src/components/accounting/`

**Completed Features**:

#### Core Payroll Processing:
- ✅ Payroll period management (semi-monthly)
- ✅ Bulk payslip generation with auto-calculations
- ✅ Earnings calculation (Basic, Overtime, Allowances, Bonuses, 13th Month)
- ✅ Deductions calculation (Attendance, Statutory, Loans)
- ✅ Tax computation (Philippine BIR withholding tax)
- ✅ Government contributions (SSS, PhilHealth, PagIBIG - employee & employer)
- ✅ Net pay calculation
- ✅ Payslip approval workflow (computed → approved → paid)
- ✅ Email distribution with PDF attachments
- ✅ Individual payslip PDF generation with Blue Lotus branding

#### Payroll UI:
- ✅ Period selector with status badges
- ✅ 4 stat cards (Employees, Total Gross, Total Net, Paid count)
- ✅ "New Period" button (auto-generates next semi-monthly)
- ✅ "Compute All" button (bulk calculation)
- ✅ "Bulk Email" button (sends all approved payslips)
- ✅ "Summary PDF" button (audit-ready export)
- ✅ 3 tabs: Payslips | Summary | Audit Trail

#### Payslip Detail Drawer:
- ✅ 4 tabs: Details | Bonuses | Deductions | Adjustments
- ✅ Add custom bonuses
- ✅ Categorized deductions view
- ✅ Manual adjustments
- ✅ Approve/Mark as Paid/Send Email buttons

#### Government Remittance Summary:
- ✅ SSS breakdown (employee + employer)
- ✅ PhilHealth breakdown (employee + employer)
- ✅ PagIBIG breakdown (employee + employer)
- ✅ BIR withholding tax
- ✅ Export to PDF/Excel

#### Audit Trail:
- ✅ Immutable log of all payroll actions
- ✅ Action types: created, computed, approved, paid, email_sent, adjusted
- ✅ User tracking (who performed action)
- ✅ Timestamp tracking
- ✅ Entity tracking (which payslip/period)

**Database Tables**:
```
payroll_periods                (periods with status tracking)
payslips                       (44 columns - all calculations)
payslip_line_items             (detailed earnings/deductions)
employee_allowances            (recurring allowances per employee)
employee_loans                 (loan tracking with monthly deduction)
payroll_audit_logs             (immutable action log)
```

**API Endpoints**:
```
GET    /api/payroll-periods                (list all periods)
POST   /api/payroll-periods                (create new period)
POST   /api/payroll-periods/{id}/compute   (compute all payslips)
GET    /api/payslips                       (list payslips)
GET    /api/payslips/{id}                  (get payslip details)
POST   /api/payslips/{id}/approve          (approve payslip)
POST   /api/payslips/{id}/mark-paid        (mark as paid)
POST   /api/payslips/{id}/send-email       (send payslip via email)
POST   /api/payslips/{id}/pdf              (generate PDF)
POST   /api/payroll-periods/{id}/bulk-email (send all approved)
GET    /api/payroll-periods/{id}/summary-pdf (download summary)
GET    /api/payroll-audit-logs             (get audit trail)
```

**Frontend Files**:
```
/src/pages/Accounting.tsx                  (main accounting page)
/src/components/accounting/
  ├── PayslipTable.tsx                     (payslips list)
  ├── PayslipDrawer.tsx                    (details drawer - 4 tabs)
  ├── PayrollSummaryTab.tsx                (summary & remittances)
  ├── AuditTrailTab.tsx                    (immutable log)
  └── PayrollSummaryRow.tsx                (individual items)

/src/hooks/useAccounting.ts                (main accounting hook)
```

---

### ✅ 5. NEW HIRE ONBOARDING SYSTEM
**Status**: 95% Complete
**Location**:
- Backend: `backend/app/Models/NewHire.php`, `backend/app/Http/Controllers/NewHireController.php`
- Frontend: `src/components/employees/NewHireForm.tsx`

**Completed Features**:
- ✅ New hire record creation
- ✅ Multi-step onboarding form (13 form sections)
- ✅ Required field tracking
- ✅ Auto-transfer to employees when complete
- ✅ Status tracking (pending, complete, transferred)
- ✅ Supervisor assignment
- ✅ Government ID registration
- ✅ Bank account setup
- ✅ New hire seeder with 5 test records

**Status Values**:
- `pending` - Form in progress, missing required fields
- `complete` - All required fields filled, ready for auto-transfer
- `transferred` - Successfully converted to employee

**Required Fields**:
```
first_name, last_name, date_of_birth, email, phone_number, home_address,
emergency_contact_name, emergency_contact_number, relationship,
start_date, department, job_category, employment_type, basic_salary
```

**Database**: `new_hires` table (30+ fields)

---

### ✅ 6. PERFORMANCE EVALUATION SYSTEM
**Status**: 85% Complete
**Location**:
- Backend: `backend/app/Models/` (EvaluationForm, EvaluationQuestion, EvaluationAssignment, EvaluationResponse)
- Frontend: `src/pages/Performance.tsx`, `src/components/performance/`

**Completed Features**:
- ✅ Evaluation form creation (templates for different departments)
- ✅ Form sections with questions
- ✅ Multiple question types (Likert scale, text, numeric)
- ✅ Question randomization
- ✅ Evaluation assignment to employees/managers
- ✅ Response collection
- ✅ Analytics & scoring
- ✅ Performance dashboard view

**Database Tables**:
```
evaluation_forms           (templates)
evaluation_sections        (form sections)
evaluation_questions       (individual questions)
evaluation_likert_options  (Likert scale options)
evaluation_assignments     (who evaluates whom)
evaluation_responses       (answers submitted)
```

---

### ✅ 7. LEAVE MANAGEMENT SYSTEM
**Status**: 80% Complete
**Location**:
- Backend: `backend/database/migrations/` (leave_requests table)
- Frontend: `src/components/attendance/` (Leave components)

**Completed Features**:
- ✅ Leave request submission
- ✅ Leave type tracking (sick, vacation, emergency, etc.)
- ✅ Date range selection
- ✅ Manager approval workflow
- ✅ Leave balance tracking
- ✅ Attendance impact (marks as "on-leave")

**Database**: `leave_requests` table with status, type, date range
**Pending**: Complex leave balance calculations, accrual rules

---

### ✅ 8. DATA MODELS & RELATIONSHIPS
**Status**: 100% Complete

**Key Models**:
```
User
  ├── one-to-one → Employee
  ├── one-to-many → Session (browser sessions)
  └── one-to-many → PersonalAccessToken (API tokens)

Employee
  ├── one-to-many → Attendance
  ├── one-to-many → LeaveRequest
  ├── one-to-many → Payslip
  ├── one-to-many → EmployeeAllowance
  ├── one-to-many → EmployeeLoan
  ├── one-to-many → EvaluationAssignment (as evaluatee)
  ├── one-to-many → EvaluationResponse
  └── has-one → NewHire (if transferred from onboarding)

PayrollPeriod
  └── one-to-many → Payslip

Payslip
  ├── belongs-to → Employee
  ├── belongs-to → PayrollPeriod
  ├── one-to-many → PayslipLineItem
  ├── belongs-to → User (computed_by)
  └── belongs-to → User (approved_by)

EmployeeAllowance (recurring allowances)
EmployeeLoan (active loans with monthly deduction tracking)
PayrollAuditLog (immutable action log)
```

---

## IN-PROGRESS FEATURES

### ⏳ 1. ADVANCED PAYROLL ANALYTICS
**Status**: Planned (10% started)
**What's Done**:
- Basic payroll summary showing totals
- Monthly breakdown

**What's Needed**:
- Year-to-date payroll reports per employee
- Trend analysis (salary increases, deductions over time)
- Monthly vs. semi-monthly comparison
- Department-level payroll analytics
- Export to Excel with formatting

**Estimated Impact**: Critical for finance team

---

### ⏳ 2. LEAVE BALANCE & ACCRUAL
**Status**: Partially implemented (40% done)
**What's Done**:
- Leave requests stored in database
- Leave types tracked

**What's Needed**:
- Automatic accrual calculation (10 days/month, 13th month, etc.)
- Balance tracking per employee
- Carryover rules (can carry over 5 days max)
- Expiration dates
- Leave balance display in UI
- Override for manual adjustments

**Estimated Impact**: Critical for HR operations

---

### ⏳ 3. MOBILE-FRIENDLY PAYSLIP VIEW
**Status**: Planned (0% started)
**What's Needed**:
- Responsive payslip drawer for mobile
- QR code on payslip for mobile access
- Simplified PDF layout for mobile screens
- Touch-friendly buttons

**Estimated Impact**: Nice-to-have for employee experience

---

## NOT STARTED / TODO

### ❌ 1. OVERTIME MANAGEMENT & APPROVAL
**Why Important**: Track overtime hours separately, requires manager approval
**Estimated Effort**: 10-15 hours
**Dependencies**: Attendance logging, manager role permissions

**Features to Add**:
- Overtime logging per employee
- Manager approval workflow (pending → approved → paid)
- Overtime rate calculation (1.25x, 1.5x, 2x based on time)
- Automatic inclusion in payslip when approved
- Overtime audit trail

---

### ❌ 2. SALARY REVISION & HISTORY
**Why Important**: Track salary changes, ensure payroll accuracy
**Estimated Effort**: 8-12 hours
**Dependencies**: Employee model, payslip calculations

**Features to Add**:
- Salary revision effective date tracking
- Historical salary records
- Payslip calculation based on revision date
- Salary review workflow (propose → approve → implement)

---

### ❌ 3. YEAR-END TAX PROCESSING
**Why Important**: Required for Philippine tax filing (BIR, SSS, PhilHealth)
**Estimated Effort**: 15-20 hours
**Dependencies**: Complete payroll records, tax calculations

**Features to Add**:
- Annual tax summary per employee
- 13th month pay processing
- Year-end adjustment calculations
- Tax certificate generation
- BIR-compliant export format
- SSS contribution reconciliation

---

### ❌ 4. HOLIDAY CALENDAR & MANAGEMENT
**Why Important**: Affects attendance calculations, leave processing
**Estimated Effort**: 8-10 hours
**Dependencies**: Calendar UI, attendance system

**Features to Add**:
- National public holidays configuration
- Company-specific holidays
- Holiday premium calculation (1.25x, 1.5x pay)
- Automatic attendance marking for holidays
- Holiday calendar view

---

### ❌ 5. SHIFT MANAGEMENT
**Why Important**: Hotel operates 24/7, different shifts for different roles
**Estimated Effort**: 12-15 hours
**Dependencies**: Employee assignments, attendance tracking

**Features to Add**:
- Shift templates (morning, afternoon, night)
- Employee shift assignments
- Shift swapping (request → approve)
- Shift differential pay (premium for night shifts)
- Attendance validation based on assigned shift

---

### ❌ 6. TRAINING & CERTIFICATIONS
**Why Important**: Track employee development, compliance training
**Estimated Effort**: 10-12 hours

**Features to Add**:
- Training course catalog
- Training assignments
- Completion tracking
- Certificate generation
- Training expiration alerts

---

### ❌ 7. PDF REPORT SUITE
**Why Important**: Generate compliance reports for tax, labor, management
**Estimated Effort**: 20-25 hours (complex)

**Reports to Generate**:
- Payroll register (all employees for period)
- Attendance report (monthly)
- Leave balance report
- Tax certificate (for employees)
- Audit trail detailed report
- Department payroll breakdown

---

### ❌ 8. NOTIFICATION SYSTEM
**Why Important**: Alert users of important events
**Estimated Effort**: 15-20 hours

**Features to Add**:
- In-app notifications (Bell icon, notification center)
- Email notifications (scheduled digests)
- SMS notifications (urgent alerts)
- Notification preferences per user
- Read/unread state tracking

**Events to Trigger**:
- Payslip ready for review
- Leave request approved/rejected
- Evaluation assigned
- New hire ready for transfer
- Low leave balance warning

---

### ❌ 9. ADVANCED FILTERING & SORTING
**Status**: Partial (20% done)
**What's Done**: Basic search in employees, attendance

**What's Needed**:
- Multi-column filtering (payroll by status, date range, department)
- Advanced sort (by multiple fields)
- Saved filter presets
- Date range pickers (improved UX)
- Department/team filtering

---

### ❌ 10. DASHBOARD ENHANCEMENTS
**Status**: Partial (30% done)
**What's Done**: Basic dashboard with 4 stat cards

**What's Needed**:
- Charts (payroll trends, attendance patterns, performance distribution)
- Department comparison widgets
- Real-time notifications widget
- Leave calendar widget
- Upcoming evaluations widget
- Manager metrics (team attendance, leave balance)

*Dashboard Files*: `src/pages/Dashboard.tsx`, `src/components/dashboard/`

---

## PROJECT STRUCTURE

### Frontend Structure
```
/src
├── pages/
│   ├── Dashboard.tsx              ✅ Employee & payroll overview
│   ├── Login.tsx                  ✅ Authentication
│   ├── Employees.tsx              ✅ Employee listing & management
│   ├── Attendance.tsx             ✅ Attendance tracking
│   ├── Accounting.tsx             ✅ Payroll management (MAIN PAYROLL PAGE)
│   ├── Performance.tsx            ✅ Evaluation forms & responses
│   ├── Payroll.tsx                ⚠️  OLD (deprecated - now using Accounting.tsx)
│   ├── ArchivedEmployees.tsx      ✅ Archived employees view
│   ├── NotFound.tsx               ✅ 404 page
│   └── Index.tsx                  (landing page redirect)
│
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx    (sidebar + header)
│   │   └── NavLink.tsx            (navigation link)
│   │
│   ├── accounting/                (PAYROLL UI COMPONENTS)
│   │   ├── PayslipTable.tsx       ✅ List of payslips
│   │   ├── PayslipDrawer.tsx      ✅ 4-tab detail view
│   │   ├── PayrollSummaryTab.tsx  ✅ Summary + remittances
│   │   └── AuditTrailTab.tsx      ✅ Immutable log
│   │
│   ├── employees/
│   │   ├── EmployeeTable.tsx
│   │   ├── EmployeeForm.tsx
│   │   ├── EmployeeDetail.tsx
│   │   ├── NewHireForm.tsx        ✅ Multi-step onboarding
│   │   └── EmployeeAvatar.tsx
│   │
│   ├── attendance/
│   │   ├── AttendanceTable.tsx
│   │   ├── AttendanceForm.tsx
│   │   └── AttendanceCalendar.tsx
│   │
│   ├── performance/
│   │   ├── EvaluationForm.tsx
│   │   ├── EvaluationResponse.tsx
│   │   └── AnalyticsDashboard.tsx
│   │
│   ├── payroll/
│   │   ├── PayrollTable.tsx       (OLD - deprecated)
│   │   └── PayrollDrawer.tsx      (OLD - deprecated)
│   │
│   └── ui/                        (Shadcn components)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── calendar.tsx
│       └── ... (20+ UI components)
│
├── hooks/
│   ├── useAuth.ts                ✅ Authentication
│   ├── useAccounting.ts          ✅ Payroll data fetching (MAIN)
│   ├── usePayroll.ts             ❌ OLD (deprecated - use useAccounting)
│   ├── useEmployees.ts           ✅ Employee CRUD
│   ├── useAttendance.ts          ✅ Attendance operations
│   ├── useEvaluation.ts          ✅ Evaluation forms/responses
│   ├── usePerformance.ts         ✅ Performance analytics
│   ├── api.ts                    ✅ Centralized API fetch wrapper
│   ├── use-toast.ts              ✅ Toast notifications
│   └── use-mobile.tsx            ✅ Mobile detection
│
├── types/
│   ├── attendance.ts             ✅ Attendance TypeScript types
│   ├── employee.ts               ✅ Employee TypeScript types
│   ├── payroll.ts                ❌ OLD (data types - needs migration to accounting)
│   ├── evaluation.ts             ✅ Evaluation types
│   └── performance.ts            ✅ Performance types
│
├── lib/
│   └── utils.ts                  ✅ Utility functions (cn, date formatting, etc.)
│
├── data/
│   ├── mockAttendance.ts         (Mock data for testing)
│   └── mockEmployees.ts          (Mock data for testing)
│
├── test/
│   ├── setup.ts                  (Vitest setup)
│   └── example.test.ts           (Example tests)
│
├── App.tsx                       ✅ Main routing & authentication
├── App.css                       ✅ Global styles
├── main.tsx                      ✅ App entrypoint
├── index.css                     ✅ Tailwind imports
└── vite-env.d.ts                 (Vite types)

Config Files:
├── vite.config.ts               ✅ Vite configuration
├── tsconfig.json                ✅ TypeScript configuration
├── tsconfig.app.json            ✅ App TypeScript config
├── tsconfig.node.json           ✅ Node TypeScript config
├── tailwind.config.ts           ✅ Tailwind CSS config
├── postcss.config.js            ✅ PostCSS config
├── eslint.config.js             ✅ ESLint config
├── vitest.config.ts             ✅ Testing config
├── components.json              ✅ Shadcn component registry
├── package.json                 ✅ Package dependencies
├── bun.lockb                    (Bun lock file)
└── index.html                   ✅ HTML entry point
```

### Backend Structure
```
/backend
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php         ✅ Login/logout
│   │   │   ├── EmployeeController.php     ✅ CRUD operations
│   │   │   ├── AttendanceController.php   ✅ Attendance tracking
│   │   │   ├── PayslipController.php      ✅ Payslip queries
│   │   │   ├── PayrollController.php      ⚠️  OLD (use PayslipController)
│   │   │   ├── NewHireController.php      ✅ New hire onboarding
│   │   │   ├── EvaluationFormController.php ✅ Forms CRUD
│   │   │   ├── EvaluationQuestionController.php ✅ Questions
│   │   │   ├── EvaluationAssignmentController.php ✅ Assignments
│   │   │   ├── EvaluationResponseController.php ✅ Responses
│   │   │   └── PayslipPdfController.php   ✅ PDF generation
│   │   │
│   │   └── Middleware/
│   │       └── (Sanctum auth middleware)
│   │
│   ├── Models/
│   │   ├── User.php                  ✅ User authentication
│   │   ├── Employee.php              ✅ Employee records (40+ fields)
│   │   ├── Attendance.php            ✅ Daily attendance
│   │   ├── LeaveRequest.php          ✅ Leave tracking
│   │   ├── Payslip.php               ✅ Payslip master records
│   │   ├── PayslipLineItem.php       ✅ Earnings/deductions breakdown
│   │   ├── PayrollPeriod.php         ✅ Pay period tracking
│   │   ├── EmployeeAllowance.php     ✅ Recurring allowances
│   │   ├── EmployeeLoan.php          ✅ Loan tracking
│   │   ├── PayrollAuditLog.php       ✅ IMMUTABLE action log
│   │   ├── NewHire.php               ✅ Onboarding records
│   │   ├── EvaluationForm.php        ✅ Form templates
│   │   ├── EvaluationSection.php     ✅ Form sections
│   │   ├── EvaluationQuestion.php    ✅ Individual questions
│   │   ├── EvaluationLikertOption.php ✅ Likert scale options
│   │   ├── EvaluationAssignment.php  ✅ Who evaluates whom
│   │   ├── EvaluationResponse.php    ✅ Survey responses
│   │   ├── KPI.php                   ✅ Key performance indicators
│   │   └── Goal.php                  ✅ Employee goals
│   │
│   ├── Services/
│   │   ├── PayslipService.php        ✅ CORE PAYROLL COMPUTATIONS
│   │   │   └── computeAll($periodId)    (Auto-calc earnings/deductions)
│   │   ├── PayslipPDF.php            ✅ PDF generation service
│   │   ├── PayslipMail.php           ✅ Email distribution
│   │   └── (Other services as needed)
│   │
│   └── Providers/
│       └── (Service providers)
│
├── database/
│   ├── migrations/
│   │   ├── 2026_02_07_033353_create_employees_table
│   │   ├── 2026_02_10_create_attendances_table
│   │   ├── 2026_02_10_create_leave_requests_table
│   │   ├── 2026_02_10_create_payrolls_table (OLD)
│   │   ├── 2026_03_13_142810_create_sessions_table
│   │   ├── 2026_03_13_155712_users_migration
│   │   ├── 2026_03_14_142708_create_personal_access_tokens_table
│   │   ├── 2026_03_16_091554_create_cache_table
│   │   ├── 2026_03_21_065705_create_kpis_table
│   │   ├── 2026_03_21_065715_create_goals_table
│   │   ├── 2026_03_22_082451_create_evaluation_forms_table
│   │   ├── 2026_03_22_082506_create_evaluation_sections_table
│   │   ├── 2026_03_22_082530_create_evaluation_likert_options_table ✅ FIXED
│   │   ├── 2026_03_22_085133_create_evaluation_questions_table ✅ FIXED
│   │   ├── 2026_03_22_085145_create_evaluation_assignments_table
│   │   ├── 2026_03_22_085159_create_evaluation_responses_table
│   │   ├── 2026_03_23_113128_create_new_hires_table
│   │   ├── 2026_03_23_114029_create_payroll_periods_table
│   │   ├── 2026_03_23_114039_create_employee_allowances_table
│   │   ├── 2026_03_23_114051_create_employee_loans_table
│   │   ├── 2026_03_23_114101_create_payslips_table (44 columns!)
│   │   ├── 2026_03_23_114111_create_payslip_line_items_table
│   │   └── 2026_03_23_114122_create_payroll_audit_logs_table
│   │
│   └── seeders/
│       ├── DatabaseSeeder.php       ✅ Master seeder
│       ├── AdminSeeder.php          ✅ Default admin/HR/accountant users
│       ├── EmployeeSeeder.php       ✅ 10+ realistic employees
│       └── NewHireSeeder.php        ✅ FIXED - 5 onboarding records
│
├── routes/
│   ├── api.php                  ✅ All API endpoints
│   ├── web.php                  (Not used - API-only)
│   └── console.php
│
├── config/
│   ├── app.php                  ✅ App configuration
│   ├── database.php             ✅ SQLite database config (emssss)
│   ├── auth.php                 ✅ Authentication config (Sanctum)
│   ├── mail.php                 ✅ Mail configuration
│   ├── cors.php                 ✅ CORS settings (allow localhost:5173)
│   └── ... (other config files)
│
├── tests/
│   └── (Unit/Feature tests)
│
├── storage/
│   ├── app/                     (File uploads, PDFs)
│   ├── logs/                    (Application logs)
│   └── framework/               (Cache, views)
│
├── public/
│   └── index.php               (API entry point)
│
├── bootstrap/
│   ├── app.php                 (App bootstrapping)
│   └── providers.php           (Service providers)
│
├── vendor/
│   └── (Composer dependencies)
│
├── .env                        ✅ Environment variables (copied from .env.example)
├── .env.example                ✅ Template with defaults
├── artisan                     (Artisan CLI)
├── composer.json               ✅ PHP dependencies
├── composer.lock               ✅ Locked versions
├── phpunit.xml                 ✅ Testing configuration
├── README.md                   ✅ Setup instructions
└── emssss                      ✅ SQLite database file (DO NOT UPLOAD!)
```

### Documentation Files
```
/docs
├── LARAVEL_SPECS.md             ✅ Backend API specifications
├── ATTENDANCE_SYSTEM.md         ✅ Attendance system design
├── PAYROLL_SYSTEM.md            ✅ Payroll system design (OLD - superseded)
├── PAYROLL_ACCOUNTING_SYSTEM.md ✅ Updated payroll documentation
├── PAYROLL_FLOW_GUIDE.md        ✅ Complete workflow with diagrams
└── README.md                    (Main project overview)
```

---

## DATABASE SCHEMA

### Core Tables (30+ tables)

#### Users & Authentication
- **users** (5 roles: Admin, Accountant, HR, Manager, Employee)
- **personal_access_tokens** (Bearer tokens for API)
- **sessions** (Browser sessions)

#### Employee Management
- **employees** (40+ fields: personal, government IDs, banking, employment)
- **new_hires** (Onboarding tracking)

#### Attendance & Leave
- **attendances** (Daily check-in/out)
- **leave_requests** (Leave tracking with approval)

#### Payroll ⭐ (CORE)
- **payroll_periods** (Semi-monthly periods)
- **payslips** (44 columns! All calculations)
- **payslip_line_items** (Detailed earnings/deductions breakdown)
- **employee_allowances** (Recurring allowances per employee)
- **employee_loans** (Loan tracking with monthly amortization)
- **payroll_audit_logs** (IMMUTABLE action log)

#### Performance & Goals
- **evaluation_forms** (Form templates)
- **evaluation_sections** (Form sections)
- **evaluation_questions** (Individual questions)
- **evaluation_likert_options** (Likert scale 1-5)
- **evaluation_assignments** (Who evaluates whom)
- **evaluation_responses** (Survey responses/answers)
- **kpis** (Key performance indicators)
- **goals** (Employee goals/objectives)

### Table Relationships
```
User (1) ──→ (many) Employee
User (1) ──→ (many) Payslip (as computed_by, approved_by)
User (1) ──→ (many) NewHire (as created_by)

Employee (1) ──→ (many) Attendance
Employee (1) ──→ (many) LeaveRequest
Employee (1) ──→ (many) Payslip
Employee (1) ──→ (many) EmployeeAllowance
Employee (1) ──→ (many) EmployeeLoan
Employee (1) ──→ (many) EvaluationAssignment (both directions)
Employee (1) ──→ (many) EvaluationResponse
Employee (1) ← (1) NewHire (via transferred_at)

PayrollPeriod (1) ──→ (many) Payslip

Payslip (1) ──→ (many) PayslipLineItem
```

---

## FILE NAVIGATION GUIDE

### When working on a feature, find files here:

**Frontend - Add new page**:
`src/pages/YourFeature.tsx`

**Frontend - Add new component**:
`src/components/[feature-folder]/YourComponent.tsx`

**Frontend - Add data hook**:
`src/hooks/useYourFeature.ts`

**Frontend - Add TypeScript types**:
`src/types/yourfeature.ts`

**Backend - Add API endpoint**:
`backend/app/Http/Controllers/YourController.php` + add route in `backend/routes/api.php`

**Backend - Add data model**:
`backend/app/Models/YourModel.php`

**Backend - Add business logic**:
`backend/app/Services/YourService.php`

**Backend - Add database table**:
`backend/database/migrations/YYYY_MM_DD_HHMMSS_create_table_name_table.php`

**Backend - Seed test data**:
`backend/database/seeders/YourSeeder.php`

**Update API endpoints list**:
`docs/LARAVEL_SPECS.md`

**Update system documentation**:
`docs/` folder

---

## HOW TO RUN & SETUP

### Initial Setup

1. **Clone Repository**
```bash
git clone <repo-url>
cd hr-harmony-suite
```

2. **Frontend Setup**
```bash
npm install      # or: yarn install
npm run dev      # Starts on http://localhost:5173
```

3. **Backend Setup**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --force   # Reset database
php artisan db:seed                 # Seed with seeded data
php artisan serve                   # Starts on http://localhost:8000
```

4. **Access System**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Default Admin: admin@bluelotus.com / Admin@1234

### Database Operations

```bash
# Create migration
php artisan make:migration create_table_name

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Reset database (WIPES ALL DATA)
php artisan migrate:fresh
php artisan migrate:fresh --force

# Seed database with test data
php artisan db:seed
php artisan db:seed --class=EmployeeSeeder

# Create seeder
php artisan make:seeder YourSeeder
```

### Running Tests

```bash
# Frontend tests (Vitest)
npm run test

# Backend tests (PHPUnit)
cd backend
php artisan test
```

---

## KEY INTEGRATION POINTS

### 1. Frontend → Backend Communication

**Authentication**:
```typescript
// Frontend: Login
const response = await fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await response.json();
localStorage.setItem('auth_token', token);

// All subsequent requests include token
fetch('http://localhost:8000/api/employees', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Data Fetching Hook Pattern**:
```typescript
// useAccounting.ts fetches payroll data
const { periods, payslips, summary, isLoading, fetchPeriods, computeAll } = useAccounting();

// Calls backend endpoints:
// GET /api/payroll-periods
// GET /api/payslips?period_id=X
// POST /api/payroll-periods/{id}/compute
// etc.
```

### 2. Payroll Computation Flow

```
Frontend: Click "Compute All"
  ↓
Frontend sends: POST /api/payroll-periods/{id}/compute
  ↓
Backend: PayslipController::computeAll($periodId)
  ↓
Backend: PayslipService::computeAll($periodId)
  ↓
For each active employee:
  - Fetch salary + allowances + loans
  - PayslipService::compute(employee, period)
  - Calculate earnings (basic + overtime + allowances + bonuses)
  - Calculate deductions (SSS + PhilHealth + PagIBIG + BIR + loans)
  - Calculate net pay
  - Create Payslip record (44 columns)
  - Log action in PayrollAuditLog
  ↓
Update PayrollPeriod status → "computed"
Return success response with count of created payslips
  ↓
Frontend: Toast notification + refresh view
```

### 3. Email Distribution

```
Frontend: Click "Bulk Email" or "Send Email"
  ↓
POST /api/payslips/{id}/send-email or /api/payroll-periods/{id}/bulk-email
  ↓
Backend: PayslipPdfController::sendEmail()
  ↓
Generate PDF via PayslipPDF service
  ↓
Send via Mail::send(new PayslipMail($payslip))
  ↓
PayslipMail mailable:
  - To: employee.email
  - Subject: "Your [Month] Payslip - Blue Lotus"
  - Attach PDF
  - Template: views/emails/payslip.blade.php
  ↓
Log action in PayrollAuditLog: action="email_sent"
  ↓
Return success response
```

### 4. Database Relationships in Code

```php
// Get employee with all payslips
$employee = Employee::with('payslips')->find($id);

// Get payslip with audit trail
$payslip = Payslip::with('auditLogs')->find($id);

// Get payroll period with all payslips
$period = PayrollPeriod::with('payslips')->find($id);

// Get payslip line items
$lineItems = $payslip->lineItems;      // All earnings + deductions
$earnings = $payslip->earnings();      // Only earnings
$deductions = $payslip->deductions();  // Only deductions
```

---

## REMAINING WORK SUMMARY

### High Priority (Block Users)
1. **Leave Balance Accrual** - Employees need to see leave balance
2. **Overtime Management** - Required for accurate payroll
3. **Holiday Calendar** - Affects attendance & deductions

### Medium Priority (Nice-to-Have)
1. **Payroll Analytics** - Charts & trends
2. **Salary Revision Tracking** - Historical records
3. **Advanced Filtering** - Better data discovery

### Low Priority (Future)
1. **Mobile UI** - Responsive design enhancements
2. **Shift Management** - Hotel operates multiple shifts
3. **Training Module** - Certification tracking

---

## IMPORTANT NOTES FOR NEXT DEVELOPER

### ✅ Do's
- ✅ Always add migrations for new database fields
- ✅ Use transactions for multi-step operations (payroll compute)
- ✅ Log all user actions in PayrollAuditLog (immutable)
- ✅ Test with real employee data before deploying
- ✅ Update documentation when adding features
- ✅ Use TypeScript types in frontend (no `any` types)
- ✅ Use Laravel validation/authorization policies

### ❌ Don'ts
- ❌ Don't modify payroll_audit_logs (immutable by design)
- ❌ Don't change payslip calculations without testing
- ❌ Don't hardcode dates (use Carbon or Date.now())
- ❌ Don't forget to add Bearer token in API requests
- ❌ Don't update completed payslips (create new ones)
- ❌ Don't expose database errors to frontend

### 🔐 Security Reminders
- Authentication: All routes protected by Sanctum middleware
- Authorization: Check `canApproveLeave()`, `canManagePayroll()` in hooks
- Data Validation: Both frontend (TypeScript) + backend (Laravel validation)
- CORS: Configured in `backend/config/cors.php` - allow `http://localhost:5173`
- Audit Trail: All payroll actions logged (who, what, when)

### 📱 Browser Compatibility
- ✅ Chrome 100+
- ✅ Firefox 100+
- ✅ Safari 15+
- ✅ Edge 100+

### 🔧 Common Debugging

**"CORS error when fetching from frontend"**:
- Check `backend/config/cors.php`
- Ensure `http://localhost:5173` is in allowed origins
- Restart backend server

**"401 Unauthorized on API requests"**:
- Check token in localStorage
- Verify token is valid (not expired)
- Ensure Authorization header format: `Bearer {token}`

**"Payroll computation returns error"**:
- Check PayslipService.php for employee data validation
- Verify employee has valid salary, department assignment
- Check database for orphaned records

**"PDF generation fails"**:
- Check `storage/app/` folder exists and is writable
- Verify PayslipPDF template exists at correct path
- Check Laravel logs: `storage/logs/laravel.log`

---

## CONTACT & HANDOFF

When handing off to next developer:
1. Share this PRD document
2. Run `php artisan migrate:fresh && php artisan db:seed` to reset database
3. Run `npm run dev` and `php artisan serve` to verify system works
4. Review PAYROLL_FLOW_GUIDE.md for understanding payroll logic
5. Check LARAVEL_SPECS.md for all API endpoints
6. Ask questions about payroll calculations if unclear

**This system is 75% complete and fully functional for payroll operations.**

