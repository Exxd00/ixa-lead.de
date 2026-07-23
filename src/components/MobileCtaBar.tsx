"use client";

import { MessageCircle } from "lucide-react";
import { CtaButton } from "@/components/cta";
import { track, buildWhatsappUrl } from "@/lib/tracking";

/**
 * Untere CTA-Leiste — nur auf Mobil/Tablet sichtbar (ab lg ausgeblendet).
 */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <CtaButton
          event="hero_cta_click"
          location="mobile_bar"
          size="lg"
          className="flex-1"
        >
          Erstanalyse
        </CtaButton>
        <a
          href={buildWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Über WhatsApp kontaktieren"
          onClick={() => track("whatsapp_click", { location: "mobile_bar" })}
          className="focus-ring inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-success-500 font-semibold text-white shadow-soft transition-colors hover:bg-success-600"
        >
          <MessageCircle className="size-5" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
