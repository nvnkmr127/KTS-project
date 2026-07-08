<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$corporateId = 'support';
$username = 'support';
$password = 'support@1';
$authToken = base64_encode("{$corporateId}:{$username}:{$password}:true");

$url = 'https://api.etimeoffice.com/api/DownloadPunchData?Empcode=ALL&FromDate=05/07/2026_06:00&ToDate=06/07/2026_06:00';

$response = Http::withHeaders([
    'Authorization' => 'Basic '.$authToken,
    'Accept' => 'application/json'
])->get($url);

echo "Status: " . $response->status() . "\n";
echo "Body: " . $response->body() . "\n";
