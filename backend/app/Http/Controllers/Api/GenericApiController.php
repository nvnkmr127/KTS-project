<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class GenericApiController extends Controller
{
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
        ];

        return $map[strtolower($resource)] ?? null;
    }

    /**
     * Parse batch name to extract class number and section letter.
     */
    private function parseBatchName($batchName): array
    {
        $batchName = strtoupper(trim($batchName));
        
        // Match standard format "8A" or "10B"
        if (preg_match('/^(\d+)\s*([A-Z])$/i', $batchName, $matches)) {
            return [
                'class' => $matches[1],
                'section' => $matches[2],
            ];
        }
        
        // Match format "6SECTION C" or "6 SECTION C"
        if (preg_match('/^(\d+)\s*(?:SECTION|SEC)\s*([A-Z])/i', $batchName, $matches)) {
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

        // Custom filter for faculty role
        if ($resource === 'faculty') {
            $query->whereHas('roles', function ($q) {
                $q->where('name', 'faculty');
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
        $columns = Schema::getColumnListing((new $modelClass)->getTable());
        foreach ($request->except(['page', 'limit', 'search', 'with', 'role', 'date']) as $key => $value) {
            if (in_array($key, $columns) && $value !== 'All' && $value !== '') {
                $query->where($key, $value);
            }
        }

        // Apply date filter if present
        if ($request->has('date') && $request->date !== '' && $request->date !== 'All') {
            if (in_array('created_at', $columns)) {
                $query->whereDate('created_at', $request->date);
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
            $query->with(['student', 'feeCategory']);
        } elseif ($resource === 'timetable') {
            $query->with(['batch', 'subject', 'user', 'timeSlot', 'classroom']);
        } elseif ($resource === 'activity-logs') {
            $query->with(['causer', 'subject']);
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
                $sub = $item->subjects()->first();
                $item->subject = $sub ? $sub->name : 'Academics';
                $item->classes = $item->assignedBatches()->pluck('name')->toArray();
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
                $totalPaid = $item->studentFees()->sum('paid_amount');
                $totalAmount = $item->studentFees()->sum('amount');
                $totalConcession = $item->studentFees()->sum('concession_amount');
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
            $sub = $item->subjects()->first();
            $item->subject = $sub ? $sub->name : 'Academics';
            $item->classes = $item->assignedBatches()->pluck('name')->toArray();
        } elseif ($resource === 'batches') {
            $item->load('classTeacher');
            $item->class_teacher_name = $item->classTeacher ? $item->classTeacher->name : 'N/A';
        } elseif ($resource === 'payslips') {
            $item->load('user');
            $item->name = $item->user ? $item->user->name : 'Staff Member';
            $item->designation = $item->user ? ($item->user->department ?? 'Senior Teacher') : 'Senior Teacher';
            $item->init = collect(explode(' ', $item->name))->map(fn($n) => $n[0] ?? '')->join('');
        } elseif ($resource === 'student-fees') {
            $item->load(['student', 'feeCategory']);
            $item->student_name = $item->student ? $item->student->name : 'Student';
            $item->student_roll = $item->student ? ($item->student->enrollment_number ?? 'N/A') : 'N/A';
            
            $batchName = $item->student && $item->student->batch ? $item->student->batch->name : '8A';
            $parsed = $this->parseBatchName($batchName);
            $item->class = $parsed['class'];
            $item->section = $parsed['section'];
            
            $item->fee_status = ucfirst($item->status ?? '');
            $item->fee_balance = $item->getRemainingAmount();
        } elseif ($resource === 'students') {
            $totalPaid = $item->studentFees()->sum('paid_amount');
            $totalAmount = $item->studentFees()->sum('amount');
            $totalConcession = $item->studentFees()->sum('concession_amount');
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

        $data = $request->all();

        // Prevent settings duplicate entry / race conditions by using updateOrCreate on settings key
        if ($resource === 'settings') {
            $key = $data['key'] ?? null;
            if ($key) {
                $columns = Schema::getColumnListing((new $modelClass)->getTable());
                $data = array_intersect_key($data, array_flip($columns));
                $item = $modelClass::updateOrCreate(['key' => $key], $data);
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
            $tempStudent = new \App\Models\Student($data);
            $data['enrollment_number'] = $tempStudent->generateNewEnrollmentNumber();
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
                $subjectRecord = \App\Models\Subject::firstOrCreate([
                    'name' => $subjectName,
                ], [
                    'code' => strtoupper(substr($subjectName, 0, 3)),
                ]);
                $request->merge(['subject_id_to_attach' => $subjectRecord->id]);
            }
        }

        // Custom bulk save / creation for Timetable
        if ($resource === 'timetable' && $request->has('batch_name')) {
            $batchName = $request->input('batch_name');
            $batch = \App\Models\Batch::firstOrCreate(
                ['name' => $batchName],
                [
                    'course_id' => 1,
                    'academic_year_id' => 1,
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
                    ['code' => strtoupper(substr($slot['room'] ?? 'RM12', 0, 4))]
                );
                
                $subject = \App\Models\Subject::firstOrCreate(
                    ['name' => $slot['subject']],
                    ['code' => strtoupper(substr($slot['subject'], 0, 3))]
                );
                
                $periodIndex = intval($slot['period']);
                $timeSlot = \App\Models\TimeSlot::firstOrCreate(
                    ['id' => $periodIndex + 1],
                    [
                        'name' => 'Period ' . ($periodIndex + 1),
                        'start_time' => '08:00:00',
                        'end_time' => '09:00:00',
                    ]
                );
                
                // Store day_of_week directly (e.g., 'Monday', 'Tuesday')
                $dayOfWeek = $slot['day'] ?? $slot['date'] ?? 'Monday';
                
                \App\Models\Timetable::create([
                    'batch_id' => $batch->id,
                    'subject_id' => $subject->id,
                    'user_id' => intval($slot['teacherId']),
                    'classroom_id' => $classroom->id,
                    'time_slot_id' => $timeSlot->id,
                    'day_of_week' => $dayOfWeek,
                    'schedule_date' => '2026-06-01', // Keep for compatibility
                    'academic_year_id' => 1,
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
        $columns = Schema::getColumnListing((new $modelClass)->getTable());
        $data = array_intersect_key($data, array_flip($columns));

        $item = $modelClass::create($data);

        // Assign 'faculty' role if created via faculty endpoint
        if ($resource === 'faculty') {
            $item->assignRole('faculty');
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
                    $tempStudent = new \App\Models\Student($data);
                    $data['enrollment_number'] = $tempStudent->generateNewEnrollmentNumber();
                }

                // Filter out fields that do not exist as columns in the database table
                $columns = Schema::getColumnListing((new $modelClass)->getTable());
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
        $columns = Schema::getColumnListing((new $modelClass)->getTable());
        $data = array_intersect_key($data, array_flip($columns));

        $oldStatus = $item->status;
        $item->update($data);

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

        return response()->json($item);
    }

    /**
     * Delete resource.
     */
    public function destroy($resource, $id)
    {
        $modelClass = $this->getModelClass($resource);
        if (!$modelClass) {
            return response()->json(['error' => 'Resource not found'], 404);
        }

        $item = $modelClass::find($id);
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        $item->delete();

        return response()->json(['success' => true]);
    }
}
