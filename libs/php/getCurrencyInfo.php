<?php

require 'config.php';
$executionStartTime = microtime(true);

// Fetch currency rates JSON
$appId = $apiKeys['openExchangeRates'];
$url = 'https://openexchangerates.org/api/latest.json?app_id=' . $appId;

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

curl_close($ch);

$exchangeRates = json_decode($result, true);


// Prepare response
$output['status']['code'] = "200";
$output['status']['name'] = "OK";
$output['status']['description'] = "Currency information received";

$executionEndTime = microtime(true);
$executionTime = round(($executionEndTime - $executionStartTime) * 1000, 3);

$output['status']['returnedIn'] = $executionTime . " ms";
$output['data'] = $exchangeRates;

header('Content-Type: application/json; charset=UTF-8');

// Send response
echo json_encode($output);

?>
