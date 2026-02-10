# Payroll Management System - Blue Lotus Hotel

## Overview

The Payroll Management System is a comprehensive solution for managing employee payroll in the Blue Lotus Hotel. It provides complete visibility into salary calculations, automatic deduction handling, and a multi-step approval workflow to ensure data integrity.

## Key Features

### 1. Dashboard View
- **Total Payroll Cost**: Shows the complete payroll expenditure for the selected month
- **Total Deductions**: Displays aggregate government contributions (SSS, PhilHealth, Pag-IBIG) and taxes
- **Pending Approvals**: Quick view of payrolls awaiting review
- **Paid Payrolls**: Count of successfully processed and paid payrolls

### 2. Payroll Table
Clean, searchable table with columns:
- **Employee**: Name and email for quick identification
- **Gross Pay**: Total earnings before deductions
- **Total Deductions**: Sum of all government and other deductions
- **Net Pay**: Take-home salary (Gross - Deductions)
- **Pay Period**: Date range for the payroll period
- **Status**: Current state of the payroll record
- **Actions**: Quick access to operations

### 3. Status Workflow
- **Draft**: Initial state when payroll is first calculated
- **Pending Approval**: Submitted for manager/accountant review
- **Approved**: Verified and authorized for processing
- **Processed**: Ready to be marked as paid
- **Paid**: Completed and funds transferred
- **Failed**: Error during processing (requires re-calculation)

### 4. Detailed View
Clicking an employee opens a drawer with:
- Complete earnings breakdown (base salary, overtime, bonuses, allowances)
- Individual deductions breakdown with Philippine law compliance
- Net salary calculation
- Calculation history and audit trail
- Action buttons for workflow progression

### 5. Safety Features
- **Review & Confirm**: Step-by-step approval process prevents accidental double-payments
- **Audit Trail**: Records who created, approved, and processed each payroll
- **Change Tracking**: Historical records ensure data integrity
- **Status Validation**: System prevents invalid status transitions

## Backend Architecture

### Database Schema

#### Payrolls Table
```sql
- id: Primary key
- employee_id: Foreign key to employees
- pay_period_start, pay_period_end: Date range
- base_salary: Employee's regular monthly salary
- overtime_pay: Calculated OT compensation
- bonuses: Additional bonuses
- allowances: COLA, transportation, etc.
- gross_salary: Sum of all earnings
- sss_contribution: Social Security System (11.45%)
- philhealth_contribution: PhilHealth (2.75%)
- pagibig_contribution: Pag-IBIG (1.5%, max ₱100)
- tax_withholding: Income tax (progressive, BIR compliant)
- other_deductions: Miscellaneous deductions
- total_deductions: Sum of all deductions
- net_salary: Gross - Deductions
- status: Workflow status
- calculation_breakdown: JSON with detailed breakdown
- created_by, approved_by: User audit trail
- approved_at, paid_at: Timestamps
```

### Models

#### Payroll Model (`App\Models\Payroll`)
- Relationships: `employee()`, `creator()`, `approver()`
- Scopes: `forMonth()`, `byStatus()`
- Methods: `canEdit()`, `canApprove()`, `canProcess()`, `recalculateNetSalary()`

### Services

#### PayrollService (`App\Services\PayrollService`)

**Main Methods:**
1. `calculatePayroll(Employee, periodStart, periodEnd)`: Calculates complete payroll
2. `getAttendanceData()`: Fetches attendance for the period
3. `getBaseSalary()`: Retrieves employee salary
4. `calculateOvertimePay()`: 1.5x rate for hours beyond 160/month
5. `calculateAllowances()`: Department-based allowances
6. `calculateDeductions()`: Calls individual deduction calculators
7. `getMonthlyPayrollSummary()`: Dashboard summary data

**Deduction Calculators (Philippine Law Compliant):**
- `calculateSSS()`: 11.45% of gross (max ₱1,755)
- `calculatePhilHealth()`: 2.75% of gross (min ₱150)
- `calculatePagIbig()`: 1.5% of gross (max ₱100)
- `calculateTax()`: Progressive income tax based on BIR rates

### Controller

#### PayrollController (`App\Http\Controllers\PayrollController`)

**Endpoints:**

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/payrolls` | List all payrolls with filters |
| GET | `/api/payrolls/{id}` | Get specific payroll |
| POST | `/api/payrolls/calculate` | Calculate new payroll |
| PUT | `/api/payrolls/{id}` | Update payroll (draft/pending only) |
| POST | `/api/payrolls/{id}/submit` | Submit for approval |
| POST | `/api/payrolls/{id}/approve` | Approve payroll |
| POST | `/api/payrolls/{id}/reject` | Reject with reason |
| POST | `/api/payrolls/{id}/process` | Process approved payroll |
| POST | `/api/payrolls/{id}/mark-paid` | Mark as paid |
| DELETE | `/api/payrolls/{id}` | Delete draft payroll |
| GET | `/api/payrolls/summary` | Get dashboard summary |

## Frontend Architecture

### Pages

#### Payroll.tsx
Main payroll management page with:
- Summary dashboard cards
- Month/year filters
- Payroll table with search and status filtering
- Create payroll dialog
- Approval/rejection workflows

### Components

#### PayrollTable.tsx
Displays payroll records with:
- Search by employee name/email
- Filter by status
- Responsive design
- Action dropdown menu
- Currency formatting (PHP)

#### PayrollDrawer.tsx
Side panel showing:
- Employee and pay period details
- Earnings breakdown
- Deductions breakdown
- Net salary summary
- Action buttons based on status

### Hooks

#### usePayroll.ts
Custom hook for payroll data management:
- `fetchPayrolls()`: Load payrolls for period
- `fetchSummary()`: Load dashboard summary
- `calculatePayroll()`: Trigger calculation
- `approvePayroll()`: Submit approval
- `rejectPayroll()`: Reject with reason
- `processPayroll()`: Process approved
- `markAsPaid()`: Mark as paid

### Types

#### payroll.ts
TypeScript interfaces for type safety:
- `Payroll`: Complete payroll record
- `PayrollSummary`: Dashboard summary data

## Role-Based Access Control

### Accountant
✅ Create payrolls
✅ Edit payrolls (draft/pending)
✅ Submit for approval
✅ View all payroll details
✅ Generate payslips
✅ Process approved payrolls

### Manager/Admin
✅ Approve payrolls
✅ Reject payrolls with reasons
✅ View payroll reports
✅ Access audit trails
❌ Cannot edit calculations

### Employee
✅ View own payslip
✅ Download payslip PDF
✅ View own salary breakdown
❌ Cannot access other employees' payroll
❌ Cannot approve/process

## Data Flow

```
1. INPUT: Select Employee + Pay Period
         ↓
2. FETCH: Attendance records for period
         ↓
3. CALCULATE: Gross salary (base + OT + bonuses + allowances)
             ↓
4. CALCULATE: Deductions (SSS, PhilHealth, Pag-IBIG, Tax)
             ↓
5. COMPUTE: Net Salary (Gross - Deductions)
           ↓
6. SAVE: Record in payrolls table (Draft status)
        ↓
7. SUBMIT: Move to Pending Approval
          ↓
8. APPROVAL: Manager/Accountant reviews and approves/rejects
            ↓
9. PROCESS: System processes the payroll
           ↓
10. PAYMENT: Mark as Paid + Trigger notifications/transfers
           ↓
11. ARCHIVE: Historical record maintained
```

## Philippine Tax Compliance

### SSS (Social Security System)
- Employee Share: 11.45% of gross salary
- Maximum monthly contribution: ₱1,755
- Used for disability, retirement, and death benefits

### PhilHealth
- Employee Share: 2.75% of gross salary
- Minimum monthly contribution: ₱150
- Provides health insurance coverage

### Pag-IBIG (Home Development Mutual Fund)
- Employee Share: 1.5% of gross salary
- Maximum monthly contribution: ₱100
- Provides housing loan programs

### Income Tax
- Progressive tax based on BIR rates
- Annual non-taxable threshold: ₱250,000
- Calculated using simplified brackets in the system

## PDF Payslip Generation

When generating a payslip:
1. Fetch payroll data with calculation breakdown
2. Generate formatted PDF with:
   - Employee information
   - Earnings details
   - Deductions breakdown
   - Net salary
   - Company letterhead and signatures

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Payroll calculated successfully",
  "data": {
    "id": 1,
    "employee_id": 5,
    "pay_period_start": "2026-02-01",
    "pay_period_end": "2026-02-28",
    "gross_salary": 25000,
    "total_deductions": 3500,
    "net_salary": 21500,
    "status": "draft"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Payroll for this period already exists",
  "errors": {
    "pay_period": ["A payroll record already exists for this period"]
  }
}
```

## Best Practices

1. **Monthly Reconciliation**: Ensure attendance records are finalized before calculating payroll
2. **Approval Process**: Always have two-person approval for salary payments
3. **Backup Records**: Maintain offline backup of payroll records
4. **Tax Compliance**: Update deduction rates annually based on BIR/SSS updates
5. **Employee Notification**: Send notification when payroll is processed
6. **Audit Trail**: Review audit logs monthly for discrepancies

## Future Enhancements

- [ ] Bulk payroll calculation for multiple employees
- [ ] Payslip email delivery
- [ ] Integration with bank transfer APIs
- [ ] Mobile app for employee payslip access
- [ ] Advanced tax calculations (BIR brackets per income level)
- [ ] Customizable deductions (loans, uniforms, etc.)
- [ ] Salary history and trend analysis
- [ ] Multi-currency support
- [ ] Year-end 1098T and tax reports
- [ ] Automated tax filing integration

## Support & Documentation

For issues or questions about the payroll system:
1. Check the calculation breakdown for discrepancies
2. Review audit trail for approval history
3. Verify employee attendance records
4. Contact system administrator for access issues
