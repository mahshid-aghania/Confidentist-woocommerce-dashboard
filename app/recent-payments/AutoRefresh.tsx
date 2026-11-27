"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-runs the server page (a fresh Stripe check) every `seconds` while the tab is visible.
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
