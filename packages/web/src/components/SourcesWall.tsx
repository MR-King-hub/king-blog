"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Globe, Rss, Brain, Award, Zap } from "lucide-react";

const sources = [
  { name: "OpenAI", tier: 1 },
  { name: "Google DeepMind", tier: 1 },
  { name: "Anthropic", tier: 1 },
  { name: "DeepSeek", tier: 1 },
  { name: "阿里技术", tier: 2 },
  { name: "腾讯云开发者", tier: 2 },
  { name: "Dify", tier: 2 },
  { name: "Cloudflare", tier: 2 },
  { name: "Vercel", tier: 2 },
  { name: "Hacker News", tier: 2 },
  { name: "React Blog", tier: 3 },
  { name: "CSS Tricks", tier: 3 },
  { name: "InfoQ", tier: 3 },
  { name: "@sama", tier: 3 },
  { name: "@karpathy", tier: 3 },
  { name: "Fireship", tier: 3 },
];

const stats = [
  { icon: Rss, value: "500+", label: "优质内容源", color: "#6B9B97" },
  { icon: Brain, value: "12K+", label: "AI 分析内容", color: "#C9A87C" },
  { icon: Award, value: "3.2K", label: "精选推荐", color: "#B07A5B" },
  { icon: Zap, value: "24/7", label: "实时更新", color: "#9B7E9B" },
];

export default function SourcesWall() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Top line accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(107,155,151,0.15), transparent)' }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-12"
        >
          <Globe size={16} className="text-[#6B9B97]" />
          <span className="text-xs font-mono font-semibold text-[#6B9B97] tracking-widest uppercase">
            Content Sources
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(107,155,151,0.15), transparent)' }} />
        </motion.div>

        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Title + stats */}
          <div className="col-span-12 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-primary leading-tight">
                全球 <span className="text-[#6B9B97]">500+</span>
                <br />
                优质内容源
              </h2>
              <p className="mt-4 text-text-secondary text-base leading-relaxed max-w-sm">
                精选全球顶级技术社区、开发博客和行业领导者的优质内容，持续追踪前沿动态。
              </p>
            </motion.div>

            {/* Stats grid */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="card-hover rounded-2xl border border-border bg-bg-elevated/40 p-5 backdrop-blur-sm"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg mb-3"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <Icon size={16} style={{ color: stat.color }} />
                    </div>
                    <div
                      className="font-mono font-extrabold text-2xl leading-none"
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs text-text-tertiary font-heading">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Source tags — scattered, organic layout */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="col-span-12 lg:col-span-6 lg:col-start-7 flex flex-col justify-center"
          >
            <div className="relative rounded-3xl border border-border bg-bg-elevated/30 p-8 lg:p-10 backdrop-blur-sm overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(107,155,151,0.04)_0%,transparent_70%)]" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(circle,rgba(201,168,124,0.03)_0%,transparent_70%)]" />

              <div className="flex flex-wrap gap-2.5 relative z-10">
                {sources.map((source, i) => {
                  const tierStyles = {
                    1: "bg-accent/8 text-accent border-accent/15 text-sm font-bold",
                    2: "bg-[#6B9B97]/6 text-[#6B9B97] border-[#6B9B97]/12 text-sm",
                    3: "bg-bg-surface text-text-secondary border-border text-xs",
                  };
                  const style = tierStyles[source.tier as keyof typeof tierStyles];

                  return (
                    <motion.span
                      key={source.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      whileHover={{ scale: 1.08, y: -2 }}
                      className={`inline-flex items-center px-3.5 py-1.5 rounded-xl border font-heading cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,168,124,0.06)] ${style}`}
                    >
                      {source.name}
                    </motion.span>
                  );
                })}

                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-border-hover text-text-tertiary text-xs font-heading hover:text-accent hover:border-accent/30 transition-all"
                >
                  +484 更多
                  <ArrowUpRight size={11} />
                </motion.a>
              </div>
            </div>

            {/* View all */}
            <div className="mt-6 flex justify-end">
              <a
                href="#"
                className="group inline-flex items-center gap-2 text-sm text-text-tertiary font-heading font-semibold hover:text-accent transition-colors"
              >
                查看全部订阅源
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
