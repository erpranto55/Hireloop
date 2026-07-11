import Link from "next/link";
import { Check, CreditCard } from "lucide-react";

const payments = [
  { date: "July 1, 2026", plan: "Pro", amount: "$19", transaction: "txn_hl_2048" },
  { date: "June 1, 2026", plan: "Pro", amount: "$19", transaction: "txn_hl_1982" },
  { date: "May 1, 2026", plan: "Free", amount: "$0", transaction: "txn_hl_1840" },
];

export default function SeekerBillingPage() {
  return (
    <div>
      <PageHeader title="Subscription & Billing" subtitle="Manage your plan, application quota, and payment history." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6">
          <CreditCard size={24} className="text-indigo-300" />
          <p className="mt-5 text-sm text-indigo-200">Current plan</p>
          <h2 className="mt-1 text-3xl font-semibold">Pro</h2>
          <p className="mt-3 text-sm text-zinc-300">12 of 30 monthly applications used.</p>
          <div className="mt-5 h-2 rounded-full bg-white/10">
            <div className="h-2 w-[40%] rounded-full bg-indigo-400" />
          </div>
          <div className="mt-6 flex gap-3">
            <Link href="/pricing" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200">Upgrade</Link>
            <Link href="/pricing" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Change</Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Pro includes</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {["30 applications per month", "Unlimited saved jobs", "Application tracking", "Salary insights"].map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black p-4 text-sm text-zinc-300">
                <Check size={17} className="text-indigo-300" /> {feature}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-5"><h2 className="text-2xl font-semibold">Payment History</h2></div>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-zinc-500">
            <tr><th className="px-5 py-4 font-medium">Date</th><th className="px-5 py-4 font-medium">Plan</th><th className="px-5 py-4 font-medium">Amount</th><th className="px-5 py-4 font-medium">Transaction ID</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {payments.map((payment) => (
              <tr key={payment.transaction}><td className="px-5 py-4 text-zinc-300">{payment.date}</td><td className="px-5 py-4 text-zinc-400">{payment.plan}</td><td className="px-5 py-4 text-zinc-400">{payment.amount}</td><td className="px-5 py-4 font-mono text-zinc-500">{payment.transaction}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
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
