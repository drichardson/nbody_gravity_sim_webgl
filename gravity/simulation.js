// Gravity simulator + web worker (because it's easier if I have them both
// in one file).

//
// Simulation
//
var simulator = (function() {
'use strict';
var sim = {};

var G = 6.67384e-11;
var Fg = function(m1, m2, r) {
    return G * m1 * m2 / (r * r);
}

sim.create = function() {
    var o = {};
    o.objects = [
        { name: "Earth", mass: 5.972E24, x: 0, y: 0, vx: 0, vy: 0, rgb: [0,1,0] },
        { name: "1kg", mass: 1, x: 0, y: 20, vx: 0, vy: 0, rgb: [1,0,0] }
    ];
    o.time = 0;
    o.timescale = 1;

    o.update = function() {

        // Visit all pairs of objects, calculating the equal but
        // opposing forces for each pair.
        // For example, if you have objects a, b, c, and d they'd be
        // visited in pairs: ab, ac, ad, bc, bd, cd
        var num_objects = o.objects.length;
        for(var i = 0; i < num_objects - 1; ++i) {
            for(var j = i+1; j < num_objects; ++j) {
                if (i == j) continue;
            }
        }

        o.time += o.timescale;
    }

    return o;
}

return sim;

})();


//
// Web Worker
//
var worker = (function() {
'use strict';

var o = {};
var timerHandle;
var sim;

function intervalCallback() {
    sim.update();
    postMessage({ command: "updated", objects: sim.objects });
}

o.stop = function() {
    if (timerHandle) {
        clearInterval(timerHandle);
        timerHandle = null;
    }
}

o.start = function(interval) {
    o.stop();
    sim = simulator.create();
    intervalCallback();
    //console.log("Starting with interval " + interval);
    timerHandle = setInterval(intervalCallback, interval);
}

return o;
})();

onmessage = function(e) {
    'use strict';
    var msg = e.data;
    var command = msg.command;
    //console.log("simulation.js onmessage command = " + command);
    if (command == "stop") {
        worker.stop();
    } else if (command == "start") {
        worker.start(msg.updateInterval);
    }
}

