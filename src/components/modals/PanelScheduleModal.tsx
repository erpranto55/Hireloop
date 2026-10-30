"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Info,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface PanelInterviewerItem {
  email: string;
  name: string;
  role: string;
}

interface PanelScheduleModalProps {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  onClose: () => void;
  onScheduled: (interview: any) => void;
}

export default function PanelScheduleModal({
  applicationId,
  jobId,
  jobTitle,
  candidateName,
  candidateEmail,
  onClose,
  onScheduled,
}: PanelScheduleModalProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  // Appointment basics
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [format, setFormat] = useState<"video" | "in-person" | "phone">("video");
  const [location, setLocation] = useState("HireLoop Virtual Meeting Room");
  const [agenda, setAgenda] = useState("");

  // Panel vs Single
  const [interviewType, setInterviewType] = useState<"panel" | "single">("panel");

  // Interviewers list
  const [panelists, setPanelists] = useState<PanelInterviewerItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Custom panelist entry
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("Interviewer");

  // Availability & Conflict Check State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [conflictReport, setConflictReport] = useState<{
    canSchedule: boolean;
    hasConflict: boolean;
    candidateConflict: any | null;
    interviewerConflicts: any[];
    availabilityReport: any[];
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<any | null>(null);

  // Initialize currentUser as coordinator/first panelist
  useEffect(() => {
    if (currentUser?.email) {
      setPanelists([
        {
          email: currentUser.email,
          name: currentUser.name || "Coordinator",
          role: "Lead Coordinator",
        },
      ]);
    }
  }, [currentUser]);

  // Load company team members
  useEffect(() => {
    async function fetchTeam() {
      try {
        setLoadingTeam(true);
        const res = await apiFetch("/api/team/members");
        if (res && Array.isArray(res.members)) {
          setTeamMembers(res.members);
        }
      } catch (err: any) {
        console.warn("Could not load company team members:", err.message);
      } finally {
        setLoadingTeam(false);
      }
    }

    fetchTeam();
  }, []);

  // Run pre-flight conflict and availability check whenever date, time, duration, or panelists change
  const runAvailabilityCheck = useCallback(async () => {
    if (!scheduleDate || !scheduleTime) {
      setConflictReport(null);
      return;
    }

    try {
      setCheckingAvailability(true);
      const startIso = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const endIso = new Date(
        new Date(`${scheduleDate}T${scheduleTime}`).getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      const res = await apiFetch("/api/availability/check", {
        method: "POST",
        body: JSON.stringify({
          startDate: startIso,
          endDate: endIso,
          seekerEmail: candidateEmail,
          interviewers: panelists.map((p) => p.email),
        }),
      });

      if (res) {
        setConflictReport(res);
      }
    } catch (err: any) {
      console.warn("Pre-flight availability check failed:", err.message);
    } finally {
      setCheckingAvailability(false);
    }
  }, [scheduleDate, scheduleTime, durationMinutes, candidateEmail, panelists]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runAvailabilityCheck();
    }, 400);
    return () => clearTimeout(timer);
  }, [runAvailabilityCheck]);

  // Add a team member to panelists
  const handleToggleTeamMember = (member: any) => {
    const exists = panelists.some((p) => p.email.toLowerCase() === member.userEmail.toLowerCase());
    if (exists) {
      setPanelists((prev) =>
        prev.filter((p) => p.email.toLowerCase() !== member.userEmail.toLowerCase())
      );
    } else {
      setPanelists((prev) => [
        ...prev,
        {
          email: member.userEmail,
          name: member.userName || member.userEmail,
          role: member.role === "company_owner" ? "Hiring Lead" : "Evaluator",
        },
      ]);
    }
  };

  // Add custom panelist
  const handleAddCustomPanelist = () => {
    if (!customEmail || !customEmail.includes("@")) {
      toast.error("Please provide a valid interviewer email.");
      return;
    }

    if (panelists.some((p) => p.email.toLowerCase() === customEmail.toLowerCase())) {
      toast.error("Interviewer already included in the panel.");
      return;
    }

    setPanelists((prev) => [
      ...prev,
      {
        email: customEmail.trim(),
        name: customName.trim() || customEmail.split("@")[0],
        role: customRole.trim() || "Interviewer",
      },
    ]);

    setCustomEmail("");
    setCustomName("");
  };

  const handleRemovePanelist = (email: string) => {
    setPanelists((prev) => prev.filter((p) => p.email.toLowerCase() !== email.toLowerCase()));
  };

  const handleRoleChange = (email: string, newRole: string) => {
    setPanelists((prev) =>
      prev.map((p) =>
        p.email.toLowerCase() === email.toLowerCase() ? { ...p, role: newRole } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleDate || !scheduleTime) {
      toast.error("Please pick a scheduled date and start time.");
      return;
    }

    const scheduledDateObj = new Date(`${scheduleDate}T${scheduleTime}`);
    if (isNaN(scheduledDateObj.getTime())) {
      toast.error("Invalid appointment date or time.");
      return;
    }

    if (panelists.length === 0) {
      toast.error("At least one interviewer must be assigned to the panel.");
      return;
    }

    if (conflictReport?.hasConflict) {
      const confirmContinue = window.confirm(
        "Warning: Conflict detected for one or more participants. Do you still wish to schedule this appointment?"
      );
      if (!confirmContinue) return;
    }

    try {
      setSubmitting(true);

      const payload = {
        applicationId,
        jobId,
        scheduledAt: scheduledDateObj.toISOString(),
        durationMinutes: Number(durationMinutes),
        timezone,
        format,
        location,
        agenda,
        interviewType: interviewType === "panel" ? "panel" : "single",
        interviewers: panelists,
      };

      const res = await apiFetch("/api/interviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Panel interview scheduled! Invitations dispatched.");
      setScheduledResult(res.interview);
      onScheduled(res.interview);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule panel interview.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Schedule {interviewType === "panel" ? "Panel Interview" : "Interview"}
              </h2>
              <p className="text-xs text-zinc-400">
                Coordinated scheduling with multi-panelist invitations and conflict protection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {scheduledResult ? (
          /* Success Screen with Calendar Integration */
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Interview Appointment Confirmed!
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Invitations and multi-attendee calendar attachments have been queued for candidate{" "}
                <strong>{candidateName}</strong> and all {panelists.length} assigned panelists.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={`/api/interviews/${scheduledResult._id}/ics`}
                download
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
              >
                <Download size={14} className="text-indigo-400" />
                Download Multi-Attendee .ics
              </a>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Scheduling Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Context */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-zinc-500 uppercase block">Candidate</span>
                <span className="font-semibold text-white">{candidateName}</span>
                <span className="text-zinc-400 block text-[11px]">{candidateEmail}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-500 uppercase block">Position</span>
                <span className="font-semibold text-white">{jobTitle}</span>
              </div>
            </div>

            {/* Panel or Single Selector */}
            <div className="flex gap-2 p-1 rounded-xl bg-black border border-white/10">
              <button
                type="button"
                onClick={() => setInterviewType("panel")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                  interviewType === "panel"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Multi-Interviewer Panel
              </button>
              <button
                type="button"
                onClick={() => setInterviewType("single")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                  interviewType === "single"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Individual Interview
              </button>
            </div>

            {/* Date, Time, Duration, Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (1 hour)</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Preflight Conflict & Availability Warning Banner */}
            {conflictReport && (
              <div>
                {conflictReport.hasConflict ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <XCircle size={15} className="text-rose-400 shrink-0" />
                      Schedule Conflict Detected!
                    </div>
                    {conflictReport.candidateConflict && (
                      <p className="text-[11px] text-rose-300/90 pl-5">
                        Candidate <strong>{candidateName}</strong> is already booked for another
                        interview during this interval.
                      </p>
                    )}
                    {conflictReport.interviewerConflicts.map((c, i) => (
                      <p key={i} className="text-[11px] text-rose-300/90 pl-5">
                        Interviewer <strong>{c.email}</strong> is already booked for another interview.
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>No schedule conflicts detected. Slot is free across all participants.</span>
                  </div>
                )}
              </div>
            )}

            {/* Panel Interviewers Assignment */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-400" />
                  Assigned Panel Interviewers ({panelists.length})
                </label>
              </div>

              {/* Panelists List */}
              <div className="space-y-2">
                {panelists.map((panelist) => {
                  const availInfo = conflictReport?.availabilityReport?.find(
                    (a) => a.email.toLowerCase() === panelist.email.toLowerCase()
                  );

                  return (
                    <div
                      key={panelist.email}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{panelist.name}</span>
                        <span className="text-[11px] text-zinc-500">({panelist.email})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Live availability indicator */}
                        {availInfo && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                              availInfo.status === "available"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : availInfo.status === "conflict"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : availInfo.status === "unavailable"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            {availInfo.status === "available"
                              ? "Available"
                              : availInfo.status === "conflict"
                              ? "Busy"
                              : availInfo.status === "unavailable"
                              ? "Outside Working Hours"
                              : "No Hours Configured"}
                          </span>
                        )}

                        <input
                          type="text"
                          value={panelist.role}
                          onChange={(e) => handleRoleChange(panelist.email, e.target.value)}
                          placeholder="Role (e.g. Lead, Evaluator)"
                          className="w-32 rounded border border-white/10 bg-black px-2 py-1 text-[11px] text-zinc-200 outline-none"
                        />

                        {panelists.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePanelist(panelist.email)}
                            className="text-zinc-500 hover:text-rose-400 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Company Members Quick Add */}
              {interviewType === "panel" && teamMembers.length > 0 && (
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1.5">
                    Add from Company Team:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {teamMembers.map((m) => {
                      const isSelected = panelists.some(
                        (p) => p.email.toLowerCase() === m.userEmail.toLowerCase()
                      );
                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => handleToggleTeamMember(m)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] border transition ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold"
                              : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {m.userName || m.userEmail}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom / External Panelist */}
              {interviewType === "panel" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="email"
                    placeholder="Interviewer email..."
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Interviewer name..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPanelist}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
                  >
                    <Plus size={13} /> Add Interviewer
                  </button>
                </div>
              )}
            </div>

            {/* Format & Location */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Interview Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["video", "phone", "in-person"] as const).map((fmt) => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => {
                        setFormat(fmt);
                        if (fmt === "video") setLocation("HireLoop Virtual Meeting Room");
                        else if (fmt === "phone") setLocation("Coordinator will dial candidate");
                        else setLocation("Company HQ Office");
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium border transition ${
                        format === fmt
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
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Location / Video Link
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Agenda & Preparation Notes
                </label>
                <textarea
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Outline key topics, panelist focus areas, or candidate prep..."
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
              >
                <Send size={13} />
                {submitting ? "Coordinating & Scheduling..." : "Schedule & Send Invitations"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

