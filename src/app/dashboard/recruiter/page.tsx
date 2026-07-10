import type React from "react";
import Link from "next/link";
import { BarChart3, Briefcase, Building2, FileText, Plus, Users } from "lucide-react";
import { jobs } from "@/data/mock";

const stats = [
  { label: "Total Job Posts", value: "12", icon: Briefcase },
  { label: "Total Applicants", value: "148", icon: Users },
  { label: "Active Jobs", value: "8", icon: FileText },
  { label: "Jobs Closed", value: "4", icon: Building2 },
];

export default function RecruiterDashboardPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Recruiter Dashboard</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Manage company profile, job posts, and candidate pipeline.</p>
        </div>
        <Link href="/dashboard/recruiter/jobs/new" className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
          <Plus size={18} /> Post New Job
        </Link>
      </div>

      <StatsGrid stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-zinc-500">Company</p>
          <h2 className="mt-2 text-2xl font-semibold">OrbitAI</h2>
          <p className="mt-2 text-sm text-zinc-400">AI infrastructure for product and data teams.</p>
          <span className="mt-5 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Approved</span>
          <Link href="/dashboard/recruiter/company" className="mt-6 block rounded-xl border border-white/10 px-4 py-2 text-center text-sm font-medium text-zinc-200 hover:bg-white/10">
            Edit Company
          </Link>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-300" />
            <h2 className="text-2xl font-semibold">Applicants by Job</h2>
          </div>
          <div className="mt-6 space-y-4">
            {jobs.slice(0, 4).map((job, index) => (
              <div key={job.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-300">{job.title}</span>
                  <span className="text-zinc-500">{24 - index * 4}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${80 - index * 12}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: { label: string; value: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Icon size={20} className="text-indigo-300" />
            <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}



