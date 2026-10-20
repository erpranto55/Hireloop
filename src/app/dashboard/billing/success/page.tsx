"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!sessionId) {
        setError("Missing session_id in URL. Could not verify payment.");
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/api/payments/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();

        if (isMounted) {
          if (res.ok) {
            setVerificationResult(data);
          } else {
            setError(data.message || "Failed to verify payment with server.");
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Verification error:", err);
          setError(err.message || "Network error while verifying payment status.");
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const role = verificationResult?.role || user?.role || "seeker";
  const dashboardBillingUrl = `/dashboard/${role === "recruiter" ? "recruiter" : "seeker"}/billing`;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
        <h2 className="mt-6 text-2xl font-semibold text-white">Verifying Payment With Stripe...</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          Reconciling your subscription state and updating your account entitlements. Please do not close this window.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
          <AlertTriangle size={28} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">Verification Incomplete</h2>
        <p className="mt-2 text-sm text-zinc-400">{error}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <RefreshCw size={15} /> Retry Verification
          </button>
          <Link
            href={dashboardBillingUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Go to Billing Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = verificationResult?.paymentStatus === "paid" || verificationResult?.status === "complete";

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.04] p-8 text-center sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
        <CheckCircle2 size={36} />
      </div>

      <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
        <ShieldCheck size={14} /> Authoritative Stripe Confirmation
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {isConfirmed ? "Subscription Activated!" : "Checkout Completed"}
      </h1>

      <p className="mt-3 text-base text-zinc-300">
        Your account has been upgraded to the{" "}
        <span className="font-semibold text-indigo-300">{verificationResult?.plan}</span> plan.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-xs text-zinc-400">
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-zinc-500">Plan Tier:</span>
          <span className="font-medium text-white">{verificationResult?.plan}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-white/5">
          <span className="text-zinc-500">Payment Status:</span>
          <span className="font-medium text-emerald-400 uppercase">{verificationResult?.paymentStatus}</span>
        </div>
        {verificationResult?.subscriptionId && (
          <div className="flex justify-between py-1.5">
            <span className="text-zinc-500">Subscription Ref:</span>
            <span className="font-mono text-zinc-300">{verificationResult.subscriptionId}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={dashboardBillingUrl}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          View Billing Dashboard <ArrowRight size={16} />
        </Link>
        <Link
          href={role === "recruiter" ? "/dashboard/recruiter/jobs/create" : "/jobs"}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {role === "recruiter" ? "Post a Job Now" : "Explore Active Jobs"}
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-black px-6 pt-36 pb-20 text-white lg:px-8">
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        }
      >
        <BillingSuccessContent />
      </Suspense>
    </div>
  );
}
