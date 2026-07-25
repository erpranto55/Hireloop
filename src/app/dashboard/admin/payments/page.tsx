"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Download, Search } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("http://localhost:5001/api/payments");
        if (res.ok) {
          const data = await res.json();
          setPayments(data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load payments records");
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const totalRevenue = payments.reduce((acc, pay) => {
    const val = parseFloat(pay.amount?.replace(/[^0-9.]/g, "")) || 0;
    return acc + val;
  }, 0);

  const filteredPayments = payments.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      (p.userEmail || "").toLowerCase().includes(query) ||
      (p.plan || "").toLowerCase().includes(query) ||
      (p.transactionId || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Header
          title="Payments"
          subtitle="Track subscription revenue, invoices, and payment status."
        />
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <CreditCard size={20} className="text-indigo-300" />
          <p className="mt-4 text-3xl font-semibold text-white">${totalRevenue.toLocaleString()}</p>
          <p className="mt-1 text-sm text-zinc-500">Total Revenue</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <CreditCard size={20} className="text-indigo-300" />
          <p className="mt-4 text-3xl font-semibold text-white">{payments.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Successful Payments</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <CreditCard size={20} className="text-indigo-300" />
          <p className="mt-4 text-3xl font-semibold text-white">100%</p>
          <p className="mt-1 text-sm text-zinc-500">Payment Success Rate</p>
        </div>
      </div>

      <label className="mt-6 flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 text-zinc-500">
        <Search size={17} />
        <input
          className="w-full bg-transparent text-sm text-white outline-none"
          placeholder="Search by customer email, plan, or transaction ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </label>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                <tr>
                  <th className="px-5 py-4 font-medium">Customer Email</th>
                  <th className="px-5 py-4 font-medium">Plan</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Transaction ID</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredPayments.map((pay) => (
                  <tr key={pay._id || pay.transactionId}>
                    <td className="px-5 py-4 font-medium text-white">{pay.userEmail}</td>
                    <td className="px-5 py-4 text-zinc-400">{pay.plan}</td>
                    <td className="px-5 py-4 text-zinc-200">{pay.amount}</td>
                    <td className="px-5 py-4 text-zinc-500 font-mono">{pay.transactionId}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            No subscription payment records found matching your query.
          </div>
        )}
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
