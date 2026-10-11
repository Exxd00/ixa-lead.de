/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/kundenfragebogen", destination: "/info", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/info/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, noimageindex, nosnippet",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/kundenfragebogen/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, noimageindex",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, noimageindex",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        source: "/vorschau/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, noimageindex",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
      {
        source: "/r/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, noimageindex",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
