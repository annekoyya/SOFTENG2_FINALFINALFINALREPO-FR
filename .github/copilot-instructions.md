
Improve UI/UX 
Fix migrations, and seed teh database to see how the data will show and interact 
Report in 1 MD file what changes, UI/UX, system design for each 5 main subsystem for each employee, and whats done and what not done yet 


Login Role: Admin
When i logged in the dahsboard isnt connected with teh sidebars 
Make the sidebar collor pallete blue like the prev one, with yellow accents

Employee Directory:
> Remove New employee button (Because it should be a pipeline from recruitment to new hire to employee, not direct creation), thus new hire to employee first
> Remove department and position filters (since we dont have those fields, we have department and job category instead, but for MVP we can just remove the filters entirely to simplify)
> Employee details: change address to home_address, phone to phone_number, salary to basic_salary, hire date to start_date, department to department, position to job_category, and add shift_sched
> Employee form: same field name changes as above, and make department and job category dropdowns instead of text input (with predefined options based on the current employees in the database, so we can just do a distinct query to get the existing values and use those as options)
> Employee form: remove the option to directly set salary (since salary is predefined based on job category), and instead show a read-only field that displays the salary based on the selected job category (so when HR selects a job category, the salary field auto-fills with the corresponding salary for that category)
> Employee form: remove the option to set reporting manager for now (since we dont have a user system with manager/employee relationships yet, we can just remove this field to simplify)
> Employee form: add shift_sched field with dropdown options (morning, afternoon, night)
> For the actions in each employee it should be edit, view (with the option to export the employee data), and archived only for logged in admin
> They can also change roles, thus granting access to the RBAC ems system 


Attendance & Timekeeping
> Create a format of an excel sheet to import for the attendance 
> Remove the option to manually add attendance records through the UI (since they will be imported from the excel sheet, we can remove the manual entry option to simplify)
> For the attendance status, we will just have Present, Absent, Late, and On Leave. Late will be automatically calculated based on the check-in time in the imported excel (if check-in is more than 30 minutes after shift start time, mark as Late)
> Remove the overtime and holiday features entirely to simplify (since we dont have the data or policies for these yet, we can remove them to focus on the core attendance tracking functionality)
> For the attendance records, we will just store the date, status (Present, Absent, Late, On Leave), and shift (morning, afternoon, night) for each employee.
>Create a seeder for Leave requests (pending and approved) assume all paid leaves so less hassle in payslip
> The imported excel attendnace should refelect on the live dashboard and the employee details page, so we can see the attendance records for each employee after importing


Payslip 
> Fix Summary PDF
> For the payroll calculation, we will use the predefined salary based on job category, and then apply the statutory deductions (SSS, PhilHealth, PagIBIG, BIR) based on the current rates and brackets. We will not include any additional allowances or bonuses for now to simplify the calculation.
> For the payslip breakdown, we will show the gross salary (based on job category), the statutory deductions (SSS, PhilHealth, PagIBIG, BIR), and the net salary (gross salary minus total deductions). We will not include any additional earnings or deductions for now to simplify the payslip.
> For the payroll approval workflow, we will have the accountant compute the payroll for the period, and then the manager/admin can review and approve it. Once approved, the payslips will be generated and marked as paid. We will not include a separate post-payroll distribution step for now to simplify the workflow.
> For the payslip PDF generation, we will use a simple template that includes the employee details, payroll period, gross salary, deductions, and net salary. We will not include any additional styling or sections for now to simplify the PDF generation.
> For the payslip email notification, we will send an email to the employee when their payslip is marked as paid, with a link to view/download the PDF. We will not include any additional notifications for now to simplify the email workflow.
> For the audit logging, we will log the payroll computation and approval actions, including who performed the action and when. We will not include detailed logging of individual payslip views or downloads for now to simplify the audit logging.
> For the payroll adjustments, we will not include any manual adjustment feature for now to simplify the payroll process. All calculations will be based on the predefined salary and statutory deductions without manual overrides.
> For the payroll period, we will use a 2 week period for the payroll calculation and payslip generation. We will not include any additional period options for now to simplify the payroll process.
> For the payroll reports, we will not include any complex reporting features for now to simplify the payroll module. We will focus on the core functionality of payroll calculation, payslip generation, and email notifications without additional reporting or analytics features.


Performance Management
> The evaluation forms cant be sent? fix error 
> The evaluation forms remove the predefined questions and such 
> The evaluoators in each forms are chosen by the admin from the HR roles


Training and Recruitment
> remove training (its overly complex) instead add it the recruitment pipeline subtab, like  where HR can upload training materials (pdfs, docs) and assign them to  applicant > new hire, and then track completion. We will not include any complex training modules or quizzes for now to simplify the training feature.
> Add it in the sidebar as well, and remove interview schedule in  Performance Management
>For the recruitment module, we will have a simple workflow where HR can create job postings, (applicants can apply to those postings, not directly in the ems, more like they show up for the interview or notify through email ans such), and then HR can schedule interviews and make job offers. We will not include a separate training module for now to simplify the recruitment process.
> For the job postings, we will have fields for job title, department, job category, and description. We will not include any additional fields for now to simplify the job posting creation.
> For the applicants, we will have fields for name, email, phone number, resume (file upload), and the job posting they applied to. We will not include any additional fields for now to simplify the applicant tracking.
> For the interview scheduling, we will have HR select the applicant, choose an interview date and time, and assign an interviewer (from the HR users). We will not include any
> Make a simple training part where HR can upload training materials (pdfs, docs) and assign them to employees, and then track completion. We will not include any complex training modules or quizzes for now to simplify the training feature.
> And this training module once done, can be changes status by the HR 



Login Role: HR
Attendance
> Leave requests, they can view pending and approved but the cant change teh status of the leave requests only the admin
> Remove Clock in/Out, make it a audit table isntead for attendance 

Add the employee directory 
> same functionality but dont had access nor ability to change roles for RBAC ems


Login Role: HR
Remove the Performance subtab for evaluations (Only HR are the evaluators)




----- 
Sidebar, make it darker blue and yellow accents 
When I logged in the dahsboard doesnt have the sidebar
And the dahsboard doesnts show any real data

Login Role: Admin
> Remove Export Button 
> When I click new hire it crashes
chunk-T2SWDQEL.js?v=fd1a46a9:14032 The above error occurred in the <NewHireTab> component:

    at NewHireTab (http://localhost:5174/src/components/employees/NewHireTab.tsx?t=1775144240966:246:23)
    at div
    at http://localhost:5174/node_modules/.vite/deps/chunk-LKOAR5GC.js?v=fd1a46a9:43:13
    at Presence (http://localhost:5174/node_modules/.vite/deps/chunk-KQY5T7VD.js?v=fd1a46a9:24:11)
    at http://localhost:5174/node_modules/.vite/deps/@radix-ui_react-tabs.js?v=fd1a46a9:175:13
    at _c4 (http://localhost:5174/src/components/ui/tabs.tsx:47:61)
    at div
    at http://localhost:5174/node_modules/.vite/deps/chunk-LKOAR5GC.js?v=fd1a46a9:43:13
    at Provider (http://localhost:5174/node_modules/.vite/deps/chunk-OXZDJRWN.js?v=fd1a46a9:38:15)
    at http://localhost:5174/node_modules/.vite/deps/@radix-ui_react-tabs.js?v=fd1a46a9:52:7
    at main
    at div
    at div
    at DashboardLayout (http://localhost:5174/src/components/layout/DashboardLayout.tsx?t=1775197920062:24:35)
    at Employees (http://localhost:5174/src/pages/Employees.tsx?t=1775197920062:39:174)
    at PrivateRoute (http://localhost:5174/src/App.tsx?t=1775197920062:43:25)
    at RenderedRoute (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:4088:5)
    at Routes (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:4558:5)
    at Router (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:4501:15)
    at BrowserRouter (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:5247:5)
    at Provider (http://localhost:5174/node_modules/.vite/deps/chunk-OXZDJRWN.js?v=fd1a46a9:38:15)
    at TooltipProvider (http://localhost:5174/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=fd1a46a9:61:5)
    at QueryClientProvider (http://localhost:5174/node_modules/.vite/deps/@tanstack_react-query.js?v=fd1a46a9:2934:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ chunk-T2SWDQEL.js?v=fd1a46a9:14032Understand this error
chunk-T2SWDQEL.js?v=fd1a46a9:19413 Uncaught TypeError: hires.filter is not a function
    at NewHireTab (NewHireTab.tsx:152:26)
    at renderWithHooks (chunk-T2SWDQEL.js?v=fd1a46a9:11548:26)
    at updateFunctionComponent (chunk-T2SWDQEL.js?v=fd1a46a9:14582:28)
    at beginWork (chunk-T2SWDQEL.js?v=fd1a46a9:15924:22)
    at beginWork$1 (chunk-T2SWDQEL.js?v=fd1a46a9:19753:22)
    at performUnitOfWork (chunk-T2SWDQEL.js?v=fd1a46a9:19198:20)
    at workLoopSync (chunk-T2SWDQEL.js?v=fd1a46a9:19137:13)
    at renderRootSync (chunk-T2SWDQEL.js?v=fd1a46a9:19116:15)
    at recoverFromConcurrentError (chunk-T2SWDQEL.js?v=fd1a46a9:18736:28)
    at performConcurrentWorkOnRoot (chunk-T2SWDQEL.js?v=fd1a46a9:18684:30)Understand this error
6employees:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received


iN evaluation form 
api/evaluations:1  Failed to load resource: the server responded with a status of 422 (Unprocessable Content)Understand this error
useEvaluation.ts:117 Evaluation error: Error: The title field is required. (and 2 more errors)
    at useEvaluation.ts:170:26
    at async handleCreate (Performance.tsx:71:7)
    at async handleSave (EvaluationFormBuilder.tsx:148:7)

 in attendance    
Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
useAttendance.ts:42 Attendance error: Error: HTTP 500
    at useAttendance.ts:50:31
handleError @ useAttendance.ts:42Understand this error
api/leave-requests:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
useAttendance.ts:42 Attendance error: Error: HTTP 500
    at useAttendance.ts:146:31
handleError @ useAttendance.ts:42Understand this error
api/attendance?start_date=2026-04-01&end_date=2026-04-29:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
useAttendance.ts:42 Attendance error: Error: HTTP 500
    at useAttendance.ts:74:33
handleError @ useAttendance.ts:42Understand this error
api/attendance/monthly-stats?month=4&year=2026:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
useAttendance.ts:42 Attendance error: Error: HTTP 500
    at useAttendance.ts:245:31
handleError @ useAttendance.ts:42Understand this error


chunk-T2SWDQEL.js?v=fd1a46a9:14032 The above error occurred in the <JobPostingsPanel> component:

    at JobPostingsPanel (http://localhost:5174/src/components/recruitment/JobPostingsPanel.tsx?t=1775144240960:599:44)
    at div
    at Recruitment (http://localhost:5174/src/pages/Recruitment.tsx?t=1775144240980:87:22)
    at PrivateRoute (http://localhost:5174/src/App.tsx?t=1775197920062:43:25)
    at RenderedRoute (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:4088:5)
    at Routes (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:4558:5)
    at Router (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:4501:15)
    at BrowserRouter (http://localhost:5174/node_modules/.vite/deps/react-router-dom.js?v=fd1a46a9:5247:5)
    at Provider (http://localhost:5174/node_modules/.vite/deps/chunk-OXZDJRWN.js?v=fd1a46a9:38:15)
    at TooltipProvider (http://localhost:5174/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=fd1a46a9:61:5)
    at QueryClientProvider (http://localhost:5174/node_modules/.vite/deps/@tanstack_react-query.js?v=fd1a46a9:2934:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.

chunk-T2SWDQEL.js?v=fd1a46a9:19413 Uncaught TypeError: jobs.filter is not a function
    at JobPostingsPanel (JobPostingsPanel.tsx:194:25)
api.ts:21 
 GET http://localhost:5174/api/recruitment/stats 404 (Not Found)
api.ts:21 
 GET http://localhost:5174/api/job-offers 404 (Not Found)


