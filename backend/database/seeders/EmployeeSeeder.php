<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Seeds realistic employees for Blue Lotus Hotel HR system.
     * Run with: php artisan db:seed --class=EmployeeSeeder
     *
     * Also creates matching User accounts for each employee so they can log in.
     */
    public function run(): void
    {
        $employees = [

            // ── ADMIN / HR ─────────────────────────────────────────────────
            [
                'employee' => [
                    'role'                     => 'Admin',
                    'status'                   => 'active',
                    'first_name'               => 'Maria',
                    'last_name'                => 'Santos',
                    'middle_name'              => 'Cruz',
                    'date_of_birth'            => '1985-03-15',
                    'email'                    => 'maria.santos@bluelotus.com',
                    'phone_number'             => '09171234501',
                    'home_address'             => '12 Sampaguita St., Quezon City',
                    'emergency_contact_name'   => 'Jose Santos',
                    'emergency_contact_number' => '09171234599',
                    'relationship'             => 'Spouse',
                    'sss_number'               => '34-5678901-2',
                    'pagibig_number'           => '1234-5678-9012',
                    'philhealth_number'        => '12-345678901-2',
                    'tin'                      => '123-456-789-000',
                    'bank_name'                => 'BDO',
                    'account_name'             => 'Maria Cruz Santos',
                    'account_number'           => '001234567890',
                    'start_date'               => '2018-01-10',
                    'department'               => 'Human Resources',
                    'job_category'             => 'manager',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => null,
                    'basic_salary'             => 55000,
                ],
                'password' => 'Admin@1234',
            ],
            [
                'employee' => [
                    'role'                     => 'HR',
                    'status'                   => 'active',
                    'first_name'               => 'Ana',
                    'last_name'                => 'Reyes',
                    'middle_name'              => 'Lim',
                    'date_of_birth'            => '1990-07-22',
                    'email'                    => 'ana.reyes@bluelotus.com',
                    'phone_number'             => '09181234502',
                    'home_address'             => '45 Mabini St., Pasig City',
                    'emergency_contact_name'   => 'Carlos Reyes',
                    'emergency_contact_number' => '09181234598',
                    'relationship'             => 'Brother',
                    'sss_number'               => '34-5678902-3',
                    'pagibig_number'           => '1234-5678-9013',
                    'philhealth_number'        => '12-345678902-3',
                    'tin'                      => '123-456-789-001',
                    'bank_name'                => 'BPI',
                    'account_name'             => 'Ana Lim Reyes',
                    'account_number'           => '001234567891',
                    'start_date'               => '2020-03-01',
                    'department'               => 'Human Resources',
                    'job_category'             => 'staff',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Maria Santos',
                    'basic_salary'             => 30000,
                ],
                'password' => 'Hr@123456',
            ],

            // ── ACCOUNTANT / FINANCE ───────────────────────────────────────
            [
                'employee' => [
                    'role'                     => 'Accountant',
                    'status'                   => 'active',
                    'first_name'               => 'Roberto',
                    'last_name'                => 'dela Cruz',
                    'middle_name'              => 'Gomez',
                    'date_of_birth'            => '1988-11-05',
                    'email'                    => 'roberto.delacruz@bluelotus.com',
                    'phone_number'             => '09191234503',
                    'home_address'             => '78 Rizal Ave., Marikina City',
                    'emergency_contact_name'   => 'Lita dela Cruz',
                    'emergency_contact_number' => '09191234597',
                    'relationship'             => 'Spouse',
                    'sss_number'               => '34-5678903-4',
                    'pagibig_number'           => '1234-5678-9014',
                    'philhealth_number'        => '12-345678903-4',
                    'tin'                      => '123-456-789-002',
                    'bank_name'                => 'Metrobank',
                    'account_name'             => 'Roberto Gomez dela Cruz',
                    'account_number'           => '001234567892',
                    'start_date'               => '2019-06-15',
                    'department'               => 'Finance',
                    'job_category'             => 'supervisor',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Maria Santos',
                    'basic_salary'             => 40000,
                ],
                'password' => 'Account@1',
            ],

            // ── MANAGERS ──────────────────────────────────────────────────
            [
                'employee' => [
                    'role'                     => 'Manager',
                    'status'                   => 'active',
                    'first_name'               => 'Jerome',
                    'last_name'                => 'Villanueva',
                    'middle_name'              => 'Bautista',
                    'date_of_birth'            => '1982-09-18',
                    'email'                    => 'jerome.villanueva@bluelotus.com',
                    'phone_number'             => '09201234504',
                    'home_address'             => '23 Aguinaldo St., Caloocan City',
                    'emergency_contact_name'   => 'Rosa Villanueva',
                    'emergency_contact_number' => '09201234596',
                    'relationship'             => 'Spouse',
                    'sss_number'               => '34-5678904-5',
                    'pagibig_number'           => '1234-5678-9015',
                    'philhealth_number'        => '12-345678904-5',
                    'tin'                      => '123-456-789-003',
                    'bank_name'                => 'BDO',
                    'account_name'             => 'Jerome Bautista Villanueva',
                    'account_number'           => '001234567893',
                    'start_date'               => '2016-02-20',
                    'department'               => 'Front Office',
                    'job_category'             => 'manager',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Maria Santos',
                    'basic_salary'             => 45000,
                ],
                'password' => 'Manager@1',
            ],
            [
                'employee' => [
                    'role'                     => 'Manager',
                    'status'                   => 'active',
                    'first_name'               => 'Cindy',
                    'last_name'                => 'Ong',
                    'middle_name'              => 'Tan',
                    'date_of_birth'            => '1986-04-30',
                    'email'                    => 'cindy.ong@bluelotus.com',
                    'phone_number'             => '09211234505',
                    'home_address'             => '56 Bonifacio St., Taguig City',
                    'emergency_contact_name'   => 'Peter Ong',
                    'emergency_contact_number' => '09211234595',
                    'relationship'             => 'Spouse',
                    'sss_number'               => '34-5678905-6',
                    'pagibig_number'           => '1234-5678-9016',
                    'philhealth_number'        => '12-345678905-6',
                    'tin'                      => '123-456-789-004',
                    'bank_name'                => 'BPI',
                    'account_name'             => 'Cindy Tan Ong',
                    'account_number'           => '001234567894',
                    'start_date'               => '2017-08-01',
                    'department'               => 'Food & Beverage',
                    'job_category'             => 'manager',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Maria Santos',
                    'basic_salary'             => 45000,
                ],
                'password' => 'Manager@2',
            ],

            // ── REGULAR EMPLOYEES ─────────────────────────────────────────
            [
                'employee' => [
                    'role'                     => 'Employee',
                    'status'                   => 'active',
                    'first_name'               => 'Juan',
                    'last_name'                => 'dela Cruz',
                    'middle_name'              => 'Pedro',
                    'date_of_birth'            => '1995-06-12',
                    'email'                    => 'juan.delacruz@bluelotus.com',
                    'phone_number'             => '09221234506',
                    'home_address'             => '89 Luna St., Mandaluyong City',
                    'emergency_contact_name'   => 'Maria dela Cruz',
                    'emergency_contact_number' => '09221234594',
                    'relationship'             => 'Mother',
                    'sss_number'               => '34-5678906-7',
                    'pagibig_number'           => '1234-5678-9017',
                    'philhealth_number'        => '12-345678906-7',
                    'tin'                      => '123-456-789-005',
                    'bank_name'                => 'Landbank',
                    'account_name'             => 'Juan Pedro dela Cruz',
                    'account_number'           => '001234567895',
                    'start_date'               => '2022-01-03',
                    'department'               => 'Front Office',
                    'job_category'             => 'staff',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Jerome Villanueva',
                    'basic_salary'             => 18000,
                ],
                'password' => 'Employee@1',
            ],
            [
                'employee' => [
                    'role'                     => 'Employee',
                    'status'                   => 'active',
                    'first_name'               => 'Katrina',
                    'last_name'                => 'Mendoza',
                    'middle_name'              => 'Garcia',
                    'date_of_birth'            => '1997-02-28',
                    'email'                    => 'katrina.mendoza@bluelotus.com',
                    'phone_number'             => '09231234507',
                    'home_address'             => '11 Mabuhay St., Paranaque City',
                    'emergency_contact_name'   => 'Lito Mendoza',
                    'emergency_contact_number' => '09231234593',
                    'relationship'             => 'Father',
                    'sss_number'               => '34-5678907-8',
                    'pagibig_number'           => '1234-5678-9018',
                    'philhealth_number'        => '12-345678907-8',
                    'tin'                      => '123-456-789-006',
                    'bank_name'                => 'BDO',
                    'account_name'             => 'Katrina Garcia Mendoza',
                    'account_number'           => '001234567896',
                    'start_date'               => '2023-05-15',
                    'department'               => 'Food & Beverage',
                    'job_category'             => 'staff',
                    'employment_type'          => 'probationary',
                    'reporting_manager'        => 'Cindy Ong',
                    'basic_salary'             => 15000,
                ],
                'password' => 'Employee@2',
            ],
            [
                'employee' => [
                    'role'                     => 'Employee',
                    'status'                   => 'active',
                    'first_name'               => 'Miguel',
                    'last_name'                => 'Torres',
                    'middle_name'              => 'Ramos',
                    'date_of_birth'            => '1993-10-08',
                    'email'                    => 'miguel.torres@bluelotus.com',
                    'phone_number'             => '09241234508',
                    'home_address'             => '34 Magsaysay Blvd., Sta. Mesa',
                    'emergency_contact_name'   => 'Elena Torres',
                    'emergency_contact_number' => '09241234592',
                    'relationship'             => 'Sister',
                    'sss_number'               => '34-5678908-9',
                    'pagibig_number'           => '1234-5678-9019',
                    'philhealth_number'        => '12-345678908-9',
                    'tin'                      => '123-456-789-007',
                    'bank_name'                => 'BPI',
                    'account_name'             => 'Miguel Ramos Torres',
                    'account_number'           => '001234567897',
                    'start_date'               => '2021-09-01',
                    'department'               => 'Housekeeping',
                    'job_category'             => 'supervisor',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Jerome Villanueva',
                    'basic_salary'             => 22000,
                ],
                'password' => 'Employee@3',
            ],
            [
                'employee' => [
                    'role'                     => 'Employee',
                    'status'                   => 'on_leave',
                    'first_name'               => 'Sophia',
                    'last_name'                => 'Aquino',
                    'middle_name'              => 'Flores',
                    'date_of_birth'            => '1998-12-25',
                    'email'                    => 'sophia.aquino@bluelotus.com',
                    'phone_number'             => '09251234509',
                    'home_address'             => '67 Quezon Ave., Quezon City',
                    'emergency_contact_name'   => 'Ramon Aquino',
                    'emergency_contact_number' => '09251234591',
                    'relationship'             => 'Father',
                    'sss_number'               => '34-5678909-0',
                    'pagibig_number'           => '1234-5678-9020',
                    'philhealth_number'        => '12-345678909-0',
                    'tin'                      => '123-456-789-008',
                    'bank_name'                => 'Metrobank',
                    'account_name'             => 'Sophia Flores Aquino',
                    'account_number'           => '001234567898',
                    'start_date'               => '2022-07-18',
                    'department'               => 'Front Office',
                    'job_category'             => 'staff',
                    'employment_type'          => 'regular',
                    'reporting_manager'        => 'Jerome Villanueva',
                    'basic_salary'             => 18000,
                ],
                'password' => 'Employee@4',
            ],
            [
                'employee' => [
                    'role'                     => 'Employee',
                    'status'                   => 'active',
                    'first_name'               => 'Marco',
                    'last_name'                => 'Lim',
                    'middle_name'              => null,
                    'date_of_birth'            => '2001-05-14',
                    'email'                    => 'marco.lim@bluelotus.com',
                    'phone_number'             => '09261234510',
                    'home_address'             => '90 España Blvd., Sampaloc',
                    'emergency_contact_name'   => 'Susan Lim',
                    'emergency_contact_number' => '09261234590',
                    'relationship'             => 'Mother',
                    'sss_number'               => null,
                    'pagibig_number'           => null,
                    'philhealth_number'        => null,
                    'tin'                      => null,
                    'bank_name'                => 'BDO',
                    'account_name'             => 'Marco Lim',
                    'account_number'           => '001234567899',
                    'start_date'               => '2024-06-01',
                    'department'               => 'Food & Beverage',
                    'job_category'             => 'intern',
                    'employment_type'          => 'intern',
                    'reporting_manager'        => 'Cindy Ong',
                    'basic_salary'             => 8000,
                ],
                'password' => 'Employee@5',
            ],
        ];

        $this->command->info('Seeding employees and user accounts...');

        foreach ($employees as $data) {
            // Create or update employee record
            $employee = Employee::updateOrCreate(
                ['email' => $data['employee']['email']],
                $data['employee']
            );

            // Create matching user account so they can log in
            User::updateOrCreate(
                ['email' => $data['employee']['email']],
                [
                    'name'     => $data['employee']['first_name'] . ' ' . $data['employee']['last_name'],
                    'email'    => $data['employee']['email'],
                    'password' => Hash::make($data['password']),
                    'role'     => $data['employee']['role'],
                ]
            );
        }

        // Print login credentials table
        $this->command->info('');
        $this->command->info('✅ Employees and user accounts seeded successfully!');
        $this->command->table(
            ['Name', 'Role', 'Department', 'Email', 'Password'],
            collect($employees)->map(fn($d) => [
                $d['employee']['first_name'] . ' ' . $d['employee']['last_name'],
                $d['employee']['role'],
                $d['employee']['department'],
                $d['employee']['email'],
                $d['password'],
            ])->toArray()
        );
    }
}