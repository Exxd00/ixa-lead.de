"use client";

import { captureConversionAttribution } from "@/lib/conversion-tracking";
import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
    captureConversionAttribution();
  }, []);

  return <div className="antialiased">{children}</div>;
}
