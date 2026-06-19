<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyDiary extends Model
{
    protected $fillable = [
        'batch_name',
        'teacher_name',
        'topics',
        'homework',
        'notes',
        'diary_date',
        'parents_count'
    ];
}
