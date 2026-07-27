<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RecurringExpense;
use App\Models\Expense;
use App\Models\SystemNotification;
use Carbon\Carbon;

class ProcessRecurringExpenses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'expenses:process-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process recurring expenses and EMIs, generating records and notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing recurring expenses and EMIs...');

        // 1. Generate Expenses
        $dueExpenses = RecurringExpense::where('status', 'active')
            ->whereDate('next_due_date', '<=', now())
            ->get();

        foreach ($dueExpenses as $recurring) {
            Expense::create([
                'expense_category_id' => $recurring->expense_category_id,
                'amount' => $recurring->amount,
                'description' => $recurring->title . ' (Auto-generated)',
                'expense_date' => $recurring->next_due_date,
                'recurring_expense_id' => $recurring->id,
                'status' => 'pending'
            ]);

            $nextDate = Carbon::parse($recurring->next_due_date);
            
            switch ($recurring->frequency) {
                case 'daily':
                    $nextDate->addDay();
                    break;
                case 'weekly':
                    $nextDate->addWeek();
                    break;
                case 'monthly':
                    $nextDate->addMonth();
                    break;
                case 'yearly':
                    $nextDate->addYear();
                    break;
            }

            if ($recurring->type === 'emi' && $recurring->end_date && $nextDate->gt(Carbon::parse($recurring->end_date))) {
                $recurring->status = 'completed';
            } else {
                $recurring->next_due_date = $nextDate;
            }
            $recurring->save();
            
            $this->info("Processed: {$recurring->title}");
        }

        // 2. Send Notifications for Upcoming EMIs (7, 4, 2, 1 days prior)
        $dates = [
            7 => now()->addDays(7)->toDateString(),
            4 => now()->addDays(4)->toDateString(),
            2 => now()->addDays(2)->toDateString(),
            1 => now()->addDay()->toDateString(),
        ];

        $upcomingEmis = RecurringExpense::where('status', 'active')
            ->where('type', 'emi')
            ->where(function ($query) use ($dates) {
                foreach ($dates as $date) {
                    $query->orWhereDate('next_due_date', $date);
                }
            })
            ->get();

        foreach ($upcomingEmis as $emi) {
            $dueStr = $emi->next_due_date->toDateString();
            $daysAway = array_search($dueStr, $dates);
            $dayText = $daysAway === 1 ? 'tomorrow' : "in {$daysAway} days";

            SystemNotification::create([
                'title' => 'Upcoming EMI Reminder',
                'message' => "The EMI for '{$emi->title}' of amount ₹{$emi->amount} is due {$dayText} (" . Carbon::parse($emi->next_due_date)->format('M d') . ").",
                'type' => 'emi_reminder',
                'category' => 'finance',
                'priority' => 'high',
                'sent_to_roles' => ['admin', 'super-admin'],
            ]);
            
            $this->info("Notification sent for: {$emi->title} (Due {$dayText})");
        }

        $this->info('Completed processing.');
    }
}
