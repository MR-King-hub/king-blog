"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Headphones,
  Video,
  MessageCircle,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

type Category = "articles" | "podcasts" | "videos" | "tweets";

interface ContentItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  score: number;
  category: Category;
  date: string;
  tags: string[];
  featured?: boolean;
}

const categories: { key: Category; label: string; icon: typeof FileText }[] = [
  { key: "articles", label: "文章", icon: FileText },
  { key: "podcasts", label: "播客", icon: Headphones },
  { key: "videos", label: "视频", icon: Video },
  { key: "tweets", label: "推文", icon: MessageCircle },
];

const mockData: ContentItem[] = [
  {
    id: 1,
    title: "深入理解 React Server Components 的实现原理",
    summary: "深入剖析 RSC 底层实现机制，包括序列化协议、流式渲染以及与客户端组件的交互方式，附完整代码示例。",
    source: "React Blog",
    score: 96,
    category: "articles",
    date: "03.15",
    tags: ["React", "前端"],
    featured: true,
  },
  {
    id: 2,
    title: "2026年 AI 编程工具全面对比：Copilot vs Cursor vs CodeBuddy",
    summary: "详细对比了当前主流 AI 编程工具的功能、性能和适用场景，数据驱动的深度评测。",
    source: "InfoQ",
    score: 94,
    category: "articles",
    date: "03.14",
    tags: ["AI", "工具"],
  },
  {
    id: 3,
    title: "构建高性能 Node.js 微服务架构实践",
    summary: "从服务拆分、通信机制、数据一致性等角度，系统性地介绍 Node.js 微服务的生产实践。",
    source: "Tw93 Blog",
    score: 93,
    category: "articles",
    date: "03.13",
    tags: ["Node.js", "架构"],
  },
  {
    id: 4,
    title: "TypeScript 5.8 新特性：类型系统再进化",
    summary: "改进的类型推断、新的装饰器语法和性能优化，一次全面解析。",
    source: "TypeScript Blog",
    score: 91,
    category: "articles",
    date: "03.12",
    tags: ["TypeScript"],
  },
  {
    id: 5,
    title: "Tailwind CSS v4 深度指南",
    summary: "全面解读 Tailwind v4 核心变更，包括新的配置方式、主题系统和性能提升。",
    source: "CSS Tricks",
    score: 90,
    category: "articles",
    date: "03.11",
    tags: ["CSS"],
  },
  {
    id: 6,
    title: "与 OpenAI CTO 聊聊 AGI 的未来方向",
    summary: "深度访谈 OpenAI CTO，讨论 AGI 研发进展、安全性挑战以及对未来社会的影响。",
    source: "Lex Fridman",
    score: 95,
    category: "podcasts",
    date: "03.14",
    tags: ["AI", "访谈"],
    featured: true,
  },
  {
    id: 7,
    title: "全栈开发者的一天：效率工具与工作流",
    summary: "资深全栈开发者分享日常开发流程、效率工具和时间管理方法论。",
    source: "Tech Pod",
    score: 88,
    category: "podcasts",
    date: "03.12",
    tags: ["效率"],
  },
  {
    id: 8,
    title: "10 分钟搞懂 Rust 所有权系统",
    summary: "用简洁生动的动画和实例，帮助初学者快速理解 Rust 最核心的所有权概念。",
    source: "Fireship",
    score: 94,
    category: "videos",
    date: "03.15",
    tags: ["Rust", "教程"],
    featured: true,
  },
  {
    id: 9,
    title: "Next.js 16 新功能实战演示",
    summary: "通过实际项目演示 Next.js 16 核心新功能，含改进的缓存策略和新的路由模式。",
    source: "Vercel",
    score: 92,
    category: "videos",
    date: "03.13",
    tags: ["Next.js"],
  },
  {
    id: 10,
    title: "Andrej Karpathy: 我对 AI Agent 的看法",
    summary: "深入分析当前 AI Agent 技术的局限性和未来发展方向，引发社区热烈讨论。",
    source: "@karpathy",
    score: 96,
    category: "tweets",
    date: "03.15",
    tags: ["AI", "Agent"],
    featured: true,
  },
  {
    id: 11,
    title: "Sam Altman 宣布 GPT-5 发布计划",
    summary: "OpenAI CEO 透露 GPT-5 时间表及关键改进方向，业界反响强烈。",
    source: "@sama",
    score: 93,
    category: "tweets",
    date: "03.14",
    tags: ["OpenAI"],
  },
];

function ScoreDisplay({ score, featured }: { score: number; featured?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl ${
      featured
        ? "bg-gradient-to-br from-[#C9A87C]/12 to-[#B07A5B]/8 border border-[#C9A87C]/20"
        : score >= 95
          ? "bg-[#6B9B97]/8 border border-[#6B9B97]/15"
          : "bg-bg-surface border border-border"
    }`}>
      <span className={`font-mono font-extrabold text-xl leading-none ${
        featured ? "text-accent" : score >= 95 ? "text-[#6B9B97]" : "text-text-primary"
      }`}>
        {score}
      </span>
      <span className="text-[8px] font-mono text-text-tertiary mt-0.5 uppercase tracking-wider">
        score
      </span>
    </div>
  );
}

export default function WeeklyPicks() {
  const [activeCategory, setActiveCategory] = useState<Category>("articles");
  const filteredItems = mockData.filter((item) => item.category === activeCategory);
  const featuredItem = filteredItems.find((item) => item.featured);
  const restItems = filteredItems.filter((item) => !item.featured);

  return (
    <section id="weekly" className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,124,0.15), transparent)' }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — left aligned for asymmetry */}
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="col-span-12 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={16} className="text-accent" />
                <span className="text-xs font-mono font-semibold text-accent tracking-widest uppercase">
                  Weekly Picks
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(201,168,124,0.15), transparent)' }} />
              </div>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary leading-tight">
                本周编辑精选
              </h2>
              <p className="mt-3 text-text-secondary text-base max-w-md">
                AI + 人工双重把关，只推荐最值得你花时间的内容
              </p>
            </motion.div>
          </div>

          {/* Category tabs — aligned right */}
          <div className="col-span-12 lg:col-span-5 flex items-end lg:justify-end">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-bg-elevated/60 border border-border backdrop-blur-sm">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all duration-300 ${
                      isActive ? "text-text-inverse" : "text-text-tertiary hover:text-text-primary"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="weekly-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon size={14} />
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content — featured + grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            {/* Featured card — full width, asymmetric */}
            {featuredItem && (
              <a href="/article/react-server-components" className="block mb-6">
                <div className="card-hover group relative grid grid-cols-12 gap-0 rounded-3xl border border-border-accent bg-bg-elevated/40 backdrop-blur-sm overflow-hidden">
                  {/* Score — large decorative */}
                  <div className="col-span-12 sm:col-span-3 lg:col-span-2 flex items-center justify-center p-8 border-b sm:border-b-0 sm:border-r border-border" style={{ background: 'linear-gradient(to bottom right, rgba(201,168,124,0.04), transparent)' }}>
                    <div className="text-center">
                      <div className="font-mono font-extrabold text-5xl lg:text-6xl text-accent leading-none">
                        {featuredItem.score}
                      </div>
                      <div className="mt-1 text-[10px] font-mono text-accent/60 tracking-[0.2em] uppercase">
                        AI Score
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="col-span-12 sm:col-span-9 lg:col-span-10 p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-mono font-bold tracking-wider uppercase">
                        精选
                      </span>
                      {featuredItem.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-bg-surface text-text-tertiary text-xs font-heading"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-heading font-bold text-xl lg:text-2xl text-text-primary group-hover:text-accent transition-colors duration-300 mb-3">
                      {featuredItem.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
                      {featuredItem.summary}
                    </p>
                    <div className="mt-5 flex items-center gap-4">
                      <span className="text-xs font-mono text-text-tertiary">
                        {featuredItem.source}
                      </span>
                      <span className="text-xs text-text-tertiary">·</span>
                      <span className="text-xs font-mono text-text-tertiary">
                        {featuredItem.date}
                      </span>
                      <div className="flex-1" />
                      <span className="flex items-center gap-1 text-xs text-accent font-heading font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        阅读全文 <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* Regular cards — asymmetric grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
              {restItems.map((item, i) => {
                // Alternate between wider and narrower cards for visual rhythm
                const spanClass =
                  i % 3 === 0
                    ? "lg:col-span-7"
                    : i % 3 === 1
                      ? "lg:col-span-5"
                      : "lg:col-span-6";

                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className={`${spanClass} card-hover group relative flex gap-4 rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-5 cursor-pointer`}
                  >
                    {/* Score */}
                    <ScoreDisplay score={item.score} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px] font-heading bg-bg-surface text-text-tertiary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-heading font-bold text-sm text-text-primary line-clamp-2 group-hover:text-accent transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-text-tertiary line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-[10px] font-mono text-text-tertiary">
                          {item.source}
                        </span>
                        <ExternalLink size={10} className="text-text-tertiary/50 group-hover:text-accent/60 transition-colors" />
                        <div className="flex-1" />
                        <span className="text-[10px] font-mono text-text-tertiary">
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* More link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <a
            href="#"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-border text-text-secondary font-heading font-semibold text-sm hover:border-accent/30 hover:text-accent transition-all duration-300"
          >
            查看全部{categories.find((c) => c.key === activeCategory)?.label}
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
