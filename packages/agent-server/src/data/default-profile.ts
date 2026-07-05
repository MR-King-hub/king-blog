import type {
  SiteProfile,
  UpdateSiteProfileInput,
  TimelineItem,
  SkillCategory,
  SocialLink,
  HeroBentoItem,
} from "@relayagent/shared";

const DEFAULT_PROFILE: Omit<SiteProfile, "updatedAt"> = {
  name: "Shizhe",
  tagline: "Full-stack · AI Explorer",
  headline: "Hi, 我是",
  heroSubtitle:
    "一个热爱技术的全栈工程师，专注于前端开发与 AI 应用探索。在这里记录技术思考、分享项目经验、探索 AI 时代的可能性。",
  location: "中国",
  role: "全栈工程师",
  experienceLabel: "6+ 年经验",
  bioParagraphs: [
    "一个热爱技术、追求极致体验的全栈工程师。从前端到后端，从传统 Web 开发到 AI 应用探索，我始终保持着对新技术的好奇心和学习热情。相信技术不仅能解决问题，更能创造美好的体验。",
    "工作之余，我热衷于开源贡献和技术写作，希望通过分享自己的经验和思考，帮助更多开发者成长。这个网站就是我记录技术旅程的地方。",
  ],
  timeline: [
    {
      year: "2024 — 至今",
      role: "高级全栈工程师",
      company: "某科技公司",
      description:
        "负责公司核心产品的前端架构和 AI 功能集成，推动团队技术升级。",
      color: "#C9A87C",
    },
    {
      year: "2022 — 2024",
      role: "前端工程师",
      company: "某互联网公司",
      description: "主导多个业务线的前端开发，建设组件库和前端工程化体系。",
      color: "#6B9B97",
    },
    {
      year: "2020 — 2022",
      role: "初级开发工程师",
      company: "某创业公司",
      description: "全栈开发，从零到一搭建多个产品的前后端系统。",
      color: "#B07A5B",
    },
    {
      year: "2016 — 2020",
      role: "计算机科学",
      company: "某大学",
      description: "本科学习期间开始接触开源社区，参与多个校园技术项目。",
      color: "#9B7E9B",
    },
  ],
  skillCategories: [
    {
      category: "前端",
      color: "#6B9B97",
      skills: [
        { name: "React / Next.js", level: 95 },
        { name: "TypeScript", level: 90 },
        { name: "Vue.js", level: 80 },
        { name: "Tailwind CSS", level: 92 },
      ],
    },
    {
      category: "后端",
      color: "#C9A87C",
      skills: [
        { name: "Node.js / Express", level: 88 },
        { name: "Python / FastAPI", level: 75 },
        { name: "PostgreSQL", level: 80 },
        { name: "Redis", level: 72 },
      ],
    },
    {
      category: "AI / 工具",
      color: "#B07A5B",
      skills: [
        { name: "LangChain / RAG", level: 70 },
        { name: "Prompt Engineering", level: 85 },
        { name: "Docker / CI/CD", level: 78 },
        { name: "Git 工作流", level: 92 },
      ],
    },
  ],
  interests: [
    "开源社区",
    "AI 应用探索",
    "技术写作",
    "产品设计",
    "摄影",
    "跑步",
  ],
  socialLinks: [
    {
      icon: "github",
      label: "GitHub",
      href: "https://github.com",
      desc: "开源项目与贡献",
    },
    {
      icon: "twitter",
      label: "Twitter",
      href: "https://twitter.com",
      desc: "技术动态与思考",
    },
    {
      icon: "book",
      label: "Blog",
      href: "/blog",
      desc: "技术博客文章",
    },
    {
      icon: "mail",
      label: "Email",
      href: "mailto:hello@example.com",
      desc: "hello@example.com",
    },
  ],
  heroBento: [
    {
      id: "blog",
      title: "技术博客",
      desc: "分享前端、AI 和全栈开发的思考与实践",
      icon: "file-text",
      href: "/blog",
      span: "md:col-span-2",
      gradient:
        "linear-gradient(135deg, rgba(107,155,151,0.06) 0%, rgba(201,168,124,0.04) 100%)",
      iconColor: "#6B9B97",
      stat: "12 篇文章",
    },
    {
      id: "projects",
      title: "项目作品",
      desc: "开源项目与个人作品集",
      icon: "folder-git",
      href: "/projects",
      span: "md:col-span-1",
      gradient:
        "linear-gradient(135deg, rgba(201,168,124,0.06) 0%, rgba(176,122,91,0.04) 100%)",
      iconColor: "#C9A87C",
      stat: "8 个项目",
    },
    {
      id: "ai",
      title: "AI 实验室",
      desc: "探索 AI 驱动的创新应用与交互",
      icon: "bot",
      href: "#",
      span: "md:col-span-1",
      gradient:
        "linear-gradient(135deg, rgba(176,122,91,0.06) 0%, rgba(155,126,155,0.04) 100%)",
      iconColor: "#B07A5B",
      stat: "进行中",
    },
    {
      id: "about",
      title: "关于我",
      desc: "个人经历、技术栈与联系方式",
      icon: "briefcase",
      href: "/about",
      span: "md:col-span-2",
      gradient:
        "linear-gradient(135deg, rgba(155,126,155,0.06) 0%, rgba(107,155,151,0.04) 100%)",
      iconColor: "#9B7E9B",
      stat: "了解更多 →",
    },
  ],
};

export function getDefaultProfileSeedData() {
  return {
    id: "default",
    name: DEFAULT_PROFILE.name,
    tagline: DEFAULT_PROFILE.tagline,
    headline: DEFAULT_PROFILE.headline,
    heroSubtitle: DEFAULT_PROFILE.heroSubtitle,
    location: DEFAULT_PROFILE.location,
    role: DEFAULT_PROFILE.role,
    experienceLabel: DEFAULT_PROFILE.experienceLabel,
    bioParagraphs: JSON.stringify(DEFAULT_PROFILE.bioParagraphs),
    timeline: JSON.stringify(DEFAULT_PROFILE.timeline),
    skillCategories: JSON.stringify(DEFAULT_PROFILE.skillCategories),
    interests: JSON.stringify(DEFAULT_PROFILE.interests),
    socialLinks: JSON.stringify(DEFAULT_PROFILE.socialLinks),
    heroBento: JSON.stringify(DEFAULT_PROFILE.heroBento),
  };
}

export { DEFAULT_PROFILE };

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function rowToSiteProfile(row: {
  name: string;
  tagline: string;
  headline: string;
  heroSubtitle: string;
  location: string;
  role: string;
  experienceLabel: string;
  bioParagraphs: string;
  timeline: string;
  skillCategories: string;
  interests: string;
  socialLinks: string;
  heroBento: string;
  updatedAt: Date;
}): SiteProfile {
  return {
    name: row.name,
    tagline: row.tagline,
    headline: row.headline,
    heroSubtitle: row.heroSubtitle,
    location: row.location,
    role: row.role,
    experienceLabel: row.experienceLabel,
    bioParagraphs: parseJson<string[]>(row.bioParagraphs, []),
    timeline: parseJson<TimelineItem[]>(row.timeline, []),
    skillCategories: parseJson<SkillCategory[]>(row.skillCategories, []),
    interests: parseJson<string[]>(row.interests, []),
    socialLinks: parseJson<SocialLink[]>(row.socialLinks, []),
    heroBento: parseJson<HeroBentoItem[]>(row.heroBento, []),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function inputToUpdateData(input: UpdateSiteProfileInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.tagline !== undefined && { tagline: input.tagline }),
    ...(input.headline !== undefined && { headline: input.headline }),
    ...(input.heroSubtitle !== undefined && { heroSubtitle: input.heroSubtitle }),
    ...(input.location !== undefined && { location: input.location }),
    ...(input.role !== undefined && { role: input.role }),
    ...(input.experienceLabel !== undefined && {
      experienceLabel: input.experienceLabel,
    }),
    ...(input.bioParagraphs !== undefined && {
      bioParagraphs: JSON.stringify(input.bioParagraphs),
    }),
    ...(input.timeline !== undefined && {
      timeline: JSON.stringify(input.timeline),
    }),
    ...(input.skillCategories !== undefined && {
      skillCategories: JSON.stringify(input.skillCategories),
    }),
    ...(input.interests !== undefined && {
      interests: JSON.stringify(input.interests),
    }),
    ...(input.socialLinks !== undefined && {
      socialLinks: JSON.stringify(input.socialLinks),
    }),
    ...(input.heroBento !== undefined && {
      heroBento: JSON.stringify(input.heroBento),
    }),
  };
}
