"use client";

import { useEffect } from "react";

export function PersonalPageVisitBeacon({ ticket }: { ticket: string }) {
  useEffect(() => {
    let timeout: number | null = null;
    let delivered = false;
    let stopped = false;
    let inFlight = false;
    let attempts = 0;
    let disposed = false;

    const send = async () => {
      if (
        disposed || delivered || stopped || inFlight || attempts >= 3 ||
        document.visibilityState !== "visible"
      ) return;
      inFlight = true;
      attempts += 1;
      let retry = false;
      const controller = new AbortController();
      const requestTimeout = window.setTimeout(() => controller.abort(), 15_000);

      try {
        // sendBeacon only confirms queuing in the browser. Fetch lets us
        // acknowledge the receiver and retry transient handoff failures.
        const response = await fetch("/api/outreach/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket }),
          cache: "no-store",
          credentials: "same-origin",
          keepalive: true,
          signal: controller.signal,
        });
        delivered = response.ok;
        retry = !delivered && (response.status === 429 || response.status >= 500);
        stopped = !delivered && !retry;
      } catch {
        retry = true;
      } finally {
        window.clearTimeout(requestTimeout);
        inFlight = false;
        if (retry) schedule(1_500 * attempts);
      }
    };

    const schedule = (delay = 1_000 + Math.floor(Math.random() * 501)) => {
      if (
        disposed || delivered || stopped || inFlight || attempts >= 3 ||
        timeout !== null || document.visibilityState !== "visible"
      ) {
        return;
      }
      timeout = window.setTimeout(() => {
        timeout = null;
        void send();
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
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [ticket]);

  return null;
}
