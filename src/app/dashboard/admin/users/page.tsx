"use client";

import React, { useState, useEffect } from "react";
import { Ban, Search, ShieldCheck, UserCheck, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuspend = async (email: string, currentStatus: string) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch(`http://localhost:5001/api/users/${email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`User standing updated to ${nextStatus}`);
        fetchUsers();
      } else {
        toast.error("Failed to update user standing");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const handleMakeAdmin = async (email: string) => {
    if (!confirm("Are you sure you want to promote this user to Administrator?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/users/${email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      });

      if (res.ok) {
        toast.success("User promoted to Admin");
        fetchUsers();
      } else {
        toast.error("Failed to promote user");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query) ||
      (u.role || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-black text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Users" subtitle="Review accounts, permissions, and account standing across HireLoop." />
      
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
        <label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 text-zinc-500">
          <Search size={17} />
          <input
            className="w-full bg-transparent text-sm text-white outline-none"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      <Table>
        <thead className="border-b border-white/10 text-zinc-500">
          <tr>
            <th className="px-5 py-4 font-medium">User</th>
            <th className="px-5 py-4 font-medium">Role</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {filteredUsers.map((u) => {
            const isSuspended = u.status === "suspended";
            const isAdmin = u.role === "admin";
            
            return (
              <tr key={u.email}>
                <td className="px-5 py-4">
                  <p className="font-medium text-white">{u.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className="px-5 py-4">
                  <Role role={u.role || "seeker"} />
                </td>
                <td className="px-5 py-4">
                  <Status status={isSuspended ? "Suspended" : "Active"} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    {!isAdmin && (
                      <button
                        onClick={() => handleMakeAdmin(u.email)}
                        className="rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/10 cursor-pointer"
                        title="Promote to Admin"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleSuspend(u.email, u.status)}
                      className={`rounded-lg border p-2 cursor-pointer ${
                        isSuspended
                          ? "border-green-500/20 text-green-300 hover:bg-green-500 hover:text-white"
                          : "border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white"
                      }`}
                      title={isSuspended ? "Reactivate User" : "Suspend User"}
                    >
                      {isSuspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Administration</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </div>
  );
}

function Role({ role }: { role: string }) {
  const tones: Record<string, string> = {
    seeker: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    recruiter: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    admin: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  };
  const tone = tones[role.toLowerCase()] || tones.seeker;
  return <span className="rounded-full border px-3 py-1 text-xs capitalize">{role}</span>;
}

function Status({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        status === "Active"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {status}
    </span>
  );
}
