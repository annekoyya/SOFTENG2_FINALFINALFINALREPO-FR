<?php

namespace Database\Seeders;
 
use App\Models\DeductionCategory;
use Illuminate\Database\Seeder;
 
class DeductionCategorySeeder extends Seeder
{
    public function run(): void
    {
        // Avoid duplicates on re-seed
        if (DeductionCategory::where('is_system', true)->exists()) {
            return;
        }
 
        foreach (DeductionCategory::systemCategories() as $cat) {
            DeductionCategory::create($cat);
        }
 
        $this->command->info('Seeded 4 system deduction categories.');
    }
}