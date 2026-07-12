import Link from "next/link";

export default function RecruiterSettingsPage() {
  return (
    <div>
      <PageHeader title="Recruiter Settings" subtitle="Update recruiter account details and jump back to company management." />
      <form className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Personal Information</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Full name" defaultValue="Riley Chen" />
            <Field label="Email" defaultValue="riley@orbitai.example" type="email" />
            <Field label="Avatar URL" defaultValue="https://example.com/recruiter.jpg" />
            <Field label="Password" defaultValue="" type="password" />
          </div>
          <button type="submit" className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">Save Settings</button>
        </section>
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Linked Company</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Your recruiter profile is linked to OrbitAI. Company details and approval status live on the My Company page.</p>
          <Link href="/dashboard/recruiter/company" className="mt-6 inline-flex w-full justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10">Manage Company</Link>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div><label className="block text-sm text-zinc-500" htmlFor={id}>{label}</label><input id={id} type={type} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none" /></div>;
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><p className="text-sm font-medium text-indigo-400">Recruiter</p><h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p></div>;
}
