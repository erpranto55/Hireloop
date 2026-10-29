"use client";

import React, { useState, useEffect } from "react";
import {
  Workflow,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Pause,
  History,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Building2,
  Briefcase,
  X,
  Sliders,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

const TRIGGER_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  all_evaluations_submitted: {
    label: "All Evaluations Submitted",
    desc: "Fires when all assigned evaluators or minimum scorecards have been submitted.",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  },
  interview_completed: {
    label: "Interview Completed",
    desc: "Fires when an interview appointment status is marked Completed.",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  evaluation_threshold_met: {
    label: "Evaluation Threshold Met",
    desc: "Fires when candidate aggregate weighted score reaches configured benchmark.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
};

const ACTION_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  mark_ready_for_review: {
    label: "Mark Ready for Decision",
    desc: "Sets application review status to 'ready_for_decision' and alerts hiring manager.",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  advance_stage: {
    label: "Advance Recruitment Stage",
    desc: "Progresses application to the next permitted pipeline stage.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  notify_hiring_manager: {
    label: "Notify Hiring Team",
    desc: "Dispatches transactional email and in-app alert to vacancy stakeholders.",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
};

const SAFE_STAGES = ["Under Review", "Shortlisted", "Interview Scheduled"];
const CONSEQUENTIAL_STAGES = ["Offered", "Accepted", "Rejected"];

export default function PipelineAutomationPage() {
  const { data: session } = useSession();
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [jobs, setJobs] = useState<any[]>([]);

  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDesc, setRuleDesc] = useState("");
  const [ruleJobId, setRuleJobId] = useState<string>("");
  const [ruleTrigger, setRuleTrigger] = useState("all_evaluations_submitted");
  const [ruleAction, setRuleAction] = useState("mark_ready_for_review");
  const [ruleTargetStage, setRuleTargetStage] = useState("Shortlisted");
  const [allowConsequential, setAllowConsequential] = useState(false);
  const [minScore, setMinScore] = useState<number>(3.5);
  const [minEvaluations, setMinEvaluations] = useState<number>(1);
  const [creating, setCreating] = useState(false);

  // Load companies
  useEffect(() => {
    apiFetch<any[]>("/api/team/my-workspaces")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setCompanies(res);
          setSelectedCompanyId(res[0].companyId);
        }
      })
      .catch((err) => {
        console.error("Failed to load workspaces:", err.message);
      });
  }, []);

  // Load jobs, rules, and logs when companyId changes
  const loadWorkspaceData = async (companyId: string) => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [jobsRes, rulesRes, logsRes] = await Promise.all([
        apiFetch<any[]>(`/api/jobs?companyId=${companyId}`).catch(() => []),
        apiFetch<any[]>(`/api/automation/rules?companyId=${companyId}`).catch(() => []),
        apiFetch<any[]>(`/api/automation/logs?companyId=${companyId}&limit=30`).catch(() => []),
      ]);

      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      setRules(Array.isArray(rulesRes) ? rulesRes : []);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load automation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompanyId) {
      loadWorkspaceData(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Toggle Rule
  const handleToggleRule = async (ruleId: string, currentState: boolean) => {
    setTogglingRuleId(ruleId);
    try {
      await apiFetch(`/api/automation/rules/${ruleId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: !currentState }),
      });
      setRules((prev) =>
        prev.map((r) => (r._id === ruleId ? { ...r, isEnabled: !currentState } : r))
      );
      toast.success(`Rule "${!currentState ? "Enabled" : "Paused"}" successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update rule state.");
    } finally {
      setTogglingRuleId(null);
    }
  };

  // Create Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.warn("Rule name is required.");
      return;
    }

    setCreating(true);
    try {
      const payload: any = {
        companyId: selectedCompanyId,
        jobId: ruleJobId || null,
        name: ruleName.trim(),
        description: ruleDesc.trim(),
        trigger: ruleTrigger,
        action: ruleAction,
        conditions: {
          minScore: Number(minScore) || 3.5,
          minEvaluations: Number(minEvaluations) || 1,
        },
      };

      if (ruleAction === "advance_stage") {
        payload.targetStage = ruleTargetStage;
        payload.allowConsequentialTransition = allowConsequential;
      }

      await apiFetch("/api/automation/rules", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Pipeline automation rule created successfully!");
      setShowCreateModal(false);
      // Reset form
      setRuleName("");
      setRuleDesc("");
      setRuleJobId("");
      setRuleTrigger("all_evaluations_submitted");
      setRuleAction("mark_ready_for_review");
      setAllowConsequential(false);
      // Reload
      loadWorkspaceData(selectedCompanyId);
    } catch (err: any) {
      toast.error(err.message || "Failed to create rule.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Recruitment Pipeline Automation
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Safe Guardrails
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Automate verified candidate transitions based on completed evaluation scorecards and explicit criteria, while strictly preserving human hiring authority.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace Switcher */}
          {companies.length > 1 && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.companyId} value={c.companyId} className="bg-zinc-900">
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Automation Rule
          </button>
        </div>
      </div>

      {/* Safety & Human Approval Notice */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-xs text-zinc-300 leading-relaxed">
          <p className="font-semibold text-white">Deterministic & Safe Automation Policy</p>
          <p className="text-zinc-400 mt-0.5">
            Every automated progression is strictly validated against permitted application lifecycle transitions (<code className="text-indigo-300">Applied &rarr; Under Review &rarr; Shortlisted &rarr; Interview Scheduled</code>). Final offers and rejections require explicit human decision-making and are never dispatched without confirmation.
          </p>
        </div>
      </div>

      {/* Rules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Workflow className="w-4 h-4 text-indigo-400" /> Active Automation Rules ({rules.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading automation rules...</p>
          </div>
        ) : rules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const triggerMeta = TRIGGER_LABELS[rule.trigger] || { label: rule.trigger, color: "text-zinc-400 bg-zinc-800" };
              const actionMeta = ACTION_LABELS[rule.action] || { label: rule.action, color: "text-zinc-400 bg-zinc-800" };
              const isToggling = togglingRuleId === rule._id;

              return (
                <div
                  key={rule._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    rule.isEnabled
                      ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                      : "bg-zinc-900/30 border-zinc-800/40 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            rule.isEnabled
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {rule.isEnabled ? "Active" : "Paused"}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{rule.description}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleRule(rule._id, rule.isEnabled)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        rule.isEnabled
                          ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                          : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                      }`}
                      title={rule.isEnabled ? "Pause Rule" : "Activate Rule"}
                    >
                      {rule.isEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Flow Summary Badges */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${triggerMeta.color}`}>
                      {triggerMeta.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${actionMeta.color}`}>
                      {rule.action === "advance_stage" && rule.targetStage
                        ? `Advance to "${rule.targetStage}"`
                        : actionMeta.label}
                    </span>
                  </div>

                  {/* Conditions & Scope */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>
                      Scope: {rule.jobId ? "Specific Vacancy" : "All Company Jobs"}
                    </span>
                    {rule.conditions?.minScore && (
                      <span>Min Score: &ge; {rule.conditions.minScore}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-2">
            <Sliders className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">No automation rules configured yet.</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Create your first workflow rule to automatically mark candidates ready for decision when all interview evaluations are submitted.
            </p>
          </div>
        )}
      </div>

      {/* Execution Logs Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" /> Recent Execution Audit Logs ({logs.length})
          </h2>
        </div>

        {logs.length > 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Rule Name</th>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Details / Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {logs.map((log: any) => (
                    <tr key={log._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-400 font-mono">
                        {log.claimedAt ? new Date(log.claimedAt).toLocaleString() : "Recently"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{log.ruleName}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        <div>{log.candidateName}</div>
                        <div className="text-[10px] text-zinc-500">{log.jobTitle}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 capitalize">
                        {log.trigger?.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                            log.status === "executed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : log.status === "skipped"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                        {log.outcome || log.reason || log.error || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            No pipeline automation actions have been executed yet.
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Automation Rule</h3>
                  <p className="text-xs text-zinc-400">Configure safe trigger and action workflows</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              {/* Rule Name */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Auto-mark ready for review when scorecards complete"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Summarize the intent and operating policy of this rule..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Vacancy Scope */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Vacancy Scope</label>
                <select
                  value={ruleJobId}
                  onChange={(e) => setRuleJobId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Company Vacancies (Workspace-wide)</option>
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} ({j.department || "General"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Trigger Event *</label>
                <select
                  value={ruleTrigger}
                  onChange={(e) => setRuleTrigger(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all_evaluations_submitted">All Assigned Evaluations Submitted</option>
                  <option value="interview_completed">Interview Appointment Completed</option>
                  <option value="evaluation_threshold_met">Evaluation Score Threshold Met</option>
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Automated Action *</label>
                <select
                  value={ruleAction}
                  onChange={(e) => setRuleAction(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="mark_ready_for_review">Mark Application Ready for Decision & Notify Team</option>
                  <option value="advance_stage">Advance Application to Next Pipeline Stage</option>
                  <option value="notify_hiring_manager">Dispatch Notification Alert to Hiring Manager</option>
                </select>
              </div>

              {/* Target Stage (if advance_stage) */}
              {ruleAction === "advance_stage" && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                  <div>
                    <label className="block text-indigo-300 font-semibold mb-1">Target Pipeline Stage *</label>
                    <select
                      value={ruleTargetStage}
                      onChange={(e) => setRuleTargetStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white"
                    >
                      {SAFE_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      {CONSEQUENTIAL_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st} (Requires Explicit Approval)
                        </option>
                      ))}
                    </select>
                  </div>

                  {CONSEQUENTIAL_STAGES.includes(ruleTargetStage) && (
                    <div className="flex items-start gap-2 text-[11px] text-amber-300">
                      <input
                        type="checkbox"
                        id="consequentialCheck"
                        checked={allowConsequential}
                        onChange={(e) => setAllowConsequential(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700"
                      />
                      <label htmlFor="consequentialCheck">
                        I confirm that transitioning to &quot;{ruleTargetStage}&quot; is explicitly authorized and intentional.
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Threshold Conditions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Min Weighted Score (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Min Completed Evals</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={minEvaluations}
                    onChange={(e) => setMinEvaluations(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> {creating ? "Creating..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
