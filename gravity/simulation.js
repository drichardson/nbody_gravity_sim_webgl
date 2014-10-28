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

function Fcomponents(F, p1, p2, r) {
    // r is optional, but can be supplied if you have it already to save
    // the calculation.
    if (!r) {
        r = distance(p2, p1);
    }

    var Fx = F * (p2.x - p1.x) / r;
    var Fy = F * (p2.y - p1.y) / r;
    return { Fx: Fx, Fy: Fy };
}

sim.create = function() {
    var that = {};
    that.objects = [
        //{ name: "Earth", mass: 5.972E24, x: 0, y: -3, vx: 0, vy: 0, rgb: [0,1,0] },
        { name: "1kg-a", mass: 1e10, x: 0, y: -3, vx: 0, vy: 0, rgb: [0,1,0] },
        { name: "1kg-b", mass: 1e10, x: 0, y: 3, vx: 0, vy: 0, rgb: [1,0,0] }
    ];
    that.time = 0;
    that.seconds_per_update = 1/60;

    that.update = function() {
        // Visit all pairs of objects, calculating the equal but
        // opposing forces for each pair.
        // For example, if you have objects a, b, c, and d they'd be
        // visited in pairs: ab, ac, ad, bc, bd, cd
        var objs = that.objects;
        var num_objects = objs.length;
        for(var i = 0; i < num_objects - 1; ++i) {
            var oi = objs[i];
            for(var j = i+1; j < num_objects; ++j) {
                if (i == j) continue;
                var oj = objs[j];
                var r = distance(oi, oj);
                var F = Fg(oi.mass, oj.mass, r);
                var Fcomps = Fcomponents(F, oi, oj, r);
                // F = ma <=> F/m = a
                var axi = Fcomps.Fx / oi.mass;
                var ayi = Fcomps.Fy / oi.mass;
                var axj = -Fcomps.Fx / oj.mass;
                var ayj = -Fcomps.Fy / oj.mass;
                // update velocities
                oi.vx += axi * that.seconds_per_update;
                oi.vy += ayi * that.seconds_per_update;
                oj.vx += axj * that.seconds_per_update;
                oj.vy += ayj * that.seconds_per_update;
            }
        }

        // Visit all the objects, moving the objects according to the newly updated velocities.
        for(var i = 0; i < num_objects; ++i) {
            var o = objs[i];
            o.x += o.vx * that.seconds_per_update;
            o.y += o.vy * that.seconds_per_update;
        }
 
        that.time += that.seconds_per_update;
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
    postMessage({ command: "updated", objects: that.sim.objects });
}

that.stop = function() {
    if (that.timerHandle) {
        clearInterval(that.timerHandle);
        delete that.timerHandle;
    }
}

that.start = function(interval) {
    that.stop();
    that.sim = simulator.create();
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
        worker.start(msg.updateInterval);
    }
}

