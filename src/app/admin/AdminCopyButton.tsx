"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function AdminCopyButton({
  value,
  label = "نسخ",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-navy/10 bg-white px-3 text-xs font-bold text-navy transition-colors hover:border-primary/30 hover:text-primary"
      aria-label={`${label}: ${value}`}
    >
      {copied ? (
        <Check className="size-3.5 text-success-600" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "تم النسخ" : label}
    </button>
  );
}
