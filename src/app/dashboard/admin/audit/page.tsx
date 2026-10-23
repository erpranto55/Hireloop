"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  Clock,
  UserCheck,
  Building2,
  Briefcase,
  CreditCard,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileCode,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

interface AuditLogItem {
  _id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  targetIdentifier: string;
  before: any;
  after: any;
  outcome: string;
  metadata?: any;
}

function getActionBadge(action: string) {
  switch (action) {
    case "user_status_changed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300 border border-amber-500/20">
          <UserCheck size={12} /> Status Change
        </span>
      );
    case "user_role_changed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-300 border border-purple-500/20">
          <ShieldCheck size={12} /> Role Change
        </span>
      );
    case "admin_plan_updated":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300 border border-violet-500/20">
          <CreditCard size={12} /> Plan Adjustment
        </span>
      );
    case "company_moderated":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/20">
          <Building2 size={12} /> Company Moderation
        </span>
      );
    case "job_moderated":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/20">
          <Briefcase size={12} /> Job Moderation
        </span>
      );
    case "job_deleted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-300 border border-rose-500/20">
          <AlertCircle size={12} /> Job Deletion
        </span>
      );
    case "report_status_changed":
    case "moderation_action_executed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300 border border-amber-500/20">
          <AlertTriangle size={12} /> Moderation Action
        </span>
      );
    case "announcement_broadcast":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/20">
          <Megaphone size={12} /> Announcement
        </span>
      );
    case "audit_logs_exported":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-500/20">
          <Download size={12} /> Compliance Export
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300 border border-zinc-500/20">
          {action}
        </span>
      );
  }
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("q", search.trim());
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (targetTypeFilter !== "all") params.set("targetType", targetTypeFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const data = await apiFetch<{
        logs: AuditLogItem[];
        total: number;
        totalPages: number;
      }>(`/api/admin/audit-logs?${params.toString()}`);

      setLogs(data?.logs || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (err: any) {
      console.error("Audit log error:", err);
      toast.error(err.message || "Network error loading audit trail");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, targetTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExport = (format: "csv" | "json") => {
    const params = new URLSearchParams({ format });
    if (search.trim()) params.set("q", search.trim());
    if (actionFilter !== "all") params.set("action", actionFilter);
    if (targetTypeFilter !== "all") params.set("targetType", targetTypeFilter);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const exportUrl = `${baseUrl}/api/admin/audit-logs/export?${params.toString()}`;
    window.open(exportUrl, "_blank");
    toast.info(`Preparing ${format.toUpperCase()} compliance export...`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-indigo-400" size={24} />
            <h1 className="text-3xl font-bold tracking-tight text-white">Administrator Audit Log</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Immutable, append-only compliance record of all administrative operations, moderation decisions, and privilege modifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Export Buttons */}
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition cursor-pointer"
            title="Export filtered records as CSV (formula injection protected)"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition cursor-pointer"
            title="Export filtered records as JSON"
          >
            <FileCode size={14} className="text-blue-400" /> Export JSON
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by target, actor email, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </form>

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="user_status_changed">User Status Changed</option>
              <option value="user_role_changed">User Role Changed</option>
              <option value="admin_plan_updated">Plan / Billing Override</option>
              <option value="company_moderated">Company Moderated</option>
              <option value="job_moderated">Job Moderated</option>
              <option value="job_deleted">Job Deleted</option>
              <option value="moderation_action_executed">Moderation Action Executed</option>
              <option value="report_status_changed">Report Status Changed</option>
              <option value="announcement_broadcast">Announcement Broadcast</option>
              <option value="audit_logs_exported">Audit Export</option>
            </select>

            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Targets</option>
              <option value="user">User</option>
              <option value="company">Company</option>
              <option value="job">Job</option>
              <option value="report">Report</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>
        </div>

        {/* Date boundary filters */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Calendar size={14} /> Date Range:
          </span>
          <label className="flex items-center gap-1.5">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-white/10 bg-black px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
            />
          </label>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="text-xs text-indigo-400 hover:underline cursor-pointer"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Audit Events ({total})</h2>
          </div>
          <span className="text-xs text-zinc-500">Append-only compliance records</span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle size={32} className="text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">No audit events found</p>
            <p className="mt-1 text-xs text-zinc-500">Try adjusting your filters or date boundary.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Timestamp</th>
                  <th className="px-5 py-3.5 font-medium">Actor</th>
                  <th className="px-5 py-3.5 font-medium">Action</th>
                  <th className="px-5 py-3.5 font-medium">Target</th>
                  <th className="px-5 py-3.5 font-medium">Outcome</th>
                  <th className="px-5 py-3.5 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{log.actorEmail}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{log.actorRole}</div>
                    </td>

                    <td className="px-5 py-4">{getActionBadge(log.action)}</td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white max-w-[200px] truncate" title={log.targetIdentifier}>
                        {log.targetIdentifier || log.targetId || "System"}
                      </div>
                      <div className="text-[10px] text-zinc-500 capitalize">{log.targetType}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          log.outcome === "success"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-zinc-400">
            <span>
              Showing {logs.length} of {total} records
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
      </section>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Audit Event Details</h3>
                <p className="text-xs text-zinc-400 mt-0.5">ID: {selectedLog._id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-white/10 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 block">Timestamp</span>
                <span className="font-mono text-zinc-200">{new Date(selectedLog.timestamp).toISOString()}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 block">Actor</span>
                <span className="font-mono text-zinc-200">{selectedLog.actorEmail} ({selectedLog.actorRole})</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 block">Action</span>
                <span className="font-semibold text-white">{selectedLog.action}</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 block">Target Entity</span>
                <span className="font-medium text-white">{selectedLog.targetIdentifier} ({selectedLog.targetType})</span>
              </div>
            </div>

            {/* Before and After Diffs */}
            <div className="space-y-3 text-xs">
              {selectedLog.before && (
                <div>
                  <span className="font-semibold text-amber-400 block mb-1">State Before Mutation:</span>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <span className="font-semibold text-emerald-400 block mb-1">State After Mutation:</span>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="font-semibold text-zinc-400 block mb-1">Metadata:</span>
                  <pre className="rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-zinc-400 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
