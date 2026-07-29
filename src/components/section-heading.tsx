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
        <span className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          <span className="h-px w-5 bg-primary" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl font-bold leading-[1.1] tracking-[-0.035em] text-navy sm:text-4xl",
          align === "center" && "max-w-3xl",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "text-base leading-relaxed text-stone-600 sm:text-lg",
            align === "center" && "max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
