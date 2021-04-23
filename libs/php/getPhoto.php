<?php

require 'config.php';
require_once 'vendor/autoload.php';
use SKAgarwal\GoogleApi\PlacesApi;
$apiKey = $apiKeys['googleApi'];
$executionStartTime = microtime(true);
$googlePlaces = new PlacesApi($apiKey);
$result = $googlePlaces->findPlace($_REQUEST['place'], 'textquery');
$place = json_decode($result, true);
$placeId = $place['candidates'][0]['place_id'];
$result = $googlePlaces->placeDetails($placeId);
$placeDetails = json_decode($result, true);
$photosArray = $placeDetails['result']['photos'];
$photosArr = array_slice($photosArray,0,6);

$urlArr = array();
foreach($photosArr as $item) {
	$photoReference = $item['photo_reference'];
	array_push($urlArr, $photoReference);
}
// array of curl handles
$multiCurl = array();
// data to be returned
$result = array();
// multi handle
$mh = curl_multi_init();
foreach ($urlArr as $i) {
	$url= 'https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=' . $i . '&key='. $apiKey;
	$multiCurl[$i] = curl_init();
	curl_setopt($multiCurl[$i], CURLOPT_URL, $url);
	curl_setopt($multiCurl[$i], CURLOPT_HEADER, 0);
	curl_setopt($multiCurl[$i], CURLOPT_RETURNTRANSFER, 1);
	curl_multi_add_handle($mh, $multiCurl[$i]);
}
$index=null;
do {
	curl_multi_exec($mh, $index);
} while($index > 0);
// get content and remove handles
foreach($multiCurl as $k => $ch) {
	$result[$k] = curl_multi_getcontent($ch);
	curl_multi_remove_handle($mh, $ch);
}
// close
curl_multi_close($mh);

$urls = array();
foreach ($result as $i) {
	$pattern = "/https:([^;]*)h400/";
	if(preg_match($pattern, $i, $url)) {
		array_push($urls, $url[0]);
	}
}

$output['status']['code'] = "200";
$output['status']['name'] = "OK";
$output['status']['description'] = "City photo received";

$executionEndTime = microtime(true);
$executionTime = round(($executionEndTime - $executionStartTime) * 1000, 3);

$output['status']['returnedIn'] = $executionTime . " ms";
$output['data'] = $photo;
$output['data'] = $urls;

/* echo json_encode($output); */
echo json_encode($output);

?>
