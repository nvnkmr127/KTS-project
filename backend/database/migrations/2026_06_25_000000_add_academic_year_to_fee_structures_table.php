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
        if (Schema::hasTable('fee_structures') && ! Schema::hasColumn('fee_structures', 'academic_year_id')) {
            Schema::table('fee_structures', function (Blueprint $table) {
                $table->foreignId('academic_year_id')
                    ->nullable()
                    ->constrained('academic_years')
                    ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('fee_structures') && Schema::hasColumn('fee_structures', 'academic_year_id')) {
            Schema::table('fee_structures', function (Blueprint $table) {
                $table->dropForeign(['academic_year_id']);
                $table->dropColumn('academic_year_id');
            });
        }
    }
};
