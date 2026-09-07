export const dynamic = "force-static";
import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/"},sitemap:(process.env.NEXT_PUBLIC_SITE_URL||"https://bryansamueljames.vercel.app")+"/sitemap.xml"}}
