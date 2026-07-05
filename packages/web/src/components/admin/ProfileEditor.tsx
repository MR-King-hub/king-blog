"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type {
  SiteProfile,
  TimelineItem,
  SkillCategory,
  SkillItem,
  SocialLink,
  HeroBentoItem,
  SocialIcon,
  BentoIcon,
} from "@relayagent/shared";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-border bg-bg-surface/60 text-text-primary text-sm font-heading outline-none focus:border-accent/30 transition-all";
const labelClass = "text-xs font-heading text-text-tertiary mb-1 block";

const SOCIAL_ICONS: SocialIcon[] = [
  "github",
  "twitter",
  "mail",
  "book",
  "linkedin",
];
const BENTO_ICONS: BentoIcon[] = [
  "file-text",
  "folder-git",
  "bot",
  "briefcase",
];

type TabId =
  | "basic"
  | "about"
  | "timeline"
  | "skills"
  | "interests"
  | "social"
  | "bento";

const TABS: { id: TabId; label: string }[] = [
  { id: "basic", label: "基本信息" },
  { id: "about", label: "关于页" },
  { id: "timeline", label: "经历" },
  { id: "skills", label: "技能" },
  { id: "interests", label: "兴趣" },
  { id: "social", label: "社交链接" },
  { id: "bento", label: "首页卡片" },
];

interface ProfileEditorProps {
  profile: SiteProfile;
  onChange: (profile: SiteProfile) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = [...items];
  const target = index + direction;
  if (target < 0 || target >= next.length) return items;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function ProfileEditor({
  profile,
  onChange,
  onSave,
  saving,
}: ProfileEditorProps) {
  const [tab, setTab] = useState<TabId>("basic");
  const [interestInput, setInterestInput] = useState("");

  const update = (patch: Partial<SiteProfile>) => {
    onChange({ ...profile, ...patch });
  };

  const updateTimeline = (index: number, patch: Partial<TimelineItem>) => {
    const timeline = profile.timeline.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    update({ timeline });
  };

  const updateSkillCategory = (
    index: number,
    patch: Partial<SkillCategory>,
  ) => {
    const skillCategories = profile.skillCategories.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    update({ skillCategories });
  };

  const updateSkill = (
    catIndex: number,
    skillIndex: number,
    patch: Partial<SkillItem>,
  ) => {
    const skillCategories = profile.skillCategories.map((cat, i) => {
      if (i !== catIndex) return cat;
      return {
        ...cat,
        skills: cat.skills.map((skill, j) =>
          j === skillIndex ? { ...skill, ...patch } : skill,
        ),
      };
    });
    update({ skillCategories });
  };

  const updateSocial = (index: number, patch: Partial<SocialLink>) => {
    const socialLinks = profile.socialLinks.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    update({ socialLinks });
  };

  const updateBento = (index: number, patch: Partial<HeroBentoItem>) => {
    const heroBento = profile.heroBento.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    update({ heroBento });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-all ${
              tab === t.id
                ? "bg-accent/15 text-accent border border-accent/25"
                : "text-text-tertiary hover:text-text-primary hover:bg-bg-surface border border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "basic" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="显示名称"
              value={profile.name}
              onChange={(name) => update({ name })}
            />
            <Field
              label="职位"
              value={profile.role}
              onChange={(role) => update({ role })}
            />
            <Field
              label="标语 (tagline)"
              value={profile.tagline}
              onChange={(tagline) => update({ tagline })}
            />
            <Field
              label="经验标签"
              value={profile.experienceLabel}
              onChange={(experienceLabel) => update({ experienceLabel })}
            />
            <Field
              label="首页标题前缀"
              value={profile.headline}
              onChange={(headline) => update({ headline })}
              placeholder="Hi, 我是"
            />
            <Field
              label="所在地"
              value={profile.location}
              onChange={(location) => update({ location })}
            />
          </div>
          <Field
            label="首页副标题"
            value={profile.heroSubtitle}
            onChange={(heroSubtitle) => update({ heroSubtitle })}
            multiline
          />
        </section>
      )}

      {tab === "about" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-text-primary">
              自我介绍段落
            </h2>
            <button
              type="button"
              onClick={() =>
                update({ bioParagraphs: [...profile.bioParagraphs, ""] })
              }
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <Plus size={12} /> 添加段落
            </button>
          </div>
          {profile.bioParagraphs.map((paragraph, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                value={paragraph}
                onChange={(e) => {
                  const bioParagraphs = [...profile.bioParagraphs];
                  bioParagraphs[index] = e.target.value;
                  update({ bioParagraphs });
                }}
                rows={3}
                className={`${inputClass} flex-1 resize-none`}
              />
              <button
                type="button"
                onClick={() =>
                  update({
                    bioParagraphs: profile.bioParagraphs.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
                className="p-2 h-fit rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </section>
      )}

      {tab === "timeline" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-text-primary">
              工作经历 / 时间线
            </h2>
            <button
              type="button"
              onClick={() =>
                update({
                  timeline: [
                    ...profile.timeline,
                    {
                      year: "",
                      role: "",
                      company: "",
                      description: "",
                      color: "#C9A87C",
                    },
                  ],
                })
              }
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <Plus size={12} /> 添加
            </button>
          </div>
          {profile.timeline.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-border bg-bg-primary/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary">#{index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      update({ timeline: moveItem(profile.timeline, index, -1) })
                    }
                    className="p-1 rounded text-text-tertiary hover:text-text-primary"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update({ timeline: moveItem(profile.timeline, index, 1) })
                    }
                    className="p-1 rounded text-text-tertiary hover:text-text-primary"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        timeline: profile.timeline.filter((_, i) => i !== index),
                      })
                    }
                    className="p-1 rounded text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="时间"
                  value={item.year}
                  onChange={(year) => updateTimeline(index, { year })}
                  placeholder="2024 — 至今"
                />
                <Field
                  label="颜色"
                  value={item.color}
                  onChange={(color) => updateTimeline(index, { color })}
                  placeholder="#C9A87C"
                />
                <Field
                  label="职位"
                  value={item.role}
                  onChange={(role) => updateTimeline(index, { role })}
                />
                <Field
                  label="公司 / 学校"
                  value={item.company}
                  onChange={(company) => updateTimeline(index, { company })}
                />
              </div>
              <Field
                label="描述"
                value={item.description}
                onChange={(description) => updateTimeline(index, { description })}
                multiline
              />
            </div>
          ))}
        </section>
      )}

      {tab === "skills" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-text-primary">
              技能分类
            </h2>
            <button
              type="button"
              onClick={() =>
                update({
                  skillCategories: [
                    ...profile.skillCategories,
                    { category: "", color: "#6B9B97", skills: [] },
                  ],
                })
              }
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <Plus size={12} /> 添加分类
            </button>
          </div>
          {profile.skillCategories.map((cat, catIndex) => (
            <div
              key={catIndex}
              className="p-4 rounded-xl border border-border bg-bg-primary/30 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <Field
                    label="分类名"
                    value={cat.category}
                    onChange={(category) =>
                      updateSkillCategory(catIndex, { category })
                    }
                  />
                  <Field
                    label="颜色"
                    value={cat.color}
                    onChange={(color) => updateSkillCategory(catIndex, { color })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      skillCategories: profile.skillCategories.filter(
                        (_, i) => i !== catIndex,
                      ),
                    })
                  }
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {cat.skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Field
                        label="技能"
                        value={skill.name}
                        onChange={(name) =>
                          updateSkill(catIndex, skillIndex, { name })
                        }
                      />
                    </div>
                    <div className="w-24">
                      <label className={labelClass}>等级</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={skill.level}
                        onChange={(e) =>
                          updateSkill(catIndex, skillIndex, {
                            level: parseInt(e.target.value) || 0,
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSkillCategory(catIndex, {
                          skills: cat.skills.filter((_, i) => i !== skillIndex),
                        })
                      }
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateSkillCategory(catIndex, {
                      skills: [...cat.skills, { name: "", level: 80 }],
                    })
                  }
                  className="text-xs text-accent hover:underline"
                >
                  + 添加技能
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "interests" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <label className={labelClass}>兴趣爱好</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 text-accent text-xs font-heading border border-accent/20"
              >
                {interest}
                <button
                  type="button"
                  onClick={() =>
                    update({
                      interests: profile.interests.filter((x) => x !== interest),
                    })
                  }
                  className="hover:text-accent-bright"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = interestInput.trim();
                  if (v && !profile.interests.includes(v)) {
                    update({ interests: [...profile.interests, v] });
                  }
                  setInterestInput("");
                }
              }}
              placeholder="输入后回车添加"
              className={`${inputClass} flex-1`}
            />
          </div>
        </section>
      )}

      {tab === "social" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-text-primary">
              社交链接
            </h2>
            <button
              type="button"
              onClick={() =>
                update({
                  socialLinks: [
                    ...profile.socialLinks,
                    { label: "", href: "", icon: "github" as SocialIcon },
                  ],
                })
              }
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <Plus size={12} /> 添加
            </button>
          </div>
          {profile.socialLinks.map((link, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-border bg-bg-primary/30 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <Field
                label="标签"
                value={link.label}
                onChange={(label) => updateSocial(index, { label })}
              />
              <div>
                <label className={labelClass}>图标</label>
                <select
                  value={link.icon}
                  onChange={(e) =>
                    updateSocial(index, { icon: e.target.value as SocialIcon })
                  }
                  className={inputClass}
                >
                  {SOCIAL_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="链接"
                value={link.href}
                onChange={(href) => updateSocial(index, { href })}
              />
              <Field
                label="描述（可选）"
                value={link.desc || ""}
                onChange={(desc) => updateSocial(index, { desc })}
              />
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    update({
                      socialLinks: profile.socialLinks.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                  className="text-xs text-red-400 hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "bento" && (
        <section className="rounded-2xl border border-border bg-bg-surface/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-text-primary">
              首页 Bento 卡片
            </h2>
            <button
              type="button"
              onClick={() =>
                update({
                  heroBento: [
                    ...profile.heroBento,
                    {
                      id: `card-${Date.now()}`,
                      title: "",
                      desc: "",
                      icon: "file-text" as BentoIcon,
                      href: "/",
                    },
                  ],
                })
              }
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <Plus size={12} /> 添加
            </button>
          </div>
          {profile.heroBento.map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border bg-bg-primary/30 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="ID"
                  value={item.id}
                  onChange={(id) => updateBento(index, { id })}
                />
                <Field
                  label="标题"
                  value={item.title}
                  onChange={(title) => updateBento(index, { title })}
                />
                <Field
                  label="链接"
                  value={item.href}
                  onChange={(href) => updateBento(index, { href })}
                />
                <Field
                  label="统计文字（可选）"
                  value={item.stat || ""}
                  onChange={(stat) => updateBento(index, { stat })}
                />
                <div>
                  <label className={labelClass}>图标</label>
                  <select
                    value={item.icon}
                    onChange={(e) =>
                      updateBento(index, { icon: e.target.value as BentoIcon })
                    }
                    className={inputClass}
                  >
                    {BENTO_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="栅格 span（可选）"
                  value={item.span || ""}
                  onChange={(span) => updateBento(index, { span })}
                  placeholder="md:col-span-2"
                />
              </div>
              <Field
                label="描述"
                value={item.desc}
                onChange={(desc) => updateBento(index, { desc })}
                multiline
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    update({
                      heroBento: profile.heroBento.filter((_, i) => i !== index),
                    })
                  }
                  className="text-xs text-red-400 hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-text-tertiary">
          上次更新：{new Date(profile.updatedAt).toLocaleString("zh-CN")}
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-heading font-semibold bg-accent/15 text-accent border border-accent/25 hover:bg-accent/25 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          保存全部
        </button>
      </div>
    </div>
  );
}
