import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Users } from "lucide-react";
import { companies, industries } from "@/data/mock";

export const metadata = {
  title: "Companies | HireLoop",
  description: "Explore approved companies hiring on HireLoop.",
};

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-black px-6 pt-36 text-white lg:px-8">
      <section className="mx-auto max-w-7xl pb-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="text-sm font-medium text-indigo-400">Companies</span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              Meet the teams hiring through HireLoop.
            </h1>
            <p className="mt-5 text-lg leading-8 text-zinc-400">
              Browse approved company profiles by industry, location, team size, and open roles.
            </p>
          </div>
          <Link href="/signup" className="inline-flex w-fit rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500">
            Register Company
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">All</span>
          {industries.map((industry) => (
            <span key={industry} className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
              {industry}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <article id={company.id} key={company.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-indigo-500/40 hover:bg-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2">
                  <Image src={company.logo} alt={`${company.name} logo`} width={42} height={42} className="h-auto w-auto object-contain" />
                </div>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                  {company.industry}
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-semibold">{company.name}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">{company.description}</p>

              <div className="mt-6 space-y-3 text-sm text-zinc-400">
                <p className="flex items-center gap-2"><MapPin size={16} /> {company.location}</p>
                <p className="flex items-center gap-2"><Users size={16} /> {company.employees} employees</p>
                <p className="flex items-center gap-2"><Building2 size={16} /> {company.openJobs} open jobs</p>
              </div>

              <Link href={`/jobs?company=${company.id}`} className="mt-6 inline-flex text-sm font-medium text-indigo-300 transition hover:text-indigo-200">
                View open roles
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
