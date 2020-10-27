function appendCountries(countries, map, countryCodes) {
  var select = document.getElementById("search");

  for (var i = 0; i < countries.length; i++) {
    var opt = countries[i];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = opt;
    select.appendChild(el);
  }
  var lastIndex = "";
  var changedText = document.getElementById('search');

  function listQ() {
    startSearch();
  }

  function startSearch() {
    const iso2 = getKeyByValue(countryCodes, select.value.toUpperCase());
    map._layers[iso2].fire('click');
  }

  function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key].toUpperCase() === value);
  }

  document.getElementById("search").onchange = listQ;

}

export {
  appendCountries
};
