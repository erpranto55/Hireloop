import type React from "react";
import { Ban, Search, ShieldCheck, UserCheck } from "lucide-react";

const users = [
  ["Avery Chen", "avery@hireloop.dev", "Seeker", "Active"],
  ["Morgan Lee", "morgan@orbitai.example", "Recruiter", "Active"],
  ["Jordan Patel", "jordan@hireloop.dev", "Seeker", "Suspended"],
  ["Casey Wilson", "casey@devforge.example", "Recruiter", "Active"],
];

export default function AdminUsersPage() {
  return <div><Header title="Users" subtitle="Review accounts, permissions, and account standing across HireLoop." />
    <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"><label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 text-zinc-500"><Search size={17} /><input className="w-full bg-transparent text-sm text-white outline-none" placeholder="Search users" /></label><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500"><UserCheck size={16} /> Invite admin</button></div>
    <Table><thead className="border-b border-white/10 text-zinc-500"><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody className="divide-y divide-white/10">{users.map(([name, email, role, status]) => <tr key={email}><td><p className="font-medium text-white">{name}</p><p className="mt-1 text-xs text-zinc-500">{email}</p></td><td><Role role={role} /></td><td><Status status={status} /></td><td><div className="flex gap-2"><Action label="Manage" icon={<ShieldCheck size={14} />} /><Action label="Suspend" icon={<Ban size={14} />} danger /></div></td></tr>)}</tbody></Table>
  </div>;
}

function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div><p className="text-sm font-medium text-indigo-400">Administration</p><h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p></div>; }
function Table({ children }: { children: React.ReactNode }) { return <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><table className="w-full min-w-[720px] text-left text-sm">{children}</table></div>; }
function Role({ role }: { role: string }) { return <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">{role}</span>; }
function Status({ status }: { status: string }) { return <span className={`rounded-full border px-3 py-1 text-xs ${status === "Active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{status}</span>; }
function Action({ label, icon, danger = false }: { label: string; icon: React.ReactNode; danger?: boolean }) { return <button aria-label={label} className={`rounded-lg border p-2 ${danger ? "border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white" : "border-white/10 text-zinc-300 hover:bg-white/10"}`}>{icon}</button>; }
