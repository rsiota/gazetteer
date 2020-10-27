import {
  showCity,
  numberWithCommas,
  showCountry,
  checkCurrentCard
} from "./helper.js";

var locationMarker;

var currentCard = {
  elementId: '#country-card',
  get id() {
    return this.elementId;
  },
  set id(id) {
    this.elementId = id;
  }
}

var cardFlip = {
  cardFlipped: false,
  getFlip: function() {
    return this.cardFlipped;
  },
  setFlip: function() {
    this.cardFlipped = !this.cardFlipped;
  }
}

function setupMap(map, markerGroup) {

  // Setup default map view
  map.setView([25, -4], 3);

  // Add grayscale layer
  L.tileLayer.grayscale(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);
  markerGroup.addTo(map);
}

function updateMap(layer, map, flagColors, alpha2Code) {

  var bounds = layer.getBounds();
  var north = bounds._northEast.lat;
  var south = bounds._southWest.lat;
  var east = bounds._northEast.lng;
  var west = bounds._southWest.lng;

 switch(alpha2Code) {
  // GeoJson with split country borders at either side of the world 
  case 'RU':
    var west = 57;
    var east = 177;
    break;
  case 'US':
    var west = -175;
    var east = -64; 
    var north = 70;
    var south = 24;
    break;
  default:
}


  // Find center point(latlong) of country bounding box
  var centerX = ((east - west) / 2) + west;
  var centerY = ((north - south) / 2) + south;
  var centerPoint = [centerY, centerX];


  // Find center target of space allocated for map in UI
  // (between search box and above info card in mobile)
  var search = document.getElementById("search");
  var info = document.getElementById("country-info");
  var topInfo = info.getBoundingClientRect().top;
  var bottomSearch = search.getBoundingClientRect().bottom;
  var mapHeight = topInfo - bottomSearch;
  var yViewCenter = (mapHeight / 2) + bottomSearch;

  // Find dimensions of map div
  var mapDiv = document.getElementById("map");
  var rect = mapDiv.getBoundingClientRect();
  var w = rect.width;
  var h = rect.height;

  // Find offset of map from center target of UI in mobile
  var offsetY = (h / 2) - yViewCenter;

  // Find offset of map from center target of UI in desktop
  var offsetX = (w / 2) - ((w - 450) / 2);

  // Find target point (x,y) including offset for mobile
  var yViewTarget = (h / 2) + offsetY;
  var targetPointMobile = [(w / 2), yViewTarget];

  // Find target point (x,y) including offset for desktop
  var xViewTarget = (w / 2) - offsetX;
  var targetPointDesktop = [xViewTarget, (h / 2)];

  // Amend getSize method to return a defined map viewport size
  L.Map.include({
    getSize: function() {
      return new L.Point(w, h);
    }
  });

  // Create a non-visible temp instance of map in a new div
  // (it requires the getSize method to return the viewport size of the map)
  var map2 = new L.Map(document.createElement('div'), {
    'center': [0, 0],
    'zoom': 0
  });

  var corner1 = L.latLng(south, west);
  var corner2 = L.latLng(north, east);
  var bounds = L.latLngBounds(corner1, corner2);

  // Find zoom level of country bounding box in temp map
  var zoom = map2.getBoundsZoom(bounds);

  // Add listeners to temp map setView function to check when zoom is finished
  map2.once("moveend zoomend", function() {
    // Find latlong of UI target location on rendered temp map
    if (w < 480) {
      var pointlatlng = map2.layerPointToLatLng(targetPointMobile);
    } else {
      var pointlatlng = map2.layerPointToLatLng(targetPointDesktop);
    }
    // Set current map with latlong location of required offset,
    // and zoom level obtained from temp map
    map.setView(pointlatlng, zoom);
  });

  // Set temp map view to show country
  map2.setView(centerPoint, zoom);
}

function addLocationMarker(location, map, flagColors) {
  var color = flagColors[location['iso2']];
  locationMarker = new L.Marker.SVGMarker(location['coords'], {
    iconOptions: {
      iconSize: [90, 90],
      circleFillColor: color,
      circleFillOpacity: 0.4,
      weight: 0,
      popupAnchor: [0.5, -4]
    }
  });
  locationMarker._leaflet_id = 'location';
  locationMarker.addTo(map);
}

function addMarkers(result, map, flagColors, alpha2Code, citiesWithIds, markerGroup) {

  // Prepare result data from Geoname
  var cities = result['data']['geonames'];

  // Iterate through cities and create icons
  for (var i = 0; i < cities.length; i++) {

    // Find geonameId of city and add as key of city object
    var cityKey = cities[i]['geonameId'];
    var cityValue = cities[i];

    // Add city to cities object with geonameId's as keys
    citiesWithIds[cityKey] = cityValue;

    // Find coords of city
    var lat = cities[i]['lat'];
    var lng = cities[i]['lng'];
    var latlng = [lat, lng];

    // Create marker for city
    var marker = new L.Marker.SVGMarker(latlng, {
      iconOptions: {
        iconSize: [26, 26],
        circleFillColor: flagColors[alpha2Code],
        color: '#FFF',
        popupAnchor: [0.5, -4]
      }
    });
    // Assign geonameId as id for each marker
    marker._leaflet_id = cities[i]['geonameId'];
    marker.addTo(markerGroup);

    // Declare variable for content of popup
    var cityName = cities[i]['name'];
    var customPopup = cityName;
    var customOptions = {
      'closeButton': false
    }

    // Bind popup to marker
    marker.bindPopup(customPopup, customOptions);
  }

}

// Display GeoJson for country borders and add listeners
// for different mouse events
function displayBorders(json, map, flagColors, inp, func, country, citiesWithIds, markerGroup, hlMarker, getWiki, getPhoto, getWeather) {
  var c = L.geoJson(json, {
    onEachFeature: onEachFeature,
    style: style
  }).addTo(map);

  var selCountry;

  // Add style to each country border polygon
  function style(feature) {
    return {
      fillColor: getColor(feature.properties.ISO2),
      opacity: 0,
      color: getColor(feature.properties.ISO2),
      fillOpacity: 0
    };
  }

  // Find color from flagColors variable for each country code
  function getColor(iso2) {
    if (!flagColors[iso2]) {
      return "white";
    } else {
      return flagColors[iso2];
    }
  }

  // Add listeners to each country polygon feature
  function onEachFeature(feature, layer) {
    layer.on({
      click: onCountryClick,
      mouseover: onCountryHighLight,
      mouseout: onCountryMouseOut
    });
    layer._leaflet_id = layer.feature.properties.ISO2;
  }

  // Event handler when mouse leaves country
  function onCountryMouseOut(e) {
    var layer = e.target;
    var countryCode = layer.feature.properties.ISO2;
    if (selCountry != null) {
      var selCountryCode = selCountry.feature.properties.ISO2;
    } else {
      var selCountryCode = null;
    }
    if (countryCode != selCountryCode) {
      c.resetStyle(layer);
    } else {
      layer.setStyle({
        weight: 2,
        opacity: 0.7,
        dashArray: '',
        fillOpacity: 0.3
      });
    }
  }

  // Event handler when a country is clicked
  function onCountryClick(e) {

    hlMarker = null;
    // Remove previous markers
    var layer = e.target;
    if (selCountry != null && selCountry != layer) {
      map.removeLayer(locationMarker);
      var selCountryCode = selCountry.feature.properties.ISO2;
    } else {
      selCountryCode = null;
    }
    var countryCode = layer.feature.properties.ISO2;
    var countryName = country[countryCode];
    inp.value = countryName;

    if (selCountryCode != null) {
      c.resetStyle(selCountry);
    }
    layer.setStyle({
      weight: 2,
      opacity: 0.7,
      dashArray: '',
      fillOpacity: 0.3
    });

    // Check currentCard before animation
    checkCurrentCard('#country-card');

    currentCard.id = '#country-card';

    if (layer != selCountry) {
      selCountry = layer;
      markerGroup.clearLayers();
      updateMap(layer, map, flagColors, countryCode);
      func();
    } else {
      if (cardFlip.getFlip() != true) {
        setTimeout(function() {
          showCountry();
        }, 1000);
      } else {
        cardFlip.setFlip();
      }
    }
  }


  // Event handler when mouse hovers over a country
  function onCountryHighLight(e) {
    var layer = e.target;
    var countryCode = layer.feature.properties.ISO2;
    var isoCodes = document.getElementById('isoCodes').innerHTML;
    var iso2 = isoCodes.slice(0, 2);
    if (countryCode != iso2) {
      layer.setStyle({
        weight: 1,
        opacity: 0.3,
        dashArray: '',
        fillOpacity: 0.1
      });
    }

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
  }

  // Event handler on popup open
  map.on('popupopen', function(e) {
    // identify marker that triggered popup
    var mark = e.popup._source;
    // remove highlight of previous marker
    if (typeof(hlMarker) != 'undefined' && hlMarker != null) {
      map.removeLayer(hlMarker.popup.highlight);
    }
    // add highlight to selected marker
    e.popup.highlight = L.circleMarker(e.popup.getLatLng(), {
      radius: 9.5,
      opacity: 0,
      fillColor: '#6a6a6a',
      fillOpacity: 1
    }).addTo(markerGroup);
    // record selected marker
    hlMarker = e;

    checkCurrentCard('#city-card');

    // Display city info
    var data = citiesWithIds[mark._leaflet_id];
    var cityName = data['name'];
    var region = data['adminName1'];
    var cityRegion = cityName + " | " + region;
    var cityPopulation = numberWithCommas(data['population']) + ' people';
    var geonameId = data['geonameId'];
    var lat = data['lat'].slice(0, -2) + ' | ';
    var lng = data['lng'].slice(0, -2);

    var cityEncoded = encodeURIComponent(cityName);

    getPhoto(cityEncoded);
    getWeather(data['lat'], data['lng']);
    getWiki(cityEncoded, geonameId);

    currentCard.id = '#city-card';

    if (cardFlip.getFlip() == true) {
      cardFlip.setFlip();
      $('#cityName').html(cityRegion);
      $('#cityPopulation').html(cityPopulation);
      $('#cityCoord').html(lat + lng);
    } else {
      setTimeout(function() {
        $('#cityName').html(cityRegion);
        $('#cityPopulation').html(cityPopulation);
        $('#cityCoord').html(lat + lng);
        showCity();
      }, 1000);
    }

  });

  map.on('popupclose', function(e) {

    // remove highlight of previous marker
    if (typeof(hlMarker) != 'undefined' && hlMarker != null) {
      map.removeLayer(hlMarker.popup.highlight);
    }
  })
}

export {
  cardFlip,
  currentCard,
  setupMap,
  updateMap,
  addMarkers,
  addLocationMarker,
  displayBorders
};
