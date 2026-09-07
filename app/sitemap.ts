export const dynamic = "force-static";
import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap {const base=process.env.NEXT_PUBLIC_SITE_URL||"https://bryansamueljames.vercel.app";return [{url:base,changeFrequency:"monthly",priority:1},{url:base+"/resume",changeFrequency:"monthly",priority:0.5}]}
