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
        Schema::create('daily_diaries', function (Blueprint $table) {
            $table->id();
            $table->string('batch_name');
            $table->string('teacher_name');
            $table->text('topics');
            $table->text('homework')->nullable();
            $table->text('notes')->nullable();
            $table->date('diary_date');
            $table->integer('parents_count')->default(30);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_diaries');
    }
};
