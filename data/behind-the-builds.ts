/* "Behind the builds" — a manually curated selection of LinkedIn posts about the
   hackathons and build nights behind the projects. Not a live feed. Order is the
   curated order; the component shows a rotating stack of the front three.

   publishedAt is a plain YYYY-MM-DD string — render it with formatPostDate() so
   the calendar date never shifts under timezone conversion. */

export type BehindTheBuildPost = {
  id: number;
  title: string;
  excerpt: string;
  publishedAt: string;
  linkedinUrl: string;
  imageSrc: string;
  imageAlt: string;
};

export const behindTheBuilds: BehindTheBuildPost[] = [
  {
    "id": 0,
    "title": "ManualMind — Frontiers Gen-AI Hackathon at MIT",
    "excerpt": "A 12-hour hackathon at MIT presented by Breakthrough Ventures with Google DeepMind. My team built ManualMind, turning dense industrial equipment manuals into interactive training: cited Q&A, learning plans, quizzes, a glossary, and manager-side visibility into progress.",
    "publishedAt": "2026-03-08",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_hackathon-generativeai-frontiershackathon-activity-7436492497905946625-x_Fp",
    "imageSrc": "/behind-the-builds/post-1.jpg",
    "imageAlt": "Bryan with his team at the Frontiers Gen-AI Hackathon at MIT"
  },
  {
    "id": 1,
    "title": "AutoBrief — Agent Forge Hackathon, Top 20",
    "excerpt": "Agent Forge AI Hackathon in Sunnyvale. We built AutoBrief, a car-buying advisor that turns a natural-language brief into a structured search, pulls live CarMax and Carvana listings, scores each vehicle, and writes summaries explaining the fit. Made the Top 20.",
    "publishedAt": "2026-05-18",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_ai-hackathon-siliconvalley-activity-7461953636806316032-Az8T",
    "imageSrc": "/behind-the-builds/post-2.jpg",
    "imageAlt": "Bryan and teammates presenting AutoBrief at the Agent Forge AI Hackathon"
  },
  {
    "id": 2,
    "title": "AgentFirst — InsForge Agentic Dev Tools Hackathon",
    "excerpt": "InsForge Agentic Dev Tools Hackathon in San Francisco. AgentFirst is an AI agent that shops, designs and checks out for you inside ChatGPT — browsing products, generating custom merch with AI, managing a cart and paying with Stripe, backed by MCP.",
    "publishedAt": "2026-06-08",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_hackathon-ai-agenticai-activity-7469875608513101824-7Nhz",
    "imageSrc": "/behind-the-builds/post-3.jpg",
    "imageAlt": "Bryan with teammates at the InsForge Agentic Dev Tools Hackathon in San Francisco"
  },
  {
    "id": 3,
    "title": "Vibe-Pair — Agents You Love 2",
    "excerpt": "Agents You Love 2 Hackathon, San Francisco. Built Vibe-Pair, a teammate-and-event matching agent that pulls context from GitHub, Slack, Linear and Gmail to read collaboration history, surface relevant matches, and connect people with the right upcoming events.",
    "publishedAt": "2026-08-02",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_hackathon-aiagents-agenticai-activity-7489504012732649472-PLdq",
    "imageSrc": "/behind-the-builds/post-4.jpg",
    "imageAlt": "Bryan with a teammate at the Agents You Love 2 Hackathon in San Francisco"
  },
  {
    "id": 4,
    "title": "Cup-stacking robot — Physical AI Sprint",
    "excerpt": "Physical AI Sprint Hackathon in SF, hosted by NVIDIA, Nebius, Antioch and Toloka. We built toward an autonomous cup-stacking robot: real-time OpenCV detection, camera-to-arm calibration, and full inverse-kinematics control of a SO-ARM101, plus dry-run and emergency-stop modes.",
    "publishedAt": "2026-08-20",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_physicalai-hackathon-robotics-activity-7496330316526071808-kYdj",
    "imageSrc": "/behind-the-builds/post-5.jpg",
    "imageAlt": "Photos from the Physical AI Sprint Hackathon: the SO-ARM101 arm, the team, and the venue"
  },
  {
    "id": 5,
    "title": "Roast My PR — build night at GitHub HQ",
    "excerpt": "“Roast My PR” at GitHub HQ, San Francisco, run by WeMakeDevs with Qodo and Port.io. Fork a real app, ship features live, and let Qodo’s AI roast your PR before you’re allowed to merge. Met Kunal Kushwaha in person.",
    "publishedAt": "2026-08-28",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_roastmypr-qodo-aicodereview-activity-7499214631173767168-4GtE",
    "imageSrc": "/behind-the-builds/post-6.jpg",
    "imageAlt": "Bryan at the Roast My PR build night at GitHub HQ, San Francisco"
  },
  {
    "id": 6,
    "title": "parity-agent — Agent Harness Hackathon",
    "excerpt": "Agent Harness Hackathon in SF. Built parity-agent, an AI agent that detects when you’re shown a different price than someone else for the same product — running on TrueForge, reading each country’s page via Bright Data, and self-healing when the layout changes.",
    "publishedAt": "2026-08-31",
    "linkedinUrl": "https://www.linkedin.com/posts/bryan-james-1530891b3_agentharnesshackathon-aiagents-trueforge-activity-7500005887277793280-ldox",
    "imageSrc": "/behind-the-builds/post-7.jpg",
    "imageAlt": "Audience and demo screens at the Agent Harness Hackathon in San Francisco"
  }
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* "2026-03-08" -> "Mar 8, 2026" with no Date parsing, so the day can't drift a
   timezone. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = MONTHS[(m ?? 1) - 1] ?? "";
  return `${month} ${d}, ${y}`;
}
