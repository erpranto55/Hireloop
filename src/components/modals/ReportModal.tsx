"use client";

import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "job" | "company" | "user" | "message";
  targetId: string;
  targetIdentifier: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetIdentifier,
}: ReportModalProps) {
  const [category, setCategory] = useState<string>(() => {
    if (targetType === "job") return "fraudulent_job";
    if (targetType === "company") return "company_impersonation";
    if (targetType === "message") return "inappropriate_message";
    return "abusive_behavior";
  });
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please explain why you are reporting this content.");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          category,
          reason: reason.trim(),
        }),
      });

      toast.success("Thank you. Your report has been submitted to our moderation team for review.");
      setReason("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Content</h3>
              <p className="text-xs text-zinc-400">
                Reporting: <span className="text-white font-medium truncate max-w-[200px] inline-block align-bottom">{targetIdentifier}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">Reason Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {targetType === "job" && (
                <>
                  <option value="fraudulent_job">Fraudulent or Suspicious Job Listing</option>
                  <option value="company_impersonation">Company Impersonation / Misleading Info</option>
                  <option value="policy_violation">Platform Policy Violation</option>
                  <option value="other">Other Violation</option>
                </>
              )}
              {targetType === "company" && (
                <>
                  <option value="company_impersonation">Company Impersonation / Misleading Info</option>
                  <option value="policy_violation">Platform Policy Violation</option>
                  <option value="other">Other Violation</option>
                </>
              )}
              {targetType === "user" && (
                <>
                  <option value="abusive_behavior">Abusive or Harassing Behavior</option>
                  <option value="policy_violation">Impersonation / Policy Violation</option>
                  <option value="other">Other Violation</option>
                </>
              )}
              {targetType === "message" && (
                <>
                  <option value="inappropriate_message">Inappropriate / Harassing Message</option>
                  <option value="abusive_behavior">Abusive Behavior</option>
                  <option value="policy_violation">Spam / Policy Violation</option>
                  <option value="other">Other Violation</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              Explain the Issue (Required)
            </label>
            <textarea
              rows={4}
              required
              maxLength={1000}
              placeholder="Please provide details about what is suspicious or inappropriate..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black p-3 text-xs text-white outline-none focus:border-indigo-500 resize-none"
            />
            <span className="text-[10px] text-zinc-500 block text-right mt-1">
              {reason.length} / 1000 characters
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-400 flex items-start gap-2">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-zinc-400" />
            <span>
              Your report is confidential. The reported account will not be told who submitted the report.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50 shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
