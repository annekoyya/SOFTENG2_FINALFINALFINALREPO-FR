<?php

namespace Database\Seeders;

use App\Models\NewHire;
use App\Models\User;
use Illuminate\Database\Seeder;

class NewHireSeeder extends Seeder
{
    /**
     * Seeds new hire onboarding records for Blue Lotus Hotel HR system.
     * Run with: php artisan db:seed --class=NewHireSeeder
     *
     * Creates realistic new hire applications in various stages of onboarding.
     */
    public function run(): void
    {
        $hrManagerId = User::where('email', 'ana.reyes@bluelotus.com')->first()?->id ?? 1;

        $newHires = [
            // ── PENDING (RECENTLY SUBMITTED) ─────────────────────────────────
            [
                'created_by'              => $hrManagerId,
                'onboarding_status'       => 'pending',
                'employee_id'             => null,
                'first_name'              => 'Jessica',
                'last_name'               => 'Ocampo',
                'middle_name'             => 'Martinez',
                'name_extension'          => null,
                'date_of_birth'           => '1998-05-14',
                'email'                   => 'jessica.ocampo@bluelotus.com',
                'phone_number'            => '09201234504',
                'home_address'            => '89 Maginhawa St., Quezon City',
                'emergency_contact_name'  => 'Rosa Ocampo',
                'emergency_contact_number' => '09201234596',
                'relationship'            => 'Mother',
                'tin'                     => null,
                'sss_number'              => null,
                'pagibig_number'          => null,
                'philhealth_number'       => null,
                'bank_name'               => null,
                'account_name'            => null,
                'account_number'          => null,
                'start_date'              => '2026-04-01',
                'department'              => 'Front Desk',
                'job_category'            => 'staff',
                'employment_type'         => 'regular',
                'role'                    => 'Employee',
                'basic_salary'            => 25000,
                'reporting_manager'       => 'Maria Santos',
                'completed_fields'        => ['first_name', 'last_name', 'date_of_birth', 'email', 'phone_number', 'home_address', 'emergency_contact_name', 'emergency_contact_number', 'relationship', 'start_date', 'department', 'job_category'],
                'transferred_at'          => null,
            ],

            // ── PENDING (PARTIALLY FILLED) ──────────────────────────────
            [
                'created_by'              => $hrManagerId,
                'onboarding_status'       => 'pending',
                'employee_id'             => null,
                'first_name'              => 'Patrick',
                'last_name'               => 'Gonzales',
                'middle_name'             => 'Ramirez',
                'name_extension'          => null,
                'date_of_birth'           => '1995-08-22',
                'email'                   => 'patrick.gonzales@bluelotus.com',
                'phone_number'            => '09211234505',
                'home_address'            => '23 Aurora Blvd., Cainta',
                'emergency_contact_name'  => 'Elena Gonzales',
                'emergency_contact_number' => '09211234595',
                'relationship'            => 'Spouse',
                'tin'                     => '123-456-789-002',
                'sss_number'              => '34-5678904-5',
                'pagibig_number'          => '1234-5678-9015',
                'philhealth_number'       => null,
                'bank_name'               => 'BDO',
                'account_name'            => 'Patrick Ramirez Gonzales',
                'account_number'          => '001234567892',
                'start_date'              => '2026-04-15',
                'department'              => 'Housekeeping',
                'job_category'            => 'staff',
                'employment_type'         => 'regular',
                'role'                    => 'Employee',
                'basic_salary'            => 22000,
                'reporting_manager'       => 'Maria Santos',
                'completed_fields'        => ['first_name', 'last_name', 'date_of_birth', 'email', 'phone_number', 'home_address', 'emergency_contact_name', 'emergency_contact_number', 'relationship', 'sss_number', 'pagibig_number', 'bank_name', 'account_name', 'account_number', 'start_date', 'department', 'job_category', 'employment_type', 'basic_salary'],
                'transferred_at'          => null,
            ],

            // ── COMPLETE (ALL REQUIRED FIELDS FILLED - READY FOR AUTO-TRANSFER) ───
            [
                'created_by'              => $hrManagerId,
                'onboarding_status'       => 'complete',
                'employee_id'             => null,
                'first_name'              => 'Stephanie',
                'last_name'               => 'Villanueva',
                'middle_name'             => 'Pascual',
                'name_extension'          => null,
                'date_of_birth'           => '1996-12-10',
                'email'                   => 'stephanie.villanueva@bluelotus.com',
                'phone_number'            => '09221234506',
                'home_address'            => '56 Malikhain Ave., Mayz City',
                'emergency_contact_name'  => 'Miguel Villanueva',
                'emergency_contact_number' => '09221234594',
                'relationship'            => 'Father',
                'tin'                     => '123-456-789-003',
                'sss_number'              => '34-5678905-6',
                'pagibig_number'          => '1234-5678-9016',
                'philhealth_number'       => '12-345678903-4',
                'bank_name'               => 'BPI',
                'account_name'            => 'Stephanie Pascual Villanueva',
                'account_number'          => '001234567893',
                'start_date'              => '2026-03-25',
                'department'              => 'Kitchen',
                'job_category'            => 'staff',
                'employment_type'         => 'regular',
                'role'                    => 'Employee',
                'basic_salary'            => 28000,
                'reporting_manager'       => 'Maria Santos',
                'completed_fields'        => NewHire::REQUIRED_FIELDS,
                'transferred_at'          => null,
            ],

            // ── TRANSFERRED (ALREADY MADE EMPLOYEE) ──────────────────────
            [
                'created_by'              => $hrManagerId,
                'onboarding_status'       => 'transferred',
                'employee_id'             => null,
                'first_name'              => 'Victor',
                'last_name'               => 'Fernandez',
                'middle_name'             => 'Lopez',
                'name_extension'          => null,
                'date_of_birth'           => '1992-09-18',
                'email'                   => 'victor.fernandez@bluelotus.com',
                'phone_number'            => '09231234507',
                'home_address'            => '78 Dama de Noche, Taytay',
                'emergency_contact_name'  => 'Mariana Fernandez',
                'emergency_contact_number' => '09231234593',
                'relationship'            => 'Spouse',
                'tin'                     => '123-456-789-004',
                'sss_number'              => '34-5678906-7',
                'pagibig_number'          => '1234-5678-9017',
                'philhealth_number'       => '12-345678904-5',
                'bank_name'               => 'Metrobank',
                'account_name'            => 'Victor Lopez Fernandez',
                'account_number'          => '001234567894',
                'start_date'              => '2026-02-10',
                'department'              => 'Engineering',
                'job_category'            => 'staff',
                'employment_type'         => 'regular',
                'role'                    => 'Employee',
                'basic_salary'            => 32000,
                'reporting_manager'       => 'Maria Santos',
                'completed_fields'        => NewHire::REQUIRED_FIELDS,
                'transferred_at'          => '2026-03-20 14:30:00',
            ],

            // ── PENDING (INCOMPLETE APPLICATION) ────────────────────────
            [
                'created_by'              => $hrManagerId,
                'onboarding_status'       => 'pending',
                'employee_id'             => null,
                'first_name'              => 'Antonio',
                'last_name'               => 'Mercado',
                'middle_name'             => 'Santos',
                'name_extension'          => null,
                'date_of_birth'           => '1994-06-05',
                'email'                   => 'antonio.mercado@bluelotus.com',
                'phone_number'            => '09241234508',
                'home_address'            => null,
                'emergency_contact_name'  => null,
                'emergency_contact_number' => null,
                'relationship'            => null,
                'tin'                     => null,
                'sss_number'              => null,
                'pagibig_number'          => null,
                'philhealth_number'       => null,
                'bank_name'               => null,
                'account_name'            => null,
                'account_number'          => null,
                'start_date'              => null,
                'department'              => null,
                'job_category'            => null,
                'employment_type'         => 'probationary',
                'role'                    => 'Employee',
                'basic_salary'            => null,
                'reporting_manager'       => null,
                'completed_fields'        => ['first_name', 'last_name', 'date_of_birth', 'email', 'phone_number'],
                'transferred_at'          => null,
            ],
        ];

        foreach ($newHires as $data) {
            NewHire::create($data);
        }

        $this->command->info('✓ ' . count($newHires) . ' new hire records seeded successfully!');
    }
}
