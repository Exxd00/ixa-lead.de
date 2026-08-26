import { notFound } from "next/navigation";

import { PersonalCheckView } from "@/components/personal-check/PersonalCheckView";
import { PersonalPageVisitBeacon } from "@/components/personal-check/PersonalPageVisitBeacon";
import {
  isValidPublicToken,
  personalWhatsAppHref,
  resolvePersonalPage,
} from "@/lib/personal-outreach";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isValidPublicToken(token)) notFound();

  const resolution = await resolvePersonalPage(token);
  if (!resolution) notFound();

  return (
    <>
      <PersonalCheckView
        companyLabel={resolution.publicPageLabel || "Ihren Betrieb"}
        whatsappHref={personalWhatsAppHref(token)}
      />
      <PersonalPageVisitBeacon ticket={resolution.visitTicket} />
    </>
  );
}
