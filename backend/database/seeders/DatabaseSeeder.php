<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run all seeders in the correct order.
     * php artisan db:seed
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,    // Default system users (admin, hr, accountant, etc.)
            EmployeeSeeder::class, // Realistic employee records + matching user accounts
        ]);
    }
}