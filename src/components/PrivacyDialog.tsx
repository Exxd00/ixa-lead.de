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
import { openAnalyticsConsentSettings } from "@/lib/consent";

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
            "focus-ring rounded-md text-stone-500 transition-colors hover:text-primary",
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
            Wie wir Anfragen bearbeiten und optionale Statistikdienste
            einsetzen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-stone-600">
          <div>
            <h3 className="mb-1 font-bold text-navy">
              Welche Daten wir erheben
            </h3>
            <p>
              Wir verarbeiten die Angaben, die Sie im Anfrage- oder
              Rückrufformular eintragen. Dazu können Name, Telefon oder E-Mail,
              Website, ausgewählte Leistung und Ihre Nachricht gehören.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">
              Wie wir Ihre Daten verwenden
            </h3>
            <p>
              Wir nutzen diese Angaben, um Ihre Anfrage zu prüfen, zu
              beantworten und einen gewünschten Termin oder Rückruf
              vorzubereiten. Rechtsgrundlage ist die Durchführung
              vorvertraglicher Maßnahmen auf Ihre Anfrage hin (Art. 6 Abs. 1
              lit. b DSGVO). Ihre Daten werden nicht verkauft.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">
              Google Sheets und Resend
            </h3>
            <p>
              Nach dem Absenden werden die Anfrageangaben serverseitig in Google
              Sheets gespeichert. Resend versendet dazu eine Benachrichtigung
              per E-Mail an den Verantwortlichen. Diese Dienste werden nur zur
              Bearbeitung Ihrer Anfrage eingesetzt; Ihre Formularangaben werden
              nicht an die unten genannten Messdienste übermittelt.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Hosting</h3>
            <p>
              Die Website wird über Vercel bereitgestellt. Dabei verarbeitet
              Vercel technisch erforderliche Verbindungs- und Sicherheitsdaten,
              um die Website auszuliefern und vor Missbrauch zu schützen. Diese
              Verarbeitung ist für den Betrieb der Website erforderlich.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Optionale Statistik</h3>
            <p>
              Google Analytics 4 (Google Ireland Limited) sowie Vercel Web
              Analytics und Speed Insights helfen uns, Nutzung und technische
              Leistung der Website zu verstehen. Diese Dienste starten erst,
              wenn Sie „Statistik erlauben“ wählen. Die Rechtsgrundlage ist Ihre
              Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG).
              Werbe- und Personalisierungsspeicher von Google bleiben
              deaktiviert.
            </p>
            <button
              className="focus-ring mt-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-navy transition-colors hover:bg-stone-50"
              onClick={openAnalyticsConsentSettings}
              type="button"
            >
              Statistik-Einstellungen ändern
            </button>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">
              Speicherung und Widerruf
            </h3>
            <p>
              Ihre Statistik-Auswahl wird lokal auf Ihrem Gerät gespeichert. Sie
              können sie jederzeit über den Button oben ändern. Anfragedaten
              speichern wir nur so lange, wie sie für die Bearbeitung und
              gesetzliche Aufbewahrungspflichten erforderlich sind.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">Ihre Rechte</h3>
            <p>
              Sie können Auskunft, Berichtigung, Löschung, Einschränkung oder
              Datenübertragbarkeit verlangen und einer Verarbeitung
              widersprechen. Außerdem können Sie sich bei einer zuständigen
              Datenschutzaufsichtsbehörde beschweren.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-navy">
              Kontakt zum Datenschutz
            </h3>
            <p>{siteConfig.contact.emailDisplay}</p>
          </div>

          <p className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-500">
            Verantwortlich: {siteConfig.owner}, {siteConfig.name},{" "}
            {siteConfig.contact.address.display} ({
              siteConfig.contact.address.type
            }). Weitere Anbieterangaben finden Sie im Impressum.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
