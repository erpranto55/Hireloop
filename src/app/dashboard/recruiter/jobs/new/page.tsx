import { categories, jobTypes } from "@/data/mock";

export default function NewJobPage() {
  return (
    <div>
      <PageHeader title="Post a Job" subtitle="Create an active listing tied to your approved company and plan limit." />

      <form className="mt-8 space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Job Info</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Job Title" placeholder="Senior Backend Engineer" />
            <Select label="Job Category" options={categories} />
            <Select label="Job Type" options={jobTypes} />
            <Field label="Currency" placeholder="USD" />
            <Field label="Salary Min" placeholder="120000" />
            <Field label="Salary Max" placeholder="160000" />
            <Field label="Location" placeholder="City, Country" />
            <Field label="Application Deadline" placeholder="August 30, 2026" />
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" className="accent-indigo-500" /> This role is remote</label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Job Description</h2>
          <div className="mt-6 grid gap-5">
            <Textarea label="Responsibilities" placeholder="List core responsibilities, one per line" />
            <Textarea label="Requirements" placeholder="List required skills and experience" />
            <Textarea label="Benefits" placeholder="Add perks, benefits, and compensation notes" />
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6">
          <h2 className="text-2xl font-semibold">Company</h2>
          <p className="mt-3 text-sm text-zinc-300">This job will be posted under OrbitAI. Your company is approved and your Growth plan allows 2 more active jobs.</p>
        </section>

        <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">Publish Job</button>
      </form>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div><label className="block text-sm text-zinc-500" htmlFor={id}>{label}</label><input id={id} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600" /></div>;
}

function Select({ label, options }: { label: string; options: readonly string[] }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div><label className="block text-sm text-zinc-500" htmlFor={id}>{label}</label><select id={id} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></div>;
}

function Textarea({ label, placeholder }: { label: string; placeholder: string }) {
  const id = label.toLowerCase();
  return <div><label className="block text-sm text-zinc-500" htmlFor={id}>{label}</label><textarea id={id} rows={5} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600" /></div>;
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><p className="text-sm font-medium text-indigo-400">Recruiter</p><h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p></div>;
}
