"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Building2,
  Check,
  Eye,
  Search,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

interface CompanyItem {
  _id: string;
  name: string;
  industry: string;
  location: string;
  website?: string;
  description?: string;
  size?: string;
  logo?: string;
  recruiterEmail: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [counts, setCounts] = useState<{
    pending: number;
    approved: number;
    rejected: number;
    all: number;
  }>({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Inspection modal
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);

  // Rejection modal
  const [rejectingCompany, setRejectingCompany] = useState<CompanyItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "15",
      });

      if (statusFilter !== "all") queryParams.append("status", statusFilter);
      if (searchQuery.trim()) queryParams.append("q", searchQuery.trim());

      const data = await apiFetch<{
        companies: CompanyItem[];
        total: number;
        page: number;
        totalPages: number;
        counts: { pending: number; approved: number; rejected: number; all: number };
      }>(`/api/companies/admin/queue?${queryParams.toString()}`);

      setCompanies(data.companies || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.counts) setCounts(data.counts);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load company verification queue");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleApprove = async (company: CompanyItem) => {
    if (!confirm(`Are you sure you want to approve "${company.name}" for public verification?`)) {
      return;
    }

    try {
      setSubmittingAction(true);
      await apiFetch(`/api/companies/${company._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
      });

      toast.success(`Company "${company.name}" has been approved.`);
      fetchCompanies();
      if (selectedCompany && selectedCompany._id === company._id) {
        setSelectedCompany({ ...selectedCompany, status: "approved" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve company");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCompany) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    try {
      setSubmittingAction(true);
      await apiFetch(`/api/companies/${rejectingCompany._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      toast.success(`Company "${rejectingCompany.name}" rejected.`);
      setRejectingCompany(null);
      setRejectionReason("");
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject company");
    } finally {
      setSubmittingAction(false);
    }
  };

  const statusTones: Record<string, string> = {
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    rejected: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-indigo-400" size={24} />
            <h1 className="text-3xl font-bold tracking-tight text-white">Company Verification</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Review employer verification requests, evaluate business authenticity, and approve public directory access.
          </p>
        </div>

        <button
          onClick={fetchCompanies}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: "all", label: "All Companies", count: counts.all },
          { id: "pending", label: "Pending Verification", count: counts.pending },
          { id: "approved", label: "Verified & Approved", count: counts.approved },
          { id: "rejected", label: "Rejected Submissions", count: counts.rejected },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3.5 py-2 text-zinc-400">
        <Search size={16} />
        <input
          className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
          placeholder="Search companies by name, recruiter email, or location..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Companies Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <span className="text-sm">Loading company records...</span>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            No registered company accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="border-b border-white/10 bg-black/40 text-zinc-400">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Company</th>
                  <th className="px-5 py-3.5 font-medium">Industry</th>
                  <th className="px-5 py-3.5 font-medium">Location</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Submitted</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {companies.map((company) => {
                  const compId = company._id;
                  const status = company.status || "pending";
                  return (
                    <tr key={compId} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5 shrink-0">
                            <Image
                              src={company.logo || "/logos/nvidia.png"}
                              alt={`${company.name} logo`}
                              width={24}
                              height={24}
                              className="h-auto w-auto object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{company.name}</p>
                            <p className="text-[11px] font-mono text-zinc-500">
                              {company.recruiterEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-zinc-300">{company.industry}</td>
                      <td className="px-5 py-4 text-zinc-300">{company.location}</td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] capitalize ${statusTones[status]}`}>
                          {status === "approved" && <CheckCircle2 size={11} />}
                          {status === "pending" && <Clock size={11} />}
                          {status === "rejected" && <XCircle size={11} />}
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                        {new Date(company.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye size={14} />
                          </button>

                          {status !== "approved" && (
                            <button
                              onClick={() => handleApprove(company)}
                              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                              title="Approve Company"
                            >
                              <Check size={14} />
                            </button>
                          )}

                          {status !== "rejected" && (
                            <button
                              onClick={() => {
                                setRejectingCompany(company);
                                setRejectionReason("");
                              }}
                              className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                              title="Reject Company"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-zinc-400">
            <span>
              Showing {companies.length} of {total} companies
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

      {/* Details Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2">
                  <Image
                    src={selectedCompany.logo || "/logos/nvidia.png"}
                    alt={selectedCompany.name}
                    width={32}
                    height={32}
                    className="h-auto w-auto object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedCompany.name}</h3>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] capitalize mt-1 ${statusTones[selectedCompany.status]}`}>
                    {selectedCompany.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompany(null)}
                className="rounded-xl border border-white/10 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-zinc-300">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Industry</span>
                  <span className="font-medium text-white">{selectedCompany.industry}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Location</span>
                  <span className="font-medium text-white">{selectedCompany.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Recruiter Account</span>
                  <span className="font-mono text-zinc-300">{selectedCompany.recruiterEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Company Size</span>
                  <span>{selectedCompany.size || "Not specified"}</span>
                </div>
              </div>

              {selectedCompany.website && (
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">Official Website</span>
                  <a
                    href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline"
                  >
                    {selectedCompany.website} <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {selectedCompany.description && (
                <div>
                  <span className="text-[10px] text-zinc-500 block mb-1">Company Description</span>
                  <p className="rounded-xl border border-white/10 bg-black/60 p-3 text-zinc-300 leading-relaxed">
                    {selectedCompany.description}
                  </p>
                </div>
              )}

              {selectedCompany.rejectionReason && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300 space-y-1">
                  <span className="font-semibold block">Rejection Reason:</span>
                  <p>{selectedCompany.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition"
              >
                Close
              </button>

              {selectedCompany.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedCompany)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Approve Company
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Company Verification</h3>
                <p className="text-xs text-zinc-400">{rejectingCompany.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Rejection Reason (Required for Audit Trail & Feedback)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain why this company profile is being rejected (e.g. unverified website domain, incomplete registration details)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black p-3 text-xs text-white outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingCompany(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submittingAction}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50 shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {submittingAction ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
