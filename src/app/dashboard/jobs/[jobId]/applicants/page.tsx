"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default function JobApplicantsPage({ params }: PageProps) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [applicants, setApplicants] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState("Job");
  const [loading, setLoading] = useState(true);

  // Unwrap params
  useEffect(() => {
    params.then((p) => {
      setJobId(p.jobId);
    });
  }, [params]);

  useEffect(() => {
    if (jobId) {
      async function loadData() {
        try {
          // Fetch job title
          const jobRes = await fetch(`http://localhost:5001/api/jobs/${jobId}`);
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            setJobTitle(jobData.title);
          }

          // Fetch applications
          const appRes = await fetch(`http://localhost:5001/api/applications?jobId=${jobId}`);
          if (appRes.ok) {
            const appData = await appRes.json();
            setApplicants(appData);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load applicants information");
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [jobId]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Applicant status updated to ${newStatus}`);
        setApplicants((prev) =>
          prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
        );
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const statuses = ["Applied", "Under Review", "Shortlisted", "Offered", "Rejected"];

  return (
    <div className="min-h-screen bg-black px-6 pt-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl pb-20">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition cursor-pointer mb-6"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="mb-6">
          <p className="text-sm font-medium text-indigo-400">Recruiter Toolkit</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Applicants for {jobTitle}</h1>
          <p className="mt-3 text-zinc-400">Review candidate details, download resumes, and manage interview schedules.</p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {applicants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                  <tr>
                    <th className="px-5 py-4 font-medium">Candidate</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Date Applied</th>
                    <th className="px-5 py-4 font-medium">Resume</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {applicants.map((app) => (
                    <tr key={app._id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                            {app.seekerName?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-white">{app.seekerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        <span className="flex items-center gap-2"><Mail size={14} /> {app.seekerEmail}</span>
                      </td>
                      <td className="px-5 py-4 text-zinc-500">
                        <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        {app.resumeUrl ? (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
                          >
                            <FileText size={15} /> Resume Link
                          </a>
                        ) : (
                          <span className="text-zinc-600 italic">None provided</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={app.status || "Applied"}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                          style={{ colorScheme: "dark" }}
                        >
                          {statuses.map((st) => (
                            <option key={st} value={st} className="bg-zinc-950 text-white">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-zinc-500">
              No candidates have applied to this job listing yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
