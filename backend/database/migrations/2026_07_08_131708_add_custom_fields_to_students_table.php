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
        Schema::table('students', function (Blueprint $table) {
            $table->string('student_pen_no', 50)->nullable()->after('aadhar_number');
            $table->string('father_occupation', 100)->nullable()->after('father_mobile');
            $table->string('mother_name', 100)->nullable()->after('father_occupation');
            $table->string('mother_mobile', 20)->nullable()->after('mother_name');
            $table->string('mother_occupation', 100)->nullable()->after('mother_mobile');
            $table->string('mother_tongue', 50)->nullable()->after('mother_occupation');
            $table->string('nationality', 50)->nullable()->after('mother_tongue');
            $table->string('state', 50)->nullable()->after('nationality');
            $table->string('religion', 50)->nullable()->after('state');
            $table->string('caste', 50)->nullable()->after('religion');
            $table->string('sub_caste', 50)->nullable()->after('caste');
            $table->string('tc_no', 50)->nullable()->after('sub_caste');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'student_pen_no',
                'father_occupation',
                'mother_name',
                'mother_mobile',
                'mother_occupation',
                'mother_tongue',
                'nationality',
                'state',
                'religion',
                'caste',
                'sub_caste',
                'tc_no',
            ]);
        });
    }
};
