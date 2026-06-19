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
        Schema::create('homework', function (Blueprint $table) {
            $table->id();
            $table->string('batch_name');
            $table->string('subject');
            $table->string('title');
            $table->text('description');
            $table->date('due_date');
            $table->date('assigned_date');
            $table->boolean('has_attachment')->default(false);
            $table->integer('submissions_received')->default(0);
            $table->integer('total_students')->default(35);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('homework');
    }
};
