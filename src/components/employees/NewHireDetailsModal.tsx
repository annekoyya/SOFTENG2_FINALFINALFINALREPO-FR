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

interface NewHireDetailsModalProps {
  open: boolean;
  onClose: () => void;
  newHireId: number;
  onSuccess: () => void;
}

const DEPARTMENTS = [
  "Human Resources", "Finance", "Front Office", "Food & Beverage",
  "Housekeeping", "Engineering", "Security", "Sales & Marketing"
];

const SHIFTS = [
  { value: "morning", label: "Morning (6AM - 2PM)" },
  { value: "afternoon", label: "Afternoon (2PM - 10PM)" },
  { value: "night", label: "Night (10PM - 6AM)" }
];

export function NewHireDetailsModal({ open, onClose, newHireId, onSuccess }: NewHireDetailsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    employment_type: "regular",
    basic_salary: 25000,
  });

  // Fetch new hire data when modal opens
  useEffect(() => {
    if (open && newHireId) {
      fetchNewHireData();
    }
  }, [open, newHireId]);

  const fetchNewHireData = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/new-hires/${newHireId}`);
      const data = await res.json();
      if (data.success) {
        const nh = data.data;
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
          shift_sched: nh.shift_sched || "morning",
          employment_type: nh.employment_type || "regular",
          basic_salary: nh.basic_salary || 25000,
        });
      }
    } catch (error) {
      console.error("Failed to fetch new hire:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/new-hires/${newHireId}/complete-details`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Employee details saved!" });
        onSuccess();
        onClose();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save details", variant: "destructive" });
    } finally {
      setSaving(false);
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
          <DialogTitle>Complete Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Department *</Label>
              <Select
                value={formData.department}
                onValueChange={(v) => setFormData({ ...formData, department: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Job Category *</Label>
              <Input
                value={formData.job_category}
                onChange={(e) => setFormData({ ...formData, job_category: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Shift Schedule *</Label>
              <Select
                value={formData.shift_sched}
                onValueChange={(v) => setFormData({ ...formData, shift_sched: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>{shift.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employment Type</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(v) => setFormData({ ...formData, employment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="probationary">Probationary</SelectItem>
                  <SelectItem value="contractual">Contractual</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Basic Salary (₱)</Label>
              <Input
                type="number"
                value={formData.basic_salary}
                onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Home Address *</Label>
            <Input
              value={formData.home_address}
              onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Name *</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact Number *</Label>
                <Input
                  value={formData.emergency_contact_number}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Relationship *</Label>
                <Input
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save & Transfer to Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}