// src/components/recruitment/HRRecruitmentView.tsx
// HR Manager view: job vacancies and applicants in ONE page.
// Left: open jobs list. Right: applicant table for selected job + schedule interview button.

import { useState, useEffect } from "react";
import { authFetch } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase, Search, Calendar } from "lucide-react";
import type { JobPosting, Applicant } from "@/types/recruitment";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    applied:   "bg-gray-100 text-gray-600",
    screening: "bg-blue-50 text-blue-700",
    interview: "bg-violet-50 text-violet-700",
    offer:     "bg-amber-50 text-amber-700",
    hired:     "bg-emerald-50 text-emerald-700",
    rejected:  "bg-red-50 text-red-500",
  };
  return (
    <Badge className={`${map[status] ?? "bg-muted text-muted-foreground"} border-0 rounded-full text-[10px] capitalize px-1.5`}>
      {status}
    </Badge>
  );
}

// ── Schedule Interview Dialog ─────────────────────────────────────────────────

function QuickScheduleDialog({
  open, applicant, onClose, onSchedule,
}: {
  open: boolean;
  applicant: Applicant;
  onClose: () => void;
  onSchedule: (data: any) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    interview_type: "onsite",
    scheduled_at: "",
    location: "",
    interviewer_id: "",
  });
  const [interviewers, setInterviewers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    authFetch("/api/users?role=Manager,HR Manager").then((r) => r.json()).then((data) => {
      setInterviewers(data.map((u: any) => ({ id: u.id, name: u.name })));
    }).catch(() => {});
  }, []);

  const handleSchedule = async () => {
    if (!form.scheduled_at || !form.interviewer_id) {
      toast({ title: "Date/time and interviewer required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onSchedule({
        applicant_id: applicant.id,
        ...form,
        interviewer_id: parseInt(form.interviewer_id),
        result: "pending",
      });
      toast({ title: "Interview scheduled." });
      onClose();
    } catch {
      toast({ title: "Failed to schedule.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Schedule interview — {applicant.first_name} {applicant.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <Select value={form.interview_type} onValueChange={(v) => setForm((p) => ({ ...p, interview_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone screen</SelectItem>
                <SelectItem value="video">Video call</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date & time</label>
            <Input type="datetime-local" value={form.scheduled_at}
              onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Location / link</label>
            <Input placeholder="Room 2 or Zoom link…" value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Interviewer</label>
            <Select value={form.interviewer_id} onValueChange={(v) => setForm((p) => ({ ...p, interviewer_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {interviewers.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSchedule} disabled={loading}>{loading ? "Scheduling…" : "Schedule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HRRecruitmentView() {
  const [jobs,        setJobs]        = useState<JobPosting[]>([]);
  const [applicants,  setApplicants]  = useState<Applicant[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [search,      setSearch]      = useState("");
  const [scheduling,  setScheduling]  = useState<Applicant | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    authFetch("/api/job-postings?status=open")
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const loadApplicants = async (job: JobPosting) => {
    setSelectedJob(job);
    setLoadingApps(true);
    try {
      const res = await authFetch(`/api/applicants?job_posting_id=${job.id}`);
      setApplicants(await res.json());
    } finally { setLoadingApps(false); }
  };

  const handleSchedule = async (data: any) => {
    const res = await authFetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    // Move applicant to interview stage
    await authFetch(`/api/applicants/${data.applicant_id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "interview" }),
    });
    if (selectedJob) loadApplicants(selectedJob);
  };

  const filteredApplicants = applicants.filter((a) =>
    !search ||
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5 h-full">
      {/* Left: Job list */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Open positions ({jobs.length})
        </p>
        {loadingJobs ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open positions.</p>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => loadApplicants(job)}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                selectedJob?.id === job.id
                  ? "border-primary bg-primary/5"
                  : "border-border/60 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{job.department}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Users className="w-3 h-3" />
                  {job.applications_count ?? 0}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Right: Applicants */}
      <div className="space-y-4">
        {!selectedJob ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Briefcase className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">Select a position to see applicants</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">{selectedJob.title}</h3>
                <p className="text-xs text-muted-foreground">{applicants.length} applicants · {selectedJob.slots} slot{selectedJob.slots !== 1 ? "s" : ""}</p>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-xs"
                  placeholder="Search applicants…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {["Name","Stage","Source","Applied","Actions"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingApps ? (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Loading…</td></tr>
                  ) : filteredApplicants.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No applicants yet.</td></tr>
                  ) : (
                    filteredApplicants.map((a) => (
                      <tr key={a.id} className="border-t border-border/40 hover:bg-muted/20">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{a.first_name} {a.last_name}</p>
                          <p className="text-xs text-muted-foreground">{a.email}</p>
                        </td>
                        <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                        <td className="px-3 py-2.5 text-xs capitalize text-muted-foreground">{a.source}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString("en-PH", { dateStyle: "short" })}
                        </td>
                        <td className="px-3 py-2.5">
                          {["applied","screening"].includes(a.status) && (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 px-2 text-violet-600 hover:bg-violet-50 text-xs"
                              onClick={() => setScheduling(a)}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Schedule interview
                            </Button>
                          )}
                          {a.status === "interview" && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />Interview scheduled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {scheduling && (
        <QuickScheduleDialog
          open={!!scheduling}
          applicant={scheduling}
          onClose={() => setScheduling(null)}
          onSchedule={handleSchedule}
        />
      )}
    </div>
  );
}