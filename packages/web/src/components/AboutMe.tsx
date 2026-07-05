"use client";

import { motion } from "motion/react";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Code2,
  Heart,
  ArrowUpRight,
} from "lucide-react";
import type { SiteProfile } from "@blog/shared";
import { SOCIAL_ICON_MAP } from "@/lib/profile-icons";

interface AboutMeProps {
  profile: SiteProfile;
}

export default function AboutMe({ profile }: AboutMeProps) {
  const {
    bioParagraphs,
    timeline,
    skillCategories,
    interests,
    socialLinks,
    location,
    role,
    experienceLabel,
  } = profile;

  return (
    <section className="relative pt-28 pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(201,168,124,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-[20%] right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-300px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,124,0.06), transparent)' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            {bioParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`text-text-secondary text-base ${index === 0 ? "sm:text-lg" : ""} leading-relaxed max-w-2xl ${index < bioParagraphs.length - 1 ? "mb-6" : ""}`}
              >
                {paragraph}
              </p>
            ))}

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-text-tertiary font-heading">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-accent/60" />
                {location}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-[#6B9B97]/60" />
                {role}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Code2 size={14} className="text-[#B07A5B]/60" />
                {experienceLabel}
              </span>
            </div>
          </motion.div>

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
                const Icon = SOCIAL_ICON_MAP[link.icon];
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
                key={`${item.year}-${item.role}`}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card-hover group relative grid grid-cols-12 gap-4 rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-6 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: `linear-gradient(to bottom, ${item.color}, ${item.color}33)` }} />
                <div className="col-span-12 sm:col-span-3 flex items-start">
                  <span className="font-mono font-bold text-sm" style={{ color: item.color }}>
                    {item.year}
                  </span>
                </div>
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
