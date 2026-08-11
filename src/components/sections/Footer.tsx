import { BrandMark } from "@/components/BrandMark";
import { ImpressumDialog } from "@/components/ImpressumDialog";
import { PrivacyDialog } from "@/components/PrivacyDialog";
import { EmailLink, PhoneLink, WhatsappTextLink } from "@/components/cta";
import { footerLinks, siteConfig } from "@/data/site";
import { MapPin } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="container-lp py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark className="size-10" />
              <span className="text-lg font-bold text-navy">
                {siteConfig.name}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-500">
              IXA baut messbare Anfrage-Systeme für lokale
              Dienstleistungsbetriebe in Nürnberg und Franken.
            </p>
          </div>

          <nav aria-label="Footer-Links">
            <h3 className="text-sm font-bold text-navy">Links</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="focus-ring rounded-md text-stone-500 transition-colors hover:text-primary"
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

          <div>
            <h3 className="text-sm font-bold text-navy">Kontakt</h3>
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
              <li className="flex items-center gap-2 text-stone-500">
                <MapPin className="size-4 text-primary" />
                {siteConfig.contact.location}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-6 text-sm text-stone-500 sm:flex-row">
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
