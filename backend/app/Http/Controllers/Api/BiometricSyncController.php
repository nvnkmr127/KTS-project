<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Attendance\BiometricLog;
use App\Models\Setting;
use App\Services\ETimeOfficeService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BiometricSyncController extends Controller
{
    private ETimeOfficeService $etimeoffice;

    public function __construct(ETimeOfficeService $etimeoffice)
    {
        $this->etimeoffice = $etimeoffice;
    }

    /**
     * Get current biometric sync status and configuration.
     *
     * GET /api/v1/biometric/status
     */
    public function status()
    {
        try {
            $stats = $this->etimeoffice->getComprehensiveStats();

            return response()->json([
                'configured'      => $stats['configuration']['valid'] ?? false,
                'issues'          => $stats['configuration']['issues'] ?? [],
                'api_url'         => $stats['configuration']['api_url'] ?? null,
                'corporate_id'    => $stats['configuration']['corporate_id'] ?? null,
                'username'        => $stats['configuration']['username'] ?? null,
                'last_sync'       => $stats['sync_stats']['last_sync_time'] ?? null,
                'last_record'     => $stats['sync_stats']['last_sync_record'] ?? null,
                'today_records'   => $stats['today_records'] ?? 0,
                'week_records'    => $stats['this_week_records'] ?? 0,
            ]);
        } catch (\Exception $e) {
            Log::error('BiometricSyncController::status error', ['error' => $e->getMessage()]);
            return response()->json([
                'configured' => false,
                'issues'     => ['Unable to load configuration: ' . $e->getMessage()],
            ]);
        }
    }

    /**
     * Test connection to the e-TimeOffice API.
     * Optionally accepts credentials via query params to test before saving.
     *
     * GET /api/v1/biometric/test-connection
     * Query: corporate_id, username, password (optional overrides)
     */
    public function testConnection(Request $request)
    {
        try {
            $result = $this->etimeoffice->testConnection();

            if ($result['success']) {
                Setting::updateOrCreate(['key' => 'etimeoffice_last_test'], ['value' => now()->toISOString()]);
            }

            return response()->json([
                'connected'   => $result['success'],
                'message'     => $result['message'] ?? ($result['success'] ? 'Connection successful' : 'Connection failed'),
                'data_count'  => $result['data_count'] ?? 0,
                'tested_at'   => now()->toISOString(),
            ], $result['success'] ? 200 : 422);

        } catch (\Exception $e) {
            Log::error('BiometricSyncController::testConnection error', ['error' => $e->getMessage()]);
            return response()->json([
                'connected' => false,
                'message'   => 'Connection error: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Sync IN/OUT attendance data for a date range.
     * Uses DownloadInOutPunchData — returns INTime, OUTTime, WorkTime, Status, etc.
     *
     * GET /api/v1/biometric/sync/in-out
     * Query: empcode (default ALL), from_date (YYYY-MM-DD), to_date (YYYY-MM-DD)
     */
    public function syncInOut(Request $request)
    {
        $request->validate([
            'from_date' => 'nullable|date_format:Y-m-d',
            'to_date'   => 'nullable|date_format:Y-m-d',
            'empcode'   => 'nullable|string',
        ]);

        $empcode  = $request->input('empcode', 'ALL');
        $fromDate = Carbon::parse($request->input('from_date', now()->format('Y-m-d')))->startOfDay();
        $toDate   = Carbon::parse($request->input('to_date',   now()->format('Y-m-d')))->endOfDay();

        // Validate configuration first
        $validation = $this->etimeoffice->validateConfiguration();
        if (!$validation['valid']) {
            return response()->json([
                'success' => false,
                'message' => 'Biometric credentials not configured: ' . implode(', ', $validation['issues']),
                'data'    => [],
            ], 200);
        }

        try {
            // Allow up to 35s so the external e-TimeOffice API (25s timeout) can
            // complete without the server killing the connection first.
            set_time_limit(35);

            Log::info('BiometricSyncController: syncInOut', [
                'from'    => $fromDate->toDateString(),
                'to'      => $toDate->toDateString(),
                'empcode' => $empcode,
            ]);

            $result = $this->etimeoffice->fetchInOutPunchData($fromDate, $toDate, $empcode);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Sync failed',
                    'data'    => [],
                ], 400);
            }

            $punchRecords = $result['data'] ?? [];

            // Store into biometric_logs for caching/history
            $saved = $this->saveInOutRecords($punchRecords);

            // Update last sync timestamp
            Setting::updateOrCreate(
                ['key' => 'etimeoffice_last_sync'],
                ['value' => now()->toISOString()]
            );

            return response()->json([
                'success'        => true,
                'message'        => "Synced {$saved} attendance records from e-TimeOffice",
                'synced_at'      => now()->toISOString(),
                'total_received' => count($punchRecords),
                'saved'          => $saved,
                'data'           => $punchRecords,
            ]);

        } catch (\Exception $e) {
            Log::error('BiometricSyncController: syncInOut exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
                'data'    => [],
            ], 400);
        }
    }

    /**
     * Sync raw punch data for a date range using DownloadPunchData.
     *
     * GET /api/v1/biometric/sync/punch
     */
    public function syncPunch(Request $request)
    {
        $request->validate([
            'from_date' => 'nullable|date_format:Y-m-d',
            'to_date'   => 'nullable|date_format:Y-m-d',
            'empcode'   => 'nullable|string',
        ]);

        $empcode  = $request->input('empcode', 'ALL');
        $fromDate = Carbon::parse($request->input('from_date', now()->format('Y-m-d')))->startOfDay();
        $toDate   = Carbon::parse($request->input('to_date',   now()->format('Y-m-d')))->endOfDay();

        $validation = $this->etimeoffice->validateConfiguration();
        if (!$validation['valid']) {
            return response()->json([
                'success' => false,
                'message' => 'Biometric credentials not configured.',
                'data'    => [],
            ], 200);
        }

        try {
            // Allow up to 35s so the external e-TimeOffice API (25s timeout) can
            // complete without the server killing the connection first.
            set_time_limit(35);

            $result = $this->etimeoffice->fetchPunchData($fromDate, $toDate, $empcode);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Sync failed',
                    'data'    => [],
                ], 400);
            }

            $punchRecords = $result['data'] ?? [];

            // Save raw punches to biometric_logs
            $saved = 0;
            foreach ($punchRecords as $record) {
                try {
                    $empCode      = $record['Empcode'] ?? null;
                    $punchDateStr = isset($record['PunchDate']) ? trim($record['PunchDate']) : null;
                    if (!$empCode || !$punchDateStr) continue;

                    // DownloadPunchData usually returns a combined "dd/MM/yyyy HH:mm:ss" value.
                    // Only append a separate PunchTime when PunchDate has no time of its own —
                    // the old code appended it unconditionally, corrupting the already-complete
                    // datetime and silently dropping every raw punch (scan_datetime -> 00:00:00
                    // or a parse failure). Replace slashes with dashes so Carbon reads it as
                    // day-month-year (Indian format), not month-day-year.
                    if (!preg_match('/\d{1,2}:\d{2}/', $punchDateStr) && !empty($record['PunchTime'])) {
                        $punchDateStr .= ' ' . $record['PunchTime'];
                    }
                    $carbonDate = Carbon::parse(str_replace('/', '-', $punchDateStr));
                    
                    $student = $this->etimeoffice->findStudentByBiometricCode($empCode);
                    $staff = null;
                    if (!$student) {
                        $staff = \App\Models\User::whereHas('roles', function ($q) {
                            $q->whereIn('name', ['staff', 'faculty', 'teacher']);
                        })->where('biometric_employee_code', $empCode)->first() ??
                        \App\Models\User::whereHas('roles', function ($q) {
                            $q->whereIn('name', ['staff', 'faculty', 'teacher']);
                        })->where('id', $empCode)->first();
                    }
                    
                    if (!$student && !$staff) {
                        continue;
                    }
                    
                    BiometricLog::updateOrCreate(
                        ['employee_code' => $empCode, 'scan_datetime' => $carbonDate],
                        [
                            'device_id'        => 'etimeoffice-pull',
                            'scan_type'        => 'unknown',
                            'processed'        => true,
                            'sync_status'      => 'success',
                            'status'           => 'processed',
                            'processing_notes' => 'Raw punch sync' . ($staff ? " | Staff punch for: {$staff->name}" : ''),
                            'raw_data'         => $record,
                            'student_id'       => $student ? $student->id : null,
                        ]
                    );
                    $saved++;
                } catch (\Exception $e) {
                    Log::warning('BiometricSync: failed to save punch record', ['error' => $e->getMessage()]);
                }
            }

            Setting::updateOrCreate(['key' => 'etimeoffice_last_sync'], ['value' => now()->toISOString()]);

            return response()->json([
                'success'   => true,
                'message'   => "Synced {$saved} punch records from e-TimeOffice",
                'synced_at' => now()->toISOString(),
                'saved'     => $saved,
                'data'      => $punchRecords,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
                'data'    => [],
            ], 400);
        }
    }

    /**
     * Incremental sync using DownloadLastPunchData cursor.
     *
     * GET /api/v1/biometric/sync/incremental
     * Query: empcode (default ALL), reset (bool)
     */
    public function syncIncremental(Request $request)
    {
        $empcode = $request->input('empcode', 'ALL');
        $reset   = $request->boolean('reset', false);

        $validation = $this->etimeoffice->validateConfiguration();
        if (!$validation['valid']) {
            return response()->json([
                'success' => false,
                'message' => 'Biometric credentials not configured.',
                'data'    => [],
            ], 200);
        }

        // Optionally reset cursor
        if ($reset) {
            Setting::updateOrCreate(
                ['key' => 'etimeoffice_last_sync_record'],
                ['value' => now()->format('m') . now()->format('Y') . '$0']
            );
        }

        try {
            $result = $this->etimeoffice->fetchIncrementalData();

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Incremental sync failed',
                    'data'    => [],
                ], 400);
            }

            $punchRecords = $result['data'] ?? [];
            $saved = 0;
            foreach ($punchRecords as $record) {
                try {
                    $empCode      = $record['Empcode'] ?? null;
                    $punchDateStr = $record['PunchDate'] ?? null;
                    $name         = $record['Name'] ?? null;
                    $mcid         = $record['mcid'] ?? $record['ID'] ?? null;
                    if (!$empCode || !$punchDateStr) continue;

                    $carbonDate = Carbon::parse(str_replace('/', '-', $punchDateStr));
                    
                    $student = $this->etimeoffice->findStudentByBiometricCode($empCode);
                    $staff = null;
                    if (!$student) {
                        $staff = \App\Models\User::whereHas('roles', function ($q) {
                            $q->whereIn('name', ['staff', 'faculty', 'teacher']);
                        })->where('biometric_employee_code', $empCode)->first() ??
                        \App\Models\User::whereHas('roles', function ($q) {
                            $q->whereIn('name', ['staff', 'faculty', 'teacher']);
                        })->where('id', $empCode)->first();
                    }
                    
                    if (!$student && !$staff) {
                        continue;
                    }
                    
                    BiometricLog::updateOrCreate(
                        ['employee_code' => $empCode, 'scan_datetime' => $carbonDate],
                        [
                            'device_id'        => $mcid ? "etimeoffice-machine-{$mcid}" : 'etimeoffice-incremental',
                            'scan_type'        => 'unknown',
                            'processed'        => true,
                            'sync_status'      => 'success',
                            'status'           => 'processed',
                            'processing_notes' => "Incremental | Name:{$name} | MCID:{$mcid}" . ($staff ? " | Staff punch for: {$staff->name}" : ''),
                            'raw_data'         => $record,
                            'student_id'       => $student ? $student->id : null,
                        ]
                    );
                    $saved++;
                } catch (\Exception $e) {
                    Log::warning('BiometricSync: incremental record save failed', ['error' => $e->getMessage()]);
                }
            }

            Setting::updateOrCreate(['key' => 'etimeoffice_last_sync'], ['value' => now()->toISOString()]);

            return response()->json([
                'success'     => true,
                'message'     => "Incremental sync: {$saved} new records",
                'synced_at'   => now()->toISOString(),
                'saved'       => $saved,
                'last_record' => $result['last_record'] ?? null,
                'max_record'  => $result['new_max_record'] ?? null,
                'data'        => $punchRecords,
            ]);

        } catch (\Exception $e) {
            Log::error('BiometricSyncController: syncIncremental exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Incremental sync failed: ' . $e->getMessage(),
                'data'    => [],
            ], 400);
        }
    }

    /**
     * Save biometric credentials from the Settings UI.
     *
     * POST /api/v1/biometric/credentials
     */
    public function saveCredentials(Request $request)
    {
        $request->validate([
            'corporate_id' => 'required|string|max:100',
            'username'     => 'required|string|max:100',
            'password'     => 'required|string|max:200',
        ]);

        Setting::updateOrCreate(['key' => 'etimeoffice_corporate_id'], ['value' => $request->corporate_id]);
        Setting::updateOrCreate(['key' => 'etimeoffice_username'], ['value' => $request->username]);
        Setting::updateOrCreate(['key' => 'etimeoffice_password'], ['value' => $request->password]);

        Log::info('BiometricSyncController: saveCredentials actually saved credentials to database.');

        return response()->json([
            'success' => true,
            'message' => 'Biometric credentials saved successfully.',
        ]);
    }

    /**
     * Reset the incremental sync cursor.
     *
     * POST /api/v1/biometric/reset-cursor
     */
    public function resetCursor()
    {
        Setting::updateOrCreate(
            ['key' => 'etimeoffice_last_sync_record'],
            ['value' => now()->format('m') . now()->format('Y') . '$0']
        );

        return response()->json([
            'success' => true,
            'message' => 'Sync cursor reset to beginning of current month.',
        ]);
    }

    /**
     * Save IN/OUT records to biometric_logs table.
     */
    private function saveInOutRecords(array $punchRecords): int
    {
        $saved = 0;
        foreach ($punchRecords as $record) {
            try {
                $dateStr  = $record['DateString'] ?? $record['PunchDate'] ?? $record['LogDateTime'] ?? $record['Date'] ?? null; // dd/MM/yyyy
                $empCode  = $record['Empcode'] ?? null;
                $inTime   = $record['INTime'] ?? '--:--';
                $outTime  = $record['OUTTime'] ?? '--:--';
                $workTime = $record['WorkTime'] ?? '00:00';
                $overTime = $record['OverTime'] ?? '00:00';
                $status   = $record['Status'] ?? null;
                $remark   = $record['Remark'] ?? null;
                $lateIn   = $record['Late_In'] ?? '00:00';
                $earlyOut = $record['Erl_Out'] ?? '00:00';
                $name     = $record['Name'] ?? null;

                if (!$dateStr || !$empCode) {
                    Log::warning('BiometricSync: skipped record missing date or empcode', ['record' => $record]);
                    continue;
                }

                // Handle both "dd/MM/yyyy" and "dd/MM/yyyy HH:mm:ss" formats
                // eTimeOffice uses dd/MM/yyyy which Carbon::parse treats as mm/dd/yyyy if it uses slashes.
                // Replace slashes with dashes to force European/Indian date format parsing (d-m-Y).
                $dateStr = str_replace('/', '-', explode(' ', $dateStr)[0]);
                $carbonDate = Carbon::parse($dateStr);
                $scanDate   = $carbonDate->toDateString();

                $student = $this->etimeoffice->findStudentByBiometricCode($empCode);
                $staff = null;
                if (!$student) {
                    $staff = \App\Models\User::whereHas('roles', function ($q) {
                        $q->whereIn('name', ['staff', 'faculty', 'teacher']);
                    })->where('biometric_employee_code', $empCode)->first() ??
                    \App\Models\User::whereHas('roles', function ($q) {
                        $q->whereIn('name', ['staff', 'faculty', 'teacher']);
                    })->where('id', $empCode)->first();
                }

                if (!$student && !$staff) {
                    continue;
                }

                // If there's no punch at all, we don't need a BiometricLog
                $biometricLog = null;
                if ($inTime !== '--:--' || $outTime !== '--:--') {
                    // Use IN time for the primary datetime, or OUT time if IN time is missing
                    $scanDatetime = ($inTime && $inTime !== '--:--')
                        ? Carbon::parse("{$scanDate} {$inTime}:00")
                        : Carbon::parse("{$scanDate} {$outTime}:00");

                    $biometricLog = BiometricLog::updateOrCreate(
                        ['employee_code' => $empCode, 'scan_datetime' => $scanDatetime],
                        [
                            'device_id'        => 'etimeoffice-pull',
                            'scan_type'        => 'in',
                            'processed'        => true,
                            'sync_status'      => 'success',
                            'status'           => 'processed',
                            'processing_notes' => "InOut | Status:{$status} | Work:{$workTime} | OT:{$overTime} | Late:{$lateIn} | EarlyOut:{$earlyOut} | Remark:{$remark}",
                            'raw_data'         => array_merge($record, [
                                'out_time'  => $outTime,
                                'work_time' => $workTime,
                                'over_time' => $overTime,
                                'late_in'   => $lateIn,
                                'erl_out'   => $earlyOut,
                                'status'    => $status,
                                'remark'    => $remark,
                                'name'      => $name,
                            ]),
                        ]
                    );
                }

                $student = $this->etimeoffice->findStudentByBiometricCode($empCode);
                if ($student) {
                    $inTimeFormatted = ($inTime && $inTime !== '--:--') ? $inTime . ':00' : null;

                    // e-TimeOffice returns the *current running clock time* as OUTTime while an
                    // employee is still checked in for the ongoing day — it is not a real punch-out.
                    // Storing it makes check-out show the "present time" instead of the actual
                    // biometric checkout. Only accept an OUTTime that is a genuine, already-elapsed
                    // punch: clearly in the past for today, and always valid for past dates.
                    $outTimeFormatted = null;
                    if ($outTime && $outTime !== '--:--') {
                        $candidateOut = Carbon::parse("{$scanDate} {$outTime}:00");
                        $isPresentTimePlaceholder = $carbonDate->isToday()
                            && $candidateOut->greaterThanOrEqualTo(now()->subMinutes(2));
                        if (! $isPresentTimePlaceholder) {
                            $outTimeFormatted = $outTime . ':00';
                        }
                    }

                    $attendanceStatus = 'present';
                    if (strtoupper($status) === 'A' || $inTime === '--:--') {
                        $attendanceStatus = 'absent';
                    } elseif ($lateIn && $lateIn !== '00:00') {
                        $attendanceStatus = 'late';
                    }

                    Log::info('BiometricSync: Attempting to create Attendance record', [
                        'student_id' => $student->id,
                        'attendance_date' => $scanDate,
                        'batch_id' => $student->batch_id,
                        'check_in_time' => $inTimeFormatted,
                        'check_out_time' => $outTimeFormatted,
                    ]);

                    $attendanceValues = [
                        'batch_id' => $student->batch_id,
                        'faculty_id' => 1, // Required by database constraints
                        'check_in_time' => $inTimeFormatted,
                        'status' => $attendanceStatus,
                        'marked_at' => now(),
                        'device_id' => 'etimeoffice-api',
                        'biometric_log_id' => $biometricLog ? $biometricLog->id : null,
                        'notes' => "Synced via eTimeOffice API | Status: {$status} | Work: {$workTime}",
                    ];

                    // Only write check_out_time when we have a genuine punch-out; never clobber a
                    // previously stored real checkout with the running-clock placeholder (null).
                    if ($outTimeFormatted !== null) {
                        $attendanceValues['check_out_time'] = $outTimeFormatted;
                    }

                    $attendance = Attendance::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'attendance_date' => $scanDate,
                        ],
                        $attendanceValues
                    );

                    Log::info('BiometricSync: Successfully created Attendance record', ['attendance_id' => $attendance->id]);
                    if ($biometricLog) {
                        $biometricLog->update(['attendance_id' => $attendance->id]);
                    }
                } else if ($staff) {
                    Log::info('BiometricSync: Staff punch recorded', ['empcode' => $empCode]);
                    if ($biometricLog) {
                        $existingNotes = $biometricLog->processing_notes;
                        $biometricLog->update(['processing_notes' => "{$existingNotes} | Staff punch for: {$staff->name}"]);
                    }
                }
                $saved++;
            } catch (\Exception $e) {
                Log::error('BiometricSync: failed to save InOut record', [
                    'record' => $record,
                    'error'  => $e->getMessage(),
                    'trace'  => $e->getTraceAsString(),
                ]);
            }
        }
        return $saved;
    }
}
