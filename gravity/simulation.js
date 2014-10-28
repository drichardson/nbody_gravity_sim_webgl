// Gravity simulator + web worker (because it's easier if I have them both
// in one file).

//
// Simulation
//
var simulator = (function() {
'use strict';
var sim = {};

var G = 6.67384e-11;
function Fg(m1, m2, r) {
    return G * m1 * m2 / (r * r);
}

function distance(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function Fcomponents(F, p1, p2) {
    var r = distance(p2, p1);
    var Fx = F * (p2.x - p1.x) / r;
    var Fy = F * (p2.y - p1.y) / r;
    return { Fx: Fx, Fy: Fy };
}

sim.create = function() {
    var that = {};
    that.objects = [
        { name: "Earth", mass: 5.9726e24, r: 6378100, x: 149600000e3, y: 0, vx: 0, vy: -108000e3 / 3600, rgb: [0,0,1] },
        { name: "Moon", mass: 0.07342e24, r: 1738100, x: 149600000e3+378000e3, y: 0, vx: 0, vy: -108000e3/3600 -1.022e3, rgb: [0.5,0.5,0.5] },
        { name: "Sun", mass: 1.989E30, r: 696000e3, x: 0, y: 0, vx: 0, vy: 0, rgb: [1,1,0] },
        { name: "Mercury", mass: 328.5E21, r: 2440e3, x: 57910000e3, y: 0, vx: 0, vy: -47360, rgb: [238/256,203/256,173/256] },
        { name: "Venus", mass: 4.867E24, r: 6052e3, x: 108200000e3, y: 0, vx: 0, vy: -35020, rgb: [0.8, 0.2, 0.2] },
        { name: "Mars", mass: 639E21, r: 3390e3, x: 227900000e3, y: 0, vx: 0, vy: -24070, rgb: [1, 0, 0] }
        //{ name: "c", mass: 1e11, x: -10, y: 30, vx: -5, vy: -2, rgb: [1,0,0] },
        //{ name: "d", mass: 1e10, x: -40, y: -30, vx: -5, vy: -2, rgb: [0,0,1] },
        //{ name: "e", mass: 1e13, x: 40, y: 0, vx: 0, vy: 0, rgb: [0,1,1] },
    ];
    that.simulationTime = 0;
    that.simulationSecondsPerUpdate = 1;

    that.update = function() {
        // Visit all pairs of objects, calculating the equal but
        // opposing forces for each pair.
        // For example, if you have objects a, b, c, and d they'd be
        // visited in pairs: ab, ac, ad, bc, bd, cd
        var objs = that.objects;
        var numObjects = objs.length;
        for(var i = 0; i < numObjects - 1; ++i) {
            var oi = objs[i];
            for(var j = i+1; j < numObjects; ++j) {
                if (i == j) continue;
                var oj = objs[j];
                var r = distance(oi, oj);
                var F = Fg(oi.mass, oj.mass, r);
                var Fcomps = Fcomponents(F, oi, oj);
                // F = ma <=> F/m = a
                var axi = Fcomps.Fx / oi.mass;
                var ayi = Fcomps.Fy / oi.mass;
                var axj = -Fcomps.Fx / oj.mass;
                var ayj = -Fcomps.Fy / oj.mass;
                // update velocities
                oi.vx += axi * that.simulationSecondsPerUpdate;
                oi.vy += ayi * that.simulationSecondsPerUpdate;
                oj.vx += axj * that.simulationSecondsPerUpdate;
                oj.vy += ayj * that.simulationSecondsPerUpdate;
            }
        }

        // Visit all the objects, moving the objects according to the newly updated velocities.
        for(var i = 0; i < numObjects; ++i) {
            var o = objs[i];
            o.x += o.vx * that.simulationSecondsPerUpdate;
            o.y += o.vy * that.simulationSecondsPerUpdate;
        }
 
        that.simulationTime += that.simulationSecondsPerUpdate;
    }

    return that;
}

return sim;

})();


//
// Web Worker
//
var worker = (function() {
'use strict';

var that = {};

function intervalCallback() {
    that.sim.update();
    postMessage({ command: "updated",
        objects: that.sim.objects,
        time: that.sim.simulationTime
    });
}

that.stop = function() {
    if (that.timerHandle) {
        clearInterval(that.timerHandle);
        delete that.timerHandle;
    }
}

that.start = function(interval, simulationSecondsPerUpdate) {
    that.stop();
    that.sim = simulator.create();
    that.sim.simulationSecondsPerUpdate = simulationSecondsPerUpdate;
    intervalCallback();
    //console.log("Starting with interval " + interval);
    that.timerHandle = setInterval(intervalCallback, interval);
}

return that;
})();

onmessage = function(e) {
    'use strict';
    var msg = e.data;
    var command = msg.command;
    //console.log("simulation.js onmessage command = " + command);
    if (command == "stop") {
        worker.stop();
    } else if (command == "start") {
        worker.start(msg.updateInterval, msg.simulationSecondsPerUpdate);
    }
}

