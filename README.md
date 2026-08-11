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
im Tabellenblatt `Anfragen` ab. `setupSheets()` erstellt und formatiert die
farbigen Spaltenköpfe, Statusauswahl und Kontrollfelder. Zusätzlich entsteht
das getrennte Tabellenblatt `Conversions` für die vier freigegebenen
Haupt-Conversions. Ein vorhandenes Tabellenblatt `Leads` bleibt als Archiv
unverändert. Sichtbar gespeichert werden Formularangaben, Eingangszeit, GCLID
und Felder für die spätere persönliche Bearbeitung. Technische IDs liegen
ausschließlich zur Vermeidung von Doppeleinträgen in ausgeblendeten Spalten.

Nach dem Einfügen oder Aktualisieren des Apps Scripts:

1. In den Script Properties `SPREADSHEET_ID` und `WEBHOOK_SECRET` hinterlegen.
2. `setupSheets()` einmal manuell ausführen und die Berechtigungen bestätigen.
3. Unter **Deploy → Manage deployments → Edit → New version** neu bereitstellen.
4. Die Web-App-URL mit `/exec` als `LEAD_WEBHOOK_URL` in Vercel verwenden. Der
   Google-Sheets-Link selbst gehört nicht in Vercel.

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
ausdrücklichen Statistik-Einwilligung des Besuchers. Dasselbe gilt für das
Conversion-Protokoll ohne Namen, Telefonnummern, E-Mail-Adressen oder
Nachrichten in Google Sheets. Google Ads ist weiterhin
deaktiviert. GA4 und GTM dürfen nicht parallel für denselben Page View
konfiguriert werden.

## Vor Veröffentlichung

- Falls vorhanden, USt-IdNr oder Wirtschafts-Identifikationsnummer im Impressum ergänzen.
- Vollständige Datenschutzerklärung prüfen lassen.
- Formular bis zum Zielsystem Ende-zu-Ende testen.
- Resend-Domain und Google-Apps-Script-Web-App vollständig verifizieren.
- Echte Gründer- und Projektbilder ergänzen, sobald sie vorliegen.

## Ergebnis- und Audit-Dokumentation

Die geprüften Lead-Sheet-/GA4-Zahlen, ihre genaue Bedeutung und die Bewertung aller neun Projekte stehen in [`docs/portfolio-audit-2026-07-29.md`](docs/portfolio-audit-2026-07-29.md).
