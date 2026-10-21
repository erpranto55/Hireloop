"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

export default function JobViewTracker({ jobId }: { jobId: string }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!jobId || trackedRef.current) return;

    // Session storage deduplication to prevent re-tracking on route tab switches
    const sessionKey = `viewed_job_${jobId}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    trackedRef.current = true;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, "1");
    }

    apiFetch(`/api/jobs/${jobId}/view`, {
      method: "POST",
    }).catch(() => {
      // Non-critical tracking error
    });
  }, [jobId]);

  return null;
}
