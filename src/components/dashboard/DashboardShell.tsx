"use client";

import type React from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { authClient, useSession } from "@/lib/auth-client";

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
    { label: "Billing", href: "/dashboard/seeker/billing", icon: CreditCard },
    { label: "Settings", href: "/dashboard/seeker/settings", icon: Settings },
  ],
  recruiter: [
    { label: "Overview", href: "/dashboard/recruiter", icon: LayoutDashboard },
    { label: "My Company", href: "/dashboard/recruiter/company", icon: Building2 },
    { label: "Manage Jobs", href: "/dashboard/recruiter/jobs", icon: Briefcase },
    { label: "Billing", href: "/dashboard/recruiter/billing", icon: CreditCard },
    { label: "Settings", href: "/dashboard/recruiter/settings", icon: Settings },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Companies", href: "/dashboard/admin/companies", icon: Building2 },
    { label: "Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
    { label: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
    { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
  ],
};

function getRole(pathname: string) {
  if (pathname.includes("/dashboard/recruiter")) return "recruiter";
  if (pathname.includes("/dashboard/admin")) return "admin";
  return "seeker";
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = getRole(pathname);
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black text-white lg:grid lg:grid-cols-[300px_1fr]">
      <aside className="border-b border-white/10 bg-zinc-950 px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/logo.png" alt="HireLoop" width={128} height={48} className="h-auto w-auto" />
          </Link>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs capitalize text-indigo-300 lg:hidden">
            {role}
          </span>
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

      <main className="min-w-0 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">{children}</div>
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
          const active = pathname === link.href;

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




