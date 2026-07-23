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

export function PrivacyDialog({
  className,
  label = "Datenschutz",
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
          <DialogTitle className="text-xl text-navy">Datenschutz</DialogTitle>
          <DialogDescription>
            Kurze Übersicht, wie die Daten aus dem Kontaktformular verwendet werden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <div>
            <h3 className="mb-1 font-bold text-navy">Welche Daten wir erheben</h3>
            <p>
              Name, Kontaktweg (Telefon oder E-Mail), Link zur Website oder
              Landingpage sowie Beschreibung von Problem und gewünschter Leistung.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Wie wir Ihre Daten verwenden</h3>
            <p>
              Ausschließlich zur Kontaktaufnahme bezüglich Ihrer Anfrage. Wir
              verkaufen Ihre Daten nicht und geben sie nicht zu Marketingzwecken an
              Dritte weiter.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Mess-Tools</h3>
            <p>
              Die Website kann Tools wie Google Analytics 4 und Google Tag Manager
              nutzen, um die Leistung zu verstehen und die Erfahrung zu verbessern.
              Anzeigen-Tracking lässt sich nach Ihren Einstellungen konfigurieren.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Ihre Rechte</h3>
            <p>
              Sie können Ihre Daten jederzeit über die angegebenen Kontaktwege
              korrigieren oder löschen lassen.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Kontakt zum Datenschutz</h3>
            <p>{siteConfig.contact.emailDisplay}</p>
          </div>

          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
            Dies ist eine kurze, anpassbare Übersicht – ersetzen Sie sie durch Ihre
            vollständige, rechtsgültige Datenschutzerklärung.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
