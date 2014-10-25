function main(canvas) {
    //console.log("main called with canvas " + canvas);
    var simWorker = new Worker("simulation.js");
    var objectList = [];
    var renderer = draw.create(canvas);

    // Start worker thread to run simulation. This updates the objectList.
    simWorker.onmessage = function(e) {
        //console.log("Called back with " + e.data);
        var msg = e.data;
        if (msg.command == "updated") {
            objectList = msg.objects;
        }
    }

    simWorker.postMessage({ command: "start", updateInterval: 1000 });
    //setTimeout(function() { simWorker.postMessage({command: "stop"}); }, 5000);

    // Start animation callbacks. This always uses the latest objectList to draw.
    function drawFrame() {
        //console.log("Draw " + objectList.length + " objects");
        renderer.draw();
        window.requestAnimationFrame(drawFrame);
    }
    drawFrame();
}

