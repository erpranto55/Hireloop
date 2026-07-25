"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

export default function SavedJobsPage() {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (email) {
      async function fetchSavedJobs() {
        try {
          const res = await fetch(`http://localhost:5001/api/saved-jobs?seekerEmail=${email}`);
          if (res.ok) {
            const data = await res.json();
            setSavedJobs(data);
          }
        } catch (err) {
          console.error("Failed to load saved jobs:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchSavedJobs();
    }
  }, [user]);

  const handleRemove = async (savedId: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/saved-jobs/${savedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Job removed from saved list");
        setSavedJobs(prev => prev.filter(item => item._id !== savedId));
      } else {
        toast.error("Failed to remove job");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

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
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Saved Jobs</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Keep your shortlist tidy and apply when you are ready.</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {savedJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Job</th>
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Location</th>
                  <th className="px-5 py-4 font-medium">Salary</th>
                  <th className="px-5 py-4 font-medium">Saved</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {savedJobs.map((item) => (
                  <tr key={item._id}>
                    <td className="px-5 py-4 font-medium text-white">{item.jobTitle}</td>
                    <td className="px-5 py-4 text-zinc-400">{item.companyName}</td>
                    <td className="px-5 py-4 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {item.location || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{item.salary || "N/A"}</td>
                    <td className="px-5 py-4 text-zinc-500">
                      {item.savedAt ? new Date(item.savedAt).toLocaleDateString() : "recently"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/jobs/${item.jobId}`}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition"
                        >
                          View & Apply
                        </Link>
                        <button
                          onClick={() => handleRemove(item._id)}
                          className="rounded-lg border border-red-500/20 px-3 py-2 text-red-300 hover:bg-red-500 hover:text-white transition cursor-pointer"
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
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-white">No saved jobs yet</p>
            <p className="mt-2 text-sm text-zinc-500">Jobs you bookmark will show up here.</p>
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
