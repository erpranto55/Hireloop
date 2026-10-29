"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Star,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import ScorecardModal from "@/components/modals/ScorecardModal";

interface CandidateEvaluationPanelProps {
  applicationId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  reviewStatus?: string;
  onRefreshApplication?: () => void;
}

export default function CandidateEvaluationPanel({
  applicationId,
  candidateName,
  jobId,
  jobTitle,
  companyId,
  reviewStatus,
  onRefreshApplication,
}: CandidateEvaluationPanelProps) {
  const [summary, setSummary] = useState<any | null>(null);
  const [myEvaluation, setMyEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  const fetchEvaluationData = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const [sum, mine] = await Promise.all([
        apiFetch<any>(`/api/scorecards/applications/${applicationId}/summary`).catch(() => null),
        apiFetch<any>(`/api/scorecards/applications/${applicationId}/mine`).catch(() => null),
      ]);
      setSummary(sum);
      setMyEvaluation(mine);
    } catch (err: any) {
      console.error("[CandidateEvaluationPanel] Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluationData();
  }, [applicationId]);

  const agreementConfig: Record<string, { label: string; color: string }> = {
    high: { label: "High Agreement", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    moderate: { label: "Moderate Consensus", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    divergent: { label: "Divergent Feedback", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    insufficient_data: { label: "Evaluating", color: "text-zinc-400 bg-zinc-800 border-zinc-700" },
  };

  const isReady = summary?.readyForDecision || reviewStatus === "ready_for_decision";

  return (
    <div className="space-y-4">
      {/* Ready for Decision Banner */}
      {isReady && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Ready for Hiring Decision</p>
              <p className="text-[11px] text-zinc-300">
                Evaluation threshold met or assigned interviewers have completed their scorecards.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
            Threshold Met
          </span>
        </div>
      )}

      {/* Main Aggregation Summary Card */}
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Scorecard Evaluation Summary
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowScorecardModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            {myEvaluation?.status === "submitted" ? (
              <>
                <FileCheck className="w-3.5 h-3.5" /> View / Amend My Scorecard
              </>
            ) : myEvaluation?.status === "draft" ? (
              <>
                <Clock className="w-3.5 h-3.5" /> Resume Draft Scorecard
              </>
            ) : (
              <>
                <Star className="w-3.5 h-3.5" /> Submit Scorecard
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="py-6 flex items-center justify-center text-xs text-zinc-400 gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading evaluation summary...
          </div>
        ) : summary && summary.submittedEvaluationsCount > 0 ? (
          <div className="space-y-4">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-medium">Weighted Score</div>
                <div className="text-xl font-bold text-white font-mono flex items-center gap-1 mt-0.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {summary.overallWeightedAverage} <span className="text-xs text-zinc-500">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-medium">Evaluations</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">
                  {summary.submittedEvaluationsCount}
                  {summary.draftEvaluationsCount > 0 && (
                    <span className="text-xs text-zinc-500 ml-1">({summary.draftEvaluationsCount} draft)</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-medium">Consensus</div>
                <div className="mt-1">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                      agreementConfig[summary.agreementLevel]?.color || agreementConfig.insufficient_data.color
                    }`}
                  >
                    {agreementConfig[summary.agreementLevel]?.label || "Evaluating"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                <div className="text-[10px] text-zinc-400 font-medium">My Assessment</div>
                <div className="text-xs font-semibold text-zinc-200 mt-1 capitalize">
                  {myEvaluation?.overallRecommendation
                    ? myEvaluation.overallRecommendation.replace(/_/g, " ")
                    : "Not evaluated"}
                </div>
              </div>
            </div>

            {/* Recommendations Distribution */}
            {summary.recommendationDistribution && (
              <div className="p-3 rounded-lg bg-zinc-800/20 border border-zinc-800/60 space-y-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Hiring Recommendations Distribution
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.recommendationDistribution).map(([rec, count]: [string, any]) => {
                    if (count === 0) return null;
                    return (
                      <span
                        key={rec}
                        className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1.5"
                      >
                        <span className="font-semibold text-white capitalize">{rec.replace(/_/g, " ")}:</span>
                        <span className="text-indigo-400 font-mono font-bold">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Criteria Breakdown */}
            {summary.criteriaBreakdown && summary.criteriaBreakdown.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Criteria Breakdown ({summary.criteriaBreakdown.length})</span>
                  <span>Average Score</span>
                </div>
                <div className="space-y-1.5">
                  {summary.criteriaBreakdown.map((c: any) => (
                    <div
                      key={c.criterionId}
                      className="p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{c.criterionName}</div>
                        <div className="w-full bg-zinc-700/40 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${
                              c.averageRating >= 4
                                ? "bg-emerald-500"
                                : c.averageRating >= 3
                                ? "bg-indigo-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${(c.averageRating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-zinc-400 text-[10px]">
                          ({c.minRating} - {c.maxRating})
                        </span>
                        <span className="font-mono font-bold text-white text-xs">
                          {c.averageRating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Evaluators Warning */}
            {summary.missingEvaluators && summary.missingEvaluators.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Awaiting evaluations from: {summary.missingEvaluators.map((m: any) => m.name || m.email).join(", ")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-zinc-400">
              No completed scorecards submitted yet for this candidate.
            </p>
            <p className="text-[11px] text-zinc-500">
              Assigned interviewers and hiring managers can evaluate candidate competencies consistently using the standardized 1–5 rubric.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <ScorecardModal
        isOpen={showScorecardModal}
        onClose={() => setShowScorecardModal(false)}
        applicationId={applicationId}
        candidateName={candidateName}
        jobId={jobId}
        jobTitle={jobTitle}
        companyId={companyId}
        onEvaluationSaved={() => {
          fetchEvaluationData();
          onRefreshApplication?.();
        }}
      />
    </div>
  );
}
