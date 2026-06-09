'use client';

import { useState } from "react";
import { Link, Button } from "@heroui/react";
import { Menu, X } from "lucide-react";

const NavBar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-6">
            <div className="w-full max-w-6xl">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.08)]">

                    {/* Logo */}
                    <div className="flex items-center">
                        <h2 className="text-3xl font-bold">
                            <span className="text-blue-500">hire</span>
                            <span className="text-orange-500">loop</span>
                        </h2>
                    </div>

                    {/* Desktop Navigation */}
                    <ul className="hidden items-center gap-10 md:flex">
                        <li>
                            <Link
                                href="#jobs"
                                className="text-sm text-white/70 transition hover:text-white"
                            >
                                Browse Jobs
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="#company"
                                className="text-sm text-white/70 transition hover:text-white"
                            >
                                Company
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="#pricing"
                                className="text-sm text-white/70 transition hover:text-white"
                            >
                                Pricing
                            </Link>
                        </li>
                    </ul>

                    {/* Desktop Actions */}
                    <div className="hidden items-center gap-6 md:flex">
                        <Link
                            href="/signin"
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                            Sign In
                        </Link>

                        <Button
                            radius="lg"
                            className="bg-linear-to-r from-indigo-500 to-violet-600 px-6 text-white shadow-lg shadow-indigo-500/25"
                        >
                            Get Started
                        </Button>
                    </div>

                    {/* Mobile Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-white md:hidden"
                    >
                        {isMenuOpen ? (
                            <X size={24} />
                        ) : (
                            <Menu size={24} />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mt-2 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl md:hidden">
                        <ul className="flex flex-col p-4">
                            <li>
                                <Link
                                    href="#jobs"
                                    className="py-3 text-white/80"
                                >
                                    Browse Jobs
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="#company"
                                    className="py-3 text-white/80"
                                >
                                    Company
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="#pricing"
                                    className="py-3 text-white/80"
                                >
                                    Pricing
                                </Link>
                            </li>

                            <div className="mt-4 flex flex-col gap-3">
                                <Button
                                    variant="light"
                                    className="text-indigo-400"
                                >
                                    Sign In
                                </Button>

                                <Button
                                    className="bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                                >
                                    Get Started
                                </Button>
                            </div>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;