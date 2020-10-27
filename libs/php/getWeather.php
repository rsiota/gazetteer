<?php

require 'config.php';

$apiKey = $apiKeys['openWeather'];
$executionStartTime = microtime(true);
$url = 'http://api.openweathermap.org/data/2.5/weather?lat=' . $_REQUEST['lat'] . '&lon=' . $_REQUEST['lon'] . '&units=metric&appid=' . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result=curl_exec($ch);

curl_close($ch);

$decode = json_decode($result, true);

$output['status']['code'] = "200";
$output['status']['name'] = "OK";
$output['status']['description'] = "Weather information received";

$executionEndTime = microtime(true);
$executionTime = round(($executionEndTime - $executionStartTime) * 1000, 3);

$output['status']['returnedIn'] = $executionTime . " ms";
$output['data'] = $decode;

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);

?>
