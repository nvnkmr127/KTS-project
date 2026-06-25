<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Batch;
use App\Models\Subject;
use App\Models\User;
use App\Models\Classroom;
use App\Models\TimeSlot;
use App\Models\Student;
use App\Models\StudentFee;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Attendance;
use App\Models\DailyDiary;
use App\Models\Homework;
use App\Models\LeaveApplication;
use App\Models\LeaveType;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Timetable;
use App\Models\Alumni;
use App\Models\Payslip;
use App\Models\Setting;
use App\Models\Attendance\BiometricLog;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

class MockDataSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate tables to prevent duplicate key errors and clean up old mock data
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        
        if (\Illuminate\Support\Facades\Schema::hasTable('student_fees')) \App\Models\StudentFee::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('attendances')) \App\Models\Attendance::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('daily_diaries')) \App\Models\DailyDiary::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('homeworks')) \App\Models\Homework::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('leave_applications')) \App\Models\LeaveApplication::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('expenses')) \App\Models\Expense::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('alumni')) \App\Models\Alumni::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('payslips')) \App\Models\Payslip::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('biometric_logs')) \App\Models\Attendance\BiometricLog::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('timetables')) \App\Models\Timetable::truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('students')) \App\Models\Student::truncate();
        
        if (\Illuminate\Support\Facades\Schema::hasTable('fee_structure_fee_category')) \Illuminate\Support\Facades\DB::table('fee_structure_fee_category')->truncate();
        if (\Illuminate\Support\Facades\Schema::hasTable('fee_structures')) \App\Models\FeeStructure::truncate();
        
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();
        // 1. Academic Year
        $academicYear = AcademicYear::where('is_current', true)->first();
        if (!$academicYear) {
            $academicYear = AcademicYear::create([
                'name' => '2025-2026',
                'start_date' => '2025-04-01',
                'end_date' => '2026-03-31',
                'is_current' => true,
            ]);
        }

        // 2. Courses
        $primaryCourse = Course::firstOrCreate(
            ['code' => 'PRI'],
            ['name' => 'Primary School', 'duration_in_years' => 1.0]
        );

        $highCourse = Course::firstOrCreate(
            ['code' => 'HIGH'],
            ['name' => 'High School', 'duration_in_years' => 1.0]
        );

        // 3. Subjects
        $subjectsData = [
            ['name' => 'Mathematics', 'code' => 'MATH'],
            ['name' => 'Science', 'code' => 'SCI'],
            ['name' => 'English', 'code' => 'ENG'],
            ['name' => 'Social Studies', 'code' => 'SOC'],
            ['name' => 'Telugu', 'code' => 'TEL'],
            ['name' => 'Hindi', 'code' => 'HIN'],
        ];
        $subjects = [];
        foreach ($subjectsData as $sub) {
            $subjects[] = Subject::firstOrCreate(['code' => $sub['code']], ['name' => $sub['name']]);
        }

        // 4. Faculty / Teachers
        $teachersData = [
            ['name' => 'Mrs. Lakshmi Devi', 'email' => 'teacher@krishnaveni.edu', 'department' => 'Mathematics', 'phone' => '9876543210'],
            ['name' => 'Mr. R. K. Prasad', 'email' => 'prasad@krishnaveni.edu', 'department' => 'Science', 'phone' => '9876543211'],
            ['name' => 'Ms. S. Anitha', 'email' => 'anitha@krishnaveni.edu', 'department' => 'English', 'phone' => '9876543212'],
            ['name' => 'Mr. V. Suresh', 'email' => 'suresh@krishnaveni.edu', 'department' => 'Social Studies', 'phone' => '9876543213'],
        ];

        $teachers = [];
        $facultyRole = Role::findOrCreate('faculty');

        foreach ($teachersData as $tData) {
            $user = User::where('email', $tData['email'])->first();
            if (!$user) {
                $user = User::create([
                    'name' => $tData['name'],
                    'email' => $tData['email'],
                    'password' => Hash::make('teacher123'),
                    'status' => 'active',
                    'phone' => $tData['phone'],
                    'department' => $tData['department'],
                    'employee_id' => 'EMP-' . rand(1000, 9999),
                    'biometric_employee_code' => 'BIO-' . rand(100, 999),
                ]);
                $user->assignRole($facultyRole);
            }
            $teachers[] = $user;

            // Link teacher with relevant subject
            $subject = Subject::where('name', $tData['department'])->first();
            if ($subject) {
                $user->subjects()->syncWithoutDetaching([$subject->id]);
            }
        }

        // 5. Batches
        $batches = [];
        $classNames = ['6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B'];
        foreach ($classNames as $index => $name) {
            $course = (intval(substr($name, 0, -1)) <= 7) ? $primaryCourse : $highCourse;
            $teacher = $teachers[$index % count($teachers)];
            
            $batches[] = Batch::firstOrCreate(
                ['name' => $name, 'academic_year_id' => $academicYear->id],
                [
                    'course_id' => $course->id,
                    'class_teacher_id' => $teacher->id,
                    'start_date' => '2025-06-01',
                    'end_date' => '2026-04-30',
                    'status' => 'active',
                ]
            );
        }

        // 6. Classrooms
        $classrooms = [];
        for ($i = 12; $i <= 21; $i++) {
            $classrooms[] = Classroom::firstOrCreate(
                ['name' => "Room $i"],
                ['type' => 'lecture', 'capacity' => 40]
            );
        }

        // 7. Time Slots
        $timeSlots = [];
        $times = [
            ['start' => '08:00:00', 'end' => '09:00:00'],
            ['start' => '09:00:00', 'end' => '10:00:00'],
            ['start' => '10:00:00', 'end' => '11:00:00'],
            ['start' => '11:00:00', 'end' => '12:00:00'],
            ['start' => '13:00:00', 'end' => '14:00:00'],
            ['start' => '14:00:00', 'end' => '15:00:00'],
            ['start' => '15:00:00', 'end' => '16:00:00'],
            ['start' => '16:00:00', 'end' => '17:00:00'],
        ];
        foreach ($times as $index => $t) {
            $timeSlots[] = TimeSlot::firstOrCreate(
                ['id' => $index + 1],
                [
                    'start_time' => $t['start'],
                    'end_time' => $t['end'],
                ]
            );
        }

        // 8. Fee Categories & Fee Structures
        $feeCategoriesData = [
            ['name' => 'Tuition Fee', 'code' => 'TUI', 'amount' => 15000],
            ['name' => 'Exam Fee', 'code' => 'EXM', 'amount' => 1200],
            ['name' => 'Transport Fee', 'code' => 'TRA', 'amount' => 5000],
        ];

        foreach ($batches as $batch) {
            $categories = [];
            foreach ($feeCategoriesData as $fcData) {
                $categories[] = FeeCategory::firstOrCreate(
                    ['name' => $fcData['name']],
                    [
                        'category_code' => $fcData['code'],
                        'description' => $fcData['name'],
                        'category_type' => strtolower($fcData['name']) === 'tuition fee' ? 'tuition_fee' : (strtolower($fcData['name']) === 'exam fee' ? 'exam_fee' : 'transport_fee'),
                        'is_mandatory' => true,
                        'is_recurring' => false,
                    ]
                );
            }

            $totalAmount = collect($feeCategoriesData)->sum('amount');
            $feeStructure = FeeStructure::firstOrCreate(
                ['batch_id' => $batch->id],
                [
                    'total_amount' => $totalAmount,
                    'amount' => $totalAmount,
                    'payment_terms' => 1,
                ]
            );

            $syncData = [];
            foreach ($categories as $index => $cat) {
                $syncData[$cat->id] = ['amount' => $feeCategoriesData[$index]['amount']];
            }
            $feeStructure->feeCategories()->sync($syncData);
        }

        // 9. Students
        $firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Krishna', 'Rahul', 'Neha', 'Pooja', 'Ananya', 'Siri', 'Madhav', 'Karan', 'Sneha', 'Jyothi', 'Pranavi', 'Karthik', 'Srinivas', 'Ganesh', 'Varun', 'Teja'];
        $lastNames = ['Reddy', 'Rao', 'Sharma', 'Patel', 'Kumar', 'Verma', 'Singh', 'Naidu', 'Chowdary', 'Joshi'];
        $villages = ['Kukatpally', 'Miyapur', 'Gachibowli', 'Ameerpet', 'Secunderabad', 'Madhapur', 'Jubilee Hills', 'Banjara Hills'];

        $students = [];
        foreach ($batches as $batch) {
            // Create 15 students per batch
            for ($k = 0; $k < 15; $k++) {
                $gender = (rand(0, 1) === 0) ? 'Male' : 'Female';
                $firstName = $firstNames[rand(0, count($firstNames) - 1)];
                $lastName = $lastNames[rand(0, count($lastNames) - 1)];
                $name = $firstName . ' ' . $lastName;
                 $email = strtolower($firstName . '.' . $lastName . '.' . $batch->id . '.' . $k . '@example.com');
                $fatherName = $firstNames[rand(0, count($firstNames) - 1)] . ' ' . $lastName;
                
                $student = new Student([
                    'name' => $name,
                    'email' => $email,
                    'gender' => $gender,
                    'father_name' => $fatherName,
                    'student_mobile' => '9' . rand(100000000, 999999999),
                    'father_mobile' => '9' . rand(100000000, 999999999),
                    'dob' => Carbon::now()->subYears(rand(10, 15))->subDays(rand(1, 365))->toDateString(),
                    'village' => $villages[rand(0, count($villages) - 1)],
                    'admission_date' => Carbon::now()->subMonths(rand(1, 12))->toDateString(),
                    'batch_id' => $batch->id,
                    'status' => ($k === 13) ? 'left' : (($k === 14) ? 'dropout' : 'active'),
                    'payment_terms' => 1,
                    'source' => 'Direct Admission',
                    'biometric_employee_code' => 'STU-' . ($batch->id * 1000 + $k),
                ]);
                
                // Set the enrollment number properly
                $student->enrollment_number = $student->generateNewEnrollmentNumber();
                $student->save();
                
                $students[] = $student;

                // 10. Student Fees assignment
                $structures = FeeStructure::where('batch_id', $batch->id)->with('feeCategories')->get();
                foreach ($structures as $struct) {
                    foreach ($struct->feeCategories as $cat) {
                        $amount = $cat->pivot->amount;
                        $statusChoice = rand(0, 2);
                        $paidAmount = 0;
                        $status = 'unpaid';

                        if ($statusChoice === 1) {
                            $paidAmount = $amount;
                            $status = 'paid';
                        } elseif ($statusChoice === 2) {
                            $paidAmount = round($amount / 2);
                            $status = 'partial';
                        }

                        StudentFee::create([
                            'student_id' => $student->id,
                            'fee_structure_id' => $struct->id,
                            'fee_category_id' => $cat->id,
                            'amount' => $amount,
                            'original_amount' => $amount,
                            'paid_amount' => $paidAmount,
                            'concession_amount' => 0,
                            'due_date' => Carbon::now()->addMonths(rand(-1, 3))->toDateString(),
                            'status' => $status,
                            'academic_year_id' => $academicYear->id,
                        ]);
                    }
                }
            }
        }

        // 11. Attendances (last 5 days)
        $workDays = [];
        $current = Carbon::now();
        while (count($workDays) < 5) {
            if (!$current->isSunday()) {
                $workDays[] = $current->copy();
            }
            $current->subDay();
        }

        foreach ($workDays as $date) {
            foreach ($batches as $batch) {
                $batchStudents = Student::where('batch_id', $batch->id)->get();
                foreach ($batchStudents as $student) {
                    $status = (rand(1, 10) > 1) ? 'present' : 'absent';
                    Attendance::create([
                        'student_id' => $student->id,
                        'batch_id' => $batch->id,
                        'faculty_id' => $batch->class_teacher_id,
                        'attendance_date' => $date->toDateString(),
                        'status' => $status,
                        'academic_year_id' => $academicYear->id,
                    ]);
                }
            }
        }

        // 12. Daily Diary & Homework
        foreach ($batches as $batch) {
            for ($d = 0; $d < 3; $d++) {
                $date = Carbon::now()->subDays($d)->toDateString();
                $subject = $subjects[rand(0, count($subjects) - 1)];
                $teacher = $teachers[rand(0, count($teachers) - 1)];

                DailyDiary::create([
                    'batch_name' => $batch->name,
                    'teacher_name' => $teacher->name,
                    'topics' => "Covered Chapter " . rand(1, 5) . " topic on " . $subject->name . ".",
                    'homework' => "Complete reading of Chapter " . rand(1, 5),
                    'notes' => "Class was interactive and students participated well.",
                    'diary_date' => $date,
                    'parents_count' => rand(5, 12),
                ]);

                Homework::create([
                    'batch_name' => $batch->name,
                    'subject' => $subject->name,
                    'title' => "Chapter " . rand(1, 5) . " Assignment",
                    'description' => "Complete exercise " . rand(1, 4) . " from page " . rand(50, 150) . " of " . $subject->name . " textbook.",
                    'due_date' => Carbon::parse($date)->addDay()->toDateString(),
                    'assigned_date' => $date,
                    'has_attachment' => false,
                    'submissions_received' => rand(5, 15),
                    'total_students' => 15,
                ]);
            }
        }

        // 13. Leave Applications for teachers
        $leaveType = LeaveType::firstOrCreate(
            ['name' => 'Sick Leave'],
            ['days_per_year' => 12]
        );
        LeaveType::firstOrCreate(
            ['name' => 'Casual Leave'],
            ['days_per_year' => 12]
        );

        foreach ($teachers as $teacher) {
            LeaveApplication::create([
                'user_id' => $teacher->id,
                'leave_type_id' => $leaveType->id,
                'start_date' => Carbon::now()->addDays(rand(1, 5))->toDateString(),
                'end_date' => Carbon::now()->addDays(rand(6, 8))->toDateString(),
                'reason' => 'Not feeling well, medical rest required.',
                'status' => 'Pending',
                'is_half_day' => false,
            ]);
        }

        // 14. Expenses
        $expenseCategories = ['Office Supplies', 'Maintenance', 'Utilities', 'Marketing', 'Salary'];
        foreach ($expenseCategories as $catName) {
            $cat = ExpenseCategory::firstOrCreate(['name' => $catName]);

            for ($e = 0; $e < 2; $e++) {
                Expense::create([
                    'expense_category_id' => $cat->id,
                    'amount' => rand(500, 50000),
                    'expense_date' => Carbon::now()->subDays(rand(1, 30))->toDateString(),
                    'vendor' => 'Generic vendor ' . rand(1, 5),
                    'description' => "Payment for $catName supplies/services.",
                ]);
            }
        }

        // 15. Timetable Seeding (Recurring schedules for Monday to Saturday)
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $startOfWeek = Carbon::now()->startOfWeek(); // This is Monday
        $dayDates = [];
        foreach ($days as $index => $dayName) {
            $dayDates[$dayName] = $startOfWeek->copy()->addDays($index)->toDateString();
        }

        $classroomsList = Classroom::all();
        $timeSlotsList = TimeSlot::all();
        $batchesList = Batch::all();
        $subjectsList = Subject::all();
        $teachersList = User::role('faculty')->get();

        if ($batchesList->count() > 0 && $subjectsList->count() > 0 && $teachersList->count() > 0 && $timeSlotsList->count() > 0) {
            foreach ($batchesList as $bIndex => $batchObj) {
                foreach ($days as $dayName) {
                    // Seed 4 periods for each day
                    for ($periodNum = 1; $periodNum <= 4; $periodNum++) {
                        $slotObj = $timeSlotsList->where('id', $periodNum)->first() ?? $timeSlotsList->first();
                        $subObj = $subjectsList[$periodNum % $subjectsList->count()];
                        
                        // Find a teacher associated with this subject, or select cyclically
                        $teachObj = $teachersList->filter(function($u) use ($subObj) {
                            return $u->subjects->contains($subObj->id);
                        })->first() ?? $teachersList[$periodNum % $teachersList->count()];

                        $roomObj = $classroomsList[$bIndex % $classroomsList->count()] ?? $classroomsList->first();

                        Timetable::firstOrCreate(
                            [
                                'batch_id' => $batchObj->id,
                                'time_slot_id' => $slotObj->id,
                                'day_of_week' => $dayName,
                                'schedule_date' => $dayDates[$dayName],
                                'academic_year_id' => $academicYear->id,
                            ],
                            [
                                'subject_id' => $subObj->id,
                                'user_id' => $teachObj->id,
                                'classroom_id' => $roomObj->id,
                                'is_lab_session' => false,
                            ]
                        );
                    }
                }
            }
        }

        // 16. Alumni Seeding
        $alumniRecords = [
            [
                'name' => 'Aarav Patel',
                'roll' => '10A-2020-01',
                'pass_out_year' => '2020',
                'class' => '10',
                'section' => 'A',
                'gender' => 'Male',
                'dob' => '2005-05-12',
                'phone' => '9876507891',
                'email' => 'aarav.patel@alumni.com',
                'address' => 'Kukatpally, Hyderabad',
                'current_occupation' => 'Software Engineer',
                'achievement' => 'Winner of State Coding Competition 2024',
                'status' => 'verified',
            ],
            [
                'name' => 'Neha Sharma',
                'roll' => '10B-2021-04',
                'pass_out_year' => '2021',
                'class' => '10',
                'section' => 'B',
                'gender' => 'Female',
                'dob' => '2006-08-22',
                'phone' => '9876507892',
                'email' => 'neha.sharma@alumni.com',
                'address' => 'Miyapur, Hyderabad',
                'current_occupation' => 'Medical Student',
                'achievement' => 'Top scorer in NEET state level exam',
                'status' => 'verified',
            ],
            [
                'name' => 'Karan Malhotra',
                'roll' => '10A-2022-12',
                'pass_out_year' => '2022',
                'class' => '10',
                'section' => 'A',
                'gender' => 'Male',
                'dob' => '2007-01-15',
                'phone' => '9876507893',
                'email' => 'karan.malhotra@alumni.com',
                'address' => 'Gachibowli, Hyderabad',
                'current_occupation' => 'Business / Entrepreneur',
                'achievement' => 'Founded a successful logistics startup',
                'status' => 'unverified',
            ],
            [
                'name' => 'Siri Chowdary',
                'roll' => '10A-2018-09',
                'pass_out_year' => '2018',
                'class' => '10',
                'section' => 'A',
                'gender' => 'Female',
                'dob' => '2003-11-30',
                'phone' => '9876507894',
                'email' => 'siri.chowdary@alumni.com',
                'address' => 'Jubilee Hills, Hyderabad',
                'current_occupation' => 'Software Engineer',
                'achievement' => 'Secured placement at Google India',
                'status' => 'verified',
            ],
            [
                'name' => 'Rahul Verma',
                'roll' => '10B-2019-07',
                'pass_out_year' => '2019',
                'class' => '10',
                'section' => 'B',
                'gender' => 'Male',
                'dob' => '2004-03-05',
                'phone' => '9876507895',
                'email' => 'deleted.student@alumni.com',
                'address' => 'Secunderabad, Hyderabad',
                'current_occupation' => 'Arts/Science Student',
                'achievement' => 'Sports captain',
                'status' => 'deleted', // For testing Recycle Bin
            ]
        ];

        if (\Illuminate\Support\Facades\Schema::hasTable('alumni')) {
            foreach ($alumniRecords as $alumnus) {
                Alumni::firstOrCreate(['email' => $alumnus['email']], $alumnus);
            }
        }

        // 17. Payslips Seeding (For Salary/Payroll views)
        $monthsList = ['April', 'May', 'June'];
        $yearVal = 2026;
        if (\Illuminate\Support\Facades\Schema::hasTable('payslips')) {
            foreach ($teachersList as $teach) {
                $basicSalary = $teach->name === 'Mrs. Lakshmi Devi' ? 35000 : ($teach->name === 'Mr. R. K. Prasad' ? 40000 : ($teach->name === 'Ms. S. Anitha' ? 30000 : 32500));
                $deductions = 3000;
                $gross = $basicSalary + 8000 + 5000; // basic + hra + allowances
                $net = $gross - $deductions;

                foreach ($monthsList as $mon) {
                    Payslip::firstOrCreate(
                        [
                            'user_id' => $teach->id,
                            'month' => $mon,
                            'year' => $yearVal,
                        ],
                        [
                            'gross_salary' => $gross,
                            'total_deductions' => $deductions,
                            'net_salary' => $net,
                            'status' => 'Paid',
                            'working_days' => 26,
                            'days_present' => 25.00,
                            'leave_days' => 1.00,
                            'payment_multiplier' => 1.0000,
                        ]
                    );
                }
            }
        }

        // 18. Biometric Logs Seeding (For Staff Attendance views)
        $attendanceDates = [
            Carbon::today()->toDateString(),
            Carbon::yesterday()->toDateString(),
            Carbon::today()->subDays(2)->toDateString(),
        ];

        if (\Illuminate\Support\Facades\Schema::hasTable('biometric_logs')) {
            foreach ($teachersList as $teach) {
                $empCode = (string)$teach->id;

                foreach ($attendanceDates as $attnDate) {
                    $isTodayVal = ($attnDate === Carbon::today()->toDateString());
                    
                    // Simulating absences and half-days for realistic dashboard testing
                    if ($isTodayVal && $teach->id == 5) {
                        // Ms. Anitha is absent today
                        continue;
                    }

                    // Clock-in Log
                    BiometricLog::firstOrCreate(
                        [
                            'employee_code' => $empCode,
                            'scan_datetime' => $attnDate . ' 09:00:00',
                            'scan_type' => 'in',
                        ],
                        [
                            'device_id' => 'DEV-MAIN-01',
                            'device_manufacturer' => 'Matrix',
                            'device_location' => 'Main Gate',
                            'processed' => true,
                            'sync_status' => 'success',
                            'status' => 'processed',
                            'raw_data' => [
                                'Empcode' => $empCode,
                                'Name' => $teach->name,
                                'PunchDate' => $attnDate,
                                'PunchTime' => '09:00:00',
                            ],
                        ]
                    );

                    if ($isTodayVal && $teach->id == 4) {
                        // Mr. Prasad has only clock-in (Half Day) today
                        continue;
                    }

                    // Clock-out Log
                    BiometricLog::firstOrCreate(
                        [
                            'employee_code' => $empCode,
                            'scan_datetime' => $attnDate . ' 17:00:00',
                            'scan_type' => 'out',
                        ],
                        [
                            'device_id' => 'DEV-MAIN-01',
                            'device_manufacturer' => 'Matrix',
                            'device_location' => 'Main Gate',
                            'processed' => true,
                            'sync_status' => 'success',
                            'status' => 'processed',
                            'raw_data' => [
                                'Empcode' => $empCode,
                                'Name' => $teach->name,
                                'PunchDate' => $attnDate,
                                'PunchTime' => '17:00:00',
                            ],
                        ]
                    );
                }
            }
        }

        // 19. Settings Seeding (Salary components, staff salaries database settings)
        $settingsPayloads = [
            'salary_components' => json_encode([
                [ 'id' => 'basic', 'name' => 'Basic', 'type' => 'earning', 'calculationType: flat' => 'flat' ],
                [ 'id' => 'hra', 'name' => 'HRA', 'type' => 'earning', 'calculationType' => 'flat' ],
                [ 'id' => 'allowances', 'name' => 'Allowances', 'type' => 'earning', 'calculationType' => 'flat' ],
                [ 'id' => 'deductions', 'name' => 'Deductions', 'type' => 'deduction', 'calculationType' => 'flat' ]
            ]),
            'staff_salaries' => json_encode([
                'Mrs. Lakshmi Devi' => [ 'basic' => 25000, 'hra' => 8000, 'allowances' => 5000, 'deductions' => 3000 ],
                'Mr. R. K. Prasad' => [ 'basic' => 28000, 'hra' => 9000, 'allowances' => 6000, 'deductions' => 3000 ],
                'Ms. S. Anitha' => [ 'basic' => 20000, 'hra' => 6000, 'allowances' => 4000, 'deductions' => 2000 ],
                'Mr. V. Suresh' => [ 'basic' => 22000, 'hra' => 7500, 'allowances' => 5000, 'deductions' => 2500 ],
                '3' => [ 'basic' => 25000, 'hra' => 8000, 'allowances' => 5000, 'deductions' => 3000 ],
                '4' => [ 'basic' => 28000, 'hra' => 9000, 'allowances' => 6000, 'deductions' => 3000 ],
                '5' => [ 'basic' => 20000, 'hra' => 6000, 'allowances' => 4000, 'deductions' => 2000 ],
                '6' => [ 'basic' => 22000, 'hra' => 7500, 'allowances' => 5000, 'deductions' => 2500 ]
            ]),
            'kts_staff_members' => json_encode([
                [ 'id' => '3', 'name' => 'Mrs. Lakshmi Devi', 'designation' => 'Senior Teacher', 'department' => 'Mathematics', 'category' => 'Teaching', 'subject' => 'Maths', 'phone' => '9876501234', 'email' => 'teacher@krishnaveni.edu', 'joinDate' => '2015-06-01', 'attendance' => 96, 'status' => 'Active', 'salary' => 35000, 'qualifications' => 'M.Sc Mathematics, B.Ed', 'documents' => ['Aadhar Card', 'Degree Certificate', 'Experience Letter'] ],
                [ 'id' => '4', 'name' => 'Mr. R. K. Prasad', 'designation' => 'Teacher', 'department' => 'Science', 'category' => 'Teaching', 'subject' => 'Physics, Chemistry', 'phone' => '9876502345', 'email' => 'prasad@krishnaveni.edu', 'joinDate' => '2017-06-01', 'attendance' => 92, 'status' => 'Active', 'salary' => 40000, 'qualifications' => 'M.Sc Physics, B.Ed', 'documents' => ['Aadhar Card', 'Degree Certificate', 'Experience Letter'] ],
                [ 'id' => '5', 'name' => 'Ms. S. Anitha', 'designation' => 'Teacher', 'department' => 'English', 'category' => 'Teaching', 'subject' => 'English', 'phone' => '9876503456', 'email' => 'anitha@krishnaveni.edu', 'joinDate' => '2018-06-01', 'attendance' => 88, 'status' => 'Active', 'salary' => 30000, 'qualifications' => 'MA English, B.Ed', 'documents' => ['Aadhar Card', 'Degree Certificate', 'Experience Letter'] ],
                [ 'id' => '6', 'name' => 'Mr. V. Suresh', 'designation' => 'Teacher', 'department' => 'Social Sciences', 'category' => 'Teaching', 'subject' => 'History, Geography', 'phone' => '9876505678', 'email' => 'suresh@krishnaveni.edu', 'joinDate' => '2019-06-01', 'attendance' => 90, 'status' => 'Active', 'salary' => 32500, 'qualifications' => 'MA History, B.Ed', 'documents' => ['Aadhar Card', 'Degree Certificate', 'Experience Letter'] ],
                [ 'id' => '7', 'name' => 'Madhuteja Javvaji', 'designation' => 'Teacher', 'department' => 'English', 'category' => 'Teaching', 'subject' => 'Academics', 'phone' => '9876507890', 'email' => 'javvajimadhuteja2000@gmail.com', 'joinDate' => '2021-06-01', 'attendance' => 95, 'status' => 'Active', 'salary' => 30000, 'qualifications' => 'B.Sc', 'documents' => ['Aadhar Card', 'Degree Certificate'] ],
                [ 'id' => '8', 'name' => 'pavan kumar', 'designation' => 'Teacher', 'department' => 'Mathematics', 'category' => 'Teaching', 'subject' => 'Maths', 'phone' => '9876506789', 'email' => 'pavan@gmail.com', 'joinDate' => '2020-06-01', 'attendance' => 98, 'status' => 'Active', 'salary' => 45000, 'qualifications' => 'B.Ed', 'documents' => ['Aadhar Card', 'Degree Certificate', 'Experience Letter'] ],
            ])
        ];

        foreach ($settingsPayloads as $setKey => $setVal) {
            Setting::updateOrCreate(
                ['key' => $setKey],
                [
                    'value' => $setVal,
                    'group' => 'general',
                    'type' => 'json',
                    'is_public' => false,
                    'is_encrypted' => false,
                ]
            );
        }
    }
}
