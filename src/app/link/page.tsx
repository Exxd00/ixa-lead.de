import type { Metadata } from "next";
import { Rocket, Megaphone, Instagram, Linkedin, MapPin, Phone, MessageCircle } from "lucide-react";
import { LinkHubButton } from "@/components/link-hub/LinkHubButton";
import { LinkHubIconButton } from "@/components/link-hub/LinkHubIconButton";
import { siteConfig } from "@/data/site";
import { buildWhatsappUrl } from "@/lib/tracking";

export const metadata: Metadata = {
  title: "IXA | Alle Links",
  description: "Alle Kanäle. Eine Handschrift. Social Media, Websites & Ads, die Anfragen liefern.",
};

export default function LinkHubPage() {
  const { linkHub, contact } = siteConfig;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-navy-950 px-5 py-16 sm:py-20">
      {/* atmosphärischer Hintergrund */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 45% at 50% 0%, hsl(221 83% 53% / 0.28), transparent 60%), radial-gradient(50% 40% at 85% 90%, hsl(160 84% 39% / 0.14), transparent 60%), radial-gradient(50% 40% at 10% 85%, hsl(221 83% 53% / 0.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Emblem — Platzhalter, endgültiges Logo folgt separat */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 animate-pulse-soft rounded-full bg-primary/30 blur-2xl"
          />
          <span className="grid size-24 place-items-center rounded-full border border-primary/40 bg-navy-900 text-2xl font-bold tracking-tight text-white shadow-[0_0_50px_-10px_rgba(37,99,235,0.7)]">
            IX
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-wide text-white">IXA</h1>

        {/* USP — abgeleitet aus dem Instagram-Profil @ixa_agency */}
        <p className="mt-2 text-center text-[15px] font-semibold text-white/90">
          Alle Kanäle. Eine Handschrift.
        </p>
        <p className="mt-1 max-w-[280px] text-center text-sm leading-relaxed text-white/50">
          Social Media, Websites &amp; Ads, die Anfragen liefern.
        </p>
        <p className="mt-2.5 text-xs font-medium tracking-wide text-primary/80">
          25+ Kunden · 15+ Branchen
        </p>

        {/* Marken-Buttons */}
        <div className="mt-9 flex w-full flex-col gap-3.5">
          <LinkHubButton
            href="/"
            label="IXA-Leads"
            icon={<Rocket className="size-4" />}
            primary
            external={false}
          />
          <LinkHubButton
            href={linkHub.smmUrl || "#"}
            disabled={!linkHub.smmUrl}
            label="IXA-SMM"
            icon={<Megaphone className="size-4" />}
          />
          <LinkHubButton
            href={linkHub.instagram || "#"}
            disabled={!linkHub.instagram}
            label="Instagram"
            icon={<Instagram className="size-4" />}
          />
        </div>

        {/* Schnellkontakt */}
        <div className="mt-9 flex items-center gap-4">
          <LinkHubIconButton
            href={buildWhatsappUrl()}
            label="Über WhatsApp schreiben"
            icon={<MessageCircle className="size-5" />}
            tone="success"
          />
          <LinkHubIconButton
            href={contact.phoneHref}
            label="Anrufen"
            icon={<Phone className="size-5" />}
            external={false}
          />
          <LinkHubIconButton
            href={linkHub.linkedin || "#"}
            disabled={!linkHub.linkedin}
            label="LinkedIn"
            icon={<Linkedin className="size-5" />}
          />
          <LinkHubIconButton
            href={linkHub.googleMaps || "#"}
            disabled={!linkHub.googleMaps}
            label="Google Maps"
            icon={<MapPin className="size-5" />}
          />
        </div>

        <p className="mt-14 text-xs text-white/30">
          © {new Date().getFullYear()} IXA
        </p>
      </div>
    </main>
  );
}
