import Link from "next/link";

export default function PersonalPageNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fcfb] px-5 text-navy">
      <div className="max-w-lg text-center">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.16em] text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold">Seite nicht gefunden</h1>
        <p className="mt-4 leading-relaxed text-stone-600">
          Der aufgerufene Link ist nicht verfügbar.
        </p>
        <Link
          href="/"
          className="focus-ring mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-5 font-bold text-white"
        >
          Zur IXA Website
        </Link>
      </div>
    </main>
  );
}
