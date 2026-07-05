import { profileStore } from "../store/profile-store.js";
import { AppError } from "../middleware/error-handler.js";
import { parseUpdateSiteProfileInput } from "./profile.validation.js";
import type { SiteProfile, UpdateSiteProfileInput } from "@blog/shared";

class ProfileService {
  async get(): Promise<SiteProfile> {
    return profileStore.ensureDefault();
  }

  async update(input: UpdateSiteProfileInput): Promise<SiteProfile> {
    let validated: UpdateSiteProfileInput;
    try {
      validated = parseUpdateSiteProfileInput(input);
    } catch (error) {
      throw new AppError(400, "VALIDATION_ERROR", "个人资料格式不正确");
    }
    return profileStore.update(validated);
  }
}

export const profileService = new ProfileService();
