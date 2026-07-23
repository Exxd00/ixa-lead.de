import { ShieldCheck, Dot } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { transparencyFactors } from "@/data/site";

export function TransparencySection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container-lp">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-navy-100 bg-white p-7 shadow-soft sm:p-10 lg:p-12">
            {/* شريط علوي ملون هادئ */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-primary via-primary/60 to-success-400"
            />

            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-navy/5 px-3.5 py-1.5 text-sm font-semibold text-navy">
                  <ShieldCheck className="size-4 text-primary" />
                  Transparenz
                </span>
                <h2 className="mt-5 text-2xl font-bold leading-snug text-navy sm:text-3xl">
                  Ich verspreche nicht, dass die Website allein Ihren Umsatz verdoppelt
                </h2>
                <p className="mt-5 text-base leading-relaxed text-slate-600">
                  Anzeigenergebnisse hängen nicht nur von der Website ab. Weitere
                  Faktoren beeinflussen das Ergebnis, zum Beispiel:
                </p>

                <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {transparencyFactors.map((factor) => (
                    <li key={factor} className="flex items-center gap-1.5 text-[15px] text-slate-700">
                      <Dot className="size-6 shrink-0 text-primary" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-center gap-5 rounded-2xl bg-navy p-7 text-white sm:p-8">
                <p className="text-lg font-bold leading-relaxed text-white sm:text-xl">
                  Meine Aufgabe ist, dass die Website nicht das Glied ist, das Klicks
                  verschwendet – und dass die Besucherreise klarer, einfacher und
                  messbar wird.
                </p>
                <p className="text-[15px] leading-relaxed text-slate-300">
                  Ich zeige Ihnen, was ich beeinflussen kann und was außerhalb der
                  Website liegt.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
