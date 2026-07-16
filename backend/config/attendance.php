<?php

return [
    'rules' => [
        'grace_period_minutes' => env('ATTENDANCE_GRACE_PERIOD', 10),
        'late_threshold_minutes' => env('ATTENDANCE_LATE_THRESHOLD', 15),
    ],

    'security' => [
        'edit_time_limit_hours' => env('ATTENDANCE_EDIT_TIME_LIMIT', 24),
    ],

    'import_export' => [
        'max_import_size' => env('ATTENDANCE_MAX_IMPORT_SIZE', 10000), // records
        'allowed_import_formats' => ['csv', 'xlsx'],
        'export_chunk_size' => env('ATTENDANCE_EXPORT_CHUNK_SIZE', 1000),
    ],
];
