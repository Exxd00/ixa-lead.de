import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "start";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-sm font-semibold text-primary">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-2xl font-bold leading-tight text-navy sm:text-3xl md:text-[2.15rem]",
          align === "center" && "max-w-3xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-base leading-relaxed text-slate-600 sm:text-lg",
            align === "center" && "max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
