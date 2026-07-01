"use client";

import React, { useState } from "react";
import { ArrowRight, Plus, Crown, BarChart3, Zap, type LucideIcon } from "lucide-react";

interface PlanItem {
  name: string;
  price: number;
  icon: LucideIcon;
  featured: boolean;
  features: string[];
}

const plans: PlanItem[] = [
  {
    name: "Starter",
    price: 0,
    icon: Crown,
    featured: false,
    features: [
      "Daily AI match brief (top 5)",
      "Verified salary bands",
      "Company insight dashboards",
      "1-click apply, unlimited",
    ],
  },
  {
    name: "Growth",
    price: 17,
    icon: BarChart3,
    featured: true,
    features: [
      "Daily AI match brief (top 5)",
      "Verified salary bands",
      "Company insight dashboards",
      "1-click apply, unlimited",
    ],
  },
  {
    name: "Premium",
    price: 99,
    icon: Zap,
    featured: false,
    features: [
      "Everything in Pro",
      "Multi-profile career portfolios",
      "Shared talent rooms",
      "Recruiter view (read-only)",
    ],
  },
];

type BillingCycle = "monthly" | "yearly";

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("yearly");

  return (
    <section className="relative overflow-hidden bg-black pt-28 pb-10">
      {/* Glow */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-250 h-125 bg-violet-600/10 blur-[180px]" />

      <div className="container relative z-10 mx-auto px-6">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400">
            <span className="w-2 h-2 bg-violet-500" />
            Pricing
            <span className="w-2 h-2 bg-violet-500" />
          </div>
        </div>

        <h2 className="mt-8 text-center text-4xl md:text-6xl font-semibold text-white leading-tight">
          Pay for the leverage,
          <br />
          not the listings
        </h2>

        {/* Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
            <div className="flex items-center">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm transition ${
                  billing === "monthly"
                    ? "bg-white text-black"
                    : "text-zinc-300"
                }`}
              >
                Monthly
              </button>

              <button
                onClick={() => setBilling("yearly")}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm transition ${
                  billing === "yearly"
                    ? "bg-white text-black"
                    : "text-zinc-300"
                }`}
              >
                Yearly
                <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-xs text-white">
                  25%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.name}
                className={`relative rounded-[28px] border p-6 ${
                  plan.featured
                    ? "border-white/20 bg-white/4 shadow-[0_0_80px_rgba(255,255,255,0.08)] lg:-translate-y-2"
                    : "border-white/10 bg-black"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <Icon size={18} className="text-fuchsia-400" />
                    </div>

                    <h3 className="text-2xl text-white">
                      {plan.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-5xl font-semibold text-white">
                      $
                      {billing === "yearly"
                        ? Math.round(plan.price * 0.75)
                        : plan.price}
                    </span>
                    <span className="text-sm text-zinc-500">
                      /month
                    </span>
                  </div>
                </div>

                <div className="mt-6 h-px bg-linear-to-r from-fuchsia-500 to-transparent" />

                <p className="mt-6 font-medium text-white">
                  Start building your insights hub:
                </p>

                <ul className="mt-6 space-y-5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-zinc-400"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5">
                        <Plus size={12} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-10 flex w-full items-center justify-between rounded-2xl px-5 py-4 ${
                    plan.featured
                      ? "bg-white text-black"
                      : "bg-white/10 text-white"
                  }`}
                >
                  Choose This Plan
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
