<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubstituteAssignment;
use App\Models\SystemNotification;
use App\Models\Timetable;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SubstituteController extends Controller
{
    /**
     * Get list of teaching staff for substitution.
     */
    public function getStaff(Request $request)
    {
        $staff = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['faculty', 'teacher', 'admin']);
        })->where('status', 'active')->get(['id', 'name', 'email', 'department']);

        // Fallback if roles aren't explicitly assigned (just get all active users except super-admin)
        if ($staff->isEmpty()) {
            $staff = User::where('status', 'active')
                ->whereDoesntHave('roles', function($q) {
                    $q->where('name', 'super-admin');
                })->get(['id', 'name', 'email', 'department']);
        }

        return response()->json($staff);
    }

    /**
     * Get schedule for a specific staff member on a given date.
     */
    public function getSchedule(Request $request)
    {
        $request->validate([
            'absent_user_id' => 'required|exists:users,id',
            'date' => 'required|date',
        ]);

        $date = Carbon::parse($request->date);
        $dayOfWeek = $date->format('l');

        // Fetch timetable either matching the specific date or the day of the week
        // Assuming timetable might use either schedule_date or day_of_week for recurring
        $schedule = Timetable::with(['batch', 'subject', 'classroom', 'timeSlot'])
            ->where('user_id', $request->absent_user_id)
            ->where(function ($query) use ($date, $dayOfWeek) {
                $query->whereDate('schedule_date', $date->toDateString())
                      ->orWhere('day_of_week', $dayOfWeek);
            })
            ->get();

        // Get existing assignments to show which ones are already substituted
        $assignments = SubstituteAssignment::with('substituteUser')
            ->where('absent_user_id', $request->absent_user_id)
            ->whereDate('assignment_date', $date->toDateString())
            ->where('status', 'assigned')
            ->get()
            ->keyBy('timetable_id');

        $scheduleWithSubstitutes = $schedule->map(function ($entry) use ($assignments) {
            $data = $entry->toArray();
            if ($assignments->has($entry->id)) {
                $data['substitute'] = $assignments[$entry->id]->substituteUser;
                $data['substitute_assignment_id'] = $assignments[$entry->id]->id;
            } else {
                $data['substitute'] = null;
            }
            return $data;
        });

        return response()->json($scheduleWithSubstitutes);
    }

    /**
     * Get staff members available (no classes) during a specific time slot on a date.
     */
    public function getAvailableSubstitutes(Request $request)
    {
        $request->validate([
            'time_slot_id' => 'required|exists:time_slots,id',
            'date' => 'required|date',
            'exclude_user_id' => 'required|exists:users,id',
        ]);

        $date = Carbon::parse($request->date);
        $dayOfWeek = $date->format('l');
        $timeSlotId = $request->time_slot_id;
        $excludeUserId = $request->exclude_user_id;

        // Find users who HAVE a class at this time slot
        $busyUserIds = Timetable::where('time_slot_id', $timeSlotId)
            ->where(function ($query) use ($date, $dayOfWeek) {
                $query->whereDate('schedule_date', $date->toDateString())
                      ->orWhere('day_of_week', $dayOfWeek);
            })
            ->pluck('user_id')
            ->toArray();

        // Also check if they are already assigned as a substitute somewhere else in this time slot
        $busySubstituteIds = SubstituteAssignment::whereDate('assignment_date', $date->toDateString())
            ->where('status', 'assigned')
            ->whereHas('timetable', function ($q) use ($timeSlotId) {
                $q->where('time_slot_id', $timeSlotId);
            })
            ->pluck('substitute_user_id')
            ->toArray();

        $allBusyIds = array_unique(array_merge($busyUserIds, $busySubstituteIds, [$excludeUserId]));

        // Get staff who are NOT busy
        $availableStaff = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['faculty', 'teacher', 'admin']);
        })
        ->where('status', 'active')
        ->whereNotIn('id', $allBusyIds)
        ->get(['id', 'name', 'email', 'department']);

        if ($availableStaff->isEmpty()) {
            $availableStaff = User::where('status', 'active')
                ->whereDoesntHave('roles', function($q) {
                    $q->where('name', 'super-admin');
                })
                ->whereNotIn('id', $allBusyIds)
                ->get(['id', 'name', 'email', 'department']);
        }

        return response()->json($availableStaff);
    }

    /**
     * Assign a substitute teacher for a class.
     */
    public function assignSubstitute(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'timetable_id' => 'required|exists:timetables,id',
            'absent_user_id' => 'required|exists:users,id',
            'substitute_user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $date = Carbon::parse($request->date)->toDateString();

        // Check if assignment already exists
        $existing = SubstituteAssignment::where('timetable_id', $request->timetable_id)
            ->where('assignment_date', $date)
            ->first();

        if ($existing) {
            $existing->update([
                'substitute_user_id' => $request->substitute_user_id,
                'status' => 'assigned',
                'assigned_by' => Auth::id(),
                'notes' => $request->notes,
            ]);
            $assignment = $existing;
        } else {
            $assignment = SubstituteAssignment::create([
                'timetable_id' => $request->timetable_id,
                'absent_user_id' => $request->absent_user_id,
                'substitute_user_id' => $request->substitute_user_id,
                'assignment_date' => $date,
                'status' => 'assigned',
                'assigned_by' => Auth::id(),
                'notes' => $request->notes,
            ]);
        }

        $assignment->load(['timetable.batch', 'timetable.subject', 'timetable.timeSlot']);

        // Send notification to the substitute teacher
        $batchName = $assignment->timetable->batch->name ?? 'Class';
        $subjectName = $assignment->timetable->subject->name ?? 'Subject';
        $timeInfo = $assignment->timetable->timeSlot ? 
            "{$assignment->timetable->timeSlot->start_time} - {$assignment->timetable->timeSlot->end_time}" : 
            "Period {$assignment->timetable->timeSlot_id}";

        $notificationMessage = "You have been assigned as a substitute teacher for {$batchName} ({$subjectName}) on {$date} during {$timeInfo}.";

        SystemNotification::create([
            'user_id' => $request->substitute_user_id,
            'title' => 'Substitute Assignment',
            'message' => $notificationMessage,
            'type' => 'substitution',
            'link' => '/dashboard',
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Substitute assigned successfully',
            'assignment' => $assignment
        ]);
    }
}
