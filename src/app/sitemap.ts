import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ixa-leads.de",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
