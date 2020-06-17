

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);
google.charts.setOnLoadCallback(drawLineChart);

function drawChart() {

var data = google.visualization.arrayToDataTable([
    ['Energy Source', 'Hours per Day'],
    ['Electricity',     11],
    ['Natural Gas ',      2]
]);

var options = {
    is3D: true,
    colors: ['#225ea8', '#c7e9b4', '#ec8f6e', '#f3b49f', '#f6c7b6']
};

var chart = new google.visualization.PieChart(document.getElementById('piechart'));
var chart2 = new google.visualization.PieChart(document.getElementById('piechart2'));

chart.draw(data, options);
chart2.draw(data, options);
}

function drawLineChart() {
    var data = google.visualization.arrayToDataTable([
      ['Year', 'Emissions', 'Penalty'],
      ['2004',  1000,      400],
      ['2005',  1170,      460],
      ['2006',  660,       1120],
      ['2007',  1030,      540]
    ]);

    var options = {
      title: 'Building GHG Capacity Limit',
      curveType: 'function',
      legend: { position: 'bottom' },
      is3D: true,
      colors: ['#225ea8', '#c7e9b4', '#ec8f6e', '#f3b49f', '#f6c7b6']
    };

    var mychart = new google.visualization.LineChart(document.getElementById('curvechart'));

    mychart.draw(data, options);
  }