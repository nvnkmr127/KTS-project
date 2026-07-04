<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create exams table
        if (!Schema::hasTable('exams')) {
            Schema::create('exams', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('subject')->nullable();
                $table->string('class')->nullable();
                $table->date('exam_date')->nullable();
                $table->integer('max_marks')->default(100);
                $table->string('status')->default('Upcoming');
                $table->timestamps();
            });
        }

        // 2. Create marks table
        if (!Schema::hasTable('marks')) {
            Schema::create('marks', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('exam_id')->nullable();
                $table->unsignedBigInteger('student_id')->nullable();
                $table->string('student_name');
                $table->string('roll')->nullable();
                $table->integer('maths')->default(0);
                $table->integer('science')->default(0);
                $table->integer('english')->default(0);
                $table->integer('telugu')->default(0);
                $table->integer('social')->default(0);
                $table->integer('total')->default(0);
                $table->decimal('percentage', 5, 2)->default(0.00);
                $table->string('grade')->nullable();
                $table->integer('rank')->default(0);
                $table->timestamps();
            });
        }

        // 3. Create exam_schedules table
        if (!Schema::hasTable('exam_schedules')) {
            Schema::create('exam_schedules', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('exam_id');
                $table->string('class_name');
                $table->string('date_str');
                $table->string('subject');
                $table->string('time')->nullable();
                $table->string('duration')->nullable();
                $table->integer('max_marks')->default(100);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_schedules');
        Schema::dropIfExists('marks');
        Schema::dropIfExists('exams');
    }
};
