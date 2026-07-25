"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface ApplyButtonProps {
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
}

export default function ApplyButton({ jobId, jobTitle, companyId, companyName }: ApplyButtonProps) {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const isSeeker = (user as any)?.role === "seeker";

  const [hasApplied, setHasApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    const email = user?.email;
    if (email && isSeeker) {
      async function checkApplication() {
        try {
          const res = await fetch(`http://localhost:5001/api/applications?seekerEmail=${email}&jobId=${jobId}`);
          if (res.ok) {
            const apps = await res.json();
            if (apps && apps.length > 0) {
              setHasApplied(true);
            }
          }
        } catch (err) {
          console.error("Error checking application status:", err);
        } finally {
          setCheckingStatus(false);
        }
      }
      checkApplication();
    } else {
      setCheckingStatus(false);
    }
  }, [user, isSeeker, jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = user?.email;
    const name = user?.name;
    if (!email || !name) {
      toast.error("User profile is incomplete.");
      return;
    }

    try {
      setApplying(true);
      const payload = {
        jobId,
        jobTitle,
        companyId,
        companyName,
        seekerEmail: email,
        seekerName: name,
        resumeUrl: resumeUrl || (user as any).resumeUrl || "",
        coverLetter,
        status: "Applied",
      };

      const res = await fetch("http://localhost:5001/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Application submitted successfully!");
        setHasApplied(true);
        setShowModal(false);
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (isPending || checkingStatus) {
    return (
      <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-white/10" />
    );
  }

  if (!user) {
    return (
      <div className="mt-6 space-y-3">
        <Link
          href="/signin"
          className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          Sign In to Apply
        </Link>
        <p className="text-center text-xs text-zinc-500">
          An account is required to apply for roles.
        </p>
      </div>
    );
  }

  if (!isSeeker) {
    return (
      <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-300">
        <div className="flex gap-2">
          <AlertCircle className="shrink-0" size={18} />
          <span>Only registered Job Seekers can apply for listings.</span>
        </div>
      </div>
    );
  }

  if (hasApplied) {
    return (
      <div className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 py-3 text-center font-semibold text-green-400">
        <CheckCircle2 size={18} /> Applied
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 cursor-pointer"
      >
        Apply Now
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
            <h3 className="text-2xl font-semibold text-white">Apply for {jobTitle}</h3>
            <p className="mt-2 text-sm text-zinc-400">at {companyName}</p>

            <form onSubmit={handleApply} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm text-zinc-400" htmlFor="resume">
                  Resume Link (PDF)
                </label>
                <input
                  id="resume"
                  type="url"
                  placeholder="https://example.com/my-resume.pdf"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
                <p className="mt-1.5 text-xs text-zinc-500">
                  Provide a shareable URL to your resume, or leave blank to use your profile resume.
                </p>
              </div>

              <div>
                <label className="block text-sm text-zinc-400" htmlFor="coverLetter">
                  Cover Letter / Note
                </label>
                <textarea
                  id="coverLetter"
                  rows={5}
                  required
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
