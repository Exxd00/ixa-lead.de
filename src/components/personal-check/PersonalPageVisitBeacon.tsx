"use client";

import { useEffect } from "react";

export function PersonalPageVisitBeacon({ ticket }: { ticket: string }) {
  useEffect(() => {
    let timeout: number | null = null;
    let sent = false;

    const send = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      const body = JSON.stringify({ ticket });
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/outreach/visit", blob)) return;

      void fetch("/api/outreach/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
        credentials: "same-origin",
        keepalive: true,
      });
    };

    const schedule = () => {
      if (sent || timeout !== null || document.visibilityState !== "visible") {
        return;
      }
      const delay = 1_000 + Math.floor(Math.random() * 501);
      timeout = window.setTimeout(() => {
        timeout = null;
        send();
      }, delay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        if (timeout !== null) window.clearTimeout(timeout);
        timeout = null;
        return;
      }
      schedule();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [ticket]);

  return null;
}
