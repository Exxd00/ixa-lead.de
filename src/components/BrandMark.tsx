import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  alt = "",
  priority = false,
  sizes = "40px",
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl bg-black",
        className,
      )}
    >
      <Image
        src="/brand/ixa-mark.webp"
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </span>
  );
}
