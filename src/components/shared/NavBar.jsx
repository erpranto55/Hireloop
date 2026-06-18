"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Link, Button } from "@heroui/react";
import { Menu, X, LogOut } from "lucide-react";
import { RxAvatar } from "react-icons/rx";

import { toast } from "react-toastify";

import {
    useSession,
    authClient,
} from "@/lib/auth-client";

const NavBar = () => {
    const router = useRouter();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { data: session, isPending } =
        useSession();

    const user = session?.user;

    const handleSignOut = async () => {
        try {
            await authClient.signOut();

            toast.success(
                "Signed out successfully"
            );

            router.push("/");
            router.refresh();
        } catch (error) {
            toast.error(
                "Failed to sign out"
            );
        }
    };

    const Avatar = () => (
        <Link
            href="/profile"
            className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-linear-to-r
                from-violet-500
                via-purple-500
                to-fuchsia-500
                p-0.5
                transition-all
                duration-300
                hover:scale-110
                hover:shadow-lg
                hover:shadow-violet-500/40
            "
        >
            {user?.image ? (
                <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={44}
                    height={44}
                    className="
                        h-full
                        w-full
                        rounded-full
                        object-cover
                        bg-black
                    "
                />
            ) : (
                <div
                    className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        rounded-full
                        bg-black
                        text-white
                        font-bold
                    "
                >
                    {user?.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                </div>
            )}
        </Link>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-6">
            <div className="container w-full">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.08)]">

                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center"
                    >
                        <Image
                            src="/images/logo.png"
                            alt="HireLoop Logo"
                            width={120}
                            height={120}
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <ul className="hidden items-center gap-10 md:flex">
                        <li>
                            <Link
                                href="/jobs"
                                className="text-sm text-white/70 transition hover:text-white"
                            >
                                Browse Jobs
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/company"
                                className="text-sm text-white/70 transition hover:text-white"
                            >
                                Company
                            </Link>
                        </li>

                        <li>
                            <Link
                                href="/pricing"
                                className="text-sm text-white/70 transition hover:text-white"
                            >
                                Pricing
                            </Link>
                        </li>
                    </ul>

                    {/* Desktop Actions */}
                    <div className="hidden items-center gap-4 md:flex">
                        {isPending ? (
                            <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                        ) : user ? (
                            <div className="flex items-center gap-4">

                                <RxAvatar />

                                <Button
                                    onPress={
                                        handleSignOut
                                    }
                                    startContent={
                                        <LogOut size={16} />
                                    }
                                    className="
                                        border
                                        border-red-500/20
                                        bg-red-500/10
                                        text-red-400
                                        transition-all
                                        duration-300
                                        hover:scale-105
                                        hover:bg-red-500
                                        hover:text-white
                                    "
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/signin"
                                    className="text-sm text-indigo-400 hover:text-indigo-300"
                                >
                                    Sign In
                                </Link>

                                <Link
                                    href="/signup"
                                >
                                    <Button
                                        radius="lg"
                                        className="
                                        bg-linear-to-r
                                        from-violet-600
                                        via-purple-600
                                        to-fuchsia-600
                                        px-6
                                        font-semibold
                                        text-white
                                        shadow-lg
                                        shadow-violet-500/25
                                        transition-all
                                        duration-300
                                        hover:scale-105
                                        hover:shadow-violet-500/40
                                    "
                                    >
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() =>
                            setIsMenuOpen(
                                !isMenuOpen
                            )
                        }
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
                                    href="/jobs"
                                    className="py-3 text-white/80"
                                >
                                    Browse Jobs
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="/company"
                                    className="py-3 text-white/80"
                                >
                                    Company
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="/pricing"
                                    className="py-3 text-white/80"
                                >
                                    Pricing
                                </Link>
                            </li>

                            <div className="mt-4 flex flex-col gap-3">
                                {user ? (
                                    <>
                                        <Link
                                            href="/profile"
                                            className="
                                                flex
                                                items-center
                                                gap-3
                                                rounded-xl
                                                border
                                                border-white/10
                                                bg-white/5
                                                p-3
                                                transition
                                                hover:bg-white/10
                                            "
                                        >
                                            <RxAvatar />

                                            <div>
                                                <p className="font-medium text-white">
                                                    {user.name}
                                                </p>

                                                <p className="text-xs text-zinc-400">
                                                    View Profile
                                                </p>
                                            </div>
                                        </Link>

                                        <Button
                                            onPress={
                                                handleSignOut
                                            }
                                            startContent={
                                                <LogOut size={16} />
                                            }
                                            className="
                                                border
                                                border-red-500/20
                                                bg-red-500/10
                                                text-red-400
                                                transition-all
                                                hover:bg-red-500
                                                hover:text-white
                                            "
                                        >
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            as={Link}
                                            href="/signin"
                                            variant="light"
                                            className="text-indigo-400"
                                        >
                                            Sign In
                                        </Button>

                                        <Link
                                            href="/signup"
                                        >
                                            <Button
                                                radius="lg"
                                                className="
                                        bg-linear-to-r
                                        from-violet-600
                                        via-purple-600
                                        to-fuchsia-600
                                        px-6
                                        font-semibold
                                        text-white
                                        shadow-lg
                                        shadow-violet-500/25
                                        transition-all
                                        duration-300
                                        hover:scale-105
                                        hover:shadow-violet-500/40
                                    "
                                            >
                                                Get Started
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;

