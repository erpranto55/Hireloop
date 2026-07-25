"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Check, Eye, Search, X } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCompanies = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleUpdateStatus = async (companyId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Company status updated to ${newStatus}`);
        fetchCompanies();
      } else {
        toast.error("Failed to update company status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.location || "").toLowerCase().includes(query) ||
      (c.industry || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const statusTones: Record<string, string> = {
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    approved: "border-green-500/30 bg-green-500/10 text-green-300",
    rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <div>
      <Header
        title="Companies"
        subtitle="Approve company profiles and keep the marketplace trustworthy."
      />
      <label className="mt-8 flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 text-zinc-500">
        <Search size={17} />
        <input
          className="w-full bg-transparent text-sm text-white outline-none"
          placeholder="Search companies by name, location, or industry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </label>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {filteredCompanies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-500 bg-black/40">
                <tr>
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Industry</th>
                  <th className="px-5 py-4 font-medium">Location</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredCompanies.map((company) => {
                  const compId = company._id || company.id;
                  const status = company.status || "pending";
                  return (
                    <tr key={compId}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-2">
                            <Image
                              src={company.logo || "/logos/nvidia.png"}
                              alt={`${company.name} logo`}
                              width={28}
                              height={28}
                              className="h-auto w-auto object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-white">{company.name}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {company.recruiterEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-400">{company.industry}</td>
                      <td className="px-5 py-4 text-zinc-400">{company.location}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs capitalize ${statusTones[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {status !== "approved" && (
                            <button
                              onClick={() => handleUpdateStatus(compId, "approved")}
                              className="rounded-lg border border-green-500/20 text-green-300 hover:bg-green-500 hover:text-white p-2 cursor-pointer"
                              title="Approve Company"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {status !== "rejected" && (
                            <button
                              onClick={() => handleUpdateStatus(compId, "rejected")}
                              className="rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white p-2 cursor-pointer"
                              title="Reject Company"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-zinc-500">
            No registered company accounts found matching your query.
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Administration</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
    </div>
  );
}
