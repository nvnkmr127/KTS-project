<?php

namespace App\Models;

use App\Traits\WebhookEnabled;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApplication extends Model
{
    use WebhookEnabled;

    protected $fillable = ['user_id', 'leave_type_id', 'start_date', 'end_date', 'reason', 'status', 'approved_by', 'admin_notes', 'is_half_day'];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
