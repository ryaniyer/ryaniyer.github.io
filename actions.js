const map = L
 .map('mapid')
 .setView([40.754797, -73.985069], 13);   // center position + zoom


//add a separate label layer above geojsons:
map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';
var positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19, minZoom: 12
}).addTo(map);
var positronLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        pane: 'labels',subdomains: 'abcd', maxZoom: 19, minZoom: 11
}).addTo(map);

//Create color gradients by plotting distribution and focus range on middle 50% 
//blue-green color scheme for total GHG intensity:
function ghgintColor(d) {
    return d > 12 ? '#0c2c84' : d > 10  ? '#225ea8' :
        d > 7.5  ? '#1d91c0' : d > 5  ? '#41b6c4' :
        d > 3.5   ? '#7fcdbb' : d > 2   ? '#c7e9b4' :
        d > 1   ? '#edf8b1' : '#ffffd9';
 } //red hot color scheme for GHG total:
function ghgColor(d) {
    return d > 10000 ? '#b10026' : d > 7500  ? '#e31a1c' :
        d > 5000  ? '#fc4e2a' : d > 2500  ? '#fd8d3c' :
        d > 1000   ? '#feb24c' : d > 500  ? '#fed976' :
        d > 100   ? '#ffeda0' : '#ffffcc';
} //red gradient with green for no fine:
function fineColor(d) {
    return d > 10000000 ? '#13306dff' : d > 5000000  ? '#403891ff' :
        d > 1000000  ? '#6b4596ff' : d > 500000  ? '#a65c85ff' :
        d > 250000   ? '#cc6a70ff' : d > 50000   ? '#f68f46ff' :
        d > 0   ? '#f7cb44ff' : '#bdbdbd';
}
function nofineopaque(d){
    if(d>0){return 1}
    else{return 0.55}
}
//fills each feature by total GHG
function style(feature){
    return {fillColor: ghgColor(feature.properties.GHG),stroke: false,opacity: 1,
    color: 'white',dashArray: '3',fillOpacity: 1};}
//fills each feature by kgCO2e/sqft intensity
function style2(feature){
    return {fillColor: ghgintColor((feature.properties.GHG*1000)/(feature.properties.GFA)),
    stroke: false,opacity: 1,color: 'white',dashArray: '3',fillOpacity: 1};}
//fills each feature by total fines subject:
function style3(feature){
    var props = feature.properties;
    var f24 = get_fine_numerical(get_ghg_limit(props, fine2429), get_tot_ghg(props));
    var f30 = get_fine_numerical(get_ghg_limit(props, fine3034), get_tot_ghg(props));
    return {fillColor: fineColor(f24*6+f30*5),stroke: false,opacity: 1,
    color: 'white',dashArray: '3',fillOpacity: nofineopaque(f24*6+f30*5)};}


function populateDiv(e) {
    let props = e.target.feature.properties;
    var bldggeo = e.target.feature.geometry;
    var lat1 = bldggeo.coordinates[0][0][1].toString().slice(0,9)
    var lng1 = bldggeo.coordinates[0][0][0].toString().slice(0,10)
    var imgsrc = 'https://maps.googleapis.com/maps/api/streetview?size=400x200&location='+lat1+','+lng1+'&fov=120&pitch=30&source=outdoor&radius=100&key=AIzaSyDvtubijqIGWaGxrJii3ioZdSC5dV7i5lI';
    document.getElementById('buildingcontent').style.display = 'inherit';
    document.getElementById('scrollcontent').style.display = 'none';
    var gl24 = get_ghg_limit(props, fine2429);
    var gl30 = get_ghg_limit(props, fine3034);
    var bldgghg = get_tot_ghg(props);
    var fine24 = get_fine(gl24, bldgghg);
    var fine30 = get_fine(gl30, bldgghg);
    bldgInfo.innerHTML = '<p>BBL: ' + props.BBL +'</p>' +
    '<p>GHG Total: ' + numcomma(bldgghg) + ' MTCO2e</p>' +
    '<p>GHG Intensity: ' + (1000*bldgghg/props.GFA).toFixed(2) + ' kgCO2e/ft<sup>2</sup></p>'+
    '<p>Gross Floor Area: ' + numcomma(props.GFA) + ' ft<sup>2</sup></p>';
    var subtofine = ''
    var f24 = get_fine_numerical(get_ghg_limit(props, fine2429), get_tot_ghg(props));
    var f30 = get_fine_numerical(get_ghg_limit(props, fine3034), get_tot_ghg(props));
    if(parseInt(f24)>0 || parseInt(f30)>0){
        subtofine = 'Yes';
    } else {subtofine = 'No'};
    bldgInfo.innerHTML += '<p>Subject to Fine Under LL97: ' + subtofine +'</p>'
    //var elecp = getelecperc(props);
    BldgName.innerHTML = '<p>   ' + props.AD + '</p>';
    BldgShowInfo.innerHTML = '<p> Annual Penalties: </p>'+
    '<p> 2024-2029: ' + fine24 + '</p>' +
    '<p> 2030-2034: ' + fine30 + '</p>';
    //if(elecp!=0){
    //    bldgleft.innerHTML = '<p>Electric Use Rank:</p><p>' + elecp + ' percentile</p>';
    //}
    drawEnergyUseBarChart(props, 'bldgEnergyBarChart');
   // document.getElementById('bldgsrcphoto').src = "./imgs/bldgstockphoto.png";
    BldgPrimType.innerHTML = get_boro(props);
    drawFineSchedule(props, 'fineScheduleChart');
    document.getElementById('bldgsrcphoto').src = imgsrc;
    document.getElementById('BldgPhoto').style.display='inherit';
}

var info = L.control({position: 'bottomright'});
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    var proplabel = 'Property Use Type: ';
    var proptypelist = '';
    var elecmwh = 0;
    if(props){
        elecmwh = Math.round(props.EL/3412);
        for(i=0;i<3;i++){
            if(props.PU[i] != '0'){
                if(i>0){
                    proptypelist += ', '
                    proplabel = 'Property Use Types: ';
                }
                proptypelist += props.PU[i]
            }
        }
    }
    this._div.innerHTML = 
    (props ? '<h4> <b>' + props.AD  + '</b></h4><hr>'+
    '<p>Gross Floor Area: ' + numcomma(props.GFA) + ' ft<sup>2</sup></p>' +
    '<p>' + proplabel + proptypelist + '</p><hr>' +
    '<p>Annual Electricity Use: ' + numcomma(elecmwh) + ' MWh </p>' +
    '<p>Annual Natural Gas Use: ' + numcomma(props.NG/1000) + ' MMBtu </p>'
        : '<h4>' + 'Building Information Guide' + '</h4><hr>' +
        '<p> Hover over a building to view basic info. </p>' +
        '<p>Click on a building for detailed analysis.</p>');
    if(props){
        if(props.ST > 0){
            this._div.innerHTML += '<p>District Steam Use: ' + numcomma(props.ST/1000) + ' MMBtu</p>';
            this._div.innerHTML += '<p>Total GHG Emissions: ' + numcomma(props.GHG) + ' MTCO<sub>2</sub>e</p>';
        } else{
            this._div.innerHTML += '<p>Total GHG Emissions: ' + numcomma(props.GHG) + ' MTCO<sub>2</sub>e</p>';
        }
    }
};
info.addTo(map);

function highlightFeature(e) {
    e.target.setStyle({
        fillColor: 'red',
        stroke: false,
        opacity: 1,
        color: 'grey',
        dashArray: '',
        fillOpacity: .45
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
    var bnd = e.target.getBounds();
    var centerlat = (bnd._northEast.lat + bnd._southWest.lat)/2;
    var centerlng = (bnd._northEast.lng + bnd._southWest.lng)/2;
    bnd._northEast.lat = centerlat + .002;
    bnd._northEast.lng = centerlng + .002;
    bnd._southWest.lat = centerlat - .002;
    bnd._southWest.lng = centerlng - .002;
    map.fitBounds(bnd);
    populateDiv(e);
}
//sets event listeners for features
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

//bring in geojson data (from data.js)
var geojson = L.geoJson(data, 
            {style: style3,
             onEachFeature: onEachFeature
            }).addTo(map);
//Legend Inner Htmls:
var ghg_int_legend = "<center><i></i>kgCO<sub>2</sub>e/ft<sup>2</sup></center>" +
'<i style="background:#ffffd9"></i> 0 &ndash; 1<br><i style="background:#edf8b1">' +
'</i> 1 &ndash; 2<br><i style="background:#c7e9b4"></i> 2 &ndash; 3.5<br>' +
'<i style="background:#7fcdbb"></i> 3.5 &ndash; 5<br><i style="background:#41b6c4">' +
'</i> 5 &ndash; 7.5<br><i style="background:#1d91c0"></i> 7.5 &ndash; 10<br><i style="background:#225ea8">' +
'</i> 10 &ndash; 12<br><i style="background:#0c2c84"></i> 12+';
var ghg_legend = "<center><i>GHG:</i>MTCO<sub>2</sub>e</center>" +
'<i style="background:#ffffcc"></i> 0 &ndash; 100<br><i style="background:#ffeda0">' +
'</i> 100 &ndash; 500<br><i style="background:#fed976"></i> 500 &ndash; 1000<br>' +
'<i style="background:#feb24c"></i> 1000 &ndash; 2500<br><i style="background:#fd8d3c">' +
'</i> 2500 &ndash; 5000<br><i style="background:#fc4e2a"></i> 5000 &ndash; 7500<br><i style="background:#e31a1c">' +
'</i> 7500 &ndash; 10000<br><i style="background:#b10026"></i> 10000+';
var fine_legend = "<center><i></i>Total Penalty ($)</center>" +
'<i style="background:#bdbdbd"></i> No fine<br><i style="background:#f7cb44ff">' +
'</i> 0 &ndash; 50k<br><i style="background:#f68f46ff"></i> 50k &ndash; 250k<br>' +
'<i style="background:#cc6a70ff"></i> 250k &ndash; 500k<br><i style="background:#a65c85ff">' +
'</i> 500k &ndash; 1M<br><i style="background:#6b4596ff"></i> 1M &ndash; 5M<br><i style="background:#403891ff">' +
'</i> 5M &ndash; 10M<br><i style="background:#13306dff"></i> 10M+';
//Create Legend
var legend = L.control({position: 'bottomleft'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend')
    div.innerHTML += fine_legend;
    return div;
};
legend.addTo(map);

document.getElementById('closebuildingcontent').addEventListener('click',
function() {
    document.getElementById('buildingcontent').style.display = 'none';
    document.getElementById('scrollcontent').style.display = 'inherit';
});


//selectedMap Filter can be 0,1, or 2, for each filter button
document.getElementById('FINES').style.backgroundColor = '#88b18d';
var selectedMapFilter = 2;
//change legend and colors if GHG_TOTAL button is selected
document.getElementById('GHG_TOTAL').addEventListener('click',
function() {
    geojson.options.style = style;
    geojson.options.onEachFeature = onEachFeature;
    geojson.setStyle(style);
    legend._container.innerHTML = ghg_legend;
    document.getElementById('GHG_INT').style.backgroundColor = '#f1f1f1';
    document.getElementById('GHG_TOTAL').style.backgroundColor = '#88b18d';
    document.getElementById('FINES').style.backgroundColor = '#f1f1f1';
    selectedMapFilter = 0;
});
//change legend and color scheme if GHG_INT button is selected
document.getElementById('GHG_INT').addEventListener('click',
function() {
    geojson.options.style = style2;
    geojson.setStyle(style2);
    geojson.options.onEachFeature = onEachFeature2;
    legend._container.innerHTML = ghg_int_legend;
    document.getElementById('GHG_INT').style.backgroundColor = '#88b18d';
    document.getElementById('GHG_TOTAL').style.backgroundColor = '#f1f1f1';
    document.getElementById('FINES').style.backgroundColor = '#f1f1f1';
    selectedMapFilter = 1;
});

//change legend and color scheme if LL97 Fines button is selected
document.getElementById('FINES').addEventListener('click',
function() {
    geojson.options.style = style3;
    geojson.setStyle(style3);
    legend._container.innerHTML = fine_legend;
    document.getElementById('GHG_INT').style.backgroundColor = '#f1f1f1';
    document.getElementById('GHG_TOTAL').style.backgroundColor = '#f1f1f1';
    document.getElementById('FINES').style.backgroundColor = '#88b18d';
    selectedMapFilter = 2;
});

//Event listeners to highlight button when hovered over:
document.getElementById('GHG_TOTAL').addEventListener('mouseenter', function(){
    document.getElementById('GHG_TOTAL').style.backgroundColor = '#88b18d';
});
document.getElementById('GHG_TOTAL').addEventListener('mouseleave', function(){
    if(selectedMapFilter == 0){
        document.getElementById('GHG_TOTAL').style.backgroundColor = '#88b18d';
    } else {
    document.getElementById('GHG_TOTAL').style.backgroundColor = '#f1f1f1';
    }
});
document.getElementById('GHG_INT').addEventListener('mouseenter', function(){
    document.getElementById('GHG_INT').style.backgroundColor = '#88b18d';
});
document.getElementById('GHG_INT').addEventListener('mouseleave', function(){
    if(selectedMapFilter == 1){
        document.getElementById('GHG_INT').style.backgroundColor = '#88b18d';
    } else {
    document.getElementById('GHG_INT').style.backgroundColor = '#f1f1f1';
    }
});
document.getElementById('FINES').addEventListener('mouseenter', function(){
    document.getElementById('FINES').style.backgroundColor = '#88b18d';
});
document.getElementById('FINES').addEventListener('mouseleave', function(){
    if(selectedMapFilter == 2){
        document.getElementById('FINES').style.backgroundColor = '#88b18d';
    } else {
    document.getElementById('FINES').style.backgroundColor = '#f1f1f1';
    }
});

//collapsible animations
/*
var coll = document.getElementsByClassName("collapsible");
var col_iter;
for (col_iter = 0; col_iter < coll.length; col_iter++) {
    coll[col_iter].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight){
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}*/
//custom collapsibles:

//adjust the map size to window size
window.addEventListener('resize', function(){
    this.document.getElementById('mapid').style.width = window.innerWidth - 500 + 'px';
});
this.document.getElementById('mapid').style.width = window.innerWidth - 500 + 'px';

function adjust_content(e){
    var content = e.nextElementSibling;
    if(content.style.maxHeight)
        content.style.maxHeight = null;
    else
        content.style.maxHeight= content.scrollHeight + "px";
}
document.getElementById('cityEnergyBtn').addEventListener('click', function(){
    drawCityEnergyBarChart();
    adjust_content(this);
});
document.getElementById('cityPropBtn').addEventListener('click', function(){
    drawCityPropTypeChart();
    adjust_content(this);
});
bldg_btns = ['info_btn','energy_btn','ll97_btn'];
for(var i=0; i<3; i++){
    document.getElementById(bldg_btns[i]).addEventListener('click', function(){
        adjust_content(this);
    });
}

//close button click event for welcome popup
document.getElementById('closewelcome').addEventListener('click',
function() {
    document.getElementById('welcomepop').style.display = 'none';
});
//allow for html to make links to data page from welcome
function clickdata(){
    document.getElementById('welcomepop').style.display = 'none';
    document.getElementById('datapop').style.display = 'flex';
}
//embed html function when clicking page title
function clickwelcome(){
    document.getElementById('welcomepop').style.display = 'flex';
}
//click event for policy page
document.getElementById('policypage').addEventListener('click',
function() {
    document.getElementById('policypop').style.display = 'flex';
});
document.getElementById('closepolicy').addEventListener('click',
function() {
    document.getElementById('policypop').style.display = 'none';
});
//click event for data page
document.getElementById('datapage').addEventListener('click',
function() {
    document.getElementById('datapop').style.display = 'flex';
});
document.getElementById('closedata').addEventListener('click',
function() {
    document.getElementById('datapop').style.display = 'none';
});
//click event for about page
document.getElementById('aboutpage').addEventListener('click',
function() {
    document.getElementById('aboutpop').style.display = 'flex';
});
document.getElementById('closeabout').addEventListener('click',
function() {
    document.getElementById('aboutpop').style.display = 'none';
});
