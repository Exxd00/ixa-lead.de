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

Die internen Routen `/admin/*`, `/vorschau/*` und die persönlichen Seiten unter
`/r/*` sind vollständig von GA4, Google Ads, Vercel Analytics, Speed Insights,
Attribution und dem Consent-Banner ausgeschlossen. Die Vorschau verwendet nur
synthetische Beispieldaten, setzt `noindex`/`no-store`, öffnet keine
Kontaktaktion und erzeugt kein Besuchsereignis.

## Persönliche IXA-Check-Seiten

Ein gültiger `Public_Token` aus `01 Prospects` öffnet die dynamische Route
`/r/<Public_Token>`. Der Token wird nie an Apps Script gesendet: Der Server
überträgt ausschließlich einen HMAC-Beweis über seinen SHA-256-Hash. Ungültige,
doppelte, blockierte und abgelaufene Einträge liefern dieselbe allgemeine
404-Seite. Die Antworten sind dynamisch, nicht cachebar, nicht indexierbar,
dürfen nicht eingebettet werden und senden keinen Referrer.

`setupWhatsAppInboundQueue()` ergänzt in `01 Prospects` ausschließlich die
leeren optionalen Spalten `Public_Page_Label` und
`Public_Page_Expires_UTC`; vorhandene Daten werden nicht überschrieben.
`Public_Page_Label` ist der einzige CRM-Inhalt, der nach manueller Pflege auf
der Kundenseite erscheinen darf. Ist er leer, bleibt die Ansprache neutral.
Namen aus anderen CRM-Spalten werden niemals automatisch veröffentlicht. Ein
leeres Ablaufdatum lässt den Link aktiv; ein vorhandener Wert muss ein
zukünftiger ISO-UTC-Zeitpunkt sein.

Nach erfolgreicher Auflösung stellt Apps Script eine kurzlebige, opaque
Besuchsticket-Nonce aus. Sie enthält keine Firmen-, Kontakt- oder Token-Daten.
Erst wenn die Seite 1–1,5 Sekunden sichtbar war, sendet der Browser dieses
Ticket an `/api/outreach/visit`. Apps Script prüft Signatur und Ablauf,
verhindert Nonce-Wiederholungen und schreibt in `08 Outreach Events` genau:
`personal_page_visit`, UTC-Zeit, interne Company-ID, interne Contact-ID und den
SHA-256-Tokenhash. IP-Adresse, User-Agent, Referrer, Nachricht und roher Token
werden weder übertragen noch in diesem Ereignisblatt gespeichert.

Die WhatsApp-Schaltfläche nimmt immer denselben persönlichen `/r/`-Link in den
vorbereiteten Text auf. `OUTREACH_WHATSAPP_NUMBER` kann serverseitig gesetzt
werden; ohne den Wert wird die bereits in `src/data/site.ts` gepflegte
Website-Nummer verwendet. `OUTREACH_PUBLIC_BASE_URL` ist optional und fällt auf
`https://ixa-leads.de` zurück. Für einen getrennten Apps-Script-Empfänger können
`OUTREACH_SHEET_WEBHOOK_URL` und `OUTREACH_SHEET_WEBHOOK_SECRET` gesetzt werden;
sonst werden die vorhandenen `WHATSAPP_SHEET_WEBHOOK_*`-Werte verwendet.

## WhatsApp-Eingang sicher protokollieren

Der offizielle WhatsApp-Business-Platform-Webhook endet an
`/api/whatsapp/webhook`. Die Website prüft zuerst Metas
`X-Hub-Signature-256`, die richtige Business-Account-ID und die richtige
Phone-Number-ID. Danach geht nur ein HMAC-Beweis an Google Sheets. Der
Nachrichtentext wird erst übertragen, wenn entweder die internationale Nummer
exakt in `01 Prospects` steht oder die Nachricht den zufälligen `Public_Token`
eines gespeicherten Kontakts enthält. Eine kurze `Printed_Ref` allein öffnet
die Datenschutzschranke nicht. Ein als `Blocked` markierter Kontakt wird schon
in dieser Prüfung abgewiesen; Telefonnummer und Nachrichtentext werden dann
nicht an den Sheet-Empfänger übertragen.

Der Empfänger liegt bewusst in einem getrennten Apps-Script-Projekt unter
`integrations/ixa-outreach-webhook/`. Er schreibt ausschließlich in
`07 Inbound Queue`, verhindert Doppeleinträge über Metas Message-ID und sendet
keine Antwort. Die Hash-Prüfung lädt `01 Prospects` einmal pro Batch und stellt
für zugelassene Nachrichten ein kurzlebiges, signiertes Speicherticket aus; so
muss der zweite Datenschutz-Schritt das Prospects-Sheet nicht erneut scannen.
Nach 30 Tagen ab dem tatsächlichen Speichereingang löscht ein täglicher Trigger
Telefonnummer und Nachrichtentext; Metas Absenderzeit bleibt separat sichtbar,
technische IDs und Workflowstatus bleiben zur Deduplizierung erhalten.

Einrichtung nach erfolgreichem Meta-Login:

1. Ein neues eigenständiges Apps-Script-Projekt mit `Code.gs` und
   `appsscript.json` aus `integrations/ixa-outreach-webhook/` anlegen.
2. In dessen Script Properties `OUTREACH_SPREADSHEET_ID` und ein langes
   zufälliges `WHATSAPP_WEBHOOK_SECRET` hinterlegen.
3. `setupWhatsAppInboundQueue()` einmal manuell ausführen. Dadurch werden das
   Inbound-Sheet und `08 Outreach Events` geprüft/formatiert, die optionalen
   persönlichen Seitenspalten ergänzt und der tägliche Lösch-Trigger
   eingerichtet. Bei einem Upgrade von Schema 1 ergänzt die Funktion die
   Spalte `Ingested_UTC` ohne vorhandene Zeilen zu löschen.
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
