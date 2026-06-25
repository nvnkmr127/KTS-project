<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Models\WebhookCall;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PruneWebhookCalls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webhook:prune-calls';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete webhook call logs older than the configured retention period';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Starting Webhook Call Logs Pruning...');

        $retentionDays = Setting::where('key', 'webhook_calls_retention_days')->value('value') ?? 90;
        $this->info("📅 Retention period: {$retentionDays} days");

        $cutoff = now()->subDays($retentionDays);
        $this->info("📅 Cutoff date: {$cutoff->toDateTimeString()}");

        $deletedCount = 0;

        try {
            // Delete records chunked by ID to avoid memory/lock issues
            WebhookCall::where('created_at', '<', $cutoff)->chunkById(500, function ($chunk) use (&$deletedCount) {
                foreach ($chunk as $call) {
                    $call->delete();
                    $deletedCount++;
                }
            });

            $message = "Successfully pruned {$deletedCount} webhook call log(s) older than {$retentionDays} days.";
            $this->info("✅ {$message}");
            Log::info($message);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $errorMessage = "Failed to prune webhook call logs: " . $e->getMessage();
            $this->error("❌ {$errorMessage}");
            Log::error($errorMessage);

            return self::FAILURE;
        }
    }
}
