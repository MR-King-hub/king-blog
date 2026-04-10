"use client";

import { motion } from "motion/react";
import { Github, Twitter, Mail, Rss, ArrowRight, Zap } from "lucide-react";

const footerLinks = [
  {
    title: "导航",
    links: [
      { name: "首页", href: "/" },
      { name: "博客", href: "/blog" },
      { name: "项目", href: "/projects" },
      { name: "关于", href: "/about" },
    ],
  },
  {
    title: "资源",
    links: [
      { name: "RSS 订阅", href: "#" },
      { name: "GitHub", href: "https://github.com" },
      { name: "Twitter", href: "https://twitter.com" },
    ],
  },
];

const socialIcons = [
  { icon: Github, label: "GitHub", href: "https://github.com" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Rss, label: "RSS", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:hello@example.com" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border">
      {/* Subscribe CTA */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #0F1628, #0A0E1A, #0F1628)' }} />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(rgba(201,168,124,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,124,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-12 gap-8 items-center"
          >
            {/* Left text */}
            <div className="col-span-12 lg:col-span-6">
              <h3 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary leading-tight">
                保持联系
                <br />
                <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>订阅更新</span>
              </h3>
              <p className="mt-4 text-text-secondary max-w-md">
                订阅我的技术博客，第一时间获取最新文章和项目动态。
              </p>
            </div>

            {/* Right form */}
            <div className="col-span-12 lg:col-span-5 lg:col-start-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-5 py-3.5 rounded-2xl bg-bg-elevated border border-border text-text-primary text-sm font-heading placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 focus:shadow-[0_0_20px_rgba(201,168,124,0.04)] transition-all"
                  />
                </div>
                <button className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-heading font-bold text-sm text-text-inverse overflow-hidden transition-all shrink-0">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 50%, #A8896A 100%)' }} />
                  <span className="relative z-10">订阅</span>
                  <ArrowRight size={14} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              <p className="mt-3 text-[11px] text-text-tertiary font-heading">
                不定期更新，不会轰炸你的邮箱。随时退订。
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-12 gap-8">
          {/* Brand */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4">
            <a href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                <Zap size={14} className="text-text-inverse" />
              </div>
              <span className="font-heading font-bold text-lg text-text-primary">
                Shizhe<span className="text-text-tertiary font-normal text-sm">.dev</span>
              </span>
            </a>
            <p className="text-sm text-text-tertiary leading-relaxed max-w-xs">
              全栈工程师，专注前端开发与 AI 应用探索。
              记录技术思考，分享项目经验。
            </p>

            <div className="mt-6 flex items-center gap-2">
              {socialIcons.map((s) => {
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
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group, gi) => (
            <div
              key={group.title}
              className={`col-span-6 md:col-span-2 ${gi === 0 ? "md:col-start-8 lg:col-start-8" : ""}`}
            >
              <h4 className="font-heading font-bold text-xs text-text-secondary tracking-wider uppercase mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-text-tertiary hover:text-accent transition-colors duration-300 font-heading"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-mono text-text-tertiary">
            © 2024–2026 Shizhe.dev · Built with Next.js & Tailwind CSS
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6B9B97] animate-pulse" />
            <span className="text-[10px] font-mono text-text-tertiary">
              Crafted with passion ♥
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
