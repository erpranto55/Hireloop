"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  X,
  Save,
  Clock,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Send,
  Video,
  Phone,
  MapPin,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import CandidateEvaluationPanel from "@/components/dashboard/CandidateEvaluationPanel";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

const ALL_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Accepted",
  "Rejected",
];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  "Applied": ["Under Review", "Rejected"],
  "Under Review": ["Shortlisted", "Rejected"],
  "Shortlisted": ["Interview Scheduled", "Offered", "Rejected"],
  "Interview Scheduled": ["Offered", "Rejected"],
  "Offered": ["Accepted", "Rejected"],
  "Accepted": [],
  "Rejected": [],
};

export default function JobApplicantsPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const user = session?.user;
  const userRole = ((user as any)?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  const [jobId, setJobId] = useState("");
  const [applicants, setApplicants] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("Job");
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Candidate Review Modal / Drawer
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [recruiterNoteInput, setRecruiterNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Resume Parsing Insights
  const [parsedResume, setParsedResume] = useState<any | null>(null);
  const [loadingParsed, setLoadingParsed] = useState(false);

  // Interview Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState("45");
  const [scheduleTimezone, setScheduleTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [scheduleFormat, setScheduleFormat] = useState<"video" | "in-person" | "phone">("video");
  const [scheduleLocation, setScheduleLocation] = useState("HireLoop Virtual Meeting Room");
  const [scheduleAgenda, setScheduleAgenda] = useState("");
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);
  const [assigningReviewer, setAssigningReviewer] = useState(false);

  const handleStartChat = async (applicationId: string) => {
    setStartingChat(true);
    try {
      const res = await apiFetch<{ conversation: { _id: string } }>("/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ applicationId }),
      });
      if (res?.conversation?._id) {
        router.push(`/dashboard/recruiter/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open conversation. Ensure application is shortlisted.");
    } finally {
      setStartingChat(false);
    }
  };

  // Unwrap params
  useEffect(() => {
    params.then((p) => {
      setJobId(p.jobId);
    });
  }, [params]);

  useEffect(() => {
    if (jobId && !sessionPending) {
      if (userRole && userRole !== "recruiter" && userRole !== "admin") {
        toast.error("Access restricted: Only recruiters and admins can review applicants.");
        router.replace("/dashboard");
        return;
      }

      async function loadData() {
        try {
          // Fetch job title
          const jobData = await apiFetch(`/api/jobs/${jobId}`);
          if (jobData && jobData.title) {
            setJobTitle(jobData.title);
          }

          // Fetch applications
          const appData = await apiFetch(`/api/applications?jobId=${jobId}`);
          if (Array.isArray(appData)) {
            setApplicants(appData);
          }
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Failed to load applicants information");
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [jobId, sessionPending, userRole, router]);

  // Sync selected app notes and fetch parsed resume
  useEffect(() => {
    if (selectedApp) {
      setRecruiterNoteInput(selectedApp.recruiterNotes || "");
      if (selectedApp.companyId) {
        apiFetch<any>(`/api/companies/${selectedApp.companyId}/team`)
          .then((data) => setCompanyMembers(data?.members || []))
          .catch(() => setCompanyMembers([]));
      }
      if (selectedApp.resumeFileId) {
        setLoadingParsed(true);
        apiFetch<any>(`/api/resumes/${selectedApp.resumeFileId}/parsed`)
          .then((data) => setParsedResume(data))
          .catch(() => setParsedResume(null))
          .finally(() => setLoadingParsed(false));
      } else {
        setParsedResume(null);
      }
    } else {
      setParsedResume(null);
    }
  }, [selectedApp]);

  const handleAssignReviewer = async (applicationId: string, reviewerEmail: string) => {
    setAssigningReviewer(true);
    try {
      const res = await apiFetch(`/api/applications/${applicationId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ reviewerEmail: reviewerEmail || null }),
      });
      if (res.ok) {
        toast.success(reviewerEmail ? `Reviewer assigned: ${reviewerEmail}` : "Reviewer unassigned");
        const matched = companyMembers.find((m: any) => m.userEmail?.toLowerCase() === reviewerEmail.toLowerCase());
        setSelectedApp((prev: any) => prev ? ({
          ...prev,
          assignedReviewerEmail: reviewerEmail || null,
          assignedReviewerName: matched?.userName || reviewerEmail || null,
        }) : null);
        const appData = await apiFetch(`/api/applications?jobId=${jobId}`);
        if (Array.isArray(appData)) {
          setApplicants(appData);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to assign reviewer.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setAssigningReviewer(false);
    }
  };

  const handleTriggerParse = async () => {
    if (!selectedApp?.resumeFileId) return;
    try {
      setLoadingParsed(true);
      const res = await apiFetch<any>(`/api/resumes/${selectedApp.resumeFileId}/parse`, {
        method: "POST",
      });
      setParsedResume(res.parsedResume);
      toast.success("Resume parsed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to parse resume.");
    } finally {
      setLoadingParsed(false);
    }
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (!scheduleDate || !scheduleTime) {
      toast.error("Please provide an interview date and time.");
      return;
    }

    try {
      setSubmittingSchedule(true);
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledDateTime.getTime())) {
        toast.error("Invalid interview date or time.");
        return;
      }

      await apiFetch<any>("/api/interviews", {
        method: "POST",
        body: JSON.stringify({
          applicationId: selectedApp._id,
          scheduledAt: scheduledDateTime.toISOString(),
          durationMinutes: Number(scheduleDuration),
          timezone: scheduleTimezone,
          format: scheduleFormat,
          location: scheduleLocation,
          agenda: scheduleAgenda,
        }),
      });

      toast.success("Interview scheduled! Candidate notified via email & in-app.");
      setShowScheduleModal(false);
      setScheduleDate("");
      setScheduleTime("");
      setScheduleAgenda("");
      // Update local status
      setApplicants((prev) =>
        prev.map((a) => (a._id === selectedApp._id ? { ...a, status: "Interview Scheduled" } : a))
      );
      setSelectedApp((prev: any) => ({ ...prev, status: "Interview Scheduled" }));
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule interview.");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const updated = await apiFetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      toast.success(`Applicant status updated to "${newStatus}"`);
      setApplicants((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus, ...updated } : app))
      );
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, status: newStatus, ...updated }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      setSavingNote(true);
      const updated = await apiFetch(`/api/applications/${selectedApp._id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes: recruiterNoteInput.trim() }),
      });

      toast.success("Candidate notes saved successfully!");
      setApplicants((prev) =>
        prev.map((app) =>
          app._id === selectedApp._id
            ? { ...app, recruiterNotes: recruiterNoteInput.trim(), ...updated }
            : app
        )
      );
      setSelectedApp((prev: any) => ({
        ...prev,
        recruiterNotes: recruiterNoteInput.trim(),
        ...updated,
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save recruiter note");
    } finally {
      setSavingNote(false);
    }
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const nameMatch = (app.seekerName || "").toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = (app.seekerEmail || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      const matchesStatus =
        statusFilter === "All" ||
        (app.status || "Applied").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  if (loading || sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 pt-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl pb-20">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition cursor-pointer mb-6"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-indigo-400">Recruiter Toolkit</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Applicants for {jobTitle}</h1>
            <p className="mt-3 text-zinc-400">
              Review candidate credentials, add private notes, and advance candidates through the hiring pipeline.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
              Total Applicants: <strong className="text-white">{applicants.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by candidate name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-zinc-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="All">All Statuses ({applicants.length})</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {filteredApplicants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                  <tr>
                    <th className="px-5 py-4 font-medium">Candidate</th>
                    <th className="px-5 py-4 font-medium">Contact</th>
                    <th className="px-5 py-4 font-medium">Applied</th>
                    <th className="px-5 py-4 font-medium">Resume</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredApplicants.map((app) => {
                    const currentStatus = app.status || "Applied";
                    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

                    return (
                      <tr key={app._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                              {app.seekerName?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                            <div>
                              <span className="font-semibold text-white">{app.seekerName}</span>
                              {app.assignedReviewerEmail && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                                    <UserCheck size={10} />
                                    {app.assignedReviewerName || app.assignedReviewerEmail}
                                  </span>
                                </div>
                              )}
                              {app.recruiterNotes && (
                                <p className="text-[11px] text-amber-400 font-medium truncate max-w-[180px] mt-0.5">
                                  Note: {app.recruiterNotes}
                                </p>
                              )}
                              {app.reviewStatus === "ready_for_decision" && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                                    <Sparkles size={9} /> Ready for Decision
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-zinc-500" /> {app.seekerEmail}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-zinc-500" />
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "recently"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {app.resumeUrl ? (
                            <a
                              href={
                                app.resumeUrl.startsWith("http")
                                  ? app.resumeUrl
                                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${app.resumeUrl}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                              <FileText size={14} /> Resume PDF
                            </a>
                          ) : (
                            <span className="text-zinc-600 text-xs italic">None provided</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={currentStatus} />
                            <select
                              value={currentStatus}
                              disabled={updatingStatus}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                              className="rounded-lg border border-white/10 bg-black/80 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                              style={{ colorScheme: "dark" }}
                            >
                              <option value={currentStatus} disabled>
                                Advance to...
                              </option>
                              {allowedNext.map((st) => (
                                <option key={st} value={st} className="bg-zinc-950 text-white">
                                  {st}
                                </option>
                              ))}
                              {isAdmin &&
                                ALL_STATUSES.filter(
                                  (st) => st !== currentStatus && !allowedNext.includes(st)
                                ).map((st) => (
                                  <option key={st} value={st} className="bg-zinc-950 text-amber-300">
                                    {st} (Admin)
                                  </option>
                                ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition cursor-pointer"
                          >
                            Review & Notes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-zinc-500">
              {searchQuery || statusFilter !== "All"
                ? "No candidates match the current search or filter."
                : "No candidates have applied to this job listing yet."}
            </div>
          )}
        </div>

        {/* Candidate Detail & Notes Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                    {selectedApp.seekerName?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedApp.seekerName}</h3>
                    <p className="text-xs text-zinc-400">{selectedApp.seekerEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/[0.03] p-4 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs block">Date Applied</span>
                    <span className="font-medium text-white">
                      {selectedApp.appliedAt
                        ? new Date(selectedApp.appliedAt).toLocaleString()
                        : "Recently"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block">Current Status</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedApp.status || "Applied"} />
                    </div>
                  </div>
                </div>

                {/* Candidate Cover Letter */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Cover Letter / Note</h4>
                  <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedApp.coverLetter || "No cover letter provided."}
                  </div>
                </div>

                {/* Resume Access & Automated Parsing */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white">Candidate Resume</h4>
                    {selectedApp.resumeFileId && (
                      <button
                        type="button"
                        onClick={handleTriggerParse}
                        disabled={loadingParsed}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50"
                      >
                        <Sparkles size={13} className={loadingParsed ? "animate-spin" : ""} />
                        {loadingParsed ? "Parsing PDF..." : parsedResume ? "Re-parse Resume" : "Extract Resume Insights"}
                      </button>
                    )}
                  </div>
                  {selectedApp.resumeUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <FileText size={16} />
                          <span className="font-medium">Attached PDF Resume</span>
                        </div>
                        <a
                          href={
                            selectedApp.resumeUrl.startsWith("http")
                              ? selectedApp.resumeUrl
                              : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${selectedApp.resumeUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                        >
                          <ExternalLink size={13} /> View Resume
                        </a>
                      </div>

                      {/* Structured Parsed Data Card */}
                      {parsedResume?.data && (
                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                              <Sparkles size={13} />
                              Parsed Resume Insights
                            </span>
                            <span className="text-[10px] text-zinc-500">Automated Extraction</span>
                          </div>

                          <div className="rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] text-amber-300 flex items-start gap-1.5">
                            <AlertCircle size={13} className="shrink-0 mt-0.5" />
                            <span>{parsedResume.disclaimer || "Extracted via automated document parsing. Not independently verified."}</span>
                          </div>

                          {parsedResume.data.skills?.length > 0 && (
                            <div>
                              <span className="text-zinc-400 block mb-1 font-medium">Extracted Skills:</span>
                              <div className="flex flex-wrap gap-1">
                                {parsedResume.data.skills.map((sk: string, i: number) => (
                                  <span key={i} className="rounded bg-indigo-900/50 border border-indigo-700/50 px-2 py-0.5 text-indigo-200 text-[11px]">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {parsedResume.data.education?.length > 0 && (
                            <div>
                              <span className="text-zinc-400 block mb-1 font-medium">Education Credentials:</span>
                              <div className="flex flex-wrap gap-1 text-zinc-300">
                                {parsedResume.data.education.map((e: string, i: number) => (
                                  <span key={i} className="rounded bg-zinc-800 px-2 py-0.5 text-[11px]">{e}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {parsedResume.data.summary && (
                            <div>
                              <span className="text-zinc-400 block mb-1 font-medium">Extracted Summary:</span>
                              <p className="rounded bg-black/60 p-2.5 text-zinc-300 italic border border-white/5">
                                &quot;{parsedResume.data.summary}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No resume attached to this application.</p>
                  )}
                </div>

                {/* Status Transition Control & Interview Scheduling */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Hiring Stage & Interview Actions</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Direct Interview Scheduling CTA */}
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500 bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
                    >
                      <Calendar size={13} /> Schedule Interview
                    </button>

                    {/* Direct Message Candidate CTA */}
                    <button
                      type="button"
                      disabled={startingChat}
                      onClick={() => handleStartChat(selectedApp._id)}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition cursor-pointer disabled:opacity-50"
                      title="Chat with candidate"
                    >
                      <MessageSquare size={13} className="text-indigo-400" />
                      {startingChat ? "Opening Chat..." : "Message Candidate"}
                    </button>

                    {ALLOWED_TRANSITIONS[selectedApp.status || "Applied"]?.length ? (
                      ALLOWED_TRANSITIONS[selectedApp.status || "Applied"].map((targetStatus) => (
                        <button
                          key={targetStatus}
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange(selectedApp._id, targetStatus)}
                          className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                        >
                          Advance to &quot;{targetStatus}&quot;
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500">
                        This application is in a terminal stage ({selectedApp.status}).
                      </p>
                    )}
                  </div>
                </div>

                {/* Reviewer Assignment */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <UserCheck size={15} className="text-indigo-400" />
                      Assigned Reviewer
                    </h4>
                    {selectedApp.assignedReviewerEmail ? (
                      <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {selectedApp.assignedReviewerName || selectedApp.assignedReviewerEmail}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Unassigned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedApp.assignedReviewerEmail || ""}
                      onChange={(e) => handleAssignReviewer(selectedApp._id, e.target.value)}
                      disabled={assigningReviewer}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Unassigned (No specific reviewer)</option>
                      {companyMembers.map((m: any) => (
                        <option key={m._id} value={m.userEmail}>
                          {m.userName || m.userEmail} ({m.userEmail}) - {m.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Structured Candidate Evaluation Scorecards */}
                <div className="border-t border-white/10 pt-4">
                  <CandidateEvaluationPanel
                    applicationId={selectedApp._id}
                    candidateName={selectedApp.seekerName || "Candidate"}
                    jobId={jobId}
                    jobTitle={jobTitle}
                    companyId={selectedApp.companyId || ""}
                    reviewStatus={selectedApp.reviewStatus}
                    onRefreshApplication={() => {
                      apiFetch<any>(`/api/applications/${selectedApp._id}`).then((updated) => {
                        if (updated) setSelectedApp(updated);
                      });
                    }}
                  />
                </div>

                {/* Private Recruiter Notes */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      Private Recruiter Notes
                      <span className="text-[11px] font-normal text-amber-400/90">
                        (Never visible to candidate)
                      </span>
                    </h4>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Add interview feedback, candidate strengths, compensation expectations, or private screening notes..."
                    value={recruiterNoteInput}
                    onChange={(e) => setRecruiterNoteInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none placeholder-zinc-600"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={handleSaveNotes}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50"
                    >
                      <Save size={14} />
                      {savingNote ? "Saving..." : "Save Private Note"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Schedule Interview</h3>
                    <p className="text-xs text-zinc-400">Candidate: {selectedApp.seekerName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScheduleInterviewSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Time *</label>
                    <input
                      type="time"
                      required
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Duration</label>
                    <select
                      value={scheduleDuration}
                      onChange={(e) => setScheduleDuration(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="15">15 mins</option>
                      <option value="30">30 mins</option>
                      <option value="45">45 mins</option>
                      <option value="60">60 mins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Timezone</label>
                    <input
                      type="text"
                      value={scheduleTimezone}
                      onChange={(e) => setScheduleTimezone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["video", "phone", "in-person"] as const).map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => {
                          setScheduleFormat(fmt);
                          if (fmt === "video") setScheduleLocation("HireLoop Virtual Meeting Room");
                          else if (fmt === "phone") setScheduleLocation("Recruiter will dial candidate");
                          else setScheduleLocation("Company HQ");
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition ${
                          scheduleFormat === fmt
                            ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                            : "bg-black/60 border-white/10 text-zinc-400 hover:bg-white/5"
                        }`}
                      >
                        {fmt === "video" && <Video size={13} />}
                        {fmt === "phone" && <Phone size={13} />}
                        {fmt === "in-person" && <MapPin size={13} />}
                        <span className="capitalize">{fmt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Location / Link</label>
                  <input
                    type="text"
                    value={scheduleLocation}
                    onChange={(e) => setScheduleLocation(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Agenda / Instructions</label>
                  <textarea
                    rows={2}
                    value={scheduleAgenda}
                    onChange={(e) => setScheduleAgenda(e.target.value)}
                    placeholder="Candidate preparation notes or agenda..."
                    className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSchedule}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    <Send size={13} />
                    {submittingSchedule ? "Scheduling..." : "Send Invitation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let tone = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
  const s = (status || "Applied").toLowerCase();
  if (s === "rejected") {
    tone = "border-red-500/30 bg-red-500/10 text-red-300";
  } else if (s === "offered" || s === "accepted") {
    tone = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (s === "shortlisted") {
    tone = "border-violet-500/30 bg-violet-500/10 text-violet-300";
  } else if (s === "interview scheduled") {
    tone = "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  } else if (s === "under review") {
    tone = "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}
