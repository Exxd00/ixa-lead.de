"use client";

import { CallbackRequestDialog } from "@/components/CallbackRequestDialog";
import { CtaButton } from "@/components/cta";
import { freeCheckServiceId, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { label: "Ergebnisse", href: "#results" },
  { label: "System", href: "#services" },
  { label: "90 Tage", href: "#process" },
  { label: "Investition", href: "#packages" },
  { label: "Kontakt", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-navy/10 bg-[#fbfaf7]/95 shadow-[0_8px_30px_-22px_rgba(13,17,23,.45)] backdrop-blur-xl"
          : "border-transparent bg-[#fbfaf7]/80 backdrop-blur-md",
      )}
    >
      <nav className="container-lp flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/#home"
          className="focus-ring group inline-flex shrink-0 items-center gap-3 rounded-lg"
          aria-label={`${siteConfig.name} – Startseite`}
          onClick={() => setOpen(false)}
        >
          <span className="relative grid size-10 place-items-center rounded-xl bg-navy text-[13px] font-extrabold tracking-[-0.08em] text-white shadow-soft">
            IXA
            <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-[#fbfaf7] bg-success-400" />
          </span>
          <span className="leading-none">
            <span className="block text-[15px] font-extrabold tracking-tight text-navy">
              IXA Leads
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Nürnberg
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 transition-colors hover:bg-white hover:text-navy"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <CallbackRequestDialog location="navbar">
            <button
              type="button"
              aria-label="Rückruf oder direkten Anruf auswählen"
              className="focus-ring hidden size-11 place-items-center rounded-xl border border-navy/10 bg-white text-navy transition-colors hover:border-primary/30 hover:text-primary xl:grid"
            >
              <Phone className="size-4" />
            </button>
          </CallbackRequestDialog>
          <CtaButton
            event="check_cta_click"
            location="navbar"
            service={freeCheckServiceId}
            size="default"
          >
            Potenzial kostenlos prüfen
          </CtaButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="focus-ring grid size-11 place-items-center rounded-xl border border-navy/10 bg-white text-navy lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        id="mobile-navigation"
        aria-hidden={!open}
        className={cn(
          "overflow-hidden border-t border-navy/10 bg-[#fbfaf7] transition-[max-height,opacity] duration-300 lg:hidden",
          open
            ? "visible max-h-[520px] opacity-100"
            : "invisible max-h-0 border-transparent opacity-0",
        )}
      >
        <div className="container-lp space-y-1 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="focus-ring flex rounded-xl px-4 py-3 text-base font-semibold text-navy transition-colors hover:bg-white"
            >
              {link.label}
            </a>
          ))}
          <div className="grid gap-2 pt-3">
            <CallbackRequestDialog location="mobile_menu">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white text-sm font-bold text-navy"
              >
                <Phone className="size-4" />
                Rückruf / Anruf
              </button>
            </CallbackRequestDialog>
            <CtaButton
              event="check_cta_click"
              location="mobile_menu"
              service={freeCheckServiceId}
              size="lg"
              className="h-auto min-h-12 whitespace-normal px-3 py-3 text-center text-sm leading-tight"
              onClick={() => setOpen(false)}
            >
              Potenzial kostenlos prüfen
            </CtaButton>
          </div>
        </div>
      </div>
    </header>
  );
}
