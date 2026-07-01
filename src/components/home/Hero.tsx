"use client";

import React from "react";
import {
    Search,
    MapPin,
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    Users,
    Star,
    Sparkles,
    type LucideIcon,
} from "lucide-react";

interface StatItem {
    icon: LucideIcon;
    value: string;
    label: string;
}

const stats: StatItem[] = [
    {
        icon: BriefcaseBusiness,
        value: "50K+",
        label: "Active Jobs",
    },
    {
        icon: Building2,
        value: "12K+",
        label: "Companies",
    },
    {
        icon: Users,
        value: "2M+",
        label: "Candidates",
    },
    {
        icon: Star,
        value: "97%",
        label: "Success Rate",
    },
];

const tags: string[] = [
    "Product Designer",
    "AI Engineer",
    "Frontend",
    "DevOps",
    "Remote Jobs",
];

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-black text-white">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle,#ffffff08_1px,transparent_1px)] bg-size-[32px_32px] opacity-30" />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-225 h-225 bg-violet-600/10 blur-[180px] rounded-full" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="max-w-6xl mx-auto pt-32 pb-24">
                    {/* Badge */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-2">
                            <Sparkles
                                size={14}
                                className="text-violet-400"
                            />
                            <span className="text-sm text-gray-300">
                                50,000+ jobs added this month
                            </span>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="mt-8 text-center">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
                            Find Your
                            <span className="block bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                                Dream Job Faster
                            </span>
                        </h1>

                        <p className="mt-8 max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
                            Discover opportunities from top companies,
                            connect with recruiters, and take the next
                            step in your career journey.
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mt-12 max-w-5xl mx-auto">
                        <div className="rounded-3xl border border-white/10 bg-white/4 backdrop-blur-2xl p-3 shadow-[0_0_80px_rgba(139,92,246,0.15)]">
                            <div className="flex flex-col lg:flex-row gap-3">
                                <div className="flex-1 flex items-center px-4 py-3">
                                    <Search
                                        size={20}
                                        className="text-gray-500 mr-3"
                                    />
                                    <input
                                        placeholder="Job title, skill or company"
                                        className="w-full bg-transparent outline-none text-white placeholder:text-gray-500"
                                    />
                                </div>

                                <div className="hidden lg:block w-px bg-white/10" />

                                <div className="flex-1 flex items-center px-4 py-3">
                                    <MapPin
                                        size={20}
                                        className="text-gray-500 mr-3"
                                    />
                                    <input
                                        placeholder="Location or Remote"
                                        className="w-full bg-transparent outline-none text-white placeholder:text-gray-500"
                                    />
                                </div>

                                <button className="h-14 px-8 rounded-2xl bg-violet-600 hover:bg-violet-500 transition-all flex items-center justify-center gap-2 font-medium">
                                    Find Jobs
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                className="px-4 py-2 rounded-full border border-white/10 bg-white/3 text-sm text-gray-300 hover:bg-white/10 transition"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Visual Section */}
                    <div className="relative mt-24">
                        {/* Glow */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-62.5 bg-violet-600/20 blur-[120px] -z-10" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-24">
                        {stats.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.label}
                                    className="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-xl p-6"
                                >
                                    <Icon
                                        size={22}
                                        className="text-violet-400 mb-4"
                                    />

                                    <h3 className="text-3xl font-bold">
                                        {item.value}
                                    </h3>

                                    <p className="text-sm text-gray-400 mt-2">
                                        {item.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Trust */}
                    <div className="mt-16 text-center">
                        <p className="text-gray-500 text-sm uppercase tracking-[0.25em]">
                            Trusted by teams worldwide
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-10 text-gray-400 font-medium">
                            <span>Google</span>
                            <span>Stripe</span>
                            <span>OpenAI</span>
                            <span>Notion</span>
                            <span>Airbnb</span>
                            <span>Spotify</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}