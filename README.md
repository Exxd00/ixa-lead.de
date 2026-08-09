# IXA Leads

Lead-Generation-Website für lokale Dienstleister in Nürnberg und Franken. Die Startseite verbindet Leistungsangebot, dokumentierte Portfolio-Ergebnisse und direkte Kontaktwege.

## Lokal starten

Voraussetzung: Node.js 20 (siehe `.nvmrc`).

```bash
npm install
npm run dev
```

Danach: [http://localhost:3000](http://localhost:3000)

Produktionsprüfung:

```bash
npm run lint
npm run build
npm run start
```

## Formular verbinden

Das Formular sendet an `/api/contact`. Eine Anfrage wird erst als erfolgreich
bestätigt, wenn die Google-Apps-Script-Web-App den gleichen `submissionId`
zurückgibt. Wiederholte Übertragungen mit derselben ID werden im Sheet nicht
doppelt angelegt.

```bash
cp .env.example .env.local
```

Für Google Sheets müssen `LEAD_WEBHOOK_URL` und `LEAD_WEBHOOK_SECRET` gesetzt
sein. Ohne diese Variablen antwortet die API absichtlich mit `503`; dadurch
sieht ein Besucher keine falsche Erfolgsmeldung und keine Anfrage geht still
verloren. Das identische Geheimnis wird als Script Property `WEBHOOK_SECRET`
im Apps-Script-Projekt hinterlegt und gehört niemals in eine
`NEXT_PUBLIC_...`-Variable.

Der Empfänger in `integrations/google-apps-script/Code.gs` legt neue Anfragen
im Tabellenblatt `Anfragen` ab. `setupSheet()` erstellt und formatiert die
farbigen Spaltenköpfe, Statusauswahl und Kontrollfelder. Ein vorhandenes
Tabellenblatt `Leads` bleibt als Archiv unverändert. Sichtbar gespeichert werden
Formularangaben, Eingangszeit, GCLID und Felder für die spätere persönliche
Bearbeitung. Die technische Eingang-ID liegt ausschließlich zur Vermeidung von
Doppeleinträgen in einer ausgeblendeten letzten Spalte.

Nach dem erfolgreichen Speichern sendet Resend eine interne Benachrichtigung.
Dafür werden `RESEND_API_KEY`, `RESEND_FROM_EMAIL` und
`LEAD_NOTIFICATION_EMAIL` benötigt. Ein vorübergehender Mailfehler lässt den
bereits im Sheet gespeicherten Lead nicht fehlschlagen. Die Resend-Anfrage
nutzt den `submissionId` intern als Idempotenzschlüssel. In der E-Mail selbst
erscheinen nur Eingangszeit, Formularangaben und – sofern vorhanden – die
GCLID.

## Tracking

Google Analytics 4 wird über `NEXT_PUBLIC_GA4_ID` konfiguriert. Google
Analytics, Vercel Web Analytics und Speed Insights starten erst nach der
ausdrücklichen Statistik-Einwilligung des Besuchers. Google Ads ist weiterhin
deaktiviert. GA4 und GTM dürfen nicht parallel für denselben Page View
konfiguriert werden.

## Vor Veröffentlichung

- Ladungsfähige Anschrift und gegebenenfalls USt-IdNr im Impressum ergänzen.
- Vollständige Datenschutzerklärung prüfen lassen.
- Formular bis zum Zielsystem Ende-zu-Ende testen.
- Resend-Domain und Google-Apps-Script-Web-App vollständig verifizieren.
- Echte Gründer- und Projektbilder ergänzen, sobald sie vorliegen.

## Ergebnis- und Audit-Dokumentation

Die geprüften Lead-Sheet-/GA4-Zahlen, ihre genaue Bedeutung und die Bewertung aller neun Projekte stehen in [`docs/portfolio-audit-2026-07-29.md`](docs/portfolio-audit-2026-07-29.md).
