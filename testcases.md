# Blue Lotus Hotel HR System — Test Cases

**Version:** 1.0  
**Date:** March 2026  
**Coverage:** All subsystems, all roles  
**Base URL:** `http://localhost:8000/api`  
**Frontend:** `http://localhost:5173`

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bluelotus.com | Admin@1234 |
| Accountant | accountant@bluelotus.com | Admin@1234 |
| HR Manager | hr@bluelotus.com | Admin@1234 |
| Manager | manager@bluelotus.com | Admin@1234 |
| Employee | employee@bluelotus.com | Admin@1234 |

---

## 1. Authentication

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| AUTH-01 | Successful login | POST `/api/login` with valid credentials | Returns `token` + user object with role |
| AUTH-02 | Failed login — wrong password | POST `/api/login` with wrong password | 401 Unauthorized |
| AUTH-03 | Failed login — unknown email | POST `/api/login` with unknown email | 401 Unauthorized |
| AUTH-04 | Logout | POST `/api/logout` with Bearer token | Token invalidated; subsequent requests return 401 |
| AUTH-05 | Access protected route without token | GET `/api/employees` with no Authorization header | 401 Unauthorized |
| AUTH-06 | Sidebar — Admin | Login as Admin | All nav items visible including Payroll, Recruitment, Salary history |
| AUTH-07 | Sidebar — Employee | Login as Employee | Only Dashboard, Attendance, Leave, Overtime visible |
| AUTH-08 | Sidebar — Accountant | Login as Accountant | Payroll, Reports visible; Employees, Recruitment hidden |

---

## 2. Employee Management

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| EMP-01 | Create employee | Admin: POST `/api/employees` with all required fields | 201; employee record created |
| EMP-02 | Create employee — missing required field | POST without `first_name` | 422 validation error |
| EMP-03 | List employees | GET `/api/employees` | Array of active employees |
| EMP-04 | Update employee | PATCH `/api/employees/{id}` with new `department` | Employee record updated |
| EMP-05 | Archive employee | POST `/api/employees/{id}/archive` | Employee `is_active = false`; hidden from main list |
| EMP-06 | View archived employees | GET `/api/employees?archived=true` or navigate to Archived Employees page | Shows only archived employees |
| EMP-07 | Upload employee photo | POST with `photo` file | Photo stored; URL returned |
| EMP-08 | Government ID fields | Set SSS, PhilHealth, PagIBIG, TIN | Fields saved; used by deduction guard on payslip compute |
| EMP-09 | New Hire tab — Admin only | Login as Admin; navigate to Employees → New Hires tab | Tab visible and shows new hire queue |
| EMP-10 | New Hire tab — non-Admin hidden | Login as HR Manager; navigate to Employees | New Hires tab not visible |
| EMP-11 | Assign training program to new hire | Admin: click "Set training" on a new hire; select program | `training_program` saved on new hire record |
| EMP-12 | Transfer new hire to employee | Admin: click "Transfer" on a new hire with status = complete | New employee record created; new hire status → transferred |
| EMP-13 | Transfer incomplete new hire | Click "Transfer" on a new hire with status = pending | Error: required fields missing |

---

## 3. Attendance

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| ATT-01 | Log attendance | POST `/api/attendance` with `employee_id`, `date`, `status` | Attendance record created |
| ATT-02 | Prevent duplicate | POST same `employee_id` + `date` twice | Second call updates (upsert); no duplicate |
| ATT-03 | Clock in | Employee: POST `/api/attendance/clock-in` | Check-in time recorded; status = present or late |
| ATT-04 | Clock in — late (after shift start + 5 min) | Clock in 10 mins after shift start | Status = late |
| ATT-05 | Clock in twice | Employee tries to clock in after already clocked in | 422: "Already clocked in today" |
| ATT-06 | Clock out | Employee: POST `/api/attendance/clock-out` | Check-out time recorded |
| ATT-07 | Clock out without clock in | POST `/api/attendance/clock-out` with no prior clock-in | 422: "Not clocked in yet" |
| ATT-08 | Today status — on leave | Employee with approved leave today calls `/api/attendance/today` | `is_on_leave: true`; clock-in button disabled on frontend |
| ATT-09 | Today status — holiday | Call `/api/attendance/today` on a holiday date | `is_holiday: true`, holiday name shown |
| ATT-10 | Excel import — valid file | Upload `.xlsx` with correct columns | Parsed rows shown; import creates records |
| ATT-11 | Excel import — missing columns | Upload `.xlsx` missing `employee_id` column | Rows flagged as errors; import blocked |
| ATT-12 | Excel import — duplicate rows | Import rows that already exist | Existing rows updated (upsert); skipped count incremented |
| ATT-13 | Calendar view | Navigate to Attendance page | Monthly calendar shows colour-coded status per day |
| ATT-14 | Filter by employee | Attendance list → filter by employee | Shows only selected employee's records |

---

## 4. Payroll / Accounting

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| PAY-01 | Create payroll period | POST `/api/payroll-periods` | New period with status = draft |
| PAY-02 | Compute payslips | POST `/api/payroll-periods/{id}/compute` | Payslips created for all active employees with correct SSS/PhilHealth/PagIBIG/BIR |
| PAY-03 | SSS deduction — employee missing SSS number | Compute period; employee has no `sss_number` | SSS deduction = 0; `has_warnings = true`; warning shown in UI |
| PAY-04 | Approve payslip | POST `/api/payslips/{id}/approve` | Status → approved |
| PAY-05 | Approve all (Accountant) | POST `/api/payroll-periods/{id}/approve-all` | All computed payslips → approved; period status → approved |
| PAY-06 | Mark as paid | POST `/api/payslips/{id}/mark-paid` | Status → paid |
| PAY-07 | Send payslip email | POST `/api/payslips/{id}/send-email` | Email sent with PDF attachment; audit log entry created |
| PAY-08 | Bulk email | POST `/api/payroll-periods/{id}/bulk-email` | All approved payslips emailed; `sent` count returned |
| PAY-09 | Inline edit — overtime | Admin: edit payslip row → change `overtime_amount` → Save | Net pay recalculated; status reset to computed; audit log created |
| PAY-10 | Inline edit — locked payslip | Admin tries to edit an approved payslip | Edit button shows "Locked"; no edit allowed |
| PAY-11 | Add bonus | POST `/api/payroll-periods/{id}/bonuses` | Bonus created with status = pending (HR) or approved (Admin) |
| PAY-12 | Approve bonus | POST `/api/payroll-bonuses/{id}/approve` | Status → approved; included in next compute |
| PAY-13 | Reject bonus | POST `/api/payroll-bonuses/{id}/reject` | Status → rejected; not included in payroll |
| PAY-14 | Deduction category — mandatory with gov ID | Create category with `required_id = sss_number`, `is_mandatory = true` | Applied only to employees with SSS number |
| PAY-15 | Audit trail — immutable | View Audit Trail tab | All actions listed; no edit/delete controls |
| PAY-16 | Accountant role — guided flow | Login as Accountant; open Accounting page | Sees 4-step flow: Select → Compute → Approve → Email |
| PAY-17 | Payslip PDF generation | POST `/api/payslips/{id}/pdf` | PDF downloaded with Blue Lotus branding |
| PAY-18 | Government remittance summary | View Summary tab | SSS, PhilHealth, PagIBIG, BIR totals displayed |

---

## 5. Recruitment

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REC-01 | Create job posting | POST `/api/job-postings` | Posting created with status = open |
| REC-02 | Close job posting | POST `/api/job-postings/{id}/close` | Status → closed; no new applications accepted |
| REC-03 | Add applicant | POST `/api/applicants` | Applicant created with status = applied |
| REC-04 | Move applicant forward | PATCH `/api/applicants/{id}/status` with `status = screening` | Status updated |
| REC-05 | Rate applicant | PATCH `/api/applicants/{id}/rate` with `rating = 4` | Rating saved; stars shown in pipeline card |
| REC-06 | Schedule interview | POST `/api/interviews` | Interview record created; applicant moved to interview stage |
| REC-07 | Record interview result — passed | PATCH `/api/interviews/{id}/result` with `result = passed` | Result saved; "→ New hire" button appears |
| REC-08 | Push passed interview to new hire | POST `/api/interviews/{id}/push-to-new-hire` | New hire record created; applicant status → hired |
| REC-09 | Make offer | POST `/api/job-offers` | Offer created with status = pending |
| REC-10 | Accept offer | POST `/api/job-offers/{id}/respond` with `status = accepted` | Offer status → accepted |
| REC-11 | Convert accepted offer to new hire | POST `/api/job-offers/{id}/convert` | New hire record created; job auto-closes if all slots filled |
| REC-12 | Reject applicant | PATCH status to rejected | Applicant card disappears from active pipeline |
| REC-13 | HR unified view | Login as HR Manager; navigate to Recruitment | Two-panel view: job list left, applicants right with schedule interview button |
| REC-14 | Pipeline kanban | Navigate to a job posting | 5 columns: Applied, Screening, Interview, Offer, Hired with correct counts |

---

## 6. Leave Management

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| LEA-01 | Submit leave request | POST `/api/leave-requests` | Request created with status = pending; balance not yet deducted |
| LEA-02 | Submit with insufficient balance | Request 5 days when only 2 days remaining | 422: "Insufficient balance" |
| LEA-03 | Approve leave | POST `/api/leave-requests/{id}/approve` | Status → approved; `used_days` incremented; attendance records stamped as on_leave |
| LEA-04 | Reject leave | POST `/api/leave-requests/{id}/reject` with reason | Status → rejected; reason stored |
| LEA-05 | Cancel pending request | POST `/api/leave-requests/{id}/cancel` | Status → cancelled; balance unchanged |
| LEA-06 | Cancel approved request | Attempt to cancel an approved leave | 422: Only pending requests can be cancelled |
| LEA-07 | View own balance | Employee navigates to Leave page | Balance cards show entitled, used, pending, remaining per leave type |
| LEA-08 | Monthly accrual | POST `/api/leave-balances/accrue` | Vacation and sick leave `entitled_days` each increase by 1.25; capped at 15 |
| LEA-09 | Accrual cap | Run accrual when `entitled_days = 15` | `entitled_days` stays at 15; not increased further |
| LEA-10 | Year carry-over | POST `/api/leave-balances/carry-over` | Unused days (max 5) appear as `carried_over` in next year's record |
| LEA-11 | Manual balance adjustment | HR: adjust +2 days with reason | `entitled_days` increases by 2; reason required |
| LEA-12 | Business day calculation | Submit leave Fri–Mon (3 calendar days) | `days_requested = 2` (weekends excluded) |
| LEA-13 | Proof required notice | Request sick leave for 4 days | Frontend shows "medical certificate required" warning |

---

## 7. Overtime

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| OT-01 | Submit overtime request | POST `/api/overtime-requests` | Request created with status = pending |
| OT-02 | Approve with full hours | POST `/api/overtime-requests/{id}/approve` with same hours as requested | Status → approved; `computed_amount` calculated at correct multiplier |
| OT-03 | Approve with reduced hours | Approve 2h when 4h was requested | `hours_approved = 2`; amount computed on approved hours only |
| OT-04 | Correct multiplier — regular OT | Overtime type = regular | Multiplier = 1.25× |
| OT-05 | Correct multiplier — rest day | Overtime type = rest_day | Multiplier = 1.30× |
| OT-06 | Correct multiplier — regular holiday | Overtime type = regular_holiday | Multiplier = 2.00× |
| OT-07 | Reject overtime | POST `/api/overtime-requests/{id}/reject` with reason | Status → rejected; reason stored |
| OT-08 | OT flows to payslip | After approval, run payslip compute for the period | `overtime_amount` on payslip includes approved OT; OT record status → paid |
| OT-09 | Stats summary | GET `/api/overtime-requests/stats` | Returns pending count, approved this month, total hours, total amount |

---

## 8. Holiday Calendar

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| HOL-01 | View holidays | GET `/api/holidays?year=2026` | Returns seeded PH national holidays + custom ones |
| HOL-02 | Add holiday | POST `/api/holidays` with name, date, type | Holiday created; appears on calendar |
| HOL-03 | Recurring holiday | Create with `is_recurring = true` | Holiday appears in every year; returned regardless of year filter |
| HOL-04 | Delete custom holiday | DELETE `/api/holidays/{id}` | Removed from calendar |
| HOL-05 | Pay multiplier — regular holiday | Create regular holiday | `pay_multiplier = 2.00` |
| HOL-06 | Holiday check API | GET `/api/holidays/check?date=2026-12-25` | `is_holiday: true`, `holiday_name: Christmas Day`, `pay_multiplier: 2.00` |
| HOL-07 | Click day to add | Admin clicks on a calendar day | Add holiday dialog opens with date pre-filled |
| HOL-08 | Non-Admin cannot add | Login as Employee; view holiday calendar | No "Add holiday" button visible |

---

## 9. Salary Revision History

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| SAL-01 | Create revision | POST `/api/salary-revisions` with `new_salary`, `reason`, `effective_date` | Revision created; `employees.basic_salary` updated immediately |
| SAL-02 | Change amount computed | Create revision from ₱25,000 → ₱28,000 | `change_amount = 3000`, `change_pct ≈ 12.0` |
| SAL-03 | Audit log created | Create revision | PayrollAuditLog entry with action = salary_revised |
| SAL-04 | Timeline view | Navigate to Salary history page | Revisions shown as timeline sorted by effective date descending |
| SAL-05 | Filter by employee | Select employee from dropdown | Only that employee's revisions shown |
| SAL-06 | Payslip uses updated salary | After revision, compute next payroll period | Basic salary on payslip reflects new amount |

---

## 10. Reports / PDF Suite

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| REP-01 | Payroll register PDF | Select period → Download PDF | PDF downloads; contains all employees, gross, net, deductions |
| REP-02 | Payroll register — no period selected | Click download without selecting period | Error: "Please select a payroll period" |
| REP-03 | Attendance report PDF | Select month/year → Download | PDF with present/absent/late counts per employee |
| REP-04 | Leave balance report PDF | Select year → Download | PDF with all leave types and remaining days per employee |
| REP-05 | BIR 2316 tax certificate — single employee | Select year + employee → Download | PDF with one certificate, correct TIN, gross, tax withheld |
| REP-06 | BIR 2316 — all employees | Select year, no employee filter → Download | PDF with one certificate per employee, paginated |
| REP-07 | Overtime summary PDF | Select month/year → Download | PDF with hours by type and computed amounts |
| REP-08 | Government remittance PDF | Select period → Download | PDF with SSS/PhilHealth/PagIBIG/BIR breakdown + per-employee table |
| REP-09 | RBAC — Employee cannot access reports | Login as Employee; navigate to `/reports` | Page not in nav; direct URL redirects or 403 |
| REP-10 | Accountant can access reports | Login as Accountant | Reports page visible; payroll register and remittance available |

---

## 11. Dashboard

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| DASH-01 | Stat cards load | Navigate to Dashboard | 6 cards show correct counts (employees, present today, pending leaves, OT, payroll, open jobs) |
| DASH-02 | Payroll trend chart | Dashboard loads | Line chart shows last 6 months gross + net pay |
| DASH-03 | Attendance doughnut | Dashboard loads | Doughnut shows today's present/absent/late/on-leave/holiday split |
| DASH-04 | Headcount by department | Dashboard loads | Bar chart with correct employee counts per department |
| DASH-05 | Stat card links | Click "Present today" card | Navigates to /attendance |
| DASH-06 | Zero state | Fresh database | Charts show empty/zero state gracefully without errors |

---

## 12. Notifications

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| NOT-01 | Leave request notification | Employee submits leave request | HR Manager receives notification of type leave_request |
| NOT-02 | Leave approved notification | HR approves leave | Employee receives leave_approved notification |
| NOT-03 | Overtime approved notification | Manager approves OT | Employee receives overtime_approved notification |
| NOT-04 | Payslip ready notification | Payslip computed | Employee receives payslip_ready notification |
| NOT-05 | Unread count badge | User has unread notifications | Bell icon shows count badge |
| NOT-06 | Mark single read | Click a notification | Notification marked read; blue dot disappears |
| NOT-07 | Mark all read | Click "Mark all read" | All notifications marked read; badge disappears |
| NOT-08 | Navigate on click | Click leave notification | Navigates to /leave page; panel closes |
| NOT-09 | Polling | Wait 60 seconds | New notifications appear without page refresh |

---

## 13. Shift Management

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| SHF-01 | Create shift template | POST `/api/shifts` with name, start_time, end_time | Shift created |
| SHF-02 | Night differential | Create shift with `differential_pct = 10` | Differential shown on card; used in payslip compute |
| SHF-03 | Assign shift to employee | POST `/api/employee-shifts` | Employee's `shift_name`, `shift_start`, `shift_end` updated |
| SHF-04 | Clock-in respects shift | Assign employee to night shift (22:00–06:00); employee clocks in at 22:10 | Status = present (within 5 min grace) |
| SHF-05 | One shift per employee | Assign second shift to same employee | Previous assignment overwritten (upsert) |

---

## 14. Year-End Tax

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| YET-01 | Year-end summary | GET `/api/year-end-tax?year=2026` | Returns per-employee gross, deductions, tax withheld, 13th month, balance |
| YET-02 | 13th month calculation | Employee with ₱300,000 total basic for the year | 13th month = ₱25,000 |
| YET-03 | Tax balance — underpaid | Annual tax due > total withheld | `tax_balance` positive; "Underpaid" badge in red |
| YET-04 | Tax balance — overpaid | Annual tax due < total withheld | `tax_balance` negative; "Overpaid" badge in blue |
| YET-05 | Process 13th month | POST `/api/year-end-tax/process-13th-month` | Audit logs created for each employee; count returned |
| YET-06 | Download individual BIR 2316 | Click PDF button on one employee row | PDF downloaded using existing tax_certificate report |
| YET-07 | Download all BIR 2316 | Click "Download all BIR 2316" | Single PDF with all employee certificates |
| YET-08 | BIR tax rate — below 250k | Employee with ₱200,000 taxable income | `annual_tax_due = 0` |
| YET-09 | BIR tax rate — 250k–400k bracket | Employee with ₱320,000 taxable | `annual_tax_due = (320000 - 250000) × 0.15 = 10,500` |

---

## 15. Training Module

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| TRN-01 | Add training course | POST `/api/training-courses` | Course created; appears in catalog |
| TRN-02 | Mandatory flag | Create course with `is_mandatory = true` | "Mandatory" badge shown on course card |
| TRN-03 | Assign training | POST `/api/training-assignments` | Assignment created with status = assigned |
| TRN-04 | Mark complete — no expiry | Complete a course with `validity_months = null` | `status = completed`, `expires_at = null` |
| TRN-05 | Mark complete — with validity | Complete a course with `validity_months = 12` | `expires_at = completed_date + 12 months` |
| TRN-06 | Auto-expire | Assignment past `expires_at` date | On next `/api/training-assignments` fetch, status auto-updated to expired |
| TRN-07 | Expiry alert | Assignment expiring within 30 days | Amber warning banner shown on Training page |
| TRN-08 | Filter by status | Click "Expired" filter tab | Only expired assignments shown |
| TRN-09 | Employee view | Login as Employee | Can see own assignments; no add/assign buttons |

---

## 16. Role-Based Access Control (RBAC) — Cross-cutting

| ID | Role | Can Do | Cannot Do |
|----|------|--------|-----------|
| RBAC-01 | Admin | Everything | — |
| RBAC-02 | Accountant | View/compute/approve/email payroll, download reports | Manage employees, approve leaves, access recruitment |
| RBAC-03 | HR Manager | Manage employees, approve leaves, manage recruitment, view/adjust leave balances, manage training | Access payroll figures, approve OT pay |
| RBAC-04 | Manager | Approve leaves for team, approve OT, view team attendance | Access payroll, manage employees, recruitment |
| RBAC-05 | Employee | View own payslips, file leave, file OT, clock in/out, view own training | View other employees' data, approve anything, access reports |
| RBAC-06 | Unauthorized route | Direct browser URL to `/payroll` as Employee | Page not rendered; no data returned from API (403) |
| RBAC-07 | API without token | Any protected endpoint | 401 Unauthorized |
| RBAC-08 | New Hire tab | Admin navigates to Employees | New Hires tab visible |
| RBAC-09 | New Hire tab | HR Manager navigates to Employees | New Hires tab NOT visible |

---

## Appendix — API Smoke Test Checklist

Run these sequentially on a fresh database after seeding:

```bash
# 1. Login
POST /api/login  →  save token

# 2. Seed
POST /api/leave-balances/seed
POST /api/leave-balances/accrue  (run once manually to give employees some balance)

# 3. Core flow
GET  /api/employees
POST /api/payroll-periods
POST /api/payroll-periods/{id}/compute
POST /api/payroll-periods/{id}/approve-all
POST /api/payroll-periods/{id}/bulk-email

# 4. Leave flow
POST /api/leave-requests
POST /api/leave-requests/{id}/approve

# 5. OT flow
POST /api/overtime-requests
POST /api/overtime-requests/{id}/approve

# 6. Reports
GET  /api/reports/generate?report_type=payroll_register&payroll_period_id={id}
GET  /api/reports/generate?report_type=attendance_report&year=2026&month=3
GET  /api/reports/generate?report_type=tax_certificate&year=2026

# 7. Dashboard
GET  /api/dashboard/stats
```

---

*Generated for Blue Lotus Hotel HR Management System · Confidential*