"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function ApplicationsPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (email) {
      async function fetchApplications() {
        try {
          const res = await fetch(`http://localhost:5001/api/applications?seekerEmail=${email}`);
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
              <thead className="border-b border-white/10 text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Job Title</th>
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Date Applied</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td className="px-5 py-4 font-medium text-white">{app.jobTitle}</td>
                    <td className="px-5 py-4 text-zinc-400">{app.companyName}</td>
                    <td className="px-5 py-4 text-zinc-500">
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "recently"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={app.status || "Applied"} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/jobs/${app.jobId}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 transition"
                      >
                        <Eye size={14} /> View
                      </Link>
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
  if (status === "Rejected") {
    tone = "border-red-500/30 bg-red-500/10 text-red-300";
  } else if (status === "Offered") {
    tone = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (status === "Shortlisted") {
    tone = "border-violet-500/30 bg-violet-500/10 text-violet-300";
  } else if (status === "Under Review") {
    tone = "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return <span className={`rounded-full border px-3 py-1 text-xs ${tone}`}>{status}</span>;
}
