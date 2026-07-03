/**
 * Safely wraps localStorage to prevent direct access, catch JSON parsing errors,
 * and provide a uniform interface for the application.
 */

export const storage = {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item) as T;
      } catch {
        // If it's not valid JSON, return as string (e.g. for simple tokens)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return item as any as T;
      }
    } catch (e) {
      console.warn(`Failed to read ${key} from storage:`, e);
      return null;
    }
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
