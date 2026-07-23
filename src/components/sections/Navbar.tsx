"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navLinks, siteConfig } from "@/data/site";
import { CtaButton, PhoneLink } from "@/components/cta";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // منع تمرير الصفحة عند فتح قائمة الموبايل
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // إغلاق القائمة مع إلغاء قفل التمرير فورًا حتى يعمل الانتقال السلس
  const closeMenu = () => {
    document.body.style.overflow = "";
    setOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-slate-200/70 bg-white/80 shadow-soft backdrop-blur-md"
          : "border-b border-transparent bg-white/60 backdrop-blur-sm",
      )}
    >
      <nav className="container-lp flex h-[72px] items-center justify-between gap-4">
        {/* الشعار النصي */}
        <a
          href="#home"
          className="focus-ring group flex shrink-0 items-center gap-3 rounded-lg"
          aria-label={`${siteConfig.name} — Startseite`}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-navy text-sm font-bold tracking-tight text-white shadow-soft">
            IX
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold text-navy">
              {siteConfig.name}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {siteConfig.role}
            </span>
          </span>
        </a>

        {/* روابط سطح المكتب */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="focus-ring rounded-lg px-3.5 py-2 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <PhoneLink location="navbar" className="hidden text-sm xl:inline-flex" />
          <CtaButton
            event="hero_cta_click"
            location="navbar"
            size="default"
            className="hidden lg:inline-flex"
          >
            Erstanalyse anfordern
          </CtaButton>

          {/* Menü-Button (mobil) */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={open}
            className="focus-ring grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-navy lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* قائمة الموبايل المنسدلة */}
      <div
        className={cn(
          "lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* خلفية معتمة */}
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "fixed inset-0 top-[72px] bg-navy/20 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute inset-x-0 top-[72px] origin-top border-b border-slate-200 bg-white/95 shadow-card backdrop-blur-md transition-all duration-300",
            open
              ? "translate-y-0 opacity-100"
              : "-translate-y-3 opacity-0",
          )}
        >
          <ul className="container-lp flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className="focus-ring block rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-navy"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-2">
              <CtaButton
                event="hero_cta_click"
                location="navbar_mobile"
                size="lg"
                className="w-full"
                onClick={closeMenu}
              >
                Erstanalyse anfordern
              </CtaButton>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
