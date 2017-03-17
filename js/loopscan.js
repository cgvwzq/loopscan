// Global state vars
var i, buffer, _auxWorker, _auxCb, _auxTimer;

const SZ = 200000; // Pre-allocated elements

function save(t) {
    if (i < buffer.length) buffer[i++] = t;
}

const EventLoops = {

    renderer_mt : {
        name : "Renderer's Main Thread (with postMessage)",
        loop : function loop(e) {
            save(e.timeStamp);
            self.postMessage(0, '*');
        },
        start : function start() {
            i = 0;
            buffer = new Float64Array(SZ);
            self.onmessage = this.loop;
            self.postMessage(0, '*');
        },
        stop : function stop() {
            self.onmessage = null;
            return buffer;
        }

    },

    renderer_mt_timeout : {
        name : "Renderer's Main Thread (with timers)",
        loop : function loop() {
            save(performance.now());
        },
        start : function start() {
            i = 0;
            buffer = new Float64Array(SZ);
            _auxTimer = setInterval(this.loop, 0);
        },
        stop : function stop() {
            clearInterval(_auxTimer);
            return buffer;
        }
    },

    host_io_net : {
        name : "Host's I/O Thread (with fetch requests)",
        loop : function loop(e) {
            save(performance.now());
            fetch('//1').catch(_auxCb);
        },
        start : function start() {
            i = 0;
            buffer = new Float64Array(SZ);
            _auxCb = this.loop;
            this.loop();
        },
        stop : function stop() {
            _auxCb = null;
            return buffer;
        }
    },

    host_io_sw : {
        name : "Host's I/O Thread (with workers)",
        loop : function loop(e) {
            save(e.timeStamp);
            e.target.postMessage(0);

        },
        start : function start() {
            i = 0;
            buffer = new Float64Array(SZ);
            _auxWorker = new SharedWorker("js/pong.js");
            _auxWorker.port.onmessage = this.loop;
            _auxWorker.port.postMessage(0);
        },
        stop : function stop() {
            _auxWorker.port.close();
            _auxWorker.port.onmessage = null;
            _auxWorker = null;
            return buffer;
        }
    },

};
