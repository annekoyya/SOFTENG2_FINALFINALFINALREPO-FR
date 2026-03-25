import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Star, ChevronRight, Calendar, Gift,
  ThumbsUp, ThumbsDown, Phone, Video, MapPin, Laptop,
} from "lucide-react";
import type {
  Applicant, ApplicationStatus, Interview, JobOffer, JobPosting,
} from "@/types/recruitment";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: "applied",   label: "Applied",   color: "bg-gray-100 text-gray-700" },
  { key: "screening", label: "Screening", color: "bg-blue-50 text-blue-700" },
  { key: "interview", label: "Interview", color: "bg-violet-50 text-violet-700" },
  { key: "offer",     label: "Offer",     color: "bg-amber-50 text-amber-700" },
  { key: "hired",     label: "Hired",     color: "bg-emerald-50 text-emerald-700" },
];

const SOURCE_LABELS: Record<Applicant["source"], string> = {
  referral: "Referral", walk_in: "Walk-in",
  online: "Online", agency: "Agency", other: "Other",
};

const INTERVIEW_TYPE_ICONS: Record<Interview["interview_type"], React.ReactNode> = {
  phone:     <Phone className="w-3.5 h-3.5" />,
  video:     <Video className="w-3.5 h-3.5" />,
  onsite:    <MapPin className="w-3.5 h-3.5" />,
  technical: <Laptop className="w-3.5 h-3.5" />,
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function StarRating({ value, onChange }: { value?: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          className={`${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              value && s <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Add Applicant Dialog ──────────────────────────────────────────────────────

interface AddApplicantDialogProps {
  open: boolean;
  onClose: () => void;
  jobId: number;
  onAdd: (data: Partial<Applicant>) => Promise<void>;
}

function AddApplicantDialog({ open, onClose, jobId, onAdd }: AddApplicantDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    source: "online" as Applicant["source"], cover_letter: "",
  });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast({ title: "Name and email are required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onAdd({ ...form, job_posting_id: jobId, status: "applied" });
      toast({ title: "Applicant added." });
      setForm({ first_name: "", last_name: "", email: "", phone: "", source: "online", cover_letter: "" });
      onClose();
    } catch {
      toast({ title: "Failed to add applicant.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add applicant</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">First name</label>
            <Input value={form.first_name} onChange={f("first_name")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Last name</label>
            <Input value={form.last_name} onChange={f("last_name")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={form.email} onChange={f("email")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Phone</label>
            <Input value={form.phone} onChange={f("phone")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Source</label>
            <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cover letter / notes (optional)</label>
            <Textarea rows={3} value={form.cover_letter} onChange={f("cover_letter")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Adding…" : "Add applicant"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Schedule Interview Dialog ─────────────────────────────────────────────────

interface ScheduleInterviewDialogProps {
  open: boolean;
  onClose: () => void;
  applicant: Applicant;
  interviewers: { id: number; full_name: string }[];
  onSchedule: (data: Partial<Interview>) => Promise<void>;
}

function ScheduleInterviewDialog({
  open, onClose, applicant, interviewers, onSchedule,
}: ScheduleInterviewDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    interview_type: "onsite" as Interview["interview_type"],
    scheduled_at: "",
    location: "",
    interviewer_id: "",
  });

  const handleSubmit = async () => {
    if (!form.scheduled_at || !form.interviewer_id) {
      toast({ title: "Date/time and interviewer are required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onSchedule({ ...form, applicant_id: applicant.id, interviewer_id: parseInt(form.interviewer_id), result: "pending" });
      toast({ title: "Interview scheduled." });
      onClose();
    } catch {
      toast({ title: "Failed to schedule interview.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule interview — {applicant.first_name} {applicant.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Interview type</label>
            <Select value={form.interview_type} onValueChange={(v) => setForm((p) => ({ ...p, interview_type: v as any }))}>
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
            <Input placeholder="e.g. HR Office Room 2 or Zoom link"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Interviewer</label>
            <Select value={form.interviewer_id} onValueChange={(v) => setForm((p) => ({ ...p, interviewer_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {interviewers.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Scheduling…" : "Schedule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Make Offer Dialog ─────────────────────────────────────────────────────────

interface MakeOfferDialogProps {
  open: boolean;
  onClose: () => void;
  applicant: Applicant;
  job: JobPosting;
  onOffer: (data: Partial<JobOffer>) => Promise<void>;
}

function MakeOfferDialog({ open, onClose, applicant, job, onOffer }: MakeOfferDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    offered_salary: job.salary_max?.toString() ?? "",
    start_date: "",
    notes: "",
    expires_at: "",
  });

  const handleSubmit = async () => {
    if (!form.offered_salary || !form.start_date) {
      toast({ title: "Salary and start date required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onOffer({
        applicant_id: applicant.id,
        job_posting_id: job.id,
        offered_salary: parseFloat(form.offered_salary),
        start_date: form.start_date,
        notes: form.notes,
        expires_at: form.expires_at || undefined,
        status: "pending",
      });
      toast({ title: "Offer sent." });
      onClose();
    } catch {
      toast({ title: "Failed to send offer.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make offer — {applicant.first_name} {applicant.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Offered salary (₱/month)</label>
            <Input placeholder="e.g. 22000" value={form.offered_salary}
              onChange={(e) => setForm((p) => ({ ...p, offered_salary: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start date</label>
            <Input type="date" value={form.start_date}
              onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Offer expires (optional)</label>
            <Input type="date" value={form.expires_at}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea rows={2} value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Sending…" : "Send offer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Applicant Card ────────────────────────────────────────────────────────────

interface ApplicantCardProps {
  applicant: Applicant;
  onClick: () => void;
  onMoveForward: () => void;
  onReject: () => void;
  canManage: boolean;
}

function ApplicantCard({ applicant, onClick, onMoveForward, onReject, canManage }: ApplicantCardProps) {
  const isTerminal = applicant.status === "hired" || applicant.status === "rejected" || applicant.status === "withdrawn";

  return (
    <div
      className="rounded-lg border border-border/60 bg-card p-3 hover:border-border transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
          {initials(`${applicant.first_name} ${applicant.last_name}`)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {applicant.first_name} {applicant.last_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{applicant.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge className="bg-muted text-muted-foreground border-0 text-[10px] rounded-full px-1.5">
              {SOURCE_LABELS[applicant.source]}
            </Badge>
            {applicant.rating && <StarRating value={applicant.rating} />}
          </div>
        </div>
      </div>
      {canManage && !isTerminal && (
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm" variant="ghost"
            className="h-6 px-2 text-[11px] text-emerald-600 hover:bg-emerald-50 flex-1"
            onClick={(e) => { e.stopPropagation(); onMoveForward(); }}
          >
            <ChevronRight className="w-3 h-3 mr-0.5" />
            Move forward
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-6 px-2 text-[11px] text-red-500 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onReject(); }}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Applicant Detail Sheet ────────────────────────────────────────────────────

interface ApplicantDetailSheetProps {
  applicant: Applicant | null;
  job: JobPosting;
  interviews: Interview[];
  offers: JobOffer[];
  interviewers: { id: number; full_name: string }[];
  canManage: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: ApplicationStatus, notes?: string) => Promise<void>;
  onRate: (id: number, rating: number) => Promise<void>;
  onScheduleInterview: (data: Partial<Interview>) => Promise<void>;
  onMakeOffer: (data: Partial<JobOffer>) => Promise<void>;
  onConvertToHire: (offerId: number) => Promise<void>;
  onRefresh: () => void;
}

function ApplicantDetailSheet({
  applicant, job, interviews, offers, interviewers, canManage,
  onClose, onStatusChange, onRate, onScheduleInterview, onMakeOffer, onConvertToHire, onRefresh,
}: ApplicantDetailSheetProps) {
  const { toast } = useToast();
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  if (!applicant) return null;

  const applicantInterviews = interviews.filter((i) => i.applicant_id === applicant.id);
  const applicantOffer = offers.find((o) => o.applicant_id === applicant.id);
  const isHired = applicant.status === "hired";
  const isTerminal = ["hired", "rejected", "withdrawn"].includes(applicant.status);

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onStatusChange(applicant.id, "rejected");
      toast({ title: "Applicant rejected." });
      onRefresh();
      onClose();
    } catch {
      toast({ title: "Failed.", variant: "destructive" });
    } finally { setRejecting(false); }
  };

  const handleConvert = async () => {
    if (!applicantOffer) return;
    try {
      await onConvertToHire(applicantOffer.id);
      toast({ title: "Converted to new hire! Check the New Hire onboarding queue." });
      onRefresh();
      onClose();
    } catch {
      toast({ title: "Failed to convert.", variant: "destructive" });
    }
  };

  return (
    <Sheet open={!!applicant} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
              {initials(`${applicant.first_name} ${applicant.last_name}`)}
            </div>
            <div>
              <p>{applicant.first_name} {applicant.last_name}</p>
              <p className="text-sm font-normal text-muted-foreground">{applicant.email}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-5">
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p>{applicant.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Source</p>
            <p>{SOURCE_LABELS[applicant.source]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Applied</p>
            <p>{new Date(applicant.applied_at ?? applicant.created_at).toLocaleDateString("en-PH")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stage</p>
            <p className="capitalize font-medium">{applicant.status}</p>
          </div>
        </div>

        {/* Rating */}
        {canManage && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1.5">Recruiter rating</p>
            <StarRating value={applicant.rating} onChange={(r) => onRate(applicant.id, r)} />
          </div>
        )}

        {/* Cover letter / notes */}
        {applicant.cover_letter && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">Notes / cover letter</p>
            <p className="text-sm bg-muted/40 rounded-lg p-3 whitespace-pre-wrap">{applicant.cover_letter}</p>
          </div>
        )}

        {/* Interviews */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Interviews</p>
            {canManage && !isTerminal && applicant.status !== "applied" && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => setShowInterviewDialog(true)}>
                <Calendar className="w-3 h-3" />
                Schedule
              </Button>
            )}
          </div>
          {applicantInterviews.length === 0 ? (
            <p className="text-xs text-muted-foreground">No interviews scheduled.</p>
          ) : (
            <div className="space-y-2">
              {applicantInterviews.map((iv) => (
                <div key={iv.id} className="flex items-center gap-2 text-sm rounded-lg border border-border/60 p-2.5">
                  <span className="text-muted-foreground">{INTERVIEW_TYPE_ICONS[iv.interview_type]}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium capitalize">{iv.interview_type} interview</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(iv.scheduled_at).toLocaleString("en-PH")}
                      {iv.location ? ` · ${iv.location}` : ""}
                    </p>
                  </div>
                  <Badge className={`text-[10px] rounded-full px-1.5 border-0 ${
                    iv.result === "passed" ? "bg-emerald-50 text-emerald-700" :
                    iv.result === "failed" ? "bg-red-50 text-red-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {iv.result}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Job offer</p>
            {canManage && !isTerminal && applicant.status === "interview" && !applicantOffer && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => setShowOfferDialog(true)}>
                <Gift className="w-3 h-3" />
                Make offer
              </Button>
            )}
          </div>
          {!applicantOffer ? (
            <p className="text-xs text-muted-foreground">No offer yet.</p>
          ) : (
            <div className="rounded-lg border border-border/60 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Offered salary</span>
                <span className="font-semibold text-emerald-700">
                  ₱{applicantOffer.offered_salary.toLocaleString("en-PH")}/mo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Start date</span>
                <span>{new Date(applicantOffer.start_date).toLocaleDateString("en-PH")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Status</span>
                <Badge className={`text-[10px] rounded-full px-1.5 border ${
                  applicantOffer.status === "accepted" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  applicantOffer.status === "declined" ? "bg-red-50 text-red-600 border-red-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {applicantOffer.status}
                </Badge>
              </div>
              {/* Convert to new hire if offer accepted */}
              {applicantOffer.status === "accepted" && !isHired && canManage && (
                <Button className="w-full mt-2 gap-1.5" size="sm" onClick={handleConvert}>
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Convert to new hire
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {canManage && !isTerminal && (
          <div className="flex gap-2">
            {applicant.status === "applied" && (
              <Button className="flex-1" size="sm"
                onClick={() => onStatusChange(applicant.id, "screening").then(onRefresh)}>
                Move to screening
              </Button>
            )}
            {applicant.status === "screening" && (
              <Button className="flex-1" size="sm"
                onClick={() => onStatusChange(applicant.id, "interview").then(onRefresh)}>
                Move to interview
              </Button>
            )}
            {applicant.status === "offer" && !applicantOffer && (
              <Button className="flex-1" size="sm" onClick={() => setShowOfferDialog(true)}>
                Make offer
              </Button>
            )}
            <Button variant="outline" size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              disabled={rejecting}
              onClick={handleReject}>
              <ThumbsDown className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {showInterviewDialog && (
          <ScheduleInterviewDialog
            open={showInterviewDialog}
            onClose={() => setShowInterviewDialog(false)}
            applicant={applicant}
            interviewers={interviewers}
            onSchedule={async (data) => {
              await onScheduleInterview(data);
              await onStatusChange(applicant.id, "interview");
              onRefresh();
              setShowInterviewDialog(false);
            }}
          />
        )}
        {showOfferDialog && (
          <MakeOfferDialog
            open={showOfferDialog}
            onClose={() => setShowOfferDialog(false)}
            applicant={applicant}
            job={job}
            onOffer={async (data) => {
              await onMakeOffer(data);
              await onStatusChange(applicant.id, "offer");
              onRefresh();
              setShowOfferDialog(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Pipeline Component ───────────────────────────────────────────────────

interface ApplicantPipelineProps {
  job: JobPosting;
  applicants: Applicant[];
  interviews: Interview[];
  offers: JobOffer[];
  interviewers: { id: number; full_name: string }[];
  isLoading: boolean;
  canManage: boolean;
  onAddApplicant: (data: Partial<Applicant>) => Promise<void>;
  onStatusChange: (id: number, status: ApplicationStatus, notes?: string) => Promise<void>;
  onRate: (id: number, rating: number) => Promise<void>;
  onScheduleInterview: (data: Partial<Interview>) => Promise<void>;
  onMakeOffer: (data: Partial<JobOffer>) => Promise<void>;
  onConvertToHire: (offerId: number) => Promise<void>;
  onRefresh: () => void;
}

const NEXT_STAGE: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  applied: "screening",
  screening: "interview",
  interview: "offer",
  offer: "hired",
};

export default function ApplicantPipeline({
  job, applicants, interviews, offers, interviewers,
  isLoading, canManage,
  onAddApplicant, onStatusChange, onRate, onScheduleInterview, onMakeOffer, onConvertToHire, onRefresh,
}: ApplicantPipelineProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const stageApplicants = (key: ApplicationStatus) =>
    applicants.filter((a) => a.status === key);

  const handleMoveForward = async (applicant: Applicant) => {
    const next = NEXT_STAGE[applicant.status];
    if (!next) return;
    try {
      await onStatusChange(applicant.id, next);
      toast({ title: `Moved to ${next}.` });
      onRefresh();
    } catch {
      toast({ title: "Failed to move applicant.", variant: "destructive" });
    }
  };

  const handleReject = async (applicant: Applicant) => {
    try {
      await onStatusChange(applicant.id, "rejected");
      toast({ title: "Applicant rejected." });
      onRefresh();
    } catch {
      toast({ title: "Failed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Add applicant */}
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add applicant
          </Button>
        </div>
      )}

      {/* Pipeline columns */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
      ) : (
        <div className="grid grid-cols-5 gap-3 min-h-[400px]">
          {PIPELINE_STAGES.map((stage) => {
            const cards = stageApplicants(stage.key);
            return (
              <div key={stage.key} className="space-y-2">
                <div className={`rounded-lg px-2.5 py-1.5 flex items-center justify-between ${stage.color}`}>
                  <span className="text-xs font-medium">{stage.label}</span>
                  <span className="text-xs font-semibold">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((a) => (
                    <ApplicantCard
                      key={a.id}
                      applicant={a}
                      canManage={canManage}
                      onClick={() => setSelectedApplicant(a)}
                      onMoveForward={() => handleMoveForward(a)}
                      onReject={() => handleReject(a)}
                    />
                  ))}
                  {cards.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/50 text-center py-4">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddApplicantDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        jobId={job.id}
        onAdd={async (data) => { await onAddApplicant(data); onRefresh(); }}
      />

      <ApplicantDetailSheet
        applicant={selectedApplicant}
        job={job}
        interviews={interviews}
        offers={offers}
        interviewers={interviewers}
        canManage={canManage}
        onClose={() => setSelectedApplicant(null)}
        onStatusChange={onStatusChange}
        onRate={onRate}
        onScheduleInterview={onScheduleInterview}
        onMakeOffer={onMakeOffer}
        onConvertToHire={onConvertToHire}
        onRefresh={onRefresh}
      />
    </div>
  );
}