"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@heroui/react/button";

import { Spinner } from "@heroui/react/spinner";

import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { toast } from "react-toastify";
import { authClient, signUp } from "@/lib/auth-client";

export default function SignupPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        const {
            name,
            email,
            password,
            confirmPassword,
        } = formData;

        if (!name || !email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            const { error } =
                await signUp.email({
                    name,
                    email,
                    password,
                });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Account created successfully");

            setTimeout(() => {
                router.push("/signin");
            }, 1200);
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
        });
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-black">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)]" />

            <div className="absolute left-1/2 top-0 h-150 w-225 -translate-x-1/2 rounded-full bg-violet-600/10 blur-[150px]" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12 mt-20">
                <div className="grid w-full max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-white/3 backdrop-blur-xl lg:grid-cols-2">

                    {/* Left Side */}
                    <div className="hidden flex-col justify-between border-r border-white/10 p-12 lg:flex">
                        <div>
                            <h1 className="text-5xl font-bold">
                                <span className="text-blue-500">hire</span>
                                <span className="text-orange-500">loop</span>
                            </h1>

                            <div className="mt-12">
                                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-violet-400">
                                    AI Powered Career Platform
                                </span>

                                <h2 className="mt-6 text-5xl font-bold leading-tight text-white">
                                    Launch Your Career
                                    <span className="block bg-linear-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                                        Faster Than Ever
                                    </span>
                                </h2>

                                <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
                                    Join thousands of professionals discovering jobs,
                                    building powerful resumes, and connecting with
                                    world-class companies using AI-powered matching.
                                </p>
                            </div>


                        </div>

                        {/* Bottom Stats */}
                        <div>
                            <div className="grid grid-cols-2 gap-4">
                                <Stat value="50K+" label="Active Jobs" />
                                <Stat value="12K+" label="Companies" />
                                <Stat value="2M+" label="Candidates" />
                                <Stat value="97%" label="Success Rate" />
                            </div>

                            <div className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-4">
                                <p className="text-sm text-zinc-400">
                                    Trusted by job seekers from
                                </p>

                                <div className="mt-2 flex items-center gap-4 text-sm font-medium text-zinc-300">
                                    <span>Google</span>
                                    <span>Microsoft</span>
                                    <span>Amazon</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="p-8 md:p-12">
                        <div className="mx-auto max-w-md">
                            <h2 className="text-center text-4xl font-bold text-white">
                                Create Account
                            </h2>

                            <p className="mt-3 text-center text-zinc-400">
                                Start your career journey today
                            </p>

                            <form onSubmit={handleSignup} className="space-y-5">

                                {/* Name */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your Name"
                                        className="
                                                    h-12
                                                    w-full
                                                    rounded-xl
                                                    border
                                                    border-white/10
                                                    bg-white/5
                                                    px-4
                                                    text-white
                                                    placeholder:text-zinc-500
                                                    outline-none
                                                    transition
                                                    focus:border-violet-500
                                                    focus:bg-white/10
                                                  "
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Your Email"
                                        className="
                                                    h-12
                                                    w-full
                                                    rounded-xl
                                                    border
                                                    border-white/10
                                                    bg-white/5
                                                    px-4
                                                    text-white
                                                    placeholder:text-zinc-500
                                                    outline-none
                                                    transition
                                                    focus:border-violet-500
                                                    focus:bg-white/10
                                                  "
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                                        Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter password"
                                            className="
                                                      h-12
                                                      w-full
                                                      rounded-xl
                                                      border
                                                      border-white/10
                                                      bg-white/5
                                                      px-4
                                                      pr-12
                                                      text-white
                                                      placeholder:text-zinc-500
                                                      outline-none
                                                      transition
                                                      focus:border-violet-500
                                                      focus:bg-white/10
                                                    "
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="
                                                      absolute
                                                      right-4
                                                      top-1/2
                                                      -translate-y-1/2
                                                      text-zinc-400
                                                      hover:text-white
                                                    "
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                                        Confirm Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm password"
                                            className="
                                                      h-12
                                                      w-full
                                                      rounded-xl
                                                      border
                                                      border-white/10
                                                      bg-white/5
                                                      px-4
                                                      pr-12
                                                      text-white
                                                      placeholder:text-zinc-500
                                                      outline-none
                                                      transition
                                                      focus:border-violet-500
                                                      focus:bg-white/10
                                                    "
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            className="
                                                      absolute
                                                      right-4
                                                      top-1/2
                                                      -translate-y-1/2
                                                      text-zinc-400
                                                      hover:text-white
                                                    "
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    isDisabled={loading}
                                    className="
                                              h-12
                                              w-full
                                              bg-linear-to-r
                                              from-violet-600
                                              via-purple-600
                                              to-fuchsia-600
                                              font-semibold
                                              text-white
                                            "
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        "Create Account"
                                    )}
                                </Button>
                            </form>

                            <div className="my-8 flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-xs text-zinc-500">
                                    OR
                                </span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <Button
                                className="mt-8 h-12 w-full bg-white font-semibold text-black"
                                onPress={handleGoogleLogin}
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <FcGoogle size={20} />
                                    <span>Continue with Google</span>
                                </span>
                            </Button>
                            <p className="mt-6 text-center text-zinc-400">
                                Already have an account?{" "}
                                <Link
                                    href="/signin"
                                    className="font-medium text-violet-400 hover:text-violet-300"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function Stat({ value, label }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/2 p-5">
            <div className="text-3xl font-bold text-white">
                {value}
            </div>

            <div className="mt-1 text-sm text-zinc-400">
                {label}
            </div>
        </div>
    );
}