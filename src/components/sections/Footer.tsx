import { MapPin } from "lucide-react";
import { PhoneLink, EmailLink, WhatsappTextLink } from "@/components/cta";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { ImpressumDialog } from "@/components/ImpressumDialog";
import { siteConfig, footerLinks } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-lp py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1.4fr]">
          {/* العلامة */}
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-navy text-sm font-bold tracking-tight text-white">
                IX
              </span>
              <span className="text-lg font-bold text-navy">{siteConfig.name}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Digitale Kundengewinnungs-Systeme für lokale Unternehmen in Nürnberg
              und Franken – Website, Werbung, Tracking und Automation aus einer
              Hand.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer-Links">
            <h4 className="text-sm font-bold text-navy">Links</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="focus-ring rounded-md text-slate-500 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <PrivacyDialog />
              </li>
              <li>
                <ImpressumDialog />
              </li>
            </ul>
          </nav>

          {/* Kontakt */}
          <div>
            <h4 className="text-sm font-bold text-navy">Kontakt</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <PhoneLink location="footer" />
              </li>
              <li>
                <WhatsappTextLink location="footer" />
              </li>
              <li>
                <EmailLink location="footer" />
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <MapPin className="size-4 text-primary" />
                {siteConfig.contact.location}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>
            © {year} {siteConfig.name}. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-5">
            <PrivacyDialog label="Datenschutz" />
            <ImpressumDialog label="Impressum" />
          </div>
        </div>
      </div>
    </footer>
  );
}
