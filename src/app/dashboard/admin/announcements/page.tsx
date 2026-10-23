"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Send,
  Users,
  Mail,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

interface CampaignItem {
  _id: string;
  campaignId: string;
  title: string;
  message: string;
  audience: string;
  channels: string[];
  recipientCount: number;
  deliveryStats: {
    queued: number;
    sentInApp: number;
    sentEmail: number;
    suppressedEmail: number;
    failed: number;
  };
  status: "processing" | "completed" | "failed";
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export default function AdminAnnouncementsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [audience, setAudience] = useState<string>("all");
  const [customEmails, setCustomEmails] = useState<string>("");
  const [channelInApp, setChannelInApp] = useState<boolean>(true);
  const [channelEmail, setChannelEmail] = useState<boolean>(false);

  // Audience preview count
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState<boolean>(false);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [broadcasting, setBroadcasting] = useState<boolean>(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ campaigns: CampaignItem[] }>("/api/admin/announcements");
      setCampaigns(res.campaigns || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load broadcast campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch estimated audience count whenever audience selection changes
  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      try {
        setLoadingCount(true);
        const queryParams = new URLSearchParams({ audience });
        if (audience === "selected_users" && customEmails.trim()) {
          queryParams.append("selectedEmails", customEmails.trim());
        }
        const res = await apiFetch<{ count: number }>(
          `/api/admin/announcements/audience-count?${queryParams.toString()}`
        );
        if (active) {
          setAudienceCount(res.count);
        }
      } catch {
        if (active) setAudienceCount(null);
      } finally {
        if (active) setLoadingCount(false);
      }
    };

    fetchCount();
    return () => {
      active = false;
    };
  }, [audience, customEmails]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in both title and message.");
      return;
    }
    if (!channelInApp && !channelEmail) {
      toast.error("At least one delivery channel (In-App or Email) must be selected.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleDispatch = async () => {
    try {
      setBroadcasting(true);
      const channels: string[] = [];
      if (channelInApp) channels.push("in_app");
      if (channelEmail) channels.push("email");

      const selectedEmails =
        audience === "selected_users"
          ? customEmails.split(",").map((e) => e.trim()).filter(Boolean)
          : [];

      await apiFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          audience,
          selectedEmails,
          channels,
          idempotencyKey: `broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      toast.success("Broadcast dispatched successfully!");
      setShowConfirmModal(false);
      setTitle("");
      setMessage("");
      setCustomEmails("");
      fetchCampaigns();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to dispatch broadcast");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="text-indigo-400" size={24} />
            <h1 className="text-3xl font-bold tracking-tight text-white">Platform Announcements</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Send controlled system updates, security bulletins, and release notes across HireLoop with preference enforcement.
          </p>
        </div>

        <button
          onClick={fetchCampaigns}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/10 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Grid: Composer & Live Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast Composer */}
        <form
          onSubmit={handleOpenConfirm}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-semibold text-white">Compose Announcement</h2>
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/20">
              <Users size={12} />
              {loadingCount ? (
                "Counting..."
              ) : audienceCount !== null ? (
                <span>~{audienceCount} eligible users</span>
              ) : (
                "Resolving audience..."
              )}
            </div>
          </div>

          {/* Audience selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="all">All Active Platform Users (Seekers & Recruiters)</option>
              <option value="seekers">Job Seekers Only</option>
              <option value="recruiters">Recruiters Only</option>
              <option value="selected_users">Specific Users (Comma-separated emails)</option>
            </select>
          </div>

          {/* Custom emails input if selected_users */}
          {audience === "selected_users" && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Recipient Emails
              </label>
              <input
                type="text"
                placeholder="user1@example.com, user2@example.com"
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Channels toggles */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">Delivery Channels</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 p-3 cursor-pointer hover:bg-white/5 transition">
                <input
                  type="checkbox"
                  checked={channelInApp}
                  onChange={(e) => setChannelInApp(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <div>
                  <span className="text-xs font-medium text-white block">In-App Notification</span>
                  <span className="text-[10px] text-zinc-400">Bell badge & notification feed</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 p-3 cursor-pointer hover:bg-white/5 transition">
                <input
                  type="checkbox"
                  checked={channelEmail}
                  onChange={(e) => setChannelEmail(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <div>
                  <span className="text-xs font-medium text-white block">Transactional Email</span>
                  <span className="text-[10px] text-zinc-400">Respects user email preferences</span>
                </div>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Announcement Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Maintenance Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Message Content</label>
            <textarea
              rows={4}
              required
              placeholder="Write the announcement details clearly. Script tags and malicious markup are automatically sanitized..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black p-3.5 text-xs text-white outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Send size={14} /> Review & Dispatch Broadcast
          </button>
        </form>

        {/* Live Preview Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Eye size={16} className="text-zinc-400" />
            <h2 className="text-base font-semibold text-white">Live Recipient Preview</h2>
          </div>

          <p className="text-xs text-zinc-400">
            This is how the notification will appear inside recipients&apos; HireLoop dashboard:
          </p>

          <div className="rounded-2xl border border-white/15 bg-zinc-950 p-5 shadow-xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Megaphone size={16} />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  {title.trim() || "Announcement Title"}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {message.trim() ||
                    "This is preview text demonstrating how announcement messages appear to authenticated candidates and recruiters."}
                </p>
                <span className="text-[10px] text-zinc-500 block pt-1">Just now • Platform Announcement</span>
              </div>
            </div>
          </div>

          {channelEmail && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300 flex items-start gap-2">
              <Mail size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Email Delivery Policy:</strong> Optional email delivery is evaluated against each recipient&apos;s notification preferences. If a user disabled email notifications, they will only receive the in-app alert.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
        <div className="border-b border-white/10 bg-black/40 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Broadcast History</h3>
          <span className="text-xs text-zinc-500">{campaigns.length} past campaign(s)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading campaign history...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No system announcements have been dispatched yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Title & Message</th>
                  <th className="px-6 py-3 font-medium">Audience</th>
                  <th className="px-6 py-3 font-medium">Channels</th>
                  <th className="px-6 py-3 font-medium">Recipients</th>
                  <th className="px-6 py-3 font-medium">Delivery Stats</th>
                  <th className="px-6 py-3 font-medium">Dispatched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {campaigns.map((camp) => (
                  <tr key={camp._id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 max-w-xs">
                      <span className="font-semibold text-white block truncate">{camp.title}</span>
                      <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                        {camp.message}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-300 border border-white/10">
                        {camp.audience}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {camp.channels.map((ch) => (
                          <span
                            key={ch}
                            className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/20"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-zinc-300">
                      {camp.recipientCount} users
                    </td>

                    <td className="px-6 py-4 text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-emerald-400 block">
                          ✓ {camp.deliveryStats.sentInApp} in-app sent
                        </span>
                        {camp.deliveryStats.sentEmail > 0 && (
                          <span className="text-blue-400 block">
                            ✓ {camp.deliveryStats.sentEmail} emails sent
                          </span>
                        )}
                        {camp.deliveryStats.suppressedEmail > 0 && (
                          <span className="text-zinc-500 block">
                            • {camp.deliveryStats.suppressedEmail} emails suppressed
                          </span>
                        )}
                        {camp.deliveryStats.failed > 0 && (
                          <span className="text-rose-400 block">
                            ✕ {camp.deliveryStats.failed} failed
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(camp.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Megaphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Broadcast Dispatch</h3>
                <p className="text-xs text-zinc-400">Please review before sending</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2">
              <p><strong className="text-zinc-400">Title:</strong> {title}</p>
              <p><strong className="text-zinc-400">Target Audience:</strong> {audience}</p>
              <p><strong className="text-zinc-400">Estimated Recipients:</strong> ~{audienceCount} users</p>
              <p><strong className="text-zinc-400">Channels:</strong> {channelInApp ? "In-App" : ""}{channelInApp && channelEmail ? ", " : ""}{channelEmail ? "Email" : ""}</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              This will create durable notification records and deliver the message immediately to all eligible accounts.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={broadcasting}
                onClick={handleDispatch}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                {broadcasting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Confirm & Dispatch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
