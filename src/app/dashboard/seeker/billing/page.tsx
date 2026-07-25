"use client";

import React, { useState, useEffect } from "react";
import { Check, CreditCard, Sparkles, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function SeekerBillingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const currentPlan = (user as any)?.plan || "Free";

  const [payments, setPayments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const email = user?.email;
    if (email) {
      async function loadBillingData() {
        try {
          const [payRes, appsRes] = await Promise.all([
            fetch(`http://localhost:5001/api/payments?userEmail=${email}`),
            fetch(`http://localhost:5001/api/applications?seekerEmail=${email}`)
          ]);

          if (payRes.ok) {
            const payData = await payRes.json();
            setPayments(payData);
          }
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            setApplications(appsData);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      loadBillingData();
    }
  }, [user]);

  const handleMockUpgrade = async (planName: string, amount: string) => {
    if (!user?.email) return;
    try {
      setUpgrading(true);
      const payload = {
        userEmail: user.email,
        plan: planName,
        amount,
        transactionId: "txn_hl_" + Math.random().toString(36).substr(2, 9),
      };

      const res = await fetch("http://localhost:5001/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Successfully upgraded to ${planName}!`);
        // Refresh payments list
        const payRes = await fetch(`http://localhost:5001/api/payments?userEmail=${user.email}`);
        if (payRes.ok) {
          const payData = await payRes.json();
          setPayments(payData);
        }
        // Force refresh session
        router.refresh();
      } else {
        toast.error("Failed to process mock payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  // Quota details
  const quotaMap: Record<string, number> = { Free: 3, Pro: 30, Premium: 9999 };
  const allowed = quotaMap[currentPlan] || 3;
  const used = applications.length;
  const progressPercent = allowed === 9999 ? 100 : Math.min((used / allowed) * 100, 100);

  const planFeatures: Record<string, string[]> = {
    Free: ["Browse and save up to 10 jobs", "Apply to 3 jobs per month", "Basic profile info", "Email notifications"],
    Pro: ["Apply to 30 jobs per month", "Unlimited saved jobs", "Application tracking", "Salary insights"],
    Premium: ["Unlimited applications", "Profile boost to recruiters", "Early access to new jobs", "Priority email support"],
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400">Seeker</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Subscription & Billing</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Manage your plan, application quota, and payment history.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left Card: Plan quota */}
        <section className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6 flex flex-col justify-between">
          <div>
            <CreditCard size={24} className="text-indigo-300" />
            <p className="mt-5 text-sm text-indigo-200">Current Plan</p>
            <h2 className="mt-1 text-3xl font-semibold">{currentPlan}</h2>
            <p className="mt-3 text-sm text-zinc-300">
              {allowed === 9999 ? "Unlimited applications available." : `${used} of ${allowed} monthly applications used.`}
            </p>
            {allowed !== 9999 && (
              <div className="mt-5 h-2 rounded-full bg-white/10">
                <div 
                  className="h-2 rounded-full bg-indigo-400 transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {currentPlan === "Free" && (
              <button
                onClick={() => handleMockUpgrade("Pro", "$19")}
                disabled={upgrading}
                className="w-full text-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
              >
                {upgrading ? "Processing..." : "Upgrade to Pro ($19/mo)"}
              </button>
            )}
            {currentPlan !== "Premium" && (
              <button
                onClick={() => handleMockUpgrade("Premium", "$39")}
                disabled={upgrading}
                className="w-full text-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50 cursor-pointer"
              >
                {upgrading ? "Processing..." : `Upgrade to Premium ($39/mo)`}
              </button>
            )}
            {currentPlan === "Premium" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-green-400 text-xs">
                <Sparkles size={16} className="shrink-0" />
                <span>You are on the highest tier plan!</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Card: Plan features */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">{currentPlan} Plan Features</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {planFeatures[currentPlan]?.map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black p-4 text-sm text-zinc-300">
                <Check size={17} className="text-indigo-300" /> {feature}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Payment History */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-2xl font-semibold">Payment History</h2>
        </div>
        
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-zinc-500 border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Plan</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payments.map((payment) => (
                  <tr key={payment._id || payment.transactionId}>
                    <td className="px-5 py-4 text-zinc-300">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "recently"}
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{payment.plan}</td>
                    <td className="px-5 py-4 text-zinc-400">{payment.amount}</td>
                    <td className="px-5 py-4 font-mono text-zinc-500">{payment.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-zinc-500">
            No payment history found.
          </div>
        )}
      </section>
    </div>
  );
}
