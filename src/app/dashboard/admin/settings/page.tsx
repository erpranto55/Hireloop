import { Bell, ShieldCheck } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div>
      <div>
        <p className="text-sm font-medium text-indigo-400">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Settings</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Configure platform policies and administrative notifications.
        </p>
      </div>
      <div className="mt-8 grid max-w-3xl gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-indigo-300" />
            <div>
              <h2 className="text-xl font-semibold">Moderation policy</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Choose how new companies and jobs are reviewed.
              </p>
            </div>
          </div>
          <label className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black p-4">
            <span>
              <span className="block font-medium">
                Require company approval
              </span>
              <span className="mt-1 block text-sm text-zinc-500">
                New company profiles enter a review queue.
              </span>
            </span>
            <input
              defaultChecked
              type="checkbox"
              className="h-5 w-5 accent-indigo-500"
            />
          </label>
          <label className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black p-4">
            <span>
              <span className="block font-medium">Review new jobs</span>
              <span className="mt-1 block text-sm text-zinc-500">
                Hold job listings before they are published.
              </span>
            </span>
            <input type="checkbox" className="h-5 w-5 accent-indigo-500" />
          </label>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/3 p-6">
          <div className="flex items-center gap-3">
            <Bell className="text-indigo-300" />
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Receive alerts for activity that needs attention.
              </p>
            </div>
          </div>
          <label className="mt-6 flex items-center justify-between">
            <span className="text-sm text-zinc-300">
              Daily moderation digest
            </span>
            <input
              defaultChecked
              type="checkbox"
              className="h-5 w-5 accent-indigo-500"
            />
          </label>
          <label className="mt-4 flex items-center justify-between">
            <span className="text-sm text-zinc-300">Failed payment alerts</span>
            <input
              defaultChecked
              type="checkbox"
              className="h-5 w-5 accent-indigo-500"
            />
          </label>
          <button className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500">
            Save settings
          </button>
        </section>
      </div>
    </div>
  );
}
