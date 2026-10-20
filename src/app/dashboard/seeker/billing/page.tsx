"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, CreditCard, Sparkles, AlertCircle, ExternalLink, RefreshCw, Calendar } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function SeekerBillingPage() {
  const searchParams = useSearchParams();
  const canceledParam = searchParams.get("canceled");

  const { data: session } = useSession();
  const user = session?.user;

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOutPlan, setCheckingOutPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (canceledParam) {
      toast.info("Stripe checkout was canceled. Your current plan was not changed.");
    }
  }, [canceledParam]);

  const loadBillingData = useCallback(async () => {
    if (!user?.email) return;
    try {
      const [subRes, payRes, appsRes] = await Promise.all([
        apiFetch("/api/payments/subscription"),
        apiFetch(`/api/payments?userEmail=${user.email}`),
        apiFetch(`/api/applications?seekerEmail=${user.email}`),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionData(subData);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData);
      }
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }
    } catch (err) {
      console.error("Failed to load seeker billing data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handleStripeCheckout = async (planName: string) => {
    if (!user?.email) {
      toast.error("Please sign in to proceed with checkout.");
      return;
    }

    try {
      setCheckingOutPlan(planName);
      const res = await apiFetch("/api/payments/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan: planName }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Failed to initiate Stripe checkout.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "An error occurred starting Stripe checkout.");
    } finally {
      setCheckingOutPlan(null);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setPortalLoading(true);
      const res = await apiFetch("/api/payments/create-portal-session", {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Unable to open billing portal. No active Stripe customer found.");
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      toast.error(err.message || "Failed to open customer portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your recurring subscription? You will retain access until the end of the current billing cycle.")) {
      return;
    }

    try {
      setCanceling(true);
      const res = await apiFetch("/api/payments/cancel-subscription", {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Subscription canceled at period end.");
        await loadBillingData();
      } else {
        toast.error(data.message || "Failed to cancel subscription.");
      }
    } catch (err: any) {
      console.error("Cancel error:", err);
      toast.error(err.message || "An error occurred canceling subscription.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = subscriptionData?.plan || (user as any)?.plan || "Free";
  const quotaMap: Record<string, number> = { Free: 3, Pro: 30, Premium: Infinity };
  const allowed = subscriptionData?.usage?.applicationLimit !== undefined
    ? subscriptionData.usage.applicationLimit
    : quotaMap[currentPlan] || 3;
  const used = subscriptionData?.usage?.monthlyApplications !== undefined
    ? subscriptionData.usage.monthlyApplications
    : applications.length;
  const isUnlimited = allowed === Infinity || allowed >= 9999;
  const progressPercent = isUnlimited ? 100 : Math.min((used / allowed) * 100, 100);

  const sub = subscriptionData?.subscription;
  const isCanceledAtEnd = sub?.cancelAtPeriodEnd;
  const currentPeriodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : null;
  const hasStripeCustomer = Boolean(subscriptionData?.stripeCustomerId);

  const planFeatures: Record<string, string[]> = {
    Free: ["Browse and save up to 10 jobs", "Apply to 3 jobs per month", "Basic profile info", "Email alerts"],
    Pro: ["Apply to 30 jobs per month", "Unlimited saved jobs", "Application tracking", "Salary insights"],
    Premium: ["Unlimited applications", "Profile boost to recruiters", "Early job access", "Priority support"],
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-indigo-400">Job Seeker</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Subscription & Billing</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Manage your subscription, monthly application quota, and payment history.</p>
        </div>

        {hasStripeCustomer && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 cursor-pointer"
            >
              <ExternalLink size={16} />
              {portalLoading ? "Opening..." : "Manage in Stripe"}
            </button>
          </div>
        )}
      </div>

      {isCanceledAtEnd && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">
          <AlertCircle size={20} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold">Subscription Canceled</p>
            <p className="mt-1 text-zinc-300">
              Your subscription is scheduled to end on {currentPeriodEnd}. Your account will revert to the Free tier after this date.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Card: Plan quota */}
        <section className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <CreditCard size={24} className="text-indigo-300" />
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30">
                {sub?.status ? sub.status.toUpperCase() : "ACTIVE"}
              </span>
            </div>

            <p className="mt-5 text-sm text-indigo-200">Current Plan</p>
            <h2 className="mt-1 text-3xl font-semibold">{currentPlan}</h2>
            
            <p className="mt-3 text-sm text-zinc-300">
              {isUnlimited ? "Unlimited monthly applications available." : `${used} of ${allowed} monthly applications used.`}
            </p>
            
            {!isUnlimited && (
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div 
                  className="h-2 rounded-full bg-indigo-400 transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            )}

            {currentPeriodEnd && (
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <Calendar size={14} className="text-indigo-400" />
                <span>{isCanceledAtEnd ? "Access expires:" : "Next renewal:"} {currentPeriodEnd}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {currentPlan === "Free" && (
              <button
                onClick={() => handleStripeCheckout("Pro")}
                disabled={checkingOutPlan !== null}
                className="w-full text-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50 cursor-pointer"
              >
                {checkingOutPlan === "Pro" ? "Connecting to Stripe..." : "Upgrade to Pro ($19/mo)"}
              </button>
            )}

            {currentPlan !== "Premium" && (
              <button
                onClick={() => handleStripeCheckout("Premium")}
                disabled={checkingOutPlan !== null}
                className="w-full text-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition disabled:opacity-50 cursor-pointer"
              >
                {checkingOutPlan === "Premium" ? "Connecting to Stripe..." : `Upgrade to Premium ($39/mo)`}
              </button>
            )}

            {currentPlan !== "Free" && !isCanceledAtEnd && (
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="w-full text-center rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition disabled:opacity-50 cursor-pointer"
              >
                {canceling ? "Canceling..." : "Cancel subscription at period end"}
              </button>
            )}

            {currentPlan === "Premium" && !isCanceledAtEnd && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-green-400 text-xs">
                <Sparkles size={16} className="shrink-0" />
                <span>You have unlocked unlimited application power!</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Card: Plan features */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{currentPlan} Plan Features</h2>
            <p className="mt-1 text-sm text-zinc-400">Included perks for job search and applications</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {planFeatures[currentPlan]?.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black p-4 text-sm text-zinc-300">
                  <Check size={17} className="text-indigo-300 shrink-0" /> {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/5 bg-zinc-950/60 p-4 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Need more applications? </span>
            Upgrading allows you to submit applications immediately to any active job listings across the network.
          </div>
        </section>
      </div>

      {/* Payment History */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Payment History</h2>
            <p className="text-xs text-zinc-400 mt-1">Verified Stripe and subscription transaction records</p>
          </div>
          <button
            onClick={loadBillingData}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-zinc-500 border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Plan</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Reference ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payments.map((payment) => (
                  <tr key={payment._id || payment.transactionId}>
                    <td className="px-5 py-4 text-zinc-300">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "recently"}
                    </td>
                    <td className="px-5 py-4 text-zinc-300 font-medium">{payment.plan}</td>
                    <td className="px-5 py-4 text-zinc-300">{payment.amount}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                        {payment.status || "paid"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500">{payment.transactionId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-zinc-500">
            No payment history recorded yet.
          </div>
        )}
      </section>
    </div>
  );
}
