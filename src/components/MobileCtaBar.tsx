"use client";

import { CallbackRequestDialog } from "@/components/CallbackRequestDialog";
import { buildWhatsappUrl, track } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Zwei kompakte, schwebende Kontakt-Buttons für Mobil/Tablet.
 * Sie verschwinden am Formular,
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
        "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 transition-[transform,opacity] duration-200 ease-out lg:hidden",
        isHidden
          ? "pointer-events-none translate-y-4 scale-95 opacity-0"
          : "translate-y-0 scale-100 opacity-100",
      )}
    >
      <div className="flex items-center gap-2">
        <CallbackRequestDialog location="mobile_bar">
          <button
            type="button"
            tabIndex={isHidden ? -1 : undefined}
            aria-label="Rückruf oder direkten Anruf auswählen"
            className="focus-ring grid size-12 place-items-center rounded-full border-2 border-white bg-navy text-white shadow-card transition-colors hover:bg-navy/90"
          >
            <Phone className="size-5" aria-hidden="true" />
            <span className="sr-only">Rückruf</span>
          </button>
        </CallbackRequestDialog>
        <a
          href={buildWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={isHidden ? -1 : undefined}
          aria-label="Über WhatsApp kontaktieren"
          onClick={() => track("whatsapp_click", { location: "mobile_bar" })}
          className="focus-ring grid size-12 place-items-center rounded-full border-2 border-white bg-success-700 text-white shadow-card transition-colors hover:bg-success-800"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          <span className="sr-only">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
