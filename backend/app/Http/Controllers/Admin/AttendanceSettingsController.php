<?php

namespace App\Http\Controllers\Admin;

use App\Exports\AttendanceExport;
use App\Exports\SyncLogsExport;
use App\Exports\TodayAttendanceExport;
use App\Helpers\ErrorHandler;  // ✅ FIXED: Correct namespace
use App\Http\Controllers\Controller;
use App\Models\Attendance\Attendance;
use App\Models\Batch;  // ✅ ADD: Missing import
use App\Models\Setting;
use App\Models\Student;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceSettingsController extends Controller
{
    /**
     * ✅ FIX 3: Display attendance settings page with separate student/faculty times
     */
    /**
     * Display attendance settings page
     */
    public function index()
    {
        // Check permissions
        $this->authorize('manage attendance settings');

        // 1. Fetch all settings that start with 'attendance_'
        $dbSettings = \App\Models\Setting::where('key', 'like', 'attendance_%')->pluck('value', 'key');

        // 2. Map keys to remove the prefix so they match your View variables
        // Example: 'attendance_student_present_cutoff_time' becomes 'student_present_cutoff_time'
        $settings = [];
        foreach ($dbSettings as $key => $value) {
            $shortKey = str_replace('attendance_', '', $key);
            $settings[$shortKey] = $value;
        }

        // 3. Pass to view
        return view('admin.attendance.settings', compact('settings'));
    }

    /**
     * Get attendance settings data (for AJAX)
     */
    public function getSettings()
    {
        $this->authorize('manage attendance settings');

        try {
            $settings = [
                // ✅ FIX 4: Separate student and faculty cutoff times
                'student_college_start_time' => $this->getSetting('attendance_student_college_start_time', '09:30:00'),
                'student_present_cutoff_time' => $this->getSetting('attendance_student_present_cutoff_time', '11:00:00'),
                'student_late_cutoff_time' => $this->getSetting('attendance_student_late_cutoff_time', '11:30:00'),

                'faculty_college_start_time' => $this->getSetting('attendance_faculty_college_start_time', '09:00:00'),
                'faculty_present_cutoff_time' => $this->getSetting('attendance_faculty_present_cutoff_time', '10:30:00'),
                'faculty_late_cutoff_time' => $this->getSetting('attendance_faculty_late_cutoff_time', '11:00:00'),

                'college_end_time' => $this->getSetting('attendance_college_end_time', '17:00:00'),
                'weekend_enabled' => $this->getSetting('attendance_weekend_enabled', false),
                'grace_period_minutes' => $this->getSetting('attendance_grace_period_minutes', 10),
            ];

            // Get real-time attendance data
            $liveAttendances = $this->getLiveAttendanceData();

            return response()->json([
                'success' => true,
                'data' => $settings,
                'live_attendances' => $liveAttendances,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load attendance settings', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load current configuration',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            // 1. Validation Rules
            $validator = \Validator::make($request->all(), [
                'student_college_start_time' => ['sometimes', 'nullable'], // Relaxed validation
                'student_present_cutoff_time' => ['sometimes', 'nullable'],
                'student_late_cutoff_time' => ['sometimes', 'nullable'],
                'faculty_college_start_time' => ['sometimes', 'nullable'],
                'faculty_present_cutoff_time' => ['sometimes', 'nullable'],
                'faculty_late_cutoff_time' => ['sometimes', 'nullable'],
                'college_end_time' => ['sometimes', 'nullable'],
                'grace_period_minutes' => 'sometimes|integer|min:0|max:60',
                'weekend_enabled' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // 2. Normalize Time Formats (Ensure H:i:s)
            $timeFields = [
                'student_college_start_time',
                'student_present_cutoff_time',
                'student_late_cutoff_time',
                'faculty_college_start_time',
                'faculty_present_cutoff_time',
                'faculty_late_cutoff_time',
                'college_end_time',
            ];

            $normalizedData = [];
            foreach ($timeFields as $field) {
                if ($request->has($field) && $request->$field) {
                    $time = $request->$field;
                    // Add seconds if missing (e.g., "09:30" -> "09:30:00")
                    if (preg_match('/^\d{2}:\d{2}$/', $time)) {
                        $normalizedData[$field] = $time.':00';
                    } else {
                        $normalizedData[$field] = $time;
                    }
                }
            }

            // ---------------------------------------------------------
            // [REMOVED STRICT VALIDATION]
            // We removed the block that checks "Start < Present < Late"
            // to allow you to save settings freely without errors.
            // ---------------------------------------------------------

            // 3. Save Settings to Database
            foreach ($normalizedData as $field => $value) {
                $settingKey = 'attendance_'.$field;
                \App\Models\Setting::updateOrCreate(
                    ['key' => $settingKey],
                    ['value' => $value]
                );
            }

            // 4. Save Boolean/Integer Settings
            if ($request->has('grace_period_minutes')) {
                \App\Models\Setting::updateOrCreate(
                    ['key' => 'attendance_grace_period_minutes'],
                    ['value' => $request->grace_period_minutes]
                );
            }

            if ($request->has('weekend_enabled')) {
                \App\Models\Setting::updateOrCreate(
                    ['key' => 'attendance_weekend_enabled'],
                    ['value' => $request->boolean('weekend_enabled') ? '1' : '0']
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Settings saved successfully!',
                'timestamp' => now()->toDateTimeString(),
            ]);

        } catch (\Exception $e) {
            \Log::error('Attendance settings update error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Server error occurred.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    }
