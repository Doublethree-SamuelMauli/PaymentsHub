import type { MetadataRoute } from "next";

const BASE = "https://paymentshub.doublethree.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blog/por-que-pagamento-em-lote`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/pix-vs-ted`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/rbac-aprovacao`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog/cnab-240-explicado`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/status`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    { url: `${BASE}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
