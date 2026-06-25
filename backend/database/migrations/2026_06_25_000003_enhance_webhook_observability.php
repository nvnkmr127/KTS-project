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
        if (Schema::hasTable('webhook_calls')) {
            Schema::table('webhook_calls', function (Blueprint $table) {
                if (! Schema::hasColumn('webhook_calls', 'event_id')) {
                    $table->string('event_id')->nullable()->after('webhook_id');
                }
                if (! Schema::hasColumn('webhook_calls', 'delivery_id')) {
                    $table->string('delivery_id')->nullable()->after('event_id');
                }
                if (! Schema::hasColumn('webhook_calls', 'retry_attempt')) {
                    $table->unsignedTinyInteger('retry_attempt')->default(0)->after('delivery_id');
                }
                if (! Schema::hasColumn('webhook_calls', 'error_category')) {
                    $table->string('error_category')->nullable()->after('response_body');
                }
                if (! Schema::hasColumn('webhook_calls', 'payload_size_bytes')) {
                    $table->unsignedInteger('payload_size_bytes')->nullable()->after('error_category');
                }
            });
        }

        if (Schema::hasTable('webhooks')) {
            Schema::table('webhooks', function (Blueprint $table) {
                if (! Schema::hasColumn('webhooks', 'deleted_at')) {
                    $table->softDeletes();
                }
                if (! Schema::hasColumn('webhooks', 'created_by')) {
                    $table->foreignId('created_by')
                        ->nullable()
                        ->constrained('users')
                        ->onDelete('set null');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('webhooks')) {
            Schema::table('webhooks', function (Blueprint $table) {
                if (Schema::hasColumn('webhooks', 'created_by')) {
                    $table->dropForeign(['created_by']);
                    $table->dropColumn('created_by');
                }
                if (Schema::hasColumn('webhooks', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }

        if (Schema::hasTable('webhook_calls')) {
            Schema::table('webhook_calls', function (Blueprint $table) {
                // Drop columns in reverse order
                if (Schema::hasColumn('webhook_calls', 'payload_size_bytes')) {
                    $table->dropColumn('payload_size_bytes');
                }
                if (Schema::hasColumn('webhook_calls', 'error_category')) {
                    $table->dropColumn('error_category');
                }
                if (Schema::hasColumn('webhook_calls', 'retry_attempt')) {
                    $table->dropColumn('retry_attempt');
                }
                if (Schema::hasColumn('webhook_calls', 'delivery_id')) {
                    $table->dropColumn('delivery_id');
                }
                if (Schema::hasColumn('webhook_calls', 'event_id')) {
                    $table->dropColumn('event_id');
                }
            });
        }
    }
};
