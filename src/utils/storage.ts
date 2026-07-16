import { config } from '../config';

/**
 * Safely wraps localStorage to prevent direct access, catch JSON parsing errors,
 * and provide a uniform interface for the application.
 * Also globally monkey-patches Storage.prototype to synchronize non-excluded keys
 * with the backend settings database.
 */

const EXCLUDED_KEYS = ['token', 'user', 'kts_alumni_records'];

const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;

// Store settings cache of { [key]: id }
const settingsCache: Record<string, string> = {};

/**
 * Populates the local settings DB ID cache
 */
export function updateSettingsCache(settings: any[]) {
  if (Array.isArray(settings)) {
    settings.forEach(s => {
      if (s.key && s.id) {
        settingsCache[s.key] = String(s.id);
      }
    });
  }
}

/**
 * Background DB synchronization helper for setting key/value pairs
 */
async function syncSettingToDb(key: string, value: string) {
  const token = localStorage.getItem('token');
  if (!token || token === 'demo-token') return;

  try {
    let settingId = settingsCache[key];

    // If ID is not cached, lookup in DB first
    if (!settingId) {
      const getRes = await fetch(`${config.apiUrl}/resources/settings?key=${encodeURIComponent(key)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        if (Array.isArray(data) && data.length > 0) {
          settingId = String(data[0].id);
          settingsCache[key] = settingId;
        }
      }
    }

    if (settingId) {
      const putRes = await fetch(`${config.apiUrl}/resources/settings/${settingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });

      // If the cached ID no longer exists (404), clear stale cache and create fresh
      if (putRes.status === 404) {
        delete settingsCache[key];
        settingId = undefined as unknown as string;
        // fall through to POST below
      } else {
        return; // success or other error — don't create a duplicate
      }
    }

    // No existing record found (or stale 404) — create new
    if (!settingId) {
      const createRes = await fetch(`${config.apiUrl}/resources/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key,
          value,
          group: 'general',
          type: 'json',
          is_public: false,
          is_encrypted: false
        })
      });
      if (createRes.ok) {
        const data = await createRes.json();
        if (data && data.id) {
          settingsCache[key] = String(data.id);
        }
      }
    }
  } catch (err) {
    console.warn(`Failed to sync setting ${key} to DB:`, err);
  }
}

/**
 * Background DB synchronization helper for removing key/value pairs
 */
async function deleteSettingFromDb(key: string) {
  const token = localStorage.getItem('token');
  if (!token || token === 'demo-token') return;

  try {
    let settingId = settingsCache[key];

    if (!settingId) {
      const getRes = await fetch(`${config.apiUrl}/resources/settings?key=${encodeURIComponent(key)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        if (Array.isArray(data) && data.length > 0) {
          settingId = String(data[0].id);
          settingsCache[key] = settingId;
        }
      }
    }

    if (settingId) {
      const delRes = await fetch(`${config.apiUrl}/resources/settings/${settingId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // Always clear local cache regardless of response
      delete settingsCache[key];
      if (delRes.status === 404) {
        // Already gone on server — nothing more to do
        return;
      }
    }
  } catch (err) {
    console.warn(`Failed to delete setting ${key} from DB:`, err);
  }
}


// Monkey-patch Storage.prototype.setItem
Storage.prototype.setItem = function (key: string, value: string): void {
  originalSetItem.call(this, key, value);

  if (EXCLUDED_KEYS.includes(key) || key.startsWith('kts_force_logout_')) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token || token === 'demo-token') {
    return;
  }

  syncSettingToDb(key, value);
};

// Monkey-patch Storage.prototype.removeItem
Storage.prototype.removeItem = function (key: string): void {
  originalRemoveItem.call(this, key);

  if (EXCLUDED_KEYS.includes(key) || key.startsWith('kts_force_logout_')) {
    return;
  }

  const token = localStorage.getItem('token');
  if (!token || token === 'demo-token') {
    return;
  }

  deleteSettingFromDb(key);
};

// Expose original methods to bypass sync
Object.defineProperty(Storage.prototype, 'originalSetItem', {
  value: originalSetItem,
  writable: false,
  configurable: false,
  enumerable: false
});

Object.defineProperty(Storage.prototype, 'originalRemoveItem', {
  value: originalRemoveItem,
  writable: false,
  configurable: false,
  enumerable: false
});

export const storage = {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item) as T;
      } catch {
        // If it's not valid JSON, return as string (e.g. for simple tokens)
        return item as any as T;
      }
    } catch (e) {
      console.warn(`Failed to read ${key} from storage:`, e);
      return null;
    }
  },

  setItem(key: string, value: any): void {
    try {
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, valueToStore);
    } catch (e) {
      console.warn(`Failed to write ${key} to storage:`, e);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key} from storage:`, e);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn(`Failed to clear storage:`, e);
    }
  },
};
