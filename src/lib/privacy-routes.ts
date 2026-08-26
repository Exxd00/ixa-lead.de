/**
 * Internal routes must never participate in attribution or optional analytics.
 * Keep this check path-based so preview links remain safe even when the browser
 * already contains a previously granted analytics consent.
 */
export function isNoTrackPath(pathname: string): boolean {
  return /^(?:\/admin|\/vorschau)(?:\/|$)/.test(pathname);
}
