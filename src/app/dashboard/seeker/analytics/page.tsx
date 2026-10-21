"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  CalendarCheck,
  Trophy,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

export default function SeekerAnalyticsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [period, setPeriod] = useState<string>("30d");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/analytics/seeker?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      } else {
        toast.error("Failed to load candidate analytics");
      }
    } catch (err) {
      console.error("Seeker analytics error:", err);
      toast.error("Network error loading analytics");
    } finally {
      setLoading(false);
    }
  }, [user, period]);

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

  const totalApps = analyticsData?.totalApplications || 0;
  const currentStages = analyticsData?.currentStages || {};
  const acceptance = analyticsData?.acceptanceRate || { rate: null, acceptedCount: 0, finalizedCount: 0 };
  const readiness = analyticsData?.interviewReadiness || { scorePercent: 0, checklist: [] };
  const recentApps = analyticsData?.recentApplications || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">Career Insights</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl text-white">Application Analytics</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Track your recruitment progress, interview readiness, and application outcomes.
          </p>
        </div>

        {/* Period Selector */}
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
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <FileText size={20} className="text-indigo-400" />
          <p className="mt-3 text-2xl font-semibold text-white">{totalApps}</p>
          <p className="mt-1 text-xs text-zinc-500">Submitted Applications</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Clock size={20} className="text-amber-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {(currentStages["Applied"] || 0) + (currentStages["Under Review"] || 0)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Active Review</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <CalendarCheck size={20} className="text-purple-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {currentStages["Interview Scheduled"] || 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Interviews Scheduled</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Trophy size={20} className="text-emerald-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {currentStages["Offered"] || 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Job Offers Received</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <CheckCircle2 size={20} className="text-green-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {currentStages["Accepted"] || 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Accepted Positions</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <Sparkles size={20} className="text-violet-400" />
          <p className="mt-3 text-2xl font-semibold text-white">
            {acceptance.rate !== null ? `${acceptance.rate}%` : "Pending"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Acceptance Rate</p>
        </div>
      </div>

      {/* Main Grid: Interview Readiness Checklist + Application Outcomes */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Evidence-Based Interview Readiness Checklist */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Candidate Readiness Profile</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Evidence-based indicators grounded in your actual profile and application milestones
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-400">{readiness.scorePercent}%</span>
                <span className="text-xs text-zinc-500">Complete</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5 h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${readiness.scorePercent}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="mt-6 space-y-3">
              {readiness.checklist.map((item: any) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                    item.completed
                      ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                      : "border-white/5 bg-black/40"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                      item.completed
                        ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                        : "border-white/10 bg-white/5 text-zinc-600"
                    }`}
                  >
                    {item.completed ? <Check size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${item.completed ? "text-white" : "text-zinc-300"}`}>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-zinc-500">Need to update your details?</span>
            <Link
              href="/dashboard/seeker/settings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              Edit Profile & Resume <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Right: Application Outcomes Breakdown & Acceptance Rate */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Application Outcomes</h3>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                <span className="text-zinc-400">Total Applications:</span>
                <span className="font-semibold text-white">{totalApps}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                <span className="text-zinc-400">In Progress:</span>
                <span className="font-semibold text-amber-400">{analyticsData?.pendingCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                <span className="text-zinc-400">Offers Accepted:</span>
                <span className="font-semibold text-emerald-400">{acceptance.acceptedCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-zinc-400">Finalized Decisions:</span>
                <span className="font-semibold text-zinc-300">{acceptance.finalizedCount}</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/5 bg-black/40 p-4 text-xs leading-relaxed text-zinc-400">
              <p className="font-semibold text-zinc-300 mb-1">Acceptance Rate Calculation</p>
              {acceptance.note}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-base font-semibold text-white">Browse Active Listings</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Explore open positions matching your target category and apply with one click.
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
            >
              Explore Jobs <ExternalLink size={14} />
            </Link>
          </div>
        </section>
      </div>

      {/* Recent Applications Activity */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Applications Activity</h2>
            <p className="text-xs text-zinc-400 mt-1">Current status of your submitted roles</p>
          </div>
          <Link
            href="/dashboard/seeker/applications"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
          >
            View All Applications →
          </Link>
        </div>

        {recentApps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-zinc-400 text-xs">
                <tr>
                  <th className="px-5 py-4 font-medium">Job Title</th>
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Current Status</th>
                  <th className="px-5 py-4 font-medium">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentApps.map((app: any) => (
                  <tr key={app._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-medium text-white">{app.jobTitle}</td>
                    <td className="px-5 py-4 text-zinc-400">{app.companyName}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/20">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-500">
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "recently"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No applications found for the selected period.
          </div>
        )}
      </section>
    </div>
  );
}
