<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookCall extends Model
{
    use HasFactory;

    protected $fillable = [
        'webhook_id',
        'success',
        'status_code',
        'payload',
        'response_body',
        'execution_time_ms',
        'event_id',
        'delivery_id',
        'retry_attempt',
        'error_category',
        'payload_size_bytes',
    ];

    protected $casts = [
        'payload' => 'array',
        'success' => 'boolean',
    ];

    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class);
    }
}
