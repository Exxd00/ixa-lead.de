"use client";

/** ينتقل بسلاسة إلى نموذج التواصل، ويحدد الخدمة تلقائيًا إن مُرِّرت. */
export function scrollToContact(service?: string): void {
  if (typeof window === "undefined") return;

  if (service) {
    window.dispatchEvent(
      new CustomEvent<string>("lp:select-service", { detail: service }),
    );
  }

  const el = document.getElementById("contact");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
