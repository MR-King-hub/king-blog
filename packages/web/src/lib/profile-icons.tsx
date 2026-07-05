import type { BentoIcon, SocialIcon } from "@blog/shared";
import {
  Github,
  Twitter,
  Mail,
  BookOpen,
  FileText,
  FolderGit2,
  Bot,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export const SOCIAL_ICON_MAP: Record<SocialIcon, LucideIcon> = {
  github: Github,
  twitter: Twitter,
  mail: Mail,
  book: BookOpen,
  linkedin: Github,
};

export const BENTO_ICON_MAP: Record<BentoIcon, LucideIcon> = {
  "file-text": FileText,
  "folder-git": FolderGit2,
  bot: Bot,
  briefcase: Briefcase,
};
