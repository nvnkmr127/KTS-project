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
        // Alter scan_datetime column to prevent auto CURRENT_TIMESTAMP and ON UPDATE CURRENT_TIMESTAMP behavior in MySQL
        Schema::table('biometric_logs', function (Blueprint $table) {
            $table->timestamp('scan_datetime')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('biometric_logs', function (Blueprint $table) {
            $table->timestamp('scan_datetime')->useCurrent()->useCurrentOnUpdate()->change();
        });
    }
};
