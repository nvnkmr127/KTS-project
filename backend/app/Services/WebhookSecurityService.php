<?php

namespace App\Services;

use App\Models\Webhook;
use Illuminate\Support\Str;

class WebhookSecurityService
{
    /**
     * Generate standard signature.
     */
    public static function generateSignature(string $secret, string $payload, int $timestamp): string
    {
        return hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    }

    /**
     * Generate legacy signature.
     */
    public static function generateLegacySignature(string $secret, string $payload): string
    {
        return hash_hmac('sha256', $payload, $secret);
    }

    /**
     * Build signed headers for a webhook delivery attempt.
     */
    public static function buildSignedHeaders(Webhook $webhook, array $payload): array
    {
        $timestamp = time();
        $jsonPayload = json_encode($payload);
        $secret = $webhook->signing_secret ?? '';

        $headers = [
            'X-Webhook-Signature' => 'sha256=' . self::generateSignature($secret, $jsonPayload, $timestamp),
            'X-App-Signature' => self::generateLegacySignature($secret, $jsonPayload),
            'X-Webhook-Timestamp' => (string) $timestamp,
            'X-Webhook-Delivery' => (string) Str::uuid(),
            'X-Event-Type' => $payload['event'] ?? '',
            'X-Event-ID' => $payload['event_id'] ?? '',
            'X-Webhook-Source' => config('app.name', 'Laravel'),
            'User-Agent' => config('app.name', 'Laravel') . ' Webhook/2.0',
            'Content-Type' => 'application/json',
        ];

        // Merge custom headers (custom headers last)
        if ($webhook->headers) {
            $headers = array_merge($headers, (array) $webhook->headers);
        }

        return $headers;
    }

    /**
     * Verify a signature against the payload and timestamp.
     */
    public static function verifySignature(string $secret, string $payload, string $signature, int $timestamp, int $toleranceSeconds = 300): bool
    {
        $expected = self::generateSignature($secret, $payload, $timestamp);

        // Strip 'sha256=' prefix if present
        if (str_starts_with($signature, 'sha256=')) {
            $signature = substr($signature, 7);
        }

        return hash_equals($expected, $signature) && abs(time() - $timestamp) <= $toleranceSeconds;
    }
}
