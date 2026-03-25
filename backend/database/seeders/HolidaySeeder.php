<?php

namespace Database\Seeders;
use App\Models\Holiday;
use Illuminate\Database\Seeder;
 
class HolidaySeeder extends Seeder
{
    public function run(): void
    {
        if (Holiday::count() > 0) return;
 
        $year = now()->year;
        $holidays = [
            ['name' => "New Year's Day",       'date' => "{$year}-01-01", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "Araw ng Kagitingan",    'date' => "{$year}-04-09", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "Labor Day",             'date' => "{$year}-05-01", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "Independence Day",      'date' => "{$year}-06-12", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "Bonifacio Day",         'date' => "{$year}-11-30", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "Christmas Day",         'date' => "{$year}-12-25", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "Rizal Day",             'date' => "{$year}-12-30", 'holiday_type' => 'regular',             'is_recurring' => true,  'pay_multiplier' => 2.00],
            ['name' => "All Saints Day",        'date' => "{$year}-11-01", 'holiday_type' => 'special_non_working', 'is_recurring' => true,  'pay_multiplier' => 1.30],
            ['name' => "Christmas Eve",         'date' => "{$year}-12-24", 'holiday_type' => 'special_non_working', 'is_recurring' => true,  'pay_multiplier' => 1.30],
            ['name' => "Last Day of the Year",  'date' => "{$year}-12-31", 'holiday_type' => 'special_non_working', 'is_recurring' => true,  'pay_multiplier' => 1.30],
        ];
 
        foreach ($holidays as $h) {
            Holiday::firstOrCreate(['date' => $h['date'], 'name' => $h['name']], $h);
        }
 
        $this->command->info('Seeded ' . count($holidays) . ' PH national holidays.');
    }
}
