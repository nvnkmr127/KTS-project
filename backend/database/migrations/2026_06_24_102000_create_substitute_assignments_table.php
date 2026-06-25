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
        Schema::create('substitute_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timetable_id')->constrained()->onDelete('cascade');
            $table->foreignId('absent_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('substitute_user_id')->constrained('users')->onDelete('cascade');
            $table->date('assignment_date');
            $table->string('status')->default('assigned'); // assigned, completed, cancelled
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Prevent duplicate assignments for the same timetable and date
            $table->unique(['timetable_id', 'assignment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('substitute_assignments');
    }
};
