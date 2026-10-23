"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  ShieldAlert,
  UserX,
  Briefcase,
  Building2,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

interface ReportItem {
  _id: string;
  reporterEmail: string;
  targetType: "job" | "company" | "user" | "message";
  targetId: string;
  targetIdentifier: string;
  reportedUserEmail?: string;
  category: string;
  reason: string;
  status: "pending" | "in_review" | "resolved" | "dismissed";
  assignedAdminEmail?: string;
  decision?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  fraudulent_job: "Fraudulent Job",
  company_impersonation: "Company Impersonation",
  abusive_behavior: "Abusive Behavior",
  inappropriate_message: "Inappropriate Message",
  policy_violation: "Policy Violation",
  other: "Other Violation",
};

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");

  // Selected report for review modal
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [targetContext, setTargetContext] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState<boolean>(false);

  // Action form inside review modal
  const [actionType, setActionType] = useState<string>("warn_user");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "15",
      });

      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (categoryFilter !== "all") queryParams.append("category", categoryFilter);
      if (targetTypeFilter !== "all") queryParams.append("targetType", targetTypeFilter);
      if (search.trim()) queryParams.append("q", search.trim());

      const data = await apiFetch<{
        reports: ReportItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/reports/admin?${queryParams.toString()}`);

      setReports(data.reports || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load moderation reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, targetTypeFilter, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Open review modal and fetch target context
  const handleOpenReview = async (report: ReportItem) => {
    setSelectedReport(report);
    setResolutionNotes("");
    // Set appropriate default action based on target type
    if (report.targetType === "job") setActionType("close_job");
    else if (report.targetType === "company") setActionType("reject_company");
    else if (report.targetType === "user") setActionType("suspend_user");
    else setActionType("warn_user");

    try {
      setLoadingContext(true);
      const res = await apiFetch<{ report: ReportItem; contextData: any }>(
        `/api/reports/admin/${report._id}`
      );
      setTargetContext(res.contextData);
    } catch (err: any) {
      console.error(err);
      toast.warn("Could not load target entity details; entity may have been deleted.");
    } finally {
      setLoadingContext(false);
    }
  };

  const handleClaimReport = async (reportId: string) => {
    try {
      await apiFetch(`/api/reports/admin/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "in_review" }),
      });
      toast.success("Report marked as In Review");
      fetchReports();
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport({ ...selectedReport, status: "in_review" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update report status");
    }
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!resolutionNotes.trim()) {
      toast.error("Please provide resolution notes explaining the decision.");
      return;
    }

    try {
      setSubmittingAction(true);
      await apiFetch(`/api/reports/admin/${selectedReport._id}/action`, {
        method: "POST",
        body: JSON.stringify({
          actionType,
          resolutionNotes: resolutionNotes.trim(),
        }),
      });

      toast.success("Moderation action applied and report marked as resolved.");
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Failed to execute moderation action");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case "job":
        return <Briefcase size={14} className="text-blue-400" />;
      case "company":
        return <Building2 size={14} className="text-emerald-400" />;
      case "user":
        return <User size={14} className="text-purple-400" />;
      case "message":
        return <MessageSquare size={14} className="text-amber-400" />;
      default:
        return <AlertTriangle size={14} className="text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300 border border-amber-500/20">
            <Clock size={12} /> Pending Review
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/20">
            <ShieldAlert size={12} /> In Review
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Resolved
          </span>
        );
      case "dismissed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-400 border border-zinc-500/20">
            <XCircle size={12} /> Dismissed
          </span>
        );
      default:
        return <span className="text-xs text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-indigo-400" size={24} />
            <h1 className="text-3xl font-bold tracking-tight text-white">Moderation & Reports</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Investigate user-submitted violation reports, enforce platform rules, and record auditable moderation decisions.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 min-w-[240px]">
          <Search size={16} className="text-zinc-500" />
          <input
            type="text"
            placeholder="Search by target, reporter, or reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        {/* Target Type Filter */}
        <select
          value={targetTypeFilter}
          onChange={(e) => {
            setTargetTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
        >
          <option value="all">All Targets</option>
          <option value="job">Jobs</option>
          <option value="company">Companies</option>
          <option value="user">Users</option>
          <option value="message">Messages</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          <option value="fraudulent_job">Fraudulent Job</option>
          <option value="company_impersonation">Company Impersonation</option>
          <option value="abusive_behavior">Abusive Behavior</option>
          <option value="inappropriate_message">Inappropriate Message</option>
          <option value="policy_violation">Policy Violation</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <span className="text-sm">Loading moderation reports...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert size={36} className="text-zinc-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No violation reports found</h3>
            <p className="mt-1 max-w-sm text-xs text-zinc-400">
              {search || statusFilter !== "all"
                ? "No reports match your selected criteria. Try adjusting filters."
                : "The moderation queue is currently clear."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Target Entity</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">Reporter</th>
                  <th className="px-5 py-3.5 font-medium">Description</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Submitted</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {getTargetIcon(report.targetType)}
                        <span className="font-semibold text-white max-w-[200px] truncate" title={report.targetIdentifier}>
                          {report.targetIdentifier || `${report.targetType} (${report.targetId})`}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                        {report.targetType}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-block rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-300 border border-white/10">
                        {CATEGORY_LABELS[report.category] || report.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-zinc-400 font-mono text-[11px]">
                      {report.reporterEmail}
                    </td>

                    <td className="px-5 py-4 max-w-xs text-zinc-300">
                      <p className="line-clamp-2 leading-relaxed" title={report.reason}>
                        {report.reason}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(report.status)}
                    </td>

                    <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleOpenReview(report)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 transition cursor-pointer"
                      >
                        <Eye size={12} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-zinc-400">
            <span>
              Showing {reports.length} of {total} reports
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review & Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {getTargetIcon(selectedReport.targetType)}
                  <h2 className="text-lg font-bold text-white">
                    Review Report #{selectedReport._id.slice(-6)}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Target: <strong className="text-white">{selectedReport.targetIdentifier}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-xl border border-white/10 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Report Details Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 text-zinc-400">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Category</span>
                  <span className="font-medium text-white">
                    {CATEGORY_LABELS[selectedReport.category] || selectedReport.category}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block">Current Status</span>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block">Reporter</span>
                  <span className="font-mono text-zinc-300">{selectedReport.reporterEmail}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block">Reported User / Account</span>
                  <span className="font-mono text-zinc-300">
                    {selectedReport.reportedUserEmail || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-zinc-500 block mb-1">Violation Description</span>
                <p className="rounded-xl border border-white/10 bg-black/60 p-3 text-zinc-200 leading-relaxed">
                  {selectedReport.reason}
                </p>
              </div>
            </div>

            {/* Target Context Section (Safe contextual inspection) */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Target Entity Context
              </h3>

              {loadingContext ? (
                <div className="py-4 text-center text-xs text-zinc-500">Loading context...</div>
              ) : targetContext ? (
                <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-xs space-y-1.5">
                  {selectedReport.targetType === "job" && (
                    <>
                      <p><strong className="text-zinc-400">Job Title:</strong> {targetContext.title}</p>
                      <p><strong className="text-zinc-400">Company:</strong> {targetContext.companyName}</p>
                      <p><strong className="text-zinc-400">Recruiter:</strong> {targetContext.recruiterEmail}</p>
                      <p><strong className="text-zinc-400">Location:</strong> {targetContext.location || "Remote"}</p>
                    </>
                  )}
                  {selectedReport.targetType === "company" && (
                    <>
                      <p><strong className="text-zinc-400">Company Name:</strong> {targetContext.name}</p>
                      <p><strong className="text-zinc-400">Industry:</strong> {targetContext.industry}</p>
                      <p><strong className="text-zinc-400">Recruiter Owner:</strong> {targetContext.recruiterEmail}</p>
                      <p><strong className="text-zinc-400">Verification Status:</strong> {targetContext.status}</p>
                    </>
                  )}
                  {selectedReport.targetType === "user" && (
                    <>
                      <p><strong className="text-zinc-400">Name:</strong> {targetContext.name || "N/A"}</p>
                      <p><strong className="text-zinc-400">Email:</strong> {targetContext.email}</p>
                      <p><strong className="text-zinc-400">Role:</strong> {targetContext.role}</p>
                      <p><strong className="text-zinc-400">Account Standing:</strong> {targetContext.status || "active"}</p>
                    </>
                  )}
                  {selectedReport.targetType === "message" && (
                    <>
                      <p><strong className="text-zinc-400">Message Content:</strong> &ldquo;{targetContext.message?.body}&rdquo;</p>
                      <p><strong className="text-zinc-400">Sent By:</strong> {targetContext.message?.senderEmail}</p>
                      <p className="text-[11px] text-zinc-500 italic mt-1">
                        Note: Candidate screening notes are strictly excluded and kept confidential.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500">Entity details are unavailable or were previously deleted.</p>
              )}
            </div>

            {/* Moderation Actions Form */}
            {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" ? (
              <form onSubmit={handleExecuteAction} className="space-y-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Execute Moderation Decision</h3>
                  {selectedReport.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleClaimReport(selectedReport._id)}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Mark In Review First
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Select Action
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="warn_user">Warn User (Policy Reminder)</option>
                      <option value="suspend_user">Suspend User Account</option>
                      <option value="close_job">Close / Remove Job</option>
                      <option value="reject_company">Reject Company Verification</option>
                      <option value="dismiss_report">Dismiss Report (No Action)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Resolution Notes (Required for Audit Trail)
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Explain the rationale behind this moderation decision..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black p-3 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {submittingAction ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Confirm Decision
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-1">
                <span className="font-semibold text-emerald-400 block">Report Closed</span>
                <p className="text-zinc-300">
                  Decision: <strong>{selectedReport.decision}</strong> by {selectedReport.resolvedBy}
                </p>
                {selectedReport.resolutionNotes && (
                  <p className="text-zinc-400 mt-1">
                    Notes: &ldquo;{selectedReport.resolutionNotes}&rdquo;
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
