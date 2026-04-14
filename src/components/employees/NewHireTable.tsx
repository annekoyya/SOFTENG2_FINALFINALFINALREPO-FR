// src/components/employees/NewHireDetailsModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/api";
import { Loader2 } from "lucide-react";

interface NewHire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  department: string | null;
  job_category: string | null;
  start_date: string | null;
  basic_salary: number | null;
  date_of_birth: string | null;
  home_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  relationship: string | null;
}

interface NewHireDetailsModalProps {
  open: boolean;
  onClose: () => void;
  newHireId: number;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  "Human Resources", "Finance", "Front Office", "Food & Beverage",
  "Housekeeping", "Rooms Division", "Security", "Engineering", "Maintenance"
];

const JOB_CATEGORIES = [
  "Manager", "Supervisor", "Staff", "Associate", "Intern", "Trainee",
  "Receptionist", "Housekeeper", "Waiter", "Cook", "Accountant", "HR Specialist",
  "Security Guard", "Security Supervisor", "Maintenance Staff"
];

const SHIFT_SCHEDULES = [
  { value: "morning", label: "Morning (6:00 AM - 2:00 PM)" },
  { value: "afternoon", label: "Afternoon (2:00 PM - 10:00 PM)" },
  { value: "night", label: "Night (10:00 PM - 6:00 AM)" }
];

const EMPLOYMENT_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "probationary", label: "Probationary" },
  { value: "contractual", label: "Contractual" },
  { value: "part_time", label: "Part Time" },
  { value: "intern", label: "Intern" }
];

export function NewHireDetailsModal({ open, onClose, newHireId, onSuccess }: NewHireDetailsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newHire, setNewHire] = useState<NewHire | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    home_address: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    relationship: "",
    department: "",
    job_category: "",
    shift_sched: "morning",
    employment_type: "probationary",
    basic_salary: 0,
  });

  useEffect(() => {
    if (open && newHireId) {
      fetchNewHireDetails();
    }
  }, [open, newHireId]);

  const fetchNewHireDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/new-hires/${newHireId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const nh = data.data;
        setNewHire(nh);
        setFormData({
          first_name: nh.first_name || "",
          last_name: nh.last_name || "",
          email: nh.email || "",
          phone_number: nh.phone_number || "",
          date_of_birth: nh.date_of_birth || "",
          home_address: nh.home_address || "",
          emergency_contact_name: nh.emergency_contact_name || "",
          emergency_contact_number: nh.emergency_contact_number || "",
          relationship: nh.relationship || "",
          department: nh.department || "",
          job_category: nh.job_category || "",
          shift_sched: "morning",
          employment_type: "probationary",
          basic_salary: nh.basic_salary || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch new hire:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // ✅ FIXED: Use the correct endpoint
      const response = await authFetch(`/api/new-hires/${newHireId}/complete-details`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.success) {
        toast({ title: "Success!", description: "Employee has been transferred successfully!" });
        onSuccess();
        onClose();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to transfer employee", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Complete Employee Details</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please fill in all required information for {newHire?.first_name} {newHire?.last_name}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth *</Label>
              <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
            </div>
            <div>
              <Label>Basic Salary (₱) *</Label>
              <Input type="number" value={formData.basic_salary} onChange={(e) => setFormData({...formData, basic_salary: parseFloat(e.target.value)})} />
            </div>
          </div>

          <div>
            <Label>Home Address *</Label>
            <Input value={formData.home_address} onChange={(e) => setFormData({...formData, home_address: e.target.value})} />
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Contact Name *</Label>
                <Input value={formData.emergency_contact_name} onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})} />
              </div>
              <div>
                <Label>Contact Number *</Label>
                <Input value={formData.emergency_contact_number} onChange={(e) => setFormData({...formData, emergency_contact_number: e.target.value})} />
              </div>
              <div>
                <Label>Relationship *</Label>
                <Input value={formData.relationship} onChange={(e) => setFormData({...formData, relationship: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department *</Label>
                <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Job Category *</Label>
                <Select value={formData.job_category} onValueChange={(v) => setFormData({...formData, job_category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select job category" /></SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Shift Schedule *</Label>
                <Select value={formData.shift_sched} onValueChange={(v) => setFormData({...formData, shift_sched: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFT_SCHEDULES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employment Type *</Label>
                <Select value={formData.employment_type} onValueChange={(v) => setFormData({...formData, employment_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Complete & Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}