<?php

namespace App\Policies;

use App\Models\Batch;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BatchPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the batch.
     */
    public function view(User $user, Batch $batch): bool
    {
        return $user->hasAnyRole(['super-admin', 'admin', 'faculty', 'staff', 'academic-coordinator', 'office-staff'])
            || $user->hasAnyPermission(['view attendance', 'take attendance', 'view students']);
    }
}
