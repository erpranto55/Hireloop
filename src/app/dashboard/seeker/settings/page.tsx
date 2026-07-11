export default function SeekerSettingsPage() {
  return (
    <div>
      <PageHeader title="Seeker Settings" subtitle="Update profile details, resume, skills, and account preferences." />

      <form className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">Profile Information</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field label="Full name" defaultValue="Alex Morgan" />
            <Field label="Email" defaultValue="alex@hireloop.dev" type="email" />
            <Field label="Headline" defaultValue="Frontend Engineer" />
            <Field label="Avatar URL" defaultValue="https://example.com/avatar.jpg" />
          </div>
          <label className="mt-5 block text-sm text-zinc-500" htmlFor="bio">Bio</label>
          <textarea id="bio" rows={5} defaultValue="Product-minded frontend engineer with a love for polished SaaS workflows." className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none" />
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Resume</h2>
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-black p-5 text-sm text-zinc-400">
              Upload a PDF resume or replace the current file.
            </div>
            <button type="button" className="mt-4 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10">Upload PDF</button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["React", "TypeScript", "Next.js", "Tailwind", "MongoDB"].map((skill) => (
                <span key={skill} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{skill}</span>
              ))}
            </div>
            <input placeholder="Add a skill" className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600" />
          </section>
        </aside>

        <div className="lg:col-span-2">
          <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div>
      <label className="block text-sm text-zinc-500" htmlFor={id}>{label}</label>
      <input id={id} type={type} defaultValue={defaultValue} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none" />
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Seeker</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
    </div>
  );
}
