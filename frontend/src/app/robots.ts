import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://task-manager-ten-omega-60.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: ["/dashboard", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
