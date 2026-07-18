const SETTINGS_KEY = "hakim.profile.settings.v1";
const CHANGE_EVENT = "hakim:profile-settings-change";

export type VideoQualitySetting = "auto" | "data-saver" | "high";

export type ProfileAppSettings = {
  appSounds: boolean;
  haptics: boolean;
  wifiOnlyVideo: boolean;
  videoQuality: VideoQualitySetting;
  biometricsEnabled: boolean;
};

export type ProfileNotificationPrefs = {
  workoutReminders: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  progressUpdates: boolean;
  challenges: boolean;
  newContent: boolean;
  marketing: boolean;
};

export type ProfileSettingsSnapshot = {
  app: ProfileAppSettings;
  notifications: ProfileNotificationPrefs;
};

const DEFAULT_APP: ProfileAppSettings = {
  appSounds: true,
  haptics: true,
  wifiOnlyVideo: false,
  videoQuality: "auto",
  biometricsEnabled: false,
};

const DEFAULT_NOTIFICATIONS: ProfileNotificationPrefs = {
  workoutReminders: true,
  mealReminders: true,
  waterReminders: true,
  progressUpdates: true,
  challenges: true,
  newContent: false,
  marketing: false,
};

function readSnapshot(): ProfileSettingsSnapshot {
  if (typeof window === "undefined") {
    return { app: DEFAULT_APP, notifications: DEFAULT_NOTIFICATIONS };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { app: DEFAULT_APP, notifications: DEFAULT_NOTIFICATIONS };
    const parsed = JSON.parse(raw) as Partial<ProfileSettingsSnapshot>;
    return {
      app: { ...DEFAULT_APP, ...parsed.app },
      notifications: { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications },
    };
  } catch {
    return { app: DEFAULT_APP, notifications: DEFAULT_NOTIFICATIONS };
  }
}

function writeSnapshot(snapshot: ProfileSettingsSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getProfileSettings(): ProfileSettingsSnapshot {
  return readSnapshot();
}

export function updateProfileAppSettings(patch: Partial<ProfileAppSettings>) {
  const current = readSnapshot();
  writeSnapshot({ ...current, app: { ...current.app, ...patch } });
}

export function updateProfileNotificationPrefs(patch: Partial<ProfileNotificationPrefs>) {
  const current = readSnapshot();
  writeSnapshot({ ...current, notifications: { ...current.notifications, ...patch } });
}

export function subscribeProfileSettings(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export const PROFILE_SETTINGS_CHANGE_EVENT = CHANGE_EVENT;
