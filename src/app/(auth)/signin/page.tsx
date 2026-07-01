"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@heroui/react/button";

import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { toast } from "react-toastify";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function SigninPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSignin = async (e) => {
        e.preventDefault();

        const { email, password } = formData;

        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);

            const { error } =
                await authClient.signIn.email({
                    email,
                    password,
                });

            if (error) {
                toast.error(
                    error.message ||
                    "Invalid email or password"
                );
                return;
            }

            toast.success("Login successful");

            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (error) {
            console.error(error);

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

            <div className="relative z-10 mt-20 flex min-h-screen items-center justify-center px-6 py-12">
                <div className="grid w-full max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-white/3 backdrop-blur-xl lg:grid-cols-2">

                    {/* Left Side */}
                    <div className="hidden flex-col justify-between border-r border-white/10 p-12 lg:flex">
                        <div>
                            {/* Logo */}
                            <Link
                                href="/"
                                className="flex items-center"
                            >
                                <Image
                                    src="/images/logo.png"
                                    alt="HireLoop Logo"
                                    width={120}
                                    height={120} />
                            </Link>

                            <div className="my-5">
                                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-violet-400">
                                    Welcome Back
                                </span>

                                <h2 className="mt-6 text-5xl font-bold leading-tight text-white">
                                    Continue Your
                                    <span className="block bg-linear-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                                        Career Journey
                                    </span>
                                </h2>

                                <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">
                                    Access your personalized
                                    dashboard, AI-powered job
                                    matches, and career insights.
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="grid grid-cols-2 gap-4">
                                <Stat
                                    value="50K+"
                                    label="Active Jobs"
                                />
                                <Stat
                                    value="12K+"
                                    label="Companies"
                                />
                                <Stat
                                    value="2M+"
                                    label="Candidates"
                                />
                                <Stat
                                    value="97%"
                                    label="Success Rate"
                                />
                            </div>

                            <div className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-4">
                                <p className="text-sm text-zinc-400">
                                    Trusted by professionals
                                    from
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
                                Welcome Back
                            </h2>

                            <p className="mt-3 text-center text-zinc-400">
                                Sign in to your account
                            </p>

                            <form
                                onSubmit={handleSignin}
                                className="mt-8 space-y-5"
                            >
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
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={
                                                formData.password
                                            }
                                            onChange={
                                                handleChange
                                            }
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
                                                setShowPassword(
                                                    !showPassword
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
                                            {showPassword ? (
                                                <EyeOff
                                                    size={18}
                                                />
                                            ) : (
                                                <Eye
                                                    size={18}
                                                />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-violet-400 hover:text-violet-300"
                                    >
                                        Forgot Password?
                                    </Link>
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
                                            <span>
                                                Signing In...
                                            </span>
                                        </div>
                                    ) : (
                                        "Sign In"
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
                                className="h-12 w-full bg-white font-semibold text-black"
                                onPress={handleGoogleLogin}
                            >
                                <span className="flex items-center justify-center gap-3">
                                    <FcGoogle size={20} />
                                    <span>
                                        Continue with Google
                                    </span>
                                </span>
                            </Button>

                            <p className="mt-6 text-center text-zinc-400">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/signup"
                                    className="font-medium text-violet-400 hover:text-violet-300"
                                >
                                    Create Account
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