import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: `Datenschutz | ${siteConfig.name}`,
  description: `Datenschutzhinweise von ${siteConfig.name}.`,
  alternates: {
    canonical: `${siteConfig.seo.url}/datenschutz`,
  },
};

export default function DatenschutzPage() {
  return (
    <LegalPageShell
      eyebrow="Rechtliches"
      title="Datenschutz"
      intro="Hier erfahren Sie, welche Daten IXA-Leads verarbeitet, wofür sie verwendet werden und welche Rechte Sie haben."
    >
      <section>
        <h2>1. Verantwortlicher</h2>
        <p className="mt-3">
          {siteConfig.owner}, {siteConfig.name}
          <br />
          {siteConfig.contact.address.display}, Deutschland
          <br />
          E-Mail: {" "}
          <a href={siteConfig.contact.emailHref}>
            {siteConfig.contact.emailDisplay}
          </a>
          <br />
          Telefon: {siteConfig.contact.phoneDisplay}
        </p>
      </section>

      <section>
        <h2>2. Anfragen und Rückrufwünsche</h2>
        <p className="mt-3">
          Wenn Sie ein Anfrage- oder Rückrufformular verwenden, verarbeiten wir
          die von Ihnen eingetragenen Angaben. Dazu können Name, Telefon oder
          E-Mail, Website, ausgewählte Leistung und Ihre Nachricht gehören. Wir
          nutzen diese Angaben ausschließlich, um Ihre Anfrage zu prüfen, zu
          beantworten und einen gewünschten Termin oder Rückruf vorzubereiten.
        </p>
        <p className="mt-3">
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die Verarbeitung
          zur Durchführung vorvertraglicher Maßnahmen auf Ihre Anfrage hin
          erforderlich ist. Im Übrigen erfolgt die Verarbeitung auf Grundlage
          unseres berechtigten Interesses an einer verlässlichen Bearbeitung von
          Geschäftsanfragen gemäß Art. 6 Abs. 1 lit. f DSGVO. Ihre Daten werden
          nicht verkauft.
        </p>
      </section>

      <section>
        <h2>3. WhatsApp-Kommunikation</h2>
        <p className="mt-3">
          Wenn Sie uns über WhatsApp schreiben, verarbeitet Meta Platforms
          Ireland Limited die Kommunikation nach den für WhatsApp geltenden
          Bedingungen. Unser System nimmt eingehende Nachrichten nur dann in
          unsere interne Kontaktübersicht auf, wenn die Telefonnummer einem
          bereits bekannten Geschäftskontakt oder einer vorherigen Ansprache
          eindeutig zugeordnet werden kann. Nachrichten unbekannter Nummern
          werden nicht in Google Sheets übernommen und lösen keine automatische
          Antwort aus.
        </p>
        <p className="mt-3">
          Bei einer zulässigen Zuordnung können Telefonnummer, Zeitpunkt,
          Nachrichtentyp, Nachrichtentext und interne Kontaktreferenz gespeichert
          werden, damit wir Ihre Antwort bearbeiten und den Verlauf der Ansprache
          korrekt zuordnen können. Telefonnummer und Nachrichtentext werden in
          dieser Übersicht spätestens nach 30 Tagen automatisiert entfernt,
          sofern keine längere Aufbewahrung zur Bearbeitung Ihrer Anfrage oder
          aufgrund gesetzlicher Pflichten erforderlich ist.
        </p>
      </section>

      <section>
        <h2>4. Persönliche Prüfseiten</h2>
        <p className="mt-3">
          Für einzelne Geschäftskontakte können wir eine persönliche Prüfseite
          mit einem nicht erratbaren Link bereitstellen. Beim Aufruf speichern
          wir einmalig ein technisches Besuchsereignis zur Zuordnung der
          Ansprache. Dabei werden über diese Funktion weder IP-Adresse noch
          User-Agent, Referrer oder der vollständige Linkschlüssel in der
          Kontaktübersicht gespeichert. Auf diesen Seiten sind Google Analytics,
          Google Ads und Vercel Analytics deaktiviert.
        </p>
      </section>

      <section>
        <h2>5. Google Sheets, E-Mail und Hosting</h2>
        <p className="mt-3">
          Anfrageangaben und zulässig zugeordnete Kontaktvorgänge werden
          serverseitig in Google Sheets gespeichert. Für Benachrichtigungen über
          neue Website-Anfragen kann Resend eingesetzt werden. Die Website wird
          über Vercel bereitgestellt; Vercel verarbeitet technisch erforderliche
          Verbindungs- und Sicherheitsdaten, um die Website auszuliefern und vor
          Missbrauch zu schützen.
        </p>
      </section>

      <section>
        <h2>6. Optionale Statistik</h2>
        <p className="mt-3">
          Google Analytics 4, Vercel Web Analytics, Speed Insights und die
          optionale Kontaktmessung starten auf den regulären Seiten erst, wenn
          Sie „Statistik erlauben“ wählen. Die Rechtsgrundlage ist Ihre
          Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.
          Werbe- und Personalisierungsspeicher von Google bleiben deaktiviert.
        </p>
      </section>

      <section>
        <h2>7. Speicherdauer</h2>
        <p className="mt-3">
          Wir speichern personenbezogene Daten nur so lange, wie sie für den
          jeweiligen Zweck erforderlich sind oder gesetzliche
          Aufbewahrungspflichten bestehen. Nicht mehr erforderliche Daten werden
          gelöscht oder anonymisiert.
        </p>
      </section>

      <section>
        <h2>8. Ihre Rechte</h2>
        <p className="mt-3">
          Sie können Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung und Datenübertragbarkeit verlangen. Sie können einer auf
          berechtigten Interessen beruhenden Verarbeitung widersprechen und eine
          erteilte Einwilligung jederzeit für die Zukunft widerrufen. Außerdem
          können Sie sich bei einer zuständigen Datenschutzaufsichtsbehörde
          beschweren.
        </p>
        <p className="mt-3">
          Für eine Löschanfrage folgen Sie bitte den {" "}
          <a href="/datenloeschung">Hinweisen zur Datenlöschung</a>.
        </p>
      </section>

      <p className="border-t border-stone-200 pt-6 text-sm text-stone-500">
        Stand: 26. August 2026
      </p>
    </LegalPageShell>
  );
}
