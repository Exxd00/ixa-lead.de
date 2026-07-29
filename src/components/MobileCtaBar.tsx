"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { track, buildWhatsappUrl } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

/**
 * Kompaktes, schwebendes Kontakt-Dock für Mobil/Tablet.
 * Es bleibt bewusst schmaler als der Viewport und verschwindet am Formular,
 * im Footer sowie bei geöffneter Bildschirmtastatur.
 */
export function MobileCtaBar() {
  const [isCoveredContentVisible, setIsCoveredContentVisible] = useState(true);
  const [isFieldFocused, setIsFieldFocused] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("home");
    const contact = document.getElementById("contact");
    const footer = document.querySelector("footer");
    const avoidTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-floating-cta-avoid]"),
    );
    const coveredTargets = [hero, contact, footer, ...avoidTargets].filter(
      (target): target is HTMLElement => Boolean(target),
    );
    const visibleTargets = new Set<Element>();
    const observer =
      coveredTargets.length > 0 && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) visibleTargets.add(entry.target);
                else visibleTargets.delete(entry.target);
              }
              setIsCoveredContentVisible(visibleTargets.size > 0);
            },
            { threshold: 0.05 },
          )
        : null;

    if (observer) {
      for (const target of coveredTargets) observer.observe(target);
    } else {
      setIsCoveredContentVisible(false);
    }

    const isFormField = (element: Element | null) =>
      element?.matches(
        "input, textarea, select, [contenteditable='true'], [role='textbox']",
      ) ?? false;

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && isFormField(event.target)) {
        setIsFieldFocused(true);
      }
    };

    const handleFocusOut = () => {
      window.requestAnimationFrame(() => {
        setIsFieldFocused(isFormField(document.activeElement));
      });
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      observer?.disconnect();
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const isHidden = isCoveredContentVisible || isFieldFocused;

  return (
    <div
      aria-hidden={isHidden}
      className={cn(
        "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 transition-[transform,opacity] duration-200 ease-out lg:hidden",
        isHidden
          ? "pointer-events-none translate-y-4 scale-95 opacity-0"
          : "translate-y-0 scale-100 opacity-100",
      )}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-card backdrop-blur-md">
        <a
          href={siteConfig.contact.phoneHref}
          tabIndex={isHidden ? -1 : undefined}
          aria-label={`${siteConfig.contact.phoneDisplay} anrufen`}
          onClick={() => track("phone_click", { location: "mobile_bar" })}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-navy/90"
        >
          <Phone className="size-5" aria-hidden="true" />
          Anrufen
        </a>
        <a
          href={buildWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={isHidden ? -1 : undefined}
          aria-label="Über WhatsApp kontaktieren"
          onClick={() => track("whatsapp_click", { location: "mobile_bar" })}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success-700 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-success-800"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
