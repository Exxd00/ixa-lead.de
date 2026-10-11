# Website-Kundenfragebogen

- Shareable route: `https://ixa-leads.de/kundenfragebogen`.
- Nine German questions follow the approved client questionnaire. No budget
  question or password warning. Existing services and the homepage stay intact.
- Mobile-first form; company, owner, one reachable contact route and privacy
  acknowledgement are required. Other facts can be added later.
- POST `/api/client-intake` sends all answers through the existing Resend sender.
  Default recipient is `info@ixa-leads.de`; an optional server-only
  `CLIENT_INTAKE_NOTIFICATION_EMAIL` can override that address.
- Reuses `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Does not add a subscription,
  copy Erledigt Team credentials, send a customer autoresponder or create rows in
  the sales-lead sheet. The answers arrive as an internal, readable email.
- Success requires a valid Resend acceptance ID. SMTP inbox placement remains a
  separate delivery check. A lost response can be retried with identical email
  content and an identical idempotency key; answers remain in the form on error.
- Answers are not persisted in browser storage, public pages, analytics or logs.
  A refresh clears an unfinished form. No attachments are requested.
- `noindex` metadata and HTTP header; absent from sitemap; no robots.txt block
  that would prevent search engines from seeing `noindex`. This does not make
  the blank form access-controlled. Analytics and attribution are suppressed.
- API guards: same-origin JSON, bounded body, allowed fields and options,
  escaped email HTML, fixed recipient, honeypot and a bounded 15-minute
  warm-instance rate guard. The guard is not a distributed/global quota.

## Verification and operations

Run `node scripts/verify-client-intake.cjs`, TypeScript and the production build.
Check the form on phone/desktop, both themes, missing fields and success/error
states. Send one clearly labelled synthetic live test to the IXA inbox and
inspect its provider delivery result. Do not submit tests to customer addresses.

Deploy the verified Git commit through the existing IXA Vercel project. Confirm
the production response, `X-Robots-Tag` and no analytics on the questionnaire.
Rollback by reverting this feature's commit and deploying the revert.
