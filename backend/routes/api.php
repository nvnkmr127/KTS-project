<?php

use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Api\ActivityLogApiController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\BiometricWebhookController;
use App\Http\Controllers\Api\CollegeAdminDashboardController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('/api/dashboard/my-payment-data', [CollegeAdminDashboardController::class, 'getMyPaymentData']);
    Route::get('/api/dashboard/my-activities', [CollegeAdminDashboardController::class, 'getMyActivitiesApi']);
    Route::get('/api/dashboard/attendance-data', [CollegeAdminDashboardController::class, 'getAttendanceData']);
    Route::get('/admin/reports/my-payments/export', [App\Http\Controllers\Admin\ComponentPaymentController::class, 'exportMyPayments']);

    Route::get('/dashboard/my-payment-data', [CollegeAdminDashboardController::class, 'getMyPaymentData']);
    Route::get('/dashboard/my-activities', [CollegeAdminDashboardController::class, 'getMyActivitiesApi']);
    Route::get('/dashboard/attendance-data', [CollegeAdminDashboardController::class, 'getAttendanceData']);
});

use App\Http\Controllers\Api\GenericApiController;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

Route::post('/v1/login', function(Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        // Log failed login attempt for admin audit visibility
        try {
            activity()
                ->withProperties([
                    'attempted_email' => $request->email,
                    'ip_address'      => $request->ip(),
                    'user_agent'      => substr($request->userAgent() ?? '', 0, 200),
                    'reason'          => 'Invalid credentials',
                ])
                ->log('Failed login attempt for ' . $request->email);

            // Also update the failed_login_count on the user record if user exists
            if ($user) {
                $user->increment('failed_login_count');
            }
        } catch (\Throwable $e) {
            // Never let audit logging break the login flow
        }

        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    if (strtolower($user->status) === 'inactive') {
        // Log failed login for inactive account
        try {
            activity()
                ->causedBy($user)
                ->withProperties([
                    'attempted_email' => $request->email,
                    'ip_address'      => $request->ip(),
                    'user_agent'      => substr($request->userAgent() ?? '', 0, 200),
                    'reason'          => 'Account inactive',
                ])
                ->log('Failed login attempt for ' . $request->email . ' (account inactive)');
        } catch (\Throwable $e) {
            // Never let audit logging break the login flow
        }

        return response()->json(['error' => 'Account is inactive, contact admin.'], 403);
    }

    $initials = collect(explode(' ', $user->name))->map(fn($n) => $n[0] ?? '')->join('');
    
    $role = 'admin';
    $designation = $user->hasRole('super-admin') ? 'Super Admin' : 'Staff Member';
    $subject = 'All';
    $classes = [];

    if ($user->hasRole('faculty') || $user->hasRole('teacher')) {
        $role = 'teacher';
        $designation = $user->department ?? 'Senior Teacher';
        
        $sub = $user->subjects()->first();
        $subject = $sub ? $sub->name : 'Academics';
        
        // Get classes from timetable assignments
        $timetableClasses = $user->assignedBatches()->pluck('name')->toArray();
        
        // Also get classes where user is assigned as class teacher
        $classTeacherBatches = \App\Models\Batch::where('class_teacher_id', $user->id)->pluck('name')->toArray();
        
        // Get classes where user is a substitute today
        $substituteBatches = \App\Models\SubstituteAssignment::where('substitute_user_id', $user->id)
            ->whereDate('assignment_date', \Carbon\Carbon::today()->toDateString())
            ->where('status', 'assigned')
            ->with('timetable.batch')
            ->get()
            ->pluck('timetable.batch.name')
            ->filter()
            ->toArray();
            
        // Merge and deduplicate
        $classes = array_values(array_unique(array_merge($timetableClasses, $classTeacherBatches, $substituteBatches)));
    }

    // Log successful login
    try {
        activity()
            ->causedBy($user)
            ->withProperties([
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 200),
            ])
            ->event('login')
            ->log('login success');
    } catch (\Throwable $e) {
        // Safe fallback
    }

    return response()->json([
        'token' => $user->createToken('API Token')->plainTextToken,
        'user' => [
            'id' => (string)$user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $role,
            'initials' => $initials,
            'designation' => $designation,
            'subject' => $subject,
            'classes' => $classes,
        ]
    ]);
});

Route::prefix('v1')->group(function () {
    Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
        $user = $request->user();

        if (strtolower($user->status) === 'inactive') {
            return response()->json(['error' => 'Account is inactive, contact admin.'], 403);
        }
        
        $initials = collect(explode(' ', $user->name))->map(fn($n) => $n[0] ?? '')->join('');
        
        $role = 'admin';
        $designation = $user->hasRole('super-admin') ? 'Super Admin' : 'Staff Member';
        $subject = 'All';
        $classes = [];

        if ($user->hasRole('faculty') || $user->hasRole('teacher')) {
            $role = 'teacher';
            $designation = $user->department ?? 'Senior Teacher';
            
            $sub = $user->subjects()->first();
            $subject = $sub ? $sub->name : 'Academics';
            
            // Get classes from timetable assignments
            $timetableClasses = $user->assignedBatches()->pluck('name')->toArray();
            
            // Also get classes where user is assigned as class teacher
            $classTeacherBatches = \App\Models\Batch::where('class_teacher_id', $user->id)->pluck('name')->toArray();
            
            // Get classes where user is a substitute today
            $substituteBatches = \App\Models\SubstituteAssignment::where('substitute_user_id', $user->id)
                ->whereDate('assignment_date', \Carbon\Carbon::today()->toDateString())
                ->where('status', 'assigned')
                ->with('timetable.batch')
                ->get()
                ->pluck('timetable.batch.name')
                ->filter()
                ->toArray();
                
            // Merge and deduplicate
            $classes = array_values(array_unique(array_merge($timetableClasses, $classTeacherBatches, $substituteBatches)));
        }

        return response()->json([
            'user' => [
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
                'initials' => $initials,
                'designation' => $designation,
                'subject' => $subject,
                'classes' => $classes,
            ]
        ]);
    });

    Route::get('/resources/{resource}', [GenericApiController::class, 'index']);
    Route::get('/resources/{resource}/{id}', [GenericApiController::class, 'show']);
    Route::post('/resources/{resource}', [GenericApiController::class, 'store']);
    Route::post('/resources/{resource}/bulk', [GenericApiController::class, 'bulkStore']);
    Route::put('/resources/{resource}/{id}', [GenericApiController::class, 'update']);
    Route::delete('/resources/{resource}/{id}', [GenericApiController::class, 'destroy']);

    // Webhook management API endpoints
    Route::get('/webhooks/stats', [\App\Http\Controllers\Admin\WebhookController::class, 'getStatsApi']);
    Route::get('/webhooks/events', [\App\Http\Controllers\Admin\WebhookController::class, 'getEventsApi']);
    Route::post('/webhooks/{webhook}/toggle', [\App\Http\Controllers\Admin\WebhookController::class, 'toggle'])->where('webhook', '[0-9]+');
    Route::post('/webhooks/{webhook}/test', [\App\Http\Controllers\Admin\WebhookController::class, 'test'])->where('webhook', '[0-9]+');
    Route::post('/webhooks/{webhook}/regenerate-secret', [\App\Http\Controllers\Admin\WebhookController::class, 'regenerateSecret'])->where('webhook', '[0-9]+');
    Route::get('/webhooks/{webhook}/calls', [\App\Http\Controllers\Admin\WebhookController::class, 'getCallsApi'])->where('webhook', '[0-9]+');
    Route::post('/webhooks/test-daily-summary', [\App\Http\Controllers\Admin\WebhookController::class, 'testDailySummary']);
    Route::post('/webhooks/send-daily-summary', [\App\Http\Controllers\Admin\WebhookController::class, 'sendDailySummary']);
    Route::post('/webhooks/calls/{call}/replay', [\App\Http\Controllers\Admin\WebhookController::class, 'replay'])->where('call', '[0-9]+');
});

// Health check endpoints
Route::get('/ping', function () {
    // Proactively seed academic years if missing
    try {
        if (\Schema::hasTable('academic_years') && \App\Models\AcademicYear::count() < 4) {
            $years = [
                ['name' => '2023-2024', 'start_date' => '2023-04-01', 'end_date' => '2024-03-31', 'is_current' => false],
                ['name' => '2024-2025', 'start_date' => '2024-04-01', 'end_date' => '2025-03-31', 'is_current' => false],
                ['name' => '2025-2026', 'start_date' => '2025-04-01', 'end_date' => '2026-03-31', 'is_current' => false],
                ['name' => '2026-2027', 'start_date' => '2026-04-01', 'end_date' => '2027-03-31', 'is_current' => true],
            ];
            foreach ($years as $yr) {
                \App\Models\AcademicYear::updateOrCreate(['name' => $yr['name']], $yr);
            }
        }
    } catch (\Exception $e) {
        // Silently catch database or missing model exceptions
    }

    return response()->json([
        'status' => 'success',
        'message' => 'PONG',
        'timestamp' => now(),
        'server_time' => date('Y-m-d H:i:s'),
    ]);
});

Route::get('/test', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API is working',
        'timestamp' => now(),
        'server_time' => date('Y-m-d H:i:s'),
    ]);
});

// Debug endpoint - SECURED: Only available in local environment with authentication
Route::middleware(['auth:sanctum', 'throttle:10,1'])->group(function () {
    Route::any('/debug-realtime', function (Request $request) {
        // Only allow in local environment
        if (! app()->environment('local')) {
            abort(404);
        }

        // Only allow super-admin users
        if (! $request->user() || ! $request->user()->hasRole('super-admin')) {
            abort(403, 'Unauthorized access to debug endpoint');
        }

        \Log::info('=== DEBUG REALTIME ENDPOINT ===', [
            'timestamp' => now(),
            'method' => $request->method(),
            'user_id' => $request->user()->id,
            'ip' => $request->ip(),
            // Removed sensitive data logging
        ]);

        return response()->json([
            'Result' => 'OK',
            'Status' => 'Debug endpoint working (secured)',
            'timestamp' => now(),
            'method' => $request->method(),
            'environment' => app()->environment(),
        ]);
    });
});

// ETimeOffice Webhook Routes - No authentication required for webhook endpoints
Route::prefix('etimeoffice')->group(function () {
    // Primary ETimeOffice webhook endpoint
    Route::post('/webhook', [BiometricWebhookController::class, 'handleETimeOffice'])
        ->name('api.etimeoffice.webhook');

    // Alternative endpoint names for ETimeOffice compatibility
    Route::post('/attendance', [BiometricWebhookController::class, 'handleETimeOffice'])
        ->name('api.etimeoffice.attendance');

    Route::post('/punch-data', [BiometricWebhookController::class, 'handleETimeOffice'])
        ->name('api.etimeoffice.punch-data');
});

// Legacy biometric webhook - redirects to ETimeOffice (for backward compatibility)
Route::post('/biometric/webhook', [BiometricWebhookController::class, 'handleBiometric'])
    ->name('api.biometric.webhook.legacy');

// Deprecated endpoints - return 410 Gone
Route::post('/biometric/realtime', [BiometricWebhookController::class, 'handleRealtime'])
    ->name('api.biometric.realtime.deprecated');

/*
|--------------------------------------------------------------------------
| Public Webhook Routes (No Authentication Required)
|--------------------------------------------------------------------------
*/

Route::prefix('webhooks')->group(function () {
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::post('/external-leads', [WebhookController::class, 'handleExternalLeads'])->name('api.webhooks.external-leads');
});

// Dynamic Inbound Webhooks (V1)
Route::prefix('v1/webhooks')->group(function () {
    Route::post('/{slug}', [\App\Http\Controllers\Api\InboundWebhookController::class, 'handle'])->name('api.v1.webhooks.dynamic');
});

// Attendance route without conflicting middleware
Route::post('/attendance', [AttendanceController::class, 'store'])->name('api.attendance.store');

/*
|--------------------------------------------------------------------------
| Protected API Routes (Require Authentication)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'throttle:60,1'])->prefix('v1')->group(function () {
    // Global search endpoint
    Route::get('/search', [GlobalSearchController::class, 'search']);

    // Course-related endpoints
    Route::get('/courses/{course}/terms', function (App\Models\Course $course) {
        return response()->json($course->terms);
    });

    // User profile endpoint
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', function (Request $request) {
        $user = $request->user();
        if ($user) {
            try {
                // Revoke current token
                $request->user()->currentAccessToken()->delete();
            } catch (\Throwable $e) {}

            try {
                // Log activity log
                activity()
                    ->causedBy($user)
                    ->withProperties([
                        'ip_address' => $request->ip(),
                        'user_agent' => substr($request->userAgent() ?? '', 0, 200),
                    ])
                    ->event('logout')
                    ->log('Signed out');
            } catch (\Throwable $e) {}
        }
        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    });

    // ── Activity Logs ────────────────────────────────────────────────────
    Route::get('/activity-logs', [App\Http\Controllers\Api\ActivityLogApiController::class, 'index']);
    Route::get('/activity-logs/my-stats', [App\Http\Controllers\Api\ActivityLogApiController::class, 'myStats']);
    Route::get('/activity-logs/users', [App\Http\Controllers\Api\ActivityLogApiController::class, 'users']);
    Route::get('/activity-logs/summary', [App\Http\Controllers\Api\ActivityLogApiController::class, 'summary']);
    Route::post('/activity-logs/clear', [App\Http\Controllers\Api\ActivityLogApiController::class, 'clear']);
    Route::post('/activity-logs/{id}/restore', [App\Http\Controllers\Api\ActivityLogApiController::class, 'restore']);
    Route::delete('/activity-logs/{id}', [App\Http\Controllers\Api\ActivityLogApiController::class, 'destroy']);



    // Substitute assignment endpoints
    Route::prefix('substitutes')->group(function () {
        Route::get('/staff', [\App\Http\Controllers\Api\SubstituteController::class, 'getStaff']);
        Route::get('/schedule', [\App\Http\Controllers\Api\SubstituteController::class, 'getSchedule']);
        Route::get('/available', [\App\Http\Controllers\Api\SubstituteController::class, 'getAvailableSubstitutes']);
        Route::post('/assign', [\App\Http\Controllers\Api\SubstituteController::class, 'assignSubstitute']);
    });

    // Student search endpoints - more restrictive rate limiting for search
    Route::middleware('throttle:30,1')->group(function () {
        Route::get('/students/search', [\App\Http\Controllers\Api\StudentController::class, 'search']);
    });

    Route::get('/students/{student}', [\App\Http\Controllers\Api\StudentController::class, 'show']);

    // Attendance API endpoints - sensitive data with tighter rate limiting
    Route::prefix('attendance')->name('api.attendance.')->middleware('throttle:100,1')->group(function () {
        Route::get('/today', [AttendanceController::class, 'getTodayAttendance'])->name('today');
        Route::get('/student/{student}', [AttendanceController::class, 'getStudentAttendance'])->name('student');
        Route::get('/batch/{batch}', [AttendanceController::class, 'getBatchAttendance'])->name('batch');
        Route::get('/batch/{batch}/student-percentages', [AttendanceController::class, 'getBatchStudentPercentages'])->name('batch.student-percentages');

        // Real-time endpoints need more restrictive limits
        Route::middleware('throttle:30,1')->group(function () {
            Route::get('/realtime', [AttendanceController::class, 'getRealTimeData'])->name('realtime');
            Route::get('/live-feed', [AttendanceController::class, 'getLiveFeed'])->name('live-feed');
        });

        Route::get('/stats/today', [AttendanceController::class, 'getTodayStats'])->name('stats.today');
        Route::get('/stats/weekly', [AttendanceController::class, 'getWeeklyStats'])->name('stats.weekly');
        Route::get('/stats/monthly', [AttendanceController::class, 'getMonthlyStats'])->name('stats.monthly');
    });
});

// ── Millitrack GPS Bus Tracking Proxy ────────────────────────────────────
// Accessible without auth:sanctum middleware to support local demo-token logins.
// Credentials live securely in the Laravel .env and are never exposed.
Route::prefix('v1/bus')->name('api.bus.')->group(function () {
    // List all buses in the fleet (no external call)
    Route::get('/fleet', [\App\Http\Controllers\Api\MillitrackProxyController::class, 'getFleet'])
        ->name('fleet');

    // Live positions for ALL buses (concurrent Http::pool fetch)
    Route::get('/positions', [\App\Http\Controllers\Api\MillitrackProxyController::class, 'getAllPositions'])
        ->name('positions');

    // Live position for a single bus, e.g. /bus/positions/TS07UP2292
    Route::get('/positions/{busNumber}', [\App\Http\Controllers\Api\MillitrackProxyController::class, 'getPosition'])
        ->name('position');
});


/*
|--------------------------------------------------------------------------
| Dashboard Builder API Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| API Routes for Notifications
|--------------------------------------------------------------------------
*/

// API routes with token authentication
Route::middleware(['auth:sanctum'])->prefix('notifications')->name('api.notifications.')->group(function () {
    Route::get('/unread-count', [NotificationController::class, 'getUnreadCount'])->name('unread-count');
    Route::get('/', [NotificationController::class, 'index'])->name('index');
    Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('mark-read');
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
    Route::get('/preferences', [NotificationController::class, 'preferences'])->name('preferences');
    Route::post('/preferences', [NotificationController::class, 'updatePreferences'])->name('preferences.update');
});

// Fallback API routes with session authentication for web interface
Route::middleware(['auth', 'web'])->prefix('api/notifications')->name('api.notifications.web.')->group(function () {
    Route::get('/unread-count', [NotificationController::class, 'getUnreadCount'])->name('unread-count');
    Route::get('/', [NotificationController::class, 'index'])->name('index');
    Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('mark-read');
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
});

Route::middleware(['auth', 'web'])->prefix('notifications')->name('api.notifications.web2.')->group(function () {
    Route::get('/unread-count', [NotificationController::class, 'getUnreadCount'])->name('unread-count');
    Route::get('/', [NotificationController::class, 'index'])->name('index');
    Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('mark-read');
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
});

// Developer Seed & Clear Routes (Public for local dev/testing without active session token restrictions)
Route::prefix('v1')->group(function () {

    Route::post('/dev/seed-mock-data', function() {
        try {
            if (function_exists('opcache_reset')) {
                opcache_reset();
            }

            // Run all outstanding migrations to ensure tables (like alumni) exist
            \Illuminate\Support\Facades\Artisan::call('migrate');

            // Programmatically run schema alter to ensure academic_year_id column exists
            if (\Illuminate\Support\Facades\Schema::hasTable('fee_structures') && !\Illuminate\Support\Facades\Schema::hasColumn('fee_structures', 'academic_year_id')) {
                \Illuminate\Support\Facades\Schema::table('fee_structures', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->foreignId('academic_year_id')
                        ->nullable()
                        ->constrained('academic_years')
                        ->onDelete('cascade');
                });
            }

            // Programmatically run schema alter to ensure is_half_day column exists in leave_applications
            if (\Illuminate\Support\Facades\Schema::hasTable('leave_applications') && !\Illuminate\Support\Facades\Schema::hasColumn('leave_applications', 'is_half_day')) {
                \Illuminate\Support\Facades\Schema::table('leave_applications', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->boolean('is_half_day')->default(false)->after('status');
                });
            }

            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\MockDataSeeder']);
            return response()->json(['success' => true, 'message' => 'Mock data seeded successfully!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    });

    Route::post('/dev/clear-mock-data', function() {
        try {
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--seed' => true]);
            return response()->json(['success' => true, 'message' => 'Database reset successfully for handover!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    });
});
