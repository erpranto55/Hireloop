"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Bell, Briefcase, CalendarCheck, Heart, Trophy, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function SeekerDashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (email) {
      async function fetchData() {
        try {
          const [savedRes, appsRes] = await Promise.all([
            fetch(`http://localhost:5001/api/saved-jobs?seekerEmail=${email}`),
            fetch(`http://localhost:5001/api/applications?seekerEmail=${email}`)
          ]);

          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setSavedJobs(savedData);
          }
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            setApplications(appsData);
          }
        } catch (err) {
          console.error("Error loading dashboard data:", err);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate stats
  const savedCount = savedJobs.length;
  const appliedCount = applications.length;
  const interviewCount = applications.filter(app => app.status === "Shortlisted").length;
  const offersCount = applications.filter(app => app.status === "Offered").length;

  const stats = [
    { label: "Saved Jobs", value: String(savedCount), icon: Heart },
    { label: "Applications Submitted", value: String(appliedCount), icon: Briefcase },
    { label: "Interviews Scheduled", value: String(interviewCount), icon: CalendarCheck },
    { label: "Offers Received", value: String(offersCount), icon: Trophy },
  ];

  // Calculate status distribution
  const totalApps = applications.length || 1; // avoid division by zero
  const getWidth = (count: number) => `${Math.round((count / totalApps) * 100)}%`;

  const statuses = [
    { label: "Applied", value: applications.filter(app => app.status === "Applied").length },
    { label: "Under Review", value: applications.filter(app => app.status === "Under Review").length },
    { label: "Shortlisted", value: applications.filter(app => app.status === "Shortlisted").length },
    { label: "Offered", value: applications.filter(app => app.status === "Offered").length },
  ];

  // Parse skills
  const skillsArray = (user as any)?.skills 
    ? (user as any).skills.split(",").map((s: string) => s.trim()).filter(Boolean) 
    : [];

  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Overview</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Seeker Dashboard</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">Track applications, saved jobs, and next career moves.</p>

      <StatsGrid stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Profile Card */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-zinc-500">Profile</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-zinc-300 font-medium">
            {(user as any)?.headline || "No headline set yet"}
          </p>
          
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            {(user as any)?.bio || "Add a short bio in your settings to introduce yourself to employers."}
          </p>

          {skillsArray.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {skillsArray.map((skill: string) => (
                <span key={skill} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-zinc-500 italic">No skills listed yet.</p>
          )}

          <Link 
            href="/dashboard/seeker/settings" 
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition"
          >
            Edit Profile
          </Link>
        </section>

        {/* Application Status Chart */}
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
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: getWidth(status.value) }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-indigo-300" />
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {applications.length > 0 ? (
            applications.slice(0, 3).map((app) => (
              <Link 
                key={app._id || app.id} 
                href={`/jobs/${app.jobId}`} 
                className="rounded-xl border border-white/10 bg-black p-4 transition hover:border-indigo-500/40 block"
              >
                <p className="font-medium text-white">{app.jobTitle}</p>
                <p className="mt-1 text-sm text-zinc-400">Status: <span className="text-indigo-400 font-semibold">{app.status}</span></p>
                <p className="mt-2 text-xs text-zinc-500">{app.companyName}</p>
              </Link>
            ))
          ) : (
            <div className="col-span-3 rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-zinc-500">
              No recent application activity. Find a job to get started!
            </div>
          )}
        </div>
      </section>
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
