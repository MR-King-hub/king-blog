"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserRound, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProfileEditor from "@/components/admin/ProfileEditor";
import { useAuth } from "@/lib/auth";
import { profileApi } from "@/lib/api";
import type { SiteProfile, UpdateSiteProfileInput } from "@relayagent/shared";

function toUpdateInput(profile: SiteProfile): UpdateSiteProfileInput {
  const {
    name,
    tagline,
    headline,
    heroSubtitle,
    location,
    role,
    experienceLabel,
    bioParagraphs,
    timeline,
    skillCategories,
    interests,
    socialLinks,
    heroBento,
  } = profile;

  return {
    name,
    tagline,
    headline,
    heroSubtitle,
    location,
    role,
    experienceLabel,
    bioParagraphs,
    timeline,
    skillCategories,
    interests,
    socialLinks,
    heroBento,
  };
}

export default function ProfileAdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<SiteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileApi.get();
      setProfile(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载个人资料失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAdmin) {
      setLoading(false);
      router.push("/login");
      return;
    }

    loadProfile();
  }, [isAdmin, authLoading, router, loadProfile]);

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await profileApi.update(toUpdateInput(profile));
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 flex items-center justify-center">
          <Loader2 className="animate-spin text-accent" size={32} />
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 flex items-center justify-center">
          <div className="text-center text-text-secondary">
            <p className="text-lg">个人资料加载失败</p>
            <p className="text-sm mt-2">
              请先运行 <code className="text-accent">pnpm db:seed</code>
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-bold text-text-primary flex items-center gap-2">
                  <UserRound size={24} className="text-accent" />
                  个人资料
                </h1>
                <p className="text-sm text-text-tertiary mt-1">
                  管理首页 Hero、关于页、简历与社交链接
                </p>
              </div>
            </div>
            <button
              onClick={loadProfile}
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-surface transition-all"
              title="重新加载"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              个人资料已保存，首页和关于页将显示最新内容
            </div>
          )}

          <ProfileEditor
            profile={profile}
            onChange={setProfile}
            onSave={handleSave}
            saving={saving}
          />
        </div>
      </main>
    </>
  );
}
