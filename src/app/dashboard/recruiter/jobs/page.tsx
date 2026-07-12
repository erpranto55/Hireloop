import Link from "next/link";
import { Eye, Pencil, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { jobs } from "@/data/mock";

const recruiterJobs = jobs.map((job, index) => ({
  ...job,
  status: index === 2 ? "Draft" : index === 4 ? "Closed" : "Active",
  applicants: 24 - index * 3,
  postedAt: `${index + 1} days ago`,
}));

export default function RecruiterJobsPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader title="Manage Jobs" subtitle="Post, edit, close, reopen, and review applicants for every listing." />
        <Link href="/dashboard/recruiter/jobs/new" className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500"><Plus size={18} /> Post New Job</Link>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Plan usage</p>
            <p className="mt-1 text-sm text-zinc-500">8 of 10 active Growth plan jobs used</p>
          </div>
          <div className="h-2 w-full max-w-sm rounded-full bg-white/10"><div className="h-2 w-[80%] rounded-full bg-indigo-500" /></div>
        </div>
      </section>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-zinc-500">
            <tr><th className="px-5 py-4 font-medium">Job Title</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium">Applicants</th><th className="px-5 py-4 font-medium">Date Posted</th><th className="px-5 py-4 font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {recruiterJobs.map((job) => (
              <tr key={job.id}>
                <td className="px-5 py-4"><p className="font-medium text-white">{job.title}</p><p className="mt-1 text-xs text-zinc-500">{job.category} · {job.type}</p></td>
                <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                <td className="px-5 py-4 text-zinc-400"><span className="flex items-center gap-1"><Users size={14} /> {job.applicants}</span></td>
                <td className="px-5 py-4 text-zinc-500">{job.postedAt}</td>
                <td className="px-5 py-4"><div className="flex gap-2"><Action icon={<Pencil size={14} />} label="Edit" /><Action icon={<Eye size={14} />} label="Applicants" /><Action icon={<RotateCcw size={14} />} label="Toggle" /><Action danger icon={<Trash2 size={14} />} label="Delete" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Action({ icon, label, danger = false }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return <button aria-label={label} className={`rounded-lg border px-3 py-2 ${danger ? "border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{icon}</button>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : status === "Closed" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
  return <span className={`rounded-full border px-3 py-1 text-xs ${tone}`}>{status}</span>;
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><p className="text-sm font-medium text-indigo-400">Recruiter</p><h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p></div>;
}
