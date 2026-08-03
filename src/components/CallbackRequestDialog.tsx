"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callbackService, siteConfig } from "@/data/site";
import { reportAdsConversion, track } from "@/lib/tracking";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Phone,
  Send,
} from "lucide-react";
import type { ReactElement } from "react";
import { useRef, useState } from "react";

type SubmitStatus = "idle" | "loading" | "success" | "error";

function sourceMetadata(entryPoint: string) {
  const searchParams = new URLSearchParams(window.location.search);
  let referrerHost = "";

  if (document.referrer) {
    try {
      referrerHost = new URL(document.referrer).hostname;
    } catch {
      // Ignore malformed or browser-filtered referrers.
    }
  }

  return {
    entryPoint,
    landingPath: window.location.pathname,
    referrerHost,
    utmSource: searchParams.get("utm_source")?.trim() ?? "",
    utmMedium: searchParams.get("utm_medium")?.trim() ?? "",
    utmCampaign: searchParams.get("utm_campaign")?.trim() ?? "",
    utmTerm: searchParams.get("utm_term")?.trim() ?? "",
    utmContent: searchParams.get("utm_content")?.trim() ?? "",
  };
}

export function CallbackRequestDialog({
  children,
  location,
}: {
  children: ReactElement;
  location: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const submissionIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && !open) {
      if (status === "success") {
        setName("");
        setPhone("");
        setError("");
        setStatus("idle");
        submissionIdRef.current = null;
      }
      track("callback_open", { location });
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlightRef.current || status === "loading") return;

    const normalizedPhone = phone.trim();
    if (normalizedPhone.replace(/\D/g, "").length < 6) {
      setError("Bitte geben Sie eine gültige Telefonnummer ein.");
      return;
    }

    setError("");
    setStatus("loading");
    inFlightRef.current = true;
    const submissionId =
      submissionIdRef.current ?? window.crypto.randomUUID();
    submissionIdRef.current = submissionId;

    try {
      const response = await fetch(siteConfig.form.endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: callbackService.id,
          neededService: callbackService.label,
          name: name.trim(),
          contact: normalizedPhone,
          submissionId,
          submissionType: "callback",
          ...sourceMetadata(location),
        }),
      });

      if (!response.ok) throw new Error("request_failed");

      setStatus("success");
      track("callback_submit_success", {
        location,
        transaction_id: submissionId,
      });
      reportAdsConversion({
        service: callbackService.id,
        location,
        transaction_id: submissionId,
      });
      submissionIdRef.current = null;
    } catch {
      setStatus("error");
      track("callback_submit_error", {
        location,
        transaction_id: submissionId,
      });
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100%_-_2rem)] max-w-md rounded-[1.5rem] p-5 sm:p-7">
        {status === "success" ? (
          <output className="block py-5 text-center" aria-live="polite">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-100 text-success-700">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <DialogTitle className="mt-4 text-xl text-navy">
              Rückruf ist angefragt
            </DialogTitle>
            <DialogDescription className="mt-2 leading-relaxed">
              Ich melde mich unter der angegebenen Nummer, sobald ich wieder
              frei bin.
            </DialogDescription>
          </output>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="pr-8 text-xl text-navy">
                Lieber einen Rückruf erhalten?
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Hinterlassen Sie Ihre Nummer. Falls ich gerade im Gespräch bin,
                rufe ich Sie zurück.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-2 space-y-4" noValidate>
              <div className="space-y-2">
                <Label
                  htmlFor={`callback-phone-${location}`}
                  className="font-semibold text-navy"
                >
                  Telefonnummer <span className="text-stamp">*</span>
                </Label>
                <Input
                  id={`callback-phone-${location}`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setError("");
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="+49 …"
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? `callback-error-${location}` : undefined
                  }
                />
                {error && (
                  <p
                    id={`callback-error-${location}`}
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {error}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`callback-name-${location}`}
                  className="font-semibold text-navy"
                >
                  Name{" "}
                  <span className="text-xs font-normal text-stone-400">
                    (optional)
                  </span>
                </Label>
                <Input
                  id={`callback-name-${location}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  placeholder="Ihr Name"
                />
              </div>

              {status === "error" && (
                <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  Der Rückruf konnte nicht angefragt werden. Sie können es
                  erneut versuchen oder direkt anrufen.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-cta transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Wird gesendet …
                  </>
                ) : (
                  <>
                    <Send className="size-4" aria-hidden="true" />
                    Rückruf anfordern
                  </>
                )}
              </button>

              <a
                href={siteConfig.contact.phoneHref}
                onClick={() =>
                  track("phone_click", { location: `${location}_confirmed` })
                }
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white px-4 text-sm font-semibold text-navy transition-colors hover:border-primary/30 hover:text-primary"
              >
                <Phone className="size-4" aria-hidden="true" />
                Jetzt direkt anrufen
              </a>

              <p className="text-center text-[11px] leading-relaxed text-stone-500">
                Ihre Nummer wird nur für diesen Rückruf verwendet.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
