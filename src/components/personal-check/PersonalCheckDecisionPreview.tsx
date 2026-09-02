import { PersonalCheckExperience } from "@/components/personal-check/PersonalCheckExperience";
import type { PersonalPageFinding, PersonalPageFirstTest } from "@/lib/personal-outreach";
export type PersonalCheckDecisionFinding = PersonalPageFinding;
export type PersonalCheckDecisionTest = PersonalPageFirstTest;
type Props = { companyLabel: string; findings: readonly [PersonalPageFinding, PersonalPageFinding]; firstTest: PersonalPageFirstTest; primaryRequestText: string; meetingRequestText: string; previewReference: string };
export function PersonalCheckDecisionPreview({ companyLabel, findings, firstTest, primaryRequestText, meetingRequestText, previewReference }: Props) { void meetingRequestText; return <PersonalCheckExperience companyLabel={companyLabel} findings={findings} firstTest={firstTest} previewMessage={primaryRequestText} previewReference={previewReference} />; }
