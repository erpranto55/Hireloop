import type React from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = {
  title: "Dashboard | HireLoop",
  description: "Manage jobs, applications, companies, and subscriptions in HireLoop.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}


