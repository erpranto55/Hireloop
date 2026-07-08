import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeDollarSign, Briefcase, CalendarDays, MapPin } from "lucide-react";
import { jobs } from "@/data/mock";

interface JobDetailsPageProps {
  params: Promise<{ jobId: string }>;
}

export function generateStaticParams() {
  return jobs.map((job) => ({ jobId: job.id }));
}

export async function generateMetadata({ params }: JobDetailsPageProps) {
  const { jobId } = await params;
  const job = jobs.find((item) => item.id === jobId);

  return {
    title: job ? `${job.title} | HireLoop` : "Job Details | HireLoop",
    description: job?.description || "View job details on HireLoop.",
  };
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { jobId } = await params;
  const job = jobs.find((item) => item.id === jobId);

  if (!job) notFound();

  const similarJobs = jobs.filter((item) => item.category === job.category && item.id !== job.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-black px-6 pt-36 text-white lg:px-8">
      <article className="mx-auto max-w-6xl pb-20">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
          <ArrowLeft size={16} /> Back to jobs
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-3">
                <Image src={job.logo} alt={`${job.company} logo`} width={48} height={48} className="h-auto w-auto object-contain" />
              </div>
              <div>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-300">
                  {job.category}
                </span>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{job.title}</h1>
                <p className="mt-4 text-lg text-zinc-400">{job.description}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info icon={<Briefcase size={18} />} label="Type" value={job.type} />
              <Info icon={<MapPin size={18} />} label="Location" value={job.location} />
              <Info icon={<BadgeDollarSign size={18} />} label="Salary" value={job.salary} />
              <Info icon={<CalendarDays size={18} />} label="Deadline" value={job.deadline} />
            </div>

            <Section title="Responsibilities" items={job.responsibilities} />
            <Section title="Requirements" items={job.requirements} />
            <Section title="Benefits" items={job.benefits} />
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm text-zinc-500">Company</p>
            <h2 className="mt-2 text-2xl font-semibold">{job.company}</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Applying requires a HireLoop account. Free plan users can apply to up to 3 jobs each month.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500"
            >
              Apply Now
            </Link>
            <Link
              href={`/companies#${job.companyId}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/10 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
            >
              View Company
            </Link>
          </aside>
        </div>

        {similarJobs.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold">Similar jobs</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {similarJobs.map((item) => (
                <Link key={item.id} href={`/jobs/${item.id}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-500/40">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-zinc-400">{item.company}</p>
                  <p className="mt-4 text-sm text-indigo-300">{item.salary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-indigo-300">{icon}</div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-zinc-400">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}


