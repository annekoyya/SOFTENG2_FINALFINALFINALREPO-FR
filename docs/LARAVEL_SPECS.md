# Blue Lotus Hotel - Laravel Backend Specifications

This document provides the migration files, models, and controller code for implementing the Employee Management module in Laravel.

---

## 1. Database Migrations

### Create Departments Table
```php
<?php
// database/migrations/2024_01_01_000001_create_departments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 10)->unique();
            $table->text('description')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
```

### Create Employees Table
```php
<?php
// database/migrations/2024_01_01_000002_create_employees_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id', 20)->unique(); // BLH-2024-001
            $table->string('first_name', 50);
            $table->string('last_name', 50);
            $table->string('email')->unique();
            $table->string('phone', 20);
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female', 'other']);
            $table->text('address');
            $table->string('city', 100);
            $table->string('province', 100);
            $table->string('zip_code', 10);
            $table->foreignId('department_id')->constrained()->onDelete('restrict');
            $table->string('position', 100);
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'intern']);
            $table->date('hire_date');
            $table->decimal('salary', 12, 2);
            $table->enum('status', ['active', 'on_leave', 'terminated', 'suspended'])->default('active');
            $table->string('photo_url')->nullable();
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for common queries
            $table->index(['status', 'department_id']);
            $table->index('hire_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
```

### Create Employee Documents Table
```php
<?php
// database/migrations/2024_01_01_000003_create_employee_documents_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('name', 255);
            $table->enum('type', ['resume', 'contract', 'id', 'certificate', 'other']);
            $table->string('file_path');
            $table->string('file_size')->nullable();
            $table->string('mime_type', 50)->nullable();
            $table->timestamps();
            
            $table->index('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
    }
};
```

### Create Audit Logs Table
```php
<?php
// database/migrations/2024_01_01_000004_create_audit_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 50); // created, updated, deleted
            $table->string('model', 100); // Employee, Department, etc.
            $table->unsignedBigInteger('model_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at');
            
            $table->index(['model', 'model_id']);
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
```

---

## 2. Eloquent Models

### Employee Model
```php
<?php
// app/Models/Employee.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'province',
        'zip_code',
        'department_id',
        'position',
        'employment_type',
        'hire_date',
        'salary',
        'status',
        'photo_url',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'salary' => 'decimal:2',
    ];

    protected $appends = ['full_name', 'department_name'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getDepartmentNameAttribute(): ?string
    {
        return $this->department?->name;
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    // Auto-generate employee_id on creation
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($employee) {
            if (empty($employee->employee_id)) {
                $year = now()->year;
                $count = self::withTrashed()->whereYear('created_at', $year)->count() + 1;
                $employee->employee_id = sprintf('BLH-%d-%03d', $year, $count);
            }
        });
    }

    // Scopes for common filters
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('first_name', 'like', "%{$term}%")
              ->orWhere('last_name', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%")
              ->orWhere('employee_id', 'like', "%{$term}%");
        });
    }
}
```

### Department Model
```php
<?php
// app/Models/Department.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'description', 'manager_id'];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }
}
```

### EmployeeDocument Model
```php
<?php
// app/Models/EmployeeDocument.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'name',
        'type',
        'file_path',
        'file_size',
        'mime_type',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
```

---

## 3. Form Request Validation

### StoreEmployeeRequest
```php
<?php
// app/Http/Requests/StoreEmployeeRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic based on roles
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'unique:employees,email'],
            'phone' => ['required', 'string', 'max:20'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', Rule::in(['male', 'female', 'other'])],
            'address' => ['required', 'string', 'max:500'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'zip_code' => ['required', 'string', 'max:10'],
            'department_id' => ['required', 'exists:departments,id'],
            'position' => ['required', 'string', 'max:100'],
            'employment_type' => ['required', Rule::in(['full-time', 'part-time', 'contract', 'intern'])],
            'hire_date' => ['required', 'date'],
            'salary' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'on_leave', 'terminated', 'suspended'])],
            'photo' => ['nullable', 'image', 'max:2048'], // 2MB max
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
```

### UpdateEmployeeRequest
```php
<?php
// app/Http/Requests/UpdateEmployeeRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')->id;
        
        return [
            'first_name' => ['sometimes', 'string', 'max:50'],
            'last_name' => ['sometimes', 'string', 'max:50'],
            'email' => ['sometimes', 'email', Rule::unique('employees')->ignore($employeeId)],
            'phone' => ['sometimes', 'string', 'max:20'],
            'date_of_birth' => ['sometimes', 'date', 'before:today'],
            'gender' => ['sometimes', Rule::in(['male', 'female', 'other'])],
            'address' => ['sometimes', 'string', 'max:500'],
            'city' => ['sometimes', 'string', 'max:100'],
            'province' => ['sometimes', 'string', 'max:100'],
            'zip_code' => ['sometimes', 'string', 'max:10'],
            'department_id' => ['sometimes', 'exists:departments,id'],
            'position' => ['sometimes', 'string', 'max:100'],
            'employment_type' => ['sometimes', Rule::in(['full-time', 'part-time', 'contract', 'intern'])],
            'hire_date' => ['sometimes', 'date'],
            'salary' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(['active', 'on_leave', 'terminated', 'suspended'])],
            'photo' => ['nullable', 'image', 'max:2048'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
```

---

## 4. Controller

### EmployeeController
```php
<?php
// app/Http/Controllers/Api/EmployeeController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\EmployeeCollection;
use App\Models\Employee;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class EmployeeController extends Controller
{
    public function __construct(
        private AuditService $auditService
    ) {}

    /**
     * List employees with filters and pagination
     */
    public function index(Request $request)
    {
        $query = Employee::with('department')
            ->when($request->search, fn($q, $search) => $q->search($search))
            ->when($request->department_id, fn($q, $dept) => $q->byDepartment($dept))
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_order ?? 'desc');

        $employees = $request->per_page 
            ? $query->paginate($request->per_page)
            : $query->get();

        return new EmployeeCollection($employees);
    }

    /**
     * Store a new employee
     */
    public function store(StoreEmployeeRequest $request)
    {
        $data = $request->validated();

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $data['photo_url'] = $request->file('photo')->store('employees/photos', 'public');
        }

        $employee = Employee::create($data);

        // Log the action
        $this->auditService->log('created', $employee);

        return new EmployeeResource($employee->load('department'));
    }

    /**
     * Show a single employee
     */
    public function show(Employee $employee)
    {
        return new EmployeeResource($employee->load(['department', 'documents']));
    }

    /**
     * Update an employee
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee)
    {
        $oldValues = $employee->toArray();
        $data = $request->validated();

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($employee->photo_url) {
                Storage::disk('public')->delete($employee->photo_url);
            }
            $data['photo_url'] = $request->file('photo')->store('employees/photos', 'public');
        }

        $employee->update($data);

        // Log the action
        $this->auditService->log('updated', $employee, $oldValues);

        return new EmployeeResource($employee->fresh()->load('department'));
    }

    /**
     * Delete an employee (soft delete)
     */
    public function destroy(Employee $employee)
    {
        $this->auditService->log('deleted', $employee);
        
        $employee->delete();

        return response()->json(['message' => 'Employee deleted successfully'], Response::HTTP_OK);
    }

    /**
     * Upload documents for an employee
     */
    public function uploadDocument(Request $request, Employee $employee)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:resume,contract,id,certificate,other'],
        ]);

        $file = $request->file('file');
        $path = $file->store("employees/{$employee->id}/documents", 'public');

        $document = $employee->documents()->create([
            'name' => $request->name,
            'type' => $request->type,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ]);

        return response()->json($document, Response::HTTP_CREATED);
    }

    /**
     * Export employees to CSV
     */
    public function export(Request $request)
    {
        $employees = Employee::with('department')
            ->when($request->department_id, fn($q, $dept) => $q->byDepartment($dept))
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="employees.csv"',
        ];

        $callback = function() use ($employees) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Email', 'Department', 'Position', 'Status', 'Hire Date']);
            
            foreach ($employees as $employee) {
                fputcsv($file, [
                    $employee->employee_id,
                    $employee->full_name,
                    $employee->email,
                    $employee->department_name,
                    $employee->position,
                    $employee->status,
                    $employee->hire_date->format('Y-m-d'),
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
```

---

## 5. API Resource

### EmployeeResource
```php
<?php
// app/Http/Resources/EmployeeResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'gender' => $this->gender,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'zip_code' => $this->zip_code,
            'department_id' => $this->department_id,
            'department_name' => $this->department_name,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'position' => $this->position,
            'employment_type' => $this->employment_type,
            'hire_date' => $this->hire_date?->format('Y-m-d'),
            'salary' => (float) $this->salary,
            'status' => $this->status,
            'photo_url' => $this->photo_url ? asset('storage/' . $this->photo_url) : null,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'documents' => EmployeeDocumentResource::collection($this->whenLoaded('documents')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

---

## 6. Routes

### API Routes
```php
<?php
// routes/api.php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\DepartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    // Employees
    Route::get('employees/export', [EmployeeController::class, 'export']);
    Route::post('employees/{employee}/documents', [EmployeeController::class, 'uploadDocument']);
    Route::apiResource('employees', EmployeeController::class);
    
    // Departments
    Route::apiResource('departments', DepartmentController::class);
});
```

---

## 7. Database Seeder

### DepartmentSeeder
```php
<?php
// database/seeders/DepartmentSeeder.php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Front Office', 'code' => 'FO', 'description' => 'Guest services and reception'],
            ['name' => 'Housekeeping', 'code' => 'HK', 'description' => 'Room cleaning and maintenance'],
            ['name' => 'Food & Beverage', 'code' => 'FB', 'description' => 'Restaurant and bar services'],
            ['name' => 'Engineering', 'code' => 'ENG', 'description' => 'Facility maintenance'],
            ['name' => 'Human Resources', 'code' => 'HR', 'description' => 'Employee management'],
            ['name' => 'Finance', 'code' => 'FIN', 'description' => 'Accounting and payroll'],
            ['name' => 'Sales & Marketing', 'code' => 'SM', 'description' => 'Promotions and bookings'],
            ['name' => 'Security', 'code' => 'SEC', 'description' => 'Hotel security services'],
        ];

        foreach ($departments as $dept) {
            Department::create($dept);
        }
    }
}
```

---

## 8. Connecting React Frontend to Laravel API

Update your React hooks to call the Laravel API:

```typescript
// src/hooks/useEmployees.ts - Replace mock implementation

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      setEmployees(data.data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch employees", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ... implement other CRUD methods similarly
}
```

---

## Quick Setup Commands

```bash
# Run migrations
php artisan migrate

# Seed departments
php artisan db:seed --class=DepartmentSeeder

# Create storage link for file uploads
php artisan storage:link

# Generate API documentation (optional)
php artisan l5-swagger:generate
```
