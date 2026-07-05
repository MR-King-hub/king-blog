"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Github,
  ExternalLink,
  Star,
  GitFork,
  Plus,
  PenLine,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { projectApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Project, CreateProjectInput } from "@blog/shared";

/* ─── Gradient palette ─── */
const gradients = [
  { gradient: "linear-gradient(135deg, rgba(107,155,151,0.08) 0%, rgba(201,168,124,0.06) 100%)", color: "#6B9B97" },
  { gradient: "linear-gradient(135deg, rgba(201,168,124,0.08) 0%, rgba(176,122,91,0.06) 100%)", color: "#C9A87C" },
  { gradient: "linear-gradient(135deg, rgba(176,122,91,0.08) 0%, rgba(155,126,155,0.06) 100%)", color: "#B07A5B" },
  { gradient: "linear-gradient(135deg, rgba(155,126,155,0.08) 0%, rgba(107,155,151,0.06) 100%)", color: "#9B7E9B" },
];

function getGradient(i: number) {
  return gradients[i % gradients.length];
}

/* ─── Project form modal ─── */
function ProjectFormModal({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!project;
  const [form, setForm] = useState<CreateProjectInput>({
    title: project?.title || "",
    description: project?.description || "",
    techStack: project?.techStack || [],
    github: project?.github || "",
    demo: project?.demo || "",
    stars: project?.stars || 0,
    forks: project?.forks || 0,
    featured: project?.featured || false,
    status: project?.status || "published",
  });
  const [techInput, setTechInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await projectApi.update(project!.id, form);
      } else {
        await projectApi.create(form);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const addTech = () => {
    const t = techInput.trim();
    if (t && !(form.techStack || []).includes(t)) {
      setForm((f) => ({ ...f, techStack: [...(f.techStack || []), t] }));
    }
    setTechInput("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-border bg-bg-elevated p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-lg text-text-primary">
            {isEdit ? "编辑项目" : "新建项目"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-heading text-text-tertiary mb-1 block">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-heading outline-none focus:border-accent/30 transition-all"
              placeholder="项目名称"
            />
          </div>
          <div>
            <label className="text-xs font-heading text-text-tertiary mb-1 block">描述 *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-heading outline-none focus:border-accent/30 transition-all resize-none"
              placeholder="简要描述项目..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-heading text-text-tertiary mb-1 block">GitHub URL</label>
              <input
                value={form.github || ""}
                onChange={(e) => setForm((f) => ({ ...f, github: e.target.value || undefined }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-mono outline-none focus:border-accent/30 transition-all"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="text-xs font-heading text-text-tertiary mb-1 block">Demo URL</label>
              <input
                value={form.demo || ""}
                onChange={(e) => setForm((f) => ({ ...f, demo: e.target.value || undefined }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-mono outline-none focus:border-accent/30 transition-all"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-heading text-text-tertiary mb-1 block">Stars</label>
              <input
                type="number"
                value={form.stars || 0}
                onChange={(e) => setForm((f) => ({ ...f, stars: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-mono outline-none focus:border-accent/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-heading text-text-tertiary mb-1 block">Forks</label>
              <input
                type="number"
                value={form.forks || 0}
                onChange={(e) => setForm((f) => ({ ...f, forks: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-mono outline-none focus:border-accent/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-heading text-text-tertiary mb-1 block">技术栈</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(form.techStack || []).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 text-accent text-xs font-heading border border-accent/20">
                  {t}
                  <button onClick={() => setForm((f) => ({ ...f, techStack: (f.techStack || []).filter((x) => x !== t) }))} className="hover:text-accent-bright">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-bg-surface/60 text-text-primary text-xs font-heading outline-none focus:border-accent/30 transition-all"
                placeholder="添加技术标签..."
              />
              <button onClick={addTech} className="px-2 py-1.5 rounded-lg bg-bg-surface text-text-tertiary text-xs hover:text-accent transition-all">+</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="accent-accent"
              />
              <span className="text-xs font-heading text-text-secondary">精选项目</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === "published"}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "published" : "draft" }))}
                className="accent-accent"
              />
              <span className="text-xs font-heading text-text-secondary">发布</span>
            </label>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-heading text-text-secondary hover:bg-bg-surface transition-all">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-heading font-semibold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isEdit ? "更新" : "创建"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main component ─── */
export default function ProjectsShowcase() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [showForm, setShowForm] = useState(false);
  const { isAdmin } = useAuth();

  const loadProjects = useCallback(() => {
    projectApi.list("published")
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确认删除「${title}」？`)) return;
    try {
      await projectApi.delete(id);
      loadProjects();
    } catch { /* ignore */ }
  };

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
          className="flex items-end justify-between mb-14"
        >
          <div>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-tight">
              项目
              <span style={{ background: 'linear-gradient(135deg, #DEC4A0 0%, #C9A87C 45%, #A8896A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>作品</span>
            </h1>
            <p className="mt-4 text-text-secondary text-base sm:text-lg max-w-xl">
              个人开源项目与作品集，涵盖前端工程、AI 应用和开发者工具。
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditProject(undefined); setShowForm(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-heading font-semibold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all"
            >
              <Plus size={14} />
              新建项目
            </button>
          )}
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-tertiary font-heading text-sm">暂无项目</p>
          </div>
        ) : (
          <>
            {/* Featured project */}
            {featuredProject && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mb-8 relative"
              >
                {isAdmin && (
                  <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                    <button onClick={() => { setEditProject(featuredProject); setShowForm(true); }} className="p-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"><PenLine size={12} /></button>
                    <button onClick={() => handleDelete(featuredProject.id, featuredProject.title)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"><Trash2 size={12} /></button>
                  </div>
                )}
                <div className="card-hover group relative rounded-3xl border border-border-accent bg-bg-elevated/40 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: getGradient(0).gradient }} />
                  <div className="relative z-10 grid grid-cols-12 gap-0">
                    <div className="col-span-12 md:col-span-4 p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border" style={{ background: getGradient(0).gradient }}>
                      <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-mono font-bold tracking-wider uppercase w-fit mb-4">Featured</span>
                      <h3 className="font-heading font-extrabold text-2xl lg:text-3xl text-text-primary mb-3">{featuredProject.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        {featuredProject.github && <a href={featuredProject.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors font-heading"><Github size={14} />Source</a>}
                        {featuredProject.demo && <a href={featuredProject.demo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors font-heading"><ExternalLink size={14} />Demo</a>}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-8 p-8">
                      <p className="text-text-secondary text-sm leading-relaxed mb-6">{featuredProject.description}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {(featuredProject.techStack || []).map((tech) => (
                          <span key={tech} className="px-2.5 py-1 rounded-lg bg-bg-surface border border-border text-xs font-heading text-text-secondary">{tech}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        {!!featuredProject.stars && <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary"><Star size={12} className="text-accent" />{featuredProject.stars}</span>}
                        {!!featuredProject.forks && <span className="flex items-center gap-1.5 text-xs font-mono text-text-tertiary"><GitFork size={12} className="text-[#6B9B97]" />{featuredProject.forks}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Projects grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherProjects.map((project, i) => {
                const g = getGradient(i + 1);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    className="card-hover group relative rounded-2xl border border-border bg-bg-elevated/40 backdrop-blur-sm p-6 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px opacity-40" style={{ background: g.gradient }} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: g.gradient }} />

                    {isAdmin && (
                      <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditProject(project); setShowForm(true); }} className="p-1 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-all"><PenLine size={10} /></button>
                        <button onClick={() => handleDelete(project.id, project.title)} className="p-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"><Trash2 size={10} /></button>
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${g.color}15` }}>
                          <Github size={18} style={{ color: g.color }} />
                        </div>
                        <div className="flex items-center gap-3">
                          {!!project.stars && <span className="flex items-center gap-1 text-xs font-mono text-text-tertiary"><Star size={11} className="text-accent/60" />{project.stars}</span>}
                          {!!project.forks && <span className="flex items-center gap-1 text-xs font-mono text-text-tertiary"><GitFork size={11} className="text-[#6B9B97]/60" />{project.forks}</span>}
                        </div>
                      </div>
                      <h3 className="font-heading font-bold text-base text-text-primary group-hover:text-accent transition-colors duration-300 mb-2">{project.title}</h3>
                      <p className="text-xs text-text-tertiary leading-relaxed mb-4 line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(project.techStack || []).map((tech) => (
                          <span key={tech} className="px-2 py-0.5 rounded text-[10px] font-heading bg-bg-surface text-text-tertiary">{tech}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 pt-3 border-t border-border">
                        {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors font-heading"><Github size={13} />代码</a>}
                        {project.demo && <a href={project.demo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors font-heading"><ExternalLink size={13} />预览</a>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <ProjectFormModal
            project={editProject}
            onClose={() => setShowForm(false)}
            onSaved={loadProjects}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
