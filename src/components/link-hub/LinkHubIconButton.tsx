"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";

export function LinkHubIconButton({
  href,
  label,
  icon,
  tone = "default",
  external = true,
  disabled = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tone?: "default" | "success";
  external?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={`${label} – bald verfügbar`}
        title={`${label} – bald verfügbar`}
        className="grid size-14 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/25"
      >
        {icon}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      onClick={() => track("link_hub_click", { label })}
      className={cn(
        "focus-ring grid size-14 place-items-center rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.96]",
        tone === "success"
          ? "border-success-400/40 bg-success-500/15 text-success-400 hover:bg-success-500/25"
          : "border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.12]",
      )}
    >
      {icon}
    </a>
  );
}
