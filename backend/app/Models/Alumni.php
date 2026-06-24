<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alumni extends Model
{
    use HasFactory;

    protected $table = 'alumni';

    protected $fillable = [
        'name',
        'roll',
        'pass_out_year',
        'class',
        'section',
        'gender',
        'dob',
        'phone',
        'email',
        'address',
        'current_occupation',
        'achievement',
        'status',
    ];
}
