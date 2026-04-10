"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Copy, Check } from "lucide-react";
import type { Components } from "react-markdown";

/* ─── Code block with terminal-style chrome ─── */
function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";

  // Extract text content for copy
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(getTextContent).join("");
    if (node && typeof node === "object" && "props" in node) {
      const el = node as React.ReactElement<{ children?: React.ReactNode }>;
      return getTextContent(el.props.children);
    }
    return "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getTextContent(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 mb-6 rounded-2xl border border-border bg-[#0D1220] overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-elevated/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A87C]/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#6B9B97]/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/20" />
          </div>
          <span className="text-[10px] font-mono text-text-tertiary ml-2">
            {lang || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-text-tertiary hover:text-accent transition-colors"
        >
          {copied ? <Check size={12} className="text-[#6B9B97]" /> : <Copy size={12} />}
        </button>
      </div>
      {/* Code content */}
      <pre className="p-5 overflow-x-auto !bg-transparent !m-0">
        <code className={`text-[13px] font-mono leading-relaxed ${className || ""}`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

/* ─── Ordered list with badge numbers ─── */
function OrderedList({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-2 pl-0 my-4 list-none">{children}</ol>;
}

function OrderedListItem({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-5 h-5 rounded-md bg-accent/8 text-accent text-xs font-mono flex items-center justify-center mt-0.5">
        {index}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

/* ─── Table with hover effect ─── */
function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

function TableRow({ children, isHeader }: { children: React.ReactNode; isHeader?: boolean }) {
  if (isHeader) {
    return <tr className="border-b border-border bg-bg-surface/30">{children}</tr>;
  }
  return (
    <tr className="border-b border-border/50 hover:bg-bg-surface/50 transition-colors">
      {children}
    </tr>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-3 px-4 text-text-primary font-heading font-semibold text-xs uppercase tracking-wider">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-2.5 px-4 font-mono text-xs text-text-secondary">{children}</td>
  );
}

/* ─── Build a map from heading text → section number (h2 only) ─── */
function buildH2IndexMap(markdown: string): Map<string, number> {
  const h2Regex = /^##\s+(.+)$/gm;
  const map = new Map<string, number>();
  let idx = 0;
  let match;
  while ((match = h2Regex.exec(markdown)) !== null) {
    idx += 1;
    const title = match[1].trim();
    map.set(title, idx);
  }
  return map;
}

/* ─── Custom components map for react-markdown ─── */
function createComponents(h2IndexMap: Map<string, number>): Components {
  let listItemIndex = 0;

  return {
    // Headings with decorative gradient bar + section numbers
    h2: ({ children, ...props }) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, "");
      const num = h2IndexMap.get(text) ?? 0;
      // Alternate colors for section numbers
      const isEven = num % 2 === 0;
      return (
        <div className="relative mt-14 mb-6 scroll-mt-24 group/heading" id={id} data-section>
          {/* Background glow */}
          <div
            className="absolute -left-4 -right-4 -top-3 -bottom-3 rounded-2xl opacity-0 group-hover/heading:opacity-100 transition-opacity duration-500"
            style={{ background: isEven
              ? 'radial-gradient(ellipse at left, rgba(107,155,151,0.04) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at left, rgba(201,168,124,0.04) 0%, transparent 70%)'
            }}
          />
          <div className="relative flex items-stretch gap-4">
            {/* Decorative vertical bar */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className="w-[3px] flex-1 rounded-full"
                style={{ background: isEven
                  ? 'linear-gradient(to bottom, #6B9B97, rgba(107,155,151,0.15))'
                  : 'linear-gradient(to bottom, #C9A87C, rgba(201,168,124,0.15))'
                }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isEven ? '#6B9B97' : '#C9A87C', opacity: 0.4 }}
              />
            </div>
            {/* Title content */}
            <div className="flex-1">
              <span
                className="text-[10px] font-mono tracking-widest uppercase mb-1 block"
                style={{ color: isEven ? 'rgba(107,155,151,0.5)' : 'rgba(201,168,124,0.5)' }}
              >
                Section {String(num).padStart(2, "0")}
              </span>
              <h2
                className="font-heading font-bold text-xl sm:text-2xl text-text-primary leading-tight"
                {...props}
              >
                {children}
              </h2>
            </div>
          </div>
        </div>
      );
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, "");
      return (
        <h3
          id={id}
          data-section
          className="font-heading font-semibold text-lg text-text-primary mb-4 mt-8 scroll-mt-24 flex items-center gap-2.5"
          {...props}
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal/40" />
            <span className="w-1 h-1 rounded-full bg-accent/30" />
          </span>
          {children}
        </h3>
      );
    },
    // Paragraphs
    p: ({ children }) => <p className="mb-4">{children}</p>,
    // Strong / bold
    strong: ({ children }) => (
      <strong className="text-text-primary font-semibold">{children}</strong>
    ),
    // Links
    a: ({ href, children }) => (
      <a href={href} className="text-accent underline underline-offset-[3px] decoration-accent-dim hover:text-accent-bright hover:decoration-accent-bright transition-all">
        {children}
      </a>
    ),
    // Code: inline vs block
    code: ({ className, children, ...props }) => {
      const isBlock = className?.includes("language-") || className?.includes("hljs");
      if (isBlock) {
        return (
          <CodeBlock className={className}>
            {children}
          </CodeBlock>
        );
      }
      // Inline code
      return (
        <code className="bg-bg-surface border border-border rounded-[5px] px-[0.4em] py-[0.15em] font-mono text-[0.88em] text-accent" {...props}>
          {children}
        </code>
      );
    },
    // Pre: delegate to code's CodeBlock
    pre: ({ children }) => <>{children}</>,
    // Tables
    table: ({ children }) => <Table>{children}</Table>,
    thead: ({ children }) => <TableHead>{children}</TableHead>,
    tbody: ({ children }) => <TableBody>{children}</TableBody>,
    tr: ({ children, ...props }) => {
      // Detect if this is a header row by checking parent
      const node = props.node as unknown as { parentNode?: { tagName?: string } };
      const isHeader = node?.parentNode?.tagName === "thead";
      return <TableRow isHeader={isHeader}>{children}</TableRow>;
    },
    th: ({ children }) => <TableHeader>{children}</TableHeader>,
    td: ({ children }) => <TableCell>{children}</TableCell>,
    // Ordered lists with badge numbers
    ol: ({ children }) => {
      listItemIndex = 0;
      return <OrderedList>{children}</OrderedList>;
    },
    li: ({ children, ...props }) => {
      // Check if parent is ol by checking for ordered prop
      const node = props.node as unknown as { parentNode?: { tagName?: string } };
      const isOrdered = node?.parentNode?.tagName === "ol";
      if (isOrdered) {
        listItemIndex += 1;
        return (
          <OrderedListItem index={listItemIndex}>{children}</OrderedListItem>
        );
      }
      // Unordered list item — styled via CSS .article-prose ul li
      return <li>{children}</li>;
    },
    // Unordered list
    ul: ({ children }) => <ul className="my-4">{children}</ul>,
    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className="border-l-[3px] border-accent-dim pl-5 my-6 text-text-secondary italic">
        {children}
      </blockquote>
    ),
    // Horizontal rule — multi-line with geometric center ornament
    hr: () => (
      <div className="flex items-center gap-3 my-10">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,124,0.15))' }} />
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-teal/25" />
          <div className="w-1.5 h-1.5 rotate-45 border border-accent/25" />
          <div className="w-1 h-1 rounded-full bg-accent/25" />
          <div className="w-1.5 h-1.5 rotate-45 border border-teal/25" />
          <div className="w-1 h-1 rounded-full bg-teal/25" />
        </div>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(107,155,151,0.15))' }} />
      </div>
    ),
    // Images — skip placeholder urls
    img: ({ src, alt }) => {
      const srcStr = typeof src === "string" ? src : "";
      if (!srcStr || srcStr === "url" || srcStr.startsWith("data:") === false && !srcStr.startsWith("http") && !srcStr.startsWith("/")) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-text-tertiary text-xs font-mono my-2">
            🖼 {alt || "图片"}{src && src !== "url" ? ` — ${src}` : ""}
          </span>
        );
      }
      return (
        <img
          src={src}
          alt={alt || ""}
          className="rounded-[var(--radius-lg)] border border-border my-6 max-w-full"
        />
      );
    },
  };
}

/* ─── Extract TOC from markdown ─── */
export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length - 1; // h2 → 1, h3 → 2
    const title = match[2].trim();
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, "");
    items.push({ id, title, level });
  }
  return items;
}

/* ─── Main MarkdownRenderer component ─── */
interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const h2IndexMap = useMemo(() => buildH2IndexMap(content), [content]);
  const components = useMemo(() => createComponents(h2IndexMap), [h2IndexMap]);

  return (
    <div className={`article-prose text-text-secondary text-[15px] leading-[1.85] font-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
