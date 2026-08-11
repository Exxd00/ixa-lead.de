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

/* Falls eine USt-IdNr oder Wirtschafts-Identifikationsnummer vorliegt,
   muss sie gemäß § 5 DDG zusätzlich ergänzt werden. */

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
            "focus-ring rounded-md text-stone-500 transition-colors hover:text-primary",
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

        <div className="space-y-4 text-sm leading-relaxed text-stone-600">
          <div>
            <h3 className="mb-1 font-bold text-navy">Anbieter</h3>
            <p>
              {siteConfig.owner}
              <br />
              {siteConfig.name}
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-bold text-navy">
              Geschäftsanschrift
            </h3>
            <p>
              {siteConfig.contact.address.street}
              <br />
              {siteConfig.contact.address.postalCode}{" "}
              {siteConfig.contact.address.city}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {siteConfig.contact.address.type} ·{" "}
              {siteConfig.contact.address.appointmentNote}
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
            <h3 className="mb-1 font-bold text-navy">Umsatzsteuer</h3>
            <p>
              Die Umsätze sind gemäß § 19 Abs. 1 UStG umsatzsteuerfrei
              (Kleinunternehmerregelung).
            </p>
          </div>

          <div>
            <h3 className="mb-1 font-bold text-navy">
              Verantwortlich für den Inhalt
            </h3>
            <p>{siteConfig.owner}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
