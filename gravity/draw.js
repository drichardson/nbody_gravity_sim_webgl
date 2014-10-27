
var draw = (function() {
'use strict';

var gVertexShaderSrc = 
    "attribute vec2 a_vertex;\n" +
    "uniform mat4 u_model;\n" +
    "uniform mat4 u_view;\n" +
    "uniform mat4 u_projection;\n" +
    "varying vec2 v_position;\n" +
    "void main() { \n" +
    "  gl_Position = u_projection * u_view * u_model * vec4(a_vertex,0,1);\n" +
    "  v_position = vec2(a_vertex);\n" +
    "}";

var gFragmentShaderSrc =
    "precision mediump float;\n" +
    "uniform vec4 u_backgroundColor;\n" +
    "uniform vec4 u_fillColor;\n" +
    "uniform float u_hardRadius;\n" + 
    "uniform float u_softRadius;\n" + 
    "varying vec2 v_position;\n" +
    "void main() {\n" +
    "  if (u_hardRadius > 0.0) {\n" +
    "    float d = distance(v_position, vec2(0.0,0.0));\n" +
    "    if(d < u_hardRadius) {\n" + 
    "      gl_FragColor = u_fillColor;\n" +
    "    } else if (d < u_softRadius) {\n" +
    // could switch the gradient calculations to all multiplications if I changed
    // the uniforms to precalculate the ratios.
    "      float gradient = (d - u_hardRadius) / (u_softRadius - u_hardRadius);\n" +
    "      gl_FragColor = mix(vec4(u_fillColor), vec4(u_backgroundColor), gradient);\n" +
    "    } else {\n" +
    "      discard;\n" +
    "    }\n" +
    "  } else {\n" +
    "    gl_FragColor = u_fillColor;\n" +
    "  }\n" +
    "}";

function compileShader(gl, src, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function linkProgram(gl, vertexShaderSrc, fragmentShaderSrc) {
    var vertexShader = compileShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
    var fragmentShader = compileShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking shaders. " + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

var api = {};

api.create = function(canvas) {
    var obj = {};
    var gl;
    var modelMatrix;
    var viewMatrix;
    var projectionMatrix;

    // Circle Program variables
    var circleProgram;
    var aVertex;
    var uModel;
    var uView;
    var uProjection;
    var uFillColor;
    var uBackgroundColor;
    var uHardRadius;
    var uSoftRadius;
    var triangleBufferObject;

    // Line Program variables
    var linesBufferObject;
    var uLinesFillColor;
    var uLinesModelMatrix;
    var uLinesViewMatrix;
    var uLinesProjectionMatrix;

    function initCircleProgram() {
        var program = linkProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
        if (!program) {
            console.error("Error linking circle program.");
            return false;
        }

        gl.useProgram(program);
        aVertex = gl.getAttribLocation(program, "a_vertex");
        uModel = gl.getUniformLocation(program, "u_model");
        uView = gl.getUniformLocation(program, "u_view");
        uProjection = gl.getUniformLocation(program, "u_projection");
        uFillColor = gl.getUniformLocation(program, "u_fillColor");
        uBackgroundColor = gl.getUniformLocation(program, "u_backgroundColor");
        uHardRadius = gl.getUniformLocation(program, "u_hardRadius");
        uSoftRadius = gl.getUniformLocation(program, "u_softRadius");

        gl.enableVertexAttribArray(aVertex);
        triangleBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferObject);
        var v = [
            -0.5, -0.5,
            -0.5, 0.5,
            0.5, -0.5,
            0.5, 0.5 ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);

        linesBufferObject = gl.createBuffer();

        return program;
    }

    function initLinesProgram() {
        var program = linkProgram(gVertexShaderSrc, gLinesFragmentShaderSrc);
        if (!program) {
            console.error("Error linking circle program.");
            return false;
        }

        gl.useProgram(program);
        uLinesFillColor = gl.getUniformLocation(program, "u_fillColor");
    }

    function init() {
        var w = canvas.width;
        var h = canvas.height;
        gl = canvas.getContext('webgl');
        gl.viewport(0,0,w,h);

        circleProgram = initCircleProgram();
        //linesProgram = initLinesProgram();        

        // Set model, view, and projection matricies.
        modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, [0, 0, 5]);
        viewMatrix = mat4.create();
        mat4.translate(viewMatrix, viewMatrix, [-5,0,-10]);
        mat4.scale(viewMatrix, viewMatrix, [50,50,1]);
        //mat4.rotateZ(viewMatrix, viewMatrix, Math.PI*10/180);
        projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, -w/2, w/2, -h/2, h/2, -1, 100);
        //mat4.perspective(projectionMatrix, Math.PI*35/180, w/h, 0, 100); 

        gl.uniformMatrix4fv(uModel, false, modelMatrix);
        gl.uniformMatrix4fv(uView, false, viewMatrix);
        gl.uniformMatrix4fv(uProjection, false, projectionMatrix);

        return true;
    }

    obj.backgroundRGB = [0,0,0];

    obj.clear = function() {
        var rgb = obj.backgroundRGB;
        gl.clearColor(rgb[0],rgb[1],rgb[2],1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    obj.activate = function() {
        gl.useProgram(circleProgram);
    }

    obj.drawLine = function(p1, p2, thickness) {
        var x1 = p1[0]; var y1 = p1[1];
        var x2 = p2[0]; var y2 = p2[1];
        gl.bindBuffer(gl.ARRAY_BUFFER, linesBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y2]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aVertex, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    obj.drawAxis = function(step, end, tickHeight) {
        var rgb = [1,1,1];
        gl.uniform4f(uFillColor, rgb[0], rgb[1], rgb[2], 1);
        gl.uniform1f(uHardRadius, 0.0);

        gl.lineWidth(1);
        
        // draw axis line
        obj.drawLine([-end, 0], [end, 0]);

        // draw ticks
        var y0 = tickHeight * 0.5;
        var y1 = tickHeight * -0.5;
        for(var i = step; i <= end; i += step) {
            obj.drawLine([-i, y0], [-i, y1]);
            obj.drawLine([i, y0], [i, y1]);
        }
    }

    obj.setModelMatrix = function(m) {
        gl.uniformMatrix4fv(uModel, false, m);
    }
    
    obj.drawCircle = function(x, y, r, rgb) {
        gl.uniform4f(uFillColor, rgb[0], rgb[1], rgb[2], 1);
        gl.uniform1f(uHardRadius, r - 0.02);
        gl.uniform1f(uSoftRadius, r);
        gl.uniform4f(uBackgroundColor,
                obj.backgroundRGB[0],
                obj.backgroundRGB[1],
                obj.backgroundRGB[2],
                1);

        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, [x, y, 0]);
        gl.uniformMatrix4fv(uModel, false, modelMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBufferObject);
        gl.vertexAttribPointer(aVertex, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (!init()) {
        return null;
    }

    return obj;
}

return api;

})();
