onconnect = function pong(e) {
    let port = e.ports[0];
    port.onmessage = function(e) {
        port.postMessage(0);
    }
}
