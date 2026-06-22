<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class DailyDiary extends Model
{
    use LogsActivity;

    protected $fillable = [
        'batch_name',
        'teacher_name',
        'topics',
        'homework',
        'notes',
        'diary_date',
        'parents_count'
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['batch_name', 'topics', 'homework', 'notes', 'diary_date'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => 'Daily diary posted',
                'updated' => 'Daily diary updated',
                'deleted' => 'Daily diary deleted',
                default => "Daily diary {$eventName}"
            });
    }
}
