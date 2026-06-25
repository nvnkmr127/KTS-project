<?php

namespace App\Listeners;

use App\Jobs\DeliverWebhookJob;
use App\Models\Webhook;
use App\Services\WebhookPayloadBuilder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UniversalWebhookListener
{
    /**
     * Stack to track events currently being processed (prevents infinite recursion)
     */
    protected static array $processingStack = [];

    /**
     * Track processed events in the current request to avoid redundant webhooks
     */
    protected static array $processedEvents = [];

    /**
     * Maximum number of times to process the same event RECURSIVELY
     */
    protected static int $maxRecursionDepth = 1;

    /**
     * Handle any event that implements webhook notification
     * OPTIMIZED VERSION - Build cleaner payloads
     */
    public function handle($event): void
    {
        // Add debug logging at the very start
        Log::channel('webhook-events')->debug('🎯 UniversalWebhookListener::handle() called', [
            'event_class' => get_class($event),
            'event_type' => property_exists($event, 'eventType') ? $event->eventType : 'unknown',
            'webhook_event_name' => property_exists($event, 'webhookEventName') ? $event->webhookEventName : 'unknown',
            'model_class' => property_exists($event, 'model') ? get_class($event->model) : 'no_model',
            'model_id' => property_exists($event, 'model') && $event->model ? $event->model->getKey() : 'no_id',
        ]);

        // Prevent infinite loops by tracking currently processing events (recursion detection)
        $eventHash = $this->generateEventHash($event);

        if (in_array($eventHash, static::$processingStack)) {
            Log::channel('webhook-events')->warning('Webhook infinite loop prevented in UniversalWebhookListener (Recursion detected)', [
                'event_class' => get_class($event),
                'event_hash' => $eventHash,
                'stack_depth' => count(static::$processingStack),
            ]);

            return;
        }

        // Add to stack before processing
        static::$processingStack[] = $eventHash;

        // Track overall processing count for this hash in this request
        static::$processedEvents[$eventHash] = (static::$processedEvents[$eventHash] ?? 0) + 1;

        try {
            $eventName = $this->determineEventName($event);
            Log::channel('webhook-events')->debug('Determined event name', ['event_name' => $eventName]);

            if (! $eventName) {
                Log::channel('webhook-events')->warning('Could not determine event name, skipping');

                return;
            }

            // Skip internal Laravel events that might cause loops
            if ($this->shouldSkipEvent($eventName, $event)) {
                Log::channel('webhook-events')->debug('Skipping event due to shouldSkipEvent', ['event_name' => $eventName]);

                return;
            }

            Log::channel('webhook-events')->debug('Building optimized webhook payload', ['event_name' => $eventName]);

            // Use the optimized payload builder
            $payload = WebhookPayloadBuilder::buildOptimizedPayload($event);

            if ($payload) {
                Log::channel('webhook-events')->debug('Sending webhooks', [
                    'event_name' => $eventName,
                    'payload_size' => strlen(json_encode($payload)).' bytes',
                ]);
                $this->sendWebhooks($eventName, $payload);
            } else {
                Log::channel('webhook-events')->debug('No payload built for event', ['event_name' => $eventName]);
            }

        } catch (\Exception $e) {
            Log::channel('webhook-events')->error('Exception in UniversalWebhookListener::handle()', [
                'error' => $e->getMessage(),
                'event_class' => get_class($event),
                'trace' => $e->getTraceAsString(),
            ]);
        } finally {
            // Remove from stack after processing
            static::$processingStack = array_values(array_diff(static::$processingStack, [$eventHash]));
        }
    }

    /**
     * Generate unique hash for the event
     */
    private function generateEventHash($event)
    {
        // For EloquentWebhookEvent, we want to hash the specific model and event combination
        if (get_class($event) === 'App\Events\EloquentWebhookEvent') {
            return md5(get_class($event).':'.get_class($event->model).':'.$event->model->getKey().':'.$event->eventType);
        }

        // Fallback for other events
        $data = [
            'class' => get_class($event),
            'model_id' => property_exists($event, 'model') && $event->model ? $event->model->getKey() : 'no_id',
        ];

        return md5(json_encode($data));
    }

    /**
     * Check if we should skip this event to prevent loops
     */
    protected function shouldSkipEvent(string $eventName, $event): bool
    {
        // Skip Laravel internal events
        $skipPatterns = [
            'illuminate.',
            'laravel.',
            'eloquent.booted',
            'eloquent.booting',
            'cache.',
            'connection.',
            'queue.',
            'broadcasting.',
        ];

        foreach ($skipPatterns as $pattern) {
            if (Str::startsWith($eventName, $pattern)) {
                return true;
            }
        }

        // Skip webhook-related events to prevent loops
        if (Str::contains($eventName, 'webhook')) {
            return true;
        }

        // Skip events that are already webhook events
        if (get_class($event) === 'App\Events\EloquentWebhookEvent') {
            // Only process if this is not a recursive call
            return isset(static::$processedEvents[$this->generateEventHash($event)]) &&
                static::$processedEvents[$this->generateEventHash($event)] > 1;
        }

        return false;
    }



    /**
     * Determine the event name from any event object
     */
    protected function determineEventName($event): ?string
    {
        $eventClass = get_class($event);

        // Check for explicit event name property
        if (property_exists($event, 'webhookEventName')) {
            return $event->webhookEventName;
        }

        // Check for webhook annotation in class docblock
        try {
            $reflection = new \ReflectionClass($eventClass);
            $docComment = $reflection->getDocComment();
            if ($docComment && preg_match('/@webhook\s+([^\s]+)/', $docComment, $matches)) {
                return $matches[1];
            }
        } catch (\Exception $e) {
            // Continue if reflection fails
        }

        // Convert class name to event name
        $eventName = class_basename($eventClass);
        // Remove 'Event' suffix if it exists
        if (Str::endsWith($eventName, 'Event')) {
            $eventName = substr($eventName, 0, -5);
        }

        return Str::snake($eventName);
    }

    /**
     * Send webhooks to all registered endpoints
     */
    protected function sendWebhooks(string $eventName, array $payload): void
    {
        try {
            // Find webhooks for this specific event
            $specificWebhooks = Webhook::active()->forEvent($eventName)->get();

            // Also find wildcard webhooks (events that listen to all events)
            $wildcardWebhooks = Webhook::active()->forEvent('*')->get();

            $allWebhooks = $specificWebhooks->merge($wildcardWebhooks)->unique('id');

            /** @var Webhook $webhook */
            foreach ($allWebhooks as $webhook) {
                try {
                    DeliverWebhookJob::dispatch($webhook, $payload)->onQueue('webhooks');
                } catch (\Exception $e) {
                    Log::channel('webhook-events')->error('Failed to dispatch webhook delivery job', [
                        'webhook_id' => $webhook->id,
                        'webhook_url' => $webhook->url,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::channel('webhook-events')->error('Failed to send webhooks', [
                'event_name' => $eventName,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
