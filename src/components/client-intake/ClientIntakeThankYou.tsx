"use client";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  hasAnalyticsConsent,
  openAnalyticsConsentSettings,
  analyticsConsentChangeEvent,
} from "@/lib/consent";
import { INTAKE_EVENT } from "@/lib/client-intake";
import styles from "./client-intake.module.css";

export function ClientIntakeThankYou({ reference }: { reference: string }) {
  useEffect(() => {
    let inFlight = false;
    let finished = false;
    async function record() {
      if (
        finished ||
        inFlight ||
        !hasAnalyticsConsent() ||
        !window.ixaAnalyticsReady ||
        !window.gtag
      )
        return;
      inFlight = true;
      try {
        const response = await fetch("/api/client-intake/complete", {
          method: "POST",
          headers: { "X-IXA-Statistics": "granted" },
          cache: "no-store",
        });
        if (!response.ok) return;
        const result = await response.json();
        if (result.ok !== true) return;
        finished = true;
        if (result.sendEvent === true && hasAnalyticsConsent())
          window.gtag("event", INTAKE_EVENT, {
            form_id: "client_intake",
            project_stage: "agreed",
            page_location: `${window.location.origin}/info/danke`,
            page_referrer: "",
          });
      } catch {
        /* Optional statistics must never block the confirmation. */
      } finally {
        inFlight = false;
      }
    }
    const handle = () => {
      void record();
    };
    window.addEventListener("ixa:analytics-ready", handle);
    window.addEventListener(analyticsConsentChangeEvent, handle);
    handle();
    return () => {
      window.removeEventListener("ixa:analytics-ready", handle);
      window.removeEventListener(analyticsConsentChangeEvent, handle);
    };
  }, []);
  return (
    <section className={styles.success}>
      <span className={styles.successIcon}>
        <CheckCircle2 size={36} aria-hidden="true" />
      </span>
      <p className={styles.eyebrow}>Erfolgreich übermittelt</p>
      <h1>Danke. Die Grundlage für Ihre Website ist da.</h1>
      <p>
        Ihre Angaben sind bei IXA angekommen. Wir prüfen jetzt die Informationen
        und bereiten die nächsten Schritte Ihres vereinbarten Website-Projekts
        vor.
      </p>
      <p>
        Falls Angaben oder Materialien fehlen, melden wir uns gezielt bei Ihnen.
        Sie müssen den Fragebogen nicht noch einmal senden.
      </p>
      <p className={styles.reference}>Ihre Referenz: {reference}</p>
      <a href="mailto:info@ixa-leads.de" className={styles.secondaryLink}>
        Ergänzung an IXA senden
      </a>
      <div>
        <button
          className={styles.backButton}
          type="button"
          onClick={openAnalyticsConsentSettings}
        >
          Statistik-Einstellungen
        </button>
      </div>
    </section>
  );
}
