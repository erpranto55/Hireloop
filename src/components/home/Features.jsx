"use client";

import {
  Search,
  Bookmark,
  Sparkles,
  FileText,
  TrendingUp,
  Building2,
  ChartColumn,
  Hexagon,
} from "lucide-react";

const features = [
  {
    title: "Smart Search",
    description:
      "Find your ideal job with advanced filters.",
    icon: Search,
  },
  {
    title: "Salary Insights",
    description:
      "Get real salary data to negotiate confidently.",
    icon: ChartColumn,
  },
  {
    title: "Top Companies",
    description:
      "Apply to vetted companies that are hiring.",
    icon: Building2,
  },
  {
    title: "Saved Jobs",
    description:
      "Manage applications & favorites on your dashboard.",
    icon: Bookmark,
  },
  {
    title: "One-Click Apply",
    description:
      "Simplify your job applications for an easier process.",
    icon: Sparkles,
  },
  {
    title: "Resume Builder",
    description:
      "Create professional resumes with modern templates.",
    icon: FileText,
  },
  {
    title: "Skill-Based Matching",
    description:
      "Discover jobs that match your skills and experience.",
    icon: Hexagon,
  },
  {
    title: "Career Growth Resources",
    description:
      "Boost your career with quick interview tips.",
    icon: TrendingUp,
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />

      {/* Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,#ffffff08_1px,transparent_1px)] bg-size-[32px_32px] opacity-20" />

      {/* Main Glow */}
      <div
        className="
          absolute
          left-1/2
          top-0
          -translate-x-1/2
          w-250
          h-150
          bg-violet-600/10
          blur-[180px]
        "
      />

      {/* Secondary Glow */}
      <div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-300
          h-125
          bg-indigo-500/5
          blur-[220px]
        "
      />

      <div className="container relative z-10 mx-auto px-6">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400">
            <span className="h-2 w-2 bg-violet-500" />
            Features Job
            <span className="h-2 w-2 bg-violet-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <h2 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Everything you need
            <br />
            to succeed
          </h2>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group flex gap-4"
              >
                {/* Icon Box */}
                <div
                  className="
                    flex
                    h-16
                    w-16
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/3
                    backdrop-blur-xl
                    transition-all
                    duration-300
                    group-hover:border-violet-500/40
                    group-hover:bg-white/5
                  "
                >
                  <Icon
                    size={24}
                    className="text-fuchsia-400"
                  />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}