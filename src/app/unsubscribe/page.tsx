"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MailX,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Mail,
  Bell,
  Settings,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [tokenData, setTokenData] = useState<{
    valid: boolean;
    maskedEmail: string;
    scope: string;
    expiresAt?: string;
  } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [selectedScope, setSelectedScope] = useState<"all" | "category">("all");
  const [processing, setProcessing] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setVerifying(true);
        setVerifyError(null);
        const res = await apiFetch<{
          valid: boolean;
          maskedEmail: string;
          scope: string;
          expiresAt?: string;
        }>(`/api/notifications/unsubscribe/verify?token=${encodeURIComponent(token)}`);
        setTokenData(res);
      } catch (err: any) {
        setVerifyError(err.message || "Invalid or expired unsubscribe link.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleConfirmUnsubscribe = async () => {
    if (!token) return;

    try {
      setProcessing(true);
      setActionError(null);

      // Determine category to opt out of
      const category = selectedScope === "all" ? "all" : tokenData?.scope || "all";

      await apiFetch("/api/notifications/unsubscribe", {
        method: "POST",
        body: JSON.stringify({
          token,
          category,
        }),
      });

      setUnsubscribed(true);
    } catch (err: any) {
      setActionError(err.message || "Failed to process unsubscribe request.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header bar */}
      <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Hire<span className="text-indigo-500">Loop</span>
          </Link>
          <Link
            href="/signin"
            className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            Sign in to Dashboard <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl p-8 shadow-2xl space-y-6">
          {verifying ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm text-zinc-400">Verifying secure unsubscribe token...</p>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h1 className="text-2xl font-bold">Unsubscribe Token Missing</h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                This page requires a verified unsubscribe link from a HireLoop notification email.
                If you have an account, you can manage all notification settings directly in your dashboard.
              </p>
              <div className="pt-2">
                <Link
                  href="/signin?callbackUrl=/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                >
                  <Settings size={14} /> Go to Dashboard Settings
                </Link>
              </div>
            </div>
          ) : verifyError ? (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white">Link Expired or Invalid</h1>
              <p className="text-sm text-zinc-400 leading-relaxed">{verifyError}</p>
              <p className="text-xs text-zinc-500">
                For security reasons, unsubscribe links expire after 90 days. You can sign in to change your delivery preferences at any time.
              </p>
              <div className="pt-2">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                >
                  Sign In to Manage Preferences
                </Link>
              </div>
            </div>
          ) : unsubscribed ? (
            <div className="text-center space-y-4 animate-in fade-in duration-300">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h1 className="text-2xl font-bold text-white">You Have Been Unsubscribed</h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Your email preferences for <strong className="text-white">{tokenData?.maskedEmail}</strong> have been updated.
                {selectedScope === "all"
                  ? " You will no longer receive optional marketing and non-essential notification emails."
                  : " You will no longer receive emails in this specific category."}
              </p>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left text-xs text-zinc-400 space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-300 font-medium">
                  <ShieldAlert size={14} className="text-indigo-400" />
                  <span>Account & Security Communications</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Crucial notices—including password resets, account security alerts, and payment failure notifications—cannot be disabled to preserve your account access.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/"
                  className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition text-center"
                >
                  Return to Homepage
                </Link>
                <Link
                  href="/signin?callbackUrl=/dashboard"
                  className="w-full sm:w-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition text-center"
                >
                  Open Dashboard Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <MailX size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Email Unsubscribe Preferences</h1>
                  <p className="text-xs text-zinc-400">
                    Managing preferences for <strong className="text-white">{tokenData?.maskedEmail}</strong>
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <p className="text-xs text-zinc-300 leading-relaxed">
                Please confirm which notifications you would like to stop receiving. You can update these settings at any time from your account settings.
              </p>

              {/* Radio options */}
              <div className="space-y-3">
                <label
                  onClick={() => setSelectedScope("all")}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                    selectedScope === "all"
                      ? "border-indigo-500 bg-indigo-600/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={selectedScope === "all"}
                    onChange={() => setSelectedScope("all")}
                    className="mt-1 accent-indigo-500"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white block">
                      Unsubscribe from all optional emails
                    </span>
                    <span className="text-[11px] text-zinc-400 block leading-relaxed">
                      Stops new message alerts, unread digests, reminders, and application status emails.
                    </span>
                  </div>
                </label>

                {tokenData?.scope && tokenData.scope !== "all_optional" && (
                  <label
                    onClick={() => setSelectedScope("category")}
                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                      selectedScope === "category"
                        ? "border-indigo-500 bg-indigo-600/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      checked={selectedScope === "category"}
                      onChange={() => setSelectedScope("category")}
                      className="mt-1 accent-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white block">
                        Unsubscribe only from {tokenData.scope} notifications
                      </span>
                      <span className="text-[11px] text-zinc-400 block leading-relaxed">
                        Keep receiving other notifications while opting out of this specific notification stream.
                      </span>
                    </div>
                  </label>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-400 flex items-start gap-2">
                <Mail size={14} className="shrink-0 mt-0.5 text-zinc-400" />
                <span>
                  In-app notifications and your live inbox remain available even when transactional email delivery is turned off.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                  href="/"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleConfirmUnsubscribe}
                  disabled={processing}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    "Confirm Unsubscribe"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} HireLoop Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
