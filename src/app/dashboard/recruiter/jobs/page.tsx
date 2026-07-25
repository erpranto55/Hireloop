"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

export default function RecruiterJobsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const plan = (user as any)?.plan || "Free";

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    const email = user?.email;
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:5001/api/jobs?recruiterEmail=${email}&status=all`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    try {
      const res = await fetch(`http://localhost:5001/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`Job listing is now ${nextStatus}`);
        fetchJobs();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job listing?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Job listing deleted successfully");
        setJobs((prev) => prev.filter((j) => j._id !== jobId));
      } else {
        toast.error("Failed to delete listing");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Quota calculation
  const limitMap: Record<string, number> = { Free: 3, Growth: 10, Enterprise: 50 };
  const allowed = limitMap[plan] || 3;
  const activeCount = jobs.filter((j) => j.status === "active").length;
  const progressPercent = Math.min((activeCount / allowed) * 100, 100);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">Recruiter</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Manage Jobs</h1>
          <p className="mt-3 max-w-2xl text-zinc-400 font-medium text-sm leading-6">Post, edit, close, reopen, and review applicants for every listing.</p>
        </div>
        <Link
          href="/dashboard/recruiter/jobs/new"
          className={`inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 transition ${
            activeCount >= allowed ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
          }`}
        >
          <Plus size={18} /> Post New Job
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">Plan Active Job Limit</p>
            <p className="mt-1 text-sm text-zinc-500">
              {activeCount} of {allowed} active {plan} plan jobs used
            </p>
          </div>
          <div className="h-2 w-full max-w-sm rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </section>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Job Title</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Applicants</th>
                  <th className="px-5 py-4 font-medium">Date Posted</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{job.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {job.category} · {job.type}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {job.applicantsCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "recently"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/jobs/${job._id}/applicants`}
                          className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/10 inline-flex items-center gap-1.5"
                          title="View Applicants"
                        >
                          <Eye size={14} /> Applicants
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(job._id, job.status)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/10 cursor-pointer"
                          title="Toggle Status (Active/Closed)"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="rounded-lg border border-red-500/20 px-3 py-2 text-red-300 hover:bg-red-500 hover:text-white cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            No job listings found. Click "Post New Job" to list your first vacancy.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-red-500/30 bg-red-500/10 text-red-300";
  return <span className={`rounded-full border px-3 py-1 text-xs capitalize ${tone}`}>{status}</span>;
}
