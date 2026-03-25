// ─── Enums / Unions ────────────────────────────────────────────────────────────

export type JobStatus = "draft" | "open" | "closed" | "cancelled";

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export type InterviewType = "phone" | "video" | "onsite" | "technical";
export type InterviewResult = "passed" | "failed" | "no_show" | "pending";
export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

// ─── Job Posting ───────────────────────────────────────────────────────────────

export interface JobPosting {
  id: number;
  title: string;
  department: string;
  employment_type: "full_time" | "part_time" | "contractual" | "probationary";
  location: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  requirements: string;
  slots: number;           // how many headcount to fill
  status: JobStatus;
  posted_by: number;
  posted_by_name?: string;
  applications_count?: number;
  created_at: string;
  closes_at?: string;
}

// ─── Application ───────────────────────────────────────────────────────────────

export interface Applicant {
  id: number;
  job_posting_id: number;
  job_title?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  address?: string;
  resume_path?: string;
  cover_letter?: string;
  source: "referral" | "walk_in" | "online" | "agency" | "other";
  status: ApplicationStatus;
  rating?: number;         // 1–5 recruiter rating
  notes?: string;
  applied_at: string;
  created_at: string;
}

// ─── Interview ─────────────────────────────────────────────────────────────────

export interface Interview {
  id: number;
  applicant_id: number;
  applicant_name?: string;
  job_title?: string;
  interview_type: InterviewType;
  scheduled_at: string;   // ISO datetime
  location?: string;      // room name or video link
  interviewer_id: number;
  interviewer_name?: string;
  result: InterviewResult;
  feedback?: string;
  created_at: string;
}

// ─── Offer ─────────────────────────────────────────────────────────────────────

export interface JobOffer {
  id: number;
  applicant_id: number;
  applicant_name?: string;
  job_posting_id: number;
  job_title?: string;
  offered_salary: number;
  start_date: string;
  status: OfferStatus;
  notes?: string;
  offered_by: number;
  offered_by_name?: string;
  expires_at?: string;
  responded_at?: string;
  created_at: string;
}

// ─── Pipeline summary ──────────────────────────────────────────────────────────

export interface PipelineSummary {
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
}

export interface RecruitmentStats {
  open_jobs: number;
  total_applicants: number;
  interviews_this_week: number;
  pending_offers: number;
}