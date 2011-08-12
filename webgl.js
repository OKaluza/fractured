  function WebGL(canvas) {
    this.program = null;
    this.modelView = new ModelView();

    try {
      this.gl = canvas.getContext("experimental-webgl", { alpha: true } );

      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;

      //Create an off-screen render buffer
      //initTextureFramebuffer(canvas.width, canvas.height);

      this.initBuffers();

    } catch(e) {
    }

    if (!this.gl) {
      alert("Could not initialise WebGL, sorry :-(");
    }
  }

  WebGL.prototype.draw = function() {
      //Enable this to render frame to texture 
      //this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rttFramebuffer);

    //var bg = colours[0].colour.rgbaGL();
    //this.gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);

    //if (!fractal.julia) {
      this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    //} else
    //  this.gl.viewport(50, 50, 200, 200);

    /* This is a test to show transparency bug in webgl:
    this.gl.clearColor(0.1, 0.1, 0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    return;*/


    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.vertexAttribPointer(this.program.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    //Rotation & translation matrix
    this.gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.modelView.get());

    //Draw!
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);

    return; //Below is to display rendered texture
/*
    //Draw result
    gl.uniform1i(defaultProgram.textureUniform, 0);
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(defaultProgram);

    //Enable texture coord array
    gl.enableVertexAttribArray(defaultProgram.textureCoordAttribute);

    //Re-apply rotation & translation matrix
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    loadIdentity();
    //setMatrixUniforms(defaultProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(defaultProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.vertexAttribPointer(defaultProgram.textureCoordAttribute, textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //Draw rendered texture!
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);

    gl.disableVertexAttribArray(defaultProgram.textureCoordAttribute);
*/
  }

  WebGL.prototype.compileShader = function(source, type) {
    //alert("Compiling " + type + " Source == " + source);
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      alert("Compile failed: " + this.gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  WebGL.prototype.initProgram = function(vs, fs) {
    //Pass in vertex shader, fragment shaders...

    if (this.gl.isProgram(this.program))
    {
      //Clean up previous shader set
      if (this.gl.isShader(this.program.vshader))
      {
        this.gl.detachShader(this.program, this.program.vshader);
        this.gl.deleteShader(this.program.vshader);
      }
      if (this.gl.isShader(this.program.fshader))
      {
        this.gl.detachShader(this.program, this.program.fshader);
        this.gl.deleteShader(this.program.fshader);
      }
    }
    else
       this.program = this.gl.createProgram();

    this.program.vshader = this.compileShader(vs, this.gl.VERTEX_SHADER);
    this.program.fshader = this.compileShader(fs, this.gl.FRAGMENT_SHADER);

    this.gl.attachShader(this.program, this.program.vshader);
    this.gl.attachShader(this.program, this.program.fshader);

    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      alert("Could not initialise shaders: " + this.gl.getProgramInfoLog(this.program));
    }
  }

  //Setup and load uniforms specific to the fractal program
  WebGL.prototype.setupProgram = function(uniforms) {
    this.program.vertexPositionAttribute = this.gl.getAttribLocation(this.program, "aVertexPosition");
    this.gl.enableVertexAttribArray(this.program.vertexPositionAttribute);
    //this.program.textureCoordAttribute = this.gl.getAttribLocation(this.program, "aTextureCoord");

    this.program.uniforms = {};
    for (i in uniforms)
      this.program.uniforms[uniforms[i]] = this.gl.getUniformLocation(this.program, uniforms[i]);
    this.program.mvMatrixUniform = this.gl.getUniformLocation(this.program, "uMVMatrix");
  }

  WebGL.prototype.initTextureFramebuffer = function(width, height) {
    this.rttFramebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer);
    this.rttFramebuffer.width = width;
    this.rttFramebuffer.height = height;

    this.rttTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    //this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    //this.gl.generateMipmap(this.gl.TEXTURE_2D);

    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.rttFramebuffer.width, this.rttFramebuffer.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

    //var renderbuffer = this.gl.createRenderbuffer();
    //this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
    //this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.rttFramebuffer.width, this.rttFramebuffer.height);

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.rttTexture, 0);
    //this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, renderbuffer);

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    //this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  WebGL.prototype.initBuffers = function() {
    //All output drawn onto a single 2x2 quad
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var vertexPositions = [1.0,1.0,  -1.0,1.0,  1.0,-1.0,  -1.0,-1.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 2;
    this.vertexPositionBuffer.numItems = 4;

    //Texture coords for rendered texture
    textureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
    var textureCoords = [1.0, 1.0,  0.0, 1.0,  1.0, 0.0,  0.0, 0.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    this.textureCoordBuffer.itemSize = 2;
    this.textureCoordBuffer.numItems = 4;
  }

  WebGL.prototype.updateTexture = function(texture) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  function ModelView() {
    this.matrix
    this.stack = [];
  }

  ModelView.prototype.get = function() {
    return new Float32Array(matrix.flatten())
  }

  ModelView.prototype.push = function(m) {
    if (m) {
      this.stack.push(m.dup());
      matrix = m.dup();
    } else {
      stack.push(matrix.dup());
    }
  }

  ModelView.prototype.pop = function() {
    if (stack.length == 0) {
      throw "Matrix stack underflow";
    }
    matrix = stack.pop();
    return matrix;
  }

  ModelView.prototype.mult = function(m) {
    matrix = matrix.x(m);
  }

  ModelView.prototype.identity = function() {
    matrix = Matrix.I(4);
  }

  ModelView.prototype.scale = function(v) {
    var m = Matrix.Scale($V([v[0], v[1], v[2]])).ensure4x4();
    this.mult(m);
  }

  ModelView.prototype.translate = function(v) {
    var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    this.mult(m);
  }

  ModelView.prototype.createRotationMatrix = function(angle, v) {
    var arad = angle * Math.PI / 180.0;
    return Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
  }

  ModelView.prototype.rotate = function(angle,v) {
    this.mult(this.createRotationMatrix(angle, v));
  }

  function setMatrixUniforms(gl, program) {
  }

//From learning webgl?
// augment Sylvester some
Matrix.Translation = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.Scale = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[0][0] = v.elements[0];
    r.elements[1][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][0] = v.elements[0];
    r.elements[1][1] = v.elements[1];
    r.elements[2][2] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.prototype.flatten = function ()
{
    var result = [];
    if (this.elements.length == 0)
        return [];


    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
}

Matrix.prototype.ensure4x4 = function()
{
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;

    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++) {
            if (i == j)
                this.elements[i].push(1);
            else
                this.elements[i].push(0);
        }
    }

    for (var i = this.elements.length; i < 4; i++) {
        if (i == 0)
            this.elements.push([1, 0, 0, 0]);
        else if (i == 1)
            this.elements.push([0, 1, 0, 0]);
        else if (i == 2)
            this.elements.push([0, 0, 1, 0]);
        else if (i == 3)
            this.elements.push([0, 0, 0, 1]);
    }

    return this;
};

Matrix.prototype.make3x3 = function()
{
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
        return null;

    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};

Vector.prototype.flatten = function ()
{
    return this.elements;
};

function mht(m) {
    var s = "";
    if (m.length == 16) {
        for (var i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (var i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
}

//
// gluLookAt
//
function makeLookAt(ex, ey, ez,
                    cx, cy, cz,
                    ux, uy, uz)
{
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
}

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left, right,
                     bottom, top,
                     znear, zfar)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}

//
// glOrtho
//
function makeOrtho(left, right, bottom, top, znear, zfar)
{
    var tx = - (right + left) / (right - left);
    var ty = - (top + bottom) / (top - bottom);
    var tz = - (zfar + znear) / (zfar - znear);

    return $M([[2 / (right - left), 0, 0, tx],
           [0, 2 / (top - bottom), 0, ty],
           [0, 0, -2 / (zfar - znear), tz],
           [0, 0, 0, 1]]);
}
