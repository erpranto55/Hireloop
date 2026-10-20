"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, FileText, Calendar, Building2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

function formatRelativeTime(dateInput: string | Date | undefined) {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 30) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
}

export default function ApplicationsPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (email) {
      const seekerEmail: string = email;
      async function fetchApplications() {
        try {
          const res = await apiFetch(`/api/applications?seekerEmail=${encodeURIComponent(seekerEmail)}`);
          if (res.ok) {
            const data = await res.json();
            setApplications(data);
          }
        } catch (err) {
          console.error("Failed to load applications:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchApplications();
    }
  }, [user]);

  if (isPending || loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400">Seeker</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">My Applications</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Follow every submitted application from first contact to final decision.</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                <tr>
                  <th className="px-5 py-4 font-medium">Job Title</th>
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Date Applied</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-medium text-white">{app.jobTitle}</td>
                    <td className="px-5 py-4 text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-zinc-500" />
                        {app.companyName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">
                      <span className="flex items-center gap-1.5" title={app.appliedAt ? new Date(app.appliedAt).toLocaleString() : ""}>
                        <Calendar size={14} className="text-zinc-500" />
                        {formatRelativeTime(app.appliedAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status || "Applied"} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${app.jobId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10 transition"
                        >
                          <Eye size={13} /> View Listing
                        </Link>
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl.startsWith("http") ? app.resumeUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${app.resumeUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition"
                          >
                            <FileText size={13} /> My Resume
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-white">No applications submitted yet</p>
            <p className="mt-2 text-sm text-zinc-500">When you apply for a job, it will appear here.</p>
            <Link
              href="/dashboard/seeker/jobs"
              className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
            >
              Browse Jobs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let tone = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
  const s = (status || "Applied").toLowerCase();
  if (s === "rejected") {
    tone = "border-red-500/30 bg-red-500/10 text-red-300";
  } else if (s === "offered" || s === "accepted") {
    tone = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (s === "shortlisted") {
    tone = "border-violet-500/30 bg-violet-500/10 text-violet-300";
  } else if (s === "interview scheduled") {
    tone = "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  } else if (s === "under review") {
    tone = "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}
