"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  User,
  Briefcase,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Video,
  MapPin,
  Phone,
  FileSearch,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface Candidate {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  seekerName: string;
  seekerEmail: string;
  headline?: string;
  bio?: string;
  image?: string;
  status: string;
  appliedAt: string;
  resumeUrl?: string;
  resumeFileId?: string;
  skills: string[];
  parsedSummary?: string | null;
  parsedEducation?: string[];
  parsingStatus: "not_parsed" | "parsed" | "partial" | "failed";
  recruiterNotes?: string;
}

interface RecruiterJob {
  _id: string;
  title: string;
}

const COMMON_SKILLS = [
  "All",
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Next.js",
  "AWS",
  "Docker",
  "MongoDB",
  "PostgreSQL",
  "Figma",
  "GraphQL",
];

const STATUS_OPTIONS = [
  "All",
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Accepted",
  "Rejected",
];

export default function RecruiterCandidatesPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const user = session?.user;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recruiterJobs, setRecruiterJobs] = useState<RecruiterJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  const handleStartChat = async (applicationId: string) => {
    setStartingChatId(applicationId);
    try {
      const res = await apiFetch<{ conversation: { _id: string } }>("/api/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ applicationId }),
      });
      if (res?.conversation?._id) {
        router.push(`/dashboard/recruiter/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open conversation. Ensure candidate application is shortlisted.");
    } finally {
      setStartingChatId(null);
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [hasResume, setHasResume] = useState("all");

  // Modals
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [viewingParsedResume, setViewingParsedResume] = useState<any | null>(null);
  const [parsingFileId, setParsingFileId] = useState<string | null>(null);

  // Scheduling Form
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

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedJobId) params.set("jobId", selectedJobId);
      if (selectedStatus !== "All") params.set("status", selectedStatus);
      if (selectedSkill !== "All") params.set("skill", selectedSkill);
      if (hasResume !== "all") params.set("hasResume", hasResume === "with" ? "true" : "false");
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await apiFetch<any>(`/api/candidates/search?${params.toString()}`);
      setCandidates(res.candidates || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.recruiterJobs) {
        setRecruiterJobs(res.recruiterJobs);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load candidate talent pool.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedJobId, selectedStatus, selectedSkill, hasResume, page]);

  useEffect(() => {
    if (!sessionPending && user) {
      fetchCandidates();
    }
  }, [sessionPending, user, fetchCandidates]);

  // Handle Parse Resume
  const handleParseResume = async (fileId: string) => {
    if (!fileId) return;
    try {
      setParsingFileId(fileId);
      const res = await apiFetch<any>(`/api/resumes/${fileId}/parse`, {
        method: "POST",
      });
      toast.success("Resume parsed successfully!");
      setViewingParsedResume(res.parsedResume);
      // Refresh candidate list to reflect new skills/status
      fetchCandidates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse resume document.");
    } finally {
      setParsingFileId(null);
    }
  };

  // View Existing Parsed Resume
  const handleViewParsedResume = async (fileId: string) => {
    if (!fileId) return;
    try {
      setParsingFileId(fileId);
      const res = await apiFetch<any>(`/api/resumes/${fileId}/parsed`);
      setViewingParsedResume(res);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load parsed resume data.");
    } finally {
      setParsingFileId(null);
    }
  };

  // Handle Interview Scheduling Submission
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingCandidate) return;

    if (!scheduleDate || !scheduleTime) {
      toast.error("Please specify both date and time for the interview.");
      return;
    }

    try {
      setSubmittingSchedule(true);
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledDateTime.getTime())) {
        toast.error("Invalid appointment date or time.");
        return;
      }

      const payload = {
        applicationId: schedulingCandidate.applicationId,
        scheduledAt: scheduledDateTime.toISOString(),
        durationMinutes: Number(scheduleDuration),
        timezone: scheduleTimezone,
        format: scheduleFormat,
        location: scheduleLocation,
        agenda: scheduleAgenda,
      };

      const res = await apiFetch<any>("/api/interviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`Interview proposed for ${schedulingCandidate.seekerName}! Candidate notified.`);
      setSchedulingCandidate(null);
      // Reset form
      setScheduleDate("");
      setScheduleTime("");
      setScheduleAgenda("");
      fetchCandidates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to schedule interview.");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Candidate Search & Talent Pool</h1>
          <p className="text-sm text-zinc-400">
            Search, filter, and review verified candidates who have applied to your job listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <User className="h-3.5 w-3.5" />
            {total} Eligible Candidates
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Keyword Search */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, email, keyword, or role..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Job Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Job"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All My Jobs ({recruiterJobs.length})</option>
              {recruiterJobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Status"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Skill Chips & Resume Availability Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-zinc-500 mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Skills:
            </span>
            {COMMON_SKILLS.map((sk) => {
              const active = selectedSkill === sk;
              return (
                <button
                  key={sk}
                  onClick={() => {
                    setSelectedSkill(sk);
                    setPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {sk}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Resume:</span>
            <select
              value={hasResume}
              onChange={(e) => {
                setHasResume(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Resume Availability"
              className="rounded-md border border-zinc-700 bg-zinc-800 py-1 px-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Any Resume Status</option>
              <option value="with">Resume Attached</option>
              <option value="without">No Resume</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate List / Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/40 p-5" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-500 mb-4">
            <FileSearch className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">No candidates match your filters</h3>
          <p className="mt-1 max-w-md text-sm text-zinc-400">
            Try adjusting your search keywords, clearing status filters, or selecting a different skill.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedJobId("");
              setSelectedStatus("All");
              setSelectedSkill("All");
              setHasResume("all");
              setPage(1);
            }}
            className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((candidate) => {
            const hasParsed = candidate.parsingStatus === "parsed";
            const isParsing = parsingFileId === candidate.resumeFileId;

            return (
              <div
                key={candidate.applicationId}
                className="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/80 shadow-sm"
              >
                <div>
                  {/* Top Candidate Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold text-base">
                        {candidate.seekerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors">
                          {candidate.seekerName}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {candidate.headline || candidate.seekerEmail}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        candidate.status === "Accepted"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : candidate.status === "Interview Scheduled"
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                          : candidate.status === "Shortlisted"
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                          : candidate.status === "Rejected"
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {candidate.status}
                    </span>
                  </div>

                  {/* Target Job & Applied Date */}
                  <div className="mb-3.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60 p-2.5 text-xs text-zinc-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Applied Job:</span>
                      <span className="font-medium text-zinc-200 truncate max-w-[160px]">{candidate.jobTitle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Date:</span>
                      <span>{new Date(candidate.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 4).map((sk, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300 border border-zinc-700/50"
                          >
                            {sk}
                          </span>
                        ))}
                        {candidate.skills.length > 4 && (
                          <span className="rounded bg-zinc-800/40 px-1.5 py-0.5 text-[11px] text-zinc-500">
                            +{candidate.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Parsed Summary Snippet */}
                  {candidate.parsedSummary && (
                    <p className="text-xs text-zinc-400 line-clamp-2 italic mb-3">
                      &quot;{candidate.parsedSummary}&quot;
                    </p>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Resume Actions */}
                    {candidate.resumeFileId ? (
                      <>
                        <a
                          href={`/api/resumes/${candidate.resumeFileId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-zinc-300 transition-colors"
                          title="View Verified PDF Resume"
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-400" />
                          Resume
                        </a>

                        {hasParsed ? (
                          <button
                            onClick={() => handleViewParsedResume(candidate.resumeFileId!)}
                            className="inline-flex items-center gap-1 rounded bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 px-2 py-1 text-indigo-300 transition-colors"
                            title="View Structured Parsed Data"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            Parsed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleParseResume(candidate.resumeFileId!)}
                            disabled={isParsing}
                            className="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
                            title="Extract Skills & Education from PDF"
                          >
                            {isParsing ? (
                              <Clock className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                            )}
                            Parse
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">No resume</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Direct Message Button */}
                    <button
                      onClick={() => handleStartChat(candidate.applicationId)}
                      disabled={startingChatId === candidate.applicationId}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                      title="Message candidate"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                      Message
                    </button>

                    {/* Direct Schedule Interview Button */}
                    <button
                      onClick={() => setSchedulingCandidate(candidate)}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Schedule
                    </button>

                    <Link
                      href={`/dashboard/jobs/${candidate.jobId}/applicants`}
                      className="inline-flex items-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 p-1 text-zinc-400 hover:text-white transition-colors"
                      title="Review in Job Applicants Drawer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-xs text-zinc-400">
          <div>
            Showing Page <span className="font-semibold text-white">{page}</span> of{" "}
            <span className="font-semibold text-white">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-white disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Schedule Interview Modal */}
      {schedulingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setSchedulingCandidate(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Schedule Interview</h3>
                <p className="text-xs text-zinc-400">
                  Propose an interview appointment for{" "}
                  <strong className="text-white">{schedulingCandidate.seekerName}</strong> ({schedulingCandidate.jobTitle})
                </p>
              </div>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Interview Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Duration</label>
                  <select
                    value={scheduleDuration}
                    onChange={(e) => setScheduleDuration(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={scheduleTimezone}
                    onChange={(e) => setScheduleTimezone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Interview Format</label>
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
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium border transition-colors ${
                        scheduleFormat === fmt
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"
                      }`}
                    >
                      {fmt === "video" && <Video className="h-3.5 w-3.5" />}
                      {fmt === "phone" && <Phone className="h-3.5 w-3.5" />}
                      {fmt === "in-person" && <MapPin className="h-3.5 w-3.5" />}
                      <span className="capitalize">{fmt}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Meeting Link or Location</label>
                <input
                  type="text"
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  placeholder="https://zoom.us/j/... or meeting room"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Agenda / Candidate Instructions</label>
                <textarea
                  rows={3}
                  value={scheduleAgenda}
                  onChange={(e) => setScheduleAgenda(e.target.value)}
                  placeholder="Introduce the team, discuss system architecture, Q&A..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSchedulingCandidate(null)}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSchedule}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingSchedule ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Interview Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Parsed Resume Insights Modal */}
      {viewingParsedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setViewingParsedResume(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Parsed Resume Insights</h3>
                <p className="text-xs text-zinc-400">
                  Automated document extraction results
                </p>
              </div>
            </div>

            {/* Disclaimer Alert */}
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <p>
                {viewingParsedResume.disclaimer ||
                  "Extracted via automated document parsing. Information may be incomplete and has not been independently verified."}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Contact Info */}
              {viewingParsedResume.data && (
                <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-800/80 space-y-2">
                  <span className="font-semibold text-zinc-300 block">Candidate Contact (Extracted)</span>
                  <div className="grid grid-cols-2 gap-2 text-zinc-400">
                    <div>Name: <span className="text-white">{viewingParsedResume.data.candidateName || "Not extracted"}</span></div>
                    <div>Email: <span className="text-white">{viewingParsedResume.data.email || "Not extracted"}</span></div>
                    <div>Phone: <span className="text-white">{viewingParsedResume.data.phone || "Not extracted"}</span></div>
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <span className="font-semibold text-zinc-300 block mb-1.5">Detected Skills</span>
                {viewingParsedResume.data?.skills?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {viewingParsedResume.data.skills.map((sk: string, i: number) => (
                      <span key={i} className="rounded bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 text-xs font-medium text-indigo-300">
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 italic">No specific skills detected in text.</p>
                )}
              </div>

              {/* Experience / Roles */}
              {viewingParsedResume.data?.roles?.length ? (
                <div>
                  <span className="font-semibold text-zinc-300 block mb-1.5">Detected Roles & Experience</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingParsedResume.data.roles.map((r: string, i: number) => (
                      <span key={i} className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Education */}
              {viewingParsedResume.data?.education?.length ? (
                <div>
                  <span className="font-semibold text-zinc-300 block mb-1.5">Education Credentials</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingParsedResume.data.education.map((e: string, i: number) => (
                      <span key={i} className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Summary */}
              {viewingParsedResume.data?.summary && (
                <div>
                  <span className="font-semibold text-zinc-300 block mb-1">Resume Summary</span>
                  <p className="rounded-lg bg-zinc-950 p-3 text-zinc-300 border border-zinc-800">
                    {viewingParsedResume.data.summary}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingParsedResume(null)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
