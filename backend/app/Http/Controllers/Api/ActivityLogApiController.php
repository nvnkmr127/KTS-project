<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\Carbon;

class ActivityLogApiController extends Controller
{
    /**
     * Display a listing of activity logs.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            // Auto delete logs older than 60 days
            Activity::where('created_at', '<', Carbon::now()->subDays(60))->delete();

            $userMorphClass = (new \App\Models\User())->getMorphClass();
            $query = Activity::query()->with('causer');

            // Apply recycle bin filtering
            if ($request->boolean('recycled')) {
                // Recycle bin: 30 to 60 days old
                $query->where('created_at', '>=', Carbon::now()->subDays(60))
                      ->where('created_at', '<', Carbon::now()->subDays(30));
            } else {
                // Active logs: last 30 days
                $query->where('created_at', '>=', Carbon::now()->subDays(30));
            }

            // Apply role-based visibility
            if ($user->can('manage settings')) {
                // Admin can filter by causer_id (user_id parameter)
                if ($request->filled('user_id')) {
                    $query->where('causer_id', $request->user_id);
                }
            } else {
                // Non-admin can only see their own activities
                $query->where('causer_id', $user->id)
                      ->where('causer_type', $userMorphClass);
            }

            // Apply filters
            if ($request->filled('event')) {
                $query->where('event', $request->event);
            }

            if ($request->filled('log_name')) {
                $query->where('log_name', $request->log_name);
            }

            if ($request->filled('search')) {
                $searchTerm = $request->search;
                $query->where('description', 'like', '%' . $searchTerm . '%');
            }

            if ($request->filled('date_from')) {
                $query->where('created_at', '>=', Carbon::parse($request->date_from));
            }

            if ($request->filled('date_to')) {
                $dateTo = Carbon::parse($request->date_to);
                if ($dateTo->hour === 0 && $dateTo->minute === 0 && $dateTo->second === 0) {
                    $dateTo = $dateTo->endOfDay();
                }
                $query->where('created_at', '<=', $dateTo);
            }

            if ($request->filled('subject_type')) {
                $subjectType = $request->subject_type;
                if (strpos($subjectType, '\\') === false) {
                    $query->where(function ($q) use ($subjectType) {
                        $q->where('subject_type', $subjectType)
                          ->orWhere('subject_type', 'App\\Models\\' . $subjectType);
                    });
                } else {
                    $query->where('subject_type', $subjectType);
                }
            }

            // Get total count before offset/limit
            $total = $query->count();

            // Set up pagination parameters
            $limit = (int) $request->input('limit', 100);
            if ($limit < 1) {
                $limit = 100;
            } elseif ($limit > 500) {
                $limit = 500;
            }

            $offset = max(0, (int) $request->input('offset', 0));

            // Execute query with sorting
            $logs = $query->orderBy('created_at', 'desc')
                          ->skip($offset)
                          ->take($limit)
                          ->get();

            // Transform records
            $data = $logs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'description' => $log->description,
                    'event' => $log->event,
                    'log_name' => $log->log_name,
                    'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                    'subject_id' => $log->subject_id,
                    'causer_id' => $log->causer_id,
                    'causer_name' => $log->causer?->name ?? 'System',
                    'causer_email' => $log->causer?->email,
                    'properties' => $log->properties,
                    'created_at' => $log->created_at ? Carbon::parse($log->created_at)->toIso8601String() : null,
                    'time_ago' => $log->created_at ? Carbon::parse($log->created_at)->diffForHumans() : null,
                ];
            });

            $hasMore = ($offset + $logs->count()) < $total;

            return response()->json([
                'data' => $data,
                'total' => $total,
                'has_more' => $hasMore,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve activity logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve statistics for the currently authenticated user's own activity.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myStats(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $userMorphClass = (new \App\Models\User())->getMorphClass();

            // Base query for user's own activity (active logs only: last 30 days)
            $baseQuery = Activity::where('causer_id', $user->id)
                                 ->where('causer_type', $userMorphClass)
                                 ->where('created_at', '>=', Carbon::now()->subDays(30));

            $totalActions = (clone $baseQuery)->count();

            $today = (clone $baseQuery)
                ->whereDate('created_at', Carbon::today())
                ->count();

            $thisWeek = (clone $baseQuery)
                ->where('created_at', '>=', Carbon::now()->startOfWeek())
                ->count();

            // Retrieve last login: check User model field, or fall back to activity logs
            $lastLogin = null;
            if ($user->last_login_at) {
                $lastLogin = Carbon::parse($user->last_login_at)->toIso8601String();
            } else {
                $lastLoginLog = (clone $baseQuery)
                    ->where(function ($q) {
                        $q->where('event', 'login')
                          ->orWhere('log_name', 'login')
                          ->orWhere('description', 'like', '%login%')
                          ->orWhere('description', 'like', '%logged in%');
                    })
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($lastLoginLog) {
                    $lastLogin = Carbon::parse($lastLoginLog->created_at)->toIso8601String();
                }
            }

            // Retrieve most recent action
            $mostRecentLog = (clone $baseQuery)
                ->orderBy('created_at', 'desc')
                ->first();

            $mostRecent = null;
            if ($mostRecentLog) {
                $mostRecent = [
                    'id' => $mostRecentLog->id,
                    'description' => $mostRecentLog->description,
                    'event' => $mostRecentLog->event,
                    'created_at' => $mostRecentLog->created_at ? Carbon::parse($mostRecentLog->created_at)->toIso8601String() : null,
                ];
            }

            return response()->json([
                'total_actions' => $totalActions,
                'today' => $today,
                'this_week' => $thisWeek,
                'last_login' => $lastLogin,
                'most_recent' => $mostRecent,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve user statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve a list of distinct users who have activity logs (admin only).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function users(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            if (!$user->can('manage settings')) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $results = Activity::selectRaw('causer_id, causer_type, COUNT(*) as action_count, MAX(created_at) as last_active')
                ->whereNotNull('causer_type')
                ->whereNotNull('causer_id')
                ->groupBy('causer_id', 'causer_type')
                ->orderBy('last_active', 'desc')
                ->get();

            $results->load('causer');

            $data = $results->map(function ($row) {
                $causer = $row->causer;
                return [
                    'id' => $row->causer_id,
                    'name' => $causer?->name ?? 'System',
                    'email' => $causer?->email,
                    'action_count' => (int) $row->action_count,
                    'last_active' => $row->last_active ? Carbon::parse($row->last_active)->toIso8601String() : null,
                    'last_active_ago' => $row->last_active ? Carbon::parse($row->last_active)->diffForHumans() : null,
                ];
            });

            return response()->json($data);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve active users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve a summary of daily activity counts for the last 30 days.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function summary(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $isAdmin = $user->can('manage settings');

            $query = Activity::selectRaw("
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN event='created' THEN 1 ELSE 0 END) as created_count,
                SUM(CASE WHEN event='updated' THEN 1 ELSE 0 END) as updated_count,
                SUM(CASE WHEN event='deleted' THEN 1 ELSE 0 END) as deleted_count,
                SUM(CASE WHEN event='login' THEN 1 ELSE 0 END) as login_count
            ")
            ->where('created_at', '>=', Carbon::now()->subDays(30));

            if (!$isAdmin) {
                $userMorphClass = (new \App\Models\User())->getMorphClass();
                $query->where('causer_id', $user->id)
                      ->where('causer_type', $userMorphClass);
            }

            $results = $query->groupByRaw('DATE(created_at)')
                             ->orderBy('date', 'asc')
                             ->get();

            $data = $results->map(function ($row) {
                return [
                    'date' => $row->date,
                    'total' => (int) $row->total,
                    'created_count' => (int) $row->created_count,
                    'updated_count' => (int) $row->updated_count,
                    'deleted_count' => (int) $row->deleted_count,
                    'login_count' => (int) $row->login_count,
                ];
            });

            $from = Carbon::now()->subDays(30)->toDateString();
            $to = Carbon::now()->toDateString();

            return response()->json([
                'data' => $data,
                'date_range' => [
                    'from' => $from,
                    'to' => $to,
                ],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve activity summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all activity logs (admin only).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clear(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            if (!$user->can('manage settings')) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            // Truncate activity logs
            Activity::truncate();

            // Log the action itself after clearing
            activity()
                ->causedBy($user)
                ->withProperties([
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ])
                ->event('deleted')
                ->log('Cleared all activity logs');

            return response()->json([
                'success' => true,
                'message' => 'All activity logs cleared successfully.'
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to clear activity logs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore an auto-deleted activity log (move back to active logs by setting created_at to now).
     */
    public function restore(Request $request, $id)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user || !$user->can('manage settings')) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $log = Activity::findOrFail($id);
            $log->created_at = Carbon::now();
            $log->save();

            return response()->json([
                'success' => true,
                'message' => 'Activity log restored successfully.'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to restore activity log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete an activity log from the recycle bin.
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = auth('sanctum')->user();
            if (!$user || !$user->can('manage settings')) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $log = Activity::findOrFail($id);
            $log->delete();

            return response()->json([
                'success' => true,
                'message' => 'Activity log permanently deleted.'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete activity log: ' . $e->getMessage()
            ], 500);
        }
    }
}
