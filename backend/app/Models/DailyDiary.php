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
                'created' => "Daily diary posted for Class '{$this->batch_name}' on {$this->diary_date}",
                'updated' => "Daily diary updated for Class '{$this->batch_name}' on {$this->diary_date}",
                'deleted' => "Daily diary deleted for Class '{$this->batch_name}' on {$this->diary_date}",
                default => "Daily diary {$eventName} for Class '{$this->batch_name}'"
            });
    }
}
