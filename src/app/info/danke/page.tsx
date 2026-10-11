import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClientIntakeThankYou } from "@/components/client-intake/ClientIntakeThankYou";
import {
  INTAKE_RECEIPT_COOKIE,
  verifyIntakeReceipt,
} from "@/lib/client-intake-receipt";
import styles from "@/components/client-intake/client-intake.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Vielen Dank | IXA Website-Projekt",
  robots: { index: false, follow: false, noarchive: true },
  alternates: { canonical: "https://ixa-leads.de/info/danke" },
};
export default async function IntakeThanksPage() {
  const receipt = verifyIntakeReceipt(
    (await cookies()).get(INTAKE_RECEIPT_COOKIE)?.value,
  );
  if (!receipt) redirect("/info");
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <BrandMark className="size-12" />
          <span className={styles.brandName}>IXA Leads</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <ClientIntakeThankYou
          reference={receipt.id.slice(0, 8).toUpperCase()}
        />
      </main>
      <footer className={styles.footer}>
        <Link href="/datenschutz#kundenfragebogen">Datenschutz</Link>
        <a href="mailto:info@ixa-leads.de">info@ixa-leads.de</a>
      </footer>
    </div>
  );
}
