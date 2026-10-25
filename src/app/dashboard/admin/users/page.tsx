"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Ban,
  Search,
  ShieldCheck,
  CheckCircle,
  Users,
  ShieldAlert,
  History,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  adminRole: "super_admin" | "support_moderator" | "compliance_officer" | "billing_admin" | string;
  status: "active" | "suspended";
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"platform" | "admins">("platform");
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Role Assignment Modal state
  const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null);
  const [targetAdminRole, setTargetAdminRole] = useState<string>("support_moderator");
  const [assignmentReason, setAssignmentReason] = useState("");
  const [submittingRole, setSubmittingRole] = useState(false);

  // History Modal state
  const [historyUser, setHistoryUser] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch("/api/users");
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load users list");
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/admins");
      setAdmins(data);
    } catch (err: any) {
      console.error(err);
      // If 403, current admin may not be super_admin
      if (err.status !== 403) {
        toast.error(err.message || "Failed to load administrative accounts");
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchAdmins()]);
    setLoading(false);
  }, [fetchUsers, fetchAdmins]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleSuspend = async (email: string, currentStatus: string) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      await apiFetch(`/api/users/${email}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      toast.success(`User standing updated to ${nextStatus}`);
      await Promise.all([fetchUsers(), fetchAdmins()]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update user standing");
    }
  };

  const openRoleAssignmentModal = (user: any) => {
    setSelectedUserForRole(user);
    setTargetAdminRole(user.adminRole || "support_moderator");
    setAssignmentReason("");
  };

  const handleSaveAdminRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole) return;
    if (!assignmentReason.trim()) {
      toast.warn("Please enter a documented reason for this role change");
      return;
    }

    setSubmittingRole(true);
    try {
      await apiFetch(`/api/admin/admins/${selectedUserForRole.email}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          adminRole: targetAdminRole,
          reason: assignmentReason.trim(),
        }),
      });

      toast.success(`Role for ${selectedUserForRole.email} updated to ${targetAdminRole}`);
      setSelectedUserForRole(null);
      await Promise.all([fetchUsers(), fetchAdmins()]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to assign administrative role");
    } finally {
      setSubmittingRole(false);
    }
  };

  const openHistoryModal = async (email: string) => {
    setHistoryUser(email);
    setLoadingHistory(true);
    try {
      const logs = await apiFetch(`/api/admin/admins/${email}/history`);
      setHistoryLogs(logs);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load role history");
      setHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter ordinary platform users (seekers & recruiters)
  const platformUsers = users.filter((u) => (u.role || "").toLowerCase() !== "admin");
  const filteredPlatformUsers = platformUsers.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query) ||
      (u.role || "").toLowerCase().includes(query)
    );
  });

  // Filter administrative staff
  const filteredAdmins = admins.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query) ||
      (u.adminRole || "").toLowerCase().includes(query)
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
      <Header
        title="Access & Account Governance"
        subtitle="Manage user accounts, delegate specialized administrative roles, and inspect role assignment compliance."
      />

      {/* Tabs */}
      <div className="mt-8 flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("platform")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "platform"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users size={16} /> Platform Accounts
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
            {platformUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "admins"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ShieldAlert size={16} /> Administrative Staff & Delegation
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">
            {admins.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
        <label className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black px-3 py-2 text-zinc-500">
          <Search size={17} />
          <input
            className="w-full bg-transparent text-sm text-white outline-none"
            placeholder={
              activeTab === "platform"
                ? "Search platform users by name, email, or role..."
                : "Search administrators by name, email, or role..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      {/* TAB 1: Platform Accounts */}
      {activeTab === "platform" && (
        <Table>
          <thead className="border-b border-white/10 text-zinc-500">
            <tr>
              <th className="px-5 py-4 font-medium">Account</th>
              <th className="px-5 py-4 font-medium">Role</th>
              <th className="px-5 py-4 font-medium">Plan</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredPlatformUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-500">
                  No platform users found matching your search.
                </td>
              </tr>
            ) : (
              filteredPlatformUsers.map((u) => {
                const isSuspended = u.status === "suspended";

                return (
                  <tr key={u.email}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{u.name || "Unnamed User"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Role role={u.role || "seeker"} />
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-400">
                      {u.plan || "Free"}
                    </td>
                    <td className="px-5 py-4">
                      <Status status={isSuspended ? "Suspended" : "Active"} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openRoleAssignmentModal(u)}
                          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 transition hover:bg-indigo-500 hover:text-white cursor-pointer"
                          title="Promote to Administrative Role"
                        >
                          <ShieldCheck size={14} /> Delegate Admin Role
                        </button>
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
              })
            )}
          </tbody>
        </Table>
      )}

      {/* TAB 2: Administrative Staff & Roles */}
      {activeTab === "admins" && (
        <Table>
          <thead className="border-b border-white/10 text-zinc-500">
            <tr>
              <th className="px-5 py-4 font-medium">Administrator</th>
              <th className="px-5 py-4 font-medium">Administrative Role</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Permissions Scope</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-500">
                  No administrative staff accounts found.
                </td>
              </tr>
            ) : (
              filteredAdmins.map((u) => {
                const isSuspended = u.status === "suspended";
                const adminRole = u.adminRole || "super_admin";

                return (
                  <tr key={u.email}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{u.name || "Admin Staff"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <AdminRoleBadge role={adminRole} />
                    </td>
                    <td className="px-5 py-4">
                      <Status status={isSuspended ? "Suspended" : "Active"} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                        {u.permissions?.length || 0} permissions
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openRoleAssignmentModal(u)}
                          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-200 transition hover:bg-white/10 cursor-pointer"
                          title="Change or Revoke Role"
                        >
                          <ShieldAlert size={14} /> Reassign Role
                        </button>

                        <button
                          onClick={() => openHistoryModal(u.email)}
                          className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
                          title="View Role Audit History"
                        >
                          <History size={14} />
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(u.email, u.status)}
                          className={`rounded-lg border p-2 cursor-pointer ${
                            isSuspended
                              ? "border-green-500/20 text-green-300 hover:bg-green-500 hover:text-white"
                              : "border-red-500/20 text-red-300 hover:bg-red-500 hover:text-white"
                          }`}
                          title={isSuspended ? "Reactivate Admin" : "Suspend Admin"}
                        >
                          {isSuspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      )}

      {/* Role Assignment Modal */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldAlert size={20} />
                <h3 className="text-lg font-semibold text-white">Delegate Administrative Role</h3>
              </div>
              <button
                onClick={() => setSelectedUserForRole(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdminRole} className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-zinc-400">Target Account</p>
                <p className="font-medium text-white">{selectedUserForRole.name || "User"}</p>
                <p className="text-xs text-zinc-500">{selectedUserForRole.email}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Select Administrative Role
                </label>
                <select
                  value={targetAdminRole}
                  onChange={(e) => setTargetAdminRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="support_moderator">Support Moderator (Routine safety, reports, job moderation)</option>
                  <option value="compliance_officer">Compliance Officer (Audit reporting, exports, company reviews)</option>
                  <option value="billing_admin">Billing Administrator (Subscriptions, payments, billing audit)</option>
                  <option value="super_admin">Super Administrator (Full platform governance & role delegation)</option>
                  <option value="revoked">Revoke Privileges (Demote to Seeker)</option>
                </select>
              </div>

              {/* Role Scope Description */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-zinc-400">
                {targetAdminRole === "support_moderator" && (
                  <p>
                    <strong className="text-zinc-200">Support Moderator:</strong> Can view and process violation reports, close fraudulent jobs, and warn users. Cannot export audit logs, alter subscriptions, or manage admin accounts.
                  </p>
                )}
                {targetAdminRole === "compliance_officer" && (
                  <p>
                    <strong className="text-zinc-200">Compliance Officer:</strong> Can inspect audit trails, stream CSV/JSON compliance exports, and review company verification history. Cannot modify user roles or alter content.
                  </p>
                )}
                {targetAdminRole === "billing_admin" && (
                  <p>
                    <strong className="text-zinc-200">Billing Administrator:</strong> Can review payments, manage subscription plan entitlements, and investigate billing issues. Cannot view private candidate messages or alter user roles.
                  </p>
                )}
                {targetAdminRole === "super_admin" && (
                  <p className="text-amber-300/90 flex items-center gap-1.5">
                    <Lock size={14} /> Full super-admin governance. Can assign and revoke admin roles and execute all sensitive platform operations.
                  </p>
                )}
                {targetAdminRole === "revoked" && (
                  <p className="text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Revokes all administrative permissions and demotes this user to standard platform member.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Documented Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="Document reason for role assignment or change (required for audit logging)..."
                  className="w-full rounded-xl border border-white/10 bg-black p-3 text-xs text-white outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingRole ? "Committing..." : "Confirm Role Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <History size={20} />
                <h3 className="text-lg font-semibold text-white">Role Delegation Audit History</h3>
              </div>
              <button
                onClick={() => setHistoryUser(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-zinc-400">
              Audit log records for role assignments on <span className="text-white font-mono">{historyUser}</span>:
            </p>

            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-white/10 pr-2">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-zinc-500">Loading history logs...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No role change audit events recorded for this account.
                </div>
              ) : (
                historyLogs.map((log) => (
                  <div key={log._id || log.id} className="py-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">{log.action}</span>
                      <span className="text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-zinc-400">
                      Actor: <span className="text-zinc-300">{log.actor?.email || "System"}</span>
                    </p>
                    {log.reason && (
                      <p className="mt-1 text-zinc-400">
                        Reason: <span className="text-zinc-300 italic">&quot;{log.reason}&quot;</span>
                      </p>
                    )}
                    <div className="mt-2 flex gap-4 text-[11px] text-zinc-500">
                      <div>Before: {JSON.stringify(log.before?.adminRole || log.before?.role || "none")}</div>
                      <div>After: {JSON.stringify(log.after?.adminRole || log.after?.role || "none")}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-indigo-400">Administration & Least Privilege</p>
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
  return <span className={`rounded-full border px-3 py-1 text-xs capitalize ${tone}`}>{role}</span>;
}

function AdminRoleBadge({ role }: { role: string }) {
  const meta: Record<string, { label: string; tone: string }> = {
    super_admin: {
      label: "Super Administrator",
      tone: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    },
    support_moderator: {
      label: "Support Moderator",
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    },
    compliance_officer: {
      label: "Compliance Officer",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    },
    billing_admin: {
      label: "Billing Administrator",
      tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    },
  };

  const current = meta[role] || {
    label: role,
    tone: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${current.tone}`}>
      <ShieldCheck size={13} /> {current.label}
    </span>
  );
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
