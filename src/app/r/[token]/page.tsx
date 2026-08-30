import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PersonalCheckView } from "@/components/personal-check/PersonalCheckView";
import { PersonalPageVisitBeacon } from "@/components/personal-check/PersonalPageVisitBeacon";
import {
  isValidPublicToken,
  personalWhatsAppRequest,
  resolvePersonalPage,
} from "@/lib/personal-outreach";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function PersonalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isValidPublicToken(token)) notFound();

  const resolution = await resolvePersonalPage(token);
  if (!resolution) notFound();

  const primaryRequest = personalWhatsAppRequest(token, "deeper_check");
  const meetingRequest = personalWhatsAppRequest(token, "meeting_15_min");

  return (
    <>
      <PersonalCheckView
        companyLabel={resolution.publicPageLabel}
        findings={resolution.findings}
        firstTest={resolution.firstTest}
        primaryRequest={primaryRequest}
        meetingRequest={meetingRequest}
      />
      <PersonalPageVisitBeacon ticket={resolution.visitTicket} />
    </>
  );
}
