"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Image,
  Table,
  Save,
  FileText,
  Tag,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  Type,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

/* ─── Types ─── */
interface ArticleMeta {
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  date: string;
  readTime: string;
  featured: boolean;
}

/* ─── Toolbar actions ─── */
interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement) => { text: string; cursorPos: number };
  dividerAfter?: boolean;
}

function getToolbarActions(): ToolbarAction[] {
  return [
    {
      icon: <Heading2 size={14} />,
      label: "二级标题",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "标题";
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const lineStart = before.lastIndexOf("\n") + 1;
        const prefix = before.substring(lineStart);
        const needNewline = prefix.trim() !== "" && !prefix.endsWith("\n") ? "\n" : "";
        const insert = `${needNewline}## ${selected}`;
        const text = before.substring(0, lineStart) + prefix + insert + after;
        return { text, cursorPos: before.length + insert.length };
      },
    },
    {
      icon: <Heading3 size={14} />,
      label: "三级标题",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "标题";
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionEnd);
        const lineStart = before.lastIndexOf("\n") + 1;
        const prefix = before.substring(lineStart);
        const needNewline = prefix.trim() !== "" && !prefix.endsWith("\n") ? "\n" : "";
        const insert = `${needNewline}### ${selected}`;
        const text = before.substring(0, lineStart) + prefix + insert + after;
        return { text, cursorPos: before.length + insert.length };
      },
      dividerAfter: true,
    },
    {
      icon: <Bold size={14} />,
      label: "加粗",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "粗体文本";
        const text = value.substring(0, selectionStart) + `**${selected}**` + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + 2 + selected.length };
      },
    },
    {
      icon: <Italic size={14} />,
      label: "斜体",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "斜体文本";
        const text = value.substring(0, selectionStart) + `*${selected}*` + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + 1 + selected.length };
      },
    },
    {
      icon: <Code size={14} />,
      label: "行内代码",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "code";
        const text = value.substring(0, selectionStart) + `\`${selected}\`` + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + 1 + selected.length };
      },
      dividerAfter: true,
    },
    {
      icon: <Link size={14} />,
      label: "链接",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "链接文本";
        const insert = `[${selected}](https://example.com)`;
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + selected.length + 3 };
      },
    },
    {
      icon: <Image size={14} />,
      label: "图片",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "图片描述";
        const insert = `![${selected}](url)`;
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + selected.length + 4 };
      },
      dividerAfter: true,
    },
    {
      icon: <List size={14} />,
      label: "无序列表",
      action: (ta) => {
        const { selectionStart, value } = ta;
        const insert = "\n- 列表项\n";
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionStart);
        return { text, cursorPos: selectionStart + insert.length };
      },
    },
    {
      icon: <ListOrdered size={14} />,
      label: "有序列表",
      action: (ta) => {
        const { selectionStart, value } = ta;
        const insert = "\n1. 列表项\n";
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionStart);
        return { text, cursorPos: selectionStart + insert.length };
      },
    },
    {
      icon: <Quote size={14} />,
      label: "引用",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "引用文本";
        const insert = `\n> ${selected}\n`;
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + insert.length };
      },
      dividerAfter: true,
    },
    {
      icon: <Type size={14} />,
      label: "代码块",
      action: (ta) => {
        const { selectionStart, selectionEnd, value } = ta;
        const selected = value.substring(selectionStart, selectionEnd) || "// code here";
        const insert = `\n\`\`\`tsx\n${selected}\n\`\`\`\n`;
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionEnd);
        return { text, cursorPos: selectionStart + 7 + selected.length };
      },
    },
    {
      icon: <Table size={14} />,
      label: "表格",
      action: (ta) => {
        const { selectionStart, value } = ta;
        const insert = "\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n";
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionStart);
        return { text, cursorPos: selectionStart + insert.length };
      },
    },
    {
      icon: <Minus size={14} />,
      label: "分割线",
      action: (ta) => {
        const { selectionStart, value } = ta;
        const insert = "\n---\n";
        const text = value.substring(0, selectionStart) + insert + value.substring(selectionStart);
        return { text, cursorPos: selectionStart + insert.length };
      },
    },
  ];
}

/* ─── Estimate read time ─── */
function estimateReadTime(text: string): string {
  const chars = text.replace(/\s+/g, "").length;
  const minutes = Math.max(1, Math.ceil(chars / 500));
  return `${minutes} 分钟`;
}

/* ─── Auto-generate slug from title ─── */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

/* ─── Local storage helpers ─── */
const STORAGE_KEY = "markdown-editor-draft";

function saveDraft(meta: ArticleMeta, content: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, content, savedAt: Date.now() }));
  } catch {
    // ignore
  }
}

function loadDraft(): { meta: ArticleMeta; content: string; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/* ─── Main editor component ─── */
export default function MarkdownEditor() {
  const today = new Date().toISOString().split("T")[0];

  const [meta, setMeta] = useState<ArticleMeta>({
    title: "",
    slug: "",
    summary: "",
    tags: [],
    date: today,
    readTime: "1 分钟",
    featured: false,
  });

  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarActions = getToolbarActions();

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setMeta(draft.meta);
      setContent(draft.content);
      setLastSaved(new Date(draft.savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (content.trim() || meta.title.trim()) {
        saveDraft(meta, content);
        setLastSaved(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [meta, content]);

  // Update read time on content change
  useEffect(() => {
    setMeta((prev) => ({ ...prev, readTime: estimateReadTime(content) }));
  }, [content]);

  // Auto-generate slug from title
  const handleTitleChange = useCallback((title: string) => {
    setMeta((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  }, []);

  // Toolbar action handler
  const handleToolbarAction = useCallback((action: ToolbarAction["action"]) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { text, cursorPos } = action(ta);
    setContent(text);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, []);

  // Add tag
  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !meta.tags.includes(tag)) {
      setMeta((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  }, [tagInput, meta.tags]);

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setMeta((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  // Copy full markdown
  const handleCopy = useCallback(() => {
    const frontmatter = `---
title: "${meta.title}"
slug: "${meta.slug}"
summary: "${meta.summary}"
date: "${meta.date}"
readTime: "${meta.readTime}"
tags: [${meta.tags.map((t) => `"${t}"`).join(", ")}]
featured: ${meta.featured}
---

`;
    navigator.clipboard.writeText(frontmatter + content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [meta, content]);

  // Download as .md file
  const handleDownload = useCallback(() => {
    const frontmatter = `---
title: "${meta.title}"
slug: "${meta.slug}"
summary: "${meta.summary}"
date: "${meta.date}"
readTime: "${meta.readTime}"
tags: [${meta.tags.map((t) => `"${t}"`).join(", ")}]
featured: ${meta.featured}
---

`;
    const blob = new Blob([frontmatter + content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.slug || "article"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meta, content]);

  // Save draft manually
  const handleSave = useCallback(() => {
    saveDraft(meta, content);
    setSaved(true);
    setLastSaved(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
    setTimeout(() => setSaved(false), 2000);
  }, [meta, content]);

  // Clear draft
  const handleClear = useCallback(() => {
    setMeta({
      title: "",
      slug: "",
      summary: "",
      tags: [],
      date: today,
      readTime: "1 分钟",
      featured: false,
    });
    setContent("");
    localStorage.removeItem(STORAGE_KEY);
    setLastSaved(null);
  }, [today]);

  // Keyboard shortcut: Ctrl+S to save, Ctrl+P to toggle preview
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setShowPreview((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Word & char count
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <section className={`relative pt-28 pb-24 overflow-hidden ${fullscreen ? "fixed inset-0 z-[100] bg-bg-primary pt-4 pb-4" : ""}`}>
      {/* Background */}
      {!fullscreen && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-[600px] h-[500px] bg-[radial-gradient(circle,rgba(201,168,124,0.03)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(107,155,151,0.02)_0%,transparent_70%)]" />
        </div>
      )}

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${fullscreen ? "max-w-full h-full flex flex-col" : "max-w-7xl"}`}>
        {/* Header */}
        {!fullscreen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-text-primary leading-tight">
              文章
              <span
                style={{
                  background: "linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                编辑器
              </span>
            </h1>
            <p className="mt-3 text-text-secondary text-base max-w-2xl">
              使用 Markdown 撰写文章，实时预览渲染效果。支持 GFM 语法、代码高亮和表格。
            </p>
          </motion.div>
        )}

        {/* ─── Meta panel ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className={`rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm mb-5 overflow-hidden ${fullscreen ? "mb-3" : ""}`}
        >
          {/* Meta header */}
          <button
            onClick={() => setMetaExpanded(!metaExpanded)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bg-surface/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText size={14} className="text-accent" />
              <span className="text-sm font-heading font-semibold text-text-primary">
                文章信息
              </span>
              {meta.title && (
                <span className="text-xs text-text-tertiary font-heading truncate max-w-[300px]">
                  — {meta.title}
                </span>
              )}
            </div>
            {metaExpanded ? (
              <ChevronUp size={14} className="text-text-tertiary" />
            ) : (
              <ChevronDown size={14} className="text-text-tertiary" />
            )}
          </button>

          <AnimatePresence>
            {metaExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-border/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
                        <Type size={10} />
                        标题
                      </label>
                      <input
                        type="text"
                        value={meta.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="文章标题..."
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-heading placeholder:text-text-tertiary/50 outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all"
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
                        <Link size={10} />
                        Slug (URL 路径)
                      </label>
                      <input
                        type="text"
                        value={meta.slug}
                        onChange={(e) => setMeta((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="article-slug"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-mono placeholder:text-text-tertiary/50 outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
                        <Calendar size={10} />
                        日期
                      </label>
                      <input
                        type="date"
                        value={meta.date}
                        onChange={(e) => setMeta((prev) => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-mono outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all"
                      />
                    </div>

                    {/* Summary */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
                        <FileText size={10} />
                        摘要
                      </label>
                      <textarea
                        value={meta.summary}
                        onChange={(e) => setMeta((prev) => ({ ...prev, summary: e.target.value }))}
                        placeholder="简短描述文章内容..."
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-body placeholder:text-text-tertiary/50 outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all resize-none"
                      />
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-heading font-medium text-text-tertiary mb-1.5">
                        <Tag size={10} />
                        标签
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {meta.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-heading border border-accent/20"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-accent-bright transition-colors ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                            placeholder="添加标签..."
                            className="px-3 py-1 rounded-lg border border-border bg-bg-surface/60 text-text-primary text-xs font-heading placeholder:text-text-tertiary/50 outline-none focus:border-accent/30 transition-all w-24"
                          />
                          <button
                            onClick={addTag}
                            className="px-2 py-1 rounded-lg bg-bg-surface text-text-tertiary text-xs font-heading hover:text-accent hover:bg-accent/5 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Featured toggle + Read time display */}
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setMeta((prev) => ({ ...prev, featured: !prev.featured }))}
                          className={`relative w-9 h-5 rounded-full transition-all duration-300 cursor-pointer ${
                            meta.featured ? "bg-accent/30 border-accent/40" : "bg-bg-surface border-border"
                          } border`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                              meta.featured ? "left-4 bg-accent" : "left-0.5 bg-text-tertiary"
                            }`}
                          />
                        </div>
                        <span className="text-xs font-heading text-text-secondary">精选文章</span>
                      </label>

                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                        <Clock size={10} />
                        预计 {meta.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Toolbar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg-elevated/40 backdrop-blur-sm px-3 py-2 mb-3"
        >
          {/* Formatting tools */}
          <div className="flex items-center gap-0.5 flex-wrap">
            {toolbarActions.map((action, i) => (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => handleToolbarAction(action.action)}
                  title={action.label}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all"
                >
                  {action.icon}
                </button>
                {action.dividerAfter && (
                  <div className="w-px h-4 bg-border mx-1" />
                )}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {lastSaved && (
              <span className="text-[10px] font-mono text-text-tertiary mr-2 hidden sm:inline">
                {saved ? "已保存" : `自动保存 ${lastSaved}`}
              </span>
            )}
            <button
              onClick={handleSave}
              title="保存草稿 (⌘S)"
              className={`p-1.5 rounded-lg transition-all ${
                saved ? "text-teal bg-teal/10" : "text-text-tertiary hover:text-accent hover:bg-accent/5"
              }`}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
            </button>
            <button
              onClick={handleCopy}
              title="复制 Markdown"
              className={`p-1.5 rounded-lg transition-all ${
                copied ? "text-teal bg-teal/10" : "text-text-tertiary hover:text-accent hover:bg-accent/5"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button
              onClick={handleDownload}
              title="下载 .md 文件"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all"
            >
              <Download size={14} />
            </button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "隐藏预览 (⌘P)" : "显示预览 (⌘P)"}
              className={`p-1.5 rounded-lg transition-all ${
                showPreview ? "text-accent bg-accent/10" : "text-text-tertiary hover:text-accent hover:bg-accent/5"
              }`}
            >
              {showPreview ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "退出全屏" : "全屏编辑"}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all"
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={handleClear}
              title="清空草稿"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-400/5 transition-all"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </motion.div>

        {/* ─── Editor + Preview ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`grid gap-4 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"} ${fullscreen ? "flex-1 min-h-0" : ""}`}
          style={fullscreen ? { height: "calc(100vh - 180px)" } : undefined}
        >
          {/* Editor pane */}
          <div className="flex flex-col rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm overflow-hidden min-h-[500px]">
            {/* Editor header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-surface/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-teal/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/20" />
                </div>
                <span className="text-[10px] font-mono text-text-tertiary ml-2">
                  编辑器 · markdown
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-text-tertiary">
                <span>{charCount} 字符</span>
                <span>{wordCount} 词</span>
              </div>
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`在此输入 Markdown 内容...

## 引言

在这里写下你的文章正文...

### 小标题

支持 **加粗**、*斜体*、\`行内代码\` 等语法。

\`\`\`tsx
// 代码块也支持高亮
const hello = "world";
\`\`\`

> 引用文本

---

## 总结

文章总结...`}
              spellCheck={false}
              className="flex-1 w-full p-5 bg-transparent text-text-primary text-[14px] font-mono leading-[1.8] placeholder:text-text-tertiary/30 outline-none resize-none"
              style={{ tabSize: 2 }}
            />
          </div>

          {/* Preview pane */}
          {showPreview && (
            <div className="flex flex-col rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm overflow-hidden min-h-[500px]">
              {/* Preview header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-surface/30">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-teal/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/20" />
                  </div>
                  <span className="text-[10px] font-mono text-text-tertiary ml-2">
                    预览 · rendered
                  </span>
                </div>
                <Eye size={12} className="text-text-tertiary" />
              </div>
              {/* Rendered content */}
              <div className="flex-1 overflow-y-auto p-6">
                {content.trim() ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-tertiary/40">
                    <FileText size={40} strokeWidth={1} />
                    <p className="mt-3 text-sm font-heading">开始输入即可预览</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Bottom status bar ─── */}
        {!fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-4 px-2"
          >
            <div className="flex items-center gap-4 text-[10px] font-mono text-text-tertiary">
              <span>Markdown · GFM</span>
              <span>⌘S 保存</span>
              <span>⌘P 切换预览</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-text-tertiary">
              <span>{charCount} 字符</span>
              <span>预计阅读 {meta.readTime}</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
