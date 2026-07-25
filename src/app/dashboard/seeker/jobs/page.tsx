"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Bookmark, Briefcase, Filter, MapPin, Send, Check } from "lucide-react";
import { categories, jobTypes } from "@/data/mock";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

export default function SeekerJobsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    const email = user?.email;
    async function loadJobsAndSaved() {
      try {
        const jobsRes = await fetch("http://localhost:5001/api/jobs?limit=100");
        let jobsData = [];
        if (jobsRes.ok) {
          jobsData = await jobsRes.json();
          setDbJobs(jobsData);
        }

        if (email) {
          const savedRes = await fetch(`http://localhost:5001/api/saved-jobs?seekerEmail=${email}`);
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setSavedJobs(savedData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadJobsAndSaved();
  }, [user]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSaveToggle = async (job: any) => {
    if (!user?.email) return;
    const jobId = job._id || job.id;
    const existing = savedJobs.find((item) => item.jobId === jobId);

    try {
      if (existing) {
        // Unsave
        const res = await fetch(`http://localhost:5001/api/saved-jobs/${existing._id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Job unsaved");
          setSavedJobs((prev) => prev.filter((item) => item._id !== existing._id));
        }
      } else {
        // Save
        const payload = {
          jobId,
          jobTitle: job.title,
          companyName: job.companyName || job.company,
          location: job.location,
          salary: job.salary,
          seekerEmail: user.email,
        };

        const res = await fetch("http://localhost:5001/api/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          toast.success("Job bookmarked!");
          const savedData = await res.json();
          setSavedJobs((prev) => [...prev, savedData]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error toggling bookmark");
    }
  };

  const filteredJobs = useMemo(() => {
    return dbJobs.filter((job) => {
      // Keyword
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          job.title.toLowerCase().includes(query) ||
          (job.companyName || job.company || "").toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Location
      if (locationQuery.trim()) {
        const query = locationQuery.toLowerCase();
        if (!job.location.toLowerCase().includes(query)) return false;
      }

      // Category
      if (selectedCategory !== "All" && job.category !== selectedCategory) {
        return false;
      }

      // Job Type
      if (selectedTypes.length > 0 && !selectedTypes.includes(job.type)) {
        return false;
      }

      return true;
    });
  }, [dbJobs, search, locationQuery, selectedCategory, selectedTypes]);

  const isSaved = (jobId: string) => savedJobs.some((item) => item.jobId === jobId);

  if (loading) {
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
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Browse & Apply</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Find jobs, save promising roles, and start applications from your dashboard.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters Sidebar */}
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
          <div className="flex items-center gap-2 font-medium">
            <Filter size={18} className="text-indigo-300" /> Filters
          </div>

          <div>
            <label className="block text-sm text-zinc-500" htmlFor="keyword">Keyword</label>
            <input
              id="keyword"
              placeholder="Role or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-500" htmlFor="location">Location</label>
            <input
              id="location"
              placeholder="City, country, remote"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <p className="text-sm text-zinc-500">Job Type</p>
            <div className="mt-3 space-y-2">
              {jobTypes.map((type) => {
                const isChecked = selectedTypes.includes(type);
                return (
                  <label key={type} className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTypeToggle(type)}
                      className="accent-indigo-500 h-4 w-4"
                    />{" "}
                    {type}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm text-zinc-500 mb-3">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  selectedCategory === "All"
                    ? "bg-indigo-600 text-white"
                    : "border border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              {categories.map((category) => {
                const isSel = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(isSel ? "All" : category)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      isSel
                        ? "bg-indigo-600 text-white"
                        : "border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Jobs List Section */}
        <section className="space-y-4">
          <div className="text-sm text-zinc-500">
            Showing <span className="font-semibold text-white">{filteredJobs.length}</span> matching jobs
          </div>

          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const jobId = job._id || job.id;
              const saved = isSaved(jobId);

              return (
                <article key={jobId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-sm text-indigo-300 font-medium">{job.category}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">{job.title}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{job.companyName || job.company}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={15} /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={15} /> {job.type}
                        </span>
                        <span className="text-zinc-400 font-semibold">{job.salary}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSaveToggle(job)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition cursor-pointer ${
                          saved
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-white/10 text-zinc-200 hover:bg-white/10"
                        }`}
                      >
                        {saved ? (
                          <>
                            <Check size={16} /> Saved
                          </>
                        ) : (
                          <>
                            <Bookmark size={16} /> Save
                          </>
                        )}
                      </button>
                      <Link
                        href={`/jobs/${jobId}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                      >
                        <Send size={16} /> View & Apply
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center text-sm text-zinc-500">
              No jobs matching the filter criteria were found.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
