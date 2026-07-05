import type { SiteProfile } from "@blog/shared";

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.BUILD_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function fetchSiteProfile(): Promise<SiteProfile> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load profile (${res.status})`);
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error?.message || "Failed to load profile");
  }

  return body.data as SiteProfile;
}
