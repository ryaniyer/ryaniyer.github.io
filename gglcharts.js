function numcomma(x) {
  y = parseInt(x)
  return y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

//instance variables for CO2 emissions and fine calculations
let fine2429 = [0, .01074, .00846, .00758, .01138, .00574, .02381, .01181, .00987, .00675, .00426];
let fine3034 = [0, .00420, .00453, .00344, .00598, .00167, .01193, .00403, .00526, .00407, .00110];
let fo2r =  0.00007421; //fuel oil 2 kbtu to tco2e rate
let fo4r =  0.00007529; //fuel oil 4 kbtu to tco2e rate
let fo56r = 0.00007293; //fuel oil 5/6 kbtu to tco2e rate
let ngr =  0.00005311; //natural gas kbtu to tco2e rate
let elecr = 0.000288962/3.412; //kBtu to tCO2e rate (using kWh-tCo2e rate)
let steamr =  0.00004493; //steam kbtu to tco2e rate
//Create Fine Calculations Based on Property Types:
function get_ghg_limit(props, finelist){
    var ghglimit = 0;
    for(i=0; i<3; i++){
        index = parseInt(props.UG[i]);
        if(index>0){ghglimit += finelist[index]*props.PUG[i];}
    }
    return ghglimit;
};
function get_tot_ghg(p){
    var tot = fo2r*p.F2 + fo4r*p.F4 + fo56r*p.F5 + steamr*p.ST + ngr*p.NG + elecr*p.EL;
    return tot;
}
function get_fine(lim, ghg){
    if(ghg > lim)
        return '$' + numcomma(parseInt((ghg - lim)*268));
    else
        return 'Not subject to fine'
}
function get_fine_numerical(lim, ghg){
    if(ghg > lim)
        return parseInt((ghg - lim)*268);
    else
        return 0;
}

//Google Charts API for interactiive data visualizations
google.charts.load('current', {'packages':['corechart', 'bar']});
google.charts.setOnLoadCallback(drawCityEnergyBarChart);

function drawEnergyUseBarChart(p, div_id){
    var elec = parseInt(p.EL);
    var ng = parseInt(p.NG);
    var steam = parseInt(p.ST);
    var fueloil = parseInt((p.F2 + p.F4 + p.F5));
    var foemit = parseInt(fo2r*p.F2 + fo4r*p.F4 + fo56r*p.F5)
    var data = google.visualization.arrayToDataTable([
        ['', 'MMBtu', 'MTCO2e'],['Electricity',    elec/1000, elec*elecr],
        ['Natural Gas ',   ng/1000, ng*ngr],['District Steam', steam/1000, steam*steamr],
        ['Fuel Oil', fueloil/1000, foemit]]);
    if(fueloil <= 500000 && (steam<0 || steam>500000)){
        data = google.visualization.arrayToDataTable([
            ['', 'MMBtu', 'MTCO2e'],['Electricity',    elec/1000, elec*elecr],
            ['Natural Gas ',   ng/1000, ng*ngr],['District Steam', steam/1000, steam*steamr]]);
    }else if((steam<=500000 && steam>=0) && fueloil > 500000){
        data = google.visualization.arrayToDataTable([
            ['', 'MMBtu', 'MTCO2e'],['Electricity',    elec/1000, elec*elecr],
            ['Natural Gas ',   ng/1000, ng*ngr],['Fuel Oil', fueloil/1000, foemit]]);
    } else if((steam<=500000 && steam>=0) && fueloil <= 500000){
        data = google.visualization.arrayToDataTable([
            ['', 'MMBtu', 'MTCO2e'],['Electricity',    elec/1000, elec*elecr],
            ['Natural Gas ',   ng/1000, ng*ngr]]);
    };
    var options = {
        bars: 'horizontal',colors: ['#225ea8', '#c7e9b4', '#ec8f6e', '#f3b49f', '#f6c7b6'],is3D: true,
        series: {0: { axis: 'energy' },1: { axis: 'emissions' }},
        axes: {x: {energy: {label: 'MMBtu'},emissions: {side: 'top', label: 'MTCO2e'}}}};
    var chart = new google.charts.Bar(document.getElementById(div_id));
    chart.draw(data, options);
};

function drawFineSchedule(p, div_id){
    var cureui = 1000*get_tot_ghg(p)/p.GFA;
    var lim24eui = 1000*get_ghg_limit(p, fine2429)/p.GFA;
    var lim30eui = 1000*get_ghg_limit(p, fine3034)/p.GFA;
    var data = google.visualization.arrayToDataTable([
        ['', 'Current GHG', '2024 Limit', '2030 Limit'],
        ['kgCO2e/sqft', cureui, lim24eui, lim30eui]]);
    var options = {
        //bars: 'horizontal',
        legend: { position: 'top'},
        colors: ['#225ea8', '#c7e9b4', '#ec8f6e', '#f3b49f', '#f6c7b6'],
        vAxis: {title: 'kgCO2e/sqft'}};
    var chart = new google.charts.Bar(document.getElementById(div_id));
    chart.draw(data, options);
};

function drawCityEnergyBarChart(){
    var data = google.visualization.arrayToDataTable([
        ['', 'MMBtu', 'MTCO2e'],['Electricity',   109675604, 109675604*elecr*1000],
        ['Natural Gas ',   237098804, 237098804*ngr*1000],['District Steam', 26143284, 26143284*steamr*1000],
        ['Fuel Oil', 25745719, 1919*1000]]);
    var options = {
        bars: 'horizontal',
        colors: ['#225ea8', '#c7e9b4', '#ec8f6e', '#f3b49f', '#f6c7b6'],
        series: {0: { axis: 'energy' },1: { axis: 'emissions' }},
        axes: {x: {energy: {label: 'MMBtu'},emissions: {side: 'top', label: 'MTCO2e'}}}};
    var chart = new google.charts.Bar(document.getElementById('cityEnergyBarChart'));
    chart.draw(data, options);
};
function drawCityPropTypeChart(){
    var data = google.visualization.arrayToDataTable([
        ['Property Type', 'Count'],
        ['Multifamily Housing', 1569193145],
        ['Office',   465749205],
        ['K-12 School', 170831772],
        ['Other', 67400889+488829083]
    ]);
    var options = {
        colors: ['#225ea8', '#c7e9b4', '#ec8f6e', '#f3b49f', '#f6c7b6'],
        pieHole: 0.6,
        pieSliceText: 'none',
    };
    var chart = new google.visualization.PieChart(document.getElementById('cityPropTypeLineChart'));
    chart.draw(data, options);
}

bldg_name_dict = {"Adult Education":"Adult Education Center","Ambulatory Surgical Center":"Ambulatory Surgical Center","Automobile Dealership":"Automobile Dealership","Bank Branch":"Bank Branch","Bar/Nightclub":"Bar/Nightclub","Bowling Alley":"Bowling Alley","College/University":"University","Convenience Store without Gas Station":"Convenience Store","Courthouse":"Courthouse","Data Center":"Courthouse","Distribution Center":"Distribution Center","Enclosed Mall":"Enclosed Mall","Fast Food Restaurant":"Fast Food Restaurant","Financial Office":"Financial Office","Fire Station":"Fire Station","Fitness Center/Health Club/Gym":"Fitness Center","Food Sales":"Food Sales Facility","Food Service":"Food Service Facility","Hospital (General Medical & Surgical)":"Hospital","Hotel":"Hotel","Ice/Curling Rink":"Ice/Curling Rink","K-12 School":"K-12 School","Laboratory":"Laboratory","Library":"Library","Lifestyle Center":"Lifestyle Center","Mailing Center/Post Office":"Mailing Center/Post Office","Manufacturing/Industrial Plant":"Manufacturing/Industrial Plant","Medical Office":"Medical Office","Movie Theater":"Movie Theater","Multifamily Housing":"Multifamily Housing","Museum":"Museum","Non-Refrigerated Warehouse":"Non-Refrigerated Warehouse","Office":"Office building","Other":"Mixed-Use Property","Other - Education":"Educational Facility","Other - Entertainment/Public Assembly":"Public Assembly Facility","Other - Lodging/Residential":"Residential Facility","Other - Mall":"Mall","Other - Public Services":"Public Services Facility","Other - Recreation":"Recreational Facility","Other - Restaurant/Bar":"Restaurant","Other - Services":"Mixed-Use Property","Other - Specialty Hospital":"Specialty Hospital","Other - Technology/Science":"Technology/Science Center","Other - Utility":"Utility-owned property","Outpatient Rehabilitation/Physical Therapy":"Outpatient Rehabilitation Facility","Parking":"Parking","Performing Arts":"Performing Arts","Personal Services (Health/Beauty, Dry Cleaning, etc.)":"Personal Services Facility","Police Station":"Police Station","Pre-school/Daycare":"Pre-school/Daycare","Prison/Incarceration":"Prison/Incarceration","Refrigerated Warehouse":"Refrigerated Warehouse","Repair Services (Vehicle, Shoe, Locksmith, etc.)":"Repair Services Facility","Residence Hall/Dormitory":"Residence Hall","Residential Care Facility":"Residential Care Facility","Restaurant":"Restaurant","Retail Store":"Retail Store","Self-Storage Facility":"Self-Storage Facility","Senior Care Community":"Senior Care Community","Single Family Home":"Single Family Home","Social/Meeting Hall":"Social/Meeting Hall","Strip Mall":"Strip Mall","Supermarket/Grocery Store":"Supermarket/Grocery Store","Swimming Pool":"Swimming Pool","Transportation Terminal/Station":"Transportation Terminal/Station","Urgent Care/Clinic/Other Outpatient":"Urgent Care/Clinic/Other Outpatient","Veterinary Office":"Veterinary Office","Vocational School":"Vocational School","Wastewater Treatment Plant":"Wastewater Treatment Plant","Wholesale Club/Supercenter":"Wholesale Club/Supercenter","Worship Facility":"Worship Facility","Zoo":"Zoo"}
function get_boro(props){
    var b = props.BBL.toString().charAt(0);
    var p = props.PU[0];
    var output = bldg_name_dict[p]
    if(b == '1')
        return output + ' in Mahattan';
    else if(b=='2')
        return output + ' in the Bronx';
    else if(b=='3')
        return output + ' in Brooklyn';
    else if(b=='4')
        return output + ' in Queens';
    else if(b=='5')
        return output + ' in Staten Island';
}

let elecperc = [0,2.52,4.45,6.61,7.93,8.66,9.19,9.62,10.02,10.37,10.67,10.93,11.19,11.42,11.62,11.81,12.02,12.23,12.4,12.58,12.76,12.95,13.1,13.3,13.48,13.65,13.83,14.0,14.18,14.34,14.52,14.69,14.84,15.03,15.23,15.42,15.6,15.8,15.98,16.18,16.39,16.6,16.81,17.04,17.23,17.48,17.73,17.96,18.2,18.47,18.75,19.02,19.3,19.64,19.97,20.32,20.67,21.08,21.5,21.89,22.37,22.76,23.28,23.84,24.41,24.97,25.51,26.2,26.78,27.48,28.26,29.14,29.94,30.84,31.75,32.76,33.7,34.76,35.77,36.9,38.1,39.32,40.77,42.02,43.45,44.86,46.5,47.65,49.65,51.57,53.73,56.23,59.06,61.73,65.48,69.92,75.61,84.47,97.62,122.3];
function getelecperc(props){
    var el = parseInt(props.EL)/parseInt(props.GFA);
    console.log(el)
    if(el<=0){return 0};
    var perc = 0;
    for(i=0;i<100;i++){
        if(el<elecperc[i+1] && el>elecperc[i]){
            perc = i+1;
            break;
        }
    }
    if(perc==0){return '99th'}
    else if(perc%10==1){return perc.toString() + 'st'}
    else if(perc%10==2){return perc.toString() + 'nd'}
    else if(perc%10==3){return perc.toString() + 'rd'}
    else {return perc.toString() + 'th'}
};