<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Attendance;
use App\Models\StudentFee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardStatsController extends Controller
{
    public function getStats(Request $request)
    {
        $range = $request->get('range', 'today'); // 'today', 'yesterday', 'week', 'month', 'custom'

        $now = Carbon::now();
        $startDate = $now->copy()->startOfDay();
        $endDate = $now->copy()->endOfDay();

        switch ($range) {
            case 'yesterday':
                $startDate = $now->copy()->subDay()->startOfDay();
                $endDate = $now->copy()->subDay()->endOfDay();
                break;
            case 'week':
                $startDate = $now->copy()->startOfWeek();
                break;
            case 'month':
                $startDate = $now->copy()->startOfMonth();
                break;
            case 'custom':
                if ($request->has('start') && $request->has('end')) {
                    $startDate = Carbon::parse($request->get('start'))->startOfDay();
                    $endDate = Carbon::parse($request->get('end'))->endOfDay();
                }
                break;
            case 'today':
            default:
                break;
        }

        // 1. Total Students
        $totalStudents = Student::where('status', 'active')->count();

        // New admissions in this academic year (simple proxy: admitted this term)
        $newAdmissions = Student::where('admission_date', '>=', $now->copy()->subMonths(3))->count();

        // 2. Attendance Stats
        // Calculate average attendance for the selected range
        $attendances = Attendance::whereBetween('attendance_date', [$startDate, $endDate])->get();
        $totalAttendanceRecords = $attendances->count();
        $presentCount = $attendances->whereIn('status', ['present', 'late'])->count();
        $absentCount = $attendances->where('status', 'absent')->count();
        $attendancePercentage = $totalAttendanceRecords > 0 ? round(($presentCount / $totalAttendanceRecords) * 100, 1) : 0;

        // 3. Fee Stats
        $studentFees = StudentFee::all(); // Assuming small scale, otherwise aggregate via DB
        $totalFeeAmount = $studentFees->sum('amount');
        $totalFeePaid = $studentFees->sum('paid_amount');
        $totalConcession = $studentFees->sum('concession_amount');
        $totalFeePending = max(0, $totalFeeAmount - $totalFeePaid - $totalConcession);
        
        $feeCollectedPct = $totalFeeAmount > 0 ? round(($totalFeePaid / $totalFeeAmount) * 100) : 0;
        $feePendingPct = 100 - $feeCollectedPct;

        // Mock formatting for frontend
        $formatLakhs = function ($num) {
            if ($num >= 100000) return '₹' . round($num / 100000, 1) . 'L';
            if ($num >= 1000) return '₹' . round($num / 1000, 1) . 'K';
            return '₹' . $num;
        };

        // 4. Weekly Attendance (Last 5 days)
        $weeklyAttendance = [];
        for ($i = 4; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i);
            $dayStart = $day->copy()->startOfDay();
            $dayEnd = $day->copy()->endOfDay();
            $dayAtts = Attendance::whereBetween('attendance_date', [$dayStart, $dayEnd])->get();
            $dayTotal = $dayAtts->count();
            $dayPresent = $dayAtts->whereIn('status', ['present', 'late'])->count();
            
            $weeklyAttendance[] = [
                'day' => $day->format('D'),
                'pct' => $dayTotal > 0 ? round(($dayPresent / $dayTotal) * 100) : 0
            ];
        }

        // 5. Fee Trend (Last 6 months)
        $feeTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = $now->copy()->subMonths($i)->startOfMonth();
            $monthEnd = $now->copy()->subMonths($i)->endOfMonth();
            
            // Dummy target for now, real collected
            // NOTE: Usually collected amount is from Transactions table, but using StudentFee for demo since we don't have Transactions fully flushed out.
            // Just simulating growth
            $feeTrend[] = [
                'month' => $monthStart->format('M'),
                'collected' => max(10, rand(50, 150)), 
                'target' => 100
            ];
        }

        return response()->json([
            'totalStudents' => [
                'value' => $totalStudents,
                'trend' => ['direction' => 'up', 'label' => '+' . $newAdmissions],
                'sub' => 'this term'
            ],
            'attendance' => [
                'value' => $attendancePercentage,
                'sub' => ($range === 'week' || $range === 'month' ? 'Avg: ' : '') . $presentCount . ' present · ' . $absentCount . ' absent',
                'trend' => null
            ],
            'feeCollected' => [
                'value' => $formatLakhs($totalFeePaid),
                'sub' => $formatLakhs($totalFeePending) . ' pending',
                'trend' => ['direction' => 'up', 'label' => 'Stable']
            ],
            'buses' => [
                'value' => 'N/A', // Setup real transport later
                'sub' => 'No active routes'
            ],
            'weeklyAttendance' => $weeklyAttendance,
            'feeStatus' => [
                ['name' => 'Collected', 'value' => $feeCollectedPct],
                ['name' => 'Pending', 'value' => $feePendingPct],
            ],
            'feeStatusPercentages' => [
                'collected' => $feeCollectedPct,
                'pending' => $feePendingPct
            ],
            'feeTrend' => $feeTrend
        ]);
    }
}
