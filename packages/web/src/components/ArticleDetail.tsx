"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  ChevronRight,
  Check,
  MessageSquare,
  ThumbsUp,
  ArrowUpRight,
  Tag,
  Zap,
  List,
  Loader2,
  PenLine,
} from "lucide-react";
import MarkdownRenderer, { extractToc } from "./MarkdownRenderer";
import { articleApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Article } from "@blog/shared";

/* ─── Estimate read time ─── */
function estimateReadTime(text: string): string {
  const chars = text.replace(/\s+/g, "").length;
  const minutes = Math.max(1, Math.ceil(chars / 500));
  return `${minutes} 分钟`;
}

/* ─── Props ─── */
interface ArticleDetailProps {
  slug: string;
}

/* ─── Main component ─── */
export default function ArticleDetail({ slug }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  // Load article from API
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    articleApi.getBySlug(slug)
      .then((data) => setArticle(data))
      .catch((err) => setError(err.message || "文章加载失败"))
      .finally(() => setLoading(false));
  }, [slug]);

  const articleMarkdown = article?.content || "";
  const readTime = article ? estimateReadTime(article.content) : "";

  // Auto-generate TOC from markdown headings
  const tocItems = useMemo(() => extractToc(articleMarkdown), [articleMarkdown]);

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
      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center min-h-[60vh] pt-28">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-28 gap-4">
          <p className="text-text-secondary font-heading">{error}</p>
          <Link href="/blog" className="text-accent text-sm font-heading hover:underline">
            ← 返回博客列表
          </Link>
        </div>
      )}
      {!loading && !error && article && (
      <>
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
          <Link href="/blog" className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-heading font-medium">返回</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary font-heading">
            <Link href="/" className="hover:text-accent transition-colors">首页</Link>
            <ChevronRight size={12} />
            <Link href="/blog" className="hover:text-accent transition-colors">博客</Link>
            <ChevronRight size={12} />
            <span className="text-accent/80 truncate max-w-[200px]">{article.title}</span>
          </div>

          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                href={`/editor/${article.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-accent bg-accent/10 hover:bg-accent/15 transition-all text-xs font-heading"
              >
                <PenLine size={14} />
                编辑
              </Link>
            )}
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
                  {(article.tags || []).map((tag) => (
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
                  {article.title}
                </h1>

                {/* Summary */}
                <p className="mt-4 text-lg text-text-secondary font-body leading-relaxed max-w-2xl">
                  {article.summary}
                </p>

                {/* Meta info */}
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  {/* Category badge */}
                  {article.category && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-sm font-heading text-text-primary">
                      <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                        <Zap size={10} className="text-text-inverse" />
                      </div>
                      {article.category}
                    </span>
                  )}

                  {article.category && <div className="h-4 w-px bg-border" />}

                  <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                    <Calendar size={12} />
                    {article.createdAt?.split("T")[0]}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                    <Clock size={12} />
                    {readTime}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Category card — floating right */}
            <div className="col-span-12 lg:col-span-3 flex lg:items-end lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex flex-col items-center justify-center px-8 py-6 rounded-2xl border border-border-accent bg-bg-elevated/60 backdrop-blur-sm"
              >
                <div className="text-[10px] font-mono text-accent/60 tracking-[0.2em] uppercase mb-1">
                  {article.category || "Blog"}
                </div>
                <div className="font-mono font-extrabold text-5xl leading-none text-accent">
                  {(article.tags || []).length}
                </div>
                <div className="mt-2 px-3 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider uppercase" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)', color: '#0A0E1A' }}>
                  标签数
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

              {/* Back to blog */}
              <Link
                href="/blog"
                className="mt-6 group inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border-accent bg-bg-elevated/60 text-sm font-heading hover:bg-accent/5 transition-all"
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                  <ArrowLeft size={14} className="text-text-inverse" />
                </div>
                <div>
                  <div className="text-text-primary font-semibold">返回博客</div>
                  <div className="text-xs text-text-tertiary">查看更多文章</div>
                </div>
                <ArrowUpRight size={14} className="text-text-tertiary group-hover:text-accent ml-auto transition-colors" />
              </Link>
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

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-5"
              >
                <h4 className="text-xs font-mono font-semibold text-text-secondary tracking-widest uppercase mb-4">
                  文章标签
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(article.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-surface border border-border text-xs font-heading text-text-secondary"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Article info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-5"
              >
                <div className="space-y-3 text-xs text-text-tertiary font-heading">
                  <div className="flex justify-between">
                    <span>分类</span>
                    <span className="text-text-secondary">{article.category || "未分类"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>发布日期</span>
                    <span className="text-text-secondary">{article.createdAt?.split("T")[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>更新日期</span>
                    <span className="text-text-secondary">{article.updatedAt?.split("T")[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>预计阅读</span>
                    <span className="text-text-secondary">{readTime}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
