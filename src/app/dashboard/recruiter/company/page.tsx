import Image from "next/image";
import { Building2, Globe, MapPin, Users } from "lucide-react";
import { companies } from "@/data/mock";

const company = companies[0];

export default function RecruiterCompanyPage() {
  return (
    <div>
      <PageHeader title="My Company" subtitle="Manage the company profile recruiters and candidates see across HireLoop." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-3">
            <Image src={company.logo} alt={`${company.name} logo`} width={48} height={48} className="h-auto w-auto object-contain" />
          </div>
          <h2 className="mt-5 text-3xl font-semibold">{company.name}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{company.description}</p>
          <span className="mt-5 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Approved</span>
          <div className="mt-6 space-y-3 text-sm text-zinc-400">
            <p className="flex items-center gap-2"><Building2 size={16} /> {company.industry}</p>
            <p className="flex items-center gap-2"><MapPin size={16} /> {company.location}</p>
            <p className="flex items-center gap-2"><Users size={16} /> {company.employees} employees</p>
            <p className="flex items-center gap-2"><Globe size={16} /> https://orbitai.example</p>
          </div>
        </section>

        <form className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Edit Company</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Company Name" defaultValue={company.name} />
            <Field label="Industry" defaultValue={company.industry} />
            <Field label="Website URL" defaultValue="https://orbitai.example" />
            <Field label="Location" defaultValue={company.location} />
            <Field label="Employee Count" defaultValue={company.employees} />
            <Field label="Logo URL" defaultValue={company.logo} />
          </div>
          <label className="mt-5 block text-sm text-zinc-500" htmlFor="description">Short Description</label>
          <textarea id="description" rows={5} defaultValue={company.description} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none" />
          <button type="submit" className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">Save Company</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div>
      <label className="block text-sm text-zinc-500" htmlFor={id}>{label}</label>
      <input id={id} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none" />
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><p className="text-sm font-medium text-indigo-400">Recruiter</p><h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p></div>;
}
