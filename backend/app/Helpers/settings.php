<?php

use App\Models\Setting;

if (! function_exists('backup_settings')) {
    /**
     * Create a backup of all application settings
     *
     * @return string|false The backup file path on success, false on failure
     */
    function backup_settings()
    {
        try {
            // Get all settings
            $settings = Setting::all();

            $backupData = [
                'version' => '1.0',
                'created_at' => now()->toISOString(),
                'app_name' => config('app.name'),
                'backup_type' => 'settings',
                'settings_count' => $settings->count(),
                'settings' => $settings->map(function ($setting) {
                    return [
                        'key' => $setting->key,
                        'value' => $setting->value,
                        'type' => $setting->type ?? 'text',
                        'group' => $setting->group ?? 'general',
                        'description' => $setting->description,
                        'is_public' => $setting->is_public ?? false,
                        'is_encrypted' => $setting->is_encrypted ?? false,
                        'created_at' => $setting->created_at?->toISOString(),
                        'updated_at' => $setting->updated_at?->toISOString(),
                    ];
                })->toArray(),
            ];

            // Create backup directory if it doesn't exist
            $backupDir = storage_path('app/backups');
            if (! is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            // Generate filename
            $filename = 'settings-backup-'.date('Y-m-d-H-i-s').'.json';
            $filepath = $backupDir.'/'.$filename;

            // Write backup file
            $result = file_put_contents($filepath, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            if ($result === false) {
                \Log::error('Failed to write settings backup file: '.$filepath);

                return false;
            }

            \Log::info('Settings backup created successfully', [
                'filename' => $filename,
                'filepath' => $filepath,
                'settings_count' => $settings->count(),
                'file_size' => filesize($filepath),
            ]);

            return $filepath;

        } catch (\Exception $e) {
            \Log::error('Settings backup failed: '.$e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }
}

if (! function_exists('restore_settings')) {
    /**
     * Restore settings from a backup file
     *
     * @param  string  $filePath  Path to the backup file
     * @return bool Success status
     */
    function restore_settings($filePath)
    {
        try {
            if (! file_exists($filePath)) {
                \Log::error('Settings backup file not found: '.$filePath);

                return false;
            }

            $content = file_get_contents($filePath);
            if ($content === false) {
                \Log::error('Failed to read settings backup file: '.$filePath);

                return false;
            }

            $backupData = json_decode($content, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                \Log::error('Invalid JSON in settings backup file: '.json_last_error_msg());

                return false;
            }

            if (! isset($backupData['settings']) || ! is_array($backupData['settings'])) {
                \Log::error('Invalid backup format: settings array not found');

                return false;
            }

            $restored = 0;
            $skipped = 0;

            \DB::beginTransaction();

            foreach ($backupData['settings'] as $settingData) {
                if (! isset($settingData['key']) || empty($settingData['key'])) {
                    $skipped++;

                    continue;
                }

                try {
                    Setting::updateOrCreate(
                        ['key' => $settingData['key']],
                        [
                            'value' => $settingData['value'] ?? '',
                            'type' => $settingData['type'] ?? 'text',
                            'group' => $settingData['group'] ?? 'general',
                            'description' => $settingData['description'] ?? null,
                            'is_public' => $settingData['is_public'] ?? false,
                            'is_encrypted' => $settingData['is_encrypted'] ?? false,
                        ]
                    );
                    $restored++;
                } catch (\Exception $e) {
                    \Log::warning("Failed to restore setting '{$settingData['key']}': ".$e->getMessage());
                    $skipped++;
                }
            }

            \DB::commit();

            // Clear settings cache
            clear_settings_cache();

            \Log::info('Settings restored successfully', [
                'file' => basename($filePath),
                'restored' => $restored,
                'skipped' => $skipped,
                'total' => count($backupData['settings']),
            ]);

            return true;

        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Settings restore failed: '.$e->getMessage(), [
                'file' => $filePath,
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }
}
