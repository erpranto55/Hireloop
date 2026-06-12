"use client";

import Image from "next/image";
import {
    Search,
    MapPin,
    BriefcaseBusiness,
    Building2,
    Users,
    Star,
} from "lucide-react";

// --- Data Constants ---

const stats = [
    { icon: BriefcaseBusiness, value: "50K", label: "Active Jobs" },
    { icon: Building2, value: "12K", label: "Companies" },
    { icon: Users, value: "2M", label: "Job Seekers" },
    { icon: Star, value: "97%", label: "Satisfaction Rate" },
];

const tags = [
    "Product Designer",
    "AI Engineering",
    "Frontend Developer",
    "DevOps Engineer",
];

const companyLogos = [
    { src: "/images/logos/adobe.png", alt: "Adobe" },
    { src: "/images/logos/airbnb.png", alt: "Airbnb" },
    { src: "/images/logos/amazon.png", alt: "Amazon" },
    { src: "/images/logos/apple.png", alt: "Apple" },
    { src: "/images/logos/google.png", alt: "Google" },
    { src: "/images/logos/meta.png", alt: "Meta" },
    { src: "/images/logos/microsoft.png", alt: "Microsoft" },
    { src: "/images/logos/netflix.png", alt: "Netflix" },
    { src: "/images/logos/nvidia.png", alt: "Nvidia" },
    { src: "/images/logos/spotify.png", alt: "Spotify" },
    { src: "/images/logos/tesla.png", alt: "Tesla" },
    { src: "/images/logos/uber.png", alt: "Uber" },
];

// --- Main Component ---

const Hero = () => {
    return (
        <section className="relative overflow-hidden bg-black">
            
            {/* --- Background Effects --- */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e530,transparent_45%)]" />
            <div className="absolute -left-37.5 top-32 h-100 w-100 rounded-full bg-violet-600/20 blur-[150px]" />
            <div className="absolute -right-37.5 top-52 h-100 w-100 rounded-full bg-blue-600/20 blur-[150px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle,#6366f110_1px,transparent_1px)] bg-size-[32px_32px]" />

            <div className="relative z-10 container mx-auto px-4">
                
                {/* --- Hero Content --- */}
                <div className="flex flex-col items-center pt-32 md:pt-40">
                    
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 backdrop-blur-xl">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                        <span className="text-sm font-medium text-violet-200">
                            50,000+ NEW JOBS THIS MONTH
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 className="max-w-5xl text-center font-black leading-none tracking-tight">
                        <span className="block text-5xl text-white md:text-7xl lg:text-8xl">
                            Find Your
                        </span>
                        <span className="block bg-linear-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-5xl text-transparent md:text-7xl lg:text-8xl pb-2">
                            Dream Job
                        </span>
                        <span className="block text-5xl text-white md:text-7xl lg:text-8xl">
                            Today
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="mt-8 max-w-2xl text-center text-gray-400">
                        HireLoop connects top talent with world-class companies. Browse thousands of curated opportunities and land your next role faster.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-12 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/4 p-2 backdrop-blur-2xl">
                        <div className="flex flex-col md:flex-row">
                            <div className="flex flex-1 items-center px-5">
                                <Search className="text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Job title, skill or company"
                                    className="w-full bg-transparent px-3 py-5 text-white outline-none placeholder:text-gray-500"
                                />
                            </div>

                            <div className="hidden w-px bg-white/10 md:block" />

                            <div className="flex flex-1 items-center px-5">
                                <MapPin className="text-gray-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Location or Remote"
                                    className="w-full bg-transparent px-3 py-5 text-white outline-none placeholder:text-gray-500"
                                />
                            </div>

                            <button className="rounded-2xl bg-linear-to-r from-violet-600 to-blue-600 px-8 py-4 font-medium text-white transition hover:scale-105">
                                Search Jobs
                            </button>
                        </div>
                    </div>

                    {/* Quick Tags */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {tags.map((tag) => (
                            <button
                                key={tag}
                                className="rounded-full border border-white/10 bg-white/3 px-4 py-2 text-xs text-gray-400 transition hover:border-violet-500/30 hover:text-white"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Globe & Stats Section --- */}
                <div className="relative -mt-8 flex flex-col items-center">
                    
                    {/* Purple Glow behind globe */}
                    <div className="absolute top-20 h-87.5 w-87.5 rounded-full bg-violet-600/30 blur-[150px]" />

                    {/* Globe Image */}
                    <Image
                        src="/images/globe.png"
                        alt="3D Globe"
                        width={1600}
                        height={1600}
                        priority
                        className="relative z-10 w-full max-w-250 scale-[1.45] object-contain pointer-events-none"
                    />

                    {/* Globe Text Overlay */}
                    <div className="absolute top-35 z-20 text-center">
                        <h3 className="text-2xl md:text-4xl font-semibold text-white">
                            Assisting over 15,000 job seekers
                        </h3>
                        <p className="mt-2 text-gray-300">
                            find their dream positions.
                        </p>
                    </div>

                    {/* Stat Cards */}
                    <div className="relative z-30 -mt-24 w-full max-w-5xl px-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            {stats.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-violet-500/30"
                                    >
                                        <Icon
                                            size={18}
                                            className="mb-4 text-violet-400"
                                        />
                                        <h3 className="text-4xl font-bold text-white">
                                            {item.value}
                                        </h3>
                                        <p className="mt-2 text-sm text-gray-400">
                                            {item.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Trusted By Logos Section --- */}
            <div className="relative z-30 mt-32 border-t border-white/10 bg-white/2 py-12">
                <div className="container mx-auto px-4">
                    <p className="mb-8 text-center text-sm font-semibold tracking-wider text-gray-500 uppercase">
                        Trusted by top companies worldwide
                    </p>
                    
                    {/* Grid for logos (Using grayscale for a cleaner look, revealing color on hover) */}
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
                        {companyLogos.map((logo, idx) => (
                            <div 
                                key={idx} 
                                className="relative h-8 w-24 md:h-10 md:w-28 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
                            >
                                <Image
                                    src={logo.src}
                                    alt={logo.alt}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </section>
    );
};

export default Hero;