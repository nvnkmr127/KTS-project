<?php

namespace App\Models;

use App\Traits\WebhookEnabled;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class FeeStructure extends Model
{
    use HasFactory, WebhookEnabled, LogsActivity;

    public function getActivitylogOptions(): LogOptions {
        return LogOptions::defaults()
            ->logOnly(['total_amount', 'amount', 'payment_terms'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function(string $e) {
                $batchName = $this->batch ? $this->batch->name : ('Batch ID ' . $this->batch_id);
                return "Fee structure of total ₹{$this->total_amount} for class {$batchName} was {$e}";
            });
    }

    /**
     * The attributes that are mass assignable.
     *
     * We've added 'amount' here as a workaround for an extra column
     * in your database schema. It will hold the same value as 'total_amount'.
     *
     * @var array
     */
    protected $fillable = [
        'batch_id',
        'total_amount',
        'amount', // Your existing workaround field
        'payment_terms', // <-- Add this
    ];

    /**
     * Get the batch that owns the fee structure.
     */
    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    /**
     * The fee categories (components) that belong to the fee structure.
     */
    public function feeCategories(): BelongsToMany
    {
        return $this->belongsToMany(FeeCategory::class, 'fee_structure_fee_category')
            ->withPivot('amount')
            ->withTimestamps();
    }
}
