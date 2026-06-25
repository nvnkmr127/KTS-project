<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('webhooks')) {
            Schema::table('webhooks', function (Blueprint $table) {
                if (! Schema::hasIndex('webhooks', 'webhooks_url_event_name_unique')) {
                    $table->unique(['url', 'event_name'], 'webhooks_url_event_name_unique');
                }
                if (! Schema::hasIndex('webhooks', 'webhooks_is_active_index')) {
                    $table->index('is_active', 'webhooks_is_active_index');
                }
                if (! Schema::hasIndex('webhooks', 'webhooks_consecutive_failures_index')) {
                    $table->index('consecutive_failures', 'webhooks_consecutive_failures_index');
                }
            });
        }

        if (Schema::hasTable('webhook_calls')) {
            Schema::table('webhook_calls', function (Blueprint $table) {
                if (! Schema::hasIndex('webhook_calls', 'webhook_calls_webhook_id_created_at_index')) {
                    $table->index(['webhook_id', 'created_at'], 'webhook_calls_webhook_id_created_at_index');
                }
                if (! Schema::hasIndex('webhook_calls', 'webhook_calls_success_index')) {
                    $table->index('success', 'webhook_calls_success_index');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->dropIndexIfExists('webhook_calls', 'webhook_calls_success_index', 'index');
        $this->dropIndexIfExists('webhook_calls', 'webhook_calls_webhook_id_created_at_index', 'index');
        $this->dropIndexIfExists('webhooks', 'webhooks_consecutive_failures_index', 'index');
        $this->dropIndexIfExists('webhooks', 'webhooks_is_active_index', 'index');
        $this->dropIndexIfExists('webhooks', 'webhooks_url_event_name_unique', 'unique');
    }

    /**
     * Safely drop an index if it exists.
     */
    private function dropIndexIfExists(string $table, string $index, string $type = 'index'): void
    {
        try {
            if (Schema::hasTable($table) && Schema::hasIndex($table, $index)) {
                Schema::table($table, function (Blueprint $t) use ($index, $type) {
                    if ($type === 'unique') {
                        $t->dropUnique($index);
                    } else {
                        $t->dropIndex($index);
                    }
                });
            }
        } catch (\Exception $e) {
            // Ignore
        }
    }
};
