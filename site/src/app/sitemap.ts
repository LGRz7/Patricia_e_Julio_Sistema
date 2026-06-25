import type { MetadataRoute } from "next";
import { imoveis } from "@/data/imoveis";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const estaticas = ["", "/imoveis", "/sobre", "/contato"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const dinamicas = imoveis.map((i) => ({
    url: `${base}/imoveis/${i.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...estaticas, ...dinamicas];
}
