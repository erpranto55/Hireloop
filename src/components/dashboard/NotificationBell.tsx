"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Briefcase,
  FileText,
  CreditCard,
  AlertCircle,
  Sparkles,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

interface NotificationItem {
  _id: string;
  recipientEmail: string;
  role: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  referenceId?: string;
  referenceType?: string;
  read: boolean;
  createdAt: string;
}

function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "recently";
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "application_received":
      return <Briefcase size={16} className="text-indigo-400" />;
    case "application_status_changed":
      return <FileText size={16} className="text-emerald-400" />;
    case "subscription_activated":
    case "payment_succeeded":
      return <CreditCard size={16} className="text-violet-400" />;
    case "payment_failed":
    case "subscription_canceled":
    case "subscription_cancellation_scheduled":
      return <AlertCircle size={16} className="text-rose-400" />;
    default:
      return <Sparkles size={16} className="text-indigo-400" />;
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await apiFetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore background network blips
    }
  }, [user]);

  // Load notification history
  const fetchNotifications = useCallback(async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await apiFetch("/api/notifications?limit=25");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up Real-Time Server-Sent Events (SSE) with fallback polling
  useEffect(() => {
    if (!user?.email) return;

    fetchUnreadCount();

    // Connect to SSE stream
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/notifications/stream`;
    let es: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsLiveConnected(true);
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      };

      es.addEventListener("notification", (event: MessageEvent) => {
        try {
          const newNotif: NotificationItem = JSON.parse(event.data);
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n._id !== newNotif._id)]);
          setUnreadCount((prev) => prev + 1);
          toast.info(`${newNotif.title}: ${newNotif.message}`, {
            icon: () => getNotificationIcon(newNotif.type),
            autoClose: 5000,
          });
        } catch (e) {
          console.error("Error parsing notification event:", e);
        }
      });

      es.onerror = () => {
        setIsLiveConnected(false);
        // Fallback: poll every 30s while SSE reconnects
        if (!fallbackInterval) {
          fallbackInterval = setInterval(fetchUnreadCount, 30000);
        }
      };
    } catch (e) {
      setIsLiveConnected(false);
      fallbackInterval = setInterval(fetchUnreadCount, 30000);
    }

    return () => {
      if (es) {
        es.close();
        eventSourceRef.current = null;
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [user, fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await apiFetch("/api/notifications/mark-all-read", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await handleMarkAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white focus:outline-none cursor-pointer"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white shadow-lg shadow-indigo-600/50 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                  {isLiveConnected ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  ) : (
                    <span>Updated</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="flex h-36 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex items-start gap-3 p-4 transition cursor-pointer ${
                    notif.read ? "bg-transparent hover:bg-white/[0.03]" : "bg-indigo-500/[0.06] hover:bg-indigo-500/[0.10]"
                  }`}
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${notif.read ? "text-zinc-300" : "text-white"}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-indigo-400">
                        <span>View details</span>
                        <ExternalLink size={11} />
                      </div>
                    )}
                  </div>

                  {/* Actions / Read dot */}
                  <div className="flex flex-col items-center gap-2">
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                    <button
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="opacity-0 group-hover:opacity-100 rounded p-1 text-zinc-500 hover:text-white transition"
                    >
                      <Check size={13} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-zinc-500">
                  <Bell size={22} />
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-300">All caught up!</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  You have no pending notifications. Platform updates and application events will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
