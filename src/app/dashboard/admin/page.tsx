import Link from "next/link";
import { BarChart3, Briefcase, Building2, CreditCard, ShieldCheck, Users } from "lucide-react";
import { categories, companies, jobs } from "@/data/mock";

const stats = [
  { label: "Total Users", value: "2,840", icon: Users },
  { label: "Recruiters", value: "312", icon: ShieldCheck },
  { label: "Companies", value: String(companies.length), icon: Building2 },
  { label: "Jobs Posted", value: String(jobs.length), icon: Briefcase },
  { label: "Revenue", value: "$18.4k", icon: CreditCard },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Overview</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Admin Dashboard</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">Monitor platform activity, moderation queues, users, jobs, and revenue.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <Icon size={20} className="text-indigo-300" />
              <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-300" />
            <h2 className="text-2xl font-semibold">Jobs by Category</h2>
          </div>
          <div className="mt-6 space-y-4">
            {categories.map((category, index) => (
              <div key={category}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-300">{category}</span>
                  <span className="text-zinc-500">{index + 2}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${85 - index * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-2xl font-semibold">Recent Payments</h2>
          <div className="mt-5 space-y-3">
            {["Pro", "Growth", "Premium", "Enterprise"].map((plan, index) => (
              <div key={plan} className="flex items-center justify-between rounded-xl border border-white/10 bg-black p-4">
                <div>
                  <p className="font-medium">{plan} subscription</p>
                  <p className="text-sm text-zinc-500">user{index + 1}@hireloop.dev</p>
                </div>
                <p className="text-indigo-300">${[19, 49, 39, 149][index]}</p>
              </div>
            ))}
          </div>
          <Link href="/dashboard/admin/payments" className="mt-5 inline-flex text-sm font-medium text-indigo-300 hover:text-indigo-200">
            View all payments
          </Link>
        </section>
      </div>
    </div>
  );
}
