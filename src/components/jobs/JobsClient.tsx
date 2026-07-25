"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Briefcase, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { categories, jobTypes } from "@/data/mock";

export default function JobsClient() {
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("http://localhost:5001/api/jobs?limit=100");
        if (res.ok) {
          const data = await res.json();
          setDbJobs(data);
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredJobs = useMemo(() => {
    return dbJobs.filter((job) => {
      // Keyword filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesKeyword =
          job.title.toLowerCase().includes(query) ||
          (job.companyName || job.company || "").toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query);
        if (!matchesKeyword) return false;
      }

      // Category filter
      if (selectedCategory !== "All" && job.category !== selectedCategory) {
        return false;
      }

      // Job Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(job.type)) {
        return false;
      }

      return true;
    });
  }, [dbJobs, search, selectedCategory, selectedTypes]);

  const hasActiveFilters =
    search !== "" || selectedCategory !== "All" || selectedTypes.length > 0;

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedTypes([]);
  };

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Filters Sidebar */}
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal size={18} /> Filters
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              <X size={14} /> Clear all
            </button>
          )}
        </div>

        {/* Search Keyword */}
        <div className="mt-6">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400" htmlFor="search-jobs">
            Keyword
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-zinc-400 transition focus-within:border-violet-500">
            <Search size={18} className="shrink-0 text-zinc-500" />
            <input
              id="search-jobs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, company, or keyword"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Job Type Checkboxes */}
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Job Type</p>
          <div className="mt-3 space-y-2.5">
            {jobTypes.map((type) => {
              const isChecked = selectedTypes.includes(type);
              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTypeToggle(type)}
                    className="h-4 w-4 rounded border-white/20 bg-black accent-violet-600"
                  />
                  <span>{type}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Category Chips */}
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Category</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === "All"
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(isSelected ? "All" : category)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    isSelected
                      ? "bg-violet-600 text-white"
                      : "border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Jobs List */}
      <div className="space-y-4">
        {/* Counter Header */}
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Showing <strong className="text-white">{filteredJobs.length}</strong> of{" "}
            <strong className="text-white">{dbJobs.length}</strong> jobs
          </span>
          {hasActiveFilters && (
            <span className="text-xs text-violet-400">Filters active</span>
          )}
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
            <p className="text-lg font-medium text-white">No jobs found</p>
            <p className="mt-1 text-sm text-zinc-400">
              Try adjusting your search query or clear filters to see more results.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link
              href={`/jobs/${job._id || job.id}`}
              key={job._id || job.id}
              className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:border-violet-500/40 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                    <Image
                      src={job.logo || "/logos/nvidia.png"}
                      alt={`${job.companyName || job.company || "Company"} logo`}
                      width={42}
                      height={42}
                      className="h-auto w-auto object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {job.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">{job.companyName || job.company}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={15} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase size={15} /> {job.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="md:text-right">
                  <p className="font-semibold text-violet-400">{job.salary}</p>
                  <p className="mt-1 text-sm text-zinc-500">Posted {job.posted || "recently"}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
