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

Der Empfänger in `integrations/google-apps-script/Code.gs` legt Anfragen und
die freigegebene Kontaktmessung gemeinsam im Tabellenblatt `Anfragen` ab.
`setupSheets()` erstellt und formatiert diese eine menschenlesbare Übersicht
mit farbigen Spaltenköpfen, Statusauswahl und Kontrollfeldern. Formular- und
Rückrufangaben werden zur Bearbeitung der jeweiligen Anfrage gespeichert. Bei
erteilter Statistik-Einwilligung kommen für bestätigte Kontaktaktionen nur
Ereignis, Zeitpunkt, Seite und vorhandene Kampagnenparameter hinzu; dadurch
werden keine zusätzlichen Namen, Telefonnummern, E-Mail-Adressen oder
Nachrichten erhoben. Ein vorhandenes Tabellenblatt `Leads` bleibt als Archiv
unverändert. Die technische ID zur Vermeidung von Doppeleinträgen ist intern
und als ausgeblendete Spalte nicht Teil der sichtbaren Arbeitsansicht.

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
ausdrücklichen Statistik-Einwilligung des Besuchers. Dasselbe gilt für die
optionale Kontaktmessung im gemeinsamen Tabellenblatt `Anfragen`: Sie ergänzt
nur Ereignis-, Seiten- und Kampagnendaten und keine zusätzlichen Namen,
Telefonnummern, E-Mail-Adressen oder Nachrichten. Google Ads ist weiterhin
deaktiviert. GA4 und GTM dürfen nicht parallel für denselben Page View
konfiguriert werden.

Die internen Routen `/admin/*` und `/vorschau/*` sind vollständig von der
Messung ausgeschlossen. Die Vorschau verwendet nur synthetische Beispieldaten,
setzt `noindex`/`no-store` und öffnet keine Kontaktaktion.

## WhatsApp-Eingang sicher protokollieren

Der offizielle WhatsApp-Business-Platform-Webhook endet an
`/api/whatsapp/webhook`. Die Website prüft zuerst Metas
`X-Hub-Signature-256`, die richtige Business-Account-ID und die richtige
Phone-Number-ID. Danach geht nur ein HMAC-Beweis an Google Sheets. Der
Nachrichtentext wird erst übertragen, wenn entweder die internationale Nummer
exakt in `01 Prospects` steht oder die Nachricht den zufälligen `Public_Token`
eines gespeicherten Kontakts enthält. Eine kurze `Printed_Ref` allein öffnet
die Datenschutzschranke nicht.

Der Empfänger liegt bewusst in einem getrennten Apps-Script-Projekt unter
`integrations/ixa-outreach-webhook/`. Er schreibt ausschließlich in
`07 Inbound Queue`, verhindert Doppeleinträge über Metas Message-ID und sendet
keine Antwort. Nach 30 Tagen löscht ein täglicher Trigger Telefonnummer und
Nachrichtentext; technische IDs und Workflowstatus bleiben zur Deduplizierung
erhalten.

Einrichtung nach erfolgreichem Meta-Login:

1. Ein neues eigenständiges Apps-Script-Projekt mit `Code.gs` und
   `appsscript.json` aus `integrations/ixa-outreach-webhook/` anlegen.
2. In dessen Script Properties `OUTREACH_SPREADSHEET_ID` und ein langes
   zufälliges `WHATSAPP_WEBHOOK_SECRET` hinterlegen.
3. `setupWhatsAppInboundQueue()` einmal manuell ausführen. Dadurch werden das
   Sheet geprüft/formatiert und der tägliche Lösch-Trigger eingerichtet.
4. Als Web App ausführen als Besitzer und für „Anyone“ bereitstellen. Nur die
   `/exec`-URL unter `WHATSAPP_SHEET_WEBHOOK_URL` in Vercel hinterlegen; dasselbe
   Secret kommt in `WHATSAPP_SHEET_WEBHOOK_SECRET`.
5. In Vercel zusätzlich `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`,
   `WHATSAPP_PHONE_NUMBER_ID` und `WHATSAPP_BUSINESS_ACCOUNT_ID` setzen.
6. In Meta die Callback-URL
   `https://ixa-leads.de/api/whatsapp/webhook` mit dem Verify Token bestätigen
   und das Feld `messages` abonnieren.

Es wird absichtlich kein WhatsApp Access Token benötigt, weil der Dienst nur
empfängt, prüft und Entwürfe vorbereitet. Für eine strikte Trennung, bei der
private Familiennachrichten nicht einmal Metas Business-Webhook erreichen,
ist eine eigene geschäftliche Rufnummer erforderlich.

## Vor Veröffentlichung

- Falls vorhanden, USt-IdNr oder Wirtschafts-Identifikationsnummer im Impressum ergänzen.
- Vollständige Datenschutzerklärung prüfen lassen.
- Formular bis zum Zielsystem Ende-zu-Ende testen.
- Resend-Domain und Google-Apps-Script-Web-App vollständig verifizieren.
- Echte Gründer- und Projektbilder ergänzen, sobald sie vorliegen.

## Ergebnis- und Audit-Dokumentation

Die geprüften Lead-Sheet-/GA4-Zahlen, ihre genaue Bedeutung und die Bewertung aller neun Projekte stehen in [`docs/portfolio-audit-2026-07-29.md`](docs/portfolio-audit-2026-07-29.md).
