"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, XCircle, ShieldCheck, UserCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const { data: session, isPending: sessionLoading } = useSession();
  const user = session?.user;

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided in the URL.");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await apiFetch(`/api/team/invitations/verify?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          setInvitation(data.invitation);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.message || "This invitation token is invalid or has expired.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to verify invitation token.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const res = await apiFetch("/api/team/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setActionDone("accepted");
        toast.success(`You have joined ${invitation?.companyName}!`);
        setTimeout(() => {
          router.push("/dashboard/recruiter/team");
        }, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to accept invitation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    if (!confirm("Are you sure you want to decline this invitation?")) return;
    setProcessing(true);
    try {
      const res = await apiFetch("/api/team/invitations/decline", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setActionDone("declined");
        toast.info("Invitation declined.");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to decline invitation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-zinc-400">Verifying team workspace invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invitation Unavailable</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (actionDone === "accepted") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 border border-emerald-500/20 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to {invitation?.companyName}!</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Your membership has been activated as <strong>{invitation?.roleLabel}</strong>. Redirecting you to your team workspace...
          </p>
          <div className="flex items-center justify-center text-xs text-zinc-500 space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  if (actionDone === "declined") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/90 border border-white/10 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-2">Invitation Declined</h2>
          <p className="text-zinc-400 text-sm mb-6">
            You have declined the invitation to join <strong>{invitation?.companyName}</strong>.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isEmailMismatch = user && user.email?.toLowerCase() !== invitation?.inviteeEmail?.toLowerCase();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Team Workspace Invitation</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">{invitation?.companyName}</h1>
          </div>
        </div>

        <p className="text-zinc-300 text-sm leading-relaxed mb-6">
          <strong className="text-white">{invitation?.inviterName}</strong> has invited you to join the recruitment team for{" "}
          <strong className="text-white">{invitation?.companyName}</strong> on HireLoop.
        </p>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Invited Email:</span>
            <span className="font-mono text-zinc-200 font-medium">{invitation?.inviteeEmail}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Assigned Role:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {invitation?.roleLabel}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Status:</span>
            <span className="inline-flex items-center text-xs text-amber-400 font-medium">
              Pending Acceptance
            </span>
          </div>
        </div>

        {!user ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-300 mb-1">Authentication Required</h4>
                <p className="text-xs text-amber-200/80 leading-relaxed mb-4">
                  To accept this invitation, please sign in with or register an account using the invited email address (<strong>{invitation?.inviteeEmail}</strong>).
                </p>
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/dashboard/recruiter/team/accept?token=${token}`)}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-xs hover:bg-amber-400 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={`/register?email=${encodeURIComponent(invitation?.inviteeEmail)}&role=recruiter&redirect=${encodeURIComponent(`/dashboard/recruiter/team/accept?token=${token}`)}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs hover:bg-zinc-700 transition"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : isEmailMismatch ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-1">Account Email Mismatch</h4>
                <p className="text-xs text-red-200/80 leading-relaxed">
                  You are currently signed in as <strong>{user.email}</strong>, but this invitation was issued to{" "}
                  <strong>{invitation?.inviteeEmail}</strong>. Please switch accounts to accept.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining Workspace...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Accept & Join Workspace
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={processing}
              className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-sm text-zinc-400">Loading invitation...</p>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
