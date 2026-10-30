"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Award,
  Settings,
  Plus,
  RefreshCw,
  Video,
  Phone,
  MapPin,
  Trash2,
  UserPlus,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import InterviewerAvailabilitySettings from "@/components/dashboard/InterviewerAvailabilitySettings";
import PanelDebriefModal from "@/components/modals/PanelDebriefModal";

interface InterviewerItem {
  email: string;
  name: string;
  role: string;
  responseStatus: "Pending" | "Accepted" | "Declined" | "Removed";
  respondedAt?: string;
  declineReason?: string;
}

interface Interview {
  _id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  recruiterEmail: string;
  recruiterName: string;
  seekerEmail: string;
  seekerName: string;
  candidateName?: string;
  scheduledAt: string;
  durationMinutes: number;
  endAt?: string;
  timezone: string;
  format: "video" | "in-person" | "phone";
  location: string;
  agenda: string;
  status: "Proposed" | "Confirmed" | "Rescheduled" | "Canceled" | "Completed";
  interviewType?: "single" | "panel";
  interviewers?: InterviewerItem[];
  sequence?: number;
  history?: Array<{
    action: string;
    by: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
}

export default function RecruiterInterviewsPage() {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<any | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "today" | "past" | "all">("upcoming");
  const [typeFilter, setTypeFilter] = useState<"all" | "panel" | "single">("all");

  // Availability Settings Modal
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Panel Debrief Modal
  const [debriefInterviewId, setDebriefInterviewId] = useState<string | null>(null);

  // Reschedule Modal
  const [rescheduleInterview, setRescheduleInterview] = useState<Interview | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Cancel Modal
  const [cancelInterview, setCancelInterview] = useState<Interview | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Participant Respond Modal (for logged-in user if assigned)
  const [respondInterview, setRespondInterview] = useState<Interview | null>(null);
  const [respondAction, setRespondAction] = useState<"Accepted" | "Declined">("Accepted");
  const [declineReason, setDeclineReason] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Manage Participants Modal
  const [manageInterview, setManageInterview] = useState<Interview | null>(null);
  const [newPanelistEmail, setNewPanelistEmail] = useState("");
  const [newPanelistName, setNewPanelistName] = useState("");
  const [newPanelistRole, setNewPanelistRole] = useState("Interviewer");
  const [submittingParticipant, setSubmittingParticipant] = useState(false);

  // Load interviews and sync status
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [interviewsRes, syncRes] = await Promise.allSettled([
        apiFetch("/api/interviews/mine"),
        apiFetch("/api/interviews/calendar-sync-status"),
      ]);

      if (interviewsRes.status === "fulfilled" && interviewsRes.value) {
        setInterviews(interviewsRes.value.interviews || []);
      }
      if (syncRes.status === "fulfilled" && syncRes.value) {
        setSyncStatus(syncRes.value);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered interviews list
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCandidate =
          item.seekerName?.toLowerCase().includes(q) || item.seekerEmail?.toLowerCase().includes(q);
        const matchesJob = item.jobTitle?.toLowerCase().includes(q);
        const matchesPanelist = item.interviewers?.some(
          (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
        );
        if (!matchesCandidate && !matchesJob && !matchesPanelist) return false;
      }

      // Status
      if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Type
      if (typeFilter === "panel" && item.interviewType !== "panel") return false;
      if (typeFilter === "single" && item.interviewType === "panel") return false;

      // Timeframe
      const now = new Date();
      const sched = new Date(item.scheduledAt);

      if (timeFilter === "upcoming") {
        if (sched < now || item.status === "Completed" || item.status === "Canceled") return false;
      } else if (timeFilter === "today") {
        const isToday = sched.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (timeFilter === "past") {
        if (sched >= now && item.status !== "Completed" && item.status !== "Canceled") return false;
      }

      return true;
    });
  }, [interviews, searchQuery, statusFilter, timeFilter, typeFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const upcoming = interviews.filter(
      (i) =>
        new Date(i.scheduledAt) >= now &&
        i.status !== "Canceled" &&
        i.status !== "Completed"
    ).length;

    const panels = interviews.filter((i) => i.interviewType === "panel").length;

    const pendingRsvps = interviews.reduce((acc, i) => {
      const pending = (i.interviewers || []).filter((p) => p.responseStatus === "Pending").length;
      return acc + pending;
    }, 0);

    const completed = interviews.filter((i) => i.status === "Completed").length;

    return { upcoming, panels, pendingRsvps, completed };
  }, [interviews]);

  // Handle participant response (Accept / Decline)
  const handleRespondSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondInterview) return;

    try {
      setSubmittingResponse(true);
      await apiFetch(`/api/interviews/${respondInterview._id}/participants/respond`, {
        method: "PATCH",
        body: JSON.stringify({
          responseStatus: respondAction,
          declineReason: respondAction === "Declined" ? declineReason : undefined,
        }),
      });

      toast.success(`You have ${respondAction.toLowerCase()} the interview invitation.`);
      setRespondInterview(null);
      setDeclineReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit response.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Handle Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleInterview || !rescheduleDate || !rescheduleTime) {
      toast.error("Please pick a valid rescheduled date and time.");
      return;
    }

    try {
      setSubmittingReschedule(true);
      const scheduledAt = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();

      await apiFetch(`/api/interviews/${rescheduleInterview._id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({
          scheduledAt,
          notes: rescheduleReason.trim() || undefined,
        }),
      });

      toast.success("Interview rescheduled and conflict revalidated! All participants notified.");
      setRescheduleInterview(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule interview.");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Handle Cancel
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelInterview) return;

    try {
      setSubmittingCancel(true);
      await apiFetch(`/api/interviews/${cancelInterview._id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({
          notes: cancelReason.trim() || undefined,
        }),
      });

      toast.success("Interview canceled. Participants notified with cancellation update.");
      setCancelInterview(null);
      setCancelReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel interview.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Handle Add Participant to Panel
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageInterview || !newPanelistEmail) return;

    try {
      setSubmittingParticipant(true);
      await apiFetch(`/api/interviews/${manageInterview._id}/participants`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "add",
          email: newPanelistEmail.trim(),
          name: newPanelistName.trim() || newPanelistEmail.split("@")[0],
          role: newPanelistRole.trim() || "Interviewer",
        }),
      });

      toast.success("Interviewer added to panel and invitation dispatched.");
      setNewPanelistEmail("");
      setNewPanelistName("");
      loadData();

      // Refresh local manage interview state
      const updated = await apiFetch(`/api/interviews/${manageInterview._id}`);
      if (updated?.interview) setManageInterview(updated.interview);
    } catch (err: any) {
      toast.error(err.message || "Failed to add participant.");
    } finally {
      setSubmittingParticipant(false);
    }
  };

  // Handle Remove Participant from Panel
  const handleRemoveParticipant = async (email: string) => {
    if (!manageInterview) return;
    if (!window.confirm(`Remove ${email} from this interview panel?`)) return;

    try {
      setSubmittingParticipant(true);
      await apiFetch(`/api/interviews/${manageInterview._id}/participants`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "remove",
          email,
        }),
      });

      toast.success("Participant removed from interview panel.");
      loadData();

      // Refresh local state
      const updated = await apiFetch(`/api/interviews/${manageInterview._id}`);
      if (updated?.interview) setManageInterview(updated.interview);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove participant.");
    } finally {
      setSubmittingParticipant(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Rescheduled":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      case "Completed":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "Canceled":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20 line-through";
      default:
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    }
  };

  const getRsvpBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "Declined":
        return "bg-rose-500/15 text-rose-400 border-rose-500/20";
      case "Removed":
        return "bg-zinc-800 text-zinc-500 border-zinc-700 line-through";
      default:
        return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Calendar size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Interview Coordination & Scheduling
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Multi-interviewer panel coordination, conflict protection, calendar sync & debriefs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Calendar Sync Status Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                syncStatus?.isConfigured ? "bg-emerald-400" : "bg-indigo-400"
              }`}
            />
            <span>
              {syncStatus?.isConfigured
                ? "Live Calendar Sync"
                : "Standalone RFC 5545 iCalendar"}
            </span>
          </div>

          {/* Availability Settings Button */}
          <button
            type="button"
            onClick={() => setShowAvailabilityModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition cursor-pointer"
          >
            <Clock size={14} className="text-indigo-400" />
            My Availability
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition cursor-pointer"
            title="Refresh interviews"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Upcoming Interviews</span>
            <Clock size={16} className="text-indigo-400" />
          </div>
          <span className="text-2xl font-bold text-white">{metrics.upcoming}</span>
          <span className="block text-[11px] text-zinc-500 mt-1">Confirmed & Scheduled</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Panel Interviews</span>
            <Users size={16} className="text-indigo-400" />
          </div>
          <span className="text-2xl font-bold text-white">{metrics.panels}</span>
          <span className="block text-[11px] text-zinc-500 mt-1">Multi-interviewer</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Pending RSVPs</span>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <span className="text-2xl font-bold text-amber-400">{metrics.pendingRsvps}</span>
          <span className="block text-[11px] text-zinc-500 mt-1">Awaiting confirmation</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-white">{metrics.completed}</span>
          <span className="block text-[11px] text-zinc-500 mt-1">Ready for Debrief</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
        <div className="flex flex-1 items-center gap-2 min-w-[240px] max-w-md rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 text-xs">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search candidate, job position, panelist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Timeframe Tabs */}
          <div className="flex rounded-xl bg-black border border-white/10 p-1">
            {(["upcoming", "today", "past", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`rounded-lg px-3 py-1 capitalize transition ${
                  timeFilter === t
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-black px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="all">All Formats</option>
            <option value="panel">Panels Only</option>
            <option value="single">Single Interviewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-black px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="proposed">Proposed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">
          Loading scheduled interviews and panels...
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center">
          <Calendar size={36} className="mx-auto text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">No interviews found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No interview appointments match your current filters. Schedule a panel interview directly
            from the applicant review pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => {
            const schedDate = new Date(interview.scheduledAt);
            const isPanel = interview.interviewType === "panel";
            const panelList = interview.interviewers || [];

            // Check if logged-in user is an assigned panelist
            const myAssignment = currentUser?.email
              ? panelList.find((p) => p.email.toLowerCase() === currentUser.email.toLowerCase())
              : null;

            return (
              <div
                key={interview._id}
                className="rounded-3xl border border-white/10 bg-zinc-950 p-5 md:p-6 transition hover:border-white/20 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                      <span className="text-xs uppercase">
                        {schedDate.toLocaleDateString(undefined, { month: "short" })}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm md:text-base font-semibold text-white">
                          {interview.candidateName || interview.seekerName || interview.seekerEmail}
                        </h3>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(
                            interview.status
                          )}`}
                        >
                          {interview.status}
                        </span>
                        {isPanel ? (
                          <span className="flex items-center gap-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                            <Users size={11} /> Panel ({panelList.length} Interviewers)
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                            Individual
                          </span>
                        )}
                        {interview.sequence && interview.sequence > 0 ? (
                          <span className="text-[10px] text-zinc-500">
                            Rev #{interview.sequence}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="text-white font-medium">{interview.jobTitle}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-zinc-500" />
                          {schedDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {schedDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ({interview.durationMinutes} mins)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 capitalize">
                          {interview.format === "video" && <Video size={12} />}
                          {interview.format === "phone" && <Phone size={12} />}
                          {interview.format === "in-person" && <MapPin size={12} />}
                          {interview.format}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top quick RSVP prompt for logged-in user if pending */}
                  {myAssignment && myAssignment.responseStatus === "Pending" && (
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
                      <span className="text-amber-300 text-[11px] font-medium pl-1">
                        Your RSVP is needed:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRespondInterview(interview);
                          setRespondAction("Accepted");
                        }}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRespondInterview(interview);
                          setRespondAction("Declined");
                        }}
                        className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-white/20 transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Panelists Attendance & Status Badges */}
                {isPanel && panelList.length > 0 && (
                  <div className="rounded-2xl border border-white/5 bg-black/40 p-3 space-y-2">
                    <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
                      Panel Attendance & Confirmation:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {panelList.map((p, idx) => (
                        <div
                          key={p.email || idx}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                            {(p.name || p.email)[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{p.name || p.email}</span>
                          <span className="text-[10px] text-zinc-400">({p.role || "Panelist"})</span>
                          <span
                            className={`rounded-full border px-2 py-0.2 text-[9px] font-semibold ${getRsvpBadge(
                              p.responseStatus
                            )}`}
                          >
                            {p.responseStatus}
                          </span>
                          {p.declineReason && (
                            <span className="text-[10px] text-rose-400 italic">
                              &ldquo;{p.declineReason}&rdquo;
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meeting Link & Agenda */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 border-t border-white/5 pt-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {interview.location && (
                      <span className="text-zinc-300">
                        <strong className="text-zinc-500 font-normal">Location:</strong>{" "}
                        {interview.location.startsWith("http") ? (
                          <a
                            href={interview.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline"
                          >
                            {interview.location}
                          </a>
                        ) : (
                          interview.location
                        )}
                      </span>
                    )}
                    {interview.agenda && (
                      <span className="text-zinc-400 italic">
                        &ldquo;{interview.agenda}&rdquo;
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Debrief Summary Button */}
                    <button
                      type="button"
                      onClick={() => setDebriefInterviewId(interview._id)}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/20 transition cursor-pointer"
                    >
                      <Award size={13} />
                      Panel Debrief
                    </button>

                    {/* Manage Panelists (Add/Remove) */}
                    {isPanel && interview.status !== "Canceled" && (
                      <button
                        type="button"
                        onClick={() => setManageInterview(interview)}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition cursor-pointer"
                      >
                        <UserPlus size={13} />
                        Panelists
                      </button>
                    )}

                    {/* Reschedule Button */}
                    {interview.status !== "Canceled" && interview.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleInterview(interview);
                          const dt = new Date(interview.scheduledAt);
                          setRescheduleDate(dt.toISOString().split("T")[0]);
                          setRescheduleTime(dt.toTimeString().substring(0, 5));
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition cursor-pointer"
                      >
                        Reschedule
                      </button>
                    )}

                    {/* Cancel Button */}
                    {interview.status !== "Canceled" && interview.status !== "Completed" && (
                      <button
                        type="button"
                        onClick={() => setCancelInterview(interview)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Download .ics */}
                    <a
                      href={`/api/interviews/${interview._id}/ics`}
                      download
                      className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition"
                      title="Download RFC 5545 iCalendar (.ics)"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">.ics</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}

      {/* 1. Interviewer Availability Settings Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <InterviewerAvailabilitySettings
            onClose={() => setShowAvailabilityModal(false)}
            onSaved={() => {
              setShowAvailabilityModal(false);
              loadData();
            }}
          />
        </div>
      )}

      {/* 2. Panel Debrief Modal */}
      {debriefInterviewId && (
        <PanelDebriefModal
          interviewId={debriefInterviewId}
          onClose={() => setDebriefInterviewId(null)}
        />
      )}

      {/* 3. Reschedule Modal */}
      {rescheduleInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-base font-semibold text-white">Reschedule Interview</h3>
              <button
                onClick={() => setRescheduleInterview(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">New Start Time *</label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Reason for Rescheduling</label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Notes explaining reschedule..."
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRescheduleInterview(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReschedule}
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingReschedule ? "Revalidating & Rescheduling..." : "Confirm Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Cancel Interview Modal */}
      {cancelInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-base font-semibold text-white">Cancel Interview</h3>
              <button
                onClick={() => setCancelInterview(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <p className="text-zinc-400">
                Are you sure you want to cancel the interview for{" "}
                <strong className="text-white">
                  {cancelInterview.candidateName || cancelInterview.seekerEmail}
                </strong>
                ? All assigned panelists and the candidate will receive cancellation updates with
                calendar status updates.
              </p>

              <div>
                <label className="block text-zinc-400 mb-1">Reason for Cancellation</label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCancelInterview(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400 hover:bg-white/5"
                >
                  Keep Interview
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {submittingCancel ? "Canceling..." : "Cancel Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Participant Respond Modal */}
      {respondInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-base font-semibold text-white">
                {respondAction === "Accepted" ? "Accept" : "Decline"} Panel Invitation
              </h3>
              <button
                onClick={() => setRespondInterview(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRespondSubmit} className="space-y-4 text-xs">
              <p className="text-zinc-400">
                You are updating your attendance for the interview with{" "}
                <strong className="text-white">
                  {respondInterview.candidateName || respondInterview.seekerEmail}
                </strong>{" "}
                for position <strong className="text-white">{respondInterview.jobTitle}</strong>.
              </p>

              {respondAction === "Declined" && (
                <div>
                  <label className="block text-zinc-400 mb-1">
                    Decline Reason (Optional but recommended)
                  </label>
                  <textarea
                    rows={2}
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="E.g., Prior customer engagement, double-booking..."
                    className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRespondInterview(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResponse}
                  className={`rounded-xl px-4 py-2 font-semibold text-white disabled:opacity-50 ${
                    respondAction === "Accepted"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {submittingResponse
                    ? "Submitting..."
                    : respondAction === "Accepted"
                    ? "Confirm Acceptance"
                    : "Decline Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Manage Panelists Modal */}
      {manageInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-white">Manage Panel Participants</h3>
                <p className="text-xs text-zinc-400">
                  Add or remove interviewers from this active panel.
                </p>
              </div>
              <button
                onClick={() => setManageInterview(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Current Panelists */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                  Active Panelists ({manageInterview.interviewers?.length || 0})
                </label>
                <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/[0.02]">
                  {manageInterview.interviewers?.map((p) => (
                    <div
                      key={p.email}
                      className="flex items-center justify-between p-2.5 text-xs"
                    >
                      <div>
                        <span className="font-medium text-white mr-2">{p.name || p.email}</span>
                        <span className="text-[10px] text-zinc-400">({p.role})</span>
                        <span
                          className={`ml-2 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${getRsvpBadge(
                            p.responseStatus
                          )}`}
                        >
                          {p.responseStatus}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p.email)}
                        disabled={submittingParticipant}
                        className="text-zinc-500 hover:text-rose-400 transition"
                        title="Remove panelist"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Participant Form */}
              <form onSubmit={handleAddParticipant} className="space-y-2 border-t border-white/10 pt-3">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                  Add Interviewer to Panel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Interviewer email..."
                    value={newPanelistEmail}
                    onChange={(e) => setNewPanelistEmail(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Interviewer name..."
                    value={newPanelistName}
                    onChange={(e) => setNewPanelistName(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Role (e.g. Technical Lead)"
                    value={newPanelistRole}
                    onChange={(e) => setNewPanelistRole(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-white"
                  />
                  <button
                    type="submit"
                    disabled={submittingParticipant}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="flex justify-end pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setManageInterview(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400 hover:bg-white/5"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
