import Link from "next/link";
import { Eye } from "lucide-react";
import { jobs } from "@/data/mock";

const statuses = ["Applied", "Under Review", "Shortlisted", "Rejected", "Offered"];
const applications = jobs.slice(0, 5).map((job, index) => ({
  ...job,
  status: statuses[index],
  appliedAt: `${index + 1} days ago`,
}));

export default function ApplicationsPage() {
  return (
    <div>
      <PageHeader title="My Applications" subtitle="Follow every submitted application from first contact to final decision." />
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-white/10 text-zinc-500">
            <tr>
              <th className="px-5 py-4 font-medium">Job Title</th>
              <th className="px-5 py-4 font-medium">Company</th>
              <th className="px-5 py-4 font-medium">Date Applied</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {applications.map((application) => (
              <tr key={application.id}>
                <td className="px-5 py-4 font-medium text-white">{application.title}</td>
                <td className="px-5 py-4 text-zinc-400">{application.company}</td>
                <td className="px-5 py-4 text-zinc-500">{application.appliedAt}</td>
                <td className="px-5 py-4"><StatusBadge status={application.status} /></td>
                <td className="px-5 py-4">
                  <Link href={`/jobs/${application.id}`} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10">
                    <Eye size={14} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Rejected" ? "border-red-500/30 bg-red-500/10 text-red-300" : status === "Offered" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300";
  return <span className={`rounded-full border px-3 py-1 text-xs ${tone}`}>{status}</span>;
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
