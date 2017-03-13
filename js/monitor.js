// Author: Pepe Vila
// Date: 2016/04/05
// Special thanks to http://blog.scottlogic.com/2014/09/19/interactive.html
//
// TODO:
//  - redudant information using lines, change to rectangles of fix length?
//  - big delays "break" the zoom state
//  - minimap is compressed, but for long monitorizations still breaks :S

function drawMonitor (data, id) {

    var DEF_RENDER_SIZE = 500,
        MAX_SIZE = 1000;

    var xMin = d3.min(data, function(d) { return d.time; }),
        xMax = d3.max(data, function(d) { return d.time; }),
        yMin = d3.min(data, function(d) { return d.delay; }),
        yMax = d3.max(data, function(d) { return d.delay; });

    var dataToRender = data.slice(0, DEF_RENDER_SIZE);

    /* MAIN CHART */
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Define chart where we draw
    var plotChart = d3.select(id).classed("chart", true).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // xScale and yScale map the values to the plot
    var xScale = d3.scale.linear()
            .domain(d3.extent(dataToRender, function(d) { return d.time; }))
            .range([0, width]),
        yScale = d3.scale.log()
            .domain([yMin, yMax])
            .range([height, 0]);

    // Define axis
    var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(10)
            .tickFormat(function(d) { return d.toFixed(3); }),
        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(10)
            .tickSize(-width, 0)
            .tickFormat(function(d) { return d.toFixed(2); });

    // Draw X axis
    plotChart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Draw Y axis
    plotChart.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("time (ms)");
    
    // Draw main chart (after axis to be paint on top)
    var plotArea = plotChart.append("g")
            .attr("clip-path", "url(#plotAreaClip)");

    plotArea.append("clipPath")
        .attr("id", "plotAreaClip")
        .append("rect")
        .attr({width: width, height: height});

    // Define line that we're going to shaw
    var line = d3.svg.line()
            .x(function(d, i) { return xScale(d.time); })
            .y(function(d, i) { return yScale(d.delay); });

    // Draw it
    var dataLine = plotArea.append("path")
        .attr("class", "line")
        .attr("d", line(dataToRender));

    /* LOWER CHART */
    var mapData = summarize(data);

    var navWidth = width,
        navHeight = 100 - margin.top - margin.bottom;

    // Define chart where we draw
    var navChart = d3.select(id).classed("chart", true).append("svg")
            .classed("navigator", true)
            .attr("width", navWidth + margin.left + margin.right)
            .attr("height", navHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scales dor X and Y
    var navXScale = d3.scale.linear()
            .domain([xMin, xMax])
            .range([0, navWidth]),
        navYScale = d3.scale.log()
            .domain([yMin, yMax])
            .range([navHeight, 0]);

    // Define X axis
    var navXAxis = d3.svg.axis()
            .scale(navXScale)
            .orient("bottom");

    // Draw axis
    navChart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + navHeight + ")")
        .call(navXAxis);

    // Define area
    var navData = d3.svg.area()
            .x(function(d) { return navXScale(d.time); })
            .y0(navHeight)
            .y1(function(d) { return navYScale(d.delay); });

    // Define line
    var navLine = d3.svg.line()
            .x(function(d) { return navXScale(d.time); })
            .y(function(d) { return navYScale(d.delay); });

    // Draw area
    navChart.append("path")
        .attr("class", "data")
        .attr("d", navData(mapData));

    // Draw line
    navChart.append("path")
        .attr("class", "line")
        .attr("d", navLine(mapData));

    /* VIEWPORT O THE LOW CHART */
    var viewport = d3.svg.brush()
            .x(navXScale)
            .on("brush", function() {
                var l = viewport.extent()[0], r = viewport.extent()[1];

                var max = (navXScale.domain()[1]-navXScale.domain()[0])/data.length * MAX_SIZE,
                    min = max / 6;

                if (!viewport.empty() && (r-l <= max)) {
                    xScale.domain(viewport.extent());
                } else if (r-l > max) {
                    xScale.domain([l,l+max]);
                } else {
                    xScale.domain([l-min/2,l+min/2]);
                }
                redrawChart();
                updateViewportLegend();
                updateViewportFromChart();
            });

    // Add viewport to detect events on the whole chart
    navChart.append("g")
        .attr("class", "viewport")
        .call(viewport)
        .selectAll("rect")
        .attr("height", navHeight);

    /* ZOOMING AND PANNING */
    var zoom = d3.behavior.zoom()
            .x(xScale)
            .on("zoom", function() {
                var dom = xScale.domain();
                if (dom[0] < xMin) {
                    var x = zoom.translate()[0] - xScale(xMin) + xScale.range()[0];
                    zoom.translate([x, 0]);
                } else if (dom[1] > xMax) {
                    var x = zoom.translate()[0] - xScale(xMax) + xScale.range()[1];
                    zoom.translate([x, 0]);
                } 
                redrawChart();
                updateViewportFromChart();
                updateViewportLegend();
            });

    // Invisible overlay for capturing the zoom event
    var overlay = d3.svg.area()
            .x(function(d) { return xScale(d.time); })
            .y0(0)
            .y1(height);

    plotArea.append("path")
        .attr("class", "overlay")
        .attr("d", overlay(dataToRender))
        .call(zoom);

    viewport.on("brushend", function() {
        updateZoomFromChart();
    });

    /* LEGEND */
    var legWidth = width /4,
            legHeight = 100 - margin.top - margin.bottom;

    var legend = d3.select(id).append("div")
            .classed("legend", true);

    var qrTotal = quartiles(data),
        qrViewport = quartiles(dataToRender, true);

    legend.selectAll("p").data(Object.keys(qrTotal)).enter().append("p")
        .classed("row", true)
        .attr("id", function(d) { return d; })
        .html(function(d) { return "<label>" + d
            + "</label> <span class=\"viewport\">" + ""
            + "</span> <span class=\"total\">" + parseFloat(qrTotal[d]).toFixed(3)
            + "</span>"; });

    /* INIT STATE */
    redrawChart();
    updateViewportFromChart();
    updateZoomFromChart();
    updateViewportLegend();

    /* AUX FUNCTIONS */

    // Aux function for searching index where to split the real data and avoid rendering to much nodes
    function indexOfObjects(arr, key, val, from, to) {
        var f = from || 1, t = to || arr.length-1; // +-1 for avoid undefined in zoom-out
        for (var i=f; i<t; i++) {
            if (arr[i][key] <= val && arr[i+1][key] >= val) return i;
        }
        return -1;
    }

    // Redraw plotChart data and X axis
    // TODO: large delays distorsion the big graphic (just one tick use a lot of space)
    // Maybe using rects of fix size makes more sense? the width is redundant here
    function redrawChart() {
        var from = indexOfObjects(data, "time", xScale.domain()[0]),
            to = indexOfObjects(data, "time", xScale.domain()[1], from+1)
        if (from == -1) from = 0;
        if (to == -1)  to = data.length;
        dataToRender = data.slice(from, to); // update global dataToRender object
        xScale.domain(d3.extent(dataToRender, function(d) { return d.time; }))
        dataLine.attr("d", line(dataToRender));
        plotChart.select(".x.axis").call(xAxis);
    }

    // Aux function for updating viewport after wheel zoom
    function updateViewportFromChart() {
        if ((xScale.domain()[0] <= xMin) && (xScale.domain()[1] >= xMax)) {
            viewport.clear();
        } else {
            viewport.extent(xScale.domain());
        }
        navChart.select(".viewport").call(viewport);
    }

    var fullDomain;

    // Aux function for update zoom
    function updateZoomFromChart() {
        zoom.x(xScale);
        var currentDomain = xScale.domain()[1] - xScale.domain()[0];

        if (!fullDomain) {
            fullDomain = (xMax-xMin)/data.length * MAX_SIZE;
        }

        var minScale = currentDomain / fullDomain,
            maxScale = minScale * 10;

        zoom.scaleExtent([minScale, maxScale]);
    }

    // Aux function to update legend
    function updateViewportLegend() {
        qrViewport = quartiles(dataToRender, true);

        legend.selectAll("span.viewport").data(qrViewport)
            .html(function(d) { return parseFloat(d).toFixed(3); });
    }

    // Calc median
    function median(x) {
        var n = x.length/2;

        if (x.length == 0) return null;
        if (x.length == 1) return x[0];

        if (x.length & 0x1) {
            return x[n|0].delay;
        } else {
            return (x[n|0].delay+x[(n|0)-1].delay)/2;
        }
    }

    // Return Q information
    function quartiles(data, asArray) {
        var d = data.slice(0); // clone data
        var result = {median:0,q1:0,q3:0,iqr:0};
        d.sort(function(a,b){return a.delay-b.delay});
        if (d[0] == 6) d.pop(); // remove keyup cheat
        result.median = median(d);
        result.q1 = median(d.slice(0,d.length/2|0));
        result.q3 = median(d.slice((d.length/2|0)+(d.length&0x1?1:0),d.length));
        result.iqr = result.q3-result.q1;
        result.max = d[d.length-1].delay;
        result.min = d[0].delay;

        if (asArray) {
            return [result.median, result.q1, result.q3, result.iqr, result.max, result.min];
        }

        return result;
    }
    
    // Function to summarize the raw data
    // store all consecutive values in MEDIAN+-IQR in one
    function summarize(raw) {

        var i, buff, tmp, res;

        if (!qrTotal) {
            qrTotal = quartiles(data);
        }

        res = [];
        buff = []; 

        for (i=0; i<data.length; i++) {
            buff.push(data[i]);
            if (data[i].delay > qrTotal.q3) {
                tmp = {};
                if (buff.length > 1) {
                    tmp.delay = buff[0].delay;
                    tmp.time = buff[buff.length-1].time;
                    res.push(tmp);
                    buff = [];
                }
                res.push(data[i]);
            }
        }

        console.log("Minimap compression rate: " + (res.length/data.length).toFixed(2)*100 + "%");
        return res;
    }
}
 
