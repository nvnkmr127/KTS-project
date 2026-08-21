/**
 * millitrack.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend service layer for bus GPS tracking.
 *
 * Architecture
 * ────────────
 * The Millitrack API does not send CORS headers, so the browser cannot call
 * it directly. Instead, this module calls your Laravel backend proxy:
 *
 *   GET /api/v1/bus/positions          → all 5 buses (concurrent server-side)
 *   GET /api/v1/bus/positions/:bus     → single bus
 *   GET /api/v1/bus/fleet              → fleet manifest (no external call)
 *
 * The Laravel controller (MillitrackProxyController) holds the credentials
 * and calls Millitrack server-side using Illuminate\Support\Facades\Http.
 *
 * Credentials are stored in the Laravel .env — never in this file or the
 * Vite .env (which would expose them in the browser bundle).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveBusData {
  /** Bus plate / registration number, e.g. "TS07UP2292" */
  busNumber: string;
  /** Millitrack internal device ID */
  deviceId: number;
  /** GPS latitude */
  lat: number;
  /** GPS longitude */
  lng: number;
  /** Speed in km/h */
  speed: number;
  /** true = ignition / engine on */
  ignition: boolean;
  /** ISO-8601 timestamp of the last GPS fix */
  lastSeen: string;
  /** Set when this specific device failed to respond */
  error?: string | null;
  /** Optional street address/location from GPS payload */
  address?: string | null;
  /** Optional status (RUNNING, STOPPED, IDLE) */
  status?: string | null;
}

export type MillitrackStatus =
  | 'live'          // ≥1 device responded successfully
  | 'offline'       // backend reached but got an error (auth, 5xx, etc.)
  | 'unauthorized'  // 401 from Laravel — user session expired
  | 'unconfigured'; // BUS_DEVICE_MAP is empty on the backend (shouldn't happen in prod)

// ── Visible bus list (mirrors BUS_DEVICE_MAP in MillitrackProxyController) ───
// Used by BusTracking.tsx ROUTE_CONFIG to assert which bus numbers are valid.
// Update this if you add/remove buses on the backend.
export const BUS_DEVICE_MAP: Record<string, number> = {
  'TS07UP2292': 204221,
  'TS07UM4821': 204197,
  'TG07T2823':  204238,
  'TG07T2824':  204227,
  'TG07V7473':  204214,
};

// Whether the system is configured (always true when BUS_DEVICE_MAP is populated)
import { config } from '../config';

export const millitrackConfigured = Object.keys(BUS_DEVICE_MAP).length > 0;

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Base URL for your Laravel API (same as the rest of the app's API calls) */
const API_BASE = config.apiUrl;

/**
 * Build fetch options that attach the Sanctum Bearer token stored by
 * AuthContext after login, so the proxy route (auth:sanctum) accepts the call.
 */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch live GPS positions for ALL buses from the Laravel proxy.
 *
 * Returns a tuple: [positions, status]
 *   • positions — one LiveBusData per bus; `.error` is set for failed devices
 *   • status    — overall quality of the response
 */
export async function getAllBusPositions(): Promise<[LiveBusData[], MillitrackStatus]> {
  const url = `${API_BASE}/bus/positions`;
  try {
    const res = await fetch(url, {
      headers: authHeaders(),
    });

    if (res.status === 401) {
      console.warn('[Millitrack] 401 Unauthorized — token may be expired', url);
      return [[], 'unauthorized'];
    }

    if (!res.ok) {
      console.warn(`[Millitrack] HTTP ${res.status} from proxy`, url);
      return [[], 'offline'];
    }

    const json = await res.json();

    if (!json.success || !Array.isArray(json.data)) {
      console.warn('[Millitrack] Unexpected response shape', json);
      return [[], 'offline'];
    }

    const positions: LiveBusData[] = json.data;
    const anySuccess = positions.some((p) => !p.error);

    if (!anySuccess) {
      console.warn('[Millitrack] All devices returned errors', positions);
    } else {
      console.info(`[Millitrack] Live — ${positions.filter(p => !p.error).length}/${positions.length} buses OK`);
    }

    return [positions, anySuccess ? 'live' : 'offline'];

  } catch (err) {
    // Network error (e.g. Laravel server is down or CORS blocked)
    console.error('[Millitrack] Network error fetching positions', url, err);
    return [[], 'offline'];
  }
}


/**
 * Fetch the live position for a single bus plate number.
 * Throws on network error; returns null on 404 (bus not in fleet).
 */
export async function getBusPosition(busNumber: string): Promise<LiveBusData | null> {
  const res = await fetch(`${API_BASE}/bus/positions/${encodeURIComponent(busNumber)}`, {
    headers: authHeaders(),
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  return json.success ? (json.data as LiveBusData) : null;
}

/**
 * Format a last-seen ISO timestamp into a human-friendly relative string.
 * e.g.  "just now"  |  "2 min ago"  |  "5h ago"
 */
export function formatLastSeen(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 30) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
