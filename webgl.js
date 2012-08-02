  /**
   * WebGL interface object
   * standard utilities for WebGL 
   * Shader & matrix utilities for 3d & 2d
   * functions for 2d rendering / image processing, fbo render to texture
   * (c) Owen Kaluza 2012
   *
   * @constructor
   */
  function WebGL(canvas) {
    this.program = null;
    this.modelView = new ViewMatrix();
    this.perspective = new ViewMatrix();
    this.textures = [];

    try {
      this.gl = canvas.getContext("experimental-webgl", { antialias: true } );
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
    } catch(e) {
      alert(e);
    }

    if (!this.gl) {
      alert("Could not initialise WebGL");
    }
  }

  WebGL.prototype.setMatrices = function() {
    //Model view matrix
    this.gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.modelView.get());
    //Perspective matrix
    this.gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.perspective.get());
  }

  WebGL.prototype.draw2d = function(antialias) {
    if (antialias == undefined) antialias = 1;
      //Enable this to render frame to texture 
      //this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rttFramebuffer);

    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.scissor(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.gl.enableVertexAttribArray(this.program.attributes["aVertexPosition"]);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    this.gl.vertexAttribPointer(this.program.attributes["aVertexPosition"], this.vertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    if (this.program.attributes["aTextureCoord"]) {
      this.gl.enableVertexAttribArray(this.program.attributes["aTextureCoord"]);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
      this.gl.vertexAttribPointer(this.program.attributes["aTextureCoord"], this.textureCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    }

    this.setMatrices();

    if (antialias > 1) {
      //Draw and blend multiple passes for anti-aliasing
      var blendinc = 0;
      //var data = new Int8Array(this.gl.viewportWidth * this.gl.viewportHeight * 4);
      for (var j=0; j<antialias; j++) {
        for (var k=0; k<antialias; k++) {
          var blendval = 1.0 - blendinc;
          blendval *= blendval;// * blendval;
          this.gl.blendColor(0, 0, 0, blendval);
          //consoleWrite(blendval);
          blendinc += 1.0/(antialias*antialias);
          this.gl.uniform2f(this.program.uniforms['offset'], j/antialias-0.5, k/antialias-0.5);
          //Draw!
          this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);
        }
      }
    } else //Draw, single pass
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

  WebGL.prototype.updateTexture = function(texture, image) {
    //(Ability to set texture unit?)
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  WebGL.prototype.initTextureFramebuffer = function(width, height) {
    //Create the framebuffer object
    this.rttFramebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.rttFramebuffer);
    this.rttFramebuffer.width = width;
    this.rttFramebuffer.height = height;

    //The texture to render to
    this.rttTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.rttTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 
                       this.rttFramebuffer.width, this.rttFramebuffer.height, 
                       0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.rttTexture, 0);

    //Depth buffer? (not required for 2d only renders)
    this.rttDepthbuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rttDepthbuffer);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.rttDepthbuffer);

    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    var fbo_status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)
    if (fbo_status != this.gl.FRAMEBUFFER_COMPLETE) alert("Framebuffer error: " + fbo_status);
  }

  WebGL.prototype.init2dBuffers = function() {
    //All output drawn onto a single 2x2 quad
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var vertexPositions = [1.0,1.0,  -1.0,1.0,  1.0,-1.0,  -1.0,-1.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 2;
    this.vertexPositionBuffer.numItems = 4;

    //Gradient texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gradientTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.gradientTexture);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    //Texture coords
    this.textureCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    var textureCoords = [1.0, 1.0,  0.0, 1.0,  1.0, 0.0,  0.0, 0.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    this.textureCoordBuffer.itemSize = 2;
    this.textureCoordBuffer.numItems = 4;
  }

  WebGL.prototype.loadTexture = function(image, filter) {
    if (filter == undefined) filter = this.gl.NEAREST;
    this.texid = this.textures.length;
    this.textures.push(this.gl.createTexture());
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.texid]);
    //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    //(Ability to set texture type?)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.LUMINANCE, this.gl.LUMINANCE, this.gl.UNSIGNED_BYTE, image);
    //this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, filter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, filter);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return this.textures[this.texid];
  }

  WebGL.prototype.setPerspective = function(fovy, aspect, znear, zfar) {
    this.perspective.matrix = makePerspective(fovy, aspect, znear, zfar);
  }

  WebGL.prototype.use = function(program) {
    this.program = program;
    if (this.program.program)
      this.gl.useProgram(this.program.program);
  }

  //Program object
  function WebGLProgram(gl, vs, fs) {
    //Can be passed source directly or script tag
    if (vs.indexOf("main") < 0) vs = this.getShaderSource(vs);
    if (fs.indexOf("main") < 0) fs = this.getShaderSource(fs);
    //Pass in vertex shader, fragment shaders...
    this.gl = gl;
    if (this.program && this.gl.isProgram(this.program))
    {
      //Clean up previous shader set
      if (this.gl.isShader(this.vshader))
      {
        this.gl.detachShader(this.program, this.vshader);
        this.gl.deleteShader(this.vshader);
      }
      if (this.gl.isShader(this.fshader))
      {
        this.gl.detachShader(this.program, this.fshader);
        this.gl.deleteShader(this.fshader);
      }
      this.gl.deleteProgram(this.program);  //Required for chrome, doesn't like re-using this.program object
    }

    this.program = this.gl.createProgram();

    this.vshader = this.compileShader(vs, this.gl.VERTEX_SHADER);
    if (typeof(this.vshader) == 'string') this.errors = this.vshader;
    this.fshader = this.compileShader(fs, this.gl.FRAGMENT_SHADER);
    if (typeof(this.fshader) == 'string') this.errors = this.fshader;

    if (typeof(this.vshader) == 'object' && typeof(this.fshader) == 'object') {
      this.gl.attachShader(this.program, this.vshader);
      this.gl.attachShader(this.program, this.fshader);

      this.gl.linkProgram(this.program);
   
      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        alert("Could not initialise shaders: " + this.gl.getProgramInfoLog(this.program));
      }
    } else {
      this.program = null;
    }
  }

  WebGLProgram.prototype.compileShader = function(source, type) {
    //alert("Compiling " + type + " Source == " + source);
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      return this.gl.getShaderInfoLog(shader);
    }
    return shader;
  }

  //Setup and load uniforms
  WebGLProgram.prototype.setup = function(attributes, uniforms) {
    if (!this.program) return;
    if (attributes == undefined) attributes = ["aVertexPosition", "aTextureCoord"];
    this.attributes = {};
    var i;
    for (i in attributes) {
      this.attributes[attributes[i]] = this.gl.getAttribLocation(this.program, attributes[i]);
      this.gl.enableVertexAttribArray(this.attributes[attributes[i]]);
    }

    this.uniforms = {};
    for (i in uniforms)
      this.uniforms[uniforms[i]] = this.gl.getUniformLocation(this.program, uniforms[i]);
    this.mvMatrixUniform = this.gl.getUniformLocation(this.program, "uMVMatrix");
    this.pMatrixUniform = this.gl.getUniformLocation(this.program, "uPMatrix");
  }

  WebGLProgram.prototype.getShaderSource = function(id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) return null;
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
      if (k.nodeType == 3)
        str += k.textContent;
      k = k.nextSibling;
    }
    return str;
  }


  /**
   * @constructor
   */
  function ViewMatrix() {
    this.matrix = Matrix.I(4);
    this.stack = [];
  }

  ViewMatrix.prototype.get = function() {
    return new Float32Array(this.matrix.flatten())
  }

  ViewMatrix.prototype.toString = function() {
    return JSON.stringify(this.matrix);
    //return new Float32Array(matrix.flatten())
  }

  ViewMatrix.prototype.push = function(m) {
    if (m) {
      this.stack.push(m.dup());
      this.matrix = m.dup();
    } else {
      this.stack.push(this.matrix.dup());
    }
  }

  ViewMatrix.prototype.pop = function() {
    if (this.stack.length == 0) {
      throw "Matrix stack underflow";
    }
    this.matrix = this.stack.pop();
    return this.matrix;
  }

  ViewMatrix.prototype.mult = function(m) {
    this.matrix = this.matrix.x(m);
  }

  ViewMatrix.prototype.identity = function() {
    this.matrix = Matrix.I(4);
  }

  ViewMatrix.prototype.scale = function(v) {
    var m = Matrix.Scale($V([v[0], v[1], v[2]])).ensure4x4();
    this.mult(m);
  }

  ViewMatrix.prototype.translate = function(v) {
    var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    this.mult(m);
  }

  ViewMatrix.prototype.createRotationMatrix = function(angle, v) {
    var arad = angle * Math.PI / 180.0;
    return Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
  }

  ViewMatrix.prototype.rotate = function(angle,v) {
    this.mult(this.createRotationMatrix(angle, v));
  }

//From learning webgl - augment Sylvester some
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

function makePerspective(fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

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
