export type Project = { slug: string; name: string; subtitle: string; repo: string; description: string; tags: string[]; team: boolean; image?: string };
export const projects: Project[] = [
  {
    "slug": "agentfirst",
    "name": "AgentFirst",
    "subtitle": "MCP-based AI commerce agent",
    "repo": "https://github.com/aryayt/insforge-hk-agentfirst",
    "description": "An AI agent that browses, reasons over what it finds, and completes a full transaction on its own inside ChatGPT using MCP, not a scripted demo. Shipped full-stack: TypeScript/Bun REST API, React frontend, Stripe payments, PostgreSQL, automated tests validating every layer.",
    "tags": [
      "TypeScript",
      "React",
      "Bun",
      "Stripe",
      "PostgreSQL",
      "MCP"
    ],
    "team": true
  },
  {
    "slug": "patent-search",
    "name": "Patent Search Engine",
    "subtitle": "Hybrid search with reranking",
    "repo": "https://github.com/BryanSJamesDev/thinkstruct-patent-search",
    "description": "Hybrid search engine over 10,578 patent claims: SQL pre-filtering, sentence-transformer embeddings in FAISS for semantic vector search, cross-encoder reranking, served via FastAPI. Caught a correctness bug in a naive filter-after design that missed 40 of 41 true matches, a filter-first architecture avoided it entirely.",
    "tags": [
      "Python",
      "FAISS",
      "sentence-transformers",
      "FastAPI",
      "Search/Retrieval"
    ],
    "team": false
  },
  {
    "slug": "parity-agent",
    "name": "Parity-Agent",
    "subtitle": "Dynamic pricing detection agent",
    "repo": "https://github.com/BryanSJamesDev/parity-agent",
    "description": "Agent on the TrueForge harness that detects personalized and dynamic pricing by fetching the same product from isolated, different-country sessions and diffing normalized prices, using Bright Data wrapped as a custom MCP server. Verified a correct negative on Amazon and a real ~99% regional price spread on Steam. Built self-healing selector repair that detects broken scrapers, relocates the price element via a model, and validates the fix before persisting it.",
    "tags": [
      "Python",
      "FastAPI",
      "React",
      "TrueForge",
      "MCP",
      "Bright Data"
    ],
    "team": false
  },
  {
    "slug": "contract-guard",
    "name": "Contract-Guard",
    "subtitle": "Schema-contract-enforced ingestion",
    "repo": "https://github.com/BryanSJamesDev/contract-guard",
    "description": "Dual ingestion pipelines (naive vs. contract-validated) in Python with Airflow and dbt, quarantining schema drift before it reaches downstream reporting. Proved it with a controlled 200-trial experiment: 100% catch rate on breaking schema drift, 0% false positives, +15.5ms median overhead.",
    "tags": [
      "Python",
      "Airflow",
      "dbt",
      "SQL"
    ],
    "team": false
  },
  {
    "slug": "ops",
    "name": "Order Processing System (OPS)",
    "subtitle": "Real-time order tracking and forecasting",
    "repo": "https://github.com/BryanSJamesDev/-Order-Processing-System-OPS-",
    "description": "A multi-tab desktop order management system: SQLite-backed order and inventory tracking, email-based order intake that parses incoming Gmail messages via IMAP and sends confirmation/low-stock alerts via SMTP, a random-forest model flagging suspicious orders, and demand forecasting implemented three ways (LSTM, ARIMA, Prophet).",
    "tags": [
      "Python",
      "Tkinter",
      "SQLite",
      "scikit-learn",
      "Keras",
      "Prophet"
    ],
    "team": false
  },
  {
    "slug": "robot-pipeline",
    "name": "robot-perception-action-pipeline",
    "subtitle": "Physical AI",
    "repo": "https://github.com/BryanSJamesDev/robot-perception-action-pipeline",
    "description": "Perception-action pipeline for a SO-ARM101 robotic arm using OpenCV and the lerobot/Feetech servo stack, built at the Physical AI Sprint Hackathon (Nebius/NVIDIA/Antioch/Toloka).",
    "tags": [
      "Python",
      "OpenCV",
      "lerobot",
      "Robotics"
    ],
    "team": false
  }
];
