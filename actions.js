var map = L
 .map('mapid')
 .setView([40.730610, -73.975242], 12);   // center position + zoom
 // Add background to map (many diff options: https://leaflet-extras.github.io/leaflet-providers/preview/)
L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19, minZoom: 11
    }).addTo(map);

function getColor(d) {
    return d > 10000 ? '#0c2c84' : d > 7500  ? '#225ea8' :
        d > 5000  ? '#1d91c0' : d > 2500  ? '#41b6c4' :
        d > 1000   ? '#7fcdbb' : d > 500   ? '#c7e9b4' :
        d > 100   ? '#edf8b1' : '#ffffd9';
 }
 function getColor2(d) {
    return d > 15 ? '#b10026' : d > 12.5  ? '#e31a1c' :
        d > 10  ? '#fc4e2a' : d > 7.5  ? '#fd8d3c' :
        d > 5   ? '#feb24c' : d > 2.5  ? '#fed976' :
        d > 1   ? '#ffeda0' : '#ffffcc';
 }

 function style(feature){
    return {
    fillColor: getColor(feature.properties.ghg),
    stroke: false,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 1,
    };
 }

 function style2(feature){
    return {
    fillColor: getColor2((feature.properties.ghg*1000)/(feature.properties.gfa)),
    stroke: false,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 1,
    };
 }

function populateDiv(e) {
    var bldgdata = e.target.feature.properties;
    console.log(bldgdata);
    BldgShowInfo.innerHTML = '<p>   ' + bldgdata.Address + '</p>' +
    '<p>   ' + bldgdata.ghg + '</p>' +
    '<p>   ' + bldgdata.gfa + '</p>' +
    '<p>   ' + bldgdata.ZoneDist1 + '</p>' +
    '<p>   ' + bldgdata.LandUse + '</p>' +
    '<p>   ' + bldgdata.BldgClass + '</p>' +
    '<p>   ' + bldgdata.ComArea + '</p>';
}

var info = L.control({position: 'bottomright'});
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};
// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML =  
    (props ? '<h4> <b>' + props.Address  + '</b></h4><hr>'+
    '<p>Lot Area: ' + props.LotArea + ' ft<sup>2</sup></p>' +
    '<p>Commercial Area: ' + props.ComArea + ' ft<sup>2</sup></p>' +
    '<p>Residential Area: ' + props.ResArea + ' ft<sup>2</sup></p>' + '<hr>' +
    '<p>Zoning District: ' + props.ZoneDist1 + '</p>' +
    '<p>Building Class: ' + props.BldgClass + '</p>' +
    '<p>Land Use Type: ' + props.LandUse + '</p>' + '<hr>' +
    '<p>Annual Electricity Use: ' + props.elec_grid + ' kWh </p>' +
    '<p>Annual Natural Gas Use: ' + props.gas_use + ' kBtu </p>' +
    '<p>Total GHG Emissions: ' + props.ghg + ' MTCO<sub>2</sub>e</p>'
        : '<h4>' + 'Building Information Guide' + '</h4><hr>' +
        '<p> Hover over a building to view basic info. </p>' +
        '<p>Click on a building for detailed analysis.</p>');
};
info.addTo(map);

 var geojson;

function highlightFeature(e) {
    e.target.setStyle({
        fillColor: 'red',
        stroke: false,
        opacity: 1,
        color: 'grey',
        dashArray: '',
        fillOpacity: .65
    });
    info.update(e.target.feature.properties);
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        e.target.bringToFront();
    }
}
function highlightFeature2(e) {
    e.target.setStyle({
        fillColor: '#73d2e9',
        stroke: false,
        opacity: 1,
        color: 'grey',
        dashArray: '',
        fillOpacity: .65
    });
    info.update(e.target.feature.properties);
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        e.target.bringToFront();
    }
}
 function resetHighlight(e) {
     geojson.resetStyle(e.target);
     info.update();
 }
 function zoomToFeature(e) {
    populateDiv(e);
    console.log(e.target.getBounds());
    var bnd = e.target.getBounds();
    var centerlat = (bnd._northEast.lat + bnd._southWest.lat)/2;
    var centerlng = (bnd._northEast.lng + bnd._southWest.lng)/2;
    bnd._northEast.lat = centerlat + .002;
    bnd._northEast.lng = centerlng + .002;
    bnd._southWest.lat = centerlat - .002;
    bnd._southWest.lng = centerlng - .002;
    map.fitBounds(bnd);

 }
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
function onEachFeature2(feature, layer) {
    layer.on({
        mouseover: highlightFeature2,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
 
 geojson = L.geoJson(data, 
             {style: style,
             onEachFeature: onEachFeature
            }).addTo(map);

//Create Legend
var legend = L.control({position: 'bottomleft'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 100, 500, 1000, 2500, 5000, 7500, 10000],
        labels = [];
    div.innerHTML += '<center><i>GHG:</i>MTCO<sub>2</sub>e</center>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
};
legend.addTo(map);

 document.getElementById('policypage').addEventListener('click',
 function() {
    document.querySelector('.bg-modal').style.display = 'flex';
 });

 document.getElementById('closepolicy').addEventListener('click',
 function() {
    document.querySelector('.bg-modal').style.display = 'none';
 });

document.getElementById('GHG_TOTAL').addEventListener('click',
function() {
    geojson.options.style = style;
    geojson.options.onEachFeature = onEachFeature;
    geojson.setStyle(style);
    legend._container.innerHTML = "<center><i>GHG:</i>MTCO<sub>2</sub>e</center>" +
    '<i style="background:#ffffd9"></i> 0 &ndash; 100<br><i style="background:#edf8b1">' +
    '</i> 100 &ndash; 500<br><i style="background:#c7e9b4"></i> 500 &ndash; 1000<br>' +
    '<i style="background:#7fcdbb"></i> 1000 &ndash; 2500<br><i style="background:#41b6c4">' +
    '</i> 2500 &ndash; 5000<br><i style="background:#1d91c0"></i> 5000 &ndash; 7500<br><i style="background:#225ea8">' +
    '</i> 7500 &ndash; 10000<br><i style="background:#0c2c84"></i> 10000+'
});

document.getElementById('GHG_INT').addEventListener('click',
function() {
    geojson.options.style = style2;
    geojson.options.onEachFeature = onEachFeature2;
    geojson.setStyle(style2);
    legend._container.innerHTML = "<center><i></i>tCO<sub>2</sub>e/ft<sup>2</sup></center>" +
    '<i style="background:#ffffcc"></i> 0 &ndash; 1<br><i style="background:#ffeda0">' +
    '</i> 1 &ndash; 2.5<br><i style="background:#fed976"></i> 2.5 &ndash; 5<br>' +
    '<i style="background:#feb24c"></i> 5 &ndash; 7.5<br><i style="background:#fd8d3c">' +
    '</i> 7.5 &ndash; 10<br><i style="background:#fc4e2a"></i> 10 &ndash; 12.5<br><i style="background:#e31a1c">' +
    '</i> 12.5 &ndash; 15<br><i style="background:#b10026"></i> 15+'
});

console.log(geojson.options);