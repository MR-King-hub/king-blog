"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Menu,
  X,
  FileText,
  Headphones,
  Video,
  MessageCircle,
  Zap,
} from "lucide-react";

const navTabs = [
  { name: "文章", icon: FileText },
  { name: "播客", icon: Headphones },
  { name: "视频", icon: Video },
  { name: "推文", icon: MessageCircle },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("文章");
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Glassmorphism bar */}
      <div className="mx-4 mt-4 rounded-2xl border border-border bg-bg-primary/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <nav className="flex h-14 items-center justify-between px-5">
          {/* Left: Logo — asymmetric weight */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}>
                <Zap size={16} className="text-text-inverse" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-accent/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
              Best
              <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Blogs</span>
            </span>
          </a>

          {/* Center: Tabs — pill navigator */}
          <div className="hidden lg:flex items-center gap-0.5 rounded-xl bg-bg-elevated/80 p-1 border border-border">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-heading font-medium transition-all duration-300 ${
                    isActive
                      ? "text-text-inverse"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, #C9A87C 0%, #A8896A 100%)' }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon size={14} />
                    {tab.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search + actions */}
          <div className="flex items-center gap-2">
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                searchFocused
                  ? "border-accent/40 bg-bg-surface shadow-[0_0_20px_rgba(201,168,124,0.06)]"
                  : "border-border bg-bg-elevated/60 hover:border-border-hover"
              }`}
            >
              <Search size={14} className="text-text-tertiary" />
              <input
                type="text"
                placeholder="搜索内容..."
                className="bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none w-28 font-heading"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <kbd className="rounded-md bg-bg-primary/80 border border-border px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">
                ⌘K
              </kbd>
            </div>

            <button className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent/10 text-accent text-sm font-heading font-semibold border border-accent/20 hover:bg-accent/20 hover:border-accent/40 transition-all duration-300">
              订阅
            </button>

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
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.name}
                    onClick={() => {
                      setActiveTab(tab.name);
                      setMobileOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-heading font-medium transition-all ${
                      activeTab === tab.name
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface border border-border">
                <Search size={14} className="text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none flex-1 font-heading"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
