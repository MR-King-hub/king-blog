"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Zap,
  PenLine,
} from "lucide-react";

const navLinks = [
  { name: "首页", href: "/" },
  { name: "博客", href: "/blog" },
  { name: "项目", href: "/projects" },
  { name: "关于", href: "/about" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism bar */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-bg-primary/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <nav className="flex h-14 items-center justify-between px-5">
          {/* Left: Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                <Zap size={16} className="text-text-inverse" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-accent/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
              Shizhe
              <span className="text-text-tertiary font-normal text-sm">.dev</span>
            </span>
          </a>

          {/* Center: Navigation links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-heading font-medium transition-all duration-300 ${
                  isActive(link.href)
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {isActive(link.href) ? (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-accent/8 border border-accent/15"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                ) : null}
                <span className="relative z-10">{link.name}</span>
              </a>
            ))}
          </div>

          {/* Right: Contact button + mobile toggle */}
          <div className="flex items-center gap-2">
            <a
              href="/editor"
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent/10 text-accent text-sm font-heading font-semibold border border-accent/20 hover:bg-accent/20 hover:border-accent/40 transition-all duration-300"
            >
              <PenLine size={14} />
              写文章
            </a>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mt-2 rounded-2xl border border-border bg-bg-primary/90 backdrop-blur-xl p-4 shadow-lg"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-heading font-medium transition-all ${
                    isActive(link.href)
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <a
                href="/editor"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-heading font-semibold border border-accent/20"
              >
                <PenLine size={14} />
                写文章
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
