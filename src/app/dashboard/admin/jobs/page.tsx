import Link from "next/link";
import { Eye, Search, Trash2 } from "lucide-react";
import { jobs } from "@/data/mock";

export default function AdminJobsPage() {
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
          placeholder="Search job listings"
        />
      </label>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/3">
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="border-b border-white/10 text-zinc-500">
            <tr>
              <th>Job title</th>
              <th>Company</th>
              <th>Type</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <p className="font-medium text-white">{job.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {job.category} · {job.location}
                  </p>
                </td>
                <td className="text-zinc-400">{job.company}</td>
                <td>
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                    {job.type}
                  </span>
                </td>
                <td className="text-zinc-500">{job.posted}</td>
                <td>
                  <div className="flex gap-2">
                    <Link
                      aria-label="View job"
                      href={`/jobs/${job.id}`}
                      className="rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/10"
                    >
                      <Eye size={14} />
                    </Link>
                    <button
                      aria-label="Remove job"
                      className="rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500 hover:text-white"
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
