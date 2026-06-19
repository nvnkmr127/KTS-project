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
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Carbon\Carbon;

class MockDataSeeder extends Seeder
{
    public function run(): void
    {
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
                ['code' => "RM$i"]
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
                    'name' => 'Period ' . ($index + 1),
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
                    'academic_year_id' => $academicYear->id,
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
                    'status' => 'active',
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
                'half_day' => false,
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
                    'payment_mode' => 'cash',
                    'academic_year_id' => $academicYear->id,
                ]);
            }
        }
    }
}
