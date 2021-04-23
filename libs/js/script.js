import {
  countryNames
} from './country-names.js';
import {
  countryCodes
} from './country-codes.js';
import {
  flagColors
} from './flag-colors.js';
import {
  borders
} from './borders.min.js';
import {
  weatherIcons
} from './weather-icons.js';
import {
  appendCountries
} from './autocomplete.js';
import {
  cardFlip,
  currentCard,
  setupMap,
  addMarkers,
  displayBorders,
  addLocationMarker
} from './maps.js';
import {
  flipCard,
  capitalizeFirstLetter,
  numberWithCommas,
  formatTime,
  animateTable,
  filterByKeyValue,
  showCountry,
  faviconTemplate,
  convertHex,
  animateLoader
} from './helper.js';

var map = L.map('map', {
  fadeAnimation: false,
  zoomControl: false,
  attributionControl: false,
});

var markerGroup = L.layerGroup();
var citiesWithIds = {};
var hlMarker;
var locationMarker;
var search = document.getElementById("search");
var isFlickity;
var $slider;
var currentLocation = {};
var currencyCode;


getLocation();

// Set up map
setupMap(map, markerGroup);

// Display borders Geojson and add event listeners to map
displayBorders(borders, map, flagColors, search, returnSearch, countryCodes, citiesWithIds, markerGroup, hlMarker, getWiki, getPhoto, getWeather);

// Show country info card
showCountry();

$(window).load(function() {
  if (jQuery.isEmptyObject(currentLocation)) {
    var lat = 51.5074;
    var lng = 0.1278;
    currentLocation['coords'] = [lat, lng];
    getLocationCountry(lat, lng);
  }
  animateLoader(map, currentLocation);
  appendCountries(countryNames, map, countryCodes);
});

// Animate/expand country info card on click
$('#country-info').click(function() {
  animateTable('#country-card', '#country-info', 'tb-country');
});

// Animate/exand city card on click
$('#city-info').click(function() {
  animateTable('#city-card', '#city-info', 'tb-city');
});

// Flip card to show photos/text on click
$('#photo-button').click(function() {
  flipCard(currentCard.id);
  cardFlip.cardFlipped = !cardFlip.cardFlipped;
});

$(".button").hover(function() {
  $(this).css("background-color", "var(--accent)");
  $(this).find(".button-icon").css("color", "#fff");
}, function() {
  $(this).css("background-color", "#fff");
  $(this).find(".button-icon").css("color", "var(--accent)");
});

$('#cityWikipedia').click(function(event) {
  event.stopPropagation();
});

// Display country of current user location
$('#location-button').click(function() {
  if (currentLocation['country']) {
    $('#search').val(currentLocation['country']);
    map._layers[currentLocation['iso2']].fire('click');
    addLocationMarker(currentLocation, map, flagColors);
  } else {
    console.log('Waiting to receive response from server');
  }
});

// Find country of current user location
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

// Event handler for getCurrentPosition
function showPosition(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  currentLocation['coords'] = [lat, lng];
  getLocationCountry(lat, lng);
}

// Main Ajax request function for country information
function returnSearch() {

  var alpha2Code;

  $.ajax({
    url: "libs/php/getCountryInfo.php",
    type: 'POST',
    dataType: 'json',
    cache: 'false',
    data: {
      country: $('#search').val(),
    },
    success: function(result) {
      if (result.status.name == "OK") {
        // Prepare data from JSON
        const data = result['data'][0];
        const flag = data['flag'];
        const country = data['name'] + ' | ' + data['nativeName'];
        const capital = data['capital'];
        const region = data['region'] + ' | ' + data['subregion'];
        const population = numberWithCommas(data['population']) + ' people';
        const languages = data['languages'];
        const language1 = languages[0]['name'];
        let language2 = '';
        if (languages.length > 1) {
          language2 = ' | ' + languages[1]['name'];
        }
        const demonym = data['demonym'];
        const area = numberWithCommas(data['area']) + ' sq. km';
        const lat = (data['latlng'][0]).toFixed(1) + ' | ';
        const lng = (data['latlng'][1]).toFixed(1);
        const timezone = data['timezones'][0];
        alpha2Code = data['alpha2Code'];
        const alpha3Code = ' | ' + data['alpha3Code'];
        const currencyName = data['currencies'][0]['name'];
        const currencySymbol = ' (' + data['currencies'][0]['symbol'] + ')';
        const callingCode = '+' + data['callingCodes'][0];
        const regionalBlocs = 'N/A';
        const isRegionalBloc = data['regionalBlocs'];
        if (!isRegionalBloc.length === 0) {
          const regionalBlocs = data['regionalBlocs'][0]['acronym'];
        }
        currencyCode = data['currencies'][0]['code'];

        getPhoto(country);

        // Update html placeholders with retrieved information
        if (cardFlip.getFlip() == true) {
          cardFlip.setFlip();
          updateFields();
        } else {
          setTimeout(function() {
            updateFields();
            showCountry();
          }, 1000);
        }

        function updateFields() {
          $('#flag').attr('src', flag);
          $('#country').html(country);
          $('#capital').html(capital);
          $('#population').html(population);
          $('#languages').html(language1 + language2);
          $('#demonym').html(demonym);
          $('#area').html(area);
          $('#coord').html(lat + lng);
          $('#currencyName').html(currencyName + currencySymbol);
          $('#region').html(region);
          $('#timezone').html(timezone);
          $('#isoCodes').html(alpha2Code + alpha3Code);
          $('#callingCode').html(callingCode);
          $('#regionalBlocs').html(regionalBlocs);
        }


        // Change accent color to first flag color that is not white
        document.documentElement.style.setProperty('--accent', flagColors[alpha2Code]);
        document.getElementById("flag-container").style.display = "block";

        // Change favicon dynamically
        const linkForFavicon = document.querySelector(
          `head > link[rel='icon']`
        );
        var faviconColor = convertHex(flagColors[alpha2Code]);
        const newFavicon = faviconTemplate(faviconColor);
        linkForFavicon.setAttribute(`href`, `data:image/svg+xml, ${newFavicon}`);

        // Ajax request to Geonames API (cities)
        $.ajax({
          url: "libs/php/getCities.php",
          type: 'POST',
          dataType: 'json',
          cache: 'false',
          data: {
            iso2: alpha2Code
          },
          success: function(result) {
            if (result.status.name == "OK") {
              addMarkers(result, map, flagColors, alpha2Code, citiesWithIds, markerGroup);
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
          }
        });
      };
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });

  // Ajax request to Openexchange API
  $.ajax({
    url: "libs/php/getCurrencyInfo.php",
    type: 'POST',
    dataType: 'json',
    cache: 'false',
    async: 'false',
    success: function(result) {
      if (result.status.name == "OK") {
        const exchangeRate = '1 ' + currencyCode + ' | ' + (result['data']['rates'][currencyCode]).toFixed(4) + ' USD';
        $('#exchangeRate').html(exchangeRate);
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
};

function getLocationCountry(lat, lng) {
  // Ajax request to Geonames API
  $.ajax({
    url: "libs/php/getLocationCountry.php",
    type: 'POST',
    dataType: 'json',
    cache: 'false',
    data: {
      lat: lat,
      lng: lng
    },
    success: function(result) {
      if (result.status.name == "OK") {
        var iso2 = result['data']['geonames'][0]['countryCode'];
        currentLocation['iso2'] = iso2;
        currentLocation['country'] = countryCodes[iso2];
        currentLocation['color'] = flagColors[currentLocation['iso2']];
      }

    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
}

function getPhoto(place) {

  // Ajax request to Google API
  $.ajax({
    url: "libs/php/getPhoto.php",
    type: 'POST',
    dataType: 'json',
    cache: 'false',
    async: 'false',
    data: {
      place: place,
    },
    success: function(result) {
      if (result.status.name == "OK") {
        var urlList = result['data'];

        endFlick();
        $.when(displayPhotos()).then(iniFlick());

        function displayPhotos() {
          var slider = document.getElementById("city-slider");

          slider.innerHTML = '';
          for (var i = 0; i < urlList.length; i++) {
            var cityImg = document.createElement('IMG');
            cityImg.src = urlList[i];
            cityImg.className = 'slide';
            cityImg.referrerPolicy = 'no-referrer';
            slider.appendChild(cityImg);
          }
        }

        function iniFlick() {
          setTimeout(function() {
            $slider = $('.slider').flickity({
              contain: true,
              freeScroll: true,
              fullscreen: true,
              wrapAround: true,
              autoPlay: true
            });
          }, 500)
          isFlickity = true;
        }

        function endFlick() {
          if (isFlickity) {
            $slider.flickity('destroy');
          }
        }
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
}

function getWeather(lat, lon) {
  // Ajax request to OpenWeather API (Wikipedia)
  $.ajax({
    url: "libs/php/getWeather.php",
    type: 'POST',
    dataType: 'json',
    cache: 'false',
    data: {
      lat: lat,
      lon: lon
    },
    success: function(result) {
      if (result.status.name == "OK") {

        var weatherDescription = result['data']['weather'][0]['description'];
        weatherDescription = capitalizeFirstLetter(weatherDescription);
        var weatherIcon = result['data']['weather'][0]['icon'];
        weatherIcon = weatherIcons[weatherIcon];
        var temperature = result['data']['main']['temp'].toFixed(0);
        var tempFeels = result['data']['main']['feels_like'].toFixed(0);
        var tempMin = result['data']['main']['temp_min'].toFixed(0);
        var tempMax = result['data']['main']['temp_max'].toFixed(0);
        var humidity = result['data']['main']['humidity'];
        var windSpeed = result['data']['wind']['speed'];
        var windDirection = result['data']['wind']['deg'];
        var sunRise = result['data']['sys']['sunrise'];
        var sunSet = result['data']['sys']['sunset'];

        var cityWind = windSpeed + ' m/s | ';
        var cityTemperature = temperature + '° (' + tempFeels + '°)';
        var cityTempMinMax = tempMin + '° | ' + tempMax + '°';
        var citySunTime = formatTime(sunRise) + ' | ' + formatTime(sunSet);

        $('#cityWeather').html(weatherDescription);
        $('#weatherIcon').removeClass();
        $('#weatherIcon').addClass(weatherIcon);
        $('#cityTemperature').html(cityTemperature);
        $('#cityTempMinMax').html(cityTempMinMax);
        $('#cityHumidity').html(humidity + '%');
        $('#cityWind span').html(cityWind);
        $('#windDirection').css("transform", "rotate(" + windDirection + "deg)");
        $('#citySunTime').html(citySunTime);

      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });
}

function getWiki(place, geonameId) {
  // Ajax request to Geonames API (Wikipedia)
  $.ajax({
    url: "libs/php/getWiki.php",
    type: 'POST',
    dataType: 'json',
    cache: 'false',
    data: {
      place: place,
    },
    success: function(result) {
      if (result.status.name == "OK") {
        geonameId = geonameId.toString().slice(0, 5);
        const wikiSummary = filterByKeyValue('geoNameId', geonameId, 'summary', result['data']['geonames']);
        const wikiLink = filterByKeyValue('geoNameId', geonameId, 'wikipediaUrl', result['data']['geonames']);
        const wikiLinkFull = 'https://' + wikiLink;
        $('#citySummary').html(wikiSummary);
        $('#cityWikipedia').html(wikiLink);
        $('#cityWikipedia').attr("href", wikiLinkFull);
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
    }
  });

}

export {
  currentLocation
};