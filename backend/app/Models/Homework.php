<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Homework extends Model
{
    use LogsActivity;

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

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['batch_name', 'subject', 'title', 'description', 'due_date'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => "Homework assigned for '{$this->subject}' to Class '{$this->batch_name}' (Due: {$this->due_date})",
                'updated' => "Homework updated for '{$this->subject}' in Class '{$this->batch_name}'",
                'deleted' => "Homework deleted for '{$this->subject}' in Class '{$this->batch_name}'",
                default => "Homework {$eventName} for '{$this->subject}' in Class '{$this->batch_name}'"
            });
    }
}
