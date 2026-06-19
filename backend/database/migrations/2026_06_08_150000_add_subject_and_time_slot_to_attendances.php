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
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'subject_id')) {
                $table->foreignId('subject_id')->nullable()->after('batch_id')->constrained()->onDelete('set null');
            }
            if (!Schema::hasColumn('attendances', 'time_slot_id')) {
                $table->foreignId('time_slot_id')->nullable()->after('subject_id')->constrained()->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['time_slot_id']);
            $table->dropColumn(['subject_id', 'time_slot_id']);
        });
    }
};
