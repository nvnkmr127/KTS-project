<?php

namespace App\Jobs;

use App\Models\Webhook;
use App\Models\WebhookCall;
use App\Services\WebhookSecurityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class DeliverWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 120, 300];
    public $queue = 'webhooks';

    public $webhook;
    public $payload;
    public $attempt;

    /**
     * Create a new job instance.
     */
    public function __construct(Webhook $webhook, array $payload, int $attempt = 0)
    {
        $this->webhook = $webhook;
        $this->payload = $payload;
        $this->attempt = $attempt;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $webhook = $this->webhook;
        $payload = $this->payload;

        // Generate headers via security service
        $headers = WebhookSecurityService::buildSignedHeaders($webhook, $payload);
        $deliveryId = $headers['X-Webhook-Delivery'] ?? (string) Str::uuid();

        $startTime = microtime(true);
        $success = false;
        $statusCode = 0;
        $responseBody = '';
        $errorCategory = 'success';

        try {
            $response = Http::timeout($webhook->timeout_seconds)
                ->withHeaders($headers)
                ->post($webhook->url, $payload);

            $statusCode = $response->status();
            $responseBody = $response->body();
            $success = $response->successful();

            if ($success) {
                $errorCategory = 'success';
            } elseif ($response->clientError()) {
                $errorCategory = 'http_4xx';
            } elseif ($response->serverError()) {
                $errorCategory = 'http_5xx';
            } else {
                $errorCategory = 'network_error';
            }
        } catch (\Exception $e) {
            $success = false;
            $statusCode = 0;
            $responseBody = $e->getMessage();

            if (stripos($e->getMessage(), 'timed out') !== false || stripos($e->getMessage(), 'timeout') !== false) {
                $errorCategory = 'timeout';
            } else {
                $errorCategory = 'network_error';
            }
        }

        $executionTimeMs = round((microtime(true) - $startTime) * 1000);

        // Create WebhookCall record
        $webhook->calls()->create([
            'event_id' => $payload['event_id'] ?? null,
            'delivery_id' => $deliveryId,
            'retry_attempt' => $this->attempt,
            'error_category' => $errorCategory,
            'payload_size_bytes' => strlen(json_encode($payload)),
            'execution_time_ms' => $executionTimeMs,
            'success' => $success,
            'status_code' => $statusCode,
            'payload' => $payload,
            'response_body' => $responseBody,
        ]);

        // Mark webhook success or failure and log
        if ($success) {
            $webhook->markAsSuccessful();

            Log::channel('webhook-events')->info('Webhook delivered successfully', [
                'webhook_id' => $webhook->id,
                'delivery_id' => $deliveryId,
                'event' => $payload['event'] ?? null,
                'status_code' => $statusCode,
                'execution_time' => $executionTimeMs . 'ms',
            ]);
        } else {
            $webhook->markAsFailed();

            Log::channel('webhook-events')->warning('Webhook delivery failed', [
                'webhook_id' => $webhook->id,
                'delivery_id' => $deliveryId,
                'event' => $payload['event'] ?? null,
                'status_code' => $statusCode,
                'error_category' => $errorCategory,
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $e): void
    {
        $this->webhook->markAsFailed();

        Log::channel('webhook-events')->error('Webhook job failed permanently', [
            'webhook_id' => $this->webhook->id,
            'event' => $this->payload['event'] ?? null,
            'error' => $e->getMessage(),
        ]);
    }
}
