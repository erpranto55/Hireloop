"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchJobs = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/jobs?status=all&limit=100");
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
  }, []);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to permanently delete this job listing?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Job vacancy deleted successfully");
        setJobs((prev) => prev.filter((j) => j._id !== jobId));
      } else {
        toast.error("Failed to delete listing");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const query = searchQuery.toLowerCase();
    return (
      (j.title || "").toLowerCase().includes(query) ||
      (j.companyName || j.company || "").toLowerCase().includes(query) ||
      (j.category || "").toLowerCase().includes(query) ||
      (j.location || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Jobs"
        subtitle="Moderate listings and keep job search results relevant and up to date."
      />
      <label className="mt-8 flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 text-zinc-500">
        <Search size={17} />
        <input
          className="w-full bg-transparent text-sm text-white outline-none"
          placeholder="Search job listings by title, company, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </label>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {filteredJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                <tr>
                  <th className="px-5 py-4 font-medium">Job Title</th>
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Type</th>
                  <th className="px-5 py-4 font-medium">Posted</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredJobs.map((job) => {
                  const jobId = job._id || job.id;
                  return (
                    <tr key={jobId}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">{job.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {job.category} · {job.location}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        {job.companyName || job.company}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                          {job.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-500">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "recently"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Link
                            aria-label="View job"
                            href={`/jobs/${jobId}`}
                            className="rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/10"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(jobId)}
                            aria-label="Remove job"
                            className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500 hover:text-white cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            No active job vacancy listings found.
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Administration</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
    </div>
  );
}
