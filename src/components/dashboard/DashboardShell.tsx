"use client";

import type React from "react";
import { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Megaphone,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient, useSession } from "@/lib/auth-client";
import NotificationBell from "./NotificationBell";

const publicLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse Jobs", href: "/jobs", icon: Briefcase },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
];

const roleLinks = {
  seeker: [
    { label: "Overview", href: "/dashboard/seeker", icon: LayoutDashboard },
    { label: "Browse & Apply", href: "/dashboard/seeker/jobs", icon: Briefcase },
    { label: "Saved Jobs", href: "/dashboard/seeker/saved", icon: Heart },
    { label: "Applications", href: "/dashboard/seeker/applications", icon: FileText },
    { label: "Messages", href: "/dashboard/seeker/messages", icon: MessageSquare },
    { label: "Interviews", href: "/dashboard/seeker/interviews", icon: Calendar },
    { label: "Analytics", href: "/dashboard/seeker/analytics", icon: BarChart3 },
    { label: "Billing", href: "/dashboard/seeker/billing", icon: CreditCard },
    { label: "Settings", href: "/dashboard/seeker/settings", icon: Settings },
  ],
  recruiter: [
    { label: "Overview", href: "/dashboard/recruiter", icon: LayoutDashboard },
    { label: "My Company", href: "/dashboard/recruiter/company", icon: Building2 },
    { label: "Manage Jobs", href: "/dashboard/recruiter/jobs", icon: Briefcase },
    { label: "Candidates", href: "/dashboard/recruiter/candidates", icon: Users },
    { label: "Messages", href: "/dashboard/recruiter/messages", icon: MessageSquare },
    { label: "Analytics", href: "/dashboard/recruiter/analytics", icon: BarChart3 },
    { label: "Billing", href: "/dashboard/recruiter/billing", icon: CreditCard },
    { label: "Settings", href: "/dashboard/recruiter/settings", icon: Settings },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Companies", href: "/dashboard/admin/companies", icon: Building2 },
    { label: "Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
    { label: "Moderation", href: "/dashboard/admin/moderation", icon: AlertTriangle },
    { label: "Announcements", href: "/dashboard/admin/announcements", icon: Megaphone },
    { label: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
    { label: "Audit Logs", href: "/dashboard/admin/audit", icon: ShieldCheck },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ],
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const userRole = (((user as any)?.role || "seeker") as string).toLowerCase() as "seeker" | "recruiter" | "admin";
  const role = userRole;
  const isSuspended = (user as any)?.status === "suspended";

  // Determine if user has permission to access the current dashboard route
  const isRouteAuthorized = (() => {
    if (!session) return false;
    if (pathname.startsWith("/dashboard/admin")) return userRole === "admin";
    if (pathname.startsWith("/dashboard/recruiter")) return userRole === "recruiter";
    if (pathname.startsWith("/dashboard/seeker")) return userRole === "seeker";
    if (pathname.startsWith("/dashboard/jobs")) return userRole === "recruiter" || userRole === "admin";
    return true;
  })();

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        toast.error("Please sign in to access the dashboard");
        router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      } else if (!isRouteAuthorized && !isSuspended) {
        toast.warn(`Access restricted. Redirecting to your ${userRole} workspace.`);
        router.replace(`/dashboard/${userRole}`);
      }
    }
  }, [session, isPending, pathname, router, isRouteAuthorized, userRole, isSuspended]);

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-400">Loading your space...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (isSuspended) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <ShieldCheck size={28} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Account Suspended</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Your HireLoop account has been suspended by an administrator. If you believe this is in error, please contact support.
          </p>
          <button
            onClick={handleSignOut}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!isRouteAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Redirecting to your authorized space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white lg:grid lg:grid-cols-[300px_1fr]">
      <aside className="border-b border-white/10 bg-zinc-950 px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/logo.png" alt="HireLoop" width={128} height={48} className="h-auto w-auto" />
          </Link>
          <div className="flex items-center gap-2.5 lg:hidden">
            <NotificationBell />
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs capitalize text-indigo-300">
              {role}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "H"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.name || "HireLoop User"}</p>
              <p className="truncate text-xs text-zinc-500">{user?.email || "user@hireloop.dev"}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-zinc-300">
            <ShieldCheck size={14} /> {role}
          </div>
        </div>

        <nav className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          <NavGroup title="Dashboard" links={roleLinks[role]} pathname={pathname} />
          <NavGroup title="Public" links={publicLinks} pathname={pathname} />
        </nav>

        <button
          onClick={handleSignOut}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500 hover:text-white"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      <main className="min-w-0 px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="hidden lg:flex items-center justify-end pb-4 mb-4 border-b border-white/5">
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function NavGroup({
  title,
  links,
  pathname,
}: {
  title: string;
  links: { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">{title}</p>
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={17} /> {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}





