<?php

namespace App\Models;

use App\Traits\WebhookEnabled;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class LeaveApplication extends Model
{
    use WebhookEnabled, LogsActivity;

    protected $fillable = ['user_id', 'leave_type_id', 'start_date', 'end_date', 'reason', 'status', 'approved_by', 'admin_notes', 'is_half_day'];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['leave_type_id', 'start_date', 'end_date', 'reason', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => match ($eventName) {
                'created' => 'Leave request submitted',
                'updated' => 'Leave request updated',
                'deleted' => 'Leave request cancelled',
                default => "Leave request {$eventName}"
            });
    }
}
