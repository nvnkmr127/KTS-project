<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Check if academic_year column exists
        if (! Schema::hasColumn('student_fees', 'academic_year')) {
            Schema::table('student_fees', function (Blueprint $table) {
                // Add academic_year as string for backward compatibility
                $table->string('academic_year', 20)->nullable()->after('fee_structure_id');

                // Add index for performance
                $table->index('academic_year');
            });

            // If academic_year_id exists, populate academic_year from academic_years table
            if (Schema::hasColumn('student_fees', 'academic_year_id') && Schema::hasTable('academic_years')) {
                DB::statement('
                    UPDATE student_fees sf
                    JOIN academic_years ay ON sf.academic_year_id = ay.id
                    SET sf.academic_year = ay.name
                    WHERE sf.academic_year_id IS NOT NULL
                ');
            }
        }

        // Also add to payments table if missing
        if (Schema::hasTable('payments') && ! Schema::hasColumn('payments', 'academic_year')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('academic_year', 20)->nullable()->after('student_id');
                $table->index('academic_year');
            });

            // Populate from academic_years table if academic_year_id exists
            if (Schema::hasColumn('payments', 'academic_year_id') && Schema::hasTable('academic_years')) {
                DB::statement('
                    UPDATE payments p
                    JOIN academic_years ay ON p.academic_year_id = ay.id
                    SET p.academic_year = ay.name
                    WHERE p.academic_year_id IS NOT NULL
                ');
            }
        }
    }

    public function down()
    {
        if (Schema::hasColumn('student_fees', 'academic_year')) {
            Schema::table('student_fees', function (Blueprint $table) {
                $table->dropIndex(['academic_year']);
                $table->dropColumn('academic_year');
            });
        }

        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'academic_year')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndex(['academic_year']);
                $table->dropColumn('academic_year');
            });
        }
    }
};
