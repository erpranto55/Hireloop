"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  History,
  MoreVertical,
  KeyRound,
  UserMinus,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  Search,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";

interface Member {
  _id: string;
  userEmail: string;
  userName: string;
  role: "company_owner" | "hiring_manager" | "interviewer";
  status: string;
  createdAt: string;
}

interface Invitation {
  _id: string;
  inviteeEmail: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface ActivityLog {
  _id: string;
  action: string;
  actorEmail: string;
  actorName?: string;
  targetIdentifier?: string;
  timestamp: string;
}

interface Job {
  _id: string;
  title: string;
  status: string;
  category: string;
  assignedMemberEmails?: string[];
  applicantsCount?: number;
}

const ROLE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  company_owner: {
    label: "Company Owner",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  hiring_manager: {
    label: "Hiring Manager",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
  },
  interviewer: {
    label: "Interviewer",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
};

export default function RecruiterTeamPage() {
  const { data: session } = useSession();
  const user = session?.user;

  // Workspace list and selection
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  // Selected workspace team state
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [myRole, setMyRole] = useState<string>("interviewer");
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"members" | "invitations" | "vacancies" | "activity">("members");

  // Vacancies state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("hiring_manager");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Role change modal
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState<string>("hiring_manager");
  const [submittingRoleChange, setSubmittingRoleChange] = useState(false);

  // Remove member modal
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [submittingRemove, setSubmittingRemove] = useState(false);

  // Transfer ownership modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Vacancy assignment modal
  const [assigningJob, setAssigningJob] = useState<Job | null>(null);
  const [selectedMemberEmails, setSelectedMemberEmails] = useState<string[]>([]);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // 1. Fetch available workspaces for current user
  const fetchWorkspaces = async () => {
    try {
      setLoadingWorkspaces(true);
      const res = await apiFetch("/api/companies/my-workspaces");
      if (res.ok) {
        const data = await res.json();
        const list = data.workspaces || [];
        setWorkspaces(list);
        if (list.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(list[0]._id);
        }
      }
    } catch (err) {
      console.error("[TeamWorkspace] Failed to fetch workspaces:", err);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchWorkspaces();
    }
  }, [user]);

  // 2. Fetch team data when selected workspace changes
  const fetchTeamData = async (companyId: string) => {
    try {
      setLoadingTeam(true);
      const res = await apiFetch(`/api/companies/${companyId}/team`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
        setMembers(data.members || []);
        setInvitations(data.pendingInvitations || []);
        setMyRole(data.myRole || "interviewer");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to load team data.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error loading team.");
    } finally {
      setLoadingTeam(false);
    }
  };

  // 3. Fetch vacancies
  const fetchVacancies = async (companyId: string) => {
    try {
      setLoadingJobs(true);
      const res = await apiFetch(`/api/jobs?companyId=${companyId}&status=all`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data || []);
      }
    } catch (err) {
      console.error("[TeamWorkspace] Failed to fetch jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // 4. Fetch activity logs
  const fetchActivity = async (companyId: string) => {
    try {
      setLoadingActivity(true);
      const res = await apiFetch(`/api/companies/${companyId}/team/activity?limit=30`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.activity || []);
      }
    } catch (err) {
      console.error("[TeamWorkspace] Failed to fetch activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (selectedCompanyId) {
      fetchTeamData(selectedCompanyId);
      if (activeTab === "vacancies") fetchVacancies(selectedCompanyId);
      if (activeTab === "activity") fetchActivity(selectedCompanyId);
    }
  }, [selectedCompanyId, activeTab]);

  // Invite handler
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !inviteEmail) return;

    try {
      setSubmittingInvite(true);
      const res = await apiFetch(`/api/companies/${selectedCompanyId}/team/invitations`, {
        method: "POST",
        body: JSON.stringify({
          inviteeEmail: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (res.ok) {
        toast.success(`Invitation queued and sent to ${inviteEmail}!`);
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInviteRole("hiring_manager");
        fetchTeamData(selectedCompanyId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to issue invitation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Revoke invitation
  const handleRevokeInvite = async (invitationId: string) => {
    if (!selectedCompanyId) return;
    if (!confirm("Revoke this pending invitation? The recipient will no longer be able to accept it.")) return;

    try {
      const res = await apiFetch(`/api/companies/${selectedCompanyId}/team/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Invitation revoked.");
        fetchTeamData(selectedCompanyId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to revoke invitation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error.");
    }
  };

  // Change role handler
  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !editingMember) return;

    try {
      setSubmittingRoleChange(true);
      const res = await apiFetch(
        `/api/companies/${selectedCompanyId}/team/members/${encodeURIComponent(editingMember.userEmail)}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (res.ok) {
        toast.success(`Role updated to ${ROLE_BADGES[newRole]?.label || newRole}`);
        setEditingMember(null);
        fetchTeamData(selectedCompanyId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to update member role.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmittingRoleChange(false);
    }
  };

  // Remove member handler
  const handleRemoveMember = async () => {
    if (!selectedCompanyId || !removingMember) return;

    try {
      setSubmittingRemove(true);
      const res = await apiFetch(
        `/api/companies/${selectedCompanyId}/team/members/${encodeURIComponent(removingMember.userEmail)}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        toast.success(`${removingMember.userName || removingMember.userEmail} has been removed from the workspace.`);
        setRemovingMember(null);
        fetchTeamData(selectedCompanyId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to remove member.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmittingRemove(false);
    }
  };

  // Transfer ownership handler
  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !newOwnerEmail) return;

    if (!confirm(`Are you certain you want to transfer primary ownership of ${company?.name} to ${newOwnerEmail}? This will make them the principal owner of this company workspace.`)) {
      return;
    }

    try {
      setSubmittingTransfer(true);
      const res = await apiFetch(`/api/companies/${selectedCompanyId}/team/transfer-ownership`, {
        method: "POST",
        body: JSON.stringify({ newOwnerEmail }),
      });

      if (res.ok) {
        toast.success(`Ownership transferred to ${newOwnerEmail}!`);
        setIsTransferModalOpen(false);
        setNewOwnerEmail("");
        fetchTeamData(selectedCompanyId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to transfer ownership.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Save vacancy assignments
  const handleSaveVacancyAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningJob) return;

    try {
      setSubmittingAssignment(true);
      const res = await apiFetch(`/api/jobs/${assigningJob._id}/members`, {
        method: "PATCH",
        body: JSON.stringify({ memberEmails: selectedMemberEmails }),
      });

      if (res.ok) {
        toast.success("Vacancy member assignments updated!");
        setAssigningJob(null);
        if (selectedCompanyId) fetchVacancies(selectedCompanyId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to assign members.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const isOwner = myRole === "company_owner";
  const isHiringManagerOrOwner = isOwner || myRole === "hiring_manager";

  if (loadingWorkspaces) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Loading company workspaces...</p>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 text-indigo-400">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">No Company Workspace Found</h1>
        <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
          You are currently not associated with a registered company workspace. You can register your company profile to start collaborating or ask your team owner to send an invitation.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            href="/dashboard/recruiter/company"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20"
          >
            Register Company Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-white/10 p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
              {company?.logo ? (
                <Image src={company.logo} alt={company.name || "Company"} width={64} height={64} className="object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-zinc-400" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                {workspaces.length > 1 ? (
                  <div className="relative inline-block">
                    <select
                      value={selectedCompanyId || ""}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="appearance-none bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 rounded-xl px-4 py-1.5 pr-8 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                    >
                      {workspaces.map((w) => (
                        <option key={w._id} value={w._id} className="bg-zinc-900 text-white">
                          {w.name} ({ROLE_BADGES[w.myRole]?.label || w.myRole})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-white tracking-tight">{company?.name}</h1>
                )}

                {/* Verification Badge */}
                {company?.status === "approved" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Verified Company
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Pending Approval
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span className="inline-flex items-center">
                  Your Role:
                  <span className={`ml-1.5 px-2 py-0.5 rounded-md font-semibold border ${ROLE_BADGES[myRole]?.bg} ${ROLE_BADGES[myRole]?.text} ${ROLE_BADGES[myRole]?.border}`}>
                    {ROLE_BADGES[myRole]?.label || myRole}
                  </span>
                </span>
                <span>•</span>
                <span>{members.length} Active Member{members.length !== 1 ? "s" : ""}</span>
                {invitations.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-medium">{invitations.length} Pending Invite{invitations.length !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {isHiringManagerOrOwner && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                title="Transfer primary workspace ownership"
                className="inline-flex items-center px-3 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-medium transition"
              >
                <KeyRound className="w-4 h-4 mr-1.5 text-amber-400" />
                Transfer Ownership
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 space-x-8">
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-4 text-sm font-semibold transition relative ${
            activeTab === "members" ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Team Members
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/5 text-zinc-300">
              {members.length}
            </span>
          </span>
          {activeTab === "members" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("invitations")}
          className={`pb-4 text-sm font-semibold transition relative ${
            activeTab === "invitations" ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Pending Invitations
            {invitations.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {invitations.length}
              </span>
            )}
          </span>
          {activeTab === "invitations" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("vacancies")}
          className={`pb-4 text-sm font-semibold transition relative ${
            activeTab === "vacancies" ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="flex items-center">
            <Briefcase className="w-4 h-4 mr-2" />
            Vacancy Access
          </span>
          {activeTab === "vacancies" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`pb-4 text-sm font-semibold transition relative ${
            activeTab === "activity" ? "text-indigo-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="flex items-center">
            <History className="w-4 h-4 mr-2" />
            Workspace Activity
          </span>
          {activeTab === "activity" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Active Team Members */}
      {activeTab === "members" && (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Active Workspace Members</h3>
              <p className="text-xs text-zinc-400">
                Authorized team members collaborating on vacancies, applications, and interviews.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Member</th>
                  <th className="py-3.5 px-6 font-semibold">Workspace Role</th>
                  <th className="py-3.5 px-6 font-semibold">Joined Date</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((member) => {
                  const badge = ROLE_BADGES[member.role] || {
                    label: member.role,
                    bg: "bg-zinc-800",
                    text: "text-zinc-300",
                    border: "border-white/10",
                  };
                  const isCurrent = user?.email?.toLowerCase() === member.userEmail.toLowerCase();

                  return (
                    <tr key={member._id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {(member.userName || member.userEmail).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center space-x-2">
                              <span>{member.userName || "Team Member"}</span>
                              {isCurrent && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 font-mono">{member.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-zinc-400">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isOwner && (
                            <button
                              onClick={() => {
                                setEditingMember(member);
                                setNewRole(member.role);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white text-xs font-medium transition"
                            >
                              Change Role
                            </button>
                          )}

                          {(isOwner || isCurrent) && (
                            <button
                              onClick={() => setRemovingMember(member)}
                              title={isCurrent ? "Leave Workspace" : "Remove Member"}
                              className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Invitations */}
      {activeTab === "invitations" && (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Pending Team Invitations</h3>
              <p className="text-xs text-zinc-400">
                Invitations sent with secure 7-day cryptographic tokens awaiting recipient acceptance.
              </p>
            </div>
            {isHiringManagerOrOwner && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Invite Another
              </button>
            )}
          </div>

          {invitations.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No pending invitations for this workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-6 font-semibold">Invitee Email</th>
                    <th className="py-3.5 px-6 font-semibold">Assigned Role</th>
                    <th className="py-3.5 px-6 font-semibold">Invited By</th>
                    <th className="py-3.5 px-6 font-semibold">Expires In</th>
                    <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invitations.map((inv) => {
                    const badge = ROLE_BADGES[inv.role] || {
                      label: inv.role,
                      bg: "bg-zinc-800",
                      text: "text-zinc-300",
                      border: "border-white/10",
                    };
                    const daysLeft = Math.max(
                      0,
                      Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    );

                    return (
                      <tr key={inv._id} className="hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 font-mono text-zinc-200 text-xs">
                          {inv.inviteeEmail}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-zinc-400">
                          {inv.inviterName || inv.inviterEmail}
                        </td>
                        <td className="py-4 px-6 text-xs text-zinc-400">
                          {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isHiringManagerOrOwner && (
                            <button
                              onClick={() => handleRevokeInvite(inv._id)}
                              className="px-2.5 py-1 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-medium transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Vacancy Access & Assignments */}
      {activeTab === "vacancies" && (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Vacancy-Level Access Control</h3>
              <p className="text-xs text-zinc-400">
                Assign specific hiring managers and interviewers to each recruitment vacancy.
              </p>
            </div>
          </div>

          {loadingJobs ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              Loading vacancies...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No vacancies posted for this company workspace yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {jobs.map((job) => {
                const assigned = job.assignedMemberEmails || [];
                return (
                  <div key={job._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-white text-base">{job.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          job.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Category: {job.category} • {job.applicantsCount || 0} candidate applicants
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-xs text-zinc-500 mr-1">Assigned Recruiters:</span>
                        {assigned.length === 0 ? (
                          <span className="text-xs text-zinc-500 italic">All company hiring managers</span>
                        ) : (
                          assigned.map((em) => (
                            <span key={em} className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[11px] text-zinc-300 font-mono">
                              {em}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {isHiringManagerOrOwner && (
                      <button
                        onClick={() => {
                          setAssigningJob(job);
                          setSelectedMemberEmails(job.assignedMemberEmails || []);
                        }}
                        className="self-start md:self-auto px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-200 font-medium text-xs transition"
                      >
                        Manage Assignments
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Workspace Activity Audit */}
      {activeTab === "activity" && (
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 md:p-6 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">Company Activity History</h3>
            <p className="text-xs text-zinc-400">
              Audit log of team invitations, role changes, ownership transfers, and vacancy assignments.
            </p>
          </div>

          {loadingActivity ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
              Loading activity history...
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No activity records logged for this company yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {activityLogs.map((log) => (
                <div key={log._id} className="p-4 md:px-6 flex items-start justify-between text-xs hover:bg-white/[0.01] transition">
                  <div className="space-y-1">
                    <div className="font-semibold text-zinc-200">
                      <span className="font-mono text-indigo-400 mr-2">[{log.action}]</span>
                      {log.targetIdentifier || log.action}
                    </div>
                    <div className="text-zinc-500">
                      Performed by <span className="text-zinc-400">{log.actorName || log.actorEmail}</span>
                    </div>
                  </div>
                  <div className="text-zinc-500 font-mono text-[11px] flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Invite Team Member */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Invite Team Member</h3>
                <p className="text-xs text-zinc-400">Add a recruiter to {company?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Invitee Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Assigned Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="hiring_manager">Hiring Manager (Post vacancies, review applications, coordinate)</option>
                  <option value="interviewer">Interviewer (Review assigned candidates & participate in interviews)</option>
                  {isOwner && (
                    <option value="company_owner">Company Owner (Full workspace & membership administration)</option>
                  )}
                </select>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Security & Isolation Guarantee:</p>
                <p>• Invitations use a secure SHA-256 token valid for 7 days.</p>
                <p>• Only the invited email account will be permitted to accept.</p>
                <p>• Company membership does not grant global administrative privileges.</p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  disabled={submittingInvite}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-zinc-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submittingInvite ? "Queuing Invitation..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Role */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Update Member Role</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Editing permissions for <span className="font-mono text-zinc-200">{editingMember.userEmail}</span>
            </p>

            <form onSubmit={handleChangeRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="company_owner">Company Owner</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="interviewer">Interviewer</option>
                </select>
              </div>

              {editingMember.role === "company_owner" && newRole !== "company_owner" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    <strong>Last Owner Safeguard:</strong> A workspace must retain at least one active Company Owner. If this is the only owner, demotion will be rejected.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  disabled={submittingRoleChange}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-zinc-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRoleChange}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  {submittingRoleChange ? "Saving..." : "Update Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Remove Member */}
      {removingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Remove Workspace Member</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Are you sure you want to remove <span className="font-mono text-zinc-200">{removingMember.userEmail}</span> from {company?.name}?
            </p>

            {removingMember.role === "company_owner" && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start space-x-2 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>
                  <strong>Last Owner Safeguard:</strong> You cannot remove the last remaining Company Owner. Please designate another owner first.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRemovingMember(null)}
                disabled={submittingRemove}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-zinc-400 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={submittingRemove}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition disabled:opacity-50"
              >
                {submittingRemove ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Transfer Ownership */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-amber-500/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Transfer Company Ownership</h3>
                <p className="text-xs text-zinc-400">Designate new principal workspace owner</p>
              </div>
            </div>

            <form onSubmit={handleTransferOwnership} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Select New Owner (Active Member)
                </label>
                <select
                  required
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select an active team member...</option>
                  {members
                    .filter((m) => m.userEmail.toLowerCase() !== user?.email?.toLowerCase())
                    .map((m) => (
                      <option key={m._id} value={m.userEmail}>
                        {m.userName || m.userEmail} ({m.userEmail})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                <strong>Important:</strong> Primary ownership will be transferred. The new owner will become the authoritative recruiter for billing, vacancy ownership, and team settings.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={submittingTransfer}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-zinc-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTransfer || !newOwnerEmail}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  {submittingTransfer ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Vacancy Assignments */}
      {assigningJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Assign Members to Vacancy</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Manage authorized recruiters and interviewers for <strong className="text-white">{assigningJob.title}</strong>
            </p>

            <form onSubmit={handleSaveVacancyAssignments} className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {members.map((member) => {
                  const isChecked = selectedMemberEmails.includes(member.userEmail.toLowerCase());
                  return (
                    <label
                      key={member._id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? "bg-indigo-600/10 border-indigo-500/30 text-white"
                          : "bg-zinc-800/60 border-white/5 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const email = member.userEmail.toLowerCase();
                            if (e.target.checked) {
                              setSelectedMemberEmails([...selectedMemberEmails, email]);
                            } else {
                              setSelectedMemberEmails(selectedMemberEmails.filter((em) => em !== email));
                            }
                          }}
                          className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{member.userName || member.userEmail}</div>
                          <div className="text-[11px] font-mono text-zinc-400">{member.userEmail}</div>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                        {ROLE_BADGES[member.role]?.label || member.role}
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="text-[11px] text-zinc-500 italic">
                Note: Interviewers must be explicitly assigned here to view this vacancy, candidate applications, and participate in scheduled interviews.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningJob(null)}
                  disabled={submittingAssignment}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-zinc-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50"
                >
                  {submittingAssignment ? "Saving..." : "Save Assignments"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
