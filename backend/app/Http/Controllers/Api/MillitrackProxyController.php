<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * MillitrackProxyController
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side proxy for the Millitrack GPS REST API.
 *
 * WHY A PROXY?
 *   The Millitrack API does not send CORS headers, so browser fetch() calls
 *   are blocked. This controller relays the requests from the Laravel server
 *   (no CORS restriction) and returns the data to the authenticated frontend.
 *
 * CREDENTIALS
 *   Stored in the Laravel .env file (never exposed to the browser):
 *     MILLITRACK_BASE_URL
 *     MILLITRACK_USERNAME
 *     MILLITRACK_PASSWORD
 *
 * BUS → DEVICE ID MAPPING
 *   Maintained here so the frontend only ever deals with human-readable bus
 *   plate numbers. The numeric deviceId is resolved server-side.
 */
class MillitrackProxyController extends Controller
{
    /**
     * Map of bus plate numbers → Millitrack internal device IDs.
     * Add or remove entries here as your fleet changes.
     */
    private const BUS_DEVICE_MAP = [
        'TS07UP2292' => 204221,
        'TS07UM4821' => 204197,
        'TG07T2823'  => 204238,
        'TG07T2824'  => 204227,
        'TG07V7473'  => 204214,
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Build a pre-configured Http client with Basic Auth and a reasonable
     * timeout so a slow Millitrack server doesn't hang the request.
     */
    private function millitrackClient(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withBasicAuth(
                (string) config('services.millitrack.username', ''),
                (string) config('services.millitrack.password', '')
            )
            ->timeout(10)          // 10 s connect+read timeout
            ->acceptJson();
    }

    /**
     * Normalise a raw Millitrack position payload into our standard shape.
     * We try several field-name variants that differ across firmware versions.
     */
    private function normalisePosition(array $raw, string $busNumber, int $deviceId): array
    {
        $attributes = $raw['attributes'] ?? [];

        $ignitionRaw = $raw['ignition'] 
            ?? $raw['ignitionStatus'] 
            ?? $attributes['ignition'] 
            ?? $attributes['ignitionStatus'] 
            ?? null;

        $ignition = $ignitionRaw === true
            || $ignitionRaw === 1
            || strtolower((string) $ignitionRaw) === 'on'
            || strtolower((string) $ignitionRaw) === 'true';

        return [
            'busNumber' => $busNumber,
            'deviceId'  => $deviceId,
            'lat'       => (float) ($raw['latitude']  ?? $raw['lat']       ?? $raw['Latitude']  ?? 0),
            'lng'       => (float) ($raw['longitude'] ?? $raw['lng']       ?? $raw['Longitude'] ?? 0),
            'speed'     => (float) ($raw['speed']     ?? $raw['Speed']     ?? $raw['currentSpeed'] ?? 0),
            'ignition'  => $ignition,
            'lastSeen'  => $raw['deviceTime'] ?? $raw['device_time']
                         ?? $raw['serverTime'] ?? $raw['server_time']
                         ?? now()->toISOString(),
            'address'   => $raw['address'] ?? $attributes['address'] ?? null,
            'status'    => $raw['status'] ?? $attributes['currentStatus'] ?? $attributes['status'] ?? null,
        ];
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

    /**
     * GET /api/v1/bus/positions
     *
     * Returns the last-known position for every bus in BUS_DEVICE_MAP.
     * Each bus is fetched concurrently (Http pool) so 5 buses take roughly
     * as long as a single request rather than 5× the latency.
     *
     * Response shape:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "busNumber": "TS07UP2292",
     *       "deviceId":  204221,
     *       "lat":       18.671234,
     *       "lng":       78.094567,
     *       "speed":     42.5,
     *       "ignition":  true,
     *       "lastSeen":  "2026-06-19T07:30:00Z",
     *       "error":     null        // set to an error string if this device failed
     *     },
     *     ...
     *   ],
     *   "fetchedAt": "2026-06-19T07:30:01Z"
     * }
     */
    public function getAllPositions(): JsonResponse
    {
        $baseUrl = config('services.millitrack.base_url');
        $results = [];

        // Http::pool() fires all requests concurrently
        $responses = Http::pool(function (\Illuminate\Http\Client\Pool $pool) use ($baseUrl) {
            foreach (self::BUS_DEVICE_MAP as $busNumber => $deviceId) {
                $pool->as($busNumber)
                    ->withBasicAuth(
                        (string) config('services.millitrack.username', ''),
                        (string) config('services.millitrack.password', '')
                    )
                    ->timeout(10)
                    ->acceptJson()
                    ->get("{$baseUrl}/devices/{$deviceId}/deviceLastPosition");
            }
        });

        foreach (self::BUS_DEVICE_MAP as $busNumber => $deviceId) {
            /** @var \Illuminate\Http\Client\Response|\Throwable $response */
            $response = $responses[$busNumber];

            if ($response instanceof \Throwable) {
                // Network / timeout error
                Log::warning("Millitrack: failed to fetch {$busNumber} (deviceId {$deviceId})", [
                    'error' => $response->getMessage(),
                ]);
                $results[] = [
                    'busNumber' => $busNumber,
                    'deviceId'  => $deviceId,
                    'lat'       => 0,
                    'lng'       => 0,
                    'speed'     => 0,
                    'ignition'  => false,
                    'lastSeen'  => null,
                    'error'     => $response->getMessage(),
                ];
                continue;
            }

            if (! $response->successful()) {
                Log::warning("Millitrack: HTTP {$response->status()} for {$busNumber} (deviceId {$deviceId})");
                $results[] = [
                    'busNumber' => $busNumber,
                    'deviceId'  => $deviceId,
                    'lat'       => 0,
                    'lng'       => 0,
                    'speed'     => 0,
                    'ignition'  => false,
                    'lastSeen'  => null,
                    'error'     => "HTTP {$response->status()}",
                ];
                continue;
            }

            $results[] = $this->normalisePosition($response->json(), $busNumber, $deviceId);
        }

        return response()->json([
            'success'   => true,
            'data'      => $results,
            'fetchedAt' => now()->toISOString(),
        ]);
    }

    /**
     * GET /api/v1/bus/positions/{busNumber}
     *
     * Returns the last-known position for a single bus identified by its
     * plate number (e.g. TS07UP2292). Useful for per-bus detail views.
     */
    public function getPosition(string $busNumber): JsonResponse
    {
        $busNumber = strtoupper(trim($busNumber));

        if (! array_key_exists($busNumber, self::BUS_DEVICE_MAP)) {
            return response()->json([
                'success' => false,
                'message' => "Bus '{$busNumber}' not found in fleet configuration.",
            ], 404);
        }

        $deviceId = self::BUS_DEVICE_MAP[$busNumber];
        $baseUrl  = config('services.millitrack.base_url');

        try {
            $response = $this->millitrackClient()
                ->get("{$baseUrl}/devices/{$deviceId}/deviceLastPosition");

            if (! $response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => "Millitrack returned HTTP {$response->status()} for device {$deviceId}.",
                ], 502);
            }

            return response()->json([
                'success' => true,
                'data'    => $this->normalisePosition($response->json(), $busNumber, $deviceId),
            ]);

        } catch (\Throwable $e) {
            Log::error("Millitrack proxy error for {$busNumber}", ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Could not reach Millitrack server.',
                'detail'  => $e->getMessage(),
            ], 502);
        }
    }

    /**
     * GET /api/v1/bus/fleet
     *
     * Returns the list of bus plate numbers the system knows about,
     * without making any external requests. Useful for the frontend to
     * validate which buses exist before polling positions.
     */
    public function getFleet(): JsonResponse
    {
        $fleet = array_map(
            fn ($busNumber, $deviceId) => ['busNumber' => $busNumber, 'deviceId' => $deviceId],
            array_keys(self::BUS_DEVICE_MAP),
            array_values(self::BUS_DEVICE_MAP)
        );

        return response()->json([
            'success' => true,
            'data'    => $fleet,
            'count'   => count($fleet),
        ]);
    }
}
