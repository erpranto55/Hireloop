"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Calendar,
  MessageSquare,
  CreditCard,
  Briefcase,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

export interface NotificationPreferences {
  applications: {
    applicationReceived: boolean;
    applicationStatusChanged: boolean;
    interviewInvites: boolean;
  };
  messaging: {
    newMessage: boolean;
    offlineDigest: boolean;
    digestFrequency: "every_4h" | "every_12h" | "daily";
  };
  reminders: {
    interviewReminders: boolean;
    reminderLeadTimes: string[];
  };
  billing: {
    paymentReceipts: boolean;
    subscriptionAlerts: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    webPush: boolean;
  };
}

export interface ChannelAvailability {
  inAppAvailable: boolean;
  emailAvailable: boolean;
  webPushAvailable: boolean;
}

const ALL_LEAD_TIMES = [
  { id: "48h", label: "48 hours before", short: "48h" },
  { id: "24h", label: "24 hours before", short: "24h" },
  { id: "12h", label: "12 hours before", short: "12h" },
  { id: "2h", label: "2 hours before", short: "2h" },
  { id: "1h", label: "1 hour before", short: "1h" },
];

export default function NotificationPreferencesCenter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [initialPreferences, setInitialPreferences] = useState<NotificationPreferences | null>(null);
  const [channels, setChannels] = useState<ChannelAvailability>({
    inAppAvailable: true,
    emailAvailable: true,
    webPushAvailable: false,
  });

  // Browser Web Push state
  const [browserPushPermission, setBrowserPushPermission] = useState<NotificationPermission>("default");
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);

  // Check browser push support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      setIsPushSupported(supported);
      if ("Notification" in window) {
        setBrowserPushPermission(Notification.permission);
      }
    }
  }, []);

  // Fetch preferences from server
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<{ preferences: NotificationPreferences; channels: ChannelAvailability }>(
        "/api/notifications/preferences"
      );
      setPreferences(res.preferences);
      setInitialPreferences(res.preferences);
      if (res.channels) {
        setChannels(res.channels);
      }
    } catch (err: any) {
      console.error("[PreferencesCenter] Fetch error:", err);
      setError(err.message || "Failed to load notification preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Track unsaved changes
  const hasUnsavedChanges = Boolean(
    preferences &&
      initialPreferences &&
      JSON.stringify(preferences) !== JSON.stringify(initialPreferences)
  );

  // Warn user before navigating away if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Toggle handlers
  const updatePreference = (section: keyof NotificationPreferences, key: string, value: any) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [section]: {
        ...preferences[section],
        [key]: value,
      },
    });
  };

  const toggleLeadTime = (timeId: string) => {
    if (!preferences) return;
    const current = preferences.reminders.reminderLeadTimes || [];
    let updated: string[];
    if (current.includes(timeId)) {
      if (current.length === 1) {
        toast.warn("At least one reminder lead time must be selected while reminders are enabled.");
        return;
      }
      updated = current.filter((t) => t !== timeId);
    } else {
      updated = [...current, timeId];
    }
    updatePreference("reminders", "reminderLeadTimes", updated);
  };

  // Request browser permission for push when toggled
  const handlePushToggle = async (checked: boolean) => {
    if (!preferences) return;
    if (checked) {
      if (!isPushSupported) {
        toast.error("Web Push notifications are not supported by this browser.");
        return;
      }
      if (!channels.webPushAvailable) {
        toast.info("Web Push server integration is currently inactive (VAPID keys not configured).");
      }
      if ("Notification" in window && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        setBrowserPushPermission(permission);
        if (permission !== "granted") {
          toast.warn("Browser notification permission was not granted.");
          return;
        }
      }
    }
    updatePreference("channels", "webPush", checked);
  };

  // Save changes to API
  const handleSave = async () => {
    if (!preferences) return;
    try {
      setSaving(true);
      const res = await apiFetch<{ success: boolean; preferences: NotificationPreferences }>(
        "/api/notifications/preferences",
        {
          method: "PATCH",
          body: JSON.stringify(preferences),
        }
      );
      setPreferences(res.preferences);
      setInitialPreferences(res.preferences);
      toast.success("Notification preferences saved successfully!");
    } catch (err: any) {
      console.error("[PreferencesCenter] Save error:", err);
      toast.error(err.message || "Failed to update notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all notification preferences to system defaults?")) {
      return;
    }
    try {
      setResetting(true);
      const res = await apiFetch<{ success: boolean; preferences: NotificationPreferences }>(
        "/api/notifications/preferences/reset",
        { method: "POST" }
      );
      setPreferences(res.preferences);
      setInitialPreferences(res.preferences);
      toast.success("Notification preferences have been reset to defaults.");
    } catch (err: any) {
      console.error("[PreferencesCenter] Reset error:", err);
      toast.error(err.message || "Failed to reset notification preferences.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm">Loading delivery preferences...</span>
        </div>
      </div>
    );
  }

  if (error || !preferences) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-zinc-200">
        <div className="flex items-center gap-3 text-rose-400">
          <AlertTriangle size={20} />
          <h3 className="font-semibold">Unable to load notification preferences</h3>
        </div>
        <p className="mt-2 text-sm text-zinc-400">{error || "An unknown error occurred."}</p>
        <button
          onClick={fetchPreferences}
          className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Notification & Delivery Center</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Control which transactional updates, reminders, and digest emails you receive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting || saving}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition disabled:opacity-50"
            title="Reset to recommended system defaults"
          >
            <RotateCcw size={14} className={resetting ? "animate-spin" : ""} />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1: Application Updates */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Briefcase size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Application Updates</h3>
          </div>

          <div className="space-y-4 text-sm">
            <ToggleRow
              label="Application Submissions"
              description="Alerts when candidates apply to active jobs or when your application is delivered."
              checked={preferences.applications.applicationReceived}
              onChange={(val) => updatePreference("applications", "applicationReceived", val)}
            />

            <ToggleRow
              label="Application Status Changes"
              description="Notifications when applications transition between review, shortlisted, or decision stages."
              checked={preferences.applications.applicationStatusChanged}
              onChange={(val) => updatePreference("applications", "applicationStatusChanged", val)}
            />

            <ToggleRow
              label="Interview Invitations & Changes"
              description="Alerts when an interview appointment is proposed, accepted, or rescheduled."
              checked={preferences.applications.interviewInvites}
              onChange={(val) => updatePreference("applications", "interviewInvites", val)}
            />
          </div>
        </div>

        {/* Section 2: Messages & Offline Digest */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <MessageSquare size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Messages & Offline Digest</h3>
          </div>

          <div className="space-y-4 text-sm">
            <ToggleRow
              label="New Message Alerts"
              description="Immediate notifications when a recruiter or candidate sends you a direct message."
              checked={preferences.messaging.newMessage}
              onChange={(val) => updatePreference("messaging", "newMessage", val)}
            />

            <ToggleRow
              label="Offline Unread-Message Digest"
              description="Consolidated summary email when you are inactive and offline with unread messages."
              checked={preferences.messaging.offlineDigest}
              onChange={(val) => updatePreference("messaging", "offlineDigest", val)}
            />

            {preferences.messaging.offlineDigest && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Digest Delivery Frequency
                </label>
                <select
                  value={preferences.messaging.digestFrequency}
                  onChange={(e) => updatePreference("messaging", "digestFrequency", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="every_4h">Every 4 hours (Default cooldown)</option>
                  <option value="every_12h">Every 12 hours (Twice daily)</option>
                  <option value="daily">Daily batch (Once every 24 hours)</option>
                </select>
                <p className="text-[11px] text-zinc-500">
                  Digests only trigger if you remain offline for over 2 hours and have unread messages.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Interview Reminders & Lead Times */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Calendar size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Interview Reminders</h3>
          </div>

          <div className="space-y-4 text-sm">
            <ToggleRow
              label="Automated Interview Reminders"
              description="Receive scheduled alerts prior to upcoming confirmed interview appointments."
              checked={preferences.reminders.interviewReminders}
              onChange={(val) => updatePreference("reminders", "interviewReminders", val)}
            />

            {preferences.reminders.interviewReminders && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Reminder Lead Times</span>
                  <span className="text-[11px] text-zinc-500">Select one or more</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ALL_LEAD_TIMES.map((lt) => {
                    const isSelected = preferences.reminders.reminderLeadTimes.includes(lt.id);
                    return (
                      <button
                        key={lt.id}
                        type="button"
                        onClick={() => toggleLeadTime(lt.id)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        <Clock size={12} />
                        {lt.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Saving new reminder lead times automatically reconciles and updates all your pending future interviews.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Billing Notifications */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <CreditCard size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Billing & Subscriptions</h3>
          </div>

          <div className="space-y-4 text-sm">
            <ToggleRow
              label="Payment Receipts & Invoices"
              description="Confirmation emails whenever a recurring subscription payment succeeds."
              checked={preferences.billing.paymentReceipts}
              onChange={(val) => updatePreference("billing", "paymentReceipts", val)}
            />

            <ToggleRow
              label="Subscription Changes & Cancellations"
              description="Alerts when your plan tier changes, renews, or is scheduled for cancellation."
              checked={preferences.billing.subscriptionAlerts}
              onChange={(val) => updatePreference("billing", "subscriptionAlerts", val)}
            />

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90">
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Essential notices:</strong> Payment failure alerts and account security communications cannot be disabled to protect your account standing.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Delivery Channels */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Delivery Channels</h3>
          </div>
          <span className="text-xs text-zinc-500">Live channel operational status</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* In-App */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm">In-App Notifications</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Operational
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Real-time bell badge and dropdown alerts while actively browsing HireLoop.
            </p>
            <ToggleRow
              label="Enable In-App"
              checked={preferences.channels.inApp}
              onChange={(val) => updatePreference("channels", "inApp", val)}
            />
          </div>

          {/* Email */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm">Transactional Email</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Operational
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Transactional email delivery to your registered account address via reliable outbox.
            </p>
            <ToggleRow
              label="Enable Email"
              checked={preferences.channels.email}
              onChange={(val) => updatePreference("channels", "email", val)}
            />
          </div>

          {/* Web Push */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white text-sm">Web Push</span>
              {channels.webPushAvailable ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 border border-white/10">
                  Not Configured
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Desktop and mobile browser push notifications when HireLoop is closed.
            </p>
            <ToggleRow
              label="Enable Web Push"
              checked={preferences.channels.webPush}
              onChange={handlePushToggle}
            />
            {preferences.channels.webPush && !channels.webPushAvailable && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
                <Info size={12} className="shrink-0" />
                VAPID keys not set on server. Alerts will fallback to In-App & Email.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable accessible toggle switch row
 */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-zinc-200 block cursor-pointer select-none">
          {label}
        </label>
        {description && <p className="text-[11px] text-zinc-400 leading-normal">{description}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? "bg-indigo-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
