<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubstituteAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'timetable_id',
        'absent_user_id',
        'substitute_user_id',
        'assignment_date',
        'status',
        'assigned_by',
        'notes',
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the timetable entry for this substitution
     */
    public function timetable(): BelongsTo
    {
        return $this->belongsTo(Timetable::class);
    }

    /**
     * Get the absent faculty member
     */
    public function absentUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'absent_user_id');
    }

    /**
     * Get the assigned substitute faculty member
     */
    public function substituteUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'substitute_user_id');
    }

    /**
     * Get the user who made the assignment
     */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    /**
     * Scope to filter by active assignments
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'assigned');
    }
}
