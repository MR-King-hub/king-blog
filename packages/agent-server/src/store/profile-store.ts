import { prisma } from "../lib/prisma.js";
import type { SiteProfile, UpdateSiteProfileInput } from "@blog/shared";
import {
  getDefaultProfileSeedData,
  rowToSiteProfile,
  inputToUpdateData,
} from "../data/default-profile.js";

class ProfileStore {
  async get(): Promise<SiteProfile | null> {
    const row = await prisma.siteProfile.findUnique({
      where: { id: "default" },
    });
    if (!row) return null;
    return rowToSiteProfile(row);
  }

  async ensureDefault(): Promise<SiteProfile> {
    const existing = await this.get();
    if (existing) return existing;

    const row = await prisma.siteProfile.create({
      data: getDefaultProfileSeedData(),
    });
    return rowToSiteProfile(row);
  }

  async update(input: UpdateSiteProfileInput): Promise<SiteProfile> {
    const row = await prisma.siteProfile.upsert({
      where: { id: "default" },
      create: {
        ...getDefaultProfileSeedData(),
        ...inputToUpdateData(input),
      },
      update: inputToUpdateData(input),
    });
    return rowToSiteProfile(row);
  }
}

export const profileStore = new ProfileStore();
