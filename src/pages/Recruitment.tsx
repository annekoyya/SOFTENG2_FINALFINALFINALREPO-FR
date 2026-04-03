import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  Plus,
  FileText,
  Eye,
  MoreHorizontal,
} from "lucide-react";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

// Mock Job Postings
const mockJobs = [
  { id: 1, title: "Receptionist", department: "Front Office", slots: 8, posted_date: "2022-05-25", deadline: "2022-06-26", status: "open" },
  { id: 2, title: "Concierge", department: "Rooms Division", slots: 11, posted_date: "2022-05-25", deadline: "2022-06-26", status: "open" },
  { id: 3, title: "Housekeeper", department: "Housekeeping", slots: 5, posted_date: "2022-05-25", deadline: "2022-06-26", status: "open" },
  { id: 4, title: "Bartender", department: "Foods & Beverages", slots: 3, posted_date: "2022-05-25", deadline: "2022-06-26", status: "open" },
  { id: 5, title: "Room Attendant", department: "Housekeeping", slots: 10, posted_date: "2022-05-25", deadline: "2022-06-26", status: "open" },
  { id: 6, title: "Accountant", department: "Finance", slots: 3, posted_date: "2022-04-24", deadline: "2022-05-25", status: "open" },
];

// Mock Applicants
const mockApplicants = [
  { id: 1, first_name: "Jonathan", last_name: "Dy", position: "Receptionist", application_date: "2022-05-25", resume_url: "/resume1.pdf", status: "approved" },
  { id: 2, first_name: "Jay", last_name: "Cruz", position: "Concierge", application_date: "2022-05-25", resume_url: "/resume2.pdf", status: "approved" },
  { id: 3, first_name: "Sam", last_name: "Yap", position: "Housekeeper", application_date: "2022-05-25", resume_url: "/resume3.pdf", status: "approved" },
  { id: 4, first_name: "Sunny", last_name: "Din", position: "Bartender", application_date: "2022-05-25", resume_url: "/resume4.pdf", status: "pending" },
  { id: 5, first_name: "Brenda", last_name: "Smith", position: "Room Attendant", application_date: "2022-05-25", resume_url: "/resume5.pdf", status: "pending" },
  { id: 6, first_name: "Piolo", last_name: "Papi", position: "Bartender", application_date: "2022-05-20", resume_url: "/resume6.pdf", status: "interview" },
  { id: 7, first_name: "Squidward", last_name: "Ry", position: "Room Attendant", application_date: "2022-05-18", resume_url: "/resume7.pdf", status: "pending" },
  { id: 8, first_name: "Heidi", last_name: "Rose", position: "Accountant", application_date: "2022-05-15", resume_url: "/resume8.pdf", status: "pending" },
];

// Mock Interviews
const mockInterviews = [
  { id: 1, applicant_id: 1, applicant_name: "Jonathan Dy", position: "Receptionist", scheduled_date: "2022-05-04", time: "10:00 AM", interviewer_name: "Dranreb Jay", status: "scheduled" },
  { id: 2, applicant_id: 2, applicant_name: "Jay Cruz", position: "Concierge", scheduled_date: "2022-05-04", time: "12:00 PM", interviewer_name: "Gwen Li", status: "scheduled" },
  { id: 3, applicant_id: 3, applicant_name: "Sam Yap", position: "Housekeeper", scheduled_date: "2022-06-04", time: "3:30 PM", interviewer_name: "Gwen Li", status: "scheduled" },
  { id: 4, applicant_id: 6, applicant_name: "Piolo Papi", position: "Bartender", scheduled_date: null, time: null, interviewer_name: null, status: "pending" },
  { id: 5, applicant_id: 7, applicant_name: "Squidward Ry", position: "Room Attendant", scheduled_date: null, time: null, interviewer_name: null, status: "pending" },
  { id: 6, applicant_id: 8, applicant_name: "Heidi Rose", position: "Accountant", scheduled_date: null, time: null, interviewer_name: null, status: "pending" },
];

// Mock Training Programs
const mockTrainingPrograms = [
  { id: 1, name: "Reception Training", participants: 10, start_date: "2022-05-14", end_date: "2022-05-24", status: "in_progress" },
  { id: 2, name: "Housekeeping Training", participants: 8, start_date: "2022-05-14", end_date: "2022-05-24", status: "in_progress" },
  { id: 3, name: "Marketing Training", participants: 9, start_date: "2022-06-04", end_date: "2022-06-14", status: "in_progress" },
  { id: 4, name: "Customer Service", participants: 11, start_date: "2022-05-04", end_date: "2022-05-14", status: "completed" },
  { id: 5, name: "Safety Procedures", participants: 7, start_date: "2022-05-04", end_date: "2022-05-14", status: "completed" },
];

// ─── Job Vacancies Tab ───────────────────────────────────────────────────────

function JobVacanciesTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = mockJobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-700">Open</Badge>;
      case "closed":
        return <Badge className="bg-red-100 text-red-700">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search job title or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Job Vacancy
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Job Title</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold text-center">Slots</TableHead>
              <TableHead className="font-semibold">Posting Date</TableHead>
              <TableHead className="font-semibold">Deadline</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No job vacancies found
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-blue-600">{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell className="text-center">{job.slots}</TableCell>
                  <TableCell>{new Date(job.posted_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(job.deadline).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredJobs.length} of {mockJobs.length} Job Vacancies
      </div>
    </div>
  );
}

// ─── Applicant Management Tab ─────────────────────────────────────────────────

function ApplicantManagementTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplicants = mockApplicants.filter((app) =>
    (app.first_name + " " + app.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case "interview":
        return <Badge className="bg-blue-100 text-blue-700">Interview</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applicant name or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          + Applicant
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Applicant Name</TableHead>
              <TableHead className="font-semibold">Position</TableHead>
              <TableHead className="font-semibold">Application Date</TableHead>
              <TableHead className="font-semibold">Resume</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">No applicants found</TableCell>
              </TableRow>
            ) : (
              filteredApplicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell className="font-medium">
                    {applicant.first_name} {applicant.last_name}
                  </TableCell>
                  <TableCell>{applicant.position}</TableCell>
                  <TableCell>{new Date(applicant.application_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0 text-blue-600">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(applicant.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredApplicants.length} of {mockApplicants.length} Applicants
      </div>
    </div>
  );
}

// ─── Scheduled Interviews Tab ─────────────────────────────────────────────────

function ScheduledInterviewsTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInterviews = mockInterviews.filter((interview) =>
    interview.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interview.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search interviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Applicant</TableHead>
              <TableHead className="font-semibold">Position</TableHead>
              <TableHead className="font-semibold">Date & Time</TableHead>
              <TableHead className="font-semibold">Interviewer</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInterviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">No interviews scheduled</TableCell>
              </TableRow>
            ) : (
              filteredInterviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">{interview.applicant_name}</TableCell>
                  <TableCell>{interview.position}</TableCell>
                  <TableCell>
                    {interview.scheduled_date ? (
                      <>
                        {new Date(interview.scheduled_date).toLocaleDateString()} - {interview.time}
                      </>
                    ) : "---"}
                  </TableCell>
                  <TableCell>{interview.interviewer_name || "---"}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(interview.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredInterviews.length} of {mockInterviews.length} Applicants
      </div>
    </div>
  );
}

// ─── Training Programs Tab ────────────────────────────────────────────────────

function TrainingProgramsTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPrograms = mockTrainingPrograms.filter((program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "upcoming":
        return <Badge className="bg-yellow-100 text-yellow-700">Upcoming</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search training programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Program
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Training Program</TableHead>
              <TableHead className="font-semibold text-center">Participants</TableHead>
              <TableHead className="font-semibold">Start Date</TableHead>
              <TableHead className="font-semibold">End Date</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">No training programs found</TableCell>
              </TableRow>
            ) : (
              filteredPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium text-blue-600">{program.name}</TableCell>
                  <TableCell className="text-center">{program.participants}</TableCell>
                  <TableCell>{new Date(program.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(program.end_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(program.status)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main Recruitment Page ────────────────────────────────────────────────────

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState("vacancies");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recruitment</h1>
          <p className="text-sm text-gray-500 mt-1">BLUE LOTUS HOTEL</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="vacancies" className="rounded-md px-4 py-2">
              Job Vacancies
            </TabsTrigger>
            <TabsTrigger value="applicants" className="rounded-md px-4 py-2">
              Applicant Management
            </TabsTrigger>
            <TabsTrigger value="interviews" className="rounded-md px-4 py-2">
              Scheduled Interviews
            </TabsTrigger>
            <TabsTrigger value="training" className="rounded-md px-4 py-2">
              Training Programs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vacancies">
            <JobVacanciesTab />
          </TabsContent>

          <TabsContent value="applicants">
            <ApplicantManagementTab />
          </TabsContent>

          <TabsContent value="interviews">
            <ScheduledInterviewsTab />
          </TabsContent>

          <TabsContent value="training">
            <TrainingProgramsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}