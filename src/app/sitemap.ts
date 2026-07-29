import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ixa-leads.de",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://ixa-leads.de/link",
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
