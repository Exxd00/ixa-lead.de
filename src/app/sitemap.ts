import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ixa-leads.de";

  return [
    ["", 1],
    ["/google-ads-nuernberg", 0.85],
    ["/google-ads-handwerker-nuernberg", 0.85],
    ["/fallstudien/franken-autoankauf", 0.9],
  ].map(([path, priority]) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-08-11"),
    changeFrequency: "weekly" as const,
    priority: priority as number,
  }));
}
