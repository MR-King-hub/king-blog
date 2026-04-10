"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  ArrowUpRight,
  Tag,
  Search,
} from "lucide-react";

interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
}

const allTags = ["全部", "React", "AI", "前端", "Node.js", "TypeScript", "架构", "工具"];

const blogPosts: BlogPost[] = [
  {
    slug: "react-server-components",
    title: "深入理解 React Server Components 的实现原理",
    summary: "深入剖析 RSC 底层实现机制，包括序列化协议、流式渲染以及与客户端组件的交互方式，附完整代码示例。",
    date: "2026-03-15",
    readTime: "18 分钟",
    tags: ["React", "前端", "架构"],
    featured: true,
  },
  {
    slug: "ai-coding-tools-comparison",
    title: "2026 年 AI 编程工具全面对比：Copilot vs Cursor vs CodeBuddy",
    summary: "详细对比了当前主流 AI 编程工具的功能、性能和适用场景，数据驱动的深度评测。",
    date: "2026-03-14",
    readTime: "15 分钟",
    tags: ["AI", "工具"],
  },
  {
    slug: "nodejs-microservices",
    title: "构建高性能 Node.js 微服务架构实践",
    summary: "从服务拆分、通信机制、数据一致性等角度，系统性地介绍 Node.js 微服务的生产实践。",
    date: "2026-03-13",
    readTime: "22 分钟",
    tags: ["Node.js", "架构"],
  },
  {
    slug: "typescript-5-8-features",
    title: "TypeScript 5.8 新特性：类型系统再进化",
    summary: "改进的类型推断、新的装饰器语法和性能优化，一次全面解析。",
    date: "2026-03-12",
    readTime: "12 分钟",
    tags: ["TypeScript", "前端"],
  },
  {
    slug: "tailwind-v4-guide",
    title: "Tailwind CSS v4 深度指南",
    summary: "全面解读 Tailwind v4 核心变更，包括新的配置方式、主题系统和性能提升。",
    date: "2026-03-11",
    readTime: "14 分钟",
    tags: ["前端", "工具"],
  },
  {
    slug: "ai-agent-future",
    title: "AI Agent 的现状与未来：从 LLM 到自主智能体",
    summary: "分析当前 AI Agent 技术的局限性和未来发展方向，探讨自主智能体的可能性。",
    date: "2026-03-10",
    readTime: "20 分钟",
    tags: ["AI", "架构"],
  },
];

export default function BlogList() {
  const [activeTag, setActiveTag] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchTag = activeTag === "全部" || post.tags.includes(activeTag);
    const matchSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTag && matchSearch;
  });

  const featuredPost = filteredPosts.find((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  return (
    <section className="relative pt-28 pb-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(201,168,124,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(107,155,151,0.02)_0%,transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-tight">
            技术
            <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>博客</span>
          </h1>
          <p className="mt-4 text-text-secondary text-base sm:text-lg max-w-xl">
            记录技术思考与实践，探索前端、AI 和全栈开发的边界。
          </p>
        </motion.div>

        {/* Filters row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10"
        >
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-heading font-medium transition-all duration-300 ${
                  activeTag === tag
                    ? "text-accent bg-accent/10 border border-accent/20"
                    : "text-text-tertiary hover:text-text-secondary bg-bg-elevated/60 border border-border hover:border-border-hover"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-bg-elevated/60 hover:border-border-hover transition-all sm:ml-auto w-full sm:w-auto">
            <Search size={14} className="text-text-tertiary shrink-0" />
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none w-full sm:w-40 font-heading"
            />
          </div>
        </motion.div>

        {/* Posts */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTag + searchQuery}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            {/* Featured post */}
            {featuredPost && (
              <a href={`/article/${featuredPost.slug}`} className="block mb-6">
                <div className="card-hover group relative grid grid-cols-12 gap-0 rounded-3xl border border-border-accent bg-bg-elevated/40 backdrop-blur-sm overflow-hidden">
                  <div className="col-span-12 sm:col-span-3 lg:col-span-2 flex items-center justify-center p-8 border-b sm:border-b-0 sm:border-r border-border" style={{ background: 'linear-gradient(to bottom right, rgba(201,168,124,0.04), transparent)' }}>
                    <div className="text-center">
                      <div className="text-[10px] font-mono text-accent/60 tracking-[0.2em] uppercase mb-1">
                        Featured
                      </div>
                      <div className="font-mono font-extrabold text-3xl lg:text-4xl text-accent leading-none">
                        ★
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-9 lg:col-span-10 p-6 lg:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-mono font-bold tracking-wider uppercase">
                        精选
                      </span>
                      {featuredPost.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-bg-surface text-text-tertiary text-xs font-heading"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-heading font-bold text-xl lg:text-2xl text-text-primary group-hover:text-accent transition-colors duration-300 mb-3">
                      {featuredPost.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
                      {featuredPost.summary}
                    </p>
                    <div className="mt-5 flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                        <Calendar size={11} />
                        {featuredPost.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                        <Clock size={11} />
                        {featuredPost.readTime}
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

            {/* Regular posts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
              {regularPosts.map((post, i) => {
                const spanClass =
                  i % 3 === 0 ? "lg:col-span-7" : i % 3 === 1 ? "lg:col-span-5" : "lg:col-span-6";

                return (
                  <motion.a
                    key={post.slug}
                    href={`/article/${post.slug}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className={`${spanClass} card-hover group relative rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-6 block`}
                  >
                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-heading bg-bg-surface text-text-tertiary"
                        >
                          <Tag size={8} />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-bold text-base text-text-primary line-clamp-2 group-hover:text-accent transition-colors duration-300 mb-2">
                      {post.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed mb-4">
                      {post.summary}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-[10px] font-mono text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {post.readTime}
                      </span>
                      <div className="flex-1" />
                      <ArrowUpRight size={12} className="text-text-tertiary/50 group-hover:text-accent transition-colors" />
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-text-tertiary font-heading text-sm">暂无匹配的文章</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
