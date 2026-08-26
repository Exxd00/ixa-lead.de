import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/api/", "/admin", "/danke", "/vorschau/"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${siteConfig.seo.url}/sitemap.xml`,
    host: siteConfig.seo.url,
  };
}
