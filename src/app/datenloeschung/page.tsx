import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: `Datenlöschung | ${siteConfig.name}`,
  description: `So können Sie die Löschung Ihrer bei ${siteConfig.name} gespeicherten Daten anfordern.`,
  alternates: {
    canonical: `${siteConfig.seo.url}/datenloeschung`,
  },
};

export default function DatenloeschungPage() {
  return (
    <LegalPageShell
      eyebrow="Datenschutz"
      title="Datenlöschung anfordern"
      intro="Sie können jederzeit die Löschung Ihrer bei IXA-Leads gespeicherten personenbezogenen Daten anfordern."
    >
      <section>
        <h2>So stellen Sie Ihre Anfrage</h2>
        <p className="mt-3">
          Senden Sie eine E-Mail mit dem Betreff „Datenlöschung“ an {" "}
          <a href={siteConfig.contact.emailHref}>
            {siteConfig.contact.emailDisplay}
          </a>
          . Nennen Sie bitte nur die Telefonnummer oder E-Mail-Adresse, über die
          Sie mit uns Kontakt hatten, damit wir den richtigen Datensatz sicher
          zuordnen können.
        </p>
      </section>

      <section>
        <h2>Was wir anschließend tun</h2>
        <ul className="mt-3">
          <li>Wir bestätigen den Eingang Ihrer Anfrage.</li>
          <li>
            Wir prüfen, in welchen Anfrage-, Kontakt- oder WhatsApp-Datensätzen
            Ihre Angaben gespeichert sind.
          </li>
          <li>
            Wir löschen oder anonymisieren die zugeordneten personenbezogenen
            Daten, soweit keine gesetzliche Pflicht zur weiteren Aufbewahrung
            besteht.
          </li>
          <li>
            Wir informieren Sie nach Abschluss oder erläutern, falls einzelne
            Daten aus rechtlichen Gründen vorübergehend weiter gespeichert
            werden müssen.
          </li>
        </ul>
      </section>

      <section>
        <h2>Bearbeitungszeit</h2>
        <p className="mt-3">
          Wir bearbeiten Löschanfragen grundsätzlich unverzüglich und spätestens
          innerhalb der gesetzlichen Frist. Wenn wir zusätzliche Angaben zur
          sicheren Identifizierung benötigen, fragen wir gezielt danach.
        </p>
      </section>

      <section>
        <h2>Hinweis zu WhatsApp</h2>
        <p className="mt-3">
          Diese Anfrage löscht Daten in den von IXA-Leads kontrollierten
          Systemen. Für Daten, die WhatsApp beziehungsweise Meta eigenständig
          verarbeitet, gelten zusätzlich die dortigen Datenschutz- und
          Löschverfahren.
        </p>
      </section>

      <section>
        <h2>Verantwortlicher Kontakt</h2>
        <p className="mt-3">
          {siteConfig.owner}, {siteConfig.name}
          <br />
          {siteConfig.contact.address.display}, Deutschland
          <br />
          <a href={siteConfig.contact.emailHref}>
            {siteConfig.contact.emailDisplay}
          </a>
        </p>
      </section>

      <p className="border-t border-stone-200 pt-6 text-sm text-stone-500">
        Stand: 26. August 2026
      </p>
    </LegalPageShell>
  );
}
