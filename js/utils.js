function median(trace) {
    var n = trace.length/2;

    if (trace.length == 0) return null;
    if (trace.length == 1) return trace[0];

    if (trace.length & 0x1) {
        return trace[n|0].delay;
    } else {
        return (trace[n|0].delay+trace[(n|0)-1].delay)/2;
    }
}

function quartiles(data) {
    var d = data.slice(0); // clone data
    var result = {median:0,q1:0,q3:0,iqr:0};

    d.sort(function(a,b){return a.delay-b.delay});
    result.median = median(d);
    result.q1 = median(d.slice(0,d.length/2|0));
    result.q3 = median(d.slice((d.length/2|0)+(d.length&0x1?1:0),d.length));
    result.iqr = result.q3-result.q1;
    result.max = d[d.length-1].delay;
    result.min = d[0].delay;
    return result;
}
