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

Das Formular sendet an `/api/contact`. Damit eine Anfrage als erfolgreich bestätigt wird, muss `LEAD_WEBHOOK_URL` auf einen echten Webhook von Google Apps Script, Make, Zapier oder einem CRM zeigen.

```bash
cp .env.example .env.local
```

Ohne Webhook antwortet die API absichtlich mit `503`; dadurch sieht ein Besucher keine falsche Erfolgsmeldung und keine Anfrage geht still verloren.

## Tracking

Tracking bleibt in `src/data/site.ts` deaktiviert, bis echte IDs und eine passende Einwilligungslösung eingerichtet sind. GA4 und GTM nicht parallel für denselben Page View konfigurieren.

## Vor Veröffentlichung

- Ladungsfähige Anschrift und gegebenenfalls USt-IdNr im Impressum ergänzen.
- Vollständige Datenschutzerklärung prüfen lassen.
- Formular bis zum Zielsystem Ende-zu-Ende testen.
- Consent Management einrichten, bevor Analytics oder Ads-Tags aktiviert werden.
- Echte Gründer- und Projektbilder ergänzen, sobald sie vorliegen.

## Ergebnis- und Audit-Dokumentation

Die geprüften Lead-Sheet-/GA4-Zahlen, ihre genaue Bedeutung und die Bewertung aller neun Projekte stehen in [`docs/portfolio-audit-2026-07-29.md`](docs/portfolio-audit-2026-07-29.md).
