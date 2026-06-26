<?php

namespace App\Models;

use App\Traits\WebhookEnabled;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Asset extends Model
{
    use HasFactory, WebhookEnabled, LogsActivity;

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['name', 'category_id', 'status', 'assigned_to'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $e) => "Asset '{$this->name}' was {$e}");
    }

    protected $fillable = [
        'name', 'asset_code', 'asset_category_id', 'location',
        'quantity', 'condition', 'purchase_date', 'purchase_price',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }
}
