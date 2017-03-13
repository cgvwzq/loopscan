d3.VirtualScroller = function () {
    var enter = null,
        update = null,
        exit = null,
        data = [],
        dataid = null,
        svg = null,
        viewport = null,
        totalColumns = 0,
        position = 0,
        columnWidth = 24,
        totalWidth = 0,
        minWidth = 0,
        viewportWidth = 0,
        visibleColumns = 0,
        delta = 0,
        dispatch = d3.dispatch("pageDown", "pageUp");

    function virtualscroller(container) {
        function render(resize) {
            if (resize) {                                                                      // re-calculate height of viewport and # of visible row
                viewportWidth = parseInt(viewport.style("width"));
                visibleColumns = Math.ceil(viewportWidth / columnWidth) + 1;                       // add 1 more row for extra overlap; avoids visible add/remove at top/bottom 
            }
            var scrollTop = viewport.node().scrollLeft;
            totalWidth = Math.max(minWidth, (totalColumns * columnWidth));
            svg.style("width", totalWidth + "px")                                            // both style and attr height values seem to be respected
                .attr("width", totalWidth)                                  
                .attr("height", "300px");
            var lastPosition = position;
            position = Math.floor(scrollTop / columnWidth);
            delta = position - lastPosition;
            scrollRenderFrame(position);
        }

        function scrollRenderFrame(scrollPosition) {
            container.attr("transform", "translate(" + (scrollPosition * columnWidth) + ",0)");   // position viewport to stay visible
            var position0 = Math.max(0, Math.min(scrollPosition, totalColumns - visibleColumns + 1)), // calculate positioning (use + 1 to offset 0 position vs totalRow count diff) 
                position1 = position0 + visibleColumns;

            container.each(function () {                                                         // slice out visible rows from data and display
                var rowSelection = container.selectAll(".column")
                    .data(data.slice(position0, Math.min(position1, totalColumns)), dataid);
                rowSelection.exit().call(exit).remove();
                rowSelection.enter().append("g")
                    .attr("class", "column")
                    .call(enter);
                rowSelection.order();
                var rowUpdateSelection = container.selectAll(".column:not(.transitioning)");       // do not position .transitioning elements
                rowUpdateSelection.call(update);
                rowUpdateSelection.each(function (d, i) {
                    d3.select(this).attr("transform", function (d) {
                        return "translate(" + ((i * columnWidth)) + ",0)";
                    });
                });
            });

            if (position1 > (data.length - visibleColumns)) {                                      // dispatch events 
                dispatch.pageDown({
                    delta: delta
                });
            } else if (position0 < visibleColumns) {
                dispatch.pageUp({
                    delta: delta
                });
            }
        }

        virtualscroller.render = render;                                                        // make render function publicly visible 
        viewport.on("scroll.virtualscroller", render);                                          // call render on scrolling event
        render(true);                                                                           // call render() to start
    }

    virtualscroller.render = function (resize) {                                                 // placeholder function that is overridden at runtime
    };

    virtualscroller.data = function (_, __) {
        if (!arguments.length) return data;
        data = _;
        dataid = __;
        return virtualscroller;
    };

    virtualscroller.dataid = function (_) {
        if (!arguments.length) return dataid;
        dataid = _;
        return virtualscroller;
    };

    virtualscroller.enter = function (_) {
        if (!arguments.length) return enter;
        enter = _;
        return virtualscroller;
    };

    virtualscroller.update = function (_) {
        if (!arguments.length) return update;
        update = _;
        return virtualscroller;
    };

    virtualscroller.exit = function (_) {
        if (!arguments.length) return exit;
        exit = _;
        return virtualscroller;
    };

    virtualscroller.totalColumns = function (_) {
        if (!arguments.length) return totalColumns;
        totalColumns = _;
        return virtualscroller;
    };

    virtualscroller.columnWidth = function (_) {
        if (!arguments.length) return columnWidth;
        columnWidth = +_;
        return virtualscroller;
    };

    virtualscroller.totalWidth = function (_) {
        if (!arguments.length) return totalWidth;
        totalWidth = +_;
        return virtualscroller;
    };

    virtualscroller.minWidth = function (_) {
        if (!arguments.length) return minWidth;
        minWidth = +_;
        return virtualscroller;
    };

    virtualscroller.position = function (_) {
        if (!arguments.length) return position;
        position = +_;
        if (viewport) {
            viewport.node().scrollTop = position;
        }
        return virtualscroller;
    };

    virtualscroller.svg = function (_) {
        if (!arguments.length) return svg;
        svg = _;
        return virtualscroller;
    };

    virtualscroller.viewport = function (_) {
        if (!arguments.length) return viewport;
        viewport = _;
        return virtualscroller;
    };

    virtualscroller.delta = function () {
        return delta;
    };

    d3.rebind(virtualscroller, dispatch, "on");

    return virtualscroller;
};