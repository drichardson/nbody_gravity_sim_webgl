
var draw = (function() {
'use strict';

var gVertexShaderSrc = 
    "attribute vec4 a_position;\n" +
    "uniform mat4 u_modelViewProjectionMatrix;\n" +
    "varying vec2 v_position;\n" +
    "void main() { \n" +
    "  gl_Position = u_modelViewProjectionMatrix * a_position;\n" +
    "  v_position = vec2(a_position);\n" +
    "}";

var gFragmentShaderSrc =
    "precision mediump float;\n" +
    "uniform vec4 u_backgroundColor;\n" +
    "uniform vec4 u_fillColor;\n" +
    "uniform float u_hardRadius;\n" + 
    "uniform float u_softRadius;\n" + 
    "varying vec2 v_position;\n" +
    "void main() {\n" +
    "  float d = distance(v_position, vec2(0.0,0.0));\n" +
    "  if(d < u_hardRadius) {\n" + 
    "    gl_FragColor = u_fillColor;\n" +
    "  } else if (d < u_softRadius) {\n" +
    // could switch the gradient calculations to all multiplications if I changed
    // the uniforms to precalculate the ratios.
    "    float gradient = (d - u_hardRadius) / (u_softRadius - u_hardRadius);\n" +
    "    gl_FragColor = mix(vec4(u_fillColor), vec4(u_backgroundColor), gradient);\n" +
    "  } else {\n" +
    "    discard;\n" +
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

var api = {};

api.create = function(canvas) {
    var obj = {};
    var gl;
    var program;
    var identity4x4 = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1]);
    var aPosition;
    var uMVP;
    var uFillColor;
    var uBackgroundColor;
    var uHardRadius;
    var uSoftRadius;

    function init() {
        gl = canvas.getContext('webgl');
        gl.viewport(0,0,canvas.width,canvas.height);

        var vertexShader = compileShader(gl, gVertexShaderSrc, gl.VERTEX_SHADER);
        var fragmentShader = compileShader(gl, gFragmentShaderSrc, gl.FRAGMENT_SHADER);
        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Error linking shaders. " + gl.getProgramInfoLog(program));
            return false;
        }

        gl.useProgram(program);
        aPosition = gl.getAttribLocation(program, "a_position");
        uMVP = gl.getUniformLocation(program, "u_modelViewProjectionMatrix");
        uFillColor = gl.getUniformLocation(program, "u_fillColor");
        uBackgroundColor = gl.getUniformLocation(program, "u_backgroundColor");
        uHardRadius = gl.getUniformLocation(program, "u_hardRadius");
        uSoftRadius = gl.getUniformLocation(program, "u_softRadius");

        return true;
    }

    obj.backgroundRGB = [0,0,0];

    obj.clear = function() {
        var rgb = obj.backgroundRGB;
        gl.clearColor(rgb[0],rgb[1],rgb[2],1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    obj.drawCircle = function(x, y, r, rgb) {
        gl.useProgram(program);

        gl.uniformMatrix4fv(uMVP, false, identity4x4);
        gl.uniform4f(uFillColor, rgb[0], rgb[1], rgb[2], 1);
        gl.uniform1f(uHardRadius, r - 0.02);
        gl.uniform1f(uSoftRadius, r);
        gl.uniform4f(uBackgroundColor,
                obj.backgroundRGB[0],
                obj.backgroundRGB[1],
                obj.backgroundRGB[2],
                1);

        gl.enableVertexAttribArray(aPosition);

        var triangleBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
        var v = [
            -0.5, -0.5,
            -0.5, 0.5,
            0.5, -0.5,
            0.5, 0.5 ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (!init()) {
        return null;
    }

    return obj;
}

return api;

})();
