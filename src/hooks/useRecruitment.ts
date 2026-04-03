import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type {
  JobPosting,
  Applicant,
  Interview,
  JobOffer,
  RecruitmentStats,
  PipelineSummary,
  ApplicationStatus,
} from "@/types/recruitment";

const BASE = "/api";

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useRecruitment() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Job Postings ─────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async (status?: string) => {
    setIsLoading(true);
    try {
      const params = status ? `?status=${status}` : "";
      const res = await authFetch(`${BASE}/job-postings${params}`);
      const response = await res.json();
      setJobs(Array.isArray(response) ? response : response.data || []);
    } catch (e: any) {
      setError(e.message);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createJob = useCallback(async (payload: Partial<JobPosting>) => {
    const res = await authFetch(`${BASE}/job-postings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create job posting");
    return res.json();
  }, []);

  const updateJob = useCallback(
    async (id: number, payload: Partial<JobPosting>) => {
      const res = await authFetch(`${BASE}/job-postings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update job posting");
      return res.json();
    },
    []
  );

  const closeJob = useCallback(async (id: number) => {
    const res = await authFetch(`${BASE}/job-postings/${id}/close`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to close job");
    return res.json();
  }, []);

  // ── Applicants ───────────────────────────────────────────────────────────────

  const fetchApplicants = useCallback(
    async (jobId?: number, status?: ApplicationStatus) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (jobId) params.set("job_posting_id", String(jobId));
        if (status) params.set("status", status);
        const res = await authFetch(
          `${BASE}/applicants?${params.toString()}`
        );
        const response = await res.json();
        setApplicants(Array.isArray(response) ? response : response.data || []);
      } catch (e: any) {
        setError(e.message);
        setApplicants([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createApplicant = useCallback(
    async (payload: Partial<Applicant>) => {
      const res = await authFetch(`${BASE}/applicants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add applicant");
      return res.json();
    },
    []
  );

  const updateApplicantStatus = useCallback(
    async (id: number, status: ApplicationStatus, notes?: string) => {
      const res = await authFetch(`${BASE}/applicants/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    []
  );

  const rateApplicant = useCallback(
    async (id: number, rating: number, notes?: string) => {
      const res = await authFetch(`${BASE}/applicants/${id}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, notes }),
      });
      if (!res.ok) throw new Error("Failed to rate applicant");
      return res.json();
    },
    []
  );

  // ── Interviews ───────────────────────────────────────────────────────────────

  const fetchInterviews = useCallback(async (applicantId?: number) => {
    setIsLoading(true);
    try {
      const params = applicantId ? `?applicant_id=${applicantId}` : "";
      const res = await authFetch(`${BASE}/interviews${params}`);
      const response = await res.json();
      setInterviews(Array.isArray(response) ? response : response.data || []);
    } catch (e: any) {
      setError(e.message);
      setInterviews([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleInterview = useCallback(
    async (payload: Partial<Interview>) => {
      const res = await authFetch(`${BASE}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to schedule interview");
      return res.json();
    },
    []
  );

  const updateInterviewResult = useCallback(
    async (id: number, result: Interview["result"], feedback?: string) => {
      const res = await authFetch(`${BASE}/interviews/${id}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, feedback }),
      });
      if (!res.ok) throw new Error("Failed to update interview result");
      return res.json();
    },
    []
  );

  // ── Offers ───────────────────────────────────────────────────────────────────

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${BASE}/job-offers`);
      const response = await res.json();
      setOffers(Array.isArray(response) ? response : response.data || []);
    } catch (e: any) {
      setError(e.message);
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createOffer = useCallback(async (payload: Partial<JobOffer>) => {
    const res = await authFetch(`${BASE}/job-offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create offer");
    return res.json();
  }, []);

  const respondToOffer = useCallback(
    async (id: number, status: "accepted" | "declined") => {
      const res = await authFetch(`${BASE}/job-offers/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to respond to offer");
      return res.json();
    },
    []
  );

  // ── Convert accepted offer → new hire ────────────────────────────────────────

  const convertToNewHire = useCallback(async (offerId: number) => {
    const res = await authFetch(`${BASE}/job-offers/${offerId}/convert`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to convert to new hire");
    return res.json();
  }, []);

  // ── Stats + pipeline ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE}/recruitment/stats`);
      const data = await res.json();
      setStats(data);
    } catch {}
  }, []);

  const fetchPipeline = useCallback(async (jobId?: number) => {
    try {
      const params = jobId ? `?job_posting_id=${jobId}` : "";
      const res = await authFetch(`${BASE}/recruitment/pipeline${params}`);
      const data = await res.json();
      setPipeline(data);
    } catch {}
  }, []);

  return {
    // state
    jobs,
    applicants,
    interviews,
    offers,
    stats,
    pipeline,
    isLoading,
    error,
    // job actions
    fetchJobs,
    createJob,
    updateJob,
    closeJob,
    // applicant actions
    fetchApplicants,
    createApplicant,
    updateApplicantStatus,
    rateApplicant,
    // interview actions
    fetchInterviews,
    scheduleInterview,
    updateInterviewResult,
    // offer actions
    fetchOffers,
    createOffer,
    respondToOffer,
    convertToNewHire,
    // analytics
    fetchStats,
    fetchPipeline,
  };
}