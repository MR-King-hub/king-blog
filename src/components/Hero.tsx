"use client";

import { motion } from "motion/react";
import { Rss, Brain, UserCheck, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Rss,
    title: "聚合收集",
    desc: "500+ 全球优质源，每日自动抓取最新技术内容",
    gradient: "linear-gradient(to right, #6B9B97, #567D7A)",
    border: "border-[#6B9B97]/15",
    iconBg: "bg-[#6B9B97]/8",
    iconColor: "text-[#6B9B97]",
  },
  {
    num: "02",
    icon: Brain,
    title: "AI 智能分析",
    desc: "大语言模型评分、摘要生成、智能分类，噪音自动过滤",
    gradient: "linear-gradient(to right, #C9A87C, #A8896A)",
    border: "border-[#C9A87C]/15",
    iconBg: "bg-[#C9A87C]/8",
    iconColor: "text-[#C9A87C]",
  },
  {
    num: "03",
    icon: UserCheck,
    title: "专家精选",
    desc: "资深工程师人工把关，确保每篇推荐都值得你的时间",
    gradient: "linear-gradient(to right, #B07A5B, #8F6248)",
    border: "border-[#B07A5B]/15",
    iconBg: "bg-[#B07A5B]/8",
    iconColor: "text-[#B07A5B]",
  },
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
        {/* Diagonal accent line */}
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-200px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,124,0.07), transparent)' }} />
        <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[25deg] translate-x-[-260px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(107,155,151,0.05), transparent)' }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Asymmetric hero layout: 12-col grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column: 7 cols, offset from start */}
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
                AI 驱动 · 专家把关
              </span>
            </motion.div>

            {/* Main heading — dramatic typography */}
            <h1 className="font-heading font-extrabold leading-[0.95] tracking-tight">
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-text-primary">
                遇见更好的
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-2">
                <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>技术阅读</span>
              </span>
            </h1>

            {/* Sub text — offset to the right for asymmetry */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 ml-1 max-w-lg text-text-secondary text-base sm:text-lg leading-relaxed font-body"
            >
              从 <span className="text-text-primary font-semibold">500+</span>{" "}
              全球顶级技术源中，通过 AI 智能筛选和专家把关，
              为你精选最值得阅读的内容。
            </motion.p>

            {/* CTA — staggered buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <a
                href="#weekly"
                className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-heading font-bold text-sm text-text-inverse overflow-hidden transition-all"
              >
                <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }} />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 50%, #A8896A 100%)' }} />
                <span className="relative z-10">浏览本周精选</span>
                <ArrowRight
                  size={16}
                  className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <a
                href="#scoring"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-heading font-semibold text-sm text-text-secondary border border-border hover:border-border-hover hover:text-text-primary transition-all duration-300"
              >
                了解评分机制
              </a>
            </motion.div>
          </motion.div>

          {/* Right column: decorative stats panel — offset higher */}
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
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-mono font-semibold text-accent tracking-widest uppercase">
                  实时数据
                </span>
              </div>

              {[
                { label: "优质内容源", value: "500+", color: "text-[#6B9B97]" },
                { label: "AI 已分析", value: "12,847", color: "text-accent" },
                { label: "精选内容", value: "3,214", color: "text-[#B07A5B]" },
                { label: "本周新增", value: "127", color: "text-accent-bright" },
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
                  <span className={`font-mono font-bold text-lg ${stat.color}`}>
                    {stat.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Steps — staggered offset cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const offsets = ["md:translate-y-0", "md:-translate-y-6", "md:translate-y-3"];
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8 + i * 0.15,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`${offsets[i]} card-hover relative rounded-2xl border ${step.border} bg-bg-elevated/60 backdrop-blur-sm p-7 overflow-hidden group`}
              >
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: step.gradient }} />

                <div className="flex items-start justify-between mb-5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${step.iconBg}`}>
                    <Icon size={20} className={step.iconColor} />
                  </div>
                  <span className="font-mono text-3xl font-extrabold text-text-tertiary/30 group-hover:text-text-tertiary/50 transition-colors">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
