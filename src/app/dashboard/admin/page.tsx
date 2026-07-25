"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Briefcase, Building2, CreditCard, ShieldCheck, Users } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [uRes, cRes, jRes, pRes] = await Promise.all([
          fetch("http://localhost:5001/api/users"),
          fetch("http://localhost:5001/api/companies"),
          fetch("http://localhost:5001/api/jobs?status=all&limit=100"),
          fetch("http://localhost:5001/api/payments")
        ]);

        if (uRes.ok) setUsers(await uRes.json());
        if (cRes.ok) setCompanies(await cRes.json());
        if (jRes.ok) setJobs(await jRes.json());
        if (pRes.ok) setPayments(await pRes.json());
      } catch (err) {
        console.error(err);
        toast.error("Failed to load administration data");
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users.length;
  const recruitersCount = users.filter(u => u.role === "recruiter").length;
  const companiesCount = companies.length;
  const jobsCount = jobs.length;
  const totalRevenue = payments.reduce((acc, pay) => {
    const val = parseFloat(pay.amount?.replace(/[^0-9.]/g, "")) || 0;
    return acc + val;
  }, 0);

  const stats = [
    { label: "Total Users", value: String(totalUsers), icon: Users },
    { label: "Recruiters", value: String(recruitersCount), icon: ShieldCheck },
    { label: "Companies", value: String(companiesCount), icon: Building2 },
    { label: "Jobs Posted", value: String(jobsCount), icon: Briefcase },
    { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: CreditCard },
  ];

  // Group jobs by category
  const categoryCounts: Record<string, number> = {};
  jobs.forEach(job => {
    categoryCounts[job.category] = (categoryCounts[job.category] || 0) + 1;
  });

  const categoriesData = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Overview</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Admin Dashboard</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">Monitor platform activity, moderation queues, users, jobs, and revenue.</p>

      {/* Stats row */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Category distribution */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-300" />
            <h2 className="text-2xl font-semibold text-white">Jobs by Category</h2>
          </div>
          
          {categoriesData.length > 0 ? (
            <div className="mt-6 space-y-4">
              {categoriesData.map((item, index) => {
                const total = Math.max(...categoriesData.map(c => c.count)) || 1;
                const pct = `${Math.round((item.count / total) * 100)}%`;

                return (
                  <div key={item.category}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-300 font-medium">{item.category}</span>
                      <span className="text-zinc-500">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: pct }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-zinc-500 italic">
              No jobs posted on the platform yet.
            </div>
          )}
        </section>

        {/* Recent payments */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Recent Payments</h2>
            <div className="mt-5 space-y-3">
              {payments.length > 0 ? (
                payments.slice(0, 4).map((pay) => (
                  <div key={pay._id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black p-4">
                    <div>
                      <p className="font-medium text-white">{pay.plan} Subscription</p>
                      <p className="text-xs text-zinc-500">{pay.userEmail}</p>
                    </div>
                    <p className="text-indigo-300 font-semibold">{pay.amount}</p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-zinc-500 italic">
                  No payment records found.
                </div>
              )}
            </div>
          </div>
          <Link href="/dashboard/admin/payments" className="mt-5 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200">
            View all payments
          </Link>
        </section>
      </div>
    </div>
  );
}
