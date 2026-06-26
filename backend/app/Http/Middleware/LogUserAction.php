<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LogUserAction
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $path = $request->getRequestUri();
        if (($pos = strpos($path, '?')) !== false) {
            $path = substr($path, 0, $pos);
        }
        $path = trim(str_replace('api/v1', '', $path), '/');

        $idFromPath = null;
        if (preg_match('/\/(\d+)(?:\/|$)/', $path, $matches)) {
            $idFromPath = $matches[1];
        }

        $preFetchedData = [];
        if ($idFromPath) {
            try {
                if (str_contains($path, 'students')) {
                    $preFetchedData['name'] = \App\Models\Student::find($idFromPath)?->name;
                } elseif (str_contains($path, 'users')) {
                    $preFetchedData['name'] = \App\Models\User::find($idFromPath)?->name;
                } elseif (str_contains($path, 'courses')) {
                    $preFetchedData['name'] = \App\Models\Course::find($idFromPath)?->name;
                } elseif (str_contains($path, 'batches')) {
                    $preFetchedData['name'] = \App\Models\Batch::find($idFromPath)?->name;
                } elseif (str_contains($path, 'subjects')) {
                    $preFetchedData['name'] = \App\Models\Subject::find($idFromPath)?->name;
                } elseif (str_contains($path, 'fee-categories')) {
                    $preFetchedData['name'] = \App\Models\FeeCategory::find($idFromPath)?->name;
                } elseif (str_contains($path, 'leave-applications')) {
                    $leave = \App\Models\LeaveApplication::with('user')->find($idFromPath);
                    $preFetchedData['applicant_name'] = $leave?->user?->name;
                    $preFetchedData['leave_type'] = $leave?->leaveType?->name;
                } elseif (str_contains($path, 'expenses')) {
                    $expense = \App\Models\Expense::find($idFromPath);
                    $preFetchedData['amount'] = $expense?->amount;
                    $preFetchedData['category'] = $expense?->category?->name;
                }
            } catch (\Throwable $e) {
                // Ignore pre-fetch failures
            }
        }

        $response = $next($request);

        try {
            if (auth('sanctum')->check()) {
                $method = $request->method();
                $statusCode = $response->getStatusCode();

                // Only log POST, PUT, PATCH, DELETE and successful status codes (< 400)
                if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']) && $statusCode < 400) {
                    $pathUri = $request->getRequestUri();

                    // Check for excluded paths
                    $excludedPaths = [
                        '/login', '/logout', '/ping', '/test', '/me', '/heartbeat',
                        '/webhook-calls', 'webhook-events', '/notifications/read',
                        'mark-all-read', '/dashboard/my-activities', '/activity-logs'
                    ];

                    $shouldSkip = false;
                    foreach ($excludedPaths as $excluded) {
                        if (str_contains($pathUri, $excluded)) {
                            $shouldSkip = true;
                            break;
                        }
                    }

                    if (!$shouldSkip) {
                        $description = $this->buildDescription($request, $response, $preFetchedData);
                        $event = $this->methodToEvent($method);

                        $properties = [
                            'method'      => $method,
                            'path'        => $request->path(),
                            'url'         => $request->fullUrl(),
                            'ip_address'  => $request->ip(),
                            'user_agent'  => $request->userAgent(),
                            'status_code' => $statusCode,
                            'input_keys'  => array_keys($request->except(['password', 'password_confirmation', 'signing_secret', 'token', '_token'])),
                        ];

                        if (str_contains($path, 'settings')) {
                            $isAttendance = false;
                            if ($request->input('key') === 'kts_student_attendance_records') {
                                $isAttendance = true;
                            } elseif ($idFromPath) {
                                try {
                                    $setting = \App\Models\Setting::find($idFromPath);
                                    if ($setting && $setting->key === 'kts_student_attendance_records') {
                                        $isAttendance = true;
                                    }
                                } catch (\Throwable $e) {}
                            }

                            if ($isAttendance && $request->has('value')) {
                                try {
                                    $records = json_decode($request->input('value'), true) ?? [];
                                    
                                    // Find maximum markedAt timestamp
                                    $maxMarkedAt = '';
                                    foreach ($records as $r) {
                                        if (isset($r['markedAt'])) {
                                            if (empty($maxMarkedAt) || $r['markedAt'] > $maxMarkedAt) {
                                                $maxMarkedAt = $r['markedAt'];
                                            }
                                        }
                                    }

                                    $present = 0;
                                    $absent = 0;
                                    foreach ($records as $r) {
                                        if (empty($maxMarkedAt) || (isset($r['markedAt']) && $r['markedAt'] === $maxMarkedAt)) {
                                            if (isset($r['status'])) {
                                                if ($r['status'] === 'present') $present++;
                                                elseif ($r['status'] === 'absent') $absent++;
                                            }
                                        }
                                    }
                                    $properties['present_count'] = $present;
                                    $properties['absent_count'] = $absent;
                                } catch (\Throwable $e) {}
                            }
                        }

                        activity()
                            ->causedBy(auth('sanctum')->user())
                            ->withProperties($properties)
                            ->event($event)
                            ->log($description);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Never let a logging failure affect the response
            \Log::error('LogUserAction Middleware Error: ' . $e->getMessage(), [
                'exception' => $e
            ]);
        }

        return $response;
    }

    /**
     * Map path patterns to human-readable descriptions.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $response
     * @param  array  $preFetchedData
     * @return string
     */
    private function buildDescription(Request $request, $response, array $preFetchedData = []): string
    {
        $path = $request->getRequestUri();
        if (($pos = strpos($path, '?')) !== false) {
            $path = substr($path, 0, $pos);
        }
        $path = trim(str_replace('api/v1', '', $path), '/');
        $method = $request->method();

        // Decode response data for dynamic names
        $responseData = [];
        try {
            $content = $response->getContent();
            if ($content) {
                $responseData = json_decode($content, true) ?? [];
            }
        } catch (\Throwable $e) {}

        // Helper to extract a name/title/label
        $getName = function() use ($request, $responseData, $preFetchedData) {
            if (!empty($preFetchedData['name'])) {
                return $preFetchedData['name'];
            }
            return $responseData['name'] 
                ?? $responseData['data']['name'] 
                ?? $responseData['title'] 
                ?? $responseData['data']['title']
                ?? $request->input('name') 
                ?? $request->input('title') 
                ?? '';
        };

        $idFromPath = null;
        if (preg_match('/\/(\d+)(?:\/|$)/', $path, $matches)) {
            $idFromPath = $matches[1];
        }

        // Auth
        if (str_contains($path, 'logout'))           return 'Signed out';
        if (str_contains($path, 'login'))            return 'login success';

        // Settings
        if (str_contains($path, 'settings')) {
            $settingName = '';
            if ($idFromPath) {
                try {
                    $setting = \App\Models\Setting::find($idFromPath);
                    if ($setting) {
                        $settingName = str_replace('_', ' ', $setting->key);
                    }
                } catch (\Throwable $e) {}
            } elseif ($request->has('key')) {
                $settingName = str_replace('_', ' ', $request->input('key'));
            }
            $settingName = $settingName ?: 'general';
            if (str_replace(' ', '_', $settingName) === 'kts_student_attendance_records') {
                $classSection = '';
                $sessionName = '';
                $val = $request->input('value');
                if ($val) {
                    try {
                        $records = json_decode($val, true);
                        if (is_array($records) && count($records) > 0) {
                            // Find maximum markedAt timestamp
                            $maxMarkedAt = '';
                            foreach ($records as $r) {
                                if (isset($r['markedAt'])) {
                                    if (empty($maxMarkedAt) || $r['markedAt'] > $maxMarkedAt) {
                                        $maxMarkedAt = $r['markedAt'];
                                    }
                                }
                            }
                            
                            // Find first record matching the maximum markedAt timestamp
                            $targetRecord = null;
                            foreach ($records as $r) {
                                if (empty($maxMarkedAt) || (isset($r['markedAt']) && $r['markedAt'] === $maxMarkedAt)) {
                                    $targetRecord = $r;
                                    break;
                                }
                            }
                            
                            if ($targetRecord) {
                                if (isset($targetRecord['className'])) {
                                    $classSection = $targetRecord['className'];
                                }
                                if (isset($targetRecord['session'])) {
                                    $sessionName = ($targetRecord['session'] === 'first_period') ? 'morning' : 'afternoon';
                                }
                            }
                        }
                    } catch (\Throwable $e) {}
                }
                
                if ($classSection && $sessionName) {
                    return "marked attendance for {$classSection} in {$sessionName}";
                }
                return 'Student attendance records updated';
            }
            $val = $request->input('value');
            $formattedVal = $this->formatValueForDescription($val);
            $valStr = ($val !== null && $settingName !== 'biometric api key') ? " to '{$formattedVal}'" : "";
            return "Updated system setting '{$settingName}'{$valStr}";
        }

        // Students
        if (str_contains($path, 'students')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')   return 'Added student' . $suffix;
            if ($method === 'PUT')    return 'Updated student' . $suffix;
            if ($method === 'DELETE') return 'Deleted student' . $suffix;
            if (str_contains($path, 'import'))  return 'Imported students from file';
        }

        if (str_contains($path, 'dropout')) {
            return 'Processed student dropout';
        }

        // Attendance
        if (str_contains($path, 'attendance')) {
            $date = $request->input('date') ?? $request->input('attendance_date') ?? now()->toDateString();
            $batchName = '';
            if ($request->has('batch_id')) {
                try {
                    $batchName = \App\Models\Batch::find($request->input('batch_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = $batchName ? " for {$batchName}" : "";
            if ($method === 'POST')  return "Marked attendance{$target} on {$date}";
            if ($method === 'PUT')   return "Updated attendance record{$target} on {$date}";
        }

        // Payments / Fees
        if (str_contains($path, 'component-payments') && $method === 'POST') {
            $amount = $request->input('amount');
            $methodType = $request->input('payment_method') ?? 'cash';
            $studentName = '';
            if ($request->has('student_id')) {
                try {
                    $studentName = \App\Models\Student::find($request->input('student_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = $studentName ? " for student {$studentName}" : "";
            return "Recorded a payment of ₹{$amount}{$target} via {$methodType}";
        }
        if (str_contains($path, 'student-fees')) {
            $batchName = '';
            if ($request->has('batch_id')) {
                try {
                    $batchName = \App\Models\Batch::find($request->input('batch_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = $batchName ? " for {$batchName}" : "";
            if ($method === 'POST')   return "Generated student fees{$target}";
            if ($method === 'PUT')    return "Updated student fee record{$target}";
            if ($method === 'DELETE') return "Deleted student fee record{$target}";
        }
        if (str_contains($path, 'concession')) {
            $studentName = '';
            if ($request->has('student_id')) {
                try {
                    $studentName = \App\Models\Student::find($request->input('student_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $amount = $request->input('amount') ?? ($request->input('percentage') ? $request->input('percentage') . '%' : '');
            $target = $studentName ? " for {$studentName}" : "";
            $amountStr = $amount ? " of {$amount}" : "";
            return "Applied fee concession{$amountStr}{$target}";
        }
        if (str_contains($path, 'fee-categories')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')     return 'Created fee category' . $suffix;
            if ($method === 'PUT')      return 'Updated fee category' . $suffix;
            if ($method === 'DELETE')   return 'Deleted fee category' . $suffix;
        }
        if (str_contains($path, 'fee-structures')) {
            $name = $request->input('name') ?? $responseData['name'] ?? '';
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')   return 'Created fee structure' . $suffix;
            if ($method === 'PUT')    return 'Updated fee structure' . $suffix;
            if ($method === 'DELETE') return 'Deleted fee structure' . $suffix;
            return 'Modified fee structure' . $suffix;
        }
        if (str_contains($path, 'payment-reminders')) {
            return 'Sent payment reminders to parents';
        }

        // Staff / Users
        if (str_contains($path, 'users')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')   return 'Added staff member' . $suffix;
            if ($method === 'PUT')    return 'Updated staff profile' . $suffix;
            if ($method === 'DELETE') return 'Removed staff member' . $suffix;
        }
        if (str_contains($path, 'roles')) {
            $user = '';
            if ($request->has('user_id')) {
                try {
                    $user = \App\Models\User::find($request->input('user_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = $user ? " for user {$user}" : "";
            return 'Modified role assignment' . $target;
        }
        if (str_contains($path, 'permissions'))      return 'Changed access permissions';

        // Salary / Payroll
        if (str_contains($path, 'payslips')) {
            $staffName = '';
            if ($request->has('user_id')) {
                try {
                    $staffName = \App\Models\User::find($request->input('user_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $month = $request->input('month') ?? '';
            $year = $request->input('year') ?? '';
            $target = $staffName ? " for {$staffName}" : "";
            $period = ($month && $year) ? " ({$month} {$year})" : "";
            if ($method === 'POST')   return "Generated payslip{$target}{$period}";
            if ($method === 'PUT')    return "Updated payslip{$target}{$period}";
            if ($method === 'DELETE') return "Deleted payslip{$target}{$period}";
        }
        if (str_contains($path, 'salary-components'))                 return 'Modified salary components';
        if (str_contains($path, 'user-salary-structures')) {
            $staffName = '';
            if ($request->has('user_id')) {
                try {
                    $staffName = \App\Models\User::find($request->input('user_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = $staffName ? " for {$staffName}" : "";
            return "Updated salary structure{$target}";
        }

        // Leave
        if (str_contains($path, 'leave-applications')) {
            if ($method === 'POST') {
                $type = '';
                if ($request->has('leave_type_id')) {
                    try {
                        $type = \App\Models\LeaveType::find($request->input('leave_type_id'))?->name;
                    } catch (\Throwable $e) {}
                }
                $start = $request->input('start_date');
                $end = $request->input('end_date');
                $period = ($start && $end) ? " from {$start} to {$end}" : "";
                $typeStr = $type ? " ({$type})" : "";
                return "Submitted leave request{$typeStr}{$period}";
            }
            if ($method === 'PUT')  return 'Updated leave request';
        }
        if (str_contains($path, 'approve') && str_contains($path, 'leave')) {
            $applicant = $preFetchedData['applicant_name'] ?? '';
            $target = $applicant ? " submitted by {$applicant}" : "";
            return "Approved leave request{$target}";
        }
        if (str_contains($path, 'reject') && str_contains($path, 'leave')) {
            $applicant = $preFetchedData['applicant_name'] ?? '';
            $target = $applicant ? " submitted by {$applicant}" : "";
            return "Rejected leave request{$target}";
        }

        // Academics
        if (str_contains($path, 'courses')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')   return 'Created course' . $suffix;
            if ($method === 'PUT')    return 'Updated course' . $suffix;
            if ($method === 'DELETE') return 'Deleted course' . $suffix;
        }
        if (str_contains($path, 'subjects')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')  return 'Created subject' . $suffix;
            if ($method === 'PUT')   return 'Updated subject' . $suffix;
        }
        if (str_contains($path, 'batches')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')   return 'Created batch' . $suffix;
            if ($method === 'PUT')    return 'Updated batch' . $suffix;
            if ($method === 'DELETE') return 'Deleted batch' . $suffix;
        }
        if (str_contains($path, 'timetable')) {
            $batchName = '';
            if ($request->has('batch_id')) {
                try {
                    $batchName = \App\Models\Batch::find($request->input('batch_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = $batchName ? " for {$batchName}" : "";
            return "Modified timetable{$target}";
        }
        if (str_contains($path, 'classrooms')) {
            $name = $request->input('name') ?? $responseData['name'] ?? '';
            $suffix = $name ? ": {$name}" : '';
            return 'Managed classroom record' . $suffix;
        }
        if (str_contains($path, 'homework')) {
            $subjectName = '';
            if ($request->has('subject_id')) {
                try {
                    $subjectName = \App\Models\Subject::find($request->input('subject_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $batchName = '';
            if ($request->has('batch_id')) {
                try {
                    $batchName = \App\Models\Batch::find($request->input('batch_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = ($subjectName && $batchName) ? " for {$subjectName} to Class {$batchName}" : "";
            if ($method === 'POST')  return "Assigned homework{$target}";
            if ($method === 'PUT')   return "Updated homework{$target}";
        }
        if (str_contains($path, 'daily-diary')) {
            $subjectName = '';
            if ($request->has('subject_id')) {
                try {
                    $subjectName = \App\Models\Subject::find($request->input('subject_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $batchName = '';
            if ($request->has('batch_id')) {
                try {
                    $batchName = \App\Models\Batch::find($request->input('batch_id'))?->name;
                } catch (\Throwable $e) {}
            }
            $target = ($subjectName && $batchName) ? " for {$subjectName} in Class {$batchName}" : "";
            return "Updated daily diary{$target}";
        }
        if (str_contains($path, 'promotions')) {
            $from = '';
            $to = '';
            try {
                if ($request->has('from_batch_id')) {
                    $from = \App\Models\Batch::find($request->input('from_batch_id'))?->name;
                }
                if ($request->has('to_batch_id')) {
                    $to = \App\Models\Batch::find($request->input('to_batch_id'))?->name;
                }
            } catch (\Throwable $e) {}
            $target = ($from && $to) ? " from Class {$from} to Class {$to}" : "";
            return "Processed student promotion{$target}";
        }
        if (str_contains($path, 'examination')) {
            $name = $request->input('name') ?? $responseData['name'] ?? '';
            $suffix = $name ? ": {$name}" : '';
            return "Managed examination records{$suffix}";
        }

        // Expenses / Assets
        if (str_contains($path, 'expenses')) {
            $amount = $request->input('amount') ?? ($preFetchedData['amount'] ?? '');
            $category = $request->input('category') ?? ($preFetchedData['category'] ?? '');
            $suffix = '';
            if ($amount) {
                $suffix .= " of ₹{$amount}";
            }
            if ($category) {
                $suffix .= " in {$category}";
            }
            if ($method === 'POST')   return 'Recorded an expense' . $suffix;
            if ($method === 'DELETE') return 'Deleted an expense record' . $suffix;
        }
        if (str_contains($path, 'assets') && $method === 'POST') {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            return 'Added asset' . $suffix;
        }
        if (str_contains($path, 'audits'))           return 'Conducted asset audit';

        // Enquiries / Admissions
        if (str_contains($path, 'enquiries') && $method === 'POST') {
            $name = $getName();
            $course = $request->input('course') ?? '';
            $suffix = $name ? ": {$name}" : '';
            if ($course) {
                $suffix .= " for course {$course}";
            }
            return 'Created a new enquiry' . $suffix;
        }
        if (str_contains($path, 'admissions') && $method === 'POST') {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            return 'Processed student admission' . $suffix;
        }
        if (str_contains($path, 'follow-ups')) {
            $notes = $request->input('notes') ?? '';
            $suffix = $notes ? ": '" . substr($notes, 0, 30) . "...'" : '';
            if ($method === 'POST')   return 'Created follow-up record' . $suffix;
            if ($method === 'PUT')    return 'Updated follow-up record' . $suffix;
            if ($method === 'DELETE') return 'Deleted follow-up record' . $suffix;
            return 'Modified follow-up record' . $suffix;
        }
        if (str_contains($path, 'alumni')) {
            $name = $getName();
            $suffix = $name ? ": {$name}" : '';
            if ($method === 'POST')   return 'Created alumni record' . $suffix;
            if ($method === 'PUT')    return 'Updated alumni record' . $suffix;
            if ($method === 'DELETE') return 'Deleted alumni record' . $suffix;
            return 'Modified alumni record' . $suffix;
        }

        // Webhooks
        if (str_contains($path, 'webhooks')) {
            $url = $request->input('url') ?? $responseData['url'] ?? $responseData['data']['url'] ?? '';
            $suffix = $url ? " for {$url}" : '';
            if ($method === 'POST')   return 'Created webhook' . $suffix;
            if ($method === 'PUT')    return 'Updated webhook' . $suffix;
            if ($method === 'DELETE') return 'Deleted webhook' . $suffix;
        }
        if (str_contains($path, '/test'))            return 'Sent webhook test';
        if (str_contains($path, '/replay'))          return 'Replayed a webhook delivery';
        if (str_contains($path, '/toggle'))          return 'Toggled webhook status';

        // Reports / Exports
        if (str_contains($path, 'export'))           return 'Exported data to file';
        if (str_contains($path, 'reports'))          return 'Generated a report';
        if (str_contains($path, 'backup'))           return 'Triggered system backup';

        // Bulk operations
        if (str_contains($path, 'bulk'))             return 'Performed bulk operation';

        // Substitute
        if (str_contains($path, 'substitute')) {
            $sub = '';
            $orig = '';
            try {
                if ($request->has('substitute_user_id')) {
                    $sub = \App\Models\User::find($request->input('substitute_user_id'))?->name;
                }
                if ($request->has('original_user_id')) {
                    $orig = \App\Models\User::find($request->input('original_user_id'))?->name;
                }
            } catch (\Throwable $e) {}
            $date = $request->input('assignment_date') ?? now()->toDateString();
            $target = ($sub && $orig) ? " {$sub} for {$orig} on {$date}" : "";
            return "Assigned substitute teacher{$target}";
        }

        // Default fallback
        $methodLabel = match($method) {
            'POST'   => 'Created',
            'PUT'    => 'Updated',
            'PATCH'  => 'Updated',
            'DELETE' => 'Deleted',
            default  => 'Performed action on',
        };
        $cleanPath = trim(preg_replace('/resources\//', '', $path), '/');
        $resource = ucfirst(str_replace(['-', '/'], ['', ' '], $cleanPath));
        return "{$methodLabel} {$resource}";
    }

    /**
     * Map HTTP method to event name.
     *
     * @param  string  $method
     * @return string
     */
    private function methodToEvent(string $method): string
    {
        return match($method) {
            'POST'   => 'created',
            'PUT', 'PATCH' => 'updated',
            'DELETE' => 'deleted',
            default  => 'action',
        };
    }

    /**
     * Format values to a simple human-readable text string, cleaning up arrays/objects/JSON.
     */
    private function formatValueForDescription($val)
    {
        if (is_array($val)) {
            return $this->formatArrayForDescription($val);
        }
        if (is_string($val)) {
            $trimmed = trim($val);
            if ((str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}')) || (str_starts_with($trimmed, '[') && str_ends_with($trimmed, ']'))) {
                $decoded = json_decode($trimmed, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $this->formatValueForDescription($decoded);
                }
            }
            return $val;
        }
        if (is_bool($val)) {
            return $val ? 'Yes' : 'No';
        }
        return (string)$val;
    }

    /**
     * Format arrays recursively without braces/brackets.
     */
    private function formatArrayForDescription(array $arr)
    {
        if (empty($arr)) {
            return 'None';
        }
        $isAssoc = array_keys($arr) !== range(0, count($arr) - 1);
        if ($isAssoc) {
            $parts = [];
            foreach ($arr as $k => $v) {
                $formattedKey = ucwords(str_replace('_', ' ', $k));
                $formattedVal = $this->formatValueForDescription($v);
                $parts[] = "{$formattedKey}: {$formattedVal}";
            }
            return implode(', ', $parts);
        } else {
            if (is_array($arr[0])) {
                $parts = [];
                foreach ($arr as $item) {
                    $parts[] = $this->formatValueForDescription($item);
                }
                return implode(', ', $parts);
            }
            return implode(', ', array_map([$this, 'formatValueForDescription'], $arr));
        }
    }
}
