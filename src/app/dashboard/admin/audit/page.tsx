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

      const res = await apiFetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch (err) {
      console.error("Audit log error:", err);
      toast.error("Network error loading audit trail");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">Security & Compliance</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl text-white">Administrator Audit Log</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Immutable audit trail of administrative moderation, user privilege adjustments, and billing overrides.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh Log
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4">
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
          </select>
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
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-zinc-400 text-xs">
                <tr>
                  <th className="px-5 py-4 font-medium">Timestamp</th>
                  <th className="px-5 py-4 font-medium">Actor</th>
                  <th className="px-5 py-4 font-medium">Action</th>
                  <th className="px-5 py-4 font-medium">Target</th>
                  <th className="px-5 py-4 font-medium">Outcome</th>
                  <th className="px-5 py-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 text-xs text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-300">
                      {log.actorEmail}
                    </td>
                    <td className="px-5 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-5 py-4 text-xs text-white font-medium max-w-[200px] truncate">
                      {log.targetIdentifier || log.targetId || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20 capitalize">
                        {log.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            No audit records found matching the specified filters.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-xs text-zinc-400">
            <span>
              Page {page} of {totalPages} ({total} total entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-400" />
                <h3 className="text-lg font-semibold">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-zinc-500">Event Action</p>
                <p className="mt-1 font-semibold text-white">{selectedLog.action}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-zinc-500">Timestamp</p>
                <p className="mt-1 font-semibold text-white">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-zinc-500">Actor Identity</p>
                <p className="mt-1 font-mono font-medium text-indigo-300">{selectedLog.actorEmail}</p>
                <p className="text-[10px] text-zinc-500">Role: {selectedLog.actorRole}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <p className="text-zinc-500">Target Entity</p>
                <p className="mt-1 font-semibold text-white">
                  {selectedLog.targetIdentifier || selectedLog.targetId}
                </p>
                <p className="text-[10px] text-zinc-500">Type: {selectedLog.targetType}</p>
              </div>
            </div>

            {/* Before vs After Snapshots */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-zinc-400">State Before Change</p>
                <pre className="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black p-3 font-mono text-[11px] text-amber-300">
                  {JSON.stringify(selectedLog.before || {}, null, 2)}
                </pre>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-zinc-400">State After Change</p>
                <pre className="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black p-3 font-mono text-[11px] text-emerald-300">
                  {JSON.stringify(selectedLog.after || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
