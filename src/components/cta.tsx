"use client";

import type { ComponentProps, ReactNode } from "react";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scrollToContact } from "@/lib/contact";
import { track, buildWhatsappUrl, type TrackingEvent } from "@/lib/tracking";
import { siteConfig } from "@/data/site";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

interface CtaButtonProps {
  children: ReactNode;
  /** الحدث الذي يُدفع إلى dataLayer عند الضغط */
  event?: TrackingEvent;
  /** اسم القسم/الموضع لأغراض التحليل */
  location?: string;
  /** الخدمة التي تُحدَّد تلقائيًا داخل النموذج */
  service?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: ReactNode;
  /** يُنفَّذ قبل التتبع والانتقال (مثل إغلاق قائمة الموبايل) */
  onClick?: () => void;
}

/** زر دعوة لاتخاذ إجراء: يتتبع النقرة، ثم ينتقل إلى النموذج. */
export function CtaButton({
  children,
  event = "hero_cta_click",
  location,
  service,
  variant = "default",
  size = "lg",
  className,
  icon,
  onClick,
}: CtaButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        onClick?.();
        track(event, { location, service });
        scrollToContact(service);
      }}
    >
      {icon}
      {children}
    </Button>
  );
}

/** رابط واتساب مع تتبع النقرة. */
export function WhatsappLink({
  children,
  className,
  variant = "navy",
  size = "lg",
  location = "generic",
  showIcon = true,
}: {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  location?: string;
  showIcon?: boolean;
}) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
    >
      <a
        href={buildWhatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Über WhatsApp kontaktieren"
        onClick={() => track("whatsapp_click", { location })}
      >
        {showIcon && <MessageCircle aria-hidden="true" />}
        {children}
      </a>
    </Button>
  );
}

/** رابط واتساب نصي (للتذييل) مع تتبع النقرة. */
export function WhatsappTextLink({
  className,
  location = "footer",
  label = "WhatsApp",
}: {
  className?: string;
  location?: string;
  label?: string;
}) {
  return (
    <a
      href={buildWhatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 font-medium text-navy transition-colors hover:text-primary focus-ring rounded-md",
        className,
      )}
      onClick={() => track("whatsapp_click", { location })}
    >
      <MessageCircle className="size-4 text-primary" aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}

/** رابط الهاتف مع تتبع النقرة. */
export function PhoneLink({
  className,
  location = "generic",
  withIcon = true,
}: {
  className?: string;
  location?: string;
  withIcon?: boolean;
}) {
  return (
    <a
      href={siteConfig.contact.phoneHref}
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-2 font-medium text-navy transition-colors hover:text-primary focus-ring rounded-md",
        className,
      )}
      onClick={() => track("phone_click", { location })}
    >
      {withIcon && <Phone className="size-4 text-primary" aria-hidden="true" />}
      <span>{siteConfig.contact.phoneDisplay}</span>
    </a>
  );
}

/** رابط البريد الإلكتروني مع تتبع النقرة. */
export function EmailLink({
  className,
  location = "generic",
  withIcon = true,
}: {
  className?: string;
  location?: string;
  withIcon?: boolean;
}) {
  return (
    <a
      href={siteConfig.contact.emailHref}
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-2 font-medium text-navy transition-colors hover:text-primary focus-ring rounded-md",
        className,
      )}
      onClick={() => track("email_click", { location })}
    >
      {withIcon && <Mail className="size-4 text-primary" aria-hidden="true" />}
      <span>{siteConfig.contact.emailDisplay}</span>
    </a>
  );
}
