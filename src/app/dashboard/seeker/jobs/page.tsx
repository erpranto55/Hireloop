import Link from "next/link";
import { Bookmark, Briefcase, Filter, MapPin, Send } from "lucide-react";
import { categories, jobs, jobTypes } from "@/data/mock";

export default function SeekerJobsPage() {
  return (
    <div>
      <PageHeader title="Browse & Apply" subtitle="Find jobs, save promising roles, and start applications from your dashboard." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 font-medium">
            <Filter size={18} className="text-indigo-300" /> Filters
          </div>
          <label className="mt-5 block text-sm text-zinc-500" htmlFor="keyword">Keyword</label>
          <input id="keyword" placeholder="Role or company" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600" />
          <label className="mt-5 block text-sm text-zinc-500" htmlFor="location">Location</label>
          <input id="location" placeholder="City, country, remote" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600" />
          <div className="mt-5">
            <p className="text-sm text-zinc-500">Job type</p>
            <div className="mt-3 space-y-2">
              {jobTypes.map((type) => (
                <label key={type} className="flex items-center gap-3 text-sm text-zinc-300">
                  <input type="checkbox" className="accent-indigo-500" /> {type}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">{category}</span>
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm text-indigo-300">{job.category}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{job.title}</h2>
                  <p className="mt-2 text-sm text-zinc-400">{job.company}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><MapPin size={15} /> {job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase size={15} /> {job.type}</span>
                    <span>{job.salary}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10">
                    <Bookmark size={16} /> Save
                  </button>
                  <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500">
                    <Send size={16} /> Apply
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Seeker</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
    </div>
  );
}
