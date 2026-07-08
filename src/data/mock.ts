export type JobType = "Full-time" | "Part-time" | "Remote" | "Contract" | "Internship";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  logo: string;
  location: string;
  type: JobType;
  category: string;
  salary: string;
  posted: string;
  deadline: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  employees: string;
  openJobs: number;
  logo: string;
  description: string;
}

export const companies: Company[] = [
  {
    id: "orbitai",
    name: "OrbitAI",
    industry: "AI",
    location: "San Francisco, CA",
    employees: "201-500",
    openJobs: 8,
    logo: "/logos/nvidia.png",
    description: "Building practical AI infrastructure for product and data teams.",
  },
  {
    id: "northstar-fintech",
    name: "Northstar Fintech",
    industry: "Fintech",
    location: "New York, NY",
    employees: "51-200",
    openJobs: 5,
    logo: "/logos/airbnb.png",
    description: "Modern payment and compliance tooling for growing finance teams.",
  },
  {
    id: "pixelcart",
    name: "PixelCart",
    industry: "E-Commerce",
    location: "Austin, TX",
    employees: "101-250",
    openJobs: 4,
    logo: "/logos/amazon.png",
    description: "A commerce platform helping independent brands scale online sales.",
  },
  {
    id: "devforge",
    name: "DevForge",
    industry: "Developer Tools",
    location: "Remote",
    employees: "11-50",
    openJobs: 6,
    logo: "/logos/google.png",
    description: "Developer workflow tools for faster reviews, deploys, and observability.",
  },
  {
    id: "cloudnest",
    name: "CloudNest",
    industry: "Cloud",
    location: "Seattle, WA",
    employees: "501-1,000",
    openJobs: 12,
    logo: "/logos/microsoft.png",
    description: "Secure cloud operations and managed platform services.",
  },
  {
    id: "greenmile",
    name: "GreenMile",
    industry: "Climate Tech",
    location: "Denver, CO",
    employees: "51-200",
    openJobs: 3,
    logo: "/logos/tesla.png",
    description: "Logistics software reducing waste and emissions across supply chains.",
  },
];

export const jobs: Job[] = [
  {
    id: "senior-product-designer",
    title: "Senior Product Designer",
    company: "OrbitAI",
    companyId: "orbitai",
    logo: "/logos/nvidia.png",
    location: "San Francisco, CA",
    type: "Full-time",
    category: "Design",
    salary: "$145k - $185k",
    posted: "2 days ago",
    deadline: "August 15, 2026",
    description: "Lead end-to-end design for AI workflow products used by fast-moving product teams.",
    responsibilities: ["Shape product direction with PM and engineering partners", "Design polished flows from discovery through handoff", "Run research sessions and turn findings into practical improvements"],
    requirements: ["5+ years designing SaaS or AI products", "Strong systems thinking and interaction design craft", "Comfort working with ambiguous product problems"],
    benefits: ["Flexible hybrid schedule", "Premium healthcare", "Learning budget"],
  },
  {
    id: "backend-engineer-payments",
    title: "Backend Engineer, Payments",
    company: "Northstar Fintech",
    companyId: "northstar-fintech",
    logo: "/logos/airbnb.png",
    location: "New York, NY",
    type: "Full-time",
    category: "Engineering",
    salary: "$135k - $170k",
    posted: "4 days ago",
    deadline: "August 3, 2026",
    description: "Build resilient payment APIs, ledger services, and internal tooling for finance teams.",
    responsibilities: ["Own backend services for subscription and billing flows", "Improve reliability, observability, and test coverage", "Collaborate with security and compliance stakeholders"],
    requirements: ["4+ years with Node.js, Go, Java, or similar", "Experience with payments, ledgers, or financial systems", "Strong database modeling skills"],
    benefits: ["Equity package", "Commuter stipend", "Paid parental leave"],
  },
  {
    id: "growth-marketing-manager",
    title: "Growth Marketing Manager",
    company: "PixelCart",
    companyId: "pixelcart",
    logo: "/logos/amazon.png",
    location: "Austin, TX",
    type: "Remote",
    category: "Marketing",
    salary: "$95k - $125k",
    posted: "1 week ago",
    deadline: "August 20, 2026",
    description: "Own acquisition campaigns for merchants and improve conversion across the funnel.",
    responsibilities: ["Plan and launch paid and lifecycle campaigns", "Partner with sales on lead quality and attribution", "Report weekly growth experiments and learnings"],
    requirements: ["3+ years in B2B SaaS growth", "Strong analytics and experimentation instincts", "Clear writing and campaign storytelling"],
    benefits: ["Remote-first team", "Home office stipend", "Quarterly retreats"],
  },
  {
    id: "developer-advocate",
    title: "Developer Advocate",
    company: "DevForge",
    companyId: "devforge",
    logo: "/logos/google.png",
    location: "Remote",
    type: "Contract",
    category: "Developer Relations",
    salary: "$80 - $110/hr",
    posted: "3 days ago",
    deadline: "July 30, 2026",
    description: "Create technical content and demos that help engineering teams adopt DevForge tools.",
    responsibilities: ["Write tutorials, sample apps, and launch posts", "Host webinars and community sessions", "Bring developer feedback into product planning"],
    requirements: ["Hands-on web development experience", "Portfolio of technical writing or talks", "Comfort explaining complex topics simply"],
    benefits: ["Flexible contract terms", "Conference budget", "Async collaboration"],
  },
  {
    id: "cloud-security-analyst",
    title: "Cloud Security Analyst",
    company: "CloudNest",
    companyId: "cloudnest",
    logo: "/logos/microsoft.png",
    location: "Seattle, WA",
    type: "Full-time",
    category: "Security",
    salary: "$110k - $150k",
    posted: "5 days ago",
    deadline: "August 8, 2026",
    description: "Monitor cloud environments, investigate alerts, and improve security posture for customers.",
    responsibilities: ["Review alerts and incident signals", "Tune detection rules and response playbooks", "Document findings for customer-facing reports"],
    requirements: ["2+ years in cloud security or SOC operations", "AWS or Azure fundamentals", "Strong written communication"],
    benefits: ["Certification support", "Wellness stipend", "On-call rotation pay"],
  },
  {
    id: "data-analyst-logistics",
    title: "Data Analyst, Logistics",
    company: "GreenMile",
    companyId: "greenmile",
    logo: "/logos/tesla.png",
    location: "Denver, CO",
    type: "Part-time",
    category: "Data",
    salary: "$55 - $75/hr",
    posted: "6 days ago",
    deadline: "August 12, 2026",
    description: "Analyze route, fuel, and delivery data to uncover savings for climate-focused logistics teams.",
    responsibilities: ["Build dashboards for operational KPIs", "Explore datasets for optimization opportunities", "Present findings to product and customer teams"],
    requirements: ["Strong SQL and dashboarding skills", "Experience with logistics or operations data", "Clear business communication"],
    benefits: ["Flexible hours", "Mission-driven team", "Remote-friendly setup"],
  },
];

export const jobTypes: JobType[] = ["Full-time", "Part-time", "Remote", "Contract", "Internship"];
export const categories = Array.from(new Set(jobs.map((job) => job.category)));
export const industries = Array.from(new Set(companies.map((company) => company.industry)));
