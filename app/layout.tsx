import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const sans = localFont({src:"../public/fonts/geist-sans.woff2", variable:"--font-sans", display:"swap"});
const mono = localFont({src:"../public/fonts/geist-mono.woff2", variable:"--font-mono", display:"swap"});
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://bryansamueljames.vercel.app";
export const metadata: Metadata = { metadataBase: new URL(origin), title: "Bryan James | AI/ML, data & full-stack engineering", description: "MSCS at Northeastern. Explore working AI agents, search systems and tested data pipelines. Available for Fall 2026, Spring 2027 and Summer 2027 internships and co-ops.", openGraph:{title:"Bryan James",description:"AI/ML engineer, data engineering, and full-stack development.",type:"website",images:[{url:"/og.png",width:1732,height:908,alt:"Bryan James, AI/ML engineer, data engineering, and full-stack development."}]}, icons:{icon:"/favicon.svg"} };
const themeScript = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}})()`;
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}} /></head><body className={`${sans.variable} ${mono.variable} antialiased`}>{children}</body></html>}
