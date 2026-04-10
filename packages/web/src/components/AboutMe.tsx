"use client";

import { motion } from "motion/react";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Code2,
  Heart,
  ArrowUpRight,
  Github,
  Twitter,
  Mail,
  BookOpen,
} from "lucide-react";

const timeline = [
  {
    year: "2024 — 至今",
    role: "高级全栈工程师",
    company: "某科技公司",
    description: "负责公司核心产品的前端架构和 AI 功能集成，推动团队技术升级。",
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
];

const skillCategories = [
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
];

const interests = [
  "开源社区", "AI 应用探索", "技术写作", "产品设计", "摄影", "跑步",
];

const socialLinks = [
  { icon: Github, label: "GitHub", href: "https://github.com", desc: "开源项目与贡献" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com", desc: "技术动态与思考" },
  { icon: BookOpen, label: "Blog", href: "/blog", desc: "技术博客文章" },
  { icon: Mail, label: "Email", href: "mailto:hello@example.com", desc: "hello@example.com" },
];

export default function AboutMe() {
  return (
    <section className="relative pt-28 pb-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(201,168,124,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-[20%] right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
        {/* Diagonal accent lines */}
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-300px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,124,0.06), transparent)' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero intro */}
        <div className="grid grid-cols-12 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="col-span-12 lg:col-span-7"
          >
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-tight mb-6">
              关于
              <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>我</span>
            </h1>
            <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl mb-6">
              一个热爱技术、追求极致体验的全栈工程师。从前端到后端，从传统 Web 开发到 AI 应用探索，
              我始终保持着对新技术的好奇心和学习热情。相信技术不仅能解决问题，更能创造美好的体验。
            </p>
            <p className="text-text-secondary text-base leading-relaxed max-w-2xl">
              工作之余，我热衷于开源贡献和技术写作，希望通过分享自己的经验和思考，
              帮助更多开发者成长。这个网站就是我记录技术旅程的地方。
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-text-tertiary font-heading">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-accent/60" />
                中国
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-[#6B9B97]/60" />
                全栈工程师
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Code2 size={14} className="text-[#B07A5B]/60" />
                6+ 年经验
              </span>
            </div>
          </motion.div>

          {/* Contact card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="col-span-12 lg:col-span-4 lg:col-start-9"
          >
            <div className="rounded-2xl border border-border bg-bg-elevated/50 backdrop-blur-sm p-6 space-y-3">
              <h3 className="text-xs font-mono font-semibold text-accent tracking-widest uppercase mb-4">
                联系方式
              </h3>
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="group flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-xl hover:bg-bg-surface/50 transition-all"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-surface border border-border group-hover:border-accent/20 transition-all">
                      <Icon size={15} className="text-text-tertiary group-hover:text-accent transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-heading font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {link.label}
                      </div>
                      <div className="text-xs text-text-tertiary truncate">{link.desc}</div>
                    </div>
                    <ArrowUpRight size={13} className="text-text-tertiary/30 group-hover:text-accent transition-colors shrink-0" />
                  </a>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-10"
          >
            <GraduationCap size={16} className="text-accent" />
            <span className="text-xs font-mono font-semibold text-accent tracking-widest uppercase">
              Experience Timeline
            </span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(201,168,124,0.15), transparent)' }} />
          </motion.div>

          <div className="space-y-6">
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card-hover group relative grid grid-cols-12 gap-4 rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-6 overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: `linear-gradient(to bottom, ${item.color}, ${item.color}33)` }} />

                {/* Year */}
                <div className="col-span-12 sm:col-span-3 flex items-start">
                  <span className="font-mono font-bold text-sm" style={{ color: item.color }}>
                    {item.year}
                  </span>
                </div>

                {/* Content */}
                <div className="col-span-12 sm:col-span-9">
                  <h3 className="font-heading font-bold text-base text-text-primary mb-1">
                    {item.role}
                  </h3>
                  <p className="text-xs text-text-tertiary font-heading mb-2">{item.company}</p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-10"
          >
            <Code2 size={16} className="text-[#6B9B97]" />
            <span className="text-xs font-mono font-semibold text-[#6B9B97] tracking-widest uppercase">
              Tech Skills
            </span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(107,155,151,0.15), transparent)' }} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {skillCategories.map((cat, ci) => (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ci * 0.12, duration: 0.5 }}
                className="rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-6"
              >
                <h3 className="font-heading font-bold text-sm mb-5" style={{ color: cat.color }}>
                  {cat.category}
                </h3>
                <div className="space-y-4">
                  {cat.skills.map((skill, si) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-heading text-text-primary">
                          {skill.name}
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary">
                          {skill.level}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-bg-surface overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + si * 0.1, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Heart size={16} className="text-[#B07A5B]" />
            <span className="text-xs font-mono font-semibold text-[#B07A5B] tracking-widest uppercase">
              Interests
            </span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(176,122,91,0.15), transparent)' }} />
          </div>

          <div className="flex flex-wrap gap-3">
            {interests.map((interest, i) => (
              <motion.span
                key={interest}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-4 py-2 rounded-xl border border-border bg-bg-elevated/40 text-sm font-heading text-text-secondary hover:border-accent/20 hover:text-accent cursor-default transition-all duration-300"
              >
                {interest}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
