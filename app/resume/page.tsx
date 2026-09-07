import Link from "next/link";
export const metadata = { title: "Resume | Bryan James" };
export default function Resume(){return <main className="resume-page"><p className="mono">bryan.james / resume</p><h1>Resume</h1><p>The downloadable PDF will be added here. In the meantime, email me for a current copy.</p><a href="mailto:bryansamjames@gmail.com?subject=Resume%20request">Request my resume ↗</a><p><Link href="/">← Back to portfolio</Link></p></main>}
