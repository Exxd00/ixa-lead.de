"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { navLinks, siteConfig } from "@/data/site";
import { CtaButton, PhoneLink } from "@/components/cta";
import PillNav from "@/components/PillNav";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-stone-200/70 bg-white/80 shadow-soft backdrop-blur-md"
          : "border-b border-transparent bg-white/60 backdrop-blur-sm",
      )}
    >
      <nav className="container-lp relative flex h-[72px] items-center justify-between gap-4">
        {/* Marke */}
        <a
          href="#home"
          className="focus-ring group flex shrink-0 items-center gap-3 rounded-lg"
          aria-label={`${siteConfig.name} — Startseite`}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-navy text-sm font-bold tracking-tight text-white shadow-soft">
            IX
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-[15px] font-bold text-navy">
              {siteConfig.name}
            </span>
            <span className="text-[11px] font-medium text-stone-500">
              {siteConfig.role}
            </span>
          </span>
        </a>

        {/* Pill-Navigation (Desktop-Links + eigenes Mobil-Menü) */}
        <div className="relative flex flex-1 items-center justify-end lg:justify-center">
          <PillNav
            items={navLinks}
            wrapperClassName="relative z-[1000] w-full lg:w-auto"
            baseColor="hsl(var(--primary))"
            pillColor="#ffffff"
            pillTextColor="#1D2430"
            hoveredPillTextColor="#ffffff"
            initialLoadAnimation={false}
          />
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <PhoneLink location="navbar" className="hidden text-sm xl:inline-flex" />
          <CtaButton
            event="hero_cta_click"
            location="navbar"
            size="default"
          >
            Erstanalyse anfordern
          </CtaButton>
        </div>
      </nav>
    </header>
  );
}
