"use client";

import { motion } from "motion/react";
import { Sparkles, BookOpen, Lightbulb, Eye, Target, ChevronRight } from "lucide-react";

const criteria = [
  {
    icon: BookOpen,
    label: "内容质量",
    weight: 40,
    desc: "深度、准确性与原创性",
    color: "#6B9B97",
  },
  {
    icon: Lightbulb,
    label: "信息价值",
    weight: 30,
    desc: "实用性与前沿洞察",
    color: "#C9A87C",
  },
  {
    icon: Eye,
    label: "可读性",
    weight: 20,
    desc: "结构清晰与表达流畅",
    color: "#B07A5B",
  },
  {
    icon: Target,
    label: "实践指导",
    weight: 10,
    desc: "可直接落地的操作建议",
    color: "#9B7E9B",
  },
];

export default function ScoreMethod() {
  return (
    <section id="scoring" className="relative py-24 overflow-hidden">
      {/* Diagonal background stripe */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[10%] left-[-5%] w-[110%] h-[80%] bg-bg-secondary/50 -rotate-[2deg] border-y border-border" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-12"
        >
          <Sparkles size={16} className="text-accent" />
          <span className="text-xs font-mono font-semibold text-accent tracking-widest uppercase">
            Scoring System
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(201,168,124,0.15), transparent)' }} />
        </motion.div>

        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Big text + score demo */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="col-span-12 lg:col-span-5"
          >
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary leading-tight">
              AI 智能
              <br />
              <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>评分方法</span>
            </h2>
            <p className="mt-5 text-text-secondary text-base leading-relaxed max-w-md">
              使用 Gemini 大语言模型对每篇内容进行多维度评分，满分 100 分，
              结合人工审核机制，<span className="text-text-primary font-semibold">评分 ≥ 90</span> 方可入选精选。
            </p>

            {/* Score demo card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 rounded-2xl border border-border bg-bg-elevated/50 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-text-tertiary tracking-wider uppercase">
                  评分等级
                </span>
                <span className="text-[10px] font-mono text-accent">LIVE</span>
              </div>

              {[
                { range: "95–100", label: "卓越推荐", color: "#C9A87C", width: "15%" },
                { range: "90–94", label: "精选推荐", color: "#6B9B97", width: "25%" },
                { range: "80–89", label: "优质内容", color: "#5A7CA0", width: "35%" },
                { range: "< 80", label: "未入选", color: "#374151", width: "25%" },
              ].map((tier, i) => (
                <div key={tier.range} className="flex items-center gap-3 py-2.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="font-mono text-xs text-text-primary w-16">{tier.range}</span>
                  <span className="text-xs text-text-tertiary flex-1">{tier.label}</span>
                  <div className="w-24 h-1.5 rounded-full bg-bg-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: tier.width }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Criteria cards — staggered vertically */}
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 space-y-4">
            {criteria.map((c, i) => {
              const Icon = c.icon;
              const offsets = ["lg:translate-x-0", "lg:translate-x-8", "lg:translate-x-4", "lg:translate-x-12"];
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className={`${offsets[i]} card-hover group flex items-center gap-5 p-5 rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm`}
                >
                  {/* Icon */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${c.color}15` }}
                  >
                    <Icon size={20} style={{ color: c.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-text-primary">
                        {c.label}
                      </span>
                      <span
                        className="font-mono font-extrabold text-lg"
                        style={{ color: c.color }}
                      >
                        {c.weight}%
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mb-2.5">{c.desc}</p>
                    <div className="h-1 w-full rounded-full bg-bg-surface overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.weight}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    className="text-text-tertiary/30 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
