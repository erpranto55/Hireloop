"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  History,
  Award,
  Info,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

export const RATING_LABELS: Record<number, string> = {
  1: "1 - Unsatisfactory",
  2: "2 - Below Expectations",
  3: "3 - Meets Expectations",
  4: "4 - Exceeds Expectations",
  5: "5 - Exceptional",
};

export const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Critical gaps; significantly below role requirements.",
  2: "Developing; requires substantial guidance and supervision.",
  3: "Solid competency; autonomous and fulfills core expectations.",
  4: "Strong performance; independently resolves complex challenges.",
  5: "Distinguished mastery; acts as a role model and thought leader.",
};

export const RECOMMENDATION_OPTIONS = [
  { value: "strong_hire", label: "Strong Hire", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "hire", label: "Hire", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { value: "lean_hire", label: "Lean Hire", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "lean_no_hire", label: "Lean No Hire", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  { value: "no_hire", label: "No Hire", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
];

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  onEvaluationSaved?: () => void;
}

export default function ScorecardModal({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobId,
  jobTitle,
  companyId,
  onEvaluationSaved,
}: ScorecardModalProps) {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<any | null>(null);

  // Form state
  const [scores, setScores] = useState<Record<string, { rating: number | null; evidence: string }>>({});
  const [overallRecommendation, setOverallRecommendation] = useState<string>("");
  const [overallNotes, setOverallNotes] = useState<string>("");
  const [amendmentReason, setAmendmentReason] = useState<string>("");
  const [isAmending, setIsAmending] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch active template and user's evaluation
  useEffect(() => {
    if (!isOpen || !applicationId) return;

    let mounted = true;
    setLoading(true);

    Promise.all([
      apiFetch<any>(`/api/scorecards/templates/default?companyId=${companyId}&jobId=${jobId}`).catch(() => null),
      apiFetch<any>(`/api/scorecards/applications/${applicationId}/mine`).catch(() => null),
    ])
      .then(([tmpl, myEval]) => {
        if (!mounted) return;
        setTemplate(tmpl);
        setExistingEvaluation(myEval);

        // Prepopulate form if existing evaluation exists
        if (myEval) {
          const scoreMap: Record<string, { rating: number | null; evidence: string }> = {};
          (myEval.scores || []).forEach((s: any) => {
            scoreMap[s.criterionId] = {
              rating: s.rating,
              evidence: s.evidence || "",
            };
          });
          setScores(scoreMap);
          setOverallRecommendation(myEval.overallRecommendation || "");
          setOverallNotes(myEval.overallNotes || "");
        } else if (tmpl) {
          // Initialize empty criteria
          const initMap: Record<string, { rating: number | null; evidence: string }> = {};
          (tmpl.criteria || []).forEach((c: any) => {
            initMap[c.id] = { rating: null, evidence: "" };
          });
          setScores(initMap);
          setOverallRecommendation("");
          setOverallNotes("");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, applicationId, companyId, jobId]);

  // Running weighted score preview
  const runningWeightedScore = useMemo(() => {
    if (!template || !template.criteria) return 0;
    let sum = 0;
    let weightSum = 0;

    for (const crit of template.criteria) {
      const entry = scores[crit.id];
      if (entry && typeof entry.rating === "number" && entry.rating >= 1 && entry.rating <= 5) {
        const w = crit.weight || 1;
        sum += entry.rating * w;
        weightSum += w;
      }
    }

    if (weightSum === 0) return 0;
    return Math.round((sum / weightSum) * 100) / 100;
  }, [template, scores]);

  const handleRatingChange = (criterionId: string, rating: number) => {
    if (existingEvaluation?.status === "submitted" && !isAmending) {
      toast.info("Evaluation is submitted. Click 'Amend Evaluation' to propose updates.");
      return;
    }
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        rating,
        evidence: prev[criterionId]?.evidence || "",
      },
    }));
  };

  const handleEvidenceChange = (criterionId: string, evidence: string) => {
    if (existingEvaluation?.status === "submitted" && !isAmending) return;
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        rating: prev[criterionId]?.rating || null,
        evidence,
      },
    }));
  };

  const formatScoresPayload = () => {
    if (!template || !template.criteria) return [];
    return template.criteria.map((c: any) => ({
      criterionId: c.id,
      criterionName: c.name,
      rating: scores[c.id]?.rating || null,
      evidence: scores[c.id]?.evidence || "",
    }));
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        applicationId,
        jobId,
        companyId,
        scores: formatScoresPayload(),
        overallRecommendation: overallRecommendation || null,
        overallNotes,
      };

      await apiFetch("/api/scorecards/draft", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Evaluation draft saved successfully.");
      onEvaluationSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  };

  // Submit Final Evaluation
  const handleSubmit = async () => {
    // Validate required criteria
    if (!template || !template.criteria) return;

    for (const c of template.criteria) {
      if (c.isRequired && (!scores[c.id]?.rating || scores[c.id].rating! < 1)) {
        toast.warn(`Please provide a rating for required criterion: "${c.name}".`);
        return;
      }
    }

    if (!overallRecommendation) {
      toast.warn("Please select an overall hiring recommendation.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        applicationId,
        jobId,
        companyId,
        scores: formatScoresPayload(),
        overallRecommendation,
        overallNotes,
      };

      await apiFetch("/api/scorecards/submit", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Candidate evaluation submitted successfully!");
      onEvaluationSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Amendment
  const handleAmendSubmit = async () => {
    if (!amendmentReason || amendmentReason.trim().length < 5) {
      toast.warn("Please provide a reason for amending this scorecard (minimum 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        scores: formatScoresPayload(),
        overallRecommendation,
        overallNotes,
        amendmentReason,
      };

      await apiFetch(`/api/scorecards/${existingEvaluation._id}/amend`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success("Evaluation amendment recorded with audit history.");
      setIsAmending(false);
      onEvaluationSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit amendment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isSubmitted = existingEvaluation?.status === "submitted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  Candidate Evaluation Scorecard
                </h2>
                {isSubmitted && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Submitted (v{existingEvaluation.templateVersion || 1})
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Evaluating <span className="text-zinc-200 font-medium">{candidateName}</span> for <span className="text-zinc-200 font-medium">{jobTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Weighted Score Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="text-right">
                <div className="text-xs text-zinc-400 font-mono">Weighted Score</div>
                <div className="text-sm font-bold text-white font-mono">
                  {runningWeightedScore > 0 ? `${runningWeightedScore} / 5.0` : "--"}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading evaluation rubric...</p>
            </div>
          ) : (
            <>
              {/* Submitted State Notice & Amendment Toggle */}
              {isSubmitted && !isAmending && (
                <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-sm text-zinc-200 font-medium">
                        Your evaluation was submitted on {new Date(existingEvaluation.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Scorecards are locked to maintain assessment integrity. Authorized evaluators can submit an amendment with documented reasoning.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAmending(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" /> Amend Scorecard
                  </button>
                </div>
              )}

              {/* Amendment Reason Box (if amending) */}
              {isAmending && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> Amendment Reason Required
                  </div>
                  <p className="text-xs text-zinc-400">
                    Document why this scorecard is being updated. All revisions and prior scores are recorded in the permanent audit trail.
                  </p>
                  <input
                    type="text"
                    value={amendmentReason}
                    onChange={(e) => setAmendmentReason(e.target.value)}
                    placeholder="e.g. Corrected technical rating after review of interview code sample"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Rubric Criteria List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Structured Evaluation Criteria ({template?.criteria?.length || 0})
                  </h3>
                  <span className="text-xs text-zinc-400">Scale: 1 (Unsatisfactory) to 5 (Exceptional)</span>
                </div>

                {template?.criteria?.map((crit: any, idx: number) => {
                  const currentScore = scores[crit.id]?.rating;
                  const currentEvidence = scores[crit.id]?.evidence || "";

                  return (
                    <div
                      key={crit.id}
                      className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700/80 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {idx + 1}. {crit.name}
                            </span>
                            {crit.isRequired ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium border border-rose-500/20">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                                Optional
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/30 text-indigo-300 font-mono capitalize">
                              {crit.category}
                            </span>
                            {crit.weight > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                                {crit.weight}x weight
                              </span>
                            )}
                          </div>
                          {crit.description && (
                            <p className="text-xs text-zinc-400 mt-0.5">{crit.description}</p>
                          )}
                        </div>

                        {/* 1-5 Rating Selector */}
                        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isSelected = currentScore === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                disabled={isSubmitted && !isAmending}
                                onClick={() => handleRatingChange(crit.id, val)}
                                title={RATING_DESCRIPTIONS[val]}
                                className={`w-8 h-8 rounded-lg font-mono text-sm font-semibold flex items-center justify-center transition-all ${
                                  isSelected
                                    ? val >= 4
                                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                      : val === 3
                                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                      : "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Descriptive rating feedback label */}
                      {currentScore && (
                        <div className="text-xs text-zinc-300 flex items-center gap-1.5">
                          <span className="font-semibold text-indigo-400">
                            {RATING_LABELS[currentScore]}:
                          </span>
                          <span className="text-zinc-400">{RATING_DESCRIPTIONS[currentScore]}</span>
                        </div>
                      )}

                      {/* Evidence / Notes per criterion */}
                      <input
                        type="text"
                        disabled={isSubmitted && !isAmending}
                        value={currentEvidence}
                        onChange={(e) => handleEvidenceChange(crit.id, e.target.value)}
                        placeholder="Add specific evidence or observations for this criterion..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Overall Recommendation */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  Overall Hiring Recommendation <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RECOMMENDATION_OPTIONS.map((opt) => {
                    const isSelected = overallRecommendation === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isSubmitted && !isAmending}
                        onClick={() => setOverallRecommendation(opt.value)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                          isSelected
                            ? `${opt.color} ring-1 ring-current`
                            : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Internal Evaluation Commentary */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                  Private Interviewer Summary Notes
                  <span className="text-xs text-zinc-500 font-normal">(Never visible to candidate)</span>
                </label>
                <textarea
                  rows={3}
                  disabled={isSubmitted && !isAmending}
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  placeholder="Record summary feedback, strengths, development areas, or specific discussion notes for the hiring team..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60 resize-none"
                />
              </div>

              {/* Revision History (if previously amended) */}
              {existingEvaluation?.history?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Previous Amendments ({existingEvaluation.history.length})
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {existingEvaluation.history.map((h: any, i: number) => (
                      <div key={i} className="text-xs p-2 rounded-lg bg-zinc-800/40 text-zinc-400 flex justify-between">
                        <span>Reason: {h.reason}</span>
                        <span>{new Date(h.modifiedAt).toLocaleString()} by {h.modifiedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Ratings strictly isolated from job seekers.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>

            {(!isSubmitted || isAmending) && (
              <>
                {!isSubmitted && (
                  <button
                    type="button"
                    disabled={saving || submitting}
                    onClick={handleSaveDraft}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Draft"}
                  </button>
                )}

                {isAmending ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleAmendSubmit}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <History className="w-3.5 h-3.5" /> {submitting ? "Saving..." : "Save Amendment"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving || submitting}
                    onClick={handleSubmit}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> {submitting ? "Submitting..." : "Submit Evaluation"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
