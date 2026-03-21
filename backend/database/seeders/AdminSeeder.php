<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Creates the default admin and one user per role for testing.
     * Run with: php artisan db:seed --class=AdminSeeder
     */
    public function run(): void
    {
        $users = [
            [
                'name'     => 'System Admin',
                'email'    => 'admin@hrharmony.com',
                'password' => Hash::make('Admin@1234'),
                'role'     => 'Admin',
            ],
            [
                'name'     => 'HR Officer',
                'email'    => 'hr@hrharmony.com',
                'password' => Hash::make('Hr@12345'),
                'role'     => 'HR',
            ],
            [
                'name'     => 'Department Manager',
                'email'    => 'manager@hrharmony.com',
                'password' => Hash::make('Manager@1'),
                'role'     => 'Manager',
            ],
            [
                'name'     => 'Accountant',
                'email'    => 'accountant@hrharmony.com',
                'password' => Hash::make('Account@1'),
                'role'     => 'Accountant',
            ],
            [
                'name'     => 'Juan dela Cruz',
                'email'    => 'employee@hrharmony.com',
                'password' => Hash::make('Employee@1'),
                'role'     => 'Employee',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        $this->command->info('✅ Default users seeded successfully.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            collect($users)->map(fn($u) => [
                $u['role'],
                $u['email'],
                // Show plaintext only for local seeding convenience
                match($u['role']) {
                    'Admin'      => 'Admin@1234',
                    'HR'         => 'Hr@12345',
                    'Manager'    => 'Manager@1',
                    'Accountant' => 'Account@1',
                    default      => 'Employee@1',
                }
            ])->toArray()
        );
    }
}