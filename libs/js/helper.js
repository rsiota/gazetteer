import {
  currentCard,
  cardFlip,
  addLocationMarker,
} from "./maps.js";

import {
  flagColors
} from './flag-colors.js';

// Capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Format numbers
function numberWithCommas(x) {
  x = parseInt(x);
  x = Math.round(x);
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Find height of info card
function findHeight(tableId, noRows) {
  const tbl = document.getElementById(tableId).rows;
  var totalHeight = 0;
  var i = 0;
  for (i = 0; i < noRows; i++) {
    totalHeight += tbl[i].offsetHeight;
  }
  return totalHeight;
}

// Check if key1 exists and return value of key2
function getValueByKey(key1, key2, data) {
  var i, len = data.length;
  for (i = 0; i < len; i++) {
    if (data[i] && data[i].hasOwnProperty(key1)) {
      return data[i][key2];
    }
  }
  return -1;
}

// Check if key1 exists, filter by value of key1, and return value of key2
function filterByKeyValue(key1, key1Value, key2, data) {
  var i, len = data.length;
  for (i = 0; i < len; i++) {
    if (data[i] && data[i].hasOwnProperty(key1)) {
      var geonameId = data[i][key1].toString().slice(0, 5);
      if (geonameId == key1Value) {
        return data[i][key2];
      }
    }
  }
  return -1;
}

function formatTime(unixTime) {
  var date = new Date(unixTime * 1000);
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var formattedTime = hours + ':' + minutes.substr(-2);
  return formattedTime;
}

// Animate info card with more rows
function animateTable(divContainer, divId, tableId) {
  if ($(divId).height() > 300) {
    $(divContainer).css({
      'clip-path': ''
    });
    $(divId).animate({
      "height": findHeight(tableId, 5)
    });
    $('#blank-card').animate({
      "height": findHeight(tableId, 5)
    });
  } else {
    $(' ').css({
      'clip-path': ''
    });
    var rows = document.getElementById(tableId).rows.length;
    $(divId).animate({
      "height": findHeight(tableId, rows)
    });

    $('#blank-card').animate({
      "height": findHeight(tableId, rows),
    });
  }
}

// Adjust info card height if rows have several lines
function adjustTableHeight(divId, table) {
  if ($(divId).height() > 300) {
    $(divId).animate({
      "height": findHeight(table, table.rows.length)
    });
  } else {
    $(divId).animate({
      "height": findHeight(table, 5),
    });
  }
  $('#blank-card').animate({
    "height": findHeight(table, 5),
  })
}

// Expand circle clip path animation
function expandCard(card) {
  let cardEl = document.querySelector(card);
  anime({
    targets: card,
    clipPath: [{
        value: 'circle(0%)',
        duration: 1
      },
      {
        value: 'circle(75%)',
        duration: 1000
      },
    ],
    easing: 'easeOutExpo',
    complete: function() {
      cardEl.style.clipPath = '';
    }
  });
}

// Contract circle clip path animation
function contractCard(card) {
  let cardEl = document.querySelector(card);

  anime({
    targets: card,
    clipPath: [{
        value: 'circle(75%)',
        duration: 1
      },
      {
        value: 'circle(0%)',
        duration: 1000
      },
    ],
    easing: 'easeOutExpo',
  });
}

// Make card visibility visible
function visible(card) {
  $(card).css({
    "visibility": "visible"
  });
}

// Make card visibility hidden
function hide(card) {
  $(card).css({
    "visibility": "hidden"
  });
}

function bringFront(card) {
  $(card).css({
    'z-index': '10'
  });
}

function sendBack(card) {
  $(card).css({
    'z-index': '1'
  });
}

// Flip card
function flip(card) {
  $(card).closest('.flip-card').toggleClass('hover');
  $(card).css('transform, rotateY(180deg)');
}

// Hide city info card
function hideCity() {
  visible('#city-card');
  bringFront('#city-card');
  visible("#blank-card");
  sendBack('#blank-card');
  hide('#country-card');
  contractCard('#city-card');
}

function showCity() {
  visible('#city-card');
  bringFront('#city-card');
  visible('#blank-card');
  sendBack('#blank-card');
  hide('#photo-card');
  hide('#country-card');
  expandCard('#city-card');
  adjustTableHeight('#city-info', 'tb-city');
  adjustTableHeight('#blank-card', 'tb-city');
}

function hideCountry() {
  visible("#blank-card");
  sendBack('#blank-card');
  visible("#country-card");
  bringFront('#country-card');
  hide("#city-card");
  hide('#photo-card');
  contractCard('#country-card');
}


function showCountry() {
  visible('#country-card');
  bringFront('#country-card');
  sendBack('#blank-card');
  hide('#photo-card');
  hide('#city-card');
  expandCard('#country-card');
  adjustTableHeight('#country-info', 'tb-country');
  adjustTableHeight('#blank-card', 'tb-country');
}

// animate/flip info card, and display photos
function flipCard(card) {
  $('#camera-icon').toggleClass('fa-camera fa-bars');
  if ($(card).hasClass('hover')) {
    flipCardShowText(card);
  } else {
    flipCardShowPhoto(card);
  }
}

function flipCardShowText(card) {
  let cardEl = document.querySelector(card);
  cardEl.style.clipPath = '';
  setTimeout(function() {
    hide('#blank-card');
    visible(card);
    if (card == '#city-card') {
      hide('#country-card');
    } else {
      hide('#city-card');
    }
    flip('#city-card-inner');
    flip('#country-card-inner');
    if (card == '#city-card') {
      adjustTableHeight('#city-info', 'tb-city');
    } else {
      adjustTableHeight('#country-info', 'tb-country');
    }
  }, 1000)
  contractCard('#photo-card');

}

function flipCardShowPhoto(card) {
  visible(card);
  sendBack(card);
  hide('#blank-card');
  // check current card to  flip
  if (card == '#city-card') {
    hide('#country-card');
  } else {
    hide('#city-card');
  }
  // flip(card + '-inner');
  flip('#city-card-inner');
  flip('#country-card-inner');
  setTimeout(function() {
    visible('#photo-card');
    bringFront('#photo-card');
    expandCard('#photo-card');
  }, 800)
}

function checkCurrentCard(card) {
  if (currentCard.id == '#city-card') {
    if (cardFlip.getFlip() == true) {
      cFlip(card);
    } else {
      hideCity();
    }
  } else if (currentCard.id == '#country-card') {
    if (cardFlip.getFlip() == true) {
      cFlip(card);
    } else {
      hideCountry();
    }
  }
}

function cFlip(card) {
  flipCardShowText(card);
  $('#camera-icon').toggleClass('fa-camera fa-bars');
}

function convertHex(hex) {
  hex = hex.replace('#', '');
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  var result = 'rgb(' + r + ',' + g + ',' + b + ')';
  return result;
}

function faviconTemplate(str) {
  return `
<svg xmlns="http://www.w3.org/2000/svg"
 width="200" height="200" viewBox="0 0 200 200">
<g transform="translate(0,200) scale(0.1,-0.1)">
<path d="M965 1889 c-384 -52 -664 -283 -772 -636 -24 -79 -26 -104 -27 -248
0 -122 4 -175 17 -225 128 -474 571 -743 1096 -666 182 27 367 94 489 178 l42
29 0 355 0 354 -182 -2 -183 -3 -3 -256 -2 -257 -48 -20 c-163 -70 -377 -66
-532 10 -78 38 -192 148 -233 224 -60 113 -79 299 -43 433 63 241 283 400 554
401 129 0 298 -64 393 -149 l54 -49 50 47 c28 25 86 79 130 120 l80 74 -60 54
c-120 109 -267 182 -441 218 -97 20 -285 27 -379 14z" fill="${str}"/>
</g>
</svg>
  `.trim();
}

function animateLoader(map, currentLocation) {

  const loading = document.getElementById('loading');
  visible('.center');
  $(".ml .letters").each(function() {
    $(this).html(
      $(this)
      .text()
      .replace(/([^\x00-\x80]|\w)/g, "<span class='letter fade'>$&</span>")
    );
  });

  ml.timelines["ml"] = anime
    .timeline({})
    .add({
      targets: ".path",
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: "easeInOutSine",
      direction: "linear",
      duration: 1500,
    })
    .add({
      targets: ".path",
      fill: "#d4d4d4",
      easing: "easeInOutSine",
      direction: "linear",
      duration: 1200
    })
    .add({
      targets: ".icon-loader",
      easing: "easeInOutSine",
      direction: "linear",
      translateX: -170,
      translateY: -23,
      scale: (0.32, 0.32),
      duration: 700
    }, '-=500')
    .add({
      targets: ".ml .cursor",
      scaleY: [0, 1],
      opacity: [0.5, 1],
      easing: "easeInOutSine",
      duration: 700
    })
    .add({
      targets: ".ml .cursor",
      translateX: [0, $(".ml .letters").width()],
      easing: "easeOutExpo",
      duration: 700,
      delay: 100
    })
    .add({
      targets: ".ml .letter",
      opacity: [0, 1],
      easing: "easeOutExpo",
      duration: 600,
      delay: function(el, i) {
        return 34 * (i + 1);
      }
    }, '-=775')
    .add({
      targets: ".ml .cursor1",
      duration: 500,
      opacity: 0,
      easing: "easeInOutSine",
      begin: function() {
        zoomToLocation(currentLocation, map);
      }
    })
    .add({
      targets: "#loading",
      duration: 1500,
      delay: 500,
      opacity: 0,
    })
}

function zoomToLocation(location, map) {
  $('#search').val(location['country']);
  map._layers[location['iso2']].fire('click');
  addLocationMarker(location, map, flagColors);
}

export {
  capitalizeFirstLetter,
  numberWithCommas,
  findHeight,
  getValueByKey,
  filterByKeyValue,
  formatTime,
  animateTable,
  adjustTableHeight,
  flipCard,
  flipCardShowText,
  flipCardShowPhoto,
  hideCountry,
  showCountry,
  hideCity,
  showCity,
  checkCurrentCard,
  faviconTemplate,
  convertHex,
  animateLoader,
};
