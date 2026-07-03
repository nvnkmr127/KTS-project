<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change the column type from TIMESTAMP to DATETIME
        // This drops the MySQL/MariaDB automatic ON UPDATE CURRENT_TIMESTAMP behavior
        // which defaults onto the first TIMESTAMP column in a table.
        DB::statement('ALTER TABLE biometric_logs MODIFY scan_datetime DATETIME NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to TIMESTAMP (this will reintroduce the behavior)
        DB::statement('ALTER TABLE biometric_logs MODIFY scan_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
};
