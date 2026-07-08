<?php
$corporateId = 'support';
$username = 'support';
$password = 'support@1';
$authToken = base64_encode("{$corporateId}:{$username}:{$password}:true");

$url = 'https://api.etimeoffice.com/api/DownloadPunchData?Empcode=ALL&FromDate=05/07/2026_06:28&ToDate=06/07/2026_06:28';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Basic $authToken",
    "Accept: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
