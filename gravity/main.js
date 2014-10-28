function main(canvas) {
    'use strict';

    //console.log("main called with canvas " + canvas);
    var simWorker = new Worker("simulation.js");
    var objectList = [];
    var renderer = draw.create(canvas);
    renderer.backgroundRGB = [0,0,0];

    // Start worker thread to run simulation. This updates the objectList.
    simWorker.onmessage = function(e) {
        //console.log("Called back with " + e.data);
        var msg = e.data;
        //console.log("Simulation time: " + msg.time);
        if (msg.command == "updated") {
            objectList = msg.objects;
        }
    }

    simWorker.postMessage({ command: "start",
        updateInterval: 1,
        simulationSecondsPerUpdate: 1e4
    });
    //setTimeout(function() { simWorker.postMessage({command: "stop"}); }, 5000);

    // Start animation callbacks. This always uses the latest objectList to draw.
    var x = 0;
    function drawFrame() {
        //console.log("Draw " + objectList.length + " objects");
        renderer.activate();
        renderer.clear();

        var m = mat4.create();
        mat4.identity(m);
        var metersPerPixel = 4 * 149600000e3 / canvas.width; // 3 x distance from sun to earth
        mat4.scale(m, m, [1/metersPerPixel,1/metersPerPixel,1/metersPerPixel]);
        renderer.setViewMatrix(m);

        // Draw x and y axes
        /*
        m = mat4.create();
        renderer.setModelMatrix(m);
        renderer.drawAxis(100 * metersPerPixel, 300*metersPerPixel, 5*metersPerPixel);
        mat4.rotateZ(m, m, Math.PI / 2);
        renderer.setModelMatrix(m);
        renderer.drawAxis(100 * metersPerPixel, 300*metersPerPixel, 5*metersPerPixel);
        */

        // Draw objects
        var len = objectList.length;
        for(var i = 0; i < len; ++i) {
            var o = objectList[i];
            renderer.drawCircle(o.x, o.y, 3*metersPerPixel/*o.r*/, o.rgb);
        }

        //renderer.drawCircle(0, 0, 1, [1,1,0]);
        //x += 0.1;
        //renderer.drawCircle(0.5*Math.cos(x), Math.sin(x), 0.25, [1,0,0]);
        //renderer.drawCircle(Math.sin(x), 0, 0.25, [0,1,0]);
        //renderer.drawCircle(Math.cos(x), -0.5, 0.1, [0,0,1]);
        window.requestAnimationFrame(drawFrame);
    }
    drawFrame();
}

