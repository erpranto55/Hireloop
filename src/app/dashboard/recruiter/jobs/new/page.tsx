"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { categories, jobTypes } from "@/data/mock";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] || "Engineering");
  const [type, setType] = useState(jobTypes[0] || "Full-time");
  const [currency, setCurrency] = useState("USD");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [responsibilitiesText, setResponsibilitiesText] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");

  useEffect(() => {
    const email = user?.email;
    if (email) {
      async function loadCompany() {
        try {
          const res = await fetch(`http://localhost:5001/api/companies?recruiterEmail=${email}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setCompany(data[0]);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingCompany(false);
        }
      }
      loadCompany();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !company) return;

    if (company.status !== "approved") {
      toast.error("Your company must be approved by the Admin before you can post jobs.");
      return;
    }

    try {
      setPublishing(true);

      const formattedSalary = salaryMin && salaryMax 
        ? `${currency === "USD" ? "$" : currency}${Math.round(Number(salaryMin) / 1000)}k - ${currency === "USD" ? "$" : currency}${Math.round(Number(salaryMax) / 1000)}k` 
        : "Negotiable";

      const payload = {
        title,
        category,
        type,
        location: isRemote ? "Remote" : location,
        salary: formattedSalary,
        deadline,
        description: `Join the team at ${company.name} as a ${title}.`,
        responsibilities: responsibilitiesText.split("\n").map(r => r.trim()).filter(Boolean),
        requirements: requirementsText.split("\n").map(r => r.trim()).filter(Boolean),
        benefits: benefitsText.split("\n").map(r => r.trim()).filter(Boolean),
        companyId: company._id,
        companyName: company.name,
        logo: company.logo,
        recruiterEmail: user.email,
        status: "active"
      };

      const res = await fetch("http://localhost:5001/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Job vacancy published successfully!");
        router.push("/dashboard/recruiter/jobs");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to publish job");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setPublishing(false);
    }
  };

  if (isPending || loadingCompany) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400">Recruiter</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Post a Job</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Create an active listing tied to your approved company and plan limit.</p>
      </div>

      {!company ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-red-400" size={36} />
          <h3 className="text-lg font-semibold text-white">No Company Registered</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            You must register your company profile under the "My Company" tab and wait for Admin approval before you can post jobs.
          </p>
          <button
            onClick={() => router.push("/dashboard/recruiter/company")}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition cursor-pointer"
          >
            Register Company Now
          </button>
        </div>
      ) : company.status !== "approved" ? (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-yellow-400" size={36} />
          <h3 className="text-lg font-semibold text-white">Company Approval Pending</h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Your company profile for <strong>{company.name}</strong> is currently pending Admin review. You will be able to post jobs once it is approved.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Job Info */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <h2 className="text-2xl font-semibold text-white">Job Info</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm text-zinc-500" htmlFor="title">Job Title</label>
                <input
                  id="title"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-500" htmlFor="category">Job Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  style={{ colorScheme: "dark" }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-500" htmlFor="type">Job Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  style={{ colorScheme: "dark" }}
                >
                  {jobTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm text-zinc-500" htmlFor="currency">Currency</label>
                  <input
                    id="currency"
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500" htmlFor="min-sal">Min Salary (Yr)</label>
                  <input
                    id="min-sal"
                    type="number"
                    placeholder="90000"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-500" htmlFor="max-sal">Max Salary (Yr)</label>
                  <input
                    id="max-sal"
                    type="number"
                    placeholder="130000"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {!isRemote && (
                <div>
                  <label className="block text-sm text-zinc-500" htmlFor="location">Location</label>
                  <input
                    id="location"
                    required={!isRemote}
                    placeholder="e.g. Austin, TX"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-zinc-500" htmlFor="deadline">Application Deadline</label>
                <input
                  id="deadline"
                  required
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            <label className="mt-3 flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => setIsRemote(e.target.checked)}
                className="accent-indigo-500 h-4 w-4"
              />{" "}
              This role is fully remote
            </label>
          </section>

          {/* Job Description details */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <h2 className="text-2xl font-semibold text-white">Job Description Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-500" htmlFor="resp">Responsibilities (one per line)</label>
                <textarea
                  id="resp"
                  rows={4}
                  required
                  placeholder="Design user interfaces...&#10;Write unit tests...&#10;Collaborate with PMs..."
                  value={responsibilitiesText}
                  onChange={(e) => setResponsibilitiesText(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-500" htmlFor="req">Requirements (one per line)</label>
                <textarea
                  id="req"
                  rows={4}
                  required
                  placeholder="3+ years of React experience...&#10;BS in Computer Science...&#10;Strong communication skills..."
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-500" htmlFor="ben">Benefits (one per line)</label>
                <textarea
                  id="ben"
                  rows={3}
                  placeholder="Full health/dental insurance...&#10;401k matching...&#10;Unlimited PTO..."
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Linked Company Confirmation */}
          <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <CheckCircle className="text-green-400" size={20} /> Posting Company
            </h2>
            <p className="mt-3 text-sm text-zinc-300">
              This job vacancy will be published under your approved company profile: <strong>{company.name}</strong>.
            </p>
          </section>

          <button
            type="submit"
            disabled={publishing}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
          >
            {publishing ? "Publishing Job..." : "Publish Job"}
          </button>
        </form>
      )}
    </div>
  );
}
