<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Homework extends Model
{
    protected $table = 'homework';

    protected $fillable = [
        'batch_name',
        'subject',
        'title',
        'description',
        'due_date',
        'assigned_date',
        'has_attachment',
        'submissions_received',
        'total_students'
    ];
}
