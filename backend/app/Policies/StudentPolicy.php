<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class StudentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the student details.
     */
    public function view(User $user, Student $student): bool
    {
        // Students can only view their own record
        if ($user->hasRole('student')) {
            return $user->student && $user->student->id === $student->id;
        }

        // Faculty, staff, and admins can view
        return $user->hasAnyRole(['super-admin', 'admin', 'faculty', 'staff', 'academic-coordinator', 'office-staff'])
            || $user->hasAnyPermission(['view attendance', 'take attendance', 'view students']);
    }
}
