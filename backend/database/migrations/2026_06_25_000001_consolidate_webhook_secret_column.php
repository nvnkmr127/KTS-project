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
            $hasSigningSecret = Schema::hasColumn('webhooks', 'signing_secret');
            $hasSecretKey = Schema::hasColumn('webhooks', 'secret_key');

            if (!$hasSigningSecret && $hasSecretKey) {
                Schema::table('webhooks', function (Blueprint $table) {
                    $table->renameColumn('secret_key', 'signing_secret');
                });
            } elseif ($hasSigningSecret && $hasSecretKey) {
                Schema::table('webhooks', function (Blueprint $table) {
                    $table->dropColumn('secret_key');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('webhooks')) {
            $hasSigningSecret = Schema::hasColumn('webhooks', 'signing_secret');
            $hasSecretKey = Schema::hasColumn('webhooks', 'secret_key');

            if ($hasSigningSecret && !$hasSecretKey) {
                Schema::table('webhooks', function (Blueprint $table) {
                    $table->renameColumn('signing_secret', 'secret_key');
                });
            }
        }
    }
};
