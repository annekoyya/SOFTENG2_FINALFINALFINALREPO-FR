export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  province: string;
  zip_code: string;
  department_id: string;
  department_name: string;
  position: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  hire_date: string;
  salary: number;
  status: 'active' | 'on_leave' | 'terminated' | 'suspended';
  photo_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  documents?: EmployeeDocument[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  name: string;
  type: 'resume' | 'contract' | 'id' | 'certificate' | 'other';
  file_url: string;
  uploaded_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  manager_id?: string;
  description?: string;
}

export type EmployeeFormData = Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'department_name' | 'documents'>;
