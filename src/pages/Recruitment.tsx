import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecruitment } from "@/hooks/useRecruitment";
import JobPostingsPanel from "@/components/recruitment/JobPostingsPanel";
import ApplicantPipeline from "@/components/recruitment/ApplicantPipeline";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Briefcase, Users, Calendar, Gift } from "lucide-react";
import type { JobPosting } from "@/types/recruitment";

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
      <div>
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Recruitment() {
  const { user } = useAuth();
  const canManage = ["Admin", "HR Manager"].includes(user?.role ?? "");

  const {
    jobs, applicants, interviews, offers, stats, isLoading,
    fetchJobs, createJob, updateJob, closeJob,
    fetchApplicants, createApplicant, updateApplicantStatus, rateApplicant,
    fetchInterviews, scheduleInterview,
    fetchOffers, createOffer, convertToNewHire,
    fetchStats,
  } = useRecruitment();

  // HR users who can interview — ideally fetched from /api/users?role=HR,Manager
  // For now we derive from auth; wire up a real fetch in production
  const [interviewers] = useState<{ id: number; full_name: string }[]>([]);

  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Initial load
  useEffect(() => {
    fetchJobs();
    fetchStats();
    fetchOffers();
  }, [fetchJobs, fetchStats, fetchOffers]);

  // When job selected, load its applicants + interviews
  useEffect(() => {
    if (selectedJob) {
      fetchApplicants(selectedJob.id);
      fetchInterviews();
    }
  }, [selectedJob, fetchApplicants, fetchInterviews]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {selectedJob ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="sm"
                className="gap-1 text-muted-foreground hover:text-foreground -ml-2"
                onClick={() => setSelectedJob(null)}
              >
                <ChevronLeft className="w-4 h-4" />
                All jobs
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{selectedJob.title}</span>
              <span className="text-muted-foreground text-sm">— {selectedJob.department}</span>
            </div>
          ) : (
            <h1 className="text-xl font-semibold">Recruitment</h1>
          )}
        </div>
      </div>

      {/* Stats (only on list view) */}
      {!selectedJob && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Briefcase} label="Open positions" value={stats.open_jobs}
            color="bg-blue-50 text-blue-600" />
          <StatCard icon={Users} label="Total applicants" value={stats.total_applicants}
            color="bg-violet-50 text-violet-600" />
          <StatCard icon={Calendar} label="Interviews this week" value={stats.interviews_this_week}
            color="bg-amber-50 text-amber-600" />
          <StatCard icon={Gift} label="Pending offers" value={stats.pending_offers}
            color="bg-emerald-50 text-emerald-600" />
        </div>
      )}

      {/* Main content */}
      {!selectedJob ? (
        <JobPostingsPanel
          jobs={jobs}
          isLoading={isLoading}
          canManage={canManage}
          onSelect={setSelectedJob}
          onCreate={async (data) => { await createJob(data); await fetchJobs(); }}
          onUpdate={async (id, data) => { await updateJob(id, data); await fetchJobs(); }}
          onClose={async (id) => { await closeJob(id); await fetchJobs(); }}
          onRefresh={fetchJobs}
        />
      ) : (
        <ApplicantPipeline
          job={selectedJob}
          applicants={applicants}
          interviews={interviews}
          offers={offers}
          interviewers={interviewers}
          isLoading={isLoading}
          canManage={canManage}
          onAddApplicant={createApplicant}
          onStatusChange={updateApplicantStatus}
          onRate={rateApplicant}
          onScheduleInterview={scheduleInterview}
          onMakeOffer={createOffer}
          onConvertToHire={convertToNewHire}
          onRefresh={() => {
            fetchApplicants(selectedJob.id);
            fetchInterviews();
            fetchOffers();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}