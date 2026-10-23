"use client";

import React, { useState } from "react";
import { Flag } from "lucide-react";
import ReportModal from "@/components/modals/ReportModal";

interface ReportJobButtonProps {
  jobId: string;
  jobTitle: string;
}

export default function ReportJobButton({ jobId, jobTitle }: ReportJobButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 hover:border-rose-500/40"
      >
        <Flag size={14} /> Report suspicious listing
      </button>

      <ReportModal
        isOpen={showModal}
        targetType="job"
        targetId={jobId}
        targetIdentifier={jobTitle}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
