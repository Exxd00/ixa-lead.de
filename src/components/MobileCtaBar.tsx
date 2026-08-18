"use client";

import { CallbackRequestDialog } from "@/components/CallbackRequestDialog";
import { WhatsappConfirmDialog } from "@/components/WhatsappConfirmDialog";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsappFloat";

/** Zwei dauerhaft sichtbare, schwebende Kontaktwege für Mobil und Tablet. */
export function MobileCtaBar() {
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 lg:hidden">
      <div className="flex flex-col items-center gap-2">
        <CallbackRequestDialog location="mobile_bar">
          <button
            type="button"
            aria-label="Rückruf oder direkten Anruf auswählen"
            className="focus-ring liquid-float grid size-12 place-items-center rounded-full transition-all"
          >
            <Phone className="size-5" aria-hidden="true" />
            <span className="sr-only">Rückruf</span>
          </button>
        </CallbackRequestDialog>
        <WhatsappConfirmDialog location="mobile_bar">
          <button
            type="button"
            aria-label="Über WhatsApp kontaktieren"
            className="focus-ring liquid-float grid size-12 place-items-center rounded-full transition-all"
          >
            <WhatsAppIcon className="size-6" />
            <span className="sr-only">WhatsApp</span>
          </button>
        </WhatsappConfirmDialog>
      </div>
    </div>
  );
}
