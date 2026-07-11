import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import { jobs } from "@/data/mock";

const savedJobs = jobs.slice(0, 4).map((job, index) => ({ ...job, savedAt: `${index + 2} days ago` }));

export default function SavedJobsPage() {
  return (
    <div>
      <PageHeader title="Saved Jobs" subtitle="Keep your shortlist tidy and apply when you are ready." />
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
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
            {savedJobs.map((job) => (
              <tr key={job.id}>
                <td className="px-5 py-4 font-medium text-white">{job.title}</td>
                <td className="px-5 py-4 text-zinc-400">{job.company}</td>
                <td className="px-5 py-4 text-zinc-400"><span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span></td>
                <td className="px-5 py-4 text-zinc-400">{job.salary}</td>
                <td className="px-5 py-4 text-zinc-500">{job.savedAt}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Link href={`/jobs/${job.id}`} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500">Apply</Link>
                    <button className="rounded-lg border border-red-500/20 px-3 py-2 text-red-300 hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
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

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Seeker</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
    </div>
  );
}
