"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { FileText, CheckCircle2, AlertCircle, Upload, Link as LinkIcon, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

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
  
  // Resume options
  const profileResume = (user as any)?.resumeUrl || "";
  const [resumeMode, setResumeMode] = useState<"upload" | "profile" | "url">(
    profileResume ? "profile" : "upload"
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    let active = true;
    const email = user?.email;
    if (email && isSeeker) {
      const seekerEmail: string = email;
      async function checkApplication() {
        try {
          const apps = await apiFetch(`/api/applications?seekerEmail=${encodeURIComponent(seekerEmail)}&jobId=${jobId}`);
          if (active && apps && apps.length > 0) {
            setHasApplied(true);
          }
        } catch (err) {
          console.error("Error checking application status:", err);
        } finally {
          if (active) setCheckingStatus(false);
        }
      }
      checkApplication();
    } else {
      setCheckingStatus(false);
    }
    return () => {
      active = false;
    };
  }, [user, isSeeker, jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    setResumeFile(file);
  };

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
      let finalResumeUrl = "";
      let finalResumeFileId = "";

      // 1. Resolve Resume
      if (resumeMode === "upload") {
        if (!resumeFile) {
          toast.error("Please select a PDF resume file to upload.");
          setApplying(false);
          return;
        }

        const formData = new FormData();
        formData.append("resume", resumeFile);

        const uploadResult = await apiFetch<{ fileId: string; url: string }>("/api/resumes/upload", {
          method: "POST",
          body: formData,
        });

        finalResumeUrl = uploadResult.url;
        finalResumeFileId = uploadResult.fileId;
      } else if (resumeMode === "profile") {
        finalResumeUrl = profileResume;
      } else if (resumeMode === "url") {
        if (!resumeUrl.trim()) {
          toast.error("Please enter a valid resume link.");
          setApplying(false);
          return;
        }
        finalResumeUrl = resumeUrl.trim();
      }

      // 2. Submit Application
      const payload = {
        jobId,
        jobTitle,
        companyId,
        companyName,
        seekerEmail: email,
        seekerName: name,
        resumeUrl: finalResumeUrl,
        resumeFileId: finalResumeFileId,
        coverLetter: coverLetter.trim(),
        status: "Applied",
      };

      await apiFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Application submitted successfully!");
      setHasApplied(true);
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.status === 409 || err.message?.includes("already submitted")) {
        toast.info("You have already submitted an application for this position.");
        setHasApplied(true);
        setShowModal(false);
      } else {
        toast.error(err.message || "Failed to submit application");
      }
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
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold text-white">Apply for {jobTitle}</h3>
            <p className="mt-2 text-sm text-zinc-400">at {companyName}</p>

            <form onSubmit={handleApply} className="mt-6 space-y-5">
              {/* Resume Selection Section */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Attach Resume (PDF)
                </label>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1 text-xs font-medium text-zinc-400 mb-3">
                  <button
                    type="button"
                    onClick={() => setResumeMode("upload")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
                      resumeMode === "upload" ? "bg-indigo-600 text-white shadow" : "hover:text-zinc-200"
                    }`}
                  >
                    <Upload size={13} /> Upload File
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (profileResume) setResumeMode("profile");
                      else toast.info("No resume saved in your profile yet. Use upload instead.");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
                      resumeMode === "profile"
                        ? "bg-indigo-600 text-white shadow"
                        : profileResume
                        ? "hover:text-zinc-200"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <FileText size={13} /> Profile Resume
                  </button>

                  <button
                    type="button"
                    onClick={() => setResumeMode("url")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
                      resumeMode === "url" ? "bg-indigo-600 text-white shadow" : "hover:text-zinc-200"
                    }`}
                  >
                    <LinkIcon size={13} /> Link URL
                  </button>
                </div>

                {/* Tab Content: Upload File */}
                {resumeMode === "upload" && (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-black/40 p-4 text-center">
                    <input
                      type="file"
                      id="resume-file-input"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="resume-file-input"
                      className="cursor-pointer block text-sm text-zinc-300 hover:text-white"
                    >
                      <Upload size={24} className="mx-auto mb-2 text-indigo-400" />
                      {resumeFile ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{resumeFile.name}</p>
                          <p className="text-xs text-zinc-500">
                            {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB · Click to change
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-indigo-400 underline">Select PDF file</span> from your device
                          <p className="mt-1 text-xs text-zinc-500">Max size 5MB (verified PDF)</p>
                        </div>
                      )}
                    </label>
                  </div>
                )}

                {/* Tab Content: Profile Resume */}
                {resumeMode === "profile" && (
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/60 p-3 text-sm">
                    <div className="flex items-center gap-2 text-zinc-200 truncate">
                      <FileText size={16} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{profileResume || "Profile resume attached"}</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs shrink-0 flex items-center gap-1">
                      <Check size={12} /> Ready
                    </span>
                  </div>
                )}

                {/* Tab Content: External URL */}
                {resumeMode === "url" && (
                  <div>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://dropbox.com/..."
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Provide a publicly shareable direct link to your PDF resume.
                    </p>
                  </div>
                )}
              </div>

              {/* Cover Letter Section */}
              <div>
                <label className="block text-sm font-medium text-zinc-300" htmlFor="coverLetter">
                  Cover Letter / Note <span className="text-zinc-500 text-xs">(Required)</span>
                </label>
                <textarea
                  id="coverLetter"
                  rows={4}
                  required
                  placeholder="Introduce yourself, your key qualifications, and why you are interested in this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={applying}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {applying && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
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
