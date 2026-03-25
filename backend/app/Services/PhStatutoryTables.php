<?php

namespace App\Services;

/**
 * Philippine Statutory Contribution Tables (2024-2025)
 * Sources:
 *   SSS   — Circular 2023-010 (effective Jan 2023)
 *   PhilHealth — PhilHealth Circular 2023-0007 (5% of MSC)
 *   PagIBIG — RA 9679
 *   BIR   — TRAIN Law (RA 10963), effective Jan 2018
 */
class PhStatutoryTables
{
    // ─── SSS 2023 Table ───────────────────────────────────────────────────────
    // Employee share = 4.5%, Employer share = 9.5%, Total = 14%
    // MSC range: ₱4,250 – ₱29,750
    // Returns [employee_share, employer_share, ec_contribution]

    public static function computeSSS(float $monthlyBasicSalary): array
    {
        $msc = self::getMSC($monthlyBasicSalary);

        $employeeShare = round($msc * 0.045, 2);
        $employerShare = round($msc * 0.095, 2);
        $ecContrib     = $msc >= 14750 ? 30.00 : 10.00; // EC contribution

        return [
            'msc'           => $msc,
            'employee'      => $employeeShare,
            'employer'      => $employerShare,
            'ec'            => $ecContrib,
            'total'         => $employeeShare + $employerShare,
        ];
    }

    /**
     * Get Monthly Salary Credit based on actual salary.
     * SSS MSC table (₱500 increments from ₱4,250 to ₱29,750).
     */
    private static function getMSC(float $salary): float
    {
        if ($salary < 4250)  return 4000;
        if ($salary < 4750)  return 4500;
        if ($salary < 5250)  return 5000;
        if ($salary < 5750)  return 5500;
        if ($salary < 6250)  return 6000;
        if ($salary < 6750)  return 6500;
        if ($salary < 7250)  return 7000;
        if ($salary < 7750)  return 7500;
        if ($salary < 8250)  return 8000;
        if ($salary < 8750)  return 8500;
        if ($salary < 9250)  return 9000;
        if ($salary < 9750)  return 9500;
        if ($salary < 10250) return 10000;
        if ($salary < 10750) return 10500;
        if ($salary < 11250) return 11000;
        if ($salary < 11750) return 11500;
        if ($salary < 12250) return 12000;
        if ($salary < 12750) return 12500;
        if ($salary < 13250) return 13000;
        if ($salary < 13750) return 13500;
        if ($salary < 14250) return 14000;
        if ($salary < 14750) return 14500;
        if ($salary < 15250) return 15000;
        if ($salary < 15750) return 15500;
        if ($salary < 16250) return 16000;
        if ($salary < 16750) return 16500;
        if ($salary < 17250) return 17000;
        if ($salary < 17750) return 17500;
        if ($salary < 18250) return 18000;
        if ($salary < 18750) return 18500;
        if ($salary < 19250) return 19000;
        if ($salary < 19750) return 19500;
        if ($salary < 20250) return 20000;
        if ($salary < 20750) return 20500;
        if ($salary < 21250) return 21000;
        if ($salary < 21750) return 21500;
        if ($salary < 22250) return 22000;
        if ($salary < 22750) return 22500;
        if ($salary < 23250) return 23000;
        if ($salary < 23750) return 23500;
        if ($salary < 24250) return 24000;
        if ($salary < 24750) return 24500;
        if ($salary < 25250) return 25000;
        if ($salary < 25750) return 25500;
        if ($salary < 26250) return 26000;
        if ($salary < 26750) return 26500;
        if ($salary < 27250) return 27000;
        if ($salary < 27750) return 27500;
        if ($salary < 28250) return 28000;
        if ($salary < 28750) return 28500;
        if ($salary < 29250) return 29000;
        if ($salary < 29750) return 29500;
        return 30000; // ₱29,750 and above → MSC ₱30,000
    }

    // ─── PhilHealth 2024 ──────────────────────────────────────────────────────
    // Rate: 5% of monthly basic salary
    // Minimum MSC: ₱10,000 → minimum contribution ₱500/month
    // Maximum MSC: ₱100,000 → maximum contribution ₱5,000/month
    // Employee pays 50%, Employer pays 50%

    public static function computePhilHealth(float $monthlyBasicSalary): array
    {
        $msc = min(max($monthlyBasicSalary, 10000), 100000);
        $total    = round($msc * 0.05, 2);
        $employee = round($total / 2, 2);
        $employer = round($total / 2, 2);

        return [
            'msc'      => $msc,
            'total'    => $total,
            'employee' => $employee,
            'employer' => $employer,
        ];
    }

    // ─── Pag-IBIG ─────────────────────────────────────────────────────────────
    // Employee contribution:
    //   ₱1,500 and below → 1% of MSC
    //   Above ₱1,500     → 2% of MSC
    // Maximum employee contribution: ₱100/month
    // Employer contribution: 2%, minimum ₱100/month

    public static function computePagIBIG(float $monthlyBasicSalary): array
    {
        $rate     = $monthlyBasicSalary <= 1500 ? 0.01 : 0.02;
        $employee = min(round($monthlyBasicSalary * $rate, 2), 100.00);
        $employer = min(round($monthlyBasicSalary * 0.02, 2), 100.00);

        return [
            'employee' => $employee,
            'employer' => $employer,
            'total'    => $employee + $employer,
        ];
    }

    // ─── BIR Withholding Tax — TRAIN Law (RA 10963) ───────────────────────────
    // Annual taxable income brackets (effective 2023+):
    //   ₱0       – ₱250,000  → 0%
    //   ₱250,001 – ₱400,000  → 15% of excess over ₱250,000
    //   ₱400,001 – ₱800,000  → ₱22,500 + 20% of excess over ₱400,000
    //   ₱800,001 – ₱2,000,000 → ₱102,500 + 25% of excess over ₱800,000
    //   ₱2,000,001 – ₱8,000,000 → ₱402,500 + 30% of excess over ₱2,000,000
    //   Over ₱8,000,000      → ₱2,202,500 + 35% of excess over ₱8,000,000
    //
    // Non-taxable de minimis benefits (not included here):
    //   13th month + other bonuses up to ₱90,000 are exempt

    public static function computeBIR(
        float $monthlyTaxableIncome,
        float $sssEmployee,
        float $philhealthEmployee,
        float $pagibigEmployee
    ): float {
        // Taxable income = gross - non-taxable allowances - mandatory deductions
        $taxable = $monthlyTaxableIncome - $sssEmployee - $philhealthEmployee - $pagibigEmployee;
        $taxable = max($taxable, 0);

        // Annualize for bracket lookup
        $annual = $taxable * 12;

        $annualTax = self::getBIRannualTax($annual);

        // Monthly withholding = annual tax / 12
        return round($annualTax / 12, 2);
    }

    private static function getBIRannualTax(float $annualIncome): float
    {
        if ($annualIncome <= 250000) {
            return 0.0;
        } elseif ($annualIncome <= 400000) {
            return ($annualIncome - 250000) * 0.15;
        } elseif ($annualIncome <= 800000) {
            return 22500 + ($annualIncome - 400000) * 0.20;
        } elseif ($annualIncome <= 2000000) {
            return 102500 + ($annualIncome - 800000) * 0.25;
        } elseif ($annualIncome <= 8000000) {
            return 402500 + ($annualIncome - 2000000) * 0.30;
        } else {
            return 2202500 + ($annualIncome - 8000000) * 0.35;
        }
    }

    /**
     * Get tax bracket description for display on payslip.
     */
    public static function getBIRBracket(float $annualIncome): string
    {
        if ($annualIncome <= 250000)   return '0% (₱0 – ₱250,000)';
        if ($annualIncome <= 400000)   return '15% (₱250,001 – ₱400,000)';
        if ($annualIncome <= 800000)   return '20% (₱400,001 – ₱800,000)';
        if ($annualIncome <= 2000000)  return '25% (₱800,001 – ₱2,000,000)';
        if ($annualIncome <= 8000000)  return '30% (₱2,000,001 – ₱8,000,000)';
        return '35% (Over ₱8,000,000)';
    }
}