# 📊 Accounting & Payroll System Flow

## Complete End-to-End Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PAYROLL ACCOUNTING SYSTEM                          │
│                   Blue Lotus Hotel - Complete Flow Guide                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FULL WORKFLOW (5 Steps)

### **STEP 1: CREATE A PAYROLL PERIOD** 📅
**Where**: Accounting page, top-right button
**Action**: Click "+ New Period"

```
┌─────────────────────────────────┐
│   Click "New Period" Button      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ System Auto-Generates:                                          │
│ • Period Label: "March 16-31, 2026" (next semi-monthly period) │
│ • Start Date: March 16                                          │
│ • End Date: March 31                                            │
│ • Status: "open" (gray badge)                                   │
│ • Period ID: Stored in database (payroll_periods table)        │
└─────────────────────────────────────────────────────────────────┘
```

**Database Result**: 
- New record in `payroll_periods` table
- `status = "open"`

---

### **STEP 2: COMPUTE PAYROLL** 🧮
**Where**: Accounting page, top-right button
**Action**: Click "Compute All"

```
┌────────────────────────────────────┐
│  Click "Compute All" Button        │
└────────────┬──────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  System Runs PayslipService::computeAll($periodId)                       │
│                                                                           │
│  FOR EACH ACTIVE EMPLOYEE:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ EARNINGS CALCULATION:                                              ││
│  │ Basic Pay        = Employee's basic_salary                         ││
│  │ Overtime Pay     = overtime_hours × hourly_rate                    ││
│  │ Transport Allow  = EmployeeAllowance (if active for period)        ││
│  │ Meal Allow       = EmployeeAllowance (if active for period)        ││
│  │ Other Allow      = EmployeeAllowance (if active for period)        ││
│  │ Bonuses          = Manually added bonuses                          ││
│  │ 13th Month       = Annual salary / 12                              ││
│  │ ─────────────────────────────────────────────────────────────────  ││
│  │ GROSS PAY        = Sum of all earnings ✓                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ DEDUCTIONS CALCULATION:                                            ││
│  │ Late Deductions         = days_late × deduction_per_day            ││
│  │ Absent Deductions       = days_absent × deduction_per_day          ││
│  │ Unpaid Leave Deductions = days_unpaid × deduction_per_day          ││
│  │ SSS Employee (3.63%)    = Gross × 3.63%                           ││
│  │ PhilHealth (3%)         = Gross × 3%                              ││
│  │ PagIBIG (1-2%)          = Gross × 1-2% (based on earnings range)  ││
│  │ BIR Withholding         = Philippine tax table calculation         ││
│  │ SSS Loan Deduction      = From EmployeeLoan monthly amort         ││
│  │ PagIBIG Loan Deduction  = From EmployeeLoan monthly amort         ││
│  │ Company Loan Deduction  = From EmployeeLoan monthly amort         ││
│  │ Other Deductions        = Custom deductions                        ││
│  │ ─────────────────────────────────────────────────────────────────  ││
│  │ TOTAL DEDUCTIONS        = Sum of all deductions ✓                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ PAYMENT CALCULATION:                                               ││
│  │ NET PAY = GROSS PAY - TOTAL DEDUCTIONS                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ EMPLOYER CONTRIBUTIONS (separate from deductions):                 ││
│  │ SSS Employer (13.78%)      = Gross × 13.78%                       ││
│  │ PhilHealth Employer (2.75%) = Gross × 2.75%                        ││
│  │ PagIBIG Employer (2%)       = Gross × 2%                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  CREATES: Payslip record with all calculated values                      │
│  UPDATES: Period status "open" → "computed"                             │
│  LOGS: Action in PayrollAuditLog (user, timestamp, action)              │
└──────────────────────────────────────────────────────────────────────────┘
```

**Database Results**:
- New record in `payslips` table for EACH employee (44 columns with all calculations)
- New record in `payslips_line_items` for detailed earnings breakdown
- New record in `payslips_line_items` for detailed deductions breakdown
- Update `payroll_periods` table: `status = "computed"`
- New record in `payroll_audit_logs`: action = "computed", performed_by = Admin, timestamp = now

**UI Updates**:
- ✅ Stat cards now show: Total Employees count, Total Gross, Total Net, Paid count
- ✅ Period status badge changes to "computed" (amber)
- ✅ Payslips table populates with all employees and their calculations

---

### **STEP 3: REVIEW & APPROVE** 👀
**Where**: Accounting page → Payslips tab
**Action**: Click "View" on any payslip row

```
┌──────────────────────────────────────────┐
│ Click "View" on Payslip Row              │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│              PayslipDrawer Opens (Right Side Panel)            │
│                                                                │
│ ┌──────────────────────────── TAB: DETAILS ──────────────────┐│
│ │ Employee: Maria Santos                                     ││
│ │ Department: Human Resources                               ││
│ │ Position: Manager                                          ││
│ │                                                            ││
│ │ EARNINGS:                                                  ││
│ │   Basic Pay:           ₱55,000.00                          ││
│ │   Overtime Pay:        ₱2,500.00                           ││
│ │   Transport Allow:     ₱  500.00                           ││
│ │   Meal Allow:          ₱  300.00                           ││
│ │   Other Allow:         ₱  200.00                           ││
│ │   Bonuses:             ₱  0.00                             ││
│ │   13th Month Pay:      ₱4,583.33                           ││
│ │ ─────────────────────────────────────────────────────       ││
│ │ GROSS PAY:             ₱63,083.33  ✓                       ││
│ │                                                            ││
│ │ EMPLOYER CONTRIB (FYI):                                    ││
│ │   SSS Employer:        ₱8,688.03                           ││
│ │   PhilHealth Employer: ₱1,734.79                           ││
│ │   PagIBIG Employer:    ₱1,261.67                           ││
│ │                                                            ││
│ │ DEDUCTIONS:                                                ││
│ │   Late Deduction:      ₱  500.00                           ││
│ │   SSS Employee:        ₱2,289.92                           ││
│ │   PhilHealth:          ₱1,892.50                           ││
│ │   PagIBIG:             ₱631.00                             ││
│ │   BIR Withholding:     ₱3,500.00                           ││
│ │ ─────────────────────────────────────────────────────       ││
│ │ TOTAL DEDUCTIONS:      ₱8,813.42  ✓                        ││
│ │                                                            ││
│ │ NET PAY:               ₱54,270.00  ✓                        ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌────────── TAB: BONUSES ──────────┐                         │
│ │ Add Bonus Form:                  │                         │
│ │  Amount: [       ]               │                         │
│ │  Description: [................] │                         │
│ │  [Add Bonus Button]              │                         │
│ │                                  │                         │
│ │ Applied Bonuses:                 │                         │
│ │ (none applied)                   │                         │
│ └──────────────────────────────────┘                         │
│                                                                │
│ ┌─────────── TAB: DEDUCTIONS ──────────────┐                 │
│ │ STATUTORY DEDUCTIONS:                    │                 │
│ │  • SSS Employee:        ₱2,289.92        │                 │
│ │  • PhilHealth:          ₱1,892.50        │                 │
│ │  • PagIBIG:             ₱   631.00       │                 │
│ │  • BIR Withholding:     ₱3,500.00        │                 │
│ │                                          │                 │
│ │ ATTENDANCE DEDUCTIONS:                   │                 │
│ │  • Late Deduction:      ₱   500.00       │                 │
│ │                                          │                 │
│ │ LOAN DEDUCTIONS:                         │                 │
│ │ (none)                                   │                 │
│ └──────────────────────────────────────────┘                 │
│                                                                │
│ ┌────────── TAB: ADJUSTMENTS ──────────────┐                 │
│ │ Add Adjustment Form:                     │                 │
│ │  Amount: [       ]                       │                 │
│ │  Description: [......................]  │                 │
│ │  Type: [Bonus / Deduction]               │                 │
│ │  [Add Adjustment Button]                 │                 │
│ │                                          │                 │
│ │ Adjustment History:                      │                 │
│ │ (none)                                   │                 │
│ └──────────────────────────────────────────┘                 │
│                                                                │
│ FOOTER ACTIONS:                                                │
│ [Approve] [Mark as Paid] [Send Email] [Download PDF]         │
└────────────────────────────────────────────────────────────────┘
```

**Optional**: Adjust bonuses/deductions in drawer if needed, then close

**Action**: Click "Approve" button (in drawer footer)

```
┌──────────────────────┐
│ Click "Approve"      │
└────────────┬─────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Update Payslip:                              │
│ • status: "computed" → "approved"            │
│ • approved_by: Current user ID               │
│ • approved_at: Current timestamp             │
│                                              │
│ Log in PayrollAuditLog:                       │
│ • action: "approved"                         │
│ • entity_type: "payslip"                     │
│ • entity_id: Payslip ID                      │
│ • performed_by: Current user ID              │
│ • timestamp: now                             │
└──────────────────────────────────────────────┘
```

**Repeat** for all employees (or approve all at once via batch approvals)

**Database Result**:
- Update `payslips` table: `status = "approved"`, `approved_by = user_id`, `approved_at = now`
- New record in `payroll_audit_logs`: action = "approved"

---

### **STEP 4: MARK AS PAID** 💰
**Where**: Accounting page → Payslips tab or Drawer
**Action**: Click "Mark as Paid" button

```
┌──────────────────────┐
│ Click "Mark as Paid" │
└────────────┬─────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ Update Payslip:                              │
│ • status: "approved" → "paid"                │
│ • (processed_by: Could track here optional)  │
│                                              │
│ Log in PayrollAuditLog:                       │
│ • action: "paid"                             │
│ • entity_type: "payslip"                     │
│ • performed_by: Current user ID              │
│ • timestamp: now                             │
└──────────────────────────────────────────────┘
```

**Database Result**:
- Update `payslips` table: `status = "paid"`
- New record in `payroll_audit_logs`: action = "paid"
- Stat card updates: "Paid" count increases

---

### **STEP 5: EMAIL & AUDIT** 📧📋
**Where**: Accounting page → Multiple locations

#### **Option A: Send Individual Email**
```
In Payslips Tab → Click "Send Email" for one payslip
     OR
In Drawer → Click "Send Email"
     ↓
Generates PDF of payslip
Sends email to employee.email
Subject: "Your March 16-31, 2026 Payslip - Blue Lotus Hotel"
Attachment: Payslip PDF
     ↓
Log recorded in PayrollAuditLog: action = "email_sent"
```

#### **Option B: Bulk Email All Approved**
```
Accounting page → Click "Bulk Email" button
     ↓
Sends TO ALL payslips with status = "approved"
Each employee gets individual PDF attached
     ↓
UI shows: "45 emails sent. 0 failed."
Each payslip logged with action = "email_sent"
```

#### **Option C: Download Summary PDF**
```
Accounting page → Click "Summary PDF" button
     ↓
Downloads audit-ready PDF containing:
• Period info (dates, status)
• All employees with gross/net totals
• Government remittance summary (SSS, PhilHealth, PagIBIG, BIR)
• Employer contributions
• Audit trail of all actions
```

#### **View Audit Trail**
```
Accounting page → Click "Audit Trail" tab
     ↓
Shows immutable log of ALL actions:

Timestamp           | Action      | Entity      | User        | Status
────────────────────────────────────────────────────────────────────────
2026-03-23 10:15:00 | computed    | Payslip #45  | System Admin | ✓
2026-03-23 10:15:00 | computed    | Payslip #44  | System Admin | ✓
2026-03-23 10:30:00 | approved    | Payslip #45  | System Admin | ✓
2026-03-23 10:30:00 | approved    | Payslip #44  | System Admin | ✓
2026-03-23 11:00:00 | email_sent  | Payslip #45  | System Admin | ✓
2026-03-23 11:00:00 | email_sent  | Payslip #44  | System Admin | ✓
2026-03-23 11:15:00 | paid        | Payslip #45  | System Admin | ✓
2026-03-23 11:15:00 | paid        | Payslip #44  | System Admin | ✓
```

---

## 📊 DATABASE TABLES INVOLVED

### **payroll_periods**
```sql
id | label               | period_start | period_end | status   | computed_by | approved_by | created_at
───┼─────────────────────┼──────────────┼────────────┼──────────┼─────────────┼─────────────┼──────────
 1 | March 1-15, 2026    | 2026-03-01   | 2026-03-15 | paid     | 1           | 1           | ...
 2 | March 16-31, 2026   | 2026-03-16   | 2026-03-31 | computed | 1           | NULL        | ...
```

### **payslips** (One per employee per period)
```sql
id  | payroll_period_id | employee_id | gross_pay  | total_deductions | net_pay    | status   | computed_by
────┼───────────────────┼─────────────┼────────────┼──────────────────┼────────────┼──────────┼─────────────
 45 | 2                 | 1           | 63,083.33  | 8,813.42         | 54,270.00  | paid     | 1
 46 | 2                 | 2           | 45,000.00  | 6,523.50         | 38,476.50  | approved | 1
 47 | 2                 | 3           | 52,500.00  | 7,625.00         | 44,875.00  | computed | 1
```

### **payroll_audit_logs** (Immutable action log)
```sql
id | action      | entity_type | entity_id | performed_by | details             | created_at
───┼─────────────┼─────────────┼───────────┼──────────────┼─────────────────────┼──────────────
 1 | computed    | payslip     | 45        | 1            | Auto-calculated     | 2026-03-23...
 2 | approved    | payslip     | 45        | 1            | Manual approval      | 2026-03-23...
 3 | email_sent  | payslip     | 45        | 1            | Sent to employee    | 2026-03-23...
 4 | paid        | payslip     | 45        | 1            | Marked as paid      | 2026-03-23...
```

---

## 🔐 Access Control

| Role        | Can Access | Can Do |
|-------------|-----------|--------|
| Admin       | ✅ YES    | All operations (create periods, compute, approve, pay, email) |
| Accountant  | ✅ YES    | All operations (create periods, compute, approve, pay, email) |
| HR          | ❌ NO     | Cannot access Accounting view |
| Manager     | ❌ NO     | Cannot access Accounting view |
| Employee    | ❌ NO     | Cannot access Accounting view |

---

## 📋 Quick Reference: Payroll Period States

```
┌──────────────────────────────────────────────────────────────┐
│                   PAYROLL PERIOD WORKFLOW                    │
└──────────────────────────────────────────────────────────────┘

Step 1: Create Period
   └─→ status: OPEN (gray badge)
       • Period created but no payslips yet
       • Can compute payroll

Step 2: Compute Payroll  
   └─→ status: COMPUTED (amber badge)
       • All payslips calculated & created
       • Ready for review & approval
       • Can approve individual payslips

Step 3: Approve Payslips (one by one)
   └─→ Individual payslip status: APPROVED (blue badge)
       • Payslip reviewed & approved
       • Ready to mark as paid or email

Step 4: Mark as Paid
   └─→ Individual payslip status: PAID (green badge)
       • Payment processed
       • Can download PDF or resend email

Step 5: Archive/Complete (Optional)
   └─→ Period status: PAID (emerald badge)
       • All payslips paid
       • Period complete & archived
```

---

## 💡 Example: End-to-End Scenario

**Today: March 23, 2026**

1. **10:00 AM** - Maria (Admin) clicks "+ New Period"
   - System creates "March 16-31, 2026" period
   - Status: OPEN

2. **10:15 AM** - Maria clicks "Compute All"
   - System calculates all 45 employees' payslips
   - All earnings/deductions calculated
   - Status: COMPUTED
   
3. **10:30 AM - 11:00 AM** - Maria reviews each payslip in drawer
   - Adjusts any bonuses/deductions if needed
   - Click "Approve" on each → Status: APPROVED

4. **11:15 AM** - Maria clicks "Bulk Email"
   - Sends 45 payslips via email with PDFs
   - Employees receive payslips in inbox

5. **11:30 AM** - Maria clicks "Mark as Paid" on all
   - All payslips → Status: PAID
   - System records all actions in audit trail

6. **4:00 PM** - Finance director clicks "Summary PDF"
   - Downloads complete audit report
   - Shows all calculations, remittances, actions taken
   - Compliant for tax filing

✅ **Process Complete!** Payroll for March 16-31, 2026 is fully processed and archived.

