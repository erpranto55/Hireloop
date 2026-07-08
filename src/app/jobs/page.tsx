import Image from "next/image";
import Link from "next/link";
import { Briefcase, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { categories, jobs, jobTypes } from "@/data/mock";

export const metadata = {
  title: "Browse Jobs | HireLoop",
  description: "Search open jobs by role, location, type, and category.",
};

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-black px-6 pt-36 text-white lg:px-8">
      <section className="mx-auto max-w-7xl pb-20">
        <div className="max-w-3xl">
          <span className="text-sm font-medium text-indigo-400">Browse Jobs</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Find the role that moves your career forward.
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Search curated opportunities across engineering, design, data, marketing, security, and developer relations.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <SlidersHorizontal size={18} /> Filters
            </div>

            <label className="mt-6 block text-sm text-zinc-400" htmlFor="search-jobs">
              Keyword
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-3 text-zinc-500">
              <Search size={18} />
              <input
                id="search-jobs"
                placeholder="Designer, backend, data"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
            </div>

            <div className="mt-6">
              <p className="text-sm text-zinc-400">Job Type</p>
              <div className="mt-3 space-y-3">
                {jobTypes.map((type) => (
                  <label key={type} className="flex items-center gap-3 text-sm text-zinc-300">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-black accent-indigo-500" />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-zinc-400">Category</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span key={category} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                href={`/jobs/${job.id}`}
                key={job.id}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-500/40 hover:bg-white/[0.06]"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                      <Image src={job.logo} alt={`${job.company} logo`} width={42} height={42} className="h-auto w-auto object-contain" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{job.title}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{job.company}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1"><MapPin size={15} /> {job.location}</span>
                        <span className="flex items-center gap-1"><Briefcase size={15} /> {job.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className="font-medium text-white">{job.salary}</p>
                    <p className="mt-1 text-sm text-zinc-500">Posted {job.posted}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}