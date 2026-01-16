export const siteConfig = {
  name: "SaaS Starter",
  description: "A production-ready SaaS starter template with Next.js, Stripe, and more.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  author: "Your Company",
  twitter: "@yourcompany",
  keywords: [
    "saas",
    "nextjs",
    "react",
    "typescript",
    "stripe",
    "payments",
    "subscriptions",
  ],
  links: {
    twitter: "https://twitter.com/yourcompany",
    github: "https://github.com/yourcompany",
    docs: "/docs",
  },
};

export type SiteConfig = typeof siteConfig;
