// src/pages/Recruitment.tsx
// COMPLETE REVISED VERSION - WITH HR USERS FIX

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { authFetch } from "@/hooks/api";
import {
  Search, Plus, Edit, Trash2, Calendar, UserCheck, UserX,
  CheckCircle, XCircle, Loader2, Briefcase, Users, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobPosting {
  id: number;
  title: string;
  department: string;
  job_category: string;
  description: string;
  slots: number;
  posted_date?: string;
  deadline?: string;
  status: "open" | "closed";
  created_by: number;
  applicants_count?: number;
  hired_count?: number;
  created_at: string;
}

interface Applicant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  resume_path: string | null;
  job_posting_id: number;
  pipeline_stage: "applied" | "reviewed" | "interview_scheduled" | "interviewed" | "hired" | "rejected";
  notes: string | null;
  hired_at: string | null;
  job_posting?: JobPosting;
  created_at: string;
}

interface Interview {
  id: number;
  applicant_id: number;
  interviewer_id: number;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  feedback: string | null;
  applicant?: Applicant;
  interviewer?: { id: number; name: string; email: string };
  created_at: string;
}

interface TrainingAssignment {
  id: number;
  training_id: number;
  applicant_id: number;
  trainer_id: number | null;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
  training?: { id: number; title: string; description: string };
  applicant?: Applicant;
  trainer?: { id: number; first_name: string; last_name: string; department: string };
}

interface HRUser {
  id: number;
  name: string;
  email: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Front Office", "Housekeeping", "Food & Beverage",
  "Maintenance", "Administration", "Security", "Sales & Marketing",
];

const JOB_CATEGORIES: Record<string, string[]> = {
  "Front Office":    ["Front Desk Agent","Concierge","Reservations Agent","Guest Relations Officer","Bell Staff"],
  "Housekeeping":    ["Room Attendant","Laundry Attendant","Housekeeping Supervisor","Public Area Cleaner"],
  "Food & Beverage": ["Waiter/Waitress","Bartender","Chef de Partie","Sous Chef","Executive Chef","Kitchen Steward"],
  "Maintenance":     ["Maintenance Technician","Electrician","Plumber","Maintenance Supervisor"],
  "Administration":  ["HR Officer","Accounting Staff","Payroll Officer","General Manager","Department Manager","Supervisor"],
  "Security":        ["Security Guard","Security Supervisor"],
  "Sales & Marketing": ["Sales Manager","Marketing Officer","Reservations Manager"],
};

const STAGE_STYLES: Record<string, string> = {
  applied:              "bg-gray-100 text-gray-700",
  reviewed:             "bg-blue-100 text-blue-700",
  interview_scheduled:  "bg-purple-100 text-purple-700",
  interviewed:          "bg-cyan-100 text-cyan-700",
  hired:                "bg-green-100 text-green-700",
  rejected:             "bg-red-100 text-red-700",
};

const STAGE_LABELS: Record<string, string> = {
  applied:             "Applied",
  reviewed:            "Reviewed",
  interview_scheduled: "Interview Scheduled",
  interviewed:         "Interviewed",
  hired:               "Hired",
  rejected:            "Rejected",
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

const safeFetch = async <T,>(url: string): Promise<T[]> => {
  try {
    const res = await authFetch(url);
    const body = await res.json();
    const data = body.data;
    return Array.isArray(data) ? data : (data?.data ?? []);
  } catch {
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════════
// TAB 1 — JOB VACANCIES
// ═══════════════════════════════════════════════════════════════════════

function JobVacanciesTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [dept, setDept] = useState("");
  const [form, setForm] = useState({
    title: "", department: "", job_category: "",
    description: "", slots: "1", deadline: "",
  });

  const load = async () => {
    setLoading(true);
    setJobs(await safeFetch("/api/recruitment/job-postings"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setDept("");
    setForm({ title: "", department: "", job_category: "", description: "", slots: "1", deadline: "" });
    setOpen(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditing(job);
    setDept(job.department);
    setForm({
      title: job.title, department: job.department,
      job_category: job.job_category, description: job.description,
      slots: String(job.slots), deadline: job.deadline ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.department || !form.job_category) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, slots: parseInt(form.slots) };
      const url = editing 
        ? `/api/recruitment/job-postings/${editing.id}`
        : "/api/recruitment/job-postings";
      const method = editing ? "PUT" : "POST";
      
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      
      toast({ title: editing ? "Job updated" : "Job posted" });
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this job posting?")) return;
    try {
      const res = await authFetch(`/api/recruitment/job-postings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Deleted" });
      load();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleStatus = async (job: JobPosting) => {
    try {
      const res = await authFetch(`/api/recruitment/job-postings/${job.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: job.status === "open" ? "closed" : "open" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Job Posting
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No job postings yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Job Title</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-center font-semibold">Slots</th>
                <th className="px-4 py-3 text-center font-semibold">Applicants</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(job => (
                <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{job.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{job.department}</td>
                  <td className="px-4 py-3 text-muted-foreground">{job.job_category}</td>
                  <td className="px-4 py-3 text-center">{job.slots}</td>
                  <td className="px-4 py-3 text-center">{job.applicants_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={cn("text-xs border-0", job.status === "open" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(job)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleStatus(job)}>
                            {job.status === "open" ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => del(job.id)}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Job Posting" : "New Job Posting"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Job Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Select value={form.department} onValueChange={v => { setDept(v); setForm(p => ({ ...p, department: v, job_category: "" })); }}>
              <SelectTrigger><SelectValue placeholder="Select Department *" /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.job_category} onValueChange={v => setForm(p => ({ ...p, job_category: v }))} disabled={!dept}>
              <SelectTrigger><SelectValue placeholder={dept ? "Select Job Category *" : "Select department first"} /></SelectTrigger>
              <SelectContent>{(JOB_CATEGORIES[dept] ?? []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Slots" min="1" value={form.slots} onChange={e => setForm(p => ({ ...p, slots: e.target.value }))} />
              <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
            <textarea className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Job Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Post Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2 — APPLICANT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

function ApplicantManagementTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [selApp, setSelApp] = useState<Applicant | null>(null);
  const [hrUsers, setHrUsers] = useState<HRUser[]>([]);
  const [acting, setActing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ first_name: "", last_name: "", email: "", phone: "", job_posting_id: "" });
  const [schedForm, setSchedForm] = useState({ interviewer_id: "", scheduled_at: "" });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const [apps, jbs] = await Promise.all([
      safeFetch<Applicant>("/api/recruitment/applicants"),
      safeFetch<JobPosting>("/api/recruitment/job-postings"),
    ]);
    setApplicants(apps);
    setJobs(jbs);
    setLoading(false);
  };

  // Fetch HR users from employees endpoint
  const fetchHrUsers = async () => {
    try {
      const res = await authFetch("/api/employees");
      const body = await res.json();
      const employees = body.data?.data || body.data || [];
      
      // Filter employees with HR role
      const hrEmployees = employees.filter((e: any) => e.role === 'HR');
      
      const hrUserList = hrEmployees.map((e: any) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        email: e.email
      }));
      
      console.log("HR Users found:", hrUserList);
      setHrUsers(hrUserList);
      
      // If no HR users found, add fallback for testing
      if (hrUserList.length === 0) {
        console.warn("No HR users found, using fallback");
        setHrUsers([
          { id: 2, name: "HR Officer", email: "hr@hrharmony.com" },
          { id: 7, name: "Ana Reyes", email: "ana.reyes@bluelotus.com" },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch HR users:", error);
      // Fallback HR users
      setHrUsers([
        { id: 2, name: "HR Officer", email: "hr@hrharmony.com" },
        { id: 7, name: "Ana Reyes", email: "ana.reyes@bluelotus.com" },
      ]);
    }
  };

  useEffect(() => { 
    load(); 
    fetchHrUsers();
  }, []);

  const addApplicant = async () => {
    // Validate
    if (!addForm.first_name.trim()) {
        toast({ title: "First name is required", variant: "destructive" });
        return;
    }
    if (!addForm.last_name.trim()) {
        toast({ title: "Last name is required", variant: "destructive" });
        return;
    }
    if (!addForm.email.trim()) {
        toast({ title: "Email is required", variant: "destructive" });
        return;
    }
    if (!addForm.job_posting_id) {
        toast({ title: "Please select a job posting", variant: "destructive" });
        return;
    }
    
    setSaving(true);
    try {
        // Prepare the data
        const payload = {
            first_name: addForm.first_name.trim(),
            last_name: addForm.last_name.trim(),
            email: addForm.email.trim(),
            phone: addForm.phone?.trim() || '',
            job_posting_id: Number(addForm.job_posting_id)
        };
        
        console.log("Sending payload:", JSON.stringify(payload, null, 2));
        
        const res = await authFetch("/api/recruitment/applicants", { 
            method: "POST", 
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        console.log("Response status:", res.status);
        console.log("Response data:", data);
        
        if (res.ok && data.success) {
            toast({ title: "Applicant added successfully" });
            setAddOpen(false);
            setAddForm({ first_name: "", last_name: "", email: "", phone: "", job_posting_id: "" });
            setResumeFile(null);
            load(); // Refresh the list
        } else {
            // Show validation errors
            if (data.errors) {
                const errorMessages = Object.values(data.errors).flat().join('\n');
                toast({ title: "Validation Error", description: errorMessages, variant: "destructive" });
            } else {
                toast({ title: data.message || "Failed to add applicant", variant: "destructive" });
            }
        }
    } catch (err) {
        console.error('Add applicant error:', err);
        toast({ title: err instanceof Error ? err.message : "Failed to add applicant", variant: "destructive" });
    } finally {
        setSaving(false);
    }
  };

  const scheduleInterview = async () => {
    if (!selApp || !schedForm.interviewer_id || !schedForm.scheduled_at) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/recruitment/interviews", {
        method: "POST",
        body: JSON.stringify({ applicant_id: selApp.id, ...schedForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Interview scheduled" });
      setSchedOpen(false);
      setSelApp(null);
      setSchedForm({ interviewer_id: "", scheduled_at: "" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hireApplicant = async (app: Applicant) => {
    setActing(app.id);
    try {
      const res = await authFetch(`/api/recruitment/applicants/${app.id}/hire`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Applicant hired! Training record created." });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const rejectApplicant = async (app: Applicant) => {
    setActing(app.id);
    try {
      const res = await authFetch(`/api/recruitment/applicants/${app.id}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Applicant rejected" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const updateStage = async (app: Applicant, stage: string) => {
    setActing(app.id);
    try {
      const res = await authFetch(`/api/recruitment/applicants/${app.id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ pipeline_stage: stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const filtered = applicants.filter(a =>
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {canManage && (
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Applicant
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No applicants yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Applicant</th>
                <th className="px-4 py-3 text-left font-semibold">Applied For</th>
                <th className="px-4 py-3 text-left font-semibold">Stage</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{app.first_name} {app.last_name}</p>
                    <p className="text-xs text-muted-foreground">{app.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {app.job_posting?.title ?? "—"}<br />
                    <span className="text-muted-foreground/60">{app.job_posting?.department}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border-0", STAGE_STYLES[app.pipeline_stage])}>
                      {STAGE_LABELS[app.pipeline_stage]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {acting === app.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {acting !== app.id && app.pipeline_stage === "applied" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStage(app, "reviewed")}>Mark Reviewed</Button>
                      )}
                      {acting !== app.id && app.pipeline_stage === "reviewed" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setSelApp(app); setSchedOpen(true); }}>
                          <Calendar className="h-3 w-3 mr-1" /> Schedule Interview
                        </Button>
                      )}
                      {acting !== app.id && app.pipeline_stage === "interview_scheduled" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStage(app, "interviewed")}>Mark Interviewed</Button>
                      )}
                      {acting !== app.id && app.pipeline_stage === "interviewed" && (
                        <>
                          <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={() => hireApplicant(app)}>
                            <UserCheck className="h-3 w-3 mr-1" /> Hire
                          </Button>
                          <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => rejectApplicant(app)}>
                            <UserX className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {(app.pipeline_stage === "hired" || app.pipeline_stage === "rejected") && (
                        <span className="text-xs text-muted-foreground capitalize">{app.pipeline_stage}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Applicant Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Applicant</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First Name *" value={addForm.first_name} onChange={e => setAddForm(p => ({ ...p, first_name: e.target.value }))} />
              <Input placeholder="Last Name *" value={addForm.last_name} onChange={e => setAddForm(p => ({ ...p, last_name: e.target.value }))} />
            </div>
            <Input type="email" placeholder="Email *" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
            <Input placeholder="Phone" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} />
            <Select value={addForm.job_posting_id} onValueChange={v => setAddForm(p => ({ ...p, job_posting_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select Job Posting *" /></SelectTrigger>
              <SelectContent>
                {jobs.filter(j => j.status === "open").map(j => (
                  <SelectItem key={j.id} value={String(j.id)}>{j.title} — {j.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="text-xs text-muted-foreground">Resume (PDF/DOC, optional)</label>
              <Input type="file" accept=".pdf,.doc,.docx" className="mt-1" onChange={e => setResumeFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addApplicant} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={schedOpen} onOpenChange={setSchedOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            {selApp && <p className="text-sm text-muted-foreground">{selApp.first_name} {selApp.last_name}</p>}
          </DialogHeader>
          <div className="space-y-3">
            <Select value={schedForm.interviewer_id} onValueChange={v => setSchedForm(p => ({ ...p, interviewer_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select Interviewer" /></SelectTrigger>
              <SelectContent>
                {hrUsers.length === 0
                  ? <SelectItem value="0" disabled>No HR users found</SelectItem>
                  : hrUsers.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="datetime-local" value={schedForm.scheduled_at} onChange={e => setSchedForm(p => ({ ...p, scheduled_at: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedOpen(false)}>Cancel</Button>
            <Button onClick={scheduleInterview} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3 — SCHEDULED INTERVIEWS
// ═══════════════════════════════════════════════════════════════════════

function ScheduledInterviewsTab() {
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setInterviews(await safeFetch("/api/recruitment/interviews"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const complete = async (id: number) => {
    setCompleting(id);
    try {
      const res = await authFetch(`/api/recruitment/interviews/${id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Interview completed" });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setCompleting(null);
    }
  };

  const statusStyles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No interviews scheduled</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Applicant</th>
                <th className="px-4 py-3 text-left font-semibold">Position</th>
                <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                <th className="px-4 py-3 text-left font-semibold">Interviewer</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {interviews.map(iv => (
                <tr key={iv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{iv.applicant?.first_name} {iv.applicant?.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{iv.applicant?.job_posting?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{iv.interviewer?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border-0", statusStyles[iv.status])}>{iv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {iv.status === "scheduled" && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                        disabled={completing === iv.id}
                        onClick={() => complete(iv.id)}>
                        {completing === iv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                        Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 4 — TRAINING PROGRAMS
// ═══════════════════════════════════════════════════════════════════════

function TrainingProgramsTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [employees, setEmployees] = useState<{ id: number; first_name: string; last_name: string; department: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [selAssignment, setSelAssignment] = useState<TrainingAssignment | null>(null);
  const [trainerId, setTrainerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [assgn, emps] = await Promise.all([
      safeFetch<TrainingAssignment>("/api/recruitment/training-assignments"),
      safeFetch<{ id: number; first_name: string; last_name: string; department: string }>("/api/employees"),
    ]);
    setAssignments(assgn);
    setEmployees(emps);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const assignTrainer = async () => {
    if (!selAssignment || !trainerId) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/recruitment/training-assignments/${selAssignment.id}/assign-trainer`, {
        method: "POST",
        body: JSON.stringify({ trainer_id: parseInt(trainerId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Trainer assigned" });
      setTrainerOpen(false);
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const completeTraining = async (id: number) => {
    setCompleting(id);
    try {
      const res = await authFetch(`/api/recruitment/training-assignments/${id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: "Training completed! New hire record created." });
      load();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setCompleting(null);
    }
  };

  const statusColors = { 
    pending: "bg-yellow-100 text-yellow-700", 
    in_progress: "bg-blue-100 text-blue-700", 
    completed: "bg-green-100 text-green-700" 
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No training records yet</p>
          <p className="text-sm text-muted-foreground mt-1">Training is auto-created when an applicant is hired</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Training</th>
                <th className="px-4 py-3 text-left font-semibold">New Hire</th>
                <th className="px-4 py-3 text-left font-semibold">Trainer</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{a.training?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.employee?.first_name} {a.employee?.last_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.trainer ? `${a.trainer.first_name} ${a.trainer.last_name}` : <span className="text-orange-500 text-xs">Not assigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border-0", statusColors[a.status])}>
                      {a.status === "in_progress" ? "In Progress" : a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {a.status === "pending" && canManage && (
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                          onClick={() => { setSelAssignment(a); setTrainerId(""); setTrainerOpen(true); }}>
                          <UserCheck className="h-3 w-3" /> Assign Trainer
                        </Button>
                      )}
                      {a.status === "in_progress" && canManage && (
                        <Button size="sm" className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700"
                          disabled={completing === a.id}
                          onClick={() => completeTraining(a.id)}>
                          {completing === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Complete Training
                        </Button>
                      )}
                      {a.status === "completed" && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">✓ Ready for Transfer</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={trainerOpen} onOpenChange={setTrainerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Trainer</DialogTitle></DialogHeader>
          <Select value={trainerId} onValueChange={setTrainerId}>
            <SelectTrigger><SelectValue placeholder="Select Trainer" /></SelectTrigger>
            <SelectContent>
              {employees.map(e => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.first_name} {e.last_name} — {e.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainerOpen(false)}>Cancel</Button>
            <Button onClick={assignTrainer} disabled={saving || !trainerId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function Recruitment() {
  const { user } = useAuth();
  const canManage = user?.role === "Admin" || user?.role === "HR";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-foreground">Recruitment</h1>
        <p className="text-muted-foreground mt-1">Job postings, applicant pipeline, interviews, and training</p>
      </div>

      <Tabs defaultValue="vacancies">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vacancies"><Briefcase className="h-4 w-4 mr-2" /> Job Vacancies</TabsTrigger>
          <TabsTrigger value="applicants"><Users className="h-4 w-4 mr-2" /> Applicants</TabsTrigger>
          <TabsTrigger value="interviews"><Calendar className="h-4 w-4 mr-2" /> Interviews</TabsTrigger>
          <TabsTrigger value="training"><GraduationCap className="h-4 w-4 mr-2" /> Training</TabsTrigger>
        </TabsList>

        <TabsContent value="vacancies" className="mt-6"><JobVacanciesTab canManage={canManage} /></TabsContent>
        <TabsContent value="applicants" className="mt-6"><ApplicantManagementTab canManage={canManage} /></TabsContent>
        <TabsContent value="interviews" className="mt-6"><ScheduledInterviewsTab /></TabsContent>
        <TabsContent value="training" className="mt-6"><TrainingProgramsTab canManage={canManage} /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}