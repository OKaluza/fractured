  /**
   * WebGL interface object
   * standard utilities for WebGL 
   * Shader & matrix utilities for 3d & 2d
   * functions for 2d rendering / image processing, fbo render to texture
   * (c) Owen Kaluza 2012
   */

  /**
   * @constructor
   */
  function Viewport(x, y, width, height) {
    this.x = x; 
    this.y = y; 
    this.width = width; 
    this.height = height; 
  }

  /**
   * @constructor
   */
  function WebGL(canvas) {
    this.program = null;
    this.modelView = new ViewMatrix();
    this.perspective = new ViewMatrix();
    this.textures = [];
    this.timer = null;

    if (!window.WebGLRenderingContext) throw "Browser doesn't support WebGL";

    var options = { antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true};
    if (window.opera) options.premultipliedAlpha = true;  //Work around an opera bug
    // Try to grab the standard context. If it fails, fallback to experimental.
    this.gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
    this.viewport = new Viewport(0, 0, canvas.width, canvas.height);
    if (!this.gl) throw "Failed to get context";
  }

  WebGL.prototype.setMatrices = function() {
    //Model view matrix
    this.gl.uniformMatrix4fv(this.program.mvMatrixUniform, false, this.modelView.matrix);
    //Perspective matrix
    this.gl.uniformMatrix4fv(this.program.pMatrixUniform, false, this.perspective.matrix);
  }

  WebGL.prototype.draw2d = function(antialias) {
    if (antialias == undefined) antialias = 1;
    if (this.timer) {clearTimeout(this.timer); this.timer = null;}
      //Enable this to render frame to texture 
      //this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rttFramebuffer);

    this.gl.viewport(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
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
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.CONSTANT_ALPHA, this.gl.ONE_MINUS_CONSTANT_ALPHA);
      this.blendinc = 0;

      this.j = 0;
      this.k = 0;
      this.antialias = antialias;
      var that = this;
      this.pass();

    } else {
      //Draw, single pass
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);
      if (this.time) this.time.print("Draw");
    }

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
    gl.viewport(0, 0, viewport.width, viewport.height);
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

  WebGL.prototype.pass = function() {
    //debug("Antialias pass ... " + this.j + " - " + this.k);
    var blendval = 1.0 - this.blendinc;
    blendval *= blendval;// * blendval;
    this.gl.blendColor(0, 0, 0, blendval);
    //print(blendval);
    this.blendinc += 1.0/(this.antialias*this.antialias);
    this.gl.uniform2f(this.program.uniforms['offset'], this.j/this.antialias-0.5, this.k/this.antialias-0.5);
    //Draw!
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);

    //Next...
    this.k++;
    if (this.k >= this.antialias) {
      this.k = 0;
      this.j++;
    }

    if (this.j < this.antialias) {
      if (!this.time)
        this.pass();  //Don't draw incrementally when timers disabled
      else {
        var that = this;
        this.timer = setTimeout(function () {that.pass();}, 10);
      }
    } else {
      this.timer = null;
      if (this.time) this.time.print("Draw");
    }
  }

  WebGL.prototype.updateTexture = function(texture, image, unit) {
    //Set default texture unit if not provided
    if (unit == undefined) unit = this.gl.TEXTURE0;
    this.gl.activeTexture(unit);
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

  WebGL.prototype.init2dBuffers = function(unit) {
    //Set default texture unit if not provided
    if (unit == undefined) unit = this.gl.TEXTURE0;
    //All output drawn onto a single 2x2 quad
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var vertexPositions = [1.0,1.0,  -1.0,1.0,  1.0,-1.0,  -1.0,-1.0];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertexPositions), this.gl.STATIC_DRAW);
    this.vertexPositionBuffer.itemSize = 2;
    this.vertexPositionBuffer.numItems = 4;

    //Gradient texture
    this.gl.activeTexture(unit);
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

  /**
   * @constructor
   */
  //Program object
  function WebGLProgram(gl, vs, fs) {
    //Can be passed source directly or script tag
    this.program = null;
    if (vs.indexOf("main") < 0) vs = getSourceFromElement(vs);
    if (fs.indexOf("main") < 0) fs = getSourceFromElement(fs);
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
    this.fshader = this.compileShader(fs, this.gl.FRAGMENT_SHADER);

    this.gl.attachShader(this.program, this.vshader);
    this.gl.attachShader(this.program, this.fshader);

    this.gl.linkProgram(this.program);
 
    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw "Could not initialise shaders: " + this.gl.getProgramInfoLog(this.program);
    }
  }

  WebGLProgram.prototype.compileShader = function(source, type) {
    //alert("Compiling " + type + " Source == " + source);
    var shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
      throw this.gl.getShaderInfoLog(shader);
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

  /**
   * @constructor
   */
  function ViewMatrix() {
    this.matrix = mat4.create();
    mat4.identity(this.matrix);
    this.stack = [];
  }

  ViewMatrix.prototype.toString = function() {
    return JSON.stringify(this.matrix);
  }

  ViewMatrix.prototype.push = function(m) {
    if (m) {
      this.stack.push(mat4.create(m));
      this.matrix = mat4.create(m);
    } else {
      this.stack.push(mat4.create(this.matrix));
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
    mat4.multiply(this.matrix, m);
  }

  ViewMatrix.prototype.identity = function() {
    mat4.identity(this.matrix);
  }

  ViewMatrix.prototype.scale = function(v) {
    mat4.scale(this.matrix, v);
  }

  ViewMatrix.prototype.translate = function(v) {
    mat4.translate(this.matrix, v);
  }

  ViewMatrix.prototype.rotate = function(angle,v) {
    var arad = angle * Math.PI / 180.0;
    mat4.rotate(this.matrix, arad, v);
  }

