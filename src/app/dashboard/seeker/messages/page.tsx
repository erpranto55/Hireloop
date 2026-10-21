"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Send,
  Search,
  Briefcase,
  Building2,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface Conversation {
  _id: string;
  applicationId: string;
  jobId: string;
  recruiterEmail: string;
  recruiterName: string;
  seekerEmail: string;
  seekerName: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  status: "active" | "closed";
  closedReason?: string;
  lastMessage?: {
    body: string;
    senderEmail: string;
    senderRole: string;
    createdAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderEmail: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  idempotencyKey?: string;
}

export default function SeekerMessagesPage() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("conversationId");

  const { data: session, isPending: sessionPending } = useSession();
  const currentUser = session?.user;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const selectedConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch list of conversations
  const fetchConversations = useCallback(async (selectId?: string) => {
    try {
      const res = await apiFetch<{ conversations: Conversation[] }>("/api/messages/conversations");
      if (res?.conversations) {
        setConversations(res.conversations);

        const targetId = selectId || selectedConversationRef.current?._id;
        if (targetId) {
          const matched = res.conversations.find((c) => c._id === targetId);
          if (matched) {
            setSelectedConversation(matched);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
      toast.error(err.message || "Failed to load messages.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Fetch message history for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch<{ messages: Message[]; conversation: Conversation }>(
        `/api/messages/conversations/${conversationId}/messages?limit=100`
      );
      if (res?.messages) {
        setMessages(res.messages);
        setTimeout(() => scrollToBottom(false), 50);

        // Mark conversation as read
        await apiFetch(`/api/messages/conversations/${conversationId}/read`, {
          method: "POST",
        });

        // Clear unread count locally in conversation list
        setConversations((prev) =>
          prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err: any) {
      console.error("Failed to load messages:", err);
      toast.error(err.message || "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!currentUser?.email) return;
    fetchConversations(initialConversationId || undefined);
  }, [currentUser?.email, initialConversationId, fetchConversations]);

  // When selected conversation changes, load messages
  useEffect(() => {
    if (selectedConversation?._id) {
      fetchMessages(selectedConversation._id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?._id, fetchMessages]);

  // Setup Real-Time SSE listener for incoming messages
  useEffect(() => {
    if (!currentUser?.email) return;

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

      // Listen for message events
      es.addEventListener("message", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const currentConvo = selectedConversationRef.current;

          if (payload?.conversationId) {
            // Update conversation list preview
            setConversations((prev) =>
              prev.map((c) => {
                if (c._id === payload.conversationId) {
                  return {
                    ...c,
                    lastMessage: {
                      body: payload.body,
                      senderEmail: payload.senderEmail,
                      senderRole: payload.senderRole,
                      createdAt: payload.createdAt,
                    },
                    unreadCount:
                      currentConvo?._id === payload.conversationId
                        ? 0
                        : (c.unreadCount || 0) + 1,
                    updatedAt: payload.createdAt,
                  };
                }
                return c;
              })
            );

            // If active conversation matches, append message and mark read
            if (currentConvo?._id === payload.conversationId) {
              setMessages((prev) => {
                if (prev.some((m) => m._id === payload._id)) return prev;
                return [...prev, payload];
              });
              scrollToBottom(true);
              apiFetch(`/api/messages/conversations/${payload.conversationId}/read`, {
                method: "POST",
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.error("Error processing SSE message:", e);
        }
      });

      es.onerror = () => {
        setIsLiveConnected(false);
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            fetchConversations();
            if (selectedConversationRef.current?._id) {
              fetchMessages(selectedConversationRef.current._id);
            }
          }, 25000);
        }
      };
    } catch {
      setIsLiveConnected(false);
      fallbackInterval = setInterval(() => {
        fetchConversations();
      }, 25000);
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
  }, [currentUser?.email, fetchConversations, fetchMessages]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConversation?._id || sending) return;

    const trimmed = newMessageText.trim();
    if (trimmed.length > 2000) {
      toast.error("Message exceeds 2000 characters limit.");
      return;
    }

    setSending(true);
    const idempotencyKey = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await apiFetch<{ message: Message }>(
        `/api/messages/conversations/${selectedConversation._id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            body: trimmed,
            idempotencyKey,
          }),
        }
      );

      if (res?.message) {
        setMessages((prev) => [...prev, res.message]);
        setNewMessageText("");
        scrollToBottom(true);

        // Update conversation list preview
        setConversations((prev) =>
          prev.map((c) =>
            c._id === selectedConversation._id
              ? {
                  ...c,
                  lastMessage: {
                    body: res.message.body,
                    senderEmail: res.message.senderEmail,
                    senderRole: res.message.senderRole,
                    createdAt: res.message.createdAt,
                  },
                  updatedAt: res.message.createdAt,
                }
              : c
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      toast.error(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Filter conversations by company or job title
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.companyName?.toLowerCase().includes(query) ||
      c.jobTitle.toLowerCase().includes(query) ||
      c.recruiterName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-indigo-400" />
            Recruiter Messages
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Communicate directly with hiring managers and recruiters for your shortlisted applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isLiveConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {isLiveConnected ? "Live Connected" : "Connecting..."}
          </span>
          <button
            onClick={() => fetchConversations()}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Main Messaging Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-xl overflow-hidden min-h-[640px] shadow-2xl">
        {/* Left Column: Inbox List */}
        <div
          className={`lg:col-span-4 border-r border-zinc-800/80 flex flex-col ${
            selectedConversation ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search Box */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search company or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {loadingConversations ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="mt-3 text-xs">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center text-zinc-500">
                <MessageSquare className="h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-sm font-medium text-zinc-300">No conversations yet</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-[220px]">
                  When your applications are shortlisted or scheduled for interviews, recruiters can reach out to you here.
                </p>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isSelected = selectedConversation?._id === convo._id;
                const hasUnread = (convo.unreadCount || 0) > 0;

                return (
                  <button
                    key={convo._id}
                    onClick={() => setSelectedConversation(convo)}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-zinc-900/60 ${
                      isSelected ? "bg-indigo-950/30 border-l-4 border-indigo-500" : ""
                    }`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 font-semibold text-white text-sm">
                      {convo.companyName ? convo.companyName.charAt(0).toUpperCase() : "C"}
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isSelected || hasUnread ? "text-white" : "text-zinc-300"
                          }`}
                        >
                          {convo.companyName || "Company"}
                        </h4>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {convo.lastMessage?.createdAt
                            ? new Date(convo.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <p className="text-[11px] text-indigo-400 font-medium truncate mt-0.5">
                        {convo.jobTitle}
                      </p>

                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {convo.lastMessage?.body ? (
                          <span>
                            {convo.lastMessage.senderEmail === currentUser?.email ? "You: " : ""}
                            {convo.lastMessage.body}
                          </span>
                        ) : (
                          <span className="italic text-zinc-600">Conversation started</span>
                        )}
                      </p>
                    </div>

                    {hasUnread && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shrink-0">
                        {convo.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Transcript */}
        <div
          className={`lg:col-span-8 flex flex-col h-[640px] ${
            selectedConversation ? "flex" : "hidden lg:flex"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/40">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/30 text-violet-300 font-semibold text-sm border border-violet-500/30">
                    {selectedConversation.companyName
                      ? selectedConversation.companyName.charAt(0).toUpperCase()
                      : "C"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {selectedConversation.companyName || "Company"}
                      </h3>
                      <span className="text-xs text-zinc-400 font-normal">
                        ({selectedConversation.recruiterName || "Recruiter"})
                      </span>
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                        {selectedConversation.applicationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="h-3 w-3 text-zinc-500" />
                      {selectedConversation.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/jobs/${selectedConversation.jobId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                    title="View job posting"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">View Job</span>
                  </Link>
                </div>
              </div>

              {/* Status Notice if Closed / Inactive */}
              {selectedConversation.status === "closed" && (
                <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-xs text-amber-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    This conversation is closed ({selectedConversation.closedReason || "application concluded"}).
                    History is preserved as read-only.
                  </span>
                </div>
              )}

              {/* Message Transcript */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mb-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">No messages yet</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      Send a message to the hiring team at {selectedConversation.companyName} regarding your application.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderEmail === currentUser?.email;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[11px] text-zinc-500">
                          <span className="font-medium text-zinc-400">
                            {isMe ? "You" : selectedConversation.companyName}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                            isMe
                              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md"
                              : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700/60"
                          }`}
                        >
                          {msg.body}
                        </div>

                        {isMe && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                            {msg.readAt ? (
                              <span className="inline-flex items-center gap-0.5 text-indigo-400" title={`Read at ${new Date(msg.readAt).toLocaleTimeString()}`}>
                                <CheckCheck className="h-3 w-3" /> Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-zinc-500">
                                <Check className="h-3 w-3" /> Sent
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              {selectedConversation.status === "closed" ? (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 text-center text-xs text-zinc-500">
                  New messages cannot be sent because this conversation is closed.
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-zinc-800/80 bg-zinc-900/50"
                >
                  <div className="relative flex items-center gap-2">
                    <textarea
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${selectedConversation.companyName}... (Press Enter to send, Shift+Enter for newline)`}
                      rows={2}
                      maxLength={2000}
                      disabled={sending}
                      className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition"
                    />

                    <button
                      type="submit"
                      disabled={!newMessageText.trim() || sending}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-indigo-600/30"
                    >
                      {sending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      Encrypted session • Direct contact with verified recruiter
                    </span>
                    <span>
                      {newMessageText.length}/2000
                    </span>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 mb-4 shadow-inner">
                <MessageSquare className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Your Messages</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                Select a conversation on the left to read recruiter messages and send replies regarding your applications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
