import type React from "react";
import Image from "next/image";
import { Check, Eye, Search, X } from "lucide-react";
import { companies } from "@/data/mock";

export default function AdminCompaniesPage() {
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
          placeholder="Search companies"
        />
      </label>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/3">
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="border-b border-white/10 text-zinc-500">
            <tr>
              <th>Company</th>
              <th>Industry</th>
              <th>Open jobs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {companies.map((company, index) => {
              const pending = index === 2 || index === 5;
              return (
                <tr key={company.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-2">
                        <Image
                          src={company.logo}
                          alt=""
                          width={28}
                          height={28}
                          className="h-auto w-auto object-contain"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-white">{company.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {company.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-zinc-400">{company.industry}</td>
                  <td className="text-zinc-400">{company.openJobs}</td>
                  <td>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${pending ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}
                    >
                      {pending ? "Pending" : "Approved"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Action label="View" icon={<Eye size={14} />} />
                      <Action label="Approve" icon={<Check size={14} />} />
                      <Action label="Reject" icon={<X size={14} />} danger />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
function Action({
  label,
  icon,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={`rounded-lg border p-2 ${danger ? "border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}
    >
      {icon}
    </button>
  );
}
