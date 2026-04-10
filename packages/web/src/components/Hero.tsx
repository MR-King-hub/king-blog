"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  FileText,
  FolderGit2,
  Bot,
  Github,
  Twitter,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";

const bentoItems = [
  {
    id: "blog",
    title: "技术博客",
    desc: "分享前端、AI 和全栈开发的思考与实践",
    icon: FileText,
    href: "/blog",
    span: "md:col-span-2",
    gradient: "linear-gradient(135deg, rgba(107,155,151,0.06) 0%, rgba(201,168,124,0.04) 100%)",
    iconColor: "#6B9B97",
    stat: "12 篇文章",
  },
  {
    id: "projects",
    title: "项目作品",
    desc: "开源项目与个人作品集",
    icon: FolderGit2,
    href: "/projects",
    span: "md:col-span-1",
    gradient: "linear-gradient(135deg, rgba(201,168,124,0.06) 0%, rgba(176,122,91,0.04) 100%)",
    iconColor: "#C9A87C",
    stat: "8 个项目",
  },
  {
    id: "ai",
    title: "AI 实验室",
    desc: "探索 AI 驱动的创新应用与交互",
    icon: Bot,
    href: "#",
    span: "md:col-span-1",
    gradient: "linear-gradient(135deg, rgba(176,122,91,0.06) 0%, rgba(155,126,155,0.04) 100%)",
    iconColor: "#B07A5B",
    stat: "进行中",
  },
  {
    id: "about",
    title: "关于我",
    desc: "个人经历、技术栈与联系方式",
    icon: Briefcase,
    href: "/about",
    span: "md:col-span-2",
    gradient: "linear-gradient(135deg, rgba(155,126,155,0.06) 0%, rgba(107,155,151,0.04) 100%)",
    iconColor: "#9B7E9B",
    stat: "了解更多 →",
  },
];

const socialLinks = [
  { icon: Github, label: "GitHub", href: "https://github.com" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Mail, label: "Email", href: "mailto:hello@example.com" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28 pb-20">
      {/* Background layers */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient mesh */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,168,124,0.04)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,124,0.25) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,124,0.25) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        {/* Diagonal accent lines */}
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-200px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,124,0.07), transparent)' }} />
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-260px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(107,155,151,0.05), transparent)' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Asymmetric hero layout: 12-col grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column: Personal intro */}
          <motion.div
            initial={{ opacity: 0, x: -40, skewX: 2 }}
            animate={{ opacity: 1, x: 0, skewX: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-7 lg:col-start-1 pt-8 lg:pt-16"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/8 border border-accent/15 mb-8"
            >
              <Sparkles size={13} className="text-accent" />
              <span className="text-xs font-heading font-semibold text-accent tracking-wide uppercase">
                Full-stack · AI Explorer
              </span>
            </motion.div>

            {/* Main heading */}
            <h1 className="font-heading font-extrabold leading-[0.95] tracking-tight">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary">
                Hi, 我是
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-2">
                <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Shizhe</span>
              </span>
            </h1>

            {/* Sub text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 ml-1 max-w-lg text-text-secondary text-base sm:text-lg leading-relaxed font-body"
            >
              一个热爱技术的<span className="text-text-primary font-semibold">全栈工程师</span>，
              专注于前端开发与 AI 应用探索。在这里记录技术思考、分享项目经验、探索 AI 时代的可能性。
            </motion.p>

            {/* Location & role */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-tertiary font-heading"
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-accent/60" />
                中国
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} className="text-teal/60" />
                全栈工程师
              </span>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <a
                href="/blog"
                className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-heading font-bold text-sm text-text-inverse overflow-hidden transition-all"
              >
                <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }} />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 50%, #A8896A 100%)' }} />
                <span className="relative z-10">阅读博客</span>
                <ArrowRight
                  size={16}
                  className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <a
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-heading font-semibold text-sm text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all duration-300"
              >
                查看项目
              </a>
            </motion.div>

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8 flex items-center gap-2"
            >
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-tertiary hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                    title={s.label}
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right column: Status card */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-4 lg:col-start-9 flex items-start lg:pt-8"
          >
            <div className="w-full rounded-3xl border border-border bg-bg-elevated/50 backdrop-blur-sm p-6 space-y-4 relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24" style={{ background: 'linear-gradient(to bottom left, rgba(201,168,124,0.06), transparent)' }} />

              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6B9B97] animate-pulse" />
                <span className="text-[10px] font-mono font-semibold text-[#6B9B97] tracking-widest uppercase">
                  当前状态
                </span>
              </div>

              {[
                { label: "正在探索", value: "AI Agent", color: "text-accent" },
                { label: "技术栈", value: "React / Next.js", color: "text-[#6B9B97]" },
                { label: "最近更新", value: "2 天前", color: "text-[#B07A5B]" },
                { label: "开源项目", value: "8 个", color: "text-accent-bright" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <span className="text-xs text-text-tertiary font-heading">
                    {stat.label}
                  </span>
                  <span className={`font-mono font-bold text-sm ${stat.color}`}>
                    {stat.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bento Grid — module entries */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5">
          {bentoItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.id}
                href={item.href}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8 + i * 0.12,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`${item.span} card-hover group relative rounded-2xl border border-border bg-bg-elevated/60 backdrop-blur-sm p-7 overflow-hidden block`}
              >
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: item.gradient }} />
                {/* Background glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: item.gradient }} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${item.iconColor}15` }}
                    >
                      <Icon size={20} style={{ color: item.iconColor }} />
                    </div>
                    <span className="text-xs font-mono text-text-tertiary/50 font-semibold">
                      {item.stat}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-text-primary mb-2 group-hover:text-accent transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
