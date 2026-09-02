import { PersonalCheckExperience } from "@/components/personal-check/PersonalCheckExperience";
import type { PersonalPageFinding, PersonalPageFirstTest, PersonalWhatsAppRequest } from "@/lib/personal-outreach";
type Props = { companyLabel: string; findings: readonly [PersonalPageFinding, PersonalPageFinding]; firstTest: PersonalPageFirstTest; primaryRequest: PersonalWhatsAppRequest; meetingRequest: PersonalWhatsAppRequest };
export function PersonalCheckView({ companyLabel, findings, firstTest, primaryRequest, meetingRequest }: Props) { void meetingRequest; return <PersonalCheckExperience companyLabel={companyLabel} findings={findings} firstTest={firstTest} primaryRequest={primaryRequest} />; }
