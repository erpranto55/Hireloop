import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";

const seekerPlans = [
  {
    name: "Free",
    price: "$0",
    suffix: "forever",
    features: ["Browse and save up to 10 jobs", "Apply to 3 jobs per month", "Basic profile", "Email alerts"],
  },
  {
    name: "Pro",
    price: "$19",
    suffix: "per month",
    features: ["Apply to 30 jobs per month", "Unlimited saved jobs", "Application tracking", "Salary insights"],
    featured: true,
  },
  {
    name: "Premium",
    price: "$39",
    suffix: "per month",
    features: ["Unlimited applications", "Profile boost to recruiters", "Early job access", "Priority support"],
  },
];

const recruiterPlans = [
  {
    name: "Free",
    price: "$0",
    suffix: "forever",
    features: ["3 active job posts", "Basic applicant management", "Standard listing visibility", "Company profile"],
  },
  {
    name: "Growth",
    price: "$49",
    suffix: "per month",
    features: ["10 active job posts", "Applicant tracking", "Basic analytics", "Email support"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$149",
    suffix: "per month",
    features: ["50 active job posts", "Advanced analytics", "Featured listings", "Priority support"],
  },
];

const faqs = [
  "Can I switch plans later?",
  "Do paid plans support refunds?",
  "Which payment methods are supported?",
  "Are recruiter limits counted by active jobs only?",
];

export const metadata = {
  title: "Pricing | HireLoop",
  description: "Choose HireLoop plans for job seekers and recruiters.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black px-6 pt-36 text-white lg:px-8">
      <section className="mx-auto max-w-7xl pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-medium text-indigo-400">Pricing</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Plans for candidates and hiring teams.
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Start free, then upgrade when you need more applications, more active job posts, or deeper workflow tools.
          </p>
        </div>

        <PlanSection title="For Job Seekers" plans={seekerPlans} />
        <PlanSection title="For Recruiters" plans={recruiterPlans} />

        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <details key={faq} className="rounded-xl border border-white/10 bg-black p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-white">
                  <HelpCircle size={18} className="text-indigo-300" /> {faq}
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Yes. HireLoop supports flexible plan changes, Stripe-powered payments, and clear limits based on your selected role.
                </p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function PlanSection({ title, plans }: { title: string; plans: { name: string; price: string; suffix: string; features: string[]; featured?: boolean }[] }) {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`rounded-2xl border p-6 ${plan.featured ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/10 bg-white/[0.03]"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              {plan.featured && <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium">Popular</span>}
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-semibold">{plan.price}</span>
              <span className="pb-1 text-sm text-zinc-400">/{plan.suffix}</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check size={18} className="shrink-0 text-indigo-300" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8 inline-flex w-full justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200">
              Choose {plan.name}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
