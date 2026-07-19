import JobsClient from "@/components/jobs/JobsClient";

export const metadata = {
  title: "Browse Jobs | HireLoop",
  description: "Search open jobs by role, location, type, and category.",
};

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-black px-6 pt-36 text-white lg:px-8">
      <section className="mx-auto max-w-7xl pb-20">
        <div className="max-w-3xl">
          <span className="text-sm font-medium text-violet-400">Browse Jobs</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Find the role that moves your career forward.
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Search curated opportunities across engineering, design, data, marketing, security, and developer relations.
          </p>
        </div>

        <JobsClient />
      </section>
    </div>
  );
}