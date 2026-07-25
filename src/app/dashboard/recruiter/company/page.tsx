"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Building2, Globe, MapPin, Users, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";

export default function RecruiterCompanyPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [employees, setEmployees] = useState("1-10");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");

  const fetchCompany = async () => {
    const email = user?.email;
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:5001/api/companies?recruiterEmail=${email}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const comp = data[0];
          setCompany(comp);
          setName(comp.name || "");
          setIndustry(comp.industry || "");
          setWebsiteUrl(comp.websiteUrl || "");
          setLocation(comp.location || "");
          setEmployees(comp.employees || "1-10");
          setLogo(comp.logo || "");
          setDescription(comp.description || "");
        } else {
          setCompany(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      setSaving(true);
      const payload = {
        name,
        industry,
        websiteUrl,
        location,
        employees,
        logo: logo || "/logos/nvidia.png",
        description,
        recruiterEmail: user.email,
      };

      let res;
      if (company?._id) {
        // Edit Company
        res = await fetch(`http://localhost:5001/api/companies/${company._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Register Company
        res = await fetch("http://localhost:5001/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(company?._id ? "Company details updated" : "Company registered successfully!");
        fetchCompany();
      } else {
        const err = await res.json();
        toast.error(err.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const statusTones: Record<string, string> = {
    pending: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    approved: "border-green-500/30 bg-green-500/10 text-green-300",
    rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400">Recruiter</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">My Company</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Manage the company profile recruiters and candidates see across HireLoop.</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left Side: Preview Card */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 h-fit">
          {company ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-3">
                <Image src={company.logo || "/logos/nvidia.png"} alt={`${company.name} logo`} width={48} height={48} className="h-auto w-auto object-contain" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-white">{company.name}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{company.description}</p>
              
              <span className={`mt-5 inline-flex rounded-full border px-3 py-1 text-xs capitalize ${statusTones[company.status || "pending"]}`}>
                {company.status || "pending"}
              </span>

              <div className="mt-6 space-y-3 text-sm text-zinc-400 border-t border-white/10 pt-5">
                <p className="flex items-center gap-2"><Building2 size={16} /> {company.industry}</p>
                <p className="flex items-center gap-2"><MapPin size={16} /> {company.location}</p>
                <p className="flex items-center gap-2"><Users size={16} /> {company.employees} employees</p>
                {company.websiteUrl && (
                  <p className="flex items-center gap-2"><Globe size={16} /> <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-white transition">{company.websiteUrl}</a></p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <AlertCircle size={32} className="mx-auto text-zinc-500" />
              <p className="mt-4 text-sm text-zinc-400 font-medium">No Company Registered</p>
              <p className="mt-2 text-xs text-zinc-500 leading-5">Fill out the registration form to list your company and start posting jobs.</p>
            </div>
          )}
        </section>

        {/* Right Side: Register / Edit Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5 h-fit">
          <h2 className="text-2xl font-semibold">{company ? "Edit Company" : "Register Company"}</h2>
          
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm text-zinc-500" htmlFor="comp-name">Company Name</label>
              <input
                id="comp-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="comp-industry">Industry</label>
              <input
                id="comp-industry"
                required
                placeholder="e.g. AI, Fintech, Cloud"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="comp-website">Website URL</label>
              <input
                id="comp-website"
                type="url"
                placeholder="https://mycompany.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="comp-location">Location</label>
              <input
                id="comp-location"
                required
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="comp-employees">Employee Count</label>
              <select
                id="comp-employees"
                value={employees}
                onChange={(e) => setEmployees(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                style={{ colorScheme: "dark" }}
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1,000 employees</option>
                <option value="1000+">1,000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-500" htmlFor="comp-logo">Logo URL</label>
              <input
                id="comp-logo"
                placeholder="e.g. /logos/nvidia.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-500" htmlFor="comp-desc">Short Description</label>
            <textarea
              id="comp-desc"
              rows={5}
              required
              placeholder="Tell candidates about your company..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : company ? "Save Company" : "Register Company"}
          </button>
        </form>
      </div>
    </div>
  );
}
