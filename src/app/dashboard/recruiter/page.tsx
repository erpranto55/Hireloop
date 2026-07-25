"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, Briefcase, Building2, FileText, Plus, Users, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

export default function RecruiterDashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (email) {
      async function loadDashboardData() {
        try {
          const [compRes, jobsRes, appsRes] = await Promise.all([
            fetch(`http://localhost:5001/api/companies?recruiterEmail=${email}`),
            fetch(`http://localhost:5001/api/jobs?recruiterEmail=${email}&status=all`),
            fetch(`http://localhost:5001/api/applications?recruiterEmail=${email}`)
          ]);

          if (compRes.ok) {
            const compData = await compRes.json();
            if (compData && compData.length > 0) {
              setCompany(compData[0]);
            }
          }
          if (jobsRes.ok) {
            const jobsData = await jobsRes.json();
            setJobs(jobsData);
          }
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            setApplications(appsData);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load dashboard metrics");
        } finally {
          setLoading(false);
        }
      }
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate Stats
  const totalJobs = jobs.length;
  const totalApplicants = applications.length;
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const closedJobs = jobs.filter((j) => j.status === "closed").length;

  const stats = [
    { label: "Total Job Posts", value: String(totalJobs), icon: Briefcase },
    { label: "Total Applicants", value: String(totalApplicants), icon: Users },
    { label: "Active Jobs", value: String(activeJobs), icon: FileText },
    { label: "Jobs Closed", value: String(closedJobs), icon: Building2 },
  ];

  // Company status tones
  const statusTones: Record<string, string> = {
    pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    approved: "border-green-500/30 bg-green-500/10 text-green-300",
    rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-400">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Recruiter Dashboard</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Manage company profile, job posts, and candidate pipeline.</p>
        </div>
        <Link href="/dashboard/recruiter/jobs/new" className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500 transition">
          <Plus size={18} /> Post New Job
        </Link>
      </div>

      <StatsGrid stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left Side: Company profile status card */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 h-fit">
          <p className="text-sm text-zinc-500 mb-4">My Company</p>
          {company ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-2">
                <Image src={company.logo || "/logos/nvidia.png"} alt={`${company.name} logo`} width={36} height={36} className="h-auto w-auto object-contain" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{company.name}</h2>
              <p className="mt-2 text-sm text-zinc-400 leading-normal line-clamp-3">{company.description}</p>
              
              <div className="mt-4">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs capitalize ${statusTones[company.status || "pending"]}`}>
                  {company.status || "pending"}
                </span>
              </div>
              
              <Link href="/dashboard/recruiter/company" className="mt-6 block rounded-xl border border-white/10 px-4 py-2 text-center text-sm font-medium text-zinc-200 hover:bg-white/10 transition">
                Edit Company
              </Link>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <AlertCircle size={28} className="mx-auto text-zinc-500" />
              <p className="text-sm text-zinc-400 font-medium">No company profile</p>
              <Link href="/dashboard/recruiter/company" className="block rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500 transition">
                Register Company
              </Link>
            </div>
          )}
        </section>

        {/* Right Side: Applicants by Job list/graphic */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 h-fit">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-300" />
            <h2 className="text-2xl font-semibold text-white">Applicants by Job</h2>
          </div>
          
          {jobs.length > 0 ? (
            <div className="mt-6 space-y-4">
              {jobs.slice(0, 5).map((job) => {
                const count = job.applicantsCount || 0;
                const total = Math.max(...jobs.map(j => j.applicantsCount || 0)) || 1;
                const pct = `${Math.round((count / total) * 100)}%`;

                return (
                  <div key={job._id}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-300 font-medium">{job.title}</span>
                      <span className="text-zinc-500">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: pct }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-zinc-500 italic">
              No job postings listed. Post a job to see statistics.
            </div>
          )}
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
            <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
