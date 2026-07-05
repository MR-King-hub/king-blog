"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Briefcase,
} from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";
import Link from "next/link";
import type { SiteProfile } from "@relayagent/shared";
import { BENTO_ICON_MAP, SOCIAL_ICON_MAP } from "@/lib/profile-icons";

interface HeroProps {
  profile: SiteProfile;
}

export default function Hero({ profile }: HeroProps) {
  const hydrated = useHydrated();
  const {
    name,
    tagline,
    headline,
    heroSubtitle,
    location,
    role,
    socialLinks,
    heroBento,
  } = profile;

  const heroSocialLinks = socialLinks.filter((link) =>
    ["github", "twitter", "mail"].includes(link.icon),
  );

  return (
    <section className="relative min-h-screen overflow-hidden pt-28 pb-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,168,124,0.04)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
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
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-200px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,124,0.07), transparent)' }} />
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-260px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(107,155,151,0.05), transparent)' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          <motion.div
            initial={hydrated ? { opacity: 0, x: -40, skewX: 2 } : false}
            animate={{ opacity: 1, x: 0, skewX: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-7 lg:col-start-1 pt-8 lg:pt-16"
          >
            <motion.div
              initial={hydrated ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/8 border border-accent/15 mb-8"
            >
              <Sparkles size={13} className="text-accent" />
              <span className="text-xs font-heading font-semibold text-accent tracking-wide uppercase">
                {tagline}
              </span>
            </motion.div>

            <h1 className="font-heading font-extrabold leading-[0.95] tracking-tight">
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-text-primary">
                {headline}
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-2">
                <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{name}</span>
              </span>
            </h1>

            <motion.p
              initial={hydrated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 ml-1 max-w-lg text-text-secondary text-base sm:text-lg leading-relaxed font-body"
            >
              {heroSubtitle}
            </motion.p>

            <motion.div
              initial={hydrated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-tertiary font-heading"
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-accent/60" />
                {location}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} className="text-teal/60" />
                {role}
              </span>
            </motion.div>

            <motion.div
              initial={hydrated ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
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
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-heading font-semibold text-sm text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all duration-300"
              >
                查看项目
              </Link>
            </motion.div>

            <motion.div
              initial={hydrated ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-8 flex items-center gap-2"
            >
              {heroSocialLinks.map((link) => {
                const Icon = SOCIAL_ICON_MAP[link.icon];
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-tertiary hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                    title={link.label}
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div
            initial={hydrated ? { opacity: 0, x: 40, y: 20 } : false}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-4 lg:col-start-9 flex items-start lg:pt-8"
          >
            <div className="w-full rounded-3xl border border-border bg-bg-elevated/50 backdrop-blur-sm p-6 space-y-4 relative overflow-hidden">
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
                  initial={hydrated ? { opacity: 0, x: 20 } : false}
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

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5">
          {heroBento.map((item, i) => {
            const Icon = BENTO_ICON_MAP[item.icon];
            return (
              <motion.div
                key={item.id}
                initial={hydrated ? { opacity: 0, y: 40 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8 + i * 0.12,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={item.span || ""}
              >
                <Link
                  href={item.href}
                  className="card-hover group relative rounded-2xl border border-border bg-bg-elevated/60 backdrop-blur-sm p-7 overflow-hidden block"
                >
                  <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: item.gradient }} />
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
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
