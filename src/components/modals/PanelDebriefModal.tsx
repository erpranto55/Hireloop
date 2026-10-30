"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  Star,
  FileText,
  UserCheck,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

interface PanelDebriefModalProps {
  interviewId: string;
  onClose: () => void;
}

export default function PanelDebriefModal({
  interviewId,
  onClose,
}: PanelDebriefModalProps) {
  const [loading, setLoading] = useState(true);
  const [debrief, setDebrief] = useState<any | null>(null);

  useEffect(() => {
    async function loadDebrief() {
      try {
        setLoading(true);
        const res = await apiFetch(`/api/scorecards/interviews/${interviewId}/debrief`);
        if (res && res.debrief) {
          setDebrief(res.debrief);
        } else {
          toast.error("Debrief summary data not found.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load panel debrief.");
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      loadDebrief();
    }
  }, [interviewId]);

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "Strong Yes":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Yes":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "Neutral":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "No":
        return "bg-rose-500/10 text-rose-300 border-rose-500/20";
      case "Strong No":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getResponseBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Declined":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Removed":
        return "bg-zinc-800 text-zinc-500 border-zinc-700 line-through";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-8 w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Panel Debrief & Evaluation Summary
              </h2>
              <p className="text-xs text-zinc-400">
                Consolidated panelist evaluations, attendance status, and candidate scorecards.
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

        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            Loading consolidated panel debrief...
          </div>
        ) : !debrief ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No debrief data available for this interview appointment.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Candidate & Appointment Meta Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
              <div>
                <span className="text-[11px] text-zinc-500 block uppercase">Candidate</span>
                <span className="font-semibold text-white text-sm">
                  {debrief.candidateName || debrief.seekerEmail}
                </span>
                <span className="text-zinc-400 block text-[11px]">{debrief.seekerEmail}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block uppercase">Appointment</span>
                <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
                  <Calendar size={13} className="text-indigo-400" />
                  {new Date(debrief.scheduledAt).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-zinc-400 block text-[11px]">
                  {new Date(debrief.scheduledAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  ({debrief.durationMinutes || 45} mins)
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block uppercase">Scorecards Progress</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-indigo-400">
                    {debrief.evaluationsCount} of {debrief.totalPanelists}
                  </span>
                  <span className="text-[11px] text-zinc-400">submitted</span>
                </div>
                {debrief.averageScore ? (
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <Star size={11} fill="currentColor" /> {debrief.averageScore} / 5.0 avg
                  </span>
                ) : (
                  <span className="text-zinc-500 text-[11px]">No scores submitted yet</span>
                )}
              </div>
            </div>

            {/* Missing Evaluators Warning */}
            {debrief.missingEvaluators && debrief.missingEvaluators.length > 0 && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-semibold block">Pending Evaluations</span>
                  <span className="text-amber-300/80">
                    {debrief.missingEvaluators.length} assigned panelist(s) have not yet completed
                    their evaluation scorecards:{" "}
                    <strong>{debrief.missingEvaluators.map((e: any) => e.name || e.email).join(", ")}</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Panel Attendance & Response Status */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-400" />
                Panel Participation & Attendance
              </h3>
              <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.01]">
                {debrief.panelists.map((panelist: any, idx: number) => (
                  <div
                    key={panelist.email || idx}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300">
                        {(panelist.name || panelist.email || "P")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {panelist.name || panelist.email}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            {panelist.role || "Interviewer"}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500">{panelist.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${getResponseBadge(
                          panelist.responseStatus
                        )}`}
                      >
                        {panelist.responseStatus || "Pending"}
                      </span>
                      {panelist.declineReason && (
                        <span className="text-[11px] text-rose-400 italic">
                          &ldquo;{panelist.declineReason}&rdquo;
                        </span>
                      )}
                      {panelist.evaluationSubmitted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 size={13} /> Evaluated
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Clock size={13} /> Pending Scorecard
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criteria Breakdown Across Panelists */}
            {debrief.criteriaBreakdown && debrief.criteriaBreakdown.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                  <Star size={14} className="text-indigo-400" />
                  Criteria Rating Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {debrief.criteriaBreakdown.map((crit: any) => (
                    <div
                      key={crit.name}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{crit.name}</span>
                        <span className="font-bold text-indigo-400">
                          {crit.averageScore} / 5.0
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${(crit.averageScore / 5) * 100}%` }}
                        />
                      </div>
                      <span className="mt-1 block text-[10px] text-zinc-500">
                        Based on {crit.count} evaluator response(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Individual Evaluations */}
            {debrief.evaluations && debrief.evaluations.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-400" />
                  Interviewer Evaluations & Qualitative Feedback
                </h3>
                <div className="space-y-3">
                  {debrief.evaluations.map((ev: any, idx: number) => (
                    <div
                      key={ev._id || idx}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {ev.evaluatorName || ev.evaluatorEmail}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            ({ev.evaluatorEmail})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getRecommendationBadge(
                              ev.overallRecommendation
                            )}`}
                          >
                            {ev.overallRecommendation || "Evaluated"}
                          </span>
                          <span className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                            Score: {ev.totalScore || ev.score} / 5.0
                          </span>
                        </div>
                      </div>

                      {/* Strengths & Concerns */}
                      {ev.strengths && (
                        <div>
                          <span className="text-[11px] font-medium text-emerald-400 block">
                            Key Strengths:
                          </span>
                          <p className="text-zinc-300 text-[11px] mt-0.5 whitespace-pre-wrap">
                            {ev.strengths}
                          </p>
                        </div>
                      )}

                      {ev.concerns && (
                        <div>
                          <span className="text-[11px] font-medium text-rose-400 block">
                            Key Concerns:
                          </span>
                          <p className="text-zinc-300 text-[11px] mt-0.5 whitespace-pre-wrap">
                            {ev.concerns}
                          </p>
                        </div>
                      )}

                      {ev.notes && (
                        <div>
                          <span className="text-[11px] font-medium text-zinc-400 block">
                            Internal Screening Notes:
                          </span>
                          <p className="text-zinc-300 text-[11px] mt-0.5 whitespace-pre-wrap">
                            {ev.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human Decision Authority Guardrail Notice */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs text-indigo-300">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-indigo-400" />
              <div>
                <span className="font-semibold block text-white">
                  Human Hiring Authority Guardrail
                </span>
                <span className="text-zinc-400 text-[11px]">
                  Panel debriefs and aggregate scorecard metrics serve as structured decision support.
                  Consequential stage transitions (such as extending an Offer or issuing a Rejection)
                  must be explicitly executed by an authorized hiring manager or recruiter.
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 transition"
              >
                Close Debrief
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
