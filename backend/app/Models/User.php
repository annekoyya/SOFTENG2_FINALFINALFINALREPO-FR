<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int         $id
 * @property string      $name
 * @property string      $email
 * @property string      $password
 * @property string      $role
 * @property string|null $email_verified_at
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon    $created_at
 * @property \Illuminate\Support\Carbon    $updated_at
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Employee, HR, Manager, Accountant, Admin
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ─── Role Helpers ─────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'Admin';
    }

    public function isHR(): bool
    {
        return $this->role === 'HR';
    }

    public function isManager(): bool
    {
        return $this->role === 'Manager';
    }

    public function isAccountant(): bool
    {
        return $this->role === 'Accountant';
    }

    /**
     * Check if user can approve leave requests (HR, Manager, Admin).
     */
    public function canApproveLeave(): bool
    {
        return in_array($this->role, ['Admin', 'HR', 'Manager']);
    }

    /**
     * Check if user can manage payroll (Accountant, Admin).
     */
    public function canManagePayroll(): bool
    {
        return in_array($this->role, ['Admin', 'Accountant']);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * Attendance records recorded by this user.
     */
    public function recordedAttendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'recorded_by');
    }

    /**
     * Leave requests approved/rejected by this user.
     */
    public function approvedLeaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'approver_id');
    }

    /**
     * Payrolls created by this user.
     */
    public function createdPayrolls(): HasMany
    {
        return $this->hasMany(Payroll::class, 'created_by');
    }

    /**
     * Payrolls approved by this user.
     */
    public function approvedPayrolls(): HasMany
    {
        return $this->hasMany(Payroll::class, 'approved_by');
    }
}