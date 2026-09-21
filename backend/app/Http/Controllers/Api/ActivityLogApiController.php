<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\Carbon;

class ActivityLogApiController extends Controller
{
    /**
     * Helper to check if the user is an admin or has settings management permissions.
     */
    private function isAdmin($user): bool
    {
        if (!$user) {
            return false;
        }
        if ($user->can('manage settings')) {
            return true;
        }
        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['super-admin', 'admin', 'college-admin', 'Super Admin', 'Admin', 'College Admin'])) {
            return true;
        }
        if (method_exists($user, 'hasRole') && ($user->hasRole('super-admin') || $user->hasRole('admin') || $user->hasRole('college-admin') || $user->hasRole('Admin') || $user->hasRole('Super Admin'))) {
            return true;
        }
        if (isset($user->role) && in_array(strtolower($user->role), ['admin', 'super-admin', 'super admin', 'college-admin', 'college admin'])) {
            return true;
        }
        return false;
    }

    /**
     * Display a listing of activity logs.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $user = auth('sanctum')->user() ?? auth()->user();
            if (!$user) {
                if ($request->filled('user_id')) {
                    $user = \App\Models\User::find($request->user_id);
                } elseif ($request->filled('user_name')) {
                    $user = \App\Models\User::where('name', $request->user_name)->orWhere('name', 'like', "%{$request->user_name}%")->first();
                } elseif ($request->filled('user_email')) {
                    $user = \App\Models\User::where('email', $request->user_email)->first();
                }
            }
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $query = Activity::query()->with(['causer', 'causer.roles']);
            $query = $this->applyExclusions($query);

            // Apply recycle bin filtering
            if ($request->boolean('recycled')) {
                // Recycle bin: marked as deleted or in legacy recycle window
                $query->where(function($q) {
                    $q->whereNotNull('properties->deleted_at')
                      ->orWhere(function($sub) {
                          $sub->where('created_at', '>=', Carbon::now()->subDays(60))
                              ->where('created_at', '<', Carbon::now()->subDays(30));
                      });
                });
            } else {
                // Active logs: all historical and current logs not marked deleted
                $query->whereNull('properties->deleted_at');
            }

            // Apply role-based visibility & teacher scoping
            $isTargetedUser = $request->filled('user_id') || $request->filled('user_name');
            if ($this->isAdmin($user) && !$isTargetedUser) {
                // Global admin viewing all system logs
            } else {
                // Filter specifically for the teacher / target user
                $targetUserId = $request->input('user_id', $user->id);
                $targetUserName = $request->input('user_name', $user->name);
                $targetUserEmail = $request->input('user_email', $user->email);
                $targetUser = $targetUserId ? \App\Models\User::find($targetUserId) : null;
                if ($targetUser) {
                    $targetUserName = $targetUser->name;
                    $targetUserEmail = $targetUser->email;
                }

                $query->where(function($q) use ($targetUserId, $targetUserName, $targetUserEmail) {
                    if ($targetUserId) {
                        $q->where('causer_id', $targetUserId)
                          ->orWhere('properties->user_id', $targetUserId)
                          ->orWhere('properties->user_id', (string)$targetUserId)
                          ->orWhere('properties->causer_id', $targetUserId)
                          ->orWhere('properties->teacher_id', $targetUserId)
                          ->orWhere('properties->faculty_id', $targetUserId);
                    }
                    if ($targetUserName) {
                        $q->orWhere('properties->marked_by', 'like', "%{$targetUserName}%")
                          ->orWhere('properties->actor_name', 'like', "%{$targetUserName}%")
                          ->orWhere('properties->user_name', 'like', "%{$targetUserName}%")
                          ->orWhere('properties->teacher_name', 'like', "%{$targetUserName}%")
                          ->orWhere('properties->faculty_name', 'like', "%{$targetUserName}%")
                          ->orWhere('description', 'like', "%{$targetUserName}%");
                    }
                    if ($targetUserEmail) {
                        $q->orWhere('properties->user_email', 'like', "%{$targetUserEmail}%");
                    }
                });
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
                $causer = $log->causer;
                $causerRole = null;
                if ($causer) {
                    if (method_exists($causer, 'getRoleNames') && $causer->getRoleNames()->isNotEmpty()) {
                        $causerRole = $causer->getRoleNames()->first();
                    } elseif (isset($causer->role)) {
                        $causerRole = $causer->role;
                    }
                }

                $properties = $log->properties ? (is_array($log->properties) ? $log->properties : (method_exists($log->properties, 'toArray') ? $log->properties->toArray() : (array)$log->properties)) : [];
                if (
                    ($log->subject_type && (str_contains($log->subject_type, 'Student') || $log->subject_type === 'Student')) ||
                    ($log->log_name === 'student') ||
                    (str_contains(strtolower($log->description ?? ''), 'student'))
                ) {
                    $student = null;
                    if ($log->subject_id) {
                        $student = \App\Models\Student::with('batch.course')->find($log->subject_id);
                    }
                    if (!$student) {
                        $sId = $properties['student_id'] ?? $properties['attributes']['student_id'] ?? $properties['attributes']['id'] ?? $properties['old']['student_id'] ?? null;
                        if ($sId) {
                            $student = \App\Models\Student::with('batch.course')->find($sId);
                        }
                    }
                    if (!$student) {
                        $searchName = $properties['student_name'] ?? $properties['name'] ?? $properties['attributes']['name'] ?? $properties['attributes']['student_name'] ?? null;
                        if (!$searchName && !empty($log->description)) {
                            $desc = (string)$log->description;
                            if (preg_match('/for\s+(?:student\s+)?([A-Za-z\s\.\-_]+?)(?:\.|$)/i', $desc, $m)) {
                                $searchName = trim($m[1]);
                            } elseif (preg_match('/registered new student\s+([A-Za-z\s\.\-_]+?)(?:\s+in|\.|$)/i', $desc, $m)) {
                                $searchName = trim($m[1]);
                            } elseif (preg_match('/student profile for\s+([A-Za-z\s\.\-_]+?)(?:\.|$)/i', $desc, $m)) {
                                $searchName = trim($m[1]);
                            } elseif (preg_match('/student:\s*([A-Za-z\s\.\-_]+)/i', $desc, $m)) {
                                $searchName = trim($m[1]);
                            }
                        }
                        if ($searchName && !in_array(strtolower($searchName), ['student', 'student record', 'record'])) {
                            $student = \App\Models\Student::with('batch.course')->where('name', $searchName)->latest()->first();
                            if (!$student) {
                                $student = \App\Models\Student::with('batch.course')->where('name', 'like', "%{$searchName}%")->latest()->first();
                            }
                        }
                    }

                    if ($student) {
                        if (empty($properties['student_name'])) {
                            $properties['student_name'] = $student->name;
                        }
                        if (empty($properties['admission_number']) && empty($properties['enrollment_number'])) {
                            $adm = $student->admission_number ?? $student->enrollment_number;
                            $properties['admission_number'] = $adm;
                            $properties['enrollment_number'] = $adm;
                        }
                        if (empty($properties['pen']) && empty($properties['student_pen_no']) && empty($properties['pen_number'])) {
                            $penVal = $student->student_pen_no ?? $student->pen;
                            $properties['pen'] = $penVal;
                            $properties['pen_number'] = $penVal;
                            $properties['student_pen_no'] = $penVal;
                        }
                        if (empty($properties['batch_name']) && empty($properties['class_name'])) {
                            $batchName = $student->batch ? $student->batch->name : null;
                            if ($batchName) {
                                $properties['batch_name'] = $batchName;
                                $properties['class_name'] = $batchName;
                            }
                        }
                        if (empty($properties['father_name'])) {
                            $properties['father_name'] = $student->father_name;
                        }
                        if (empty($properties['mobile']) && empty($properties['student_mobile']) && empty($properties['phone'])) {
                            $properties['mobile'] = $student->student_mobile ?? $student->father_mobile;
                            $properties['student_mobile'] = $student->student_mobile;
                            $properties['father_mobile'] = $student->father_mobile;
                        }
                        if (empty($properties['gender'])) {
                            $properties['gender'] = $student->gender;
                        }
                        if (empty($properties['dob']) && empty($properties['date_of_birth'])) {
                            if ($student->dob) {
                                try {
                                    $properties['dob'] = \Carbon\Carbon::parse($student->dob)->format('d-m-Y');
                                    $properties['date_of_birth'] = $properties['dob'];
                                } catch (\Throwable $e) {
                                    $properties['dob'] = (string)$student->dob;
                                }
                            }
                        }
                        if (empty($properties['mother_name'])) {
                            $properties['mother_name'] = $student->mother_name;
                        }
                        if (empty($properties['village']) && empty($properties['address'])) {
                            $properties['village'] = $student->village;
                            $properties['address'] = $student->village;
                        }
                        if (empty($properties['status']) && empty($properties['attributes']['status'])) {
                            $properties['status'] = $student->status;
                        }
                    }

                    // Fallbacks from batch_id if still missing batch_name
                    $batchId = $properties['batch_id'] ?? $properties['attributes']['batch_id'] ?? $properties['old']['batch_id'] ?? null;
                    if ($batchId && empty($properties['batch_name']) && empty($properties['class_name'])) {
                        $batch = \App\Models\Batch::find($batchId);
                        if ($batch) {
                            $properties['batch_name'] = $batch->name;
                            $properties['class_name'] = $batch->name;
                        }
                    }

                    if (empty($properties['admission_number']) && empty($properties['enrollment_number'])) {
                        $admNo = $properties['attributes']['enrollment_number'] ?? $properties['attributes']['admission_number'] ?? $properties['old']['enrollment_number'] ?? null;
                        if ($admNo) {
                            $properties['admission_number'] = $admNo;
                            $properties['enrollment_number'] = $admNo;
                        }
                    }
                    if (empty($properties['pen']) && empty($properties['student_pen_no'])) {
                        $pen = $properties['attributes']['student_pen_no'] ?? $properties['attributes']['pen'] ?? $properties['old']['student_pen_no'] ?? null;
                        if ($pen) {
                            $properties['pen'] = $pen;
                            $properties['student_pen_no'] = $pen;
                            $properties['pen_number'] = $pen;
                        }
                    }
                }

                $causerName = $causer?->name;
                if (!$causerName) {
                    if (!empty($properties['marked_by'])) {
                        $causerName = $properties['marked_by'];
                    } elseif (!empty($properties['actor_name']) && $properties['actor_name'] !== 'System') {
                        $causerName = $properties['actor_name'];
                    } elseif (preg_match('/^(Super Admin|Admin|[A-Za-z\s]+?)\s+(?:marked|registered|added|updated|created|deleted)/i', (string)$log->description, $m)) {
                        $causerName = trim($m[1]);
                    } else {
                        $causerName = 'System';
                    }
                }

                if (!$causerRole) {
                    if (!empty($properties['actor_role']) && $properties['actor_role'] !== 'System') {
                        $causerRole = $properties['actor_role'];
                    } elseif ($causerName === 'Super Admin') {
                        $causerRole = 'Super Admin';
                    } elseif ($causerName === 'Admin') {
                        $causerRole = 'Admin';
                    }
                }

                return [
                    'id' => $log->id,
                    'description' => $log->description,
                    'event' => $log->event,
                    'log_name' => $log->log_name,
                    'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                    'subject_id' => $log->subject_id,
                    'causer_id' => $log->causer_id,
                    'causer_name' => $causerName,
                    'causer_email' => $causer?->email,
                    'causer_role' => $causerRole,
                    'properties' => $properties,
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
     * Store a custom activity log.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $user = auth('sanctum')->user() ?? auth()->user();
            $data = $request->all();
            if (!$user) {
                $markedBy = $data['properties']['marked_by'] ?? $data['properties']['actor_name'] ?? $data['properties']['user_name'] ?? null;
                if ($markedBy) {
                    $user = \App\Models\User::where('name', $markedBy)->orWhere('name', 'like', "%{$markedBy}%")->first();
                }
                if (!$user && !empty($data['properties']['user_id'])) {
                    $user = \App\Models\User::find($data['properties']['user_id']);
                }
                if (!$user && !empty($data['properties']['user_email'])) {
                    $user = \App\Models\User::where('email', $data['properties']['user_email'])->first();
                }
            }
            $logItem = activity($data['log_name'] ?? 'attendance')
                ->causedBy($user)
                ->event($data['event'] ?? 'created')
                ->withProperties($data['properties'] ?? [])
                ->log($data['description'] ?? 'Marked student attendance');

            return response()->json($logItem, 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to record activity log: ' . $e->getMessage()
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
            $user = auth('sanctum')->user() ?? auth()->user();
            if (!$user) {
                if ($request->filled('user_id')) {
                    $user = \App\Models\User::find($request->user_id);
                } elseif ($request->filled('user_name')) {
                    $user = \App\Models\User::where('name', $request->user_name)->orWhere('name', 'like', "%{$request->user_name}%")->first();
                } elseif ($request->filled('user_email')) {
                    $user = \App\Models\User::where('email', $request->user_email)->first();
                }
            }
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $userId = $request->input('user_id', $user->id);
            $userName = $request->input('user_name', $user->name);
            $userEmail = $request->input('user_email', $user->email);
            $targetUser = $userId ? \App\Models\User::find($userId) : null;
            if ($targetUser) {
                $userName = $targetUser->name;
                $userEmail = $targetUser->email;
            }

            // Base query for user's own activity (active logs without arbitrary 30-day cutoff)
            $baseQuery = Activity::whereNull('properties->deleted_at')
                                 ->where(function ($q) use ($userId, $userName, $userEmail) {
                                     $q->where('causer_id', $userId)
                                       ->orWhere('properties->user_id', $userId)
                                       ->orWhere('properties->user_id', (string)$userId)
                                       ->orWhere('properties->causer_id', $userId)
                                       ->orWhere('properties->teacher_id', $userId)
                                       ->orWhere('properties->faculty_id', $userId)
                                       ->orWhere('properties->marked_by', 'like', "%{$userName}%")
                                       ->orWhere('properties->actor_name', 'like', "%{$userName}%")
                                       ->orWhere('properties->user_name', 'like', "%{$userName}%")
                                       ->orWhere('properties->teacher_name', 'like', "%{$userName}%")
                                       ->orWhere('properties->faculty_name', 'like', "%{$userName}%")
                                       ->orWhere('properties->user_email', 'like', "%{$userEmail}%")
                                       ->orWhere('description', 'like', "%{$userName}%");
                                 });
            $baseQuery = $this->applyExclusions($baseQuery);

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
            }
            if (!$lastLogin) {
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

            if (!$this->isAdmin($user)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $resultsQuery = Activity::selectRaw('causer_id, causer_type, COUNT(*) as action_count, MAX(created_at) as last_active')
                ->whereNotNull('causer_type')
                ->whereNotNull('causer_id')
                ->whereNull('properties->deleted_at');
            $resultsQuery = $this->applyExclusions($resultsQuery);

            $results = $resultsQuery->groupBy('causer_id', 'causer_type')
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
     * Retrieve a summary of daily activity counts.
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

            $isAdmin = $this->isAdmin($user);

            $query = Activity::selectRaw("
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN event='created' THEN 1 ELSE 0 END) as created_count,
                SUM(CASE WHEN event='updated' THEN 1 ELSE 0 END) as updated_count,
                SUM(CASE WHEN event='deleted' THEN 1 ELSE 0 END) as deleted_count,
                SUM(CASE WHEN event='login' THEN 1 ELSE 0 END) as login_count
            ")
            ->whereNull('properties->deleted_at');

            $query = $this->applyExclusions($query);

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
            @set_time_limit(180);
            @ini_set('memory_limit', '512M');

            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            if (!$this->isAdmin($user)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $cutoff = Carbon::now()->subDays(30);
            $targetDate = Carbon::now()->subDays(31);
            $now = Carbon::now();
            $affected = 0;

            try {
                $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
                if ($driver === 'mysql' || $driver === 'mariadb') {
                    $affected = \Illuminate\Support\Facades\DB::update("
                        UPDATE activity_log 
                        SET properties = JSON_SET(
                                CASE 
                                    WHEN properties IS NULL OR properties = '' OR properties = 'null' THEN '{}'
                                    ELSE properties 
                                END,
                                '$.original_created_at', DATE_FORMAT(created_at, '%Y-%m-%dT%T.000000Z'),
                                '$.deleted_at', ?
                            ),
                            created_at = ?
                        WHERE created_at >= ?
                    ", [$now->toIso8601String(), $targetDate->toDateTimeString(), $cutoff->toDateTimeString()]);
                } else {
                    throw new \Exception("Fallback to Eloquent");
                }
            } catch (\Throwable $dbEx) {
                // Fallback to chunked Eloquent update
                $affected = 0;
                Activity::where('created_at', '>=', $cutoff)
                    ->chunkById(250, function ($logs) use (&$affected, $now, $targetDate) {
                        foreach ($logs as $log) {
                            $log->timestamps = false;
                            $props = $log->properties ? (is_array($log->properties) ? $log->properties : (is_object($log->properties) && method_exists($log->properties, 'toArray') ? $log->properties->toArray() : [])) : [];
                            $props['original_created_at'] = $log->created_at ? Carbon::parse($log->created_at)->toIso8601String() : $now->toIso8601String();
                            $props['deleted_at'] = $now->toIso8601String();
                            $log->properties = $props;
                            $log->created_at = $targetDate;
                            $log->saveQuietly();
                            $affected++;
                        }
                    });
            }

            // Log the action itself after clearing
            try {
                activity()
                    ->causedBy($user)
                    ->withProperties([
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ])
                    ->event('deleted')
                    ->log('Cleared all active activity logs (moved to Recycle Bin)');
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => "All active activity logs ({$affected}) moved to Recycle Bin successfully."
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
            if (!$user || !$this->isAdmin($user)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $log = Activity::findOrFail($id);
            
            $originalCreatedAt = $log->getCustomProperty('original_created_at');

            // If it doesn't have original_created_at OR the original date is older than 30 days ago, it cannot be restored!
            if (!$originalCreatedAt || Carbon::parse($originalCreatedAt)->lt(Carbon::now()->subDays(30))) {
                return response()->json([
                    'success' => false,
                    'error' => "Can't restore the logs. Logs in the 30 to 60 days span cannot be restored."
                ], 400);
            }

            // Restore: set created_at back to original_created_at and remove properties
            $log->timestamps = false;
            $log->created_at = Carbon::parse($originalCreatedAt);
            $log->forgetCustomProperty('original_created_at');
            $log->forgetCustomProperty('deleted_at');
            $log->saveQuietly();

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
            if (!$user || !$this->isAdmin($user)) {
                return response()->json(['error' => 'Forbidden'], 403);
            }

            $log = Activity::findOrFail($id);
            
            // Check if log is active (< 30 days old)
            $createdAt = $log->created_at ? Carbon::parse($log->created_at) : Carbon::now();
            $is_active = $createdAt->gte(Carbon::now()->subDays(30));

            if ($is_active) {
                // Move to recycle bin (set created_at to 31 days ago, saving original_created_at)
                $log->timestamps = false;
                $log->setCustomProperty('original_created_at', $createdAt->toIso8601String());
                $log->setCustomProperty('deleted_at', Carbon::now()->toIso8601String());
                $log->created_at = Carbon::now()->subDays(31);
                $log->saveQuietly();

                return response()->json([
                    'success' => true,
                    'message' => 'Activity log transferred to Recycle Bin.'
                ]);
            } else {
                // Permanently delete from database
                $log->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Activity log permanently deleted.'
                ]);
            }
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete activity log: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exclude backend events, system setting and internal telemetry logs from query results.
     */
    private function applyExclusions($query)
    {
        return $query->where(function ($q) {
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
        ->where('description', 'not like', '%invalidate-cache%');
    }
}
