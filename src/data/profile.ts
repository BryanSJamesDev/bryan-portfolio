export type Link = { label: string; href: string };

export type Experience = {
  role: string;
  org: string;
  logo?: string; // path like "/logos/infyz.png"
  location: string;
  dates: string;
  bullets: string[];
  tags: string[];
};

export type Project = {
  title: string;
  dates: string;
  headline: string;
  bullets: string[];
  stack: string[];
  kind: "Software" | "ML" | "Data";
};

export type Education = {
  school: string;
  degree: string;
  logo?: string;
  location: string;
  dates: string;
  courses: string[];
};

export const profile = {
  name: "Bryan Samuel James",
  location: "Boston, MA",
  tagline: "I build reliable software and ML-powered products that ship.",
  availability: "Available for Summer 2026 co-op (from May 2026).",

  // Click-on-photo quotes (Hero.tsx will rotate these)
  photoQuote: "If you made it here, we should talk.",


  emailPrimary: "bryansamjames@gmail.com",
  emailSchool: "lnu.br@northeastern.edu",

  links: [
    { label: "LinkedIn", href: "https://linkedin.com/in/bryan-james-1530891b3" },
    { label: "GitHub", href: "https://github.com/BryanSJamesDev" },
    { label: "Blog", href: "https://bryanjames.hashnode.dev" }
  ] as Link[],

  heroBadges: ["Software Engineering", "Machine Learning", "Data Engineering", "DevOps / CI"],

  about: [
    "MSCS student at Northeastern (Boston) focused on building production-ready systems.",
    "I like work that sits at the intersection of clean engineering, measurable impact, and strong fundamentals.",
    "Recent work spans Java ERP automation, monitoring dashboards, and ML projects in healthcare and forecasting."
  ],

  education: [
    {
      school: "Northeastern University",
      degree: "M.S. Computer Science",
      logo: "/logos/neu.png",
      location: "Boston, MA",
      dates: "Sep 2025 – Dec 2027",
      courses: [
        "Programming Design Paradigm",
        "Database Management Systems",
        "Algorithms",
        "Essentials of Data Science"
      ]
    },
    {
      school: "Vellore Institute of Technology (VIT)",
      degree: "B.Tech, Information Technology",
      logo: "/logos/vit.png",
      location: "India",
      dates: "Jul 2021 – May 2025",
      courses: [
        "Data Structures and Algorithms",
        "Operating Systems",
        "Software Engineering",
        "AI",
        "Probability and Statistics"
      ]
    }
  ] as Education[],

  experience: [
    {
      role: "Software Engineering Intern",
      org: "Infyz Solutions Pvt Ltd",
      logo: "/logos/infyz.png",
      location: "Remote",
      dates: "Aug 2023 – Jan 2024",
      bullets: [
        "Built Java ERP modules and integrations to automate reporting and data sync; reduced manual hand-offs by ~30%.",
        "Refactored legacy tools into modular OOP components; added monitoring dashboards (Python/SQL/shell) that caught ~25% of performance issues pre-production.",
        "Partnered with QA/product/dev to gather requirements, write design docs, and run code reviews; shipped via Git, CI/CD, and Docker in Agile sprints."
      ],
      tags: ["Java", "CI/CD", "Docker", "Monitoring", "SQL"]
    },
    {
      role: "IT Intern",
      org: "NBTC Company",
      logo: "/logos/nbtc.png",
      location: "On-site",
      dates: "Oct 2023 – Dec 2023",
      bullets: [
        "Customized SAP ERP modules using ABAP and built automation integrating data sources; reduced manual tasks ~25–35%.",
        "Converted legacy utilities into reusable services; built performance-monitoring tools and dashboards with JavaScript + Bash; supported containerized delivery."
      ],
      tags: ["ABAP", "Automation", "Dashboards", "JavaScript", "Bash"]
    }
  ] as Experience[],

  projects: [
    {
      title: "Order Management System with Fraud Detection & Forecasting",
      dates: "Dec 2024 – Apr 2025",
      headline: "Full-stack order workflow with forecasting models and operational automation.",
      bullets: [
        "Implemented authentication, real-time inventory tracking, and automated notifications.",
        "Containerized with Docker and integrated LSTM / ARIMA / Prophet forecasting."
      ],
      stack: ["Python", "SQL", "Docker", "LSTM", "ARIMA", "Prophet"],
      kind: "Software"
    },
    {
      title: "Hybrid Deep Learning for Breast Lesion Segmentation & Classification",
      dates: "Sep 2024 – Oct 2025",
      headline: "CNN + Transformer modeling on ultrasound images; evaluated clinical trade-offs.",
      bullets: [
        "Built and compared segmentation/classification pipelines for ultrasound images.",
        "Reported results (82.9% accuracy, 87.7% AUC) and documented model trade-offs."
      ],
      stack: ["PyTorch", "TensorFlow", "Transformers", "OpenCV"],
      kind: "ML"
    },
    {
      title: "Predicting Mental Health Risks (IGD & Cyberbullying)",
      dates: "Jan 2024 – Aug 2024",
      headline: "Multi-model classification across multi-source datasets with strong LSTM performance.",
      bullets: [
        "Trained logistic regression, random forest, CNN, and LSTM baselines.",
        "Best LSTM reached 91.6% accuracy (F1 = 0.94)."
      ],
      stack: ["Scikit-Learn", "Keras", "LSTM", "Pandas"],
      kind: "ML"
    }
  ] as Project[],

  moreProjects: [
    "Caterpillar Hackathon: voice inspection pipeline (speech-to-text, anomaly detection, EDA).",
    "Vehicle Rental Management System: Python + MySQL (normalized schema, CRUD APIs, reporting dashboards).",
    "Student Expense Tracker: Java desktop app (storage, validation, CSV/Excel export)."
  ],

  publications: [
    "Hybrid Deep Learning for Breast Lesion Segmentation and Classification (under review).",
    "Thyroid Disease Prediction Using ML Models (Book Chapter, Jan 2025)."
  ],

  skills: {
    languages: ["Python", "Java", "JavaScript", "TypeScript", "C/C++", "SQL", "Bash", "Go", "R", "HTML/CSS"],
    frameworks: ["React", "Node.js", "PyTorch", "TensorFlow", "Scikit-Learn"],
    tooling: ["Git", "Docker", "Linux", "Jira", "CI/CD (GitHub Actions)", "Postman", "Tableau", "Power BI"],
    domains: ["Data Engineering", "MLOps", "Computer Vision", "NLP", "Time Series"]
  },

  // Shortcuts for the Ctrl+K command palette
  shortcuts: [
    { label: "Jump: Projects", href: "#projects" },
    { label: "Jump: Experience", href: "#experience" },
    { label: "Jump: Skills", href: "#skills" },
    { label: "Jump: Contact", href: "#contact" },
    { label: "Open LinkedIn", href: "https://linkedin.com/in/bryan-james-1530891b3" },
    { label: "Open GitHub", href: "https://github.com/BryanSJamesDev" },
    { label: "Open Blog", href: "https://bryanjames.hashnode.dev" }
  ] as Link[]
};
