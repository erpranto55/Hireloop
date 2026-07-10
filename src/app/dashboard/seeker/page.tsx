import type React from "react";
import Link from "next/link";
import { BarChart3, Bell, Briefcase, CalendarCheck, Heart, Trophy } from "lucide-react";
import { jobs } from "@/data/mock";

const stats = [
  { label: "Saved Jobs", value: "10", icon: Heart },
  { label: "Applications Submitted", value: "7", icon: Briefcase },
  { label: "Interviews Scheduled", value: "3", icon: CalendarCheck },
  { label: "Offers Received", value: "1", icon: Trophy },
];

const statuses = [
  { label: "Applied", value: 7, width: "70%" },
  { label: "Under Review", value: 4, width: "40%" },
  { label: "Shortlisted", value: 2, width: "20%" },
  { label: "Offered", value: 1, width: "10%" },
];

export default function SeekerDashboardPage() {
  return (
    <DashboardPage title="Seeker Dashboard" subtitle="Track applications, saved jobs, and next career moves.">
      <StatsGrid stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-zinc-500">Profile</p>
          <h2 className="mt-2 text-2xl font-semibold">Alex Morgan</h2>
          <p className="mt-2 text-sm text-zinc-400">Product-minded frontend engineer looking for remote SaaS roles.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Design Systems', 'Next.js'].map((skill) => (
              <span key={skill} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{skill}</span>
            ))}
          </div>
          <Link href="/dashboard/seeker/settings" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Edit Profile
          </Link>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-300" />
            <h2 className="text-2xl font-semibold">Application Status</h2>
          </div>
          <div className="mt-6 space-y-4">
            {statuses.map((status) => (
              <div key={status.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-300">{status.label}</span>
                  <span className="text-zinc-500">{status.value}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: status.width }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-indigo-300" />
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {jobs.slice(0, 3).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="rounded-xl border border-white/10 bg-black p-4 transition hover:border-indigo-500/40">
              <p className="font-medium">{job.title}</p>
              <p className="mt-1 text-sm text-zinc-500">New match at {job.company}</p>
            </Link>
          ))}
        </div>
      </section>
    </DashboardPage>
  );
}

function DashboardPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Overview</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
      {children}
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



