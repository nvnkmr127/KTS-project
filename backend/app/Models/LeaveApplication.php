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
            ->setDescriptionForEvent(function (string $eventName) {
                $user = $this->user ? $this->user->name : 'Staff';
                $type = $this->leaveType ? $this->leaveType->name : 'Leave';
                return match ($eventName) {
                    'created' => "Leave request submitted by {$user} for {$type} from {$this->start_date} to {$this->end_date}",
                    'updated' => "Leave request updated for {$user} (Status: {$this->status})",
                    'deleted' => "Leave request cancelled for {$user} from {$this->start_date} to {$this->end_date}",
                    default => "Leave request {$eventName} for {$user}"
                };
            });
    }
}
