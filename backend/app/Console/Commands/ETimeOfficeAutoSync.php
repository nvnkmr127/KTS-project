<?php

// Create this command: php artisan make:command ETimeOfficeAutoSync

namespace App\Console\Commands;

use App\Http\Controllers\Admin\AttendanceSettingsController;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ETimeOfficeAutoSync extends Command
{
    protected $signature = 'etimeoffice:auto-sync 
                           {--frequency=5 : Sync frequency in minutes}
                           {--range=today : Date range to sync (today, yesterday, last_3_days)}
                           {--test : Run in test mode}
                           {--daemon : Run continuously as a background process}';

    protected $description = 'Automatically sync attendance data from ETimeOffice (can run as a daemon)';

    public function handle()
    {
        $frequency = $this->option('frequency');
        $range = $this->option('range');
        $testMode = $this->option('test');
        $isDaemon = $this->option('daemon');

        if ($isDaemon) {
            $this->info("Starting ETimeOffice Auto-Sync Daemon Mode");
            $this->info("School hours (8 AM - 6 PM): Pulling every second");
            $this->info("Off hours (6 PM - 8 AM): Pulling every 5 hours");
            $this->info("Press Ctrl+C to exit.");

            while (true) {
                $now = now();
                $currentHour = $now->hour;

                // timings: 8:00 AM to 6:00 PM (8 to 18) -> run every second
                // off-hours -> run every 5 hours (5 * 3600 seconds)
                if ($currentHour >= 8 && $currentHour < 18) {
                    $sleepSeconds = 1;
                } else {
                    $sleepSeconds = 5 * 3600;
                }

                if ($this->isSyncEnabled()) {
                    $this->performSync($range, $testMode);
                }

                sleep($sleepSeconds);
            }
            return 0;
        }

        $this->info("Starting ETimeOffice Auto-Sync (every {$frequency} minutes)");
        $this->info("Date Range: {$range}");
        $this->info('Test Mode: '.($testMode ? 'ON' : 'OFF'));

        // Check if sync is enabled
        if (! $this->isSyncEnabled()) {
            $this->warn('ETimeOffice integration is disabled. Skipping sync.');

            return 0;
        }

        // Perform the sync
        $result = $this->performSync($range, $testMode);

        if ($result['success']) {
            $this->info('Sync completed successfully:');
            $this->info("- Total Records: {$result['data']['total_records']}");
            $this->info("- Created: {$result['data']['created_records']}");
            $this->info("- Updated: {$result['data']['updated_records']}");
            $this->info("- Skipped: {$result['data']['skipped_records']}");

            if (! empty($result['data']['errors'])) {
                $this->warn('Errors encountered: '.count($result['data']['errors']));
                foreach ($result['data']['errors'] as $error) {
                    $this->error("- {$error}");
                }
            }
        } else {
            $this->error("Sync failed: {$result['message']}");

            return 1;
        }

        return 0;
    }

    private function isSyncEnabled(): bool
    {
        try {
            $enabled = \App\Models\Setting::where('key', 'etimeoffice_enabled')->value('value');
            if (! filter_var($enabled, FILTER_VALIDATE_BOOLEAN)) {
                return false;
            }

            // Also check for required credentials
            $missing = [];
            if (! config('services.etimeoffice.url')) {
                $missing[] = 'API URL';
            }
            if (! config('services.etimeoffice.corporate_id')) {
                $missing[] = 'Corporate ID';
            }
            if (! config('services.etimeoffice.username')) {
                $missing[] = 'Username';
            }
            if (! config('services.etimeoffice.password')) {
                $missing[] = 'Password';
            }

            if (! empty($missing)) {
                $msg = 'ETimeOffice sync is enabled but missing: '.implode(', ', $missing);
                $this->error($msg);
                Log::error($msg);

                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Could not check ETimeOffice sync status: '.$e->getMessage());

            return false;
        }
    }

    private function performSync($range, $testMode): array
    {
        try {
            Log::debug("=== FULL ATTENDANCE DEBUG PROCESS STARTED ===");
            Log::debug("STEP 1: Daemon/Command triggered sync for range: {$range}, Test Mode: {$testMode}");

            // Create a mock request
            $request = new \Illuminate\Http\Request([
                'date_range' => $range,
                'test_mode' => $testMode ? 'on' : null,
                'employee_codes' => null,
            ]);

            Log::debug("STEP 2: Passing request to AttendanceSettingsController::pullETimeOfficeData");
            // Use the existing controller method
            $controller = new AttendanceSettingsController;
            $response = $controller->pullETimeOfficeData($request);

            $responseData = json_decode($response->getContent(), true);
            
            Log::debug("STEP 10: Sync process entirely completed. Final Response:", $responseData);

            // Log the sync attempt
            Log::channel('attendance-webhook')->info('Auto-sync completed', [
                'range' => $range,
                'test_mode' => $testMode,
                'result' => $responseData,
            ]);

            return $responseData;

        } catch (\Exception $e) {
            Log::error('Auto-sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [],
            ];
        }
    }
}
