var gl;
var currentProgram;
var defaultProgram;

  function initGL(canvas) {
    try {
      gl = canvas.getContext("experimental-webgl", { alpha: true } );

      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;

      //Create an off-screen render buffer
      //initTextureFramebuffer(canvas.width, canvas.height);

      initBuffers();

    } catch(e) {
    }

    if (!gl) {
      alert("Could not initialise WebGL, sorry :-(");
    }
  }

  function compileShader(gl, source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function initProgram(program) {
    //Pass in program, vertex shader, fragment shaders...
    var args = arguments;
    var vertexShaderSource = args[1];

    if (gl.isProgram(program))
    {
      //Clean up previous shader set
      for (var i=0; i<program.shaders.length; i++)
      {
        var shader = program.shaders[i];
        if (gl.isShader(shader))
        {
          gl.detachShader(program, shader);
          gl.deleteShader(shader);
        }
      }
    }
    else
       program = gl.createProgram();

    program.shaders = new Array();

    program.shaders.push(compileShader(gl, args[1], gl.VERTEX_SHADER));
    for (i=2; i<args.length; i++)
      program.shaders.push(compileShader(gl, args[i], gl.FRAGMENT_SHADER));

    for (i=0; i<program.shaders.length; i++)
      gl.attachShader(program, program.shaders[i]);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      alert("Could not initialise shaders: " + gl.getProgramInfoLog(program));
    }
    return program;
  }

  //Setup and load uniforms specific the fractal program
  function fractalProgram(program) {
    program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    //Hard coded (view / palette)
    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
    program.paletteUniform = gl.getUniformLocation(program, "palette");
    program.juliaUniform = gl.getUniformLocation(program, "julia");
    program.perturbUniform = gl.getUniformLocation(program, "perturb");
    program.originUniform = gl.getUniformLocation(program, "origin");
    program.selectedUniform = gl.getUniformLocation(program, "selected");
    program.dimsUniform = gl.getUniformLocation(program, "dims");
    program.pixelsizeUniform = gl.getUniformLocation(program, "pixelsize");
    program.backgroundUniform = gl.getUniformLocation(program, "background");
    return program;
  }

  //Setup and load uniforms specific the texture display program
  function textureProgram(program) {
    program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);

    program.textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");

    program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
    program.textureUniform = gl.getUniformLocation(program, "texture");
    return program;
  }

  var rttFramebuffer;
  var rttTexture;
  function initTextureFramebuffer(width, height) {
    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = width;
    rttFramebuffer.height = height;

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.generateMipmap(gl.TEXTURE_2D);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    //var renderbuffer = gl.createRenderbuffer();
    //gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    //gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    //gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    //gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }


  function consoleWrite(str) {
    var console = document.getElementById('console');
    console.value = str + "\n" + console.value;
  }


  var vertexPositionBuffer;
  var textureCoordBuffer;
  function initBuffers() {
    //All output drawn onto a single 2x2 quad
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var vertexPositions = [1.0,1.0,  -1.0,1.0,  1.0,-1.0,  -1.0,-1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 2;
    vertexPositionBuffer.numItems = 4;

    //Texture coords for rendered texture
    textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    var textureCoords = [1.0, 1.0,  0.0, 1.0,  1.0, 0.0,  0.0, 0.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    textureCoordBuffer.itemSize = 2;
    textureCoordBuffer.numItems = 4;
  }

  function updateTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

