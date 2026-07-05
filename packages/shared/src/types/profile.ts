// ============================================================
// 站点个人资料 / 简历相关类型
// ============================================================

export interface TimelineItem {
  year: string;
  role: string;
  company: string;
  description: string;
  color: string;
}

export interface SkillItem {
  name: string;
  level: number;
}

export interface SkillCategory {
  category: string;
  color: string;
  skills: SkillItem[];
}

export type SocialIcon =
  | "github"
  | "twitter"
  | "mail"
  | "book"
  | "linkedin";

export interface SocialLink {
  label: string;
  href: string;
  desc?: string;
  icon: SocialIcon;
}

export type BentoIcon =
  | "file-text"
  | "folder-git"
  | "bot"
  | "briefcase";

export interface HeroBentoItem {
  id: string;
  title: string;
  desc: string;
  icon: BentoIcon;
  href: string;
  span?: string;
  gradient?: string;
  iconColor?: string;
  stat?: string;
}

export interface SiteProfile {
  name: string;
  tagline: string;
  headline: string;
  heroSubtitle: string;
  location: string;
  role: string;
  experienceLabel: string;
  bioParagraphs: string[];
  timeline: TimelineItem[];
  skillCategories: SkillCategory[];
  interests: string[];
  socialLinks: SocialLink[];
  heroBento: HeroBentoItem[];
  updatedAt: string;
}

export interface UpdateSiteProfileInput {
  name?: string;
  tagline?: string;
  headline?: string;
  heroSubtitle?: string;
  location?: string;
  role?: string;
  experienceLabel?: string;
  bioParagraphs?: string[];
  timeline?: TimelineItem[];
  skillCategories?: SkillCategory[];
  interests?: string[];
  socialLinks?: SocialLink[];
  heroBento?: HeroBentoItem[];
}
