import { registerRootComponent } from 'expo';

// ─── CRITICAL DEV-MODE PATCH ──────────────────────────────────────────────────
// react-native-css-interop's printUpgradeWarning() calls JSON.stringify with a
// custom replacer that calls Object.entries() on every nested value. When it
// encounters React Navigation's NavigationStateContext default value, it hits
// getter properties (getKey, setKey, etc.) that intentionally throw
// "Couldn't find a navigation context." The throw propagates out of
// JSON.stringify's replacer → crashes the entire render.
//
// Fix: wrap JSON.stringify so that if the replacer throws, we retry without it.
// This only affects the error path (replacer throw) and has zero effect on
// normal usage. Production builds are unaffected (__DEV__ guard).
if (__DEV__) {
  const _origStringify = JSON.stringify;
  (JSON as any).stringify = function patchedStringify(
    value: any,
    replacer?: any,
    space?: any,
  ): string {
    // If no custom replacer, delegate straight to native
    if (typeof replacer !== 'function') {
      return _origStringify(value, replacer as any, space);
    }
    // Custom replacer: wrap it so getter throws don't escape
    const safeReplacer = (key: string, val: any): any => {
      try {
        return replacer(key, val);
      } catch {
        // A getter threw (e.g. NavigationStateContext) — skip this value
        return undefined;
      }
    };
    try {
      return _origStringify(value, safeReplacer, space);
    } catch {
      // Last resort: stringify without replacer
      try {
        return _origStringify(value, undefined, space);
      } catch {
        return '"[unserializable]"';
      }
    }
  };
}
// ─────────────────────────────────────────────────────────────────────────────

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
