"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/tracking";
import { cn } from "@/lib/utils";

export function LinkHubButton({
  href,
  label,
  icon,
  primary = false,
  disabled = false,
  external = true,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  external?: boolean;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex w-full items-center gap-4 rounded-full border border-white/10 bg-white/[0.03] px-5 py-4 text-white/40"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/5 text-white/30">
          {icon}
        </span>
        <span className="flex-1 text-left text-[15px] font-medium">{label}</span>
        <span className="shrink-0 text-[11px] font-medium text-white/25">
          bald verfügbar
        </span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={() => track("link_hub_click", { label })}
      className={cn(
        "focus-ring flex w-full items-center gap-4 rounded-full border px-5 py-4 text-[15px] font-medium transition-all duration-200 active:scale-[0.98]",
        primary
          ? "border-transparent bg-gradient-to-r from-primary to-blue-500 text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.7)] hover:-translate-y-0.5"
          : "border-white/15 bg-white/[0.04] text-white backdrop-blur hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08]",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          primary ? "bg-white/20" : "bg-white/10",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
    </a>
  );
}
