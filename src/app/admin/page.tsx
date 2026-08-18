import { AdminCopyButton } from "@/app/admin/AdminCopyButton";
import { loginAdmin, logoutAdmin } from "@/app/admin/actions";
import { BrandMark } from "@/components/BrandMark";
import { documentedCases, portfolioEvidence } from "@/data/evidence";
import { siteConfig } from "@/data/site";
import {
  adminCookieName,
  isAdminConfigured,
  verifyAdminSession,
} from "@/lib/admin-auth";
import {
  BarChart3,
  CheckCircle2,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  Github,
  Globe2,
  KeyRound,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

const sitemapUrl = `${siteConfig.seo.url}/sitemap.xml`;
const robotsUrl = `${siteConfig.seo.url}/robots.txt`;

const colors = [
  { name: "IXA Mint", hex: "#64E0D5", use: "الهوية والشعار والأزرار واللمسات" },
  { name: "Deep Black", hex: "#050606", use: "الخلفية الأساسية والتباين" },
  { name: "Pure White", hex: "#FFFFFF", use: "الخلفيات والنصوص النظيفة" },
  { name: "Soft Mint", hex: "#B9F4EE", use: "المساحات والتفاصيل الهادئة" },
  { name: "Graphite", hex: "#1B1E1E", use: "البطاقات والخلفيات الثانوية" },
] as const;

const publicPages = [
  { label: "الصفحة الرئيسية", path: "/" },
  { label: "Google Ads Nürnberg", path: "/google-ads-nuernberg" },
  {
    label: "Google Ads für Handwerker",
    path: "/google-ads-handwerker-nuernberg",
  },
  {
    label: "Fallstudie Franken Autoankauf",
    path: "/fallstudien/franken-autoankauf",
  },
] as const;

const conversionEvents = [
  {
    label: "إرسال النموذج بنجاح",
    value: "ixa_conversion_thank_you",
  },
  { label: "تأكيد الاتصال المباشر", value: "ixa_conversion_phone_call" },
  { label: "طلب معاودة الاتصال", value: "ixa_conversion_callback" },
  { label: "تأكيد فتح واتساب", value: "ixa_conversion_whatsapp" },
] as const;

const assets = [
  {
    title: "الشعار الرئيسي PNG",
    path: "/brand/ixa-logo.png",
    dimensions: "608 × 608 px",
    size: "حوالي 56 KB",
    width: 608,
    height: 608,
    imageClass: "object-contain bg-black",
  },
  {
    title: "أيقونة IXA WebP",
    path: "/brand/ixa-mark-new.png",
    dimensions: "352 × 352 px",
    size: "حوالي 8 KB",
    width: 352,
    height: 352,
    imageClass: "object-contain bg-black",
  },
  {
    title: "Favicon PNG",
    path: "/icon.png",
    dimensions: "160 × 160 px",
    size: "حوالي 4 KB",
    width: 160,
    height: 160,
    imageClass: "object-contain bg-black",
  },
  {
    title: "صورة Emad للموقع",
    path: "/people/emad-alzaim-new.png",
    dimensions: "480 × 600 px",
    size: "حوالي 20 KB",
    width: 480,
    height: 600,
    imageClass: "object-cover object-center",
  },
  {
    title: "صورة المشاركة OpenGraph",
    path: "/opengraph-image",
    dimensions: "1200 × 630 px",
    size: "تُنشأ تلقائيًا",
    width: 1200,
    height: 630,
    imageClass: "object-cover",
  },
] as const;

const evidenceAssets = [
  {
    title: "Lead-Sheet – Franken Autoankauf",
    path: "/evidence/franken-lead-sheet-safe.jpg",
  },
  {
    title: "GA4 Sessions – Franken Autoankauf",
    path: "/evidence/franken-ga4-sessions.jpg",
  },
  {
    title: "GA4 Key Events – Franken Autoankauf",
    path: "/evidence/franken-ga4-key-events.jpg",
  },
] as const;

const reusableCopy = [
  {
    label: "وصف الكيان الرسمي",
    value:
      "IXA baut messbare Anfrage-Systeme für lokale Dienstleistungsbetriebe in Nürnberg und Franken.",
  },
  {
    label: "رسالة الـHero",
    value:
      "Aus Google-Suchen werden Kontaktanfragen. Und Sie sehen, woher sie kommen.",
  },
  {
    label: "الزر الرئيسي",
    value: "Anfrage-Potenzial kostenlos prüfen",
  },
  {
    label: "فصل النتيجة عن العميل",
    value: "Kontaktaktionen ≠ qualifizierte Anfragen ≠ Aufträge ≠ Umsatz.",
  },
] as const;

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  description,
  dark = false,
}: {
  icon: typeof Palette;
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-xl ${
          dark ? "bg-white/10 text-success-300" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p
          className={`text-xs font-bold uppercase tracking-[0.12em] ${
            dark ? "text-success-300" : "text-primary"
          }`}
        >
          {eyebrow}
        </p>
        <h2 className={`mt-1 text-2xl font-bold ${dark ? "text-white" : "text-navy"}`}>
          {title}
        </h2>
        {description && (
          <p
            className={`mt-2 max-w-3xl text-sm leading-relaxed ${
              dark ? "text-white/60" : "text-stone-600"
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function AdminLogin({
  error,
  configured,
}: {
  error?: string;
  configured: boolean;
}) {
  return (
    <main
      dir="rtl"
      lang="ar"
      className="hero-wash grid min-h-screen place-items-center px-4 py-10"
    >
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/15 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark className="size-12" priority />
            <div>
              <p className="font-bold text-navy">IXA Owner Hub</p>
              <p className="text-xs text-stone-500">لوحة المالك الخاصة</p>
            </div>
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-success-50 text-success-700">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
        </div>

        <h1 className="mt-8 text-3xl font-bold text-navy">تسجيل الدخول</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          هذه الصفحة غير مفهرسة ومحمية من جهة الخادم. أدخل كلمة السر للوصول
          إلى أدوات IXA وملفات الهوية.
        </p>

        {!configured && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800">
            لم تكتمل إعدادات الحماية على الخادم بعد.
          </div>
        )}
        {error === "invalid" && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            كلمة السر غير صحيحة. حاول مرة أخرى.
          </div>
        )}
        {error === "config" && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
            حماية لوحة الإدارة غير مهيأة بعد.
          </div>
        )}

        <form action={loginAdmin} className="mt-6">
          <label htmlFor="admin-password" className="text-sm font-bold text-navy">
            كلمة السر
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="focus-ring mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-left text-base text-navy"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={!configured}
            className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="size-4" aria-hidden="true" />
            دخول آمن
          </button>
        </form>
        <Link
          href="/"
          className="focus-ring mt-4 inline-flex w-full items-center justify-center rounded-lg py-2 text-sm font-semibold text-stone-500 hover:text-primary"
        >
          العودة إلى الموقع
        </Link>
      </div>
    </main>
  );
}

function QuickLink({
  href,
  label,
  detail,
  icon: Icon,
}: {
  href: string;
  label: string;
  detail: string;
  icon: typeof Globe2;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="focus-ring group flex min-h-24 items-start gap-3 rounded-2xl border border-navy/10 bg-white p-4 shadow-soft transition-transform hover:-translate-y-0.5 hover:border-primary/30"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white transition-colors group-hover:bg-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-bold text-navy">
          {label}
          <ExternalLink className="size-3.5 text-stone-400" aria-hidden="true" />
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-stone-500">
          {detail}
        </span>
      </span>
    </a>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const authenticated = verifyAdminSession(cookieStore.get(adminCookieName)?.value);

  if (!authenticated) {
    return (
      <AdminLogin error={params.error} configured={isAdminConfigured()} />
    );
  }

  const sheetUrl = process.env.ADMIN_GOOGLE_SHEET_URL?.trim() ?? "";
  const analyticsUrl = process.env.ADMIN_GA4_URL?.trim() ?? "";
  const appsScriptUrl = process.env.ADMIN_APPS_SCRIPT_URL?.trim() ?? "";

  const quickLinks = [
    {
      href: siteConfig.seo.url,
      label: "الموقع المباشر",
      detail: "فتح ixa-leads.de",
      icon: Globe2,
    },
    {
      href: sitemapUrl,
      label: "Sitemap",
      detail: "الرابط الذي يُرسل إلى Google Search Console",
      icon: Search,
    },
    ...(sheetUrl
      ? [
          {
            href: sheetUrl,
            label: "Google Sheets",
            detail: "الطلبات والأحداث والتقييم",
            icon: FileSpreadsheet,
          },
        ]
      : []),
    ...(analyticsUrl
      ? [
          {
            href: analyticsUrl,
            label: "Google Analytics",
            detail: "فتح حساب GA4 المرتبط",
            icon: BarChart3,
          },
        ]
      : []),
    ...(appsScriptUrl
      ? [
          {
            href: appsScriptUrl,
            label: "Apps Script",
            detail: "كود ربط النموذج مع Google Sheets",
            icon: Workflow,
          },
        ]
      : []),
    {
      href: "https://search.google.com/search-console",
      label: "Search Console",
      detail: "الفهرسة وإرسال الـSitemap",
      icon: Search,
    },
    {
      href: "https://github.com/Exxd00/ixa-lead.de",
      label: "GitHub",
      detail: "المستودع الرئيسي للموقع",
      icon: Github,
    },
    {
      href: "https://vercel.com/ixa1/ixa-lead-de",
      label: "Vercel",
      detail: "النشر والمتغيرات والسجلات",
      icon: Sparkles,
    },
    {
      href: "https://resend.com/emails",
      label: "Resend",
      detail: "إشعارات البريد الواردة من النموذج",
      icon: Mail,
    },
  ];

  const integrations = [
    {
      label: "Google Sheets / Apps Script",
      connected: Boolean(
        process.env.LEAD_WEBHOOK_URL && process.env.LEAD_WEBHOOK_SECRET,
      ),
      detail: "حفظ النموذج وRückruf وأحداث التحويل",
    },
    {
      label: "Resend",
      connected: Boolean(
        process.env.RESEND_API_KEY &&
          process.env.RESEND_FROM_EMAIL &&
          process.env.LEAD_NOTIFICATION_EMAIL,
      ),
      detail: process.env.LEAD_NOTIFICATION_EMAIL?.trim()
        ? `الإشعارات إلى ${process.env.LEAD_NOTIFICATION_EMAIL.trim()}`
        : "إشعارات البريد غير مكتملة",
    },
    {
      label: "Google Analytics 4",
      connected: siteConfig.tracking.enabled,
      detail: siteConfig.tracking.ga4Id || "لا يوجد Measurement ID",
    },
    {
      label: "Google Ads Conversion",
      connected: siteConfig.tracking.adsEnabled,
      detail: siteConfig.tracking.adsEnabled
        ? "مفعّل"
        : "غير مفعّل حاليًا بشكل مقصود",
    },
  ];

  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-[#f3f1eb] text-navy">
      <header className="border-b border-navy/10 bg-[#fbfaf7]">
        <div className="container-lp flex min-h-20 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11" priority />
            <div>
              <p className="font-bold text-navy">IXA Owner Hub</p>
              <p className="text-xs text-stone-500">لوحة التشغيل والهوية</p>
            </div>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-navy/10 bg-white px-3 text-xs font-bold text-navy hover:border-red-200 hover:text-red-700 sm:px-4 sm:text-sm"
            >
              <LogOut className="size-4" aria-hidden="true" />
              خروج
            </button>
          </form>
        </div>
      </header>

      <div className="container-lp py-8 sm:py-10">
        <section className="overflow-hidden rounded-[1.75rem] bg-navy-900 p-6 text-white shadow-card sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-success-300">
                <ShieldCheck className="size-4" aria-hidden="true" />
                صفحة خاصة · غير مفهرسة
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-4xl">
                كل ما تحتاجه لإدارة IXA في مكان واحد.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65 sm:text-base">
                روابط التشغيل، الـSEO، الهوية البصرية، الملفات القابلة للتنزيل
                وأسماء أحداث القياس الأساسية.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm">
              <p className="text-white/45">الكيان التجاري</p>
              <p className="mt-1 font-bold text-white">{siteConfig.name}</p>
              <p className="mt-1 text-xs text-white/55">
                Nürnberg &amp; Franken
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle
            icon={Link2}
            eyebrow="تشغيل سريع"
            title="الروابط المهمة"
            description="الروابط الحساسة لا تُعرض إلا بعد تسجيل الدخول، ولا تُخزن كلمة السر داخل كود الموقع."
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((link) => (
              <QuickLink key={link.label} {...link} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-soft sm:p-7">
          <SectionTitle
            icon={Workflow}
            eyebrow="Integrations"
            title="حالة الربط دون كشف المفاتيح"
            description="تُعرض الحالة فقط. كلمات السر وWebhook Secret وResend API Key لا تظهر داخل الصفحة أو المتصفح."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map((integration) => (
              <article
                key={integration.label}
                className="rounded-2xl border border-navy/10 bg-[#fbfaf7] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-navy" dir="ltr">
                    {integration.label}
                  </p>
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${
                      integration.connected ? "bg-success-500" : "bg-stone-300"
                    }`}
                    aria-label={integration.connected ? "متصل" : "غير متصل"}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">
                  {integration.detail}
                </p>
                {integration.label === "Google Analytics 4" &&
                  siteConfig.tracking.ga4Id && (
                    <div className="mt-3">
                      <AdminCopyButton
                        value={siteConfig.tracking.ga4Id}
                        label="نسخ Measurement ID"
                      />
                    </div>
                  )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-navy/10 bg-[#fbfaf7] p-5 shadow-soft sm:p-7">
          <SectionTitle
            icon={Search}
            eyebrow="SEO · AEO"
            title="الفهرسة وفهم كيان IXA"
            description="الصفحات العامة فقط تظهر في الـSitemap. صفحة الإدارة وصفحة الشكر وواجهات API مستبعدة."
          />
          <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-2xl border border-navy/10 bg-white p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
                Sitemap URL
              </p>
              <code className="mt-3 block break-all rounded-xl bg-navy-900 p-3 text-left font-mono text-xs text-white" dir="ltr">
                {sitemapUrl}
              </code>
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminCopyButton value={sitemapUrl} label="نسخ الرابط" />
                <a
                  href={sitemapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-navy/10 bg-white px-3 text-xs font-bold text-navy hover:text-primary"
                >
                  فتح <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
                <a
                  href={robotsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-navy/10 bg-white px-3 text-xs font-bold text-navy hover:text-primary"
                >
                  robots.txt
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-navy/10 bg-white p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-stone-500">
                Schema.org
              </p>
              <div className="mt-3 flex flex-wrap gap-2" dir="ltr">
                {[
                  "Organization",
                  "LocalBusiness",
                  "Person",
                  "WebSite",
                  "WebPage",
                  "Service",
                  "Offer",
                  "FAQPage",
                  "Article",
                  "BreadcrumbList",
                ].map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 font-mono text-xs font-bold text-primary"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {publicPages.map((page) => {
              const url = `${siteConfig.seo.url}${page.path === "/" ? "" : page.path}`;
              return (
                <div
                  key={page.path}
                  className="flex items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy">{page.label}</p>
                    <p className="mt-1 truncate text-left font-mono text-[11px] text-stone-500" dir="ltr">
                      {url}
                    </p>
                  </div>
                  <AdminCopyButton value={url} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-soft sm:p-7">
          <SectionTitle
            icon={Palette}
            eyebrow="Brand System"
            title="ألوان IXA الجاهزة للنسخ"
            description="هذه هي الألوان الأساسية المستخدمة فعليًا في الموقع. استخدم الأزرق للإجراء الأساسي، والأخضر للنتائج الموثقة فقط."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {colors.map((color) => (
              <article key={color.hex} className="overflow-hidden rounded-2xl border border-navy/10 bg-[#fbfaf7]">
                <div className="h-24" style={{ backgroundColor: color.hex }} />
                <div className="p-4">
                  <p className="font-bold text-navy" dir="ltr">{color.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-bold text-stone-700" dir="ltr">
                      {color.hex}
                    </code>
                    <AdminCopyButton value={color.hex} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone-500">{color.use}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["العناوين", "Space Grotesk"],
              ["النصوص", "Plus Jakarta Sans"],
              ["الأرقام والقياس", "JetBrains Mono"],
            ].map(([label, font]) => (
              <div key={font} className="rounded-xl border border-navy/10 bg-[#fbfaf7] p-4">
                <p className="text-xs text-stone-500">{label}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="font-bold text-navy" dir="ltr">{font}</p>
                  <AdminCopyButton value={font} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-navy/10 bg-[#fbfaf7] p-5 shadow-soft sm:p-7">
          <SectionTitle
            icon={FileImage}
            eyebrow="Downloads"
            title="الشعار والصور المعتمدة"
            description="نزّل الملفات الأصلية المستخدمة في الموقع دون أخذ Screenshot أو تغيير نسب الصورة."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <article key={asset.path} className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <Image
                    src={asset.path}
                    alt={asset.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={asset.imageClass}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-navy">{asset.title}</h3>
                  <p className="mt-1 text-xs text-stone-500" dir="ltr">
                    {asset.dimensions} · {asset.size}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={asset.path}
                      download
                      className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-navy px-3 text-xs font-bold text-white hover:bg-primary"
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      تنزيل
                    </a>
                    <AdminCopyButton value={`${siteConfig.seo.url}${asset.path}`} label="نسخ الرابط" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h3 className="mt-7 text-lg font-bold text-navy">أدلة Fallstudie الأصلية</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {evidenceAssets.map((asset) => (
              <a
                key={asset.path}
                href={asset.path}
                download
                className="focus-ring flex items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white p-4 text-sm font-bold text-navy hover:border-primary/30 hover:text-primary"
              >
                <span>{asset.title}</span>
                <Download className="size-4 shrink-0" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-2">
          <section className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-soft sm:p-7">
            <SectionTitle
              icon={BarChart3}
              eyebrow="Tracking"
              title="أحداث التحويل الرئيسية"
              description="استخدم الأسماء نفسها عند تعليمها كـKey Events داخل GA4."
            />
            <div className="space-y-3">
              {conversionEvents.map((event) => (
                <div key={event.value} className="rounded-xl border border-navy/10 bg-[#fbfaf7] p-3">
                  <p className="text-sm font-bold text-navy">{event.label}</p>
                  <div className="mt-2 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <code className="break-all text-left font-mono text-xs text-primary" dir="ltr">{event.value}</code>
                    <AdminCopyButton value={event.value} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-navy/10 bg-white p-5 shadow-soft sm:p-7">
            <SectionTitle
              icon={UserRound}
              eyebrow="Business"
              title="بيانات IXA الأساسية"
            />
            <dl className="space-y-3 text-sm">
              {[
                ["الاسم", siteConfig.name],
                ["المسؤول", siteConfig.owner],
                ["الهاتف", siteConfig.contact.phoneDisplay],
                ["البريد", siteConfig.contact.emailDisplay],
                ["العنوان", siteConfig.contact.address.display],
                ["نطاق الخدمة", siteConfig.contact.location],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 rounded-xl bg-[#fbfaf7] p-3 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                  <dt className="text-stone-500">{label}</dt>
                  <dd className="font-semibold text-navy">{value}</dd>
                  <AdminCopyButton value={value} />
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-stone-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              العنوان هو Homeoffice، والمواعيد في المكان تكون بعد اتفاق مسبق فقط.
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-[1.75rem] bg-navy-900 p-5 text-white shadow-card sm:p-7">
          <SectionTitle
            icon={CheckCircle2}
            eyebrow="Offer & Proof"
            title="الأرقام التي يجب الحفاظ عليها كما هي"
            description="لا تُحوّل Kontaktaktionen إلى عملاء أو Aufträge، ولا تجمع فترات Lead-Sheet مع GA4."
            dark
          />
          <div className="mb-5 grid gap-3 lg:grid-cols-2">
            {reusableCopy.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
              >
                <p className="text-xs font-bold text-success-300">{item.label}</p>
                <p className="mt-2 text-left text-sm leading-relaxed text-white/75" dir="ltr">
                  {item.value}
                </p>
                <div className="mt-3">
                  <AdminCopyButton value={item.value} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="font-mono text-3xl font-bold text-white">3.000 €</p>
              <p className="mt-1 text-xs text-white/50">90 Tage · zzgl. Werbebudget</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="font-mono text-3xl font-bold text-white">500 €</p>
              <p className="mt-1 text-xs text-white/50">optionale monatliche Optimierung</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="font-mono text-3xl font-bold text-success-300">{documentedCases[0]?.documentedActions ?? 211}</p>
              <p className="mt-1 text-xs text-white/50">Franken Autoankauf Kontaktaktionen</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="font-mono text-3xl font-bold text-white">{portfolioEvidence.documentedActions}</p>
              <p className="mt-1 text-xs text-white/50">Portfolio · getrennte Lead-Sheets</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-sm font-bold text-white">دفعات المشروع المتفق عليها</p>
            <div className="mt-3 grid gap-2 text-xs text-white/65 sm:grid-cols-4" dir="ltr">
              <span>1.500 € · Projektstart</span>
              <span>500 € · nach 30 Tagen</span>
              <span>500 € · nach 60 Tagen</span>
              <span>500 € · nach 90 Tagen</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Kontaktaktionen ≠ qualifizierte Anfragen ≠ Aufträge ≠ Umsatz.
          </p>
        </section>

        <footer className="py-8 text-center text-xs text-stone-500">
          صفحة تشغيل خاصة بـIXA-Leads · لا تعرض كلمات السر أو مفاتيح الخدمات.
        </footer>
      </div>
    </main>
  );
}
