"use client";

import { captureConversionAttribution } from "@/lib/conversion-tracking";
import { isNoTrackPath } from "@/lib/privacy-routes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
    if (isNoTrackPath(pathname)) return;
    captureConversionAttribution();
  }, [pathname]);

  return <div className="antialiased">{children}</div>;
}
