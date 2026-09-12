<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = Activity::with(['causer', 'subject'])
            ->where(function ($q) {
                $q->whereNull('subject_type')
                  ->orWhere(function ($st) {
                      $st->where('subject_type', '!=', 'App\\Models\\Setting')
                         ->where('subject_type', '!=', 'Setting')
                         ->where('subject_type', '!=', 'App\\Models\\Webhook')
                         ->where('subject_type', '!=', 'Webhook')
                         ->where('subject_type', '!=', 'App\\Models\\WebhookCall')
                         ->where('subject_type', '!=', 'WebhookCall')
                         ->where('subject_type', '!=', 'App\\Models\\ComponentPaymentItem')
                         ->where('subject_type', '!=', 'ComponentPaymentItem');
                  });
            })
            ->where('log_name', '!=', 'webhook')
            ->where('log_name', '!=', 'system')
            ->where('description', 'not like', '%backend public%')
            ->where('description', 'not like', '%Backend public%')
            ->where('description', 'not like', '%backend/public%')
            ->where('description', 'not like', '%componentpaymentitem%')
            ->where('description', 'not like', '%component-payment-item%')
            ->where('description', 'not like', '%system setting%')
            ->where('description', 'not like', '%System setting%')
            ->where('description', 'not like', '%kts biometric punches%')
            ->where('description', 'not like', '%kts staff attendance%')
            ->where('description', 'not like', '%kts staff members%')
            ->where('description', 'not like', '%kts dashboard activities%')
            ->where('description', 'not like', '%cltk%')
            ->where('description', 'not like', '%sak%')
            ->where('description', 'not like', '%kts staff access%')
            ->where('description', 'not like', '%webhook%')
            ->where('description', 'not like', '%Webhook%')
            ->where('description', 'not like', '%backup%')
            ->where('description', 'not like', '%cron%')
            ->where('description', 'not like', 'Marked attendance on %')
            ->where('description', 'not like', 'Updated attendance record on %')
            ->where('description', 'not like', '%invalidate-cache%');

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where('description', 'LIKE', '%'.$searchTerm.'%')
                ->orWhere('log_name', 'LIKE', '%'.$searchTerm.'%');
        }

        // Filter by user
        if ($request->filled('causer_id')) {
            $query->where('causer_id', $request->causer_id);
        }

        // Optional: Hide system logs (but keep important ones)
        if ($request->boolean('hide_system')) {
            $query->where(function ($q) {
                // 1. Always show actions by real users
                $q->whereNotNull('causer_id')
                    // 2. OR show critical system events (whitelisted models/logs)
                    ->orWhereIn('log_name', ['payment', 'webhook', 'attendance'])
                    ->orWhereIn('subject_type', [
                        'App\Models\Payment',
                        'App\Models\WebhookCall',
                        'App\Models\Attendance',
                        // Removed Student/Course/Batch from blanket allow-list to prevent noise
                    ])
                    // 3. Keep specific important events based on description
                    ->orWhere(function ($sub) {
                        $sub->where('description', 'LIKE', '%created%')
                            ->orWhere('description', 'LIKE', '%deleted%')
                            ->orWhere('description', 'LIKE', '%dropout%')
                            ->orWhere('description', 'LIKE', '%internship%')
                            ->orWhere('description', 'LIKE', '%profile%');
                    });
            });
        }

        // Filter by log name (activity type)
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        // Filter by subject type
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Get paginated results
        $activities = $query->latest()->paginate(50)->withQueryString();

        // Get filter options
        $users = User::orderBy('name')->get(['id', 'name']);
        $logNames = Activity::distinct()->pluck('log_name')->filter();
        $subjectTypes = Activity::distinct()
            ->pluck('subject_type')
            ->filter()
            ->map(function ($type) {
                return class_basename($type);
            });

        return view('admin.activity_log.index', compact(
            'activities',
            'users',
            'logNames',
            'subjectTypes'
        ));
    }

    public function destroy(Request $request)
    {
        $days = (int) $request->input('days', 30);

        if ($days === 0) {
            $deleted = Activity::truncate();
            $message = 'Cleared all activity log entries.';
        } else {
            $deleted = Activity::where('created_at', '<', now()->subDays($days))->delete();
            $message = "Deleted {$deleted} old activity log entries.";
        }

        return redirect()->back()->with('success', $message);
    }
}
