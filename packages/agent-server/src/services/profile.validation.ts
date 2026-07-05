import { z } from "zod";
import type { UpdateSiteProfileInput } from "@blog/shared";

const timelineItemSchema = z.object({
  year: z.string().min(1),
  role: z.string().min(1),
  company: z.string().min(1),
  description: z.string(),
  color: z.string().min(1),
});

const skillItemSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(0).max(100),
});

const skillCategorySchema = z.object({
  category: z.string().min(1),
  color: z.string().min(1),
  skills: z.array(skillItemSchema),
});

const socialLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  desc: z.string().optional(),
  icon: z.enum(["github", "twitter", "mail", "book", "linkedin"]),
});

const heroBentoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  desc: z.string(),
  icon: z.enum(["file-text", "folder-git", "bot", "briefcase"]),
  href: z.string().min(1),
  span: z.string().optional(),
  gradient: z.string().optional(),
  iconColor: z.string().optional(),
  stat: z.string().optional(),
});

export const updateSiteProfileSchema = z.object({
  name: z.string().min(1).optional(),
  tagline: z.string().optional(),
  headline: z.string().optional(),
  heroSubtitle: z.string().optional(),
  location: z.string().optional(),
  role: z.string().optional(),
  experienceLabel: z.string().optional(),
  bioParagraphs: z.array(z.string()).optional(),
  timeline: z.array(timelineItemSchema).optional(),
  skillCategories: z.array(skillCategorySchema).optional(),
  interests: z.array(z.string()).optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  heroBento: z.array(heroBentoSchema).optional(),
});

export function parseUpdateSiteProfileInput(
  input: unknown,
): UpdateSiteProfileInput {
  return updateSiteProfileSchema.parse(input);
}
