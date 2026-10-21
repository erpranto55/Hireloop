"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Clock,
  Filter,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

export default function RecruiterAnalyticsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [period, setPeriod] = useState<string>("30d");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [funnelView, setFunnelView] = useState<"current" | "historical">("current");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ period });
      if (selectedJobId) {
        queryParams.set("jobId", selectedJobId);
      }

      const res = await apiFetch(`/api/analytics/recruiter?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      } else {
        toast.error("Failed to load recruiter analytics");
      }
    } catch (err) {
      console.error("Recruiter analytics error:", err);
      toast.error("Network error loading analytics");
    } finally {
      setLoading(false);
    }
  }, [user, period, selectedJobId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !analyticsData) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const jobCounts = analyticsData?.jobStatusCounts || { total: 0, active: 0, closed: 0 };
  const totalViews = analyticsData?.totalJobViews || 0;
  const totalApps = analyticsData?.totalApplications || 0;
  const conversionRate = analyticsData?.conversionRate;
  const timeToHire = analyticsData?.timeToHire || { averageDays: null, sampleSize: 0 };
  const jobsPerformance = analyticsData?.jobsPerformance || [];

  const funnelData = funnelView === "current"
    ? analyticsData?.pipelineFunnel?.currentStages || {}
    : analyticsData?.pipelineFunnel?.historicalTransitions || {};

  const funnelMax = Math.max(...Object.values(funnelData).map((v: any) => Number(v) || 0), 1);

  const stageColors: Record<string, string> = {
    "Applied": "bg-blue-500",
    "Under Review": "bg-indigo-500",
    "Shortlisted": "bg-purple-500",
    "Interview Scheduled": "bg-amber-500",
    "Offered": "bg-emerald-500",
    "Accepted": "bg-green-500",
    "Rejected": "bg-rose-500",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">Intelligence & Metrics</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl text-white">Recruitment Analytics</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Performance metrics, candidate pipeline conversion, and verified time-to-hire benchmarks.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
            {["7d", "30d", "90d", "all"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 font-medium transition cursor-pointer ${
                  period === p ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {p === "all" ? "All History" : `Last ${p.toUpperCase()}`}
              </button>
            ))}
          </div>

          {/* Job filter dropdown */}
          {jobsPerformance.length > 0 && (
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Jobs ({jobsPerformance.length})</option>
              {jobsPerformance.map((j: any) => (
                <option key={j._id} value={j._id}>
                  {j.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Briefcase size={20} className="text-indigo-400" />
          <p className="mt-3 text-2xl font-semibold text-white">{jobCounts.total}</p>
          <p className="mt-1 text-xs text-zinc-500">Total Jobs ({jobCounts.active} Active)</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Eye size={20} className="text-blue-400" />
          <p className="mt-3 text-2xl font-semibold text-white">{totalViews.toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-500">Listing Views</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Users size={20} className="text-purple-400" />
          <p className="mt-3 text-2xl font-semibold text-white">{totalApps.toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-500">Applications Received</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <TrendingUp size={20} className="text-emerald-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {conversionRate !== null ? `${conversionRate}%` : "N/A"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Application Conversion</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <CheckCircle2 size={20} className="text-green-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {funnelData["Accepted"] || 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Offers Accepted</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Clock size={20} className="text-amber-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {timeToHire.averageDays !== null ? `${timeToHire.averageDays}d` : "N/A"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Avg Time-to-Hire</p>
        </div>
      </div>

      {/* Main Grid: Pipeline Funnel + Time-to-Hire Insights */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Card: Pipeline Funnel */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
            <div>
              <h2 className="text-xl font-semibold text-white">Recruitment Pipeline Funnel</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Candidate distribution across standard lifecycle stages
              </p>
            </div>

            <div className="flex rounded-xl border border-white/10 bg-black p-1 text-xs">
              <button
                onClick={() => setFunnelView("current")}
                className={`rounded-lg px-3 py-1 font-medium transition cursor-pointer ${
                  funnelView === "current" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Current Stage
              </button>
              <button
                onClick={() => setFunnelView("historical")}
                className={`rounded-lg px-3 py-1 font-medium transition cursor-pointer ${
                  funnelView === "historical" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Historical Progression
              </button>
            </div>
          </div>

          {/* Funnel Stage Bars */}
          <div className="mt-6 space-y-4">
            {Object.entries(funnelData).map(([stage, count]: [string, any]) => {
              const countNum = Number(count) || 0;
              const percent = Math.round((countNum / funnelMax) * 100);
              const colorClass = stageColors[stage] || "bg-indigo-500";

              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300">{stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{countNum}</span>
                      <span className="text-zinc-500">
                        ({totalApps > 0 ? Math.round((countNum / totalApps) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                      style={{ width: `${Math.max(percent, countNum > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-white/5 bg-black/40 p-3 text-xs text-zinc-400">
            <Info size={15} className="shrink-0 text-indigo-400 mt-0.5" />
            <span>
              {funnelView === "current"
                ? "Current Stage represents where active candidates currently sit in the pipeline."
                : "Historical Progression tracks all candidates who have successfully passed through each milestone."}
            </span>
          </div>
        </section>

        {/* Right Card: Time-to-Hire & Conversion Insights */}
        <section className="space-y-6">
          {/* Time to hire details */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-amber-400" />
              <h3 className="text-lg font-semibold text-white">Time-to-Hire Benchmark</h3>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                <span className="text-zinc-400">Average Duration:</span>
                <span className="font-semibold text-white">
                  {timeToHire.averageDays !== null ? `${timeToHire.averageDays} days` : "Insufficient data"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                <span className="text-zinc-400">Median Duration:</span>
                <span className="font-semibold text-white">
                  {timeToHire.medianDays !== null ? `${timeToHire.medianDays} days` : "Insufficient data"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-zinc-400">Hired Candidate Sample:</span>
                <span className="font-semibold text-indigo-400">
                  {timeToHire.sampleSize} {timeToHire.sampleSize === 1 ? "hire" : "hires"}
                </span>
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              Measured from candidate application submission to terminal Accepted status. Excludes in-progress or withdrawn applications.
            </p>
          </div>

          {/* Conversion notice */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-blue-400" />
              <h3 className="text-base font-semibold text-white">View Tracking Integrity</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {analyticsData?.hasViewData
                ? `Job view events are deduplicated within 1-hour sessions to prevent artificial refresh inflation.`
                : "Job view tracking was enabled on October 21, 2026. Conversion rates will populate as candidate views accumulate."}
            </p>
          </div>
        </section>
      </div>

      {/* Jobs Performance Table */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-semibold text-white">Individual Job Performance</h2>
          <p className="text-xs text-zinc-400 mt-1">Listing views, applicant volume, and conversion ratios</p>
        </div>

        {jobsPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-zinc-400 text-xs">
                <tr>
                  <th className="px-5 py-4 font-medium">Job Title</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Views</th>
                  <th className="px-5 py-4 font-medium">Applicants</th>
                  <th className="px-5 py-4 font-medium">Conversion</th>
                  <th className="px-5 py-4 font-medium">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobsPerformance.map((job: any) => (
                  <tr key={job._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-medium text-white">{job.title}</td>
                    <td className="px-5 py-4 text-zinc-400">{job.category}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs capitalize ${
                        job.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-300 font-mono text-xs">{job.viewsCount}</td>
                    <td className="px-5 py-4 text-zinc-300 font-mono text-xs">{job.applicantsCount}</td>
                    <td className="px-5 py-4 text-zinc-300 font-medium">
                      {job.conversionRate !== null ? (
                        <span className="text-indigo-400">{job.conversionRate}%</span>
                      ) : (
                        <span className="text-zinc-600 text-xs">No views</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "recently"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No job postings found for the selected filter.
          </div>
        )}
      </section>
    </div>
  );
}
