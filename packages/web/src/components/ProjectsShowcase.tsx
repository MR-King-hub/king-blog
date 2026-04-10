"use client";

import { motion } from "motion/react";
import {
  Github,
  ExternalLink,
  Star,
  GitFork,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  github?: string;
  demo?: string;
  stars?: number;
  forks?: number;
  featured?: boolean;
  gradient: string;
  accentColor: string;
}

const projects: Project[] = [
  {
    id: "personal-blog",
    title: "AI 时代个人网站",
    description: "基于 Next.js 16 + Tailwind CSS v4 构建的现代个人网站，深色主题设计，支持 Markdown 博客渲染、项目展示。",
    techStack: ["Next.js", "React 19", "Tailwind CSS v4", "Motion"],
    github: "https://github.com",
    demo: "/",
    stars: 128,
    forks: 32,
    featured: true,
    gradient: "linear-gradient(135deg, rgba(107,155,151,0.08) 0%, rgba(201,168,124,0.06) 100%)",
    accentColor: "#6B9B97",
  },
  {
    id: "ai-assistant",
    title: "AI 对话助手",
    description: "基于大模型 API 的智能对话系统，支持 RAG 检索增强、流式输出和多轮对话上下文管理。",
    techStack: ["Python", "FastAPI", "LangChain", "React"],
    github: "https://github.com",
    stars: 256,
    forks: 48,
    gradient: "linear-gradient(135deg, rgba(201,168,124,0.08) 0%, rgba(176,122,91,0.06) 100%)",
    accentColor: "#C9A87C",
  },
  {
    id: "component-library",
    title: "React 组件库",
    description: "面向企业级应用的 React 组件库，包含 30+ 通用组件，完整的类型支持和主题定制能力。",
    techStack: ["React", "TypeScript", "Storybook", "Rollup"],
    github: "https://github.com",
    demo: "https://example.com",
    stars: 512,
    forks: 89,
    gradient: "linear-gradient(135deg, rgba(176,122,91,0.08) 0%, rgba(155,126,155,0.06) 100%)",
    accentColor: "#B07A5B",
  },
  {
    id: "devtools",
    title: "开发效率工具集",
    description: "一组提升日常开发效率的命令行工具，涵盖代码生成、项目脚手架、Git 工作流自动化。",
    techStack: ["Node.js", "TypeScript", "Commander", "Inquirer"],
    github: "https://github.com",
    stars: 89,
    forks: 15,
    gradient: "linear-gradient(135deg, rgba(155,126,155,0.08) 0%, rgba(107,155,151,0.06) 100%)",
    accentColor: "#9B7E9B",
  },
  {
    id: "data-viz",
    title: "数据可视化平台",
    description: "交互式数据可视化平台，支持实时数据流、多种图表类型和可拖拽的仪表盘布局。",
    techStack: ["React", "D3.js", "WebSocket", "PostgreSQL"],
    github: "https://github.com",
    demo: "https://example.com",
    stars: 167,
    forks: 28,
    gradient: "linear-gradient(135deg, rgba(107,155,151,0.08) 0%, rgba(201,168,124,0.04) 100%)",
    accentColor: "#6B9B97",
  },
  {
    id: "markdown-editor",
    title: "在线 Markdown 编辑器",
    description: "支持实时预览、语法高亮、图片上传和多种导出格式的在线 Markdown 编辑器。",
    techStack: ["Next.js", "CodeMirror", "Unified", "Vercel"],
    github: "https://github.com",
    demo: "https://example.com",
    stars: 203,
    forks: 41,
    gradient: "linear-gradient(135deg, rgba(201,168,124,0.06) 0%, rgba(176,122,91,0.04) 100%)",
    accentColor: "#C9A87C",
  },
];

export default function ProjectsShowcase() {
  const featuredProject = projects.find((p) => p.featured);
  const otherProjects = projects.filter((p) => !p.featured);

  return (
    <section className="relative pt-28 pb-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(107,155,151,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(201,168,124,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-tight">
            项目
            <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>作品</span>
          </h1>
          <p className="mt-4 text-text-secondary text-base sm:text-lg max-w-xl">
            个人开源项目与作品集，涵盖前端工程、AI 应用和开发者工具。
          </p>
        </motion.div>

        {/* Featured project */}
        {featuredProject && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mb-8"
          >
            <div className="card-hover group relative rounded-3xl border border-border-accent bg-bg-elevated/40 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: featuredProject.gradient }} />

              <div className="relative z-10 grid grid-cols-12 gap-0">
                {/* Left visual */}
                <div className="col-span-12 md:col-span-4 p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border" style={{ background: featuredProject.gradient }}>
                  <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-mono font-bold tracking-wider uppercase w-fit mb-4">
                    Featured
                  </span>
                  <h3 className="font-heading font-extrabold text-2xl lg:text-3xl text-text-primary mb-3">
                    {featuredProject.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    {featuredProject.github && (
                      <a href={featuredProject.github} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors font-heading">
                        <Github size={14} />
                        Source
                      </a>
                    )}
                    {featuredProject.demo && (
                      <a href={featuredProject.demo} className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors font-heading">
                        <ExternalLink size={14} />
                        Demo
                      </a>
                    )}
                  </div>
                </div>

                {/* Right content */}
                <div className="col-span-12 md:col-span-8 p-8">
                  <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    {featuredProject.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-bg-surface border border-border text-xs font-heading text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    {featuredProject.stars && (
                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                        <Star size={12} className="text-accent" />
                        {featuredProject.stars}
                      </span>
                    )}
                    {featuredProject.forks && (
                      <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary">
                        <GitFork size={12} className="text-[#6B9B97]" />
                        {featuredProject.forks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {otherProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="card-hover group relative rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-6 overflow-hidden"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: project.gradient }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: project.gradient }} />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${project.accentColor}15` }}
                  >
                    <Github size={18} style={{ color: project.accentColor }} />
                  </div>
                  <div className="flex items-center gap-3">
                    {project.stars && (
                      <span className="flex items-center gap-1 text-xs font-mono text-text-tertiary">
                        <Star size={11} className="text-accent/60" />
                        {project.stars}
                      </span>
                    )}
                    {project.forks && (
                      <span className="flex items-center gap-1 text-xs font-mono text-text-tertiary">
                        <GitFork size={11} className="text-[#6B9B97]/60" />
                        {project.forks}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & desc */}
                <h3 className="font-heading font-bold text-base text-text-primary group-hover:text-accent transition-colors duration-300 mb-2">
                  {project.title}
                </h3>
                <p className="text-xs text-text-tertiary leading-relaxed mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[10px] font-heading bg-bg-surface text-text-tertiary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  {project.github && (
                    <a
                      href={project.github}
                      className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors font-heading"
                    >
                      <Github size={13} />
                      代码
                    </a>
                  )}
                  {project.demo && (
                    <a
                      href={project.demo}
                      className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors font-heading"
                    >
                      <ExternalLink size={13} />
                      预览
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
