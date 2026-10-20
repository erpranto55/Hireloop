"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  X,
  Save,
  Clock,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

const ALL_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Accepted",
  "Rejected",
];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  "Applied": ["Under Review", "Rejected"],
  "Under Review": ["Shortlisted", "Rejected"],
  "Shortlisted": ["Interview Scheduled", "Offered", "Rejected"],
  "Interview Scheduled": ["Offered", "Rejected"],
  "Offered": ["Accepted", "Rejected"],
  "Accepted": [],
  "Rejected": [],
};

export default function JobApplicantsPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const user = session?.user;
  const userRole = ((user as any)?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  const [jobId, setJobId] = useState("");
  const [applicants, setApplicants] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("Job");
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Candidate Review Modal / Drawer
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [recruiterNoteInput, setRecruiterNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => {
      setJobId(p.jobId);
    });
  }, [params]);

  useEffect(() => {
    if (jobId && !sessionPending) {
      if (userRole && userRole !== "recruiter" && userRole !== "admin") {
        toast.error("Access restricted: Only recruiters and admins can review applicants.");
        router.replace("/dashboard");
        return;
      }

      async function loadData() {
        try {
          // Fetch job title
          const jobData = await apiFetch(`/api/jobs/${jobId}`);
          if (jobData && jobData.title) {
            setJobTitle(jobData.title);
          }

          // Fetch applications
          const appData = await apiFetch(`/api/applications?jobId=${jobId}`);
          if (Array.isArray(appData)) {
            setApplicants(appData);
          }
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || "Failed to load applicants information");
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [jobId, sessionPending, userRole, router]);

  // Sync selected app notes input
  useEffect(() => {
    if (selectedApp) {
      setRecruiterNoteInput(selectedApp.recruiterNotes || "");
    }
  }, [selectedApp]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const updated = await apiFetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      toast.success(`Applicant status updated to "${newStatus}"`);
      setApplicants((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus, ...updated } : app))
      );
      if (selectedApp && selectedApp._id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, status: newStatus, ...updated }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      setSavingNote(true);
      const updated = await apiFetch(`/api/applications/${selectedApp._id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes: recruiterNoteInput.trim() }),
      });

      toast.success("Candidate notes saved successfully!");
      setApplicants((prev) =>
        prev.map((app) =>
          app._id === selectedApp._id
            ? { ...app, recruiterNotes: recruiterNoteInput.trim(), ...updated }
            : app
        )
      );
      setSelectedApp((prev: any) => ({
        ...prev,
        recruiterNotes: recruiterNoteInput.trim(),
        ...updated,
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save recruiter note");
    } finally {
      setSavingNote(false);
    }
  };

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const nameMatch = (app.seekerName || "").toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = (app.seekerEmail || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      const matchesStatus =
        statusFilter === "All" ||
        (app.status || "Applied").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  if (loading || sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 pt-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl pb-20">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition cursor-pointer mb-6"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-indigo-400">Recruiter Toolkit</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Applicants for {jobTitle}</h1>
            <p className="mt-3 text-zinc-400">
              Review candidate credentials, add private notes, and advance candidates through the hiring pipeline.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
              Total Applicants: <strong className="text-white">{applicants.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by candidate name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-zinc-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="All">All Statuses ({applicants.length})</option>
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {filteredApplicants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                  <tr>
                    <th className="px-5 py-4 font-medium">Candidate</th>
                    <th className="px-5 py-4 font-medium">Contact</th>
                    <th className="px-5 py-4 font-medium">Applied</th>
                    <th className="px-5 py-4 font-medium">Resume</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredApplicants.map((app) => {
                    const currentStatus = app.status || "Applied";
                    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

                    return (
                      <tr key={app._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                              {app.seekerName?.charAt(0)?.toUpperCase() || "C"}
                            </div>
                            <div>
                              <span className="font-semibold text-white">{app.seekerName}</span>
                              {app.recruiterNotes && (
                                <p className="text-[11px] text-amber-400 font-medium truncate max-w-[180px]">
                                  Note: {app.recruiterNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-zinc-500" /> {app.seekerEmail}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-zinc-500" />
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "recently"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {app.resumeUrl ? (
                            <a
                              href={
                                app.resumeUrl.startsWith("http")
                                  ? app.resumeUrl
                                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${app.resumeUrl}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                              <FileText size={14} /> Resume PDF
                            </a>
                          ) : (
                            <span className="text-zinc-600 text-xs italic">None provided</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={currentStatus} />
                            <select
                              value={currentStatus}
                              disabled={updatingStatus}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                              className="rounded-lg border border-white/10 bg-black/80 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                              style={{ colorScheme: "dark" }}
                            >
                              <option value={currentStatus} disabled>
                                Advance to...
                              </option>
                              {allowedNext.map((st) => (
                                <option key={st} value={st} className="bg-zinc-950 text-white">
                                  {st}
                                </option>
                              ))}
                              {isAdmin &&
                                ALL_STATUSES.filter(
                                  (st) => st !== currentStatus && !allowedNext.includes(st)
                                ).map((st) => (
                                  <option key={st} value={st} className="bg-zinc-950 text-amber-300">
                                    {st} (Admin)
                                  </option>
                                ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition cursor-pointer"
                          >
                            Review & Notes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-zinc-500">
              {searchQuery || statusFilter !== "All"
                ? "No candidates match the current search or filter."
                : "No candidates have applied to this job listing yet."}
            </div>
          )}
        </div>

        {/* Candidate Detail & Notes Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                    {selectedApp.seekerName?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedApp.seekerName}</h3>
                    <p className="text-xs text-zinc-400">{selectedApp.seekerEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/[0.03] p-4 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs block">Date Applied</span>
                    <span className="font-medium text-white">
                      {selectedApp.appliedAt
                        ? new Date(selectedApp.appliedAt).toLocaleString()
                        : "Recently"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs block">Current Status</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedApp.status || "Applied"} />
                    </div>
                  </div>
                </div>

                {/* Candidate Cover Letter */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Cover Letter / Note</h4>
                  <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedApp.coverLetter || "No cover letter provided."}
                  </div>
                </div>

                {/* Resume Access */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Candidate Resume</h4>
                  {selectedApp.resumeUrl ? (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <FileText size={16} />
                        <span className="font-medium">Attached PDF Resume</span>
                      </div>
                      <a
                        href={
                          selectedApp.resumeUrl.startsWith("http")
                            ? selectedApp.resumeUrl
                            : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${selectedApp.resumeUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                      >
                        <ExternalLink size={13} /> View Resume
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No resume attached to this application.</p>
                  )}
                </div>

                {/* Status Transition Control */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Hiring Stage Workflow</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {ALLOWED_TRANSITIONS[selectedApp.status || "Applied"]?.length ? (
                      ALLOWED_TRANSITIONS[selectedApp.status || "Applied"].map((targetStatus) => (
                        <button
                          key={targetStatus}
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange(selectedApp._id, targetStatus)}
                          className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                        >
                          Advance to &quot;{targetStatus}&quot;
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500">
                        This application is in a terminal stage ({selectedApp.status}).
                      </p>
                    )}
                  </div>
                </div>

                {/* Private Recruiter Notes */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      Private Recruiter Notes
                      <span className="text-[11px] font-normal text-amber-400/90">
                        (Never visible to candidate)
                      </span>
                    </h4>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Add interview feedback, candidate strengths, compensation expectations, or private screening notes..."
                    value={recruiterNoteInput}
                    onChange={(e) => setRecruiterNoteInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none placeholder-zinc-600"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={savingNote}
                      onClick={handleSaveNotes}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50"
                    >
                      <Save size={14} />
                      {savingNote ? "Saving..." : "Save Private Note"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let tone = "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
  const s = (status || "Applied").toLowerCase();
  if (s === "rejected") {
    tone = "border-red-500/30 bg-red-500/10 text-red-300";
  } else if (s === "offered" || s === "accepted") {
    tone = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  } else if (s === "shortlisted") {
    tone = "border-violet-500/30 bg-violet-500/10 text-violet-300";
  } else if (s === "interview scheduled") {
    tone = "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  } else if (s === "under review") {
    tone = "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}
