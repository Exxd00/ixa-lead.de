"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/data/site";

/* =====================================================================
   ⚠️ Impressum unvollständig — USt-IdNr fehlt, ebenso die ladungsfähige
   Anschrift. Vor Live-Schaltung mit Steuerberater/Anwalt klären und die
   Platzhalter ("wird nachgereicht") durch rechtsgültige Angaben ersetzen.
   Ein vollständiges Impressum ist nach § 5 DDG (ehem. TMG) Pflicht.
   ===================================================================== */

export function ImpressumDialog({
  className,
  label = "Impressum",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus-ring rounded-md text-slate-500 transition-colors hover:text-primary",
            className,
          )}
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-navy">Impressum</DialogTitle>
          <DialogDescription>
            Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <div>
            <h3 className="mb-1 font-bold text-navy">Anbieter</h3>
            <p>
              {siteConfig.owner}
              <br />
              {siteConfig.name}
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-bold text-navy">Anschrift</h3>
            <p className="italic text-slate-500">
              Ladungsfähige Anschrift wird nachgereicht.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-bold text-navy">Kontakt</h3>
            <p dir="ltr">
              E-Mail: {siteConfig.contact.emailDisplay}
              <br />
              Telefon / WhatsApp: {siteConfig.contact.phoneDisplay}
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-bold text-navy">Umsatzsteuer-ID</h3>
            <p className="italic text-slate-500">
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: wird
              nachgereicht.
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-bold text-navy">
              Verantwortlich für den Inhalt
            </h3>
            <p>{siteConfig.owner}</p>
          </div>

          <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            Hinweis: Dieses Impressum ist noch unvollständig (Anschrift und
            USt-IdNr fehlen). Vor der Live-Schaltung bitte mit Steuerberater bzw.
            Anwalt vervollständigen.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
