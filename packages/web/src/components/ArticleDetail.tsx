"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Eye,
  Share2,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Check,
  MessageSquare,
  ThumbsUp,
  ArrowUpRight,
  Tag,
  Zap,
  List,
} from "lucide-react";
import MarkdownRenderer, { extractToc } from "./MarkdownRenderer";

/* ─── Mock article data ─── */
const articleData = {
  title: "深入理解 React Server Components 的实现原理",
  subtitle: "从序列化协议到流式渲染，全面剖析 RSC 架构设计",
  source: "React Blog",
  sourceUrl: "https://react.dev/blog",
  author: "Dan Abramov",
  date: "2026-03-15",
  readTime: "18 分钟",
  views: 12847,
  score: 96,
  tags: ["React", "前端", "架构", "Server Components"],
  coverGradient: "linear-gradient(135deg, rgba(107,155,151,0.08) 0%, rgba(201,168,124,0.06) 50%, rgba(176,122,91,0.04) 100%)",
};

const relatedArticles = [
  { title: "Next.js 16 新功能实战演示", source: "Vercel", score: 92, date: "03.13" },
  { title: "TypeScript 5.8 新特性：类型系统再进化", source: "TypeScript Blog", score: 91, date: "03.12" },
  { title: "Tailwind CSS v4 深度指南", source: "CSS Tricks", score: 90, date: "03.11" },
];

/* ─── Article body in standard Markdown ─── */
const articleMarkdown = `## 引言：为什么需要 Server Components

在现代 Web 开发中，我们面临着一个根本性的矛盾：用户期望即时的交互响应，而应用的复杂度却在不断攀升。传统的客户端渲染（CSR）方案虽然提供了出色的交互体验，但在首屏加载、SEO 友好性和大型应用的 bundle 体积等方面存在明显的瓶颈。

Server Side Rendering（SSR）部分解决了这些问题，但它引入了「注水」（hydration）的开销——服务端渲染的 HTML 到达浏览器后，还需要执行一遍完整的客户端代码来恢复交互能力。对于大型应用，这个过程可能耗时数秒。

React Server Components（RSC）提出了一种全新的思路：让组件在服务端执行，只将渲染结果（而非代码）发送到客户端。这种架构从根本上改变了我们构建 React 应用的方式。

## RSC 架构概览

RSC 的核心设计理念是将组件树分为两类：Server Components 和 Client Components。Server Components 在服务端执行，可以直接访问数据库、文件系统等服务端资源；Client Components 则在浏览器中执行，负责处理用户交互。

这种分离带来了几个关键优势：

**零客户端开销**：Server Components 的代码不会被打包到客户端 bundle 中，可以自由使用大型依赖库（如 SQL 查询器、Markdown 解析器）而不影响客户端性能。

**直接数据访问**：Server Components 可以直接调用数据库查询，无需通过 API 层。这不仅简化了架构，还消除了客户端-服务端之间的数据传输往返。

**自动代码分割**：Server Components 导入的 Client Components 会自动进行代码分割，开发者无需手动管理 dynamic imports。

\`\`\`tsx
// Server Component — 直接访问数据库
async function ArticleList() {
  const articles = await db.query(
    'SELECT * FROM articles ORDER BY score DESC LIMIT 10'
  );

  return (
    <div className="article-grid">
      {articles.map(article => (
        <ArticleCard key={article.id} data={article} />
      ))}
    </div>
  );
}

// Client Component — 处理用户交互
'use client';
function ArticleCard({ data }) {
  const [liked, setLiked] = useState(false);
  return (
    <div onClick={() => setLiked(!liked)}>
      <h3>{data.title}</h3>
      <LikeButton active={liked} />
    </div>
  );
}
\`\`\`

### 序列化协议设计

RSC 使用了一种专门设计的流式序列化协议，将服务端渲染结果以「RSC Payload」的形式传输到客户端。这个协议的设计需要同时满足：

1. **流式传输**：允许部分内容先到达客户端渲染，无需等待完整响应
2. **引用稳定性**：Client Components 通过模块引用（而非代码）在 payload 中表示
3. **悬念边界**：与 React Suspense 深度集成，支持渐进式加载

RSC Payload 本质上是一个行分隔的 JSON 流，每一行描述组件树中的一个「块」（chunk）。当服务端完成某个组件的渲染时，就会将对应的块推送给客户端，客户端实时拼接组件树。

这种设计的精妙之处在于：它允许服务端按照数据就绪的顺序推送内容，而非按照组件树的结构顺序。这意味着如果页面底部的数据先准备好，它可以先被渲染和推送。

### 流式渲染机制

流式渲染是 RSC 架构中最具技术挑战的部分。当用户请求一个页面时，服务端会：

**阶段一：启动渲染**
服务端开始遍历组件树，遇到异步操作（如数据库查询）时，不会阻塞，而是用 Suspense 边界标记该区域，继续渲染其他部分。

**阶段二：流式推送**
已完成渲染的部分以 RSC Payload 格式推送给客户端。客户端收到后立即开始构建可见的 UI。Suspense 边界处显示 fallback 内容。

**阶段三：渐进完成**
当异步操作完成时，服务端渲染对应的组件，将结果作为新的块推送。客户端收到后替换 fallback，触发过渡动画。

这个过程对用户来说是无缝的——页面从白屏到可见的时间被大幅缩短，而交互区域则随着 Client Components 的加载逐步激活。

\`\`\`tsx
// 流式渲染示例
import { Suspense } from 'react';

async function Page() {
  return (
    <Layout>
      {/* 立即渲染的静态内容 */}
      <Header />
      <HeroBanner />
      
      {/* 需要数据的区域 — 使用 Suspense 包裹 */}
      <Suspense fallback={<ArticlesSkeleton />}>
        <ArticleList />    {/* 异步获取文章列表 */}
      </Suspense>
      
      <Suspense fallback={<SidebarSkeleton />}>
        <RecommendPanel />  {/* 异步获取推荐内容 */}
      </Suspense>
      
      <Footer />
    </Layout>
  );
}
\`\`\`

## 客户端组件交互

Server Components 和 Client Components 之间的交互需要遵循明确的边界规则。理解这些规则是正确使用 RSC 的关键。

**核心规则：Server Components 可以导入 Client Components，但反过来不行。**

这个限制源于执行环境的差异：Server Components 在服务端运行，可以访问数据库、环境变量等敏感资源；而 Client Components 在浏览器中运行，可以使用 DOM API、事件处理等。两者的代码运行在完全不同的环境中。

数据只能以 props 的形式从 Server Component 流向 Client Component，且这些 props 必须是可序列化的——字符串、数字、布尔值、数组和简单对象。函数、类实例等不可序列化的值不能作为 props 传递。

这种约束实际上是一种优势：它强制开发者思考数据流的方向，避免了复杂的双向数据同步问题。

### 选择性注水策略

传统 SSR 的注水过程是全局性的——整个页面的所有组件都需要在客户端重新执行一遍。RSC 通过「选择性注水」（Selective Hydration）大幅优化了这个过程。

选择性注水的核心思想是：只有 Client Components 需要注水，Server Components 已经在服务端完成了渲染，客户端直接使用其输出的 HTML 即可。

在实际应用中，一个典型的页面可能有 80% 的内容是静态的（导航栏、文章内容、侧边栏等），只有 20% 需要交互（评论区、点赞按钮、搜索框等）。RSC 确保只有这 20% 需要下载和执行 JavaScript，将客户端 bundle 体积和注水时间缩减到原来的 1/5。

React 18 引入的优先级调度也在这里发挥作用：用户正在交互的区域会优先注水，而视口外的区域则延迟处理。

## 性能优化与基准测试

我们在一个中等规模的电商应用上进行了 RSC 迁移的性能对比测试。测试环境为模拟的 3G 网络条件，设备为中端 Android 手机。

基准测试结果对比（传统 SSR vs RSC）：

| 指标 | 传统 SSR | RSC | 提升 |
|------|---------|-----|------|
| FCP (First Contentful Paint) | 2.4s | 1.1s | 54% |
| LCP (Largest Contentful Paint) | 3.8s | 1.8s | 53% |
| TTI (Time to Interactive) | 5.2s | 2.3s | 56% |
| 客户端 JS 体积 | 487KB | 142KB | 71% |
| TTFB (Time to First Byte) | 320ms | 180ms | 44% |

最显著的改善在于客户端 JavaScript 体积的缩减——从 487KB 降至 142KB，减少了 71%。这意味着在弱网环境下，用户能更快地获得可交互的页面。

需要注意的是，RSC 并非银弹。对于以交互为主的应用（如在线编辑器、实时协作工具），RSC 的收益有限，因为大部分组件本身就需要在客户端执行。

## 生产实践建议

基于我们团队半年的 RSC 生产实践经验，总结以下关键建议：

**1. 从叶子节点开始迁移**
不要尝试一次性将整个应用改造为 RSC。从组件树的叶子节点开始，逐步向根节点推进。优先迁移数据密集型、交互少的组件。

**2. 合理划分 Server/Client 边界**
边界不宜太细（导致过多网络往返），也不宜太粗（失去 RSC 的优势）。以「页面区域」为单位划分通常是最佳实践。

**3. 善用 Suspense 管理加载状态**
为每个独立数据源设置单独的 Suspense 边界，避免一个慢查询阻塞整个页面的渲染。设计优雅的 skeleton 加载态也同样重要。

**4. 监控服务端渲染性能**
RSC 将部分计算从客户端转移到服务端，需要关注服务端的 CPU 和内存使用。考虑使用缓存策略（如 React \`cache()\` 函数）来优化重复的数据查询。

**5. 注意组合陷阱**
Server Component 接收 Client Component 作为 children 时，要确保 children 的 props 是可序列化的。常见错误是传递回调函数或 React elements 作为 props。

## 总结与展望

React Server Components 代表了前端架构的一次范式转移。它不仅是技术实现上的创新，更是对「什么代码应该在哪里执行」这个根本问题的重新思考。

RSC 的意义远不止于性能优化。它重新定义了前后端的边界，让全栈开发变得更加自然——开发者可以在同一个组件树中自由混合服务端逻辑和客户端交互，由框架自动处理两者之间的通信。

未来，我们可以期待更多围绕 RSC 的生态创新：更智能的编译器优化、更精细的缓存策略、以及与边缘计算的深度整合。RSC 或许不是 Web 开发的终极形态，但它无疑为整个行业指明了一个令人兴奋的方向。
`;

/* ─── Main component ─── */
export default function ArticleDetail() {
  const [activeSection, setActiveSection] = useState("");
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Auto-generate TOC from markdown headings
  const tocItems = useMemo(() => extractToc(articleMarkdown), []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Reading progress bar — multi-layer with shimmer ─── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
        {/* Base glow layer */}
        <motion.div
          className="absolute inset-0 blur-[4px] opacity-60"
          style={{
            scaleX,
            transformOrigin: "left",
            background: "linear-gradient(90deg, #6B9B97, #A8896A, #C9A87C, #DEC4A0, #6B9B97)",
          }}
        />
        {/* Main bar */}
        <motion.div
          className="absolute inset-0"
          style={{
            scaleX,
            transformOrigin: "left",
            background: "linear-gradient(90deg, #6B9B97 0%, #A8896A 30%, #C9A87C 60%, #DEC4A0 85%, #6B9B97 100%)",
          }}
        />
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 progress-shimmer"
          style={{
            scaleX,
            transformOrigin: "left",
          }}
        />
        {/* End dot glow */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full progress-dot-pulse"
          style={{
            left: scaleX.get() ? `calc(${scaleX.get() * 100}% - 4px)` : "0%",
            background: "radial-gradient(circle, #DEC4A0 0%, rgba(201,168,124,0.4) 60%, transparent 100%)",
            boxShadow: "0 0 8px rgba(201,168,124,0.6), 0 0 20px rgba(201,168,124,0.2)",
          }}
        />
      </div>

      {/* ─── Floating back nav ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between rounded-2xl border border-border bg-bg-primary/70 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <a href="/" className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-heading font-medium">返回</span>
          </a>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary font-heading">
            <a href="/" className="hover:text-accent transition-colors">首页</a>
            <ChevronRight size={12} />
            <span className="text-text-secondary">文章</span>
            <ChevronRight size={12} />
            <span className="text-accent/80 truncate max-w-[200px]">React Server Components</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 transition-all text-xs font-heading"
            >
              <List size={14} />
              目录
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 transition-all text-xs font-heading"
            >
              {copied ? <Check size={14} className="text-[#6B9B97]" /> : <Share2 size={14} />}
              {copied ? "已复制" : "分享"}
            </button>
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-heading ${
                bookmarked ? "text-accent bg-accent/10" : "text-text-secondary hover:text-accent hover:bg-accent/5"
              }`}
            >
              <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
              {bookmarked ? "已收藏" : "收藏"}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ─── Mobile TOC overlay ─── */}
      {tocOpen && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/50 lg:hidden" onClick={() => setTocOpen(false)} />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[56] w-80 bg-bg-primary border-l border-border p-6 pt-20 overflow-y-auto lg:hidden"
          >
            <h4 className="text-xs font-mono font-semibold text-accent tracking-widest uppercase mb-6">
              目录导航
            </h4>
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-heading transition-all ${
                    item.level === 2 ? "pl-6" : ""
                  } ${
                    activeSection === item.id
                      ? "text-accent bg-accent/8"
                      : "text-text-tertiary hover:text-text-secondary hover:bg-bg-surface"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </motion.div>
        </>
      )}

      {/* ─── Article header ─── */}
      <header className="relative pt-28 pb-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-[700px] h-[500px] bg-[radial-gradient(ellipse,rgba(201,168,124,0.04)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[radial-gradient(ellipse,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
          {/* Diagonal accent line */}
          <div className="absolute top-0 right-0 w-px h-[140%] origin-top-right -rotate-[20deg] translate-x-[-300px]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,168,124,0.06), transparent)' }} />
          {/* Cross diagonal line (teal) */}
          <div className="absolute top-0 left-[200px] w-px h-[120%] origin-top-left rotate-[15deg]" style={{ background: 'linear-gradient(to bottom, transparent, rgba(107,155,151,0.04), transparent)' }} />

        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {articleData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-surface border border-border text-xs font-heading text-text-secondary hover:border-accent/20 hover:text-accent transition-all cursor-pointer"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] text-text-primary leading-[1.15] tracking-tight">
                  {articleData.title}
                </h1>

                {/* Subtitle */}
                <p className="mt-4 text-lg text-text-secondary font-body leading-relaxed max-w-2xl">
                  {articleData.subtitle}
                </p>

                {/* Meta info */}
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  {/* Source badge */}
                  <a
                    href={articleData.sourceUrl}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-sm font-heading text-text-primary hover:border-accent/20 hover:text-accent transition-all group"
                  >
                    <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                      <Zap size={10} className="text-text-inverse" />
                    </div>
                    {articleData.source}
                    <ExternalLink size={11} className="text-text-tertiary group-hover:text-accent transition-colors" />
                  </a>

                  <div className="h-4 w-px bg-border" />

                  <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                    <Calendar size={12} />
                    {articleData.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                    <Clock size={12} />
                    {articleData.readTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                    <Eye size={12} />
                    {articleData.views.toLocaleString()} 阅读
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Score card — floating right */}
            <div className="col-span-12 lg:col-span-3 flex lg:items-end lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex flex-col items-center justify-center px-8 py-6 rounded-2xl border border-border-accent bg-bg-elevated/60 backdrop-blur-sm"
              >
                <div className="text-[10px] font-mono text-accent/60 tracking-[0.2em] uppercase mb-1">
                  AI Score
                </div>
                <div className="font-mono font-extrabold text-5xl leading-none text-accent">
                  {articleData.score}
                </div>
                <div className="mt-2 px-3 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider uppercase" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)', color: '#0A0E1A' }}>
                  卓越推荐
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative divider — multi-layer with geometric ornaments */}
          <div className="mt-12 relative flex items-center gap-0">
            {/* Left accent segment */}
            <div className="h-[2px] w-16 rounded-full" style={{ background: 'linear-gradient(to right, #6B9B97, rgba(107,155,151,0.3))' }} />
            {/* Diamond ornament */}
            <div className="relative mx-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rotate-45 bg-accent/30" />
              <div className="w-2 h-2 rotate-45 border border-accent/40 bg-accent/10" />
              <div className="w-1.5 h-1.5 rotate-45 bg-teal/30" />
            </div>
            {/* Main gradient line */}
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(201,168,124,0.15), rgba(107,155,151,0.08), transparent)' }} />
          </div>
        </div>
      </header>

      {/* ─── Article body + sidebar ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Main content — offset for asymmetry */}
          <article ref={articleRef} className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <MarkdownRenderer content={articleMarkdown} />
            </motion.div>

            {/* ─── Article footer actions ─── */}
            <div className="mt-16 pt-8 relative">
              {/* Decorative footer divider */}
              <div className="absolute top-0 left-0 right-0 flex items-center gap-0">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(107,155,151,0.15))' }} />
                <div className="mx-3 flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-teal/25" />
                  <div className="w-2 h-2 rotate-45 border border-accent/30 bg-accent/5" />
                  <div className="w-1 h-1 rounded-full bg-accent/25" />
                </div>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,124,0.15))' }} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-bg-elevated text-text-secondary text-sm font-heading hover:border-accent/20 hover:text-accent transition-all">
                  <ThumbsUp size={14} />
                  有用 · 128
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-bg-elevated text-text-secondary text-sm font-heading hover:border-accent/20 hover:text-accent transition-all">
                  <MessageSquare size={14} />
                  讨论 · 23
                </button>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-bg-elevated text-text-secondary text-sm font-heading hover:border-accent/20 hover:text-accent transition-all"
                >
                  <Share2 size={14} />
                  {copied ? "已复制链接" : "分享"}
                </button>
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-heading transition-all ${
                    bookmarked
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-bg-elevated text-text-secondary hover:border-accent/20 hover:text-accent"
                  }`}
                >
                  <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
                  {bookmarked ? "已收藏" : "收藏"}
                </button>
              </div>

              {/* Original link */}
              <a
                href={articleData.sourceUrl}
                className="mt-6 group inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border-accent bg-bg-elevated/60 text-sm font-heading hover:bg-accent/5 transition-all"
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                  <ExternalLink size={14} className="text-text-inverse" />
                </div>
                <div>
                  <div className="text-text-primary font-semibold">阅读原文</div>
                  <div className="text-xs text-text-tertiary">{articleData.sourceUrl}</div>
                </div>
                <ArrowUpRight size={14} className="text-text-tertiary group-hover:text-accent ml-auto transition-colors" />
              </a>
            </div>
          </article>

          {/* ─── Sidebar ─── */}
          <aside className="hidden lg:block col-span-4">
            <div className="sticky top-24 space-y-8">
              {/* TOC */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <List size={14} className="text-accent" />
                  <h4 className="text-xs font-mono font-semibold text-accent tracking-widest uppercase">
                    目录
                  </h4>
                </div>
                <nav className="space-y-0.5">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-heading transition-all duration-200 ${
                        item.level === 2 ? "pl-6" : ""
                      } ${
                        activeSection === item.id
                          ? "text-accent bg-accent/8 font-medium"
                          : "text-text-tertiary hover:text-text-secondary hover:bg-bg-surface/50"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </motion.div>

              {/* Related articles */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-5"
              >
                <h4 className="text-xs font-mono font-semibold text-text-secondary tracking-widest uppercase mb-4">
                  相关推荐
                </h4>
                <div className="space-y-3">
                  {relatedArticles.map((article, i) => (
                    <a
                      key={i}
                      href="#"
                      className="group block px-3 py-3 -mx-1 rounded-xl hover:bg-bg-surface/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center font-mono font-bold text-xs text-text-secondary">
                          {article.score}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-sm font-heading font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </h5>
                          <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-text-tertiary">
                            <span>{article.source}</span>
                            <span>·</span>
                            <span>{article.date}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Author card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm" style={{ background: 'linear-gradient(135deg, rgba(107,155,151,0.15), rgba(201,168,124,0.1))' }}>
                    <span className="text-[#6B9B97]">DA</span>
                  </div>
                  <div>
                    <div className="text-sm font-heading font-semibold text-text-primary">{articleData.author}</div>
                    <div className="text-xs text-text-tertiary">{articleData.source}</div>
                  </div>
                </div>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  React 核心团队成员，React Server Components 架构设计者。
                </p>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
