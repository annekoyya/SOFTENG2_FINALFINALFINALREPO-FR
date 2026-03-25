<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeductionCategory extends Model
{
    protected $fillable = [
        'name',
        'required_id',
        'is_mandatory',
        'fixed_amount',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'is_system'    => 'boolean',
        'fixed_amount' => 'decimal:2',
    ];

    /**
     * The four government-mandated categories that are seeded automatically
     * and cannot be deleted from the UI.
     */
    public static function systemCategories(): array
    {
        return [
            [
                'name'        => 'SSS Contribution',
                'required_id' => 'sss_number',
                'is_mandatory'=> true,
                'fixed_amount'=> null,   // bracket-based, handled by PayslipService
                'description' => 'Government-mandated Social Security System deduction.',
                'is_system'   => true,
            ],
            [
                'name'        => 'PhilHealth Contribution',
                'required_id' => 'philhealth_number',
                'is_mandatory'=> true,
                'fixed_amount'=> null,
                'description' => 'Government-mandated Philippine Health Insurance contribution.',
                'is_system'   => true,
            ],
            [
                'name'        => 'Pag-IBIG Contribution',
                'required_id' => 'pagibig_number',
                'is_mandatory'=> true,
                'fixed_amount'=> null,
                'description' => 'Government-mandated Home Development Mutual Fund contribution.',
                'is_system'   => true,
            ],
            [
                'name'        => 'BIR Withholding Tax',
                'required_id' => 'tin_number',
                'is_mandatory'=> true,
                'fixed_amount'=> null,
                'description' => 'BIR income tax withholding. Requires TIN to compute correctly.',
                'is_system'   => true,
            ],
        ];
    }
}