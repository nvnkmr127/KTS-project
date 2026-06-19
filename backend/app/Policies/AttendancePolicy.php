<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AttendancePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any attendance records.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super-admin', 'admin', 'faculty', 'staff', 'academic-coordinator', 'office-staff'])
            || $user->hasAnyPermission(['view attendance', 'take attendance']);
    }

    /**
     * Determine whether the user can view a specific attendance record.
     */
    public function view(User $user, $attendance): bool
    {
        if ($user->hasRole('student')) {
            return $user->student && $user->student->id === $attendance->student_id;
        }

        return $user->hasAnyRole(['super-admin', 'admin', 'faculty', 'staff', 'academic-coordinator', 'office-staff'])
            || $user->hasAnyPermission(['view attendance', 'take attendance']);
    }
}
