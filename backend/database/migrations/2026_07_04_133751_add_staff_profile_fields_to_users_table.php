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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'designation')) {
                $table->string('designation')->nullable();
            }
            if (!Schema::hasColumn('users', 'category')) {
                $table->string('category')->nullable();
            }
            if (!Schema::hasColumn('users', 'join_date')) {
                $table->date('join_date')->nullable();
            }
            if (!Schema::hasColumn('users', 'salary')) {
                $table->decimal('salary', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('users', 'qualifications')) {
                $table->string('qualifications')->nullable();
            }
            if (!Schema::hasColumn('users', 'documents')) {
                $table->json('documents')->nullable();
            }
            if (!Schema::hasColumn('users', 'attendance_percentage')) {
                $table->integer('attendance_percentage')->nullable()->default(100);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'designation',
                'category',
                'join_date',
                'salary',
                'qualifications',
                'documents',
                'attendance_percentage'
            ]);
        });
    }
};
