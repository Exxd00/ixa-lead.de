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
          {siteConfig.owner}, tätig unter {siteConfig.name}
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
        <h2>2. Erste persönliche Kontaktaufnahme per Geschäftsbrief</h2>
        <p className="mt-3">
          Wenn Sie von uns erstmals einen persönlichen Geschäftsbrief erhalten,
          informieren wir Sie damit gemäß Art. 14 DSGVO über die Verarbeitung
          Ihrer Daten. Der Brief nennt die konkret verwendeten öffentlich
          zugänglichen Quellen und deren Prüfdaten; diese Seite ergänzt die dort
          enthaltenen Pflichtinformationen.
        </p>
        <p className="mt-3">
          Zweck ist ausschließlich eine einmalige, sorgfältig ausgewählte
          B2B-Postansprache. Dafür prüfen wir, ob zwei aktuelle, dokumentierte
          Beobachtungen zum öffentlich sichtbaren Anfrageweg eines Betriebs für
          die verantwortliche Person beruflich relevant sein könnten. Wir stellen
          diese Beobachtungen vor und bieten einen freiwilligen vertieften Check
          oder ein kurzes Gespräch an. Ohne Ihre eigene Antwort entsteht keine
          WhatsApp-Kommunikation.
        </p>
        <p className="mt-3">
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unsere berechtigten
          Interessen sind die gezielte Anbahnung einer möglichen
          Geschäftsbeziehung und die Vorstellung einer konkret auf den Betrieb
          bezogenen Analyse. Vor jedem Brief prüfen wir dokumentiert Relevanz,
          Datenminimierung, Aktualität, die geschäftliche Funktion der
          angesprochenen Person, bekannte Widersprüche und die Belastung durch
          die Ansprache. Die Beschränkung auf einen Geschäftsbrief an die
          betriebliche Anschrift soll die Beeinträchtigung gering halten. Ihre
          Daten werden nicht verkauft.
        </p>
      </section>

      <section className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 sm:p-6">
        <h2>Widerspruch gegen Direktwerbung (Art. 21 Abs. 2 und 3 DSGVO)</h2>
        <p className="mt-3 font-semibold text-navy">
          Sie können der Verarbeitung Ihrer personenbezogenen Daten zu Zwecken
          der Direktwerbung jederzeit, kostenfrei und ohne Begründung
          widersprechen.
        </p>
        <p className="mt-3">
          Schreiben Sie an {" "}
          <a href={siteConfig.contact.emailHref}>
            {siteConfig.contact.emailDisplay}
          </a>
          , rufen Sie unter {siteConfig.contact.phoneDisplay} an oder senden Sie
          den Widerspruch an die oben genannte Postanschrift. Nach Eingang nutzen
          wir Ihre Daten nicht mehr für Direktwerbung. Wir halten dann nur einen
          möglichst kleinen Sperrvermerk vor, damit wir Sie nicht erneut
          anschreiben.
        </p>
      </section>

      <section>
        <h2>3. Datenkategorien und öffentliche Quellen</h2>
        <p className="mt-3">Für die beschriebene Postansprache verarbeiten wir:</p>
        <ul className="mt-3">
          <li>
            Name, geschäftliche Funktion, Unternehmen und betriebliche
            Postanschrift,
          </li>
          <li>
            geschäftliche Merkmale wie Branche, Leistungsgebiet und Standort,
          </li>
          <li>
            zwei fachliche Beobachtungen mit Quellen-URL und Prüfdatum sowie
          </li>
          <li>
            interne Vorgangs-, Versand-, Antwort- und Widerspruchsangaben.
          </li>
        </ul>
        <p className="mt-3">
          Quellen sind allgemein zugängliche geschäftliche Informationen:
          insbesondere offizielle Unternehmens- und Teamseiten außerhalb des
          Impressums, öffentlich gepflegte Unternehmensprofile oder
          Branchenverzeichnisse, berufliche Register und Suchergebnisse sowie
          unsere dokumentierte Prüfung öffentlich sichtbarer Website-Inhalte.
          Angaben, die ausschließlich im Impressum veröffentlicht sind, verwenden
          wir nicht als Quelle für die Werbeauswahl oder die Auswahl einer
          namentlich angesprochenen Person. Private Quellen und besondere
          Kategorien personenbezogener Daten werden hierfür nicht verwendet.
        </p>
      </section>

      <section>
        <h2>4. Persönliche Prüfseite und QR-Messung</h2>
        <p className="mt-3">
          Der Geschäftsbrief kann zu einer individuellen Prüfseite unter {" "}
          <code>/r</code> führen. Beim ersten Aufruf wird ausschließlich ein
          pseudonymes Ereignis mit der internen Bezeichnung {" "}
          <code>personal_page_visit</code> gespeichert. Es dient dazu, die
          Resonanz des konkreten Briefs zu messen. Rechtsgrundlage ist Art. 6
          Abs. 1 lit. f DSGVO; unser Interesse ist die zurückhaltende,
          aggregierbare Erfolgskontrolle der einmaligen Postansprache.
        </p>
        <p className="mt-3">
          Dabei übernehmen wir weder die IP-Adresse noch User-Agent, Referrer,
          den vollständigen Linkschlüssel oder den QR-Inhalt in die
          Kontaktübersicht. Auf <code>/r</code> sind Google Analytics, Google
          Ads und Vercel Analytics deaktiviert. Klicks auf die angebotenen
          Entscheidungen werden nicht als separates Werbeereignis gemessen.
        </p>
      </section>

      <section>
        <h2>5. Einfache Auswahlregeln, keine Entscheidung nach Art. 22 DSGVO</h2>
        <p className="mt-3">
          Wir verwenden begrenzte Auswahl- und Segmentierungsregeln, etwa zu
          Region, Branche, geschäftlicher Funktion, dokumentierter Relevanz und
          zulässigem Kontaktkanal. Das ist eine einfache Einschätzung der
          geschäftlichen Passung; die Freigabe wird von einem Menschen geprüft.
          Es findet keine ausschließlich automatisierte Entscheidung statt, die
          Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie ähnlich erheblich
          beeinträchtigt (Art. 22 DSGVO).
        </p>
      </section>

      <section>
        <h2>6. Empfänger, Auftragsverarbeiter und Dienste</h2>
        <p className="mt-3">
          Zugriff erhalten nur wir und, soweit für den jeweiligen Zweck nötig,
          technische Dienstleister. Dazu gehören Google Sheets und Google Apps
          Script für Kontakt- und Ablaufdaten, OpenAI/ChatGPT für unterstützte
          Recherche und Vorbereitung unter menschlicher Kontrolle, Vercel für
          Website und persönliche Prüfseiten, Resend für interne
          Benachrichtigungen zu Website-Anfragen sowie Hostinger für unsere
          geschäftliche E-Mail-Kommunikation. WhatsApp beziehungsweise Meta wird
          nur einbezogen, wenn Sie die WhatsApp-Kommunikation selbst starten. Je
          nach Dienst handeln Anbieter als Auftragsverarbeiter oder für einzelne
          Verarbeitungsschritte als eigenständig Verantwortliche.
        </p>
        <p className="mt-3">
          Einige Anbieter können Daten außerhalb der EU oder des EWR verarbeiten.
          Nach ihren veröffentlichten Datenschutz- und Transferhinweisen nutzen
          sie hierfür, soweit erforderlich, Angemessenheitsbeschlüsse
          einschließlich des EU-US Data Privacy Framework für zertifizierte
          Empfänger oder EU-Standardvertragsklauseln mit ergänzenden
          Schutzmaßnahmen. Welche Grundlage im Einzelfall einschlägig ist,
          richtet sich nach dem tatsächlich genutzten Dienst, Empfänger und
          Verarbeitungsort; diese Hinweise behaupten keinen nicht geprüften
          Einzelvertrag.
        </p>
        <ul className="mt-3 text-sm">
          <li>
            <a href="https://policies.google.com/privacy/frameworks?hl=de">
              Google: rechtliche Rahmenbedingungen für Datenübermittlungen
            </a>
          </li>
          <li>
            <a href="https://openai.com/policies/data-processing-addendum/">
              OpenAI: Hinweise zu internationalen Datenübermittlungen
            </a>
          </li>
          <li>
            <a href="https://vercel.com/legal/dpa">
              Vercel: Data Processing Addendum
            </a>
          </li>
          <li>
            <a href="https://www.hostinger.com/legal/privacy-policy">
              Hostinger: Datenschutzhinweise
            </a>
          </li>
          <li>
            <a href="https://resend.com/legal/dpa">
              Resend: Data Processing Addendum
            </a>
          </li>
          <li>
            <a href="https://www.whatsapp.com/legal/privacy-policy-eea">
              WhatsApp: Datenschutzhinweise für den EWR
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>7. WhatsApp-Kommunikation</h2>
        <p className="mt-3">
          Wenn Sie uns von sich aus über WhatsApp schreiben, verarbeitet
          WhatsApp Ireland Limited die Kommunikation nach den für WhatsApp
          geltenden Bedingungen. Unser System nimmt eingehende Nachrichten nur
          dann in unsere interne Kontaktübersicht auf, wenn die Telefonnummer
          einem bereits bekannten Geschäftskontakt oder einer vorherigen
          Ansprache eindeutig zugeordnet werden kann. Nachrichten unbekannter
          Nummern werden nicht in Google Sheets übernommen und lösen keine
          automatische Antwort aus.
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
        <h2>8. Anfragen und Rückrufwünsche</h2>
        <p className="mt-3">
          Wenn Sie ein Anfrage- oder Rückrufformular verwenden, verarbeiten wir
          die von Ihnen eingetragenen Angaben. Dazu können Name, Telefon oder
          E-Mail, Website, ausgewählte Leistung und Ihre Nachricht gehören. Wir
          nutzen diese Angaben, um Ihre Anfrage zu prüfen, zu beantworten und
          einen gewünschten Termin oder Rückruf vorzubereiten.
        </p>
        <p className="mt-3">
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die Verarbeitung
          zur Durchführung vorvertraglicher Maßnahmen auf Ihre Anfrage hin
          erforderlich ist. Im Übrigen erfolgt die Verarbeitung auf Grundlage
          unseres berechtigten Interesses an einer verlässlichen Bearbeitung von
          Geschäftsanfragen gemäß Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      </section>

      <section>
        <h2>9. Optionale Statistik auf regulären Seiten</h2>
        <p className="mt-3">
          Google Analytics 4, Vercel Web Analytics, Speed Insights und die
          optionale Kontaktmessung starten auf den regulären Seiten erst, wenn
          Sie „Statistik erlauben“ wählen. Die Rechtsgrundlage ist Ihre
          Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.
          Werbe- und Personalisierungsspeicher von Google bleiben deaktiviert.
        </p>
      </section>

      <section>
        <h2>10. Speicherdauer</h2>
        <p className="mt-3">
          Daten zur einmaligen Postansprache werden gelöscht, sobald der Zweck
          entfällt, und spätestens 365 Tage nach der letzten Aktivität erneut auf
          Erforderlichkeit geprüft und bei fehlendem Grund gelöscht. Eindeutig
          zugeordnete Telefonnummer und Nachrichtentext werden aus der internen
          Kontaktübersicht grundsätzlich nach 30 Tagen entfernt, sofern die
          Bearbeitung Ihrer Anfrage oder gesetzliche Pflichten keine längere
          Speicherung erfordern.
        </p>
        <p className="mt-3">
          Nach einem Widerspruch speichern wir nur einen minimalen Sperrvermerk,
          soweit und solange dies erforderlich ist, um eine erneute Ansprache
          zuverlässig zu verhindern. Gesetzliche Aufbewahrungspflichten und die
          Geltendmachung oder Abwehr von Rechtsansprüchen können im Einzelfall zu
          längeren Fristen führen.
        </p>
      </section>

      <section>
        <h2>11. Ihre Rechte</h2>
        <p className="mt-3">
          Sie können Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung und, soweit anwendbar, Datenübertragbarkeit verlangen.
          Einer Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO können
          Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
          widersprechen. Für Direktwerbung gilt zusätzlich das oben
          hervorgehobene jederzeitige Widerspruchsrecht ohne Begründung. Eine
          erteilte Einwilligung können Sie jederzeit für die Zukunft widerrufen.
          Außerdem können Sie sich bei einer zuständigen
          Datenschutzaufsichtsbehörde beschweren.
        </p>
        <p className="mt-3">
          Für eine Löschanfrage folgen Sie bitte den {" "}
          <a href="/datenloeschung">Hinweisen zur Datenlöschung</a>.
        </p>
      </section>

      <p className="border-t border-stone-200 pt-6 text-sm text-stone-500">
        Stand: 31. August 2026
      </p>
    </LegalPageShell>
  );
}
