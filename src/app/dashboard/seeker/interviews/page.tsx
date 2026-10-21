"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  Briefcase,
  X,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

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
  scheduledAt: string;
  durationMinutes: number;
  endAt?: string;
  timezone: string;
  format: "video" | "in-person" | "phone";
  location: string;
  agenda: string;
  status: "Proposed" | "Confirmed" | "Rescheduled" | "Canceled" | "Completed";
  history: Array<{
    action: string;
    by: string;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
}

export default function SeekerInterviewsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const user = session?.user;

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "all">("upcoming");

  // Status Action Modal (Reschedule / Cancel)
  const [actionInterview, setActionInterview] = useState<Interview | null>(null);
  const [actionType, setActionType] = useState<"cancel" | "reschedule" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [actionTime, setActionTime] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.set("period", activeTab);
      }
      const data = await apiFetch<Interview[]>(`/api/interviews?${params.toString()}`);
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load interviews.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!sessionPending && user) {
      fetchInterviews();
    }
  }, [sessionPending, user, fetchInterviews]);

  // Handle Confirm Attendance
  const handleConfirm = async (interviewId: string) => {
    try {
      await apiFetch<any>(`/api/interviews/${interviewId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Confirmed" }),
      });
      toast.success("Attendance confirmed! Recruiter has been notified.");
      fetchInterviews();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to confirm interview.");
    }
  };

  // Handle Cancel or Reschedule submission
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionInterview || !actionType) return;

    try {
      setSubmittingAction(true);
      if (actionType === "cancel") {
        await apiFetch<any>(`/api/interviews/${actionInterview._id}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "Canceled",
            note: actionReason || "Canceled by candidate",
          }),
        });
        toast.info("Interview appointment canceled.");
      } else if (actionType === "reschedule") {
        if (!actionDate || !actionTime) {
          toast.error("Please provide your proposed date and time.");
          return;
        }
        const newDateTime = new Date(`${actionDate}T${actionTime}`);
        if (isNaN(newDateTime.getTime())) {
          toast.error("Invalid proposed date or time.");
          return;
        }
        await apiFetch<any>(`/api/interviews/${actionInterview._id}/reschedule`, {
          method: "PATCH",
          body: JSON.stringify({
            scheduledAt: newDateTime.toISOString(),
            reason: actionReason || "Candidate requested alternative time",
          }),
        });
        toast.success("Reschedule request submitted to recruiter.");
      }

      setActionInterview(null);
      setActionType(null);
      setActionReason("");
      fetchInterviews();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Operation failed.");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Interview Appointments</h1>
          <p className="text-sm text-zinc-400">
            Track interview invitations, confirm attendance, and export calendar invites.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {(["upcoming", "past", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {tab} Interviews
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-400 mb-4">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">No {activeTab} interviews found</h3>
          <p className="mt-1 max-w-md text-sm text-zinc-400">
            {activeTab === "upcoming"
              ? "You do not have any upcoming interviews scheduled. Check back when recruiters review your active applications."
              : "No interview history found for this view."}
          </p>
          <Link
            href="/dashboard/seeker/applications"
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            View Applications
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => {
            const dateObj = new Date(item.scheduledAt);
            const isConfirmed = item.status === "Confirmed";
            const isProposed = item.status === "Proposed";
            const isCanceled = item.status === "Canceled";

            return (
              <div
                key={item._id}
                className="flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-sm gap-5 transition hover:border-zinc-700 hover:bg-zinc-900/90"
              >
                {/* Left: Role and Time Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        isConfirmed
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : isProposed
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : item.status === "Rescheduled"
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                          : isCanceled
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-300"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Duration: {item.durationMinutes} mins
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{item.jobTitle}</h3>
                    <p className="text-sm font-medium text-indigo-400">{item.companyName}</p>
                  </div>

                  {/* Scheduled DateTime Details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-indigo-400" />
                      <span className="font-medium text-white">{dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>{dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({item.timezone || "UTC"})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.format === "video" && <Video className="h-4 w-4 text-indigo-400" />}
                      {item.format === "phone" && <Phone className="h-4 w-4 text-indigo-400" />}
                      {item.format === "in-person" && <MapPin className="h-4 w-4 text-indigo-400" />}
                      <span className="capitalize">{item.format} Interview</span>
                    </div>
                  </div>

                  {/* Location or Meeting Link */}
                  {item.location && !isCanceled && (
                    <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                      <span className="text-zinc-500">Meeting Link:</span>
                      {item.location.startsWith("http") ? (
                        <a
                          href={item.location}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 truncate max-w-xs"
                        >
                          {item.location}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-white font-medium">{item.location}</span>
                      )}
                    </div>
                  )}

                  {/* Agenda */}
                  {item.agenda && (
                    <p className="text-xs text-zinc-400 italic">
                      Agenda: &quot;{item.agenda}&quot;
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  {/* Confirm Attendance Button if Proposed */}
                  {isProposed && (
                    <button
                      onClick={() => handleConfirm(item._id)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm Attendance
                    </button>
                  )}

                  {/* Calendar Export */}
                  {!isCanceled && (
                    <a
                      href={`/api/interviews/${item._id}/ics`}
                      download={`interview-${item._id}.ics`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-400" />
                      Add to Calendar (.ics)
                    </a>
                  )}

                  {/* Reschedule or Cancel Actions */}
                  {!isCanceled && item.status !== "Completed" && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
                      <button
                        onClick={() => {
                          setActionInterview(item);
                          setActionType("reschedule");
                          setActionReason("");
                        }}
                        className="text-zinc-400 hover:text-indigo-300 transition-colors"
                      >
                        Request Reschedule
                      </button>
                      <span className="text-zinc-600">•</span>
                      <button
                        onClick={() => {
                          setActionInterview(item);
                          setActionType("cancel");
                          setActionReason("");
                        }}
                        className="text-zinc-400 hover:text-rose-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal (Cancel / Reschedule) */}
      {actionInterview && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => {
                setActionInterview(null);
                setActionType(null);
              }}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {actionType === "cancel" ? "Cancel Interview Appointment" : "Request Alternative Time"}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {actionInterview.jobTitle} with {actionInterview.companyName}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionType === "reschedule" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Proposed Date *</label>
                    <input
                      type="date"
                      required
                      value={actionDate}
                      onChange={(e) => setActionDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Proposed Time *</label>
                    <input
                      type="time"
                      required
                      value={actionTime}
                      onChange={(e) => setActionTime(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  {actionType === "cancel" ? "Reason for Cancellation" : "Note to Recruiter"}
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={actionType === "cancel" ? "Schedule conflict, accepted another offer..." : "I am available on this alternative date/time..."}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setActionInterview(null);
                    setActionType(null);
                  }}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                    actionType === "cancel" ? "bg-rose-600 hover:bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                >
                  {submittingAction
                    ? "Submitting..."
                    : actionType === "cancel"
                    ? "Confirm Cancellation"
                    : "Submit Reschedule Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
