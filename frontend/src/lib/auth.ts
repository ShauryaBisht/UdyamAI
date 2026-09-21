// Helpers around the browser storage keys the UdyamAI frontend uses to
// remember the signed-in user and their linked profile.

export const STORAGE_KEYS = {
  user: 'udyam_user', // phone (10 digits, without +91)
  profileId: 'udyam_profile_id',
  profile: 'udyam_profile',
  analysisInputs: 'udyam_analysis_inputs',
  activeAnalysisId: 'udyam_active_analysis_id',
} as const;

export function hasWindowStorage(): boolean {
  return typeof window !== 'undefined';
}

/** Persist the Supabase user's phone in the legacy storage key. */
export function storeUserPhone(phone?: string | null) {
  if (!hasWindowStorage()) return;
  if (!phone) {
    window.sessionStorage.removeItem(STORAGE_KEYS.user);
    return;
  }
  // Supabase stores E.164 (e.g. +919876543210); the UI expects 10 digits.
  const digits = phone.replace(/\D/g, '').slice(-10);
  window.sessionStorage.setItem(STORAGE_KEYS.user, digits);
}

export function storeProfile(profile: { id: string; name?: string | null } | null) {
  if (!hasWindowStorage()) return;
  if (!profile) {
    window.localStorage.removeItem(STORAGE_KEYS.profileId);
    window.localStorage.removeItem(STORAGE_KEYS.profile);
    window.sessionStorage.removeItem(STORAGE_KEYS.profileId);
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.profileId, String(profile.id));
  window.sessionStorage.setItem(STORAGE_KEYS.profileId, String(profile.id));
  window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function readProfileId(): string | null {
  if (!hasWindowStorage()) return null;
  return (
    window.localStorage.getItem(STORAGE_KEYS.profileId) ||
    window.sessionStorage.getItem(STORAGE_KEYS.profileId)
  );
}

/** Clear every auth/demo storage key and purge SW cache (used on sign out). */
export function clearAuthStorage() {
  if (!hasWindowStorage()) return;

  // 1. Remove explicit auth keys
  const values = Object.values(STORAGE_KEYS);
  values.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });

  // 2. Remove any cached business analysis or user reports from localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('udyam_cached_') || k.startsWith('udyam_draft_') || k.startsWith('udyam_latest_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error clearing cached user storage:', e);
  }

  // 3. Direct window-side cache deletion
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('runtime') || name.includes('public-api')) {
            caches.delete(name);
          }
        });
      });
    } catch (e) {
      console.warn('Error purging window caches:', e);
    }
  }

  // 4. Notify Service Worker to purge runtime cache for shared device privacy (§7.1)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_USER_CACHE' });
      }
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: 'CLEAR_USER_CACHE' });
      });
    } catch (e) {
      console.warn('Could not notify service worker on logout:', e);
    }
  }
}


