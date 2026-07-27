<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class GenericApiController extends Controller
{
    /**
     * Cache schema column listings to avoid redundant database queries.
     */
    protected function getTableColumns($modelClass)
    {
        $table = (new $modelClass)->getTable();
        
        if (config('app.env') === 'local') {
            \Cache::forget('schema_columns_' . $table);
        }

        return \Cache::remember('schema_columns_' . $table, 86400, function () use ($table) {
            return Schema::getColumnListing($table);
        });
    }

    /**
     * Map resource names to Eloquent model classes.
     */
    protected function getModelClass($resource)
    {
        $map = [
            'students' => \App\Models\Student::class,
            'users' => \App\Models\User::class,
            'faculty' => \App\Models\User::class, // Faculty maps to User model
            'expenses' => \App\Models\Expense::class,
            'leaves' => \App\Models\LeaveApplication::class,
            'timetable' => \App\Models\Timetable::class,
            'payslips' => \App\Models\Payslip::class,
            'student-fees' => \App\Models\StudentFee::class,
            'fee-categories' => \App\Models\FeeCategory::class,
            'expense-categories' => \App\Models\ExpenseCategory::class,
            'attendance' => \App\Models\Attendance::class,
            'academic-years' => \App\Models\AcademicYear::class,
            'batches' => \App\Models\Batch::class,
            'courses' => \App\Models\Course::class,
            'classrooms' => \App\Models\Classroom::class,
            'time-slots' => \App\Models\TimeSlot::class,
            'notifications' => \App\Models\SystemNotification::class,
            'daily-diaries' => \App\Models\DailyDiary::class,
            'homework' => \App\Models\Homework::class,
            'settings' => \App\Models\Setting::class,
            'biometric-logs' => \App\Models\Attendance\BiometricLog::class,
            'activity-logs' => \Spatie\Activitylog\Models\Activity::class,
            'failed-logins' => \Spatie\Activitylog\Models\Activity::class,
            'alumni' => \App\Models\Alumni::class,
            'substitute-assignments' => \App\Models\SubstituteAssignment::class,
            'holidays' => \App\Models\Holiday::class,
            'webhooks' => \App\Models\Webhook::class,
            'webhook-calls' => \App\Models\WebhookCall::class,
            'payments' => \App\Models\Payment::class,
            'component-payment-items' => \App\Models\ComponentPaymentItem::class,
            'student-concessions' => \App\Models\StudentConcession::class,
            'exams' => \App\Models\Exam::class,
            'marks' => \App\Models\Mark::class,
            'exam-schedules' => \App\Models\ExamSchedule::class,
        ];

        return $map[strtolower($resource)] ?? null;
    }

    /**
     * Resources non-admin (teacher/faculty) users may write to.
     * Everything else requires an admin role. Leaves and settings are
     * further scoped in authorizeWrite().
     */
    private const TEACHER_WRITABLE_RESOURCES = [
        'homework', 'daily-diaries', 'leaves', 'settings',
        'students', 'batches', 'timetable', 'alumni',
    ];

    /**
     * Settings keys teachers may write (feature data they legitimately own).
     * Admin-only keys (staff_salaries, kts_staff_members, school_*, ...) are
     * implicitly denied for non-admins.
     */
    private const TEACHER_WRITABLE_SETTINGS = [
        'kts_student_attendance_records',
        'kts_student_marks',
        'examinations_exams',
        'examinations_schedules',
        'kts_exam_invigilations',
        'kts_daily_diaries',
    ];

    private function isAdmin($user): bool
    {
        return $user && ($user->hasRole('super-admin') || $user->hasRole('admin') || $user->hasRole('college-admin'));
    }

    /**
     * Authorize a write (store/update/destroy). Returns an error response to
     * short-circuit with, or null when the write may proceed. For leave
     * requests by non-admins this also forces ownership and strips
     * admin-only fields from the request.
     */
    private function authorizeWrite(Request $request, $resource, $item = null)
    {
        $user = auth('sanctum')->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        if ($this->isAdmin($user)) {
            return null;
        }
        if (!in_array(strtolower($resource), self::TEACHER_WRITABLE_RESOURCES)) {
            return response()->json(['error' => 'You are not authorized to modify this resource'], 403);
        }
        if ($resource === 'settings') {
            $key = $item->key ?? $request->input('key');
            if (!in_array($key, self::TEACHER_WRITABLE_SETTINGS)) {
                return response()->json(['error' => 'You are not authorized to modify this setting'], 403);
            }
        }
        if ($resource === 'leaves') {
            if ($item && (int) $item->user_id !== (int) $user->id) {
                return response()->json(['error' => 'You may only modify your own leave requests'], 403);
            }
            // Teachers always file leaves as themselves and cannot self-approve.
            $request->merge(['user_id' => $user->id]);
            if ($item === null) {
                $request->merge(['status' => 'Pending']);
            } else {
                $request->request->remove('status');
                $request->request->remove('admin_notes');
            }
        }
        return null;
    }

    /**
     * Non-admins may only see their own entry inside the staff_salaries blob.
     */
    private function filterSettingForNonAdmin($setting, $user): void
    {
        if (!$setting || $setting->key !== 'staff_salaries' || $this->isAdmin($user)) {
            return;
        }
        $all = json_decode($setting->value ?? '', true);
        if (!is_array($all)) {
            $setting->value = '{}';
            return;
        }
        $norm = fn ($s) => preg_replace('/[^a-z]/', '', strtolower((string) $s));
        $own = [];
        foreach ($all as $k => $v) {
            if ((string) $k === (string) $user->id || ($user->name && $norm($k) === $norm($user->name))) {
                $own[$k] = $v;
            }
        }
        $setting->value = json_encode($own, JSON_FORCE_OBJECT);
    }

    /**
     * Parse batch name to extract class number and section letter.
     */
    private function parseBatchName($batchName): array
    {
        $batchName = strtoupper(trim($batchName));
        
        // Match format "LKG SECTION C" or "LKG SEC C" or "6 SECTION C"
        if (preg_match('/^([A-Z0-9-]+)\s*(?:SECTION|SEC)\s*([A-Z])$/i', $batchName, $matches)) {
            return [
                'class' => $matches[1],
                'section' => $matches[2],
            ];
        }

        // Match standard format "8A", "LKGA", "PP1A", "LKG A"
        if (preg_match('/^([A-Z0-9-]+)\s*([A-Z])$/i', $batchName, $matches)) {
            return [
                'class' => $matches[1],
                'section' => $matches[2],
            ];
        }
        
        // Fallback
        return [
            'class' => '8',
            'section' => 'A',
        ];
    }


    /**
     * List resources.
     */
    public function index(Request $request, $resource)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource ' . $resource . ' not found'], 404);
        }

        $query = $modelClass::query();

        // Intercept settings request to dynamically map from individual tables
        if ($resource === 'settings') {
            $key = $request->query('key');
            if ($key === 'staff_salaries') {
                $setting = \App\Models\Setting::where('key', 'staff_salaries')->first();
                if (!$setting) {
                    return response()->json([]);
                }
                $this->filterSettingForNonAdmin($setting, auth('sanctum')->user());
                return response()->json([$setting]);
            }
            if ($key) {
                $constructedValue = $this->constructSettingFromTables($key);
                if ($constructedValue !== null) {
                    $setting = \App\Models\Setting::where('key', $key)->first();
                    if (!$setting) {
                        $setting = \App\Models\Setting::create([
                            'key' => $key,
                            'group' => 'general',
                            'type' => 'json',
                            'value' => $constructedValue,
                        ]);
                    } else {
                        $setting->value = $constructedValue;
                    }
                    return response()->json([$setting]);
                }
            } else {
                $user = auth('sanctum')->user();
                $settings = $query->get();
                foreach ($settings as $setting) {
                    $constructedValue = $this->constructSettingFromTables($setting->key);
                    if ($constructedValue !== null) {
                        $setting->value = $constructedValue;
                    }
                    $this->filterSettingForNonAdmin($setting, $user);
                }
                return response()->json($settings);
            }
        }

        // Custom auth check for activity-logs
        if ($resource === 'activity-logs') {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }
            if ($user->hasRole('super-admin') || $user->hasRole('admin') || $user->hasRole('college-admin')) {
                // Admin can access all logs
            } elseif ($user->hasRole('faculty') || $user->hasRole('teacher')) {
                // Teacher/faculty can access only their own logs
                $query->where('causer_type', get_class($user))
                      ->where('causer_id', $user->id);
            } else {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }
        }

        // Custom auth check + filter for failed-logins (admin only)
        if ($resource === 'failed-logins') {
            $user = auth('sanctum')->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }
            if (!$user->hasRole('super-admin') && !$user->hasRole('admin') && !$user->hasRole('college-admin')) {
                return response()->json(['error' => 'Unauthorized access'], 403);
            }
            // Only show failed login attempt entries
            $query->where('description', 'like', 'Failed login attempt%');
        }

        // Custom filter for faculty role
        if ($resource === 'faculty') {
            $query->whereHas('roles', function ($q) {
                $q->whereIn('name', ['faculty', 'staff', 'teacher']);
            });
        }

        // Custom filter for leaves
        if ($resource === 'leaves') {
            $user = auth('sanctum')->user();
            if ($user && ($user->hasRole('super-admin') || $user->hasRole('admin') || $user->hasRole('college-admin'))) {
                // Admin login: only show leave requests from teachers/staff (users with role faculty or teacher)
                $query->whereHas('user.roles', function ($q) {
                    $q->whereIn('name', ['faculty', 'teacher', 'staff']);
                });
            } else if ($user) {
                // Teacher/faculty login: show only their own leave requests
                $query->where('user_id', $user->id);
            }
        }

        // Custom filter for notifications
        if ($resource === 'notifications') {
            $user = auth('sanctum')->user();
            if ($user) {
                $query->forUser($user->id)->active();
            }
        }

        // Apply simple field-value filters from query parameters
        $columns = $this->getTableColumns($modelClass);
        foreach ($request->except(['page', 'limit', 'search', 'with', 'role', 'date', 'start_date', 'end_date']) as $key => $value) {
            if (in_array($key, $columns) && $value !== 'All' && $value !== '') {
                $query->where($key, $value);
            }
        }

        // Apply date filter if present
        if ($request->has('date') && $request->date !== '' && $request->date !== 'All') {
            if ($resource === 'biometric-logs' && in_array('scan_datetime', $columns)) {
                $query->whereDate('scan_datetime', $request->date);
            } elseif (in_array('created_at', $columns)) {
                $query->whereDate('created_at', $request->date);
            }
        }

        if ($request->has('start_date') && $request->start_date !== '') {
            $col = ($resource === 'biometric-logs' && in_array('scan_datetime', $columns)) ? 'scan_datetime' : (in_array('created_at', $columns) ? 'created_at' : null);
            if ($col) {
                $query->whereDate($col, '>=', $request->start_date);
            }
        }

        if ($request->has('end_date') && $request->end_date !== '') {
            $col = ($resource === 'biometric-logs' && in_array('scan_datetime', $columns)) ? 'scan_datetime' : (in_array('created_at', $columns) ? 'created_at' : null);
            if ($col) {
                $query->whereDate($col, '<=', $request->end_date);
            }
        }

        // Apply search keyword filter
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            if ($resource === 'students') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhere('enrollment_number', 'like', "%$search%")
                      ->orWhere('father_name', 'like', "%$search%")
                      ->orWhere('student_mobile', 'like', "%$search%");
                });
            } elseif ($resource === 'users' || $resource === 'faculty') {
                $query->where('name', 'like', "%$search%")
                      ->orWhere('email', 'like', "%$search%");
            } elseif ($resource === 'expenses') {
                $query->where('description', 'like', "%$search%")
                      ->orWhere('vendor', 'like', "%$search%");
            } elseif ($resource === 'activity-logs') {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%$search%")
                      ->orWhere('log_name', 'like', "%$search%")
                      ->orWhere('event', 'like', "%$search%")
                      ->orWhereHas('causer', function ($uq) use ($search) {
                          $uq->where('name', 'like', "%$search%");
                      });
                });
            }
        }

        // Eager load relations
        if ($request->has('with')) {
            $relations = explode(',', $request->with);
            $query->with($relations);
        }

        // Auto-eager load for custom response mapping
        if ($resource === 'expenses') {
            $query->with('category');
        } elseif ($resource === 'leaves') {
            $query->with(['leaveType', 'user']);
        } elseif ($resource === 'batches') {
            $query->with('classTeacher');
        } elseif ($resource === 'payslips') {
            $query->with('user');
        } elseif ($resource === 'student-fees') {
            $query->with(['student.batch', 'feeCategory']);
        } elseif ($resource === 'timetable') {
            $query->with(['batch', 'subject', 'user', 'timeSlot', 'classroom']);
        } elseif ($resource === 'activity-logs' || $resource === 'failed-logins') {
            $query->with(['causer', 'subject']);
        } elseif ($resource === 'substitute-assignments') {
            $query->with(['timetable.batch', 'timetable.timeSlot', 'substituteUser', 'absentUser']);
        } elseif ($resource === 'students') {
            $query->with(['batch.academicYear', 'studentFees']);
        } elseif ($resource === 'faculty') {
            $query->with(['subjects', 'assignedBatches', 'roles']);
        } elseif ($resource === 'users') {
            $query->with(['roles']);
        }

        $limit = $request->get('limit', 1000);
        $data = $query->latest()->limit($limit)->get();

        // Custom mappings for responses
        if ($resource === 'expenses') {
            $data = $data->map(function ($item) {
                $item->category = $item->category ? $item->category->name : 'General';
                $item->date = $item->expense_date;
                return $item;
            });
        } elseif ($resource === 'leaves') {
            $data = $data->map(function ($item) {
                $item->leave_type = $item->leaveType ? $item->leaveType->name : 'Sick Leave';
                $item->from = $item->start_date;
                $item->to = $item->end_date;
                $item->staff_name = $item->user ? $item->user->name : 'Staff Member';
                if ($item->start_date && $item->end_date) {
                    $days = (strtotime($item->end_date) - strtotime($item->start_date)) / 86400 + 1;
                    $item->days = (int)max(1, round($days));
                } else {
                    $item->days = 1;
                }
                return $item;
            });
        } elseif ($resource === 'faculty') {
            $data = $data->map(function ($item) {
                $sub = $item->subjects->first();
                $item->subject = $sub ? $sub->name : 'Academics';
                $item->classes = $item->assignedBatches->pluck('name')->toArray();
                $item->role = $item->roles->first() ? $item->roles->first()->name : 'faculty';
                return $item;
            });
        } elseif ($resource === 'batches') {
            $data = $data->map(function ($item) {
                $item->class_teacher_name = $item->classTeacher ? $item->classTeacher->name : 'N/A';
                return $item;
            });
        } elseif ($resource === 'payslips') {
            $data = $data->map(function ($item) {
                $item->name = $item->user ? $item->user->name : 'Staff Member';
                $item->designation = $item->user ? ($item->user->department ?? 'Senior Teacher') : 'Senior Teacher';
                $item->init = collect(explode(' ', $item->name))->map(fn($n) => $n[0] ?? '')->join('');
                return $item;
            });
        } elseif ($resource === 'student-fees') {
            $data = $data->map(function ($item) {
                $item->student_name = $item->student ? $item->student->name : 'Student';
                $item->student_roll = $item->student ? ($item->student->enrollment_number ?? 'N/A') : 'N/A';
                
                $batchName = $item->student && $item->student->batch ? $item->student->batch->name : '8A';
                $parsed = $this->parseBatchName($batchName);
                $item->class = $parsed['class'];
                $item->section = $parsed['section'];
                
                $item->fee_status = ucfirst($item->status ?? '');
                $item->fee_balance = $item->getRemainingAmount();
                return $item;
            });
        } elseif ($resource === 'timetable') {
            $data = $data->map(function ($item) {
                return [
                    'id' => $item->id,
                    'batch_name' => $item->batch ? $item->batch->name : '8A',
                    'subject' => $item->subject ? $item->subject->name : 'Mathematics',
                    'teacher' => $item->user ? $item->user->name : 'Staff',
                    'teacherId' => $item->user_id,
                    'room' => $item->classroom ? $item->classroom->name : 'Room 12',
                    'period' => $item->time_slot_id - 1,
                    'day' => $item->day_of_week ?? 'Monday',
                    'date' => $item->schedule_date ? $item->schedule_date->toDateString() : '2026-06-01',
                ];
            });
        } elseif ($resource === 'students') {
            $data = $data->map(function ($item) {
                // Calculate fee status
                $totalPaid = $item->studentFees->sum('paid_amount');
                $totalAmount = $item->studentFees->sum('amount');
                $totalConcession = $item->studentFees->sum('concession_amount');
                $netAmount = $totalAmount - $totalConcession;
                
                $feeStatus = 'Paid';
                if ($netAmount > 0) {
                    if ($totalPaid >= $netAmount) {
                        $feeStatus = 'Paid';
                    } elseif ($totalPaid > 0) {
                        $feeStatus = 'Partial';
                    } else {
                        $feeStatus = 'Unpaid';
                    }
                } else {
                    $feeStatus = 'Paid';
                }
                
                $item->fee_status = $feeStatus;
                $item->fee_total = $totalAmount;
                $item->fee_paid = $totalPaid;
                $item->fee_balance = max(0, $netAmount - $totalPaid);
                
                $batchName = $item->batch ? $item->batch->name : '8A';
                $parsed = $this->parseBatchName($batchName);
                $item->class = $parsed['class'];
                $item->section = $parsed['section'];
                return $item;
            });
        } elseif ($resource === 'activity-logs') {
            $data = $data->map(function ($item) {
                return [
                    'id' => (string)$item->id,
                    'log_name' => $item->log_name,
                    'description' => $item->description,
                    'event' => $item->event,
                    'subject_type' => $item->subject_type ? class_basename($item->subject_type) : null,
                    'subject_id' => $item->subject_id ? (string)$item->subject_id : null,
                    'causer_name' => $item->causer ? $item->causer->name : ($item->causer_id ? 'User #' . $item->causer_id : 'System'),
                    'causer_email' => $item->causer ? $item->causer->email : null,
                    'properties' => $item->properties,
                    'created_at' => $item->created_at ? $item->created_at->toIso8601String() : null,
                ];
            });
        } elseif ($resource === 'failed-logins') {
            $data = $data->map(function ($item) {
                $props = is_array($item->properties) ? $item->properties : (is_object($item->properties) ? (array)$item->properties : []);
                // Handle Spatie's Collection/Arrayable properties
                if ($item->properties && method_exists($item->properties, 'toArray')) {
                    $props = $item->properties->toArray();
                }
                return [
                    'id'             => (string)$item->id,
                    'description'    => $item->description,
                    'attempted_email'=> $props['attempted_email'] ?? null,
                    'ip_address'     => $props['ip_address'] ?? null,
                    'user_agent'     => $props['user_agent'] ?? null,
                    'reason'         => $props['reason'] ?? 'Unknown',
                    'causer_name'    => $item->causer ? $item->causer->name : null,
                    'causer_email'   => $item->causer ? $item->causer->email : null,
                    'causer_id'      => $item->causer_id ? (string)$item->causer_id : null,
                    'created_at'     => $item->created_at ? $item->created_at->toIso8601String() : null,
                ];
            });
        }

        return response()->json($data);
    }

    /**
     * Show resource.
     */
    public function show($resource, $id)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        $query = $modelClass::query();
        if ($resource === 'faculty') {
            $query->role('faculty');
        }

        $item = $query->find($id);
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        if ($resource === 'expenses') {
            $item->load('category');
            $item->category = $item->category ? $item->category->name : 'General';
            $item->date = $item->expense_date;
        } elseif ($resource === 'leaves') {
            $item->load(['leaveType', 'user']);
            $item->leave_type = $item->leaveType ? $item->leaveType->name : 'Sick Leave';
            $item->from = $item->start_date;
            $item->to = $item->end_date;
            $item->staff_name = $item->user ? $item->user->name : 'Staff Member';
            if ($item->start_date && $item->end_date) {
                $days = (strtotime($item->end_date) - strtotime($item->start_date)) / 86400 + 1;
                $item->days = (int)max(1, round($days));
            } else {
                $item->days = 1;
            }
        } elseif ($resource === 'faculty') {
            $item->load(['subjects', 'assignedBatches']);
            $sub = $item->subjects->first();
            $item->subject = $sub ? $sub->name : 'Academics';
            $item->classes = $item->assignedBatches->pluck('name')->toArray();
        } elseif ($resource === 'batches') {
            $item->load('classTeacher');
            $item->class_teacher_name = $item->classTeacher ? $item->classTeacher->name : 'N/A';
        } elseif ($resource === 'substitute-assignments') {
            $item->load(['timetable.batch', 'timetable.timeSlot', 'substituteUser', 'absentUser']);
        } elseif ($resource === 'payslips') {
            $item->load('user');
            $item->name = $item->user ? $item->user->name : 'Staff Member';
            $item->designation = $item->user ? ($item->user->department ?? 'Senior Teacher') : 'Senior Teacher';
            $item->init = collect(explode(' ', $item->name))->map(fn($n) => $n[0] ?? '')->join('');
        } elseif ($resource === 'student-fees') {
            $item->load(['student.batch', 'feeCategory']);
            $item->student_name = $item->student ? $item->student->name : 'Student';
            $item->student_roll = $item->student ? ($item->student->enrollment_number ?? 'N/A') : 'N/A';
            
            $batchName = $item->student && $item->student->batch ? $item->student->batch->name : '8A';
            $parsed = $this->parseBatchName($batchName);
            $item->class = $parsed['class'];
            $item->section = $parsed['section'];
            
            $item->fee_status = ucfirst($item->status ?? '');
            $item->fee_balance = $item->getRemainingAmount();
        } elseif ($resource === 'students') {
            $item->load(['batch.academicYear', 'studentFees']);
            $totalPaid = $item->studentFees->sum('paid_amount');
            $totalAmount = $item->studentFees->sum('amount');
            $totalConcession = $item->studentFees->sum('concession_amount');
            $netAmount = $totalAmount - $totalConcession;
            
            $feeStatus = 'Paid';
            if ($netAmount > 0) {
                if ($totalPaid >= $netAmount) {
                    $feeStatus = 'Paid';
                } elseif ($totalPaid > 0) {
                    $feeStatus = 'Partial';
                } else {
                    $feeStatus = 'Unpaid';
                }
            } else {
                $feeStatus = 'Paid';
            }
            
            $item->fee_status = $feeStatus;
            $item->fee_total = $totalAmount;
            $item->fee_paid = $totalPaid;
            $item->fee_balance = max(0, $netAmount - $totalPaid);
            
            $batchName = $item->batch ? $item->batch->name : '8A';
            $parsed = $this->parseBatchName($batchName);
            $item->class = $parsed['class'];
            $item->section = $parsed['section'];
        }

        if ($resource === 'settings') {
            $constructedValue = $this->constructSettingFromTables($item->key);
            if ($constructedValue !== null) {
                $item->value = $constructedValue;
            }
            $this->filterSettingForNonAdmin($item, auth('sanctum')->user());
        }

        return response()->json($item);
    }

    /**
     * Store resource.
     */
    public function store(Request $request, $resource)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        if ($denied = $this->authorizeWrite($request, $resource)) {
            return $denied;
        }

        $data = $request->all();

        // Prevent settings duplicate entry / race conditions by using updateOrCreate on settings key
        if ($resource === 'settings') {
            $key = $data['key'] ?? null;
            if ($key) {
                if (in_array($key, ['kts_student_attendance_records', 'kts_holidays', 'examinations_exams', 'kts_student_marks', 'examinations_schedules'])) {
                    $this->syncSettingToTables($key, $data['value'] ?? '');
                    
                    // Return a virtual setting object to satisfy the frontend client
                    $item = new \App\Models\Setting();
                    $item->id = 999999;
                    $item->key = $key;
                    $item->value = $data['value'] ?? '';
                    return response()->json($item, 201);
                }

                $columns = $this->getTableColumns($modelClass);
                $data = array_intersect_key($data, array_flip($columns));
                $item = $modelClass::updateOrCreate(['key' => $key], $data);
                $this->syncSettingToTables($key, $item->value);
                return response()->json($item, 201);
            }
        }

        // Custom validation / default attributes for Student
        if ($resource === 'students') {
            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }
            if (!isset($data['admission_date'])) {
                $data['admission_date'] = now()->toDateString();
            }
            
            // Ensure we have a valid academic year
            $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() 
                ?? \App\Models\AcademicYear::first();
            if (!$academicYear) {
                $academicYear = \App\Models\AcademicYear::create([
                    'name' => '2026-2027',
                    'start_date' => '2026-06-01',
                    'end_date' => '2027-05-31',
                    'is_current' => true,
                ]);
            }
            
            // Assign a default course if none provided
            if (!isset($data['course_id'])) {
                $firstCourse = \App\Models\Course::first();
                if ($firstCourse) {
                    $data['course_id'] = $firstCourse->id;
                } else {
                    $newCourse = \App\Models\Course::create([
                        'name' => 'Default Course',
                        'code' => 'DFT',
                        'duration_in_years' => 1.0,
                    ]);
                    $data['course_id'] = $newCourse->id;
                }
            }

            // Assign batch using class and section from frontend if available
            if (isset($data['class']) && isset($data['section'])) {
                $batchName = $data['class'] . $data['section'];
                $batch = \App\Models\Batch::where('name', $batchName)->first();
                if (!$batch) {
                    $batch = \App\Models\Batch::create([
                        'name' => $batchName,
                        'course_id' => $data['course_id'],
                        'academic_year_id' => $academicYear->id,
                        'start_date' => '2026-06-01',
                        'end_date' => '2027-05-31',
                        'status' => 'active',
                    ]);
                }
                $data['batch_id'] = $batch->id;
            }

            // Assign a default batch if none provided
            if (!isset($data['batch_id'])) {
                $firstBatch = \App\Models\Batch::first();
                if ($firstBatch) {
                    $data['batch_id'] = $firstBatch->id;
                } else {
                    // Create default batch
                    $newBatch = \App\Models\Batch::create([
                        'name' => 'Default Batch',
                        'course_id' => $data['course_id'],
                        'academic_year_id' => $academicYear->id,
                        'start_date' => '2026-06-01',
                        'end_date' => '2027-05-31',
                    ]);
                    $data['batch_id'] = $newBatch->id;
                }
            }

            // Instantiate to generate enrollment number
            if (empty($data['enrollment_number'])) {
                $tempStudent = new \App\Models\Student($data);
                $data['enrollment_number'] = $tempStudent->generateNewEnrollmentNumber();
            }
        }

        // Custom validation / default attributes for Batch
        if ($resource === 'batches') {
            $academicYear = null;
            if (isset($data['academic_year_id'])) {
                $academicYear = \App\Models\AcademicYear::find($data['academic_year_id']);
            }
            if (!$academicYear) {
                $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() 
                    ?? \App\Models\AcademicYear::first();
                if (!$academicYear) {
                    $academicYear = \App\Models\AcademicYear::create([
                        'name' => '2026-2027',
                        'start_date' => '2026-06-01',
                        'end_date' => '2027-05-31',
                        'is_current' => true,
                    ]);
                }
                $data['academic_year_id'] = $academicYear->id;
            }
            
            $course = null;
            if (isset($data['course_id'])) {
                $course = \App\Models\Course::find($data['course_id']);
            }
            if (!$course) {
                $firstCourse = \App\Models\Course::first();
                if ($firstCourse) {
                    $data['course_id'] = $firstCourse->id;
                } else {
                    $newCourse = \App\Models\Course::create([
                        'name' => 'Default Course',
                        'code' => 'DFT',
                        'duration_in_years' => 1.0,
                    ]);
                    $data['course_id'] = $newCourse->id;
                }
            }

            if (isset($data['class_teacher_id']) && $data['class_teacher_id']) {
                if (!\App\Models\User::where('id', $data['class_teacher_id'])->exists()) {
                    $data['class_teacher_id'] = null;
                }
            }
        }

        // Custom validation / default attributes for Expenses
        if ($resource === 'expenses') {
            $catName = $data['category'] ?? 'General';
            $category = \App\Models\ExpenseCategory::where('name', $catName)->first();
            if (!$category) {
                $category = \App\Models\ExpenseCategory::create(['name' => $catName]);
            }
            $data['expense_category_id'] = $category->id;
            
            if (isset($data['date'])) {
                $data['expense_date'] = $data['date'];
            } else {
                $data['expense_date'] = now()->toDateString();
            }
        }

        // Custom validation / default attributes for Leave Application
        if ($resource === 'leaves') {
            $typeName = $data['leave_type'] ?? 'Sick Leave';
            $leaveType = \App\Models\LeaveType::where('name', $typeName)->first();
            if (!$leaveType) {
                $leaveType = \App\Models\LeaveType::create([
                    'name' => $typeName,
                    'days_per_year' => 12,
                ]);
            }
            $data['leave_type_id'] = $leaveType->id;
            
            if (isset($data['from'])) {
                $data['start_date'] = $data['from'];
            }
            if (isset($data['to'])) {
                $data['end_date'] = $data['to'];
            }
            
            if (!isset($data['status'])) {
                $data['status'] = 'Pending';
            }
            
            if (!isset($data['user_id'])) {
                $firstUser = \App\Models\User::first();
                $data['user_id'] = $firstUser ? $firstUser->id : 1;
            }
        }

        // Custom hashing / role creation for User/Faculty
        if ($resource === 'users' || $resource === 'faculty') {
            if (isset($data['password'])) {
                $data['password'] = bcrypt($data['password']);
            } else {
                $data['password'] = bcrypt('password'); // Default password
            }
            if (isset($data['subject'])) {
                $subjectName = $data['subject'];
                $code = strtoupper(substr($subjectName, 0, 3));
                $originalCode = $code;
                $counter = 1;
                while (\App\Models\Subject::where('code', $code)->where('name', '!=', $subjectName)->exists()) {
                    $code = substr($originalCode, 0, 2) . $counter; // Keep it short, e.g. BU1, BU2
                    $counter++;
                }
                
                $subjectRecord = \App\Models\Subject::firstOrCreate([
                    'name' => $subjectName,
                ], [
                    'code' => $code,
                ]);
                $request->merge(['subject_id_to_attach' => $subjectRecord->id]);
            }
        }

        // Custom bulk save / creation for Timetable
        if ($resource === 'timetable' && $request->has('batch_name')) {
            $batchName = $request->input('batch_name');

            $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() 
                ?? \App\Models\AcademicYear::first();
            if (!$academicYear) {
                $academicYear = \App\Models\AcademicYear::create([
                    'name' => '2026-2027',
                    'start_date' => '2026-06-01',
                    'end_date' => '2027-05-31',
                    'is_current' => true,
                ]);
            }

            $course = \App\Models\Course::first();
            if (!$course) {
                $course = \App\Models\Course::create([
                    'name' => 'Default Course',
                    'code' => 'DFT',
                    'duration_in_years' => 1.0,
                ]);
            }

            $batch = \App\Models\Batch::firstOrCreate(
                ['name' => $batchName],
                [
                    'course_id' => $course->id,
                    'academic_year_id' => $academicYear->id,
                    'start_date' => '2026-06-01',
                    'end_date' => '2027-05-31',
                    'status' => 'active',
                ]
            );
            
            \App\Models\Timetable::where('batch_id', $batch->id)->delete();
            
            $slots = $request->input('slots', []);
            foreach ($slots as $slot) {
                $classroom = \App\Models\Classroom::firstOrCreate(
                    ['name' => $slot['room'] ?? 'Room 12'],
                    ['type' => 'lecture', 'capacity' => 40]
                );
                
                $subject = \App\Models\Subject::firstOrCreate(
                    ['name' => $slot['subject']],
                    ['code' => strtoupper(substr($slot['subject'], 0, 3))]
                );
                
                $convertTime = function ($timeString) {
                    if (!$timeString) return null;
                    try {
                        return \Carbon\Carbon::parse($timeString)->format('H:i:s');
                    } catch (\Exception $e) {
                        return null;
                    }
                };

                $startTime = $convertTime($slot['start_time'] ?? null) ?? '08:00:00';
                $endTime = $convertTime($slot['end_time'] ?? null) ?? '09:00:00';

                $periodIndex = intval($slot['period']);
                $timeSlot = \App\Models\TimeSlot::firstOrCreate(
                    ['id' => $periodIndex + 1],
                    [
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                    ]
                );
                
                if ($timeSlot->start_time !== $startTime || $timeSlot->end_time !== $endTime) {
                    $timeSlot->update([
                        'start_time' => $startTime,
                        'end_time' => $endTime
                    ]);
                }
                
                $userId = intval($slot['teacherId']);
                if ($userId > 0) {
                    \DB::table('users')->insertOrIgnore([
                        'id' => $userId,
                        'name' => $slot['teacher'] ?? ('Teacher ' . $userId),
                        'email' => 'teacher_' . $userId . '@krishnaveni.edu',
                        'password' => bcrypt('password'),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $fallbackUser = \App\Models\User::first();
                    $userId = $fallbackUser ? $fallbackUser->id : 1;
                }
                
                // Store day_of_week directly (e.g., 'Monday', 'Tuesday')
                $dayOfWeek = $slot['day'] ?? $slot['date'] ?? 'Monday';
                
                \App\Models\Timetable::create([
                    'batch_id' => $batch->id,
                    'subject_id' => $subject->id,
                    'user_id' => $userId,
                    'classroom_id' => $classroom->id,
                    'time_slot_id' => $timeSlot->id,
                    'day_of_week' => $dayOfWeek,
                    'schedule_date' => '2026-06-01', // Keep for compatibility
                    'academic_year_id' => $academicYear->id,
                ]);
            }
            return response()->json(['success' => true], 201);
        }

        // Custom individual and bulk assignments for student-fees
        if ($resource === 'student-fees') {
            $catName = $data['category'] ?? 'Term Fee';
            $category = \App\Models\FeeCategory::firstOrCreate(
                ['name' => $catName],
                ['code' => strtoupper(substr($catName, 0, 3)), 'category_type' => 'tuition']
            );
            $data['fee_category_id'] = $category->id;
            
            if (isset($data['class_name'])) {
                $batchName = $data['class_name'];
                $batch = \App\Models\Batch::where('name', $batchName)->first();
                if ($batch) {
                    $feeStruct = \App\Models\FeeStructure::where('batch_id', $batch->id)->first();
                    if (!$feeStruct) {
                        $feeStruct = \App\Models\FeeStructure::create([
                            'batch_id' => $batch->id,
                            'fee_category_id' => $category->id,
                            'total_amount' => $data['amount'],
                            'payment_terms' => 1,
                            'amount' => $data['amount']
                        ]);
                    }
                    $students = \App\Models\Student::where('batch_id', $batch->id)->get();
                    $created = [];
                    foreach ($students as $st) {
                        $fee = \App\Models\StudentFee::create([
                            'student_id' => $st->id,
                            'fee_structure_id' => $feeStruct->id,
                            'fee_category_id' => $category->id,
                            'amount' => $data['amount'],
                            'original_amount' => $data['amount'],
                            'paid_amount' => 0,
                            'concession_amount' => 0,
                            'due_date' => $data['due_date'] ?? now()->addMonth()->toDateString(),
                            'status' => 'unpaid',
                        ]);
                        $created[] = $fee;
                    }
                    return response()->json($created, 201);
                }
                return response()->json(['error' => 'Class not found'], 404);
            } else {
                if (isset($data['student_id'])) {
                    $student = \App\Models\Student::find($data['student_id']);
                    if ($student) {
                        $batchId = $student->batch_id ?? 1;
                        $feeStruct = \App\Models\FeeStructure::where('batch_id', $batchId)->first();
                        if (!$feeStruct) {
                            $feeStruct = \App\Models\FeeStructure::create([
                                'batch_id' => $batchId,
                                'fee_category_id' => $category->id,
                                'total_amount' => $data['amount'],
                                'payment_terms' => 1,
                                'amount' => $data['amount']
                            ]);
                        }
                        $data['fee_structure_id'] = $feeStruct->id;
                    }
                }
                if (!isset($data['original_amount'])) {
                    $data['original_amount'] = $data['amount'];
                }
                if (!isset($data['paid_amount'])) {
                    $data['paid_amount'] = 0;
                }
                if (!isset($data['concession_amount'])) {
                    $data['concession_amount'] = 0;
                }
                if (!isset($data['status'])) {
                    $data['status'] = 'unpaid';
                }
            }
        }

        // Filter out fields that do not exist as columns in the database table
        $columns = $this->getTableColumns($modelClass);
        $data = array_intersect_key($data, array_flip($columns));
        unset($data['id']);

        $item = $modelClass::create($data);

        // Assign role if provided, otherwise default to faculty if created via faculty endpoint
        if ($resource === 'faculty' || $resource === 'users') {
            if ($request->has('role') && !empty($request->input('role'))) {
                $item->syncRoles([$request->input('role')]);
            } else if ($resource === 'faculty') {
                $item->assignRole('faculty');
            }
            
            // Automatically generate unique 4-digit biometric code if empty
            if (empty($item->biometric_employee_code)) {
                $attempts = 0;
                $generatedCode = null;
                do {
                    $code = str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);
                    $existsUser = \App\Models\User::where('biometric_employee_code', $code)->exists();
                    $existsStudent = class_exists(\App\Models\Student::class) && \App\Models\Student::where('biometric_employee_code', $code)->exists();
                    if (!$existsUser && !$existsStudent) {
                        $generatedCode = $code;
                        break;
                    }
                    $attempts++;
                } while ($attempts < 1000);
                
                if ($generatedCode) {
                    $item->update(['biometric_employee_code' => $generatedCode]);
                }
            }
        }

        // Attach subject pivot
        if (($resource === 'faculty' || $resource === 'users') && $request->has('subject_id_to_attach')) {
            $item->subjects()->sync([$request->input('subject_id_to_attach')]);
        }

        // Notification for leave creation
        if ($resource === 'leaves') {
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $userName = $item->user ? $item->user->name : 'Staff Member';
                $typeName = $item->leaveType ? $item->leaveType->name : 'Sick Leave';
                $notificationService->send([
                    'title' => 'New Leave Application',
                    'message' => $userName . " has applied for " . $typeName . " from " . $item->start_date . " to " . $item->end_date,
                    'type' => 'info',
                    'category' => 'academic',
                    'priority' => 'normal',
                    'roles' => ['super-admin', 'admin', 'college-admin'],
                    'data' => [
                        'application_id' => $item->id,
                        'applicant_id' => $item->user_id,
                        'applicant_name' => $userName,
                    ],
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send leave notification: ' . $e->getMessage());
            }
        }

        return response()->json($item, 201);
    }

    /**
     * Store bulk resources.
     */
    public function bulkStore(Request $request, $resource)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource ' . $resource . ' not found'], 404);
        }

        if ($denied = $this->authorizeWrite($request, $resource)) {
            return $denied;
        }

        $records = $request->input('records', []);
        if (!is_array($records)) {
            return response()->json(['error' => 'Expected records array'], 400);
        }

        $created = [];

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            foreach ($records as $recordData) {
                $data = $recordData;

                // Custom validation / default attributes for Student
                if ($resource === 'students') {
                    if (!isset($data['status'])) {
                        $data['status'] = 'active';
                    }
                    if (!isset($data['admission_date'])) {
                        $data['admission_date'] = now()->toDateString();
                    }
                    
                    // Ensure we have a valid academic year
                    $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() 
                        ?? \App\Models\AcademicYear::first();
                    if (!$academicYear) {
                        $academicYear = \App\Models\AcademicYear::create([
                            'name' => '2026-2027',
                            'start_date' => '2026-06-01',
                            'end_date' => '2027-05-31',
                            'is_current' => true,
                        ]);
                    }
                    
                    // Assign a default course if none provided
                    if (!isset($data['course_id'])) {
                        $firstCourse = \App\Models\Course::first();
                        if ($firstCourse) {
                            $data['course_id'] = $firstCourse->id;
                        } else {
                            $newCourse = \App\Models\Course::create([
                                'name' => 'Default Course',
                                'code' => 'DFT',
                                'duration_in_years' => 1.0,
                            ]);
                            $data['course_id'] = $newCourse->id;
                        }
                    }

                    // Assign batch using class and section from frontend if available
                    if (isset($data['class']) && isset($data['section'])) {
                        $batchName = $data['class'] . $data['section'];
                        $batch = \App\Models\Batch::where('name', $batchName)->first();
                        if (!$batch) {
                            $batch = \App\Models\Batch::create([
                                'name' => $batchName,
                                'course_id' => $data['course_id'],
                                'academic_year_id' => $academicYear->id,
                                'start_date' => '2026-06-01',
                                'end_date' => '2027-05-31',
                                'status' => 'active',
                            ]);
                        }
                        $data['batch_id'] = $batch->id;
                    }

                    // Assign a default batch if none provided
                    if (!isset($data['batch_id'])) {
                        $firstBatch = \App\Models\Batch::first();
                        if ($firstBatch) {
                            $data['batch_id'] = $firstBatch->id;
                        } else {
                            // Create default batch
                            $newBatch = \App\Models\Batch::create([
                                'name' => 'Default Batch',
                                'course_id' => $data['course_id'],
                                'academic_year_id' => $academicYear->id,
                                'start_date' => '2026-06-01',
                                'end_date' => '2027-05-31',
                            ]);
                            $data['batch_id'] = $newBatch->id;
                        }
                    }

                    // Instantiate to generate enrollment number
                    if (empty($data['enrollment_number'])) {
                        $tempStudent = new \App\Models\Student($data);
                        $data['enrollment_number'] = $tempStudent->generateNewEnrollmentNumber();
                    }
                }

                // Filter out fields that do not exist as columns in the database table
                $columns = $this->getTableColumns($modelClass);
                $data = array_intersect_key($data, array_flip($columns));

                $item = $modelClass::create($data);

                // Assign 'faculty' role if created via faculty endpoint
                if ($resource === 'faculty') {
                    $item->assignRole('faculty');
                }

                // Attach subject pivot
                if (($resource === 'faculty' || $resource === 'users') && isset($recordData['subject_id_to_attach'])) {
                    $item->subjects()->sync([$recordData['subject_id_to_attach']]);
                }

                $created[] = $item;
            }
            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollback();
            return response()->json(['error' => 'Bulk store failed: ' . $e->getMessage()], 500);
        }

        return response()->json($created, 201);
    }

    /**
     * Update resource.
     */
    public function update(Request $request, $resource, $id)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        $item = $modelClass::find($id);
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        if ($denied = $this->authorizeWrite($request, $resource, $item)) {
            return $denied;
        }

        $data = $request->all();

        // Custom pre-processing for Expenses in update
        if ($resource === 'expenses') {
            if (isset($data['category'])) {
                $catName = $data['category'];
                $category = \App\Models\ExpenseCategory::where('name', $catName)->first();
                if (!$category) {
                    $category = \App\Models\ExpenseCategory::create(['name' => $catName]);
                }
                $data['expense_category_id'] = $category->id;
            }
            if (isset($data['date'])) {
                $data['expense_date'] = $data['date'];
            }
        }

        // Custom pre-processing for Leaves in update
        if ($resource === 'leaves') {
            if (isset($data['leave_type'])) {
                $typeName = $data['leave_type'];
                $leaveType = \App\Models\LeaveType::where('name', $typeName)->first();
                if (!$leaveType) {
                    $leaveType = \App\Models\LeaveType::create([
                        'name' => $typeName,
                        'days_per_year' => 12,
                    ]);
                }
                $data['leave_type_id'] = $leaveType->id;
            }
            if (isset($data['from'])) {
                $data['start_date'] = $data['from'];
            }
            if (isset($data['to'])) {
                $data['end_date'] = $data['to'];
            }
        }

        // Custom pre-processing for Students in update
        if ($resource === 'students') {
            if (isset($data['class']) && isset($data['section'])) {
                $batchName = $data['class'] . $data['section'];
                $batch = \App\Models\Batch::where('name', $batchName)->first();
                if (!$batch) {
                    $academicYear = \App\Models\AcademicYear::where('is_current', true)->first() 
                        ?? \App\Models\AcademicYear::first();
                    $course = \App\Models\Course::first();
                    $batch = \App\Models\Batch::create([
                        'name' => $batchName,
                        'course_id' => $course ? $course->id : 1,
                        'academic_year_id' => $academicYear ? $academicYear->id : 1,
                        'start_date' => '2026-06-01',
                        'end_date' => '2027-05-31',
                        'status' => 'active',
                    ]);
                }
                $data['batch_id'] = $batch->id;
            }
        }

        // Custom pre-processing for Batches in update
        if ($resource === 'batches') {
            if (isset($data['class_teacher_id']) && $data['class_teacher_id']) {
                if (!\App\Models\User::where('id', $data['class_teacher_id'])->exists()) {
                    $data['class_teacher_id'] = null;
                }
            }
        }

        if (($resource === 'users' || $resource === 'faculty') && isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        if (($resource === 'users' || $resource === 'faculty') && isset($data['subject'])) {
            $subjectName = $data['subject'];
            $subjectRecord = \App\Models\Subject::firstOrCreate([
                'name' => $subjectName,
            ], [
                'code' => strtoupper(substr($subjectName, 0, 3)),
                'requires_lab' => false,
            ]);
            $request->merge(['subject_id_to_attach' => $subjectRecord->id]);
        }

        // Filter out fields that do not exist as columns in the database table
        $columns = $this->getTableColumns($modelClass);
        $data = array_intersect_key($data, array_flip($columns));

        $oldStatus = $item->status;

        if ($resource === 'settings' && in_array($item->key, ['kts_student_attendance_records', 'kts_holidays', 'examinations_exams', 'kts_student_marks', 'examinations_schedules'])) {
            $this->syncSettingToTables($item->key, $data['value'] ?? '');
            $item->value = $data['value'] ?? '';
            return response()->json($item);
        }

        $item->update($data);

        if ($resource === 'settings') {
            $this->syncSettingToTables($item->key, $item->value);
        }

        // Notification for leave status change
        if ($resource === 'leaves' && isset($data['status']) && $data['status'] !== $oldStatus) {
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $typeName = $item->leaveType ? $item->leaveType->name : 'Sick Leave';
                $status = $data['status'];
                $notes = isset($data['admin_notes']) ? $data['admin_notes'] : '';
                
                $message = "Your " . $typeName . " request has been " . $status;
                if ($status === 'Rejected' && !empty($notes)) {
                    $message .= ". Reason: " . $notes;
                }
                
                $notificationService->send([
                    'title' => 'Leave Application ' . $status,
                    'message' => $message,
                    'type' => $status === 'Approved' ? 'success' : 'warning',
                    'category' => 'academic',
                    'priority' => 'normal',
                    'users' => [$item->user_id],
                    'data' => [
                        'application_id' => $item->id,
                        'status' => $status,
                        'admin_notes' => $notes,
                    ],
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send leave status update notification: ' . $e->getMessage());
            }
        }

        // Attach subject pivot
        if (($resource === 'faculty' || $resource === 'users') && $request->has('subject_id_to_attach')) {
            $item->subjects()->sync([$request->input('subject_id_to_attach')]);
        }

        // Update role if provided
        if (($resource === 'faculty' || $resource === 'users') && $request->has('role') && !empty($request->input('role'))) {
            $item->syncRoles([$request->input('role')]);
        }

        return response()->json($item);
    }

    /**
     * Delete resource.
     */
    public function destroy(Request $request, $resource, $id)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        $item = $modelClass::find($id);
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        if ($denied = $this->authorizeWrite($request, $resource, $item)) {
            return $denied;
        }

        if ($resource === 'batches') {
            if ($item->students()->count() > 0) {
                return response()->json(['error' => 'Cannot delete this section because it has enrolled students.'], 400);
            }
        }

        $item->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Intercept and synchronize specific JSON setting keys to their respected individual database tables.
     */
    private function syncSettingToTables($key, $valueStr)
    {
        try {
            $data = json_decode($valueStr, true);
            if (!is_array($data)) return;

            // All-or-nothing: a failure mid-sync must never leave a table
            // emptied by a delete without its matching re-insert.
            \Illuminate\Support\Facades\DB::transaction(function () use ($key, $data) {

            // ── 1. HOLIDAYS Sync ───────────────────────────────────────────
            if ($key === 'kts_holidays') {
                \App\Models\Holiday::query()->delete();
                foreach ($data as $item) {
                    if (isset($item['name']) && isset($item['date'])) {
                        \App\Models\Holiday::create([
                            'name' => $item['name'],
                            'date' => $item['date'],
                        ]);
                    }
                }
            }

            // ── 2. ATTENDANCE Sync ─────────────────────────────────────────
            // Upsert per (student, date) instead of wiping the whole table:
            // two teachers saving different classes concurrently no longer
            // erase each other's records. Unresolvable students are skipped
            // and logged — never attached to a wrong student.
            // ponytail: record deletions in the client blob do not propagate; add
            // tombstone handling if per-record deletion becomes a real workflow.
            if ($key === 'kts_student_attendance_records') {
                $academicYear = \App\Models\AcademicYear::where('is_current', true)->first()
                    ?? \App\Models\AcademicYear::first();
                $academicYearId = $academicYear ? $academicYear->id : null;

                $batchesCache = \App\Models\Batch::pluck('id', 'name')->toArray();
                $studentsByName = \App\Models\Student::pluck('id', 'name')->toArray();
                $studentIds = \App\Models\Student::pluck('id')->flip()->toArray();

                foreach ($data as $item) {
                    if (!isset($item['studentName']) || !isset($item['date'])) continue;

                    $studentId = null;
                    if (isset($item['studentId']) && is_numeric($item['studentId']) && isset($studentIds[intval($item['studentId'])])) {
                        $studentId = intval($item['studentId']);
                    }
                    if (!$studentId) {
                        $studentId = $studentsByName[$item['studentName']] ?? null;
                    }
                    if (!$studentId) {
                        \Log::warning('Attendance sync: skipping record for unknown student "' . $item['studentName'] . '" on ' . $item['date']);
                        continue;
                    }

                    $batchId = null;
                    if (isset($item['className'])) {
                        $batchId = $batchesCache[$item['className']] ?? null;
                        if (!$batchId) {
                            $batch = \App\Models\Batch::create([
                                'name' => $item['className'],
                                'course_id' => 1,
                                'academic_year_id' => $academicYearId ?? 1,
                                'start_date' => '2026-06-01',
                                'end_date' => '2027-05-31',
                            ]);
                            $batchId = $batch->id;
                            $batchesCache[$item['className']] = $batchId;
                        }
                    }
                    if (!$batchId) {
                        \Log::warning('Attendance sync: skipping record with no class for student ID ' . $studentId . ' on ' . $item['date']);
                        continue;
                    }

                    $status = in_array(strtolower($item['status'] ?? ''), ['present', 'absent', 'late', 'excused'])
                        ? strtolower($item['status'])
                        : 'present';
                    $markedBy = isset($item['markedById']) && is_numeric($item['markedById'])
                        ? intval($item['markedById'])
                        : 1;

                    \App\Models\Attendance::updateOrCreate([
                        'student_id' => $studentId,
                        'attendance_date' => $item['date'],
                    ], [
                        'batch_id' => $batchId,
                        'status' => $status,
                        'marked_by' => $markedBy,
                        'marked_at' => $item['markedAt'] ?? now(),
                        'academic_year_id' => $academicYearId,
                    ]);
                }
            }

            // ── 3. EXAMS & SCHEDULES Sync ──────────────────────────────────
            if ($key === 'examinations_exams') {
                \App\Models\Exam::query()->delete();
                foreach ($data as $item) {
                    if (isset($item['name'])) {
                        \App\Models\Exam::create([
                            'id' => intval($item['id']),
                            'name' => $item['name'],
                            'subject' => $item['subject'] ?? null,
                            'class' => $item['class'] ?? null,
                            'exam_date' => $item['date'] ?? null,
                            'max_marks' => intval($item['maxMarks'] ?? 100),
                            'status' => $item['status'] ?? 'Upcoming',
                        ]);
                    }
                }
            }

            // Upsert per (exam, student) so two teachers entering marks for
            // different exams concurrently cannot erase each other's rows.
            if ($key === 'kts_student_marks') {
                foreach ($data as $examId => $results) {
                    if (!is_array($results)) continue;
                    foreach ($results as $item) {
                        if (isset($item['name'])) {
                            \App\Models\Mark::updateOrCreate([
                                'exam_id' => intval($examId),
                                'student_name' => $item['name'],
                            ], [
                                'roll' => $item['roll'] ?? null,
                                'maths' => intval($item['maths'] ?? 0),
                                'science' => intval($item['science'] ?? 0),
                                'english' => intval($item['english'] ?? 0),
                                'telugu' => intval($item['telugu'] ?? 0),
                                'social' => intval($item['social'] ?? 0),
                                'total' => intval($item['total'] ?? 0),
                                'percentage' => doubleval($item['percentage'] ?? 0),
                                'grade' => $item['grade'] ?? null,
                                'rank' => intval($item['rank'] ?? 0),
                            ]);
                        }
                    }
                }
            }

            if ($key === 'examinations_schedules') {
                \App\Models\ExamSchedule::query()->delete();
                foreach ($data as $examId => $classes) {
                    if (!is_array($classes)) continue;
                    foreach ($classes as $className => $dates) {
                        if (!is_array($dates)) continue;
                        foreach ($dates as $dateStr => $entries) {
                            if (!is_array($entries)) continue;
                            foreach ($entries as $entry) {
                                if (isset($entry['subject'])) {
                                    \App\Models\ExamSchedule::create([
                                        'exam_id' => intval($examId),
                                        'class_name' => $className,
                                        'date_str' => $dateStr,
                                        'subject' => $entry['subject'],
                                        'time' => $entry['time'] ?? null,
                                        'duration' => $entry['duration'] ?? null,
                                        'max_marks' => intval($entry['maxMarks'] ?? 100),
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            }); // end transaction

        } catch (\Exception $e) {
            \Log::error('Settings sync to tables failed for key ' . $key . ': ' . $e->getMessage());
        }
    }

    /**
     * Dynamically construct settings values from the respected database tables.
     */
    private function constructSettingFromTables($key)
    {
        // ── 1. HOLIDAYS ──────────────────────────────────────────────────
        if ($key === 'kts_holidays') {
            $holidays = \App\Models\Holiday::all();
            $mapped = [];
            foreach ($holidays as $h) {
                $mapped[] = [
                    'date' => $h->date,
                    'name' => $h->name,
                    'description' => '',
                    'color' => 'red',
                ];
            }
            return json_encode($mapped);
        }

        // ── 2. ATTENDANCE ────────────────────────────────────────────────
        if ($key === 'kts_student_attendance_records') {
            $attendances = \App\Models\Attendance::with(['student', 'batch', 'markedBy'])->get();
            $mapped = [];
            foreach ($attendances as $a) {
                $mapped[] = [
                    'studentId' => (string)($a->student_id ?? ''),
                    'studentName' => $a->student->name ?? 'Student',
                    'roll' => $a->student->roll ?? '',
                    'className' => $a->batch->name ?? '8A',
                    'date' => $a->attendance_date ? (\Carbon\Carbon::parse($a->attendance_date)->toDateString()) : '',
                    'session' => 'Morning',
                    'status' => $a->status ?? 'present',
                    'markedBy' => $a->markedBy->name ?? 'Teacher',
                    'markedById' => (string)($a->marked_by ?? '1'),
                    'markedAt' => $a->marked_at ? \Carbon\Carbon::parse($a->marked_at)->toDateTimeString() : null,
                ];
            }
            return json_encode($mapped);
        }

        // ── 3. EXAMS ─────────────────────────────────────────────────────
        if ($key === 'examinations_exams') {
            $exams = \App\Models\Exam::all();
            $mapped = [];
            foreach ($exams as $e) {
                $mapped[] = [
                    'id' => (string)$e->id,
                    'name' => $e->name,
                    'subject' => $e->subject ?? 'All Subjects',
                    'class' => $e->class ?? '8A',
                    'date' => $e->exam_date,
                    'maxMarks' => $e->max_marks,
                    'status' => $e->status,
                ];
            }
            return json_encode($mapped);
        }

        // ── 4. MARKS ─────────────────────────────────────────────────────
        if ($key === 'kts_student_marks') {
            $marks = \App\Models\Mark::all();
            $mapped = [];
            foreach ($marks as $m) {
                $examId = (string)$m->exam_id;
                if (!isset($mapped[$examId])) {
                    $mapped[$examId] = [];
                }
                $mapped[$examId][] = [
                    'name' => $m->student_name,
                    'roll' => $m->roll,
                    'maths' => $m->maths,
                    'science' => $m->science,
                    'english' => $m->english,
                    'telugu' => $m->telugu,
                    'social' => $m->social,
                    'total' => $m->total,
                    'percentage' => doubleval($m->percentage),
                    'grade' => $m->grade,
                    'rank' => $m->rank,
                ];
            }
            return json_encode($mapped);
        }

        // ── 5. EXAM SCHEDULES ────────────────────────────────────────────
        if ($key === 'examinations_schedules') {
            $schedules = \App\Models\ExamSchedule::all();
            $mapped = [];
            foreach ($schedules as $s) {
                $examId = (string)$s->exam_id;
                $className = $s->class_name;
                $dateStr = $s->date_str;

                if (!isset($mapped[$examId])) {
                    $mapped[$examId] = [];
                }
                if (!isset($mapped[$examId][$className])) {
                    $mapped[$examId][$className] = [];
                }
                if (!isset($mapped[$examId][$className][$dateStr])) {
                    $mapped[$examId][$className][$dateStr] = [];
                }

                $mapped[$examId][$className][$dateStr][] = [
                    'subject' => $s->subject,
                    'time' => $s->time,
                    'duration' => $s->duration,
                    'maxMarks' => $s->max_marks,
                ];
            }
            return json_encode($mapped);
        }

        return null;
    }
}
