"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildWhatsappUrl,
  conversionEvents,
  track,
} from "@/lib/tracking";
import { ArrowUpRight, MessageCircle, ShieldCheck } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";

export function WhatsappConfirmDialog({
  children,
  location,
}: {
  children: ReactElement;
  location: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100%_-_2rem)] max-w-md rounded-[1.5rem] border-success-700/15 p-5 sm:p-7">
        <div className="grid size-12 place-items-center rounded-2xl bg-success-100 text-success-700">
          <MessageCircle className="size-6" aria-hidden="true" />
        </div>

        <DialogHeader className="text-left">
          <DialogTitle className="pr-8 text-xl text-navy">
            Kurz zu WhatsApp wechseln?
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            WhatsApp öffnet sich in einem neuen Fenster. Diese Seite bleibt
            geöffnet, damit Sie jederzeit hier weiterlesen können.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-2xl border border-success-700/15 bg-success-100/60 p-3.5 text-sm leading-relaxed text-success-800">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <p>
            Ihre Nachricht ist bereits vorbereitet. Gesendet wird sie erst,
            wenn Sie dies selbst in WhatsApp bestätigen.
          </p>
        </div>

        <div className="mt-1 grid gap-2.5 sm:grid-cols-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Hier bleiben
            </Button>
          </DialogClose>
          <Button
            asChild
            className="w-full bg-success-700 text-white shadow-soft hover:bg-success-800"
          >
            <a
              href={buildWhatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track(conversionEvents.whatsapp, { location });
                setOpen(false);
              }}
            >
              WhatsApp öffnen
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
