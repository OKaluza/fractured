  /**
   * @constructor
   */
  function WebCL_(pid, devid) {
    if (devid == undefined) devid = 0;
    this.pid = pid;
    this.devid = devid;
    this.fp64 = false;
    try {
      if (window.WebCL == undefined) return false;

      //Get & select platforms, devices
      this.platforms = WebCL.getPlatformIDs();
      //Pick default platform, NVIDIA if available, otherwise first in list
      if (this.pid == undefined || this.pid >= this.platforms.length) {
        for (this.pid=this.platforms.length-1; this.pid>=0; this.pid--) {
          var pfname = this.platforms[this.pid].getPlatformInfo(WebCL.CL_PLATFORM_NAME);
          if (pfname.indexOf("NVIDIA") >= 0) break;
        }
      }

      //Create the context
      this.ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, 
                                              this.platforms[this.pid]],
                                              WebCL.CL_DEVICE_TYPE_DEFAULT);
      this.devices = this.ctx.getContextInfo(WebCL.CL_CONTEXT_DEVICES);
      if (this.devid >= this.devices.length) this.devid = this.devices.length-1;

      debug("Using: " + this.platforms[this.pid].getPlatformInfo(WebCL.CL_PLATFORM_NAME) + " (" + this.pid + ")" +  
                  " - " + this.devices[this.devid].getDeviceInfo(WebCL.CL_DEVICE_NAME) + " (" + this.devid + ")");

      //Check for double precision support
      var extensions = this.platforms[this.pid].getPlatformInfo(window.WebCL.CL_PLATFORM_EXTENSIONS);
      extensions += " " + this.devices[this.devid].getDeviceInfo(window.WebCL.CL_DEVICE_EXTENSIONS);
      if (/cl_khr_fp64|cl_amd_fp64/i.test(extensions))
        this.fp64 = true; //Initial state of flag shows availability of fp64 support
      debug("WebCL ready, extensions: " + extensions);

    } catch(e) {
      alert(e.message);
      throw e;
    }
  }

  WebCL_.prototype.init = function(canvas, fp64) {
    this.canvas = canvas;
    this.ctx2d = canvas.getContext("2d");
    this.gradientcanvas = document.getElementById('gradient');
    this.threads = 64;
    this.setPrecision(fp64);
    this.format = {channelOrder:WebCL.CL_RGBA, channelDataType:WebCL.CL_UNSIGNED_INT8};
    this.palette = this.ctx.createImage2D(WebCL.CL_MEM_READ_ONLY, this.format, this.gradientcanvas.width, 1, 0);
    this.queue = this.ctx.createCommandQueue(this.devices[this.devid], 0);
    this.setViewport(0, 0, canvas.width, canvas.height);
  }

  WebCL_.prototype.setPrecision = function(fp64) {
    this.fp64 = (fp64 == true);
    this.inBuffer = this.fp64 ? new Float64Array(7) : new Float32Array(7);
    this.input = this.ctx.createBuffer(WebCL.CL_MEM_WRITE_ONLY, this.inBuffer.byteLength + 4*4 + 3*4 + 3);
  }

  WebCL_.prototype.buildProgram = function(kernelSrc) {
    if (!this.ctx) return;
    if (this.fp64) kernelSrc = "#define FP64\n" + kernelSrc;

    this.program = this.ctx.createProgramWithSource(kernelSrc);
    try {
      this.program.buildProgram ([this.devices[this.devid]], "");
    } catch(e) {
      return "Failed to build WebCL program. Error "
             + this.program.getProgramBuildInfo (this.devices[this.devid], WebCL.CL_PROGRAM_BUILD_STATUS)
             + ":  " 
             + this.program.getProgramBuildInfo (this.devices[this.devid], WebCL.CL_PROGRAM_BUILD_LOG);
    }
    this.k_sample = this.program.createKernel("sample");
    this.k_sample.setKernelArg(0, this.input);
    this.k_sample.setKernelArg(1, this.palette);
    if (this.temp) this.k_sample.setKernelArg(2, this.temp);
    this.k_average = this.program.createKernel("average");
    if (this.output) this.k_average.setKernelArg(0, this.output);
    if (this.temp) this.k_average.setKernelArg(1, this.temp);
  }

  //Calculates global work size given problem size and thread count
  WebCL_.prototype.getGlobalSize = function(n, threads) {
    return threads * Math.ceil(n/threads);
  }

  //WebCL_.prototype.sizeChanged = function(width, height) {
  WebCL_.prototype.setViewport = function(x, y, width, height) {
    //Clear canvas first
    this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //Adjust width/height, ensure is a multiple of work-group size
    var threads = Math.round(Math.sqrt(this.threads));   //Threads per dimension
    this.local = [threads, threads];
    this.global = [this.getGlobalSize(width, threads), this.getGlobalSize(height, threads)];

    //If width and height changed, recreate output buffer
    if (!this.viewport || this.viewport.width != this.global[0] || this.viewport.height != this.global[1]) {
      this.viewport = new Viewport(x, y, this.global[0], this.global[1]);
      this.output = this.ctx.createImage2D(WebCL.CL_MEM_WRITE_ONLY, this.format, this.viewport.width, this.viewport.height, 0);
      this.temp = this.ctx.createBuffer(WebCL.CL_MEM_READ_WRITE, this.global[0]*this.global[1]*4*4);
      if (this.k_sample) this.k_sample.setKernelArg (2, this.temp);
      if (this.k_average) this.k_average.setKernelArg(0, this.output);
      if (this.k_average) this.k_average.setKernelArg(1, this.temp);
    } else {
      this.viewport.x = x;
      this.viewport.y = y;
    }
  }

  WebCL_.prototype.draw = function(fractal, antialias) {
    if (!this.k_sample) return; //Sanity check
    if (antialias == undefined) antialias = 1;
    if (antialias > 4) antialias = 4; //Temporary fix, webgl antialias is not as effective, requires higher numbers
    if (!this.queue) return;
    try {
      ctx_g = this.gradientcanvas.getContext("2d");
      var outImage = this.ctx2d.createImageData(this.viewport.width, this.viewport.height);
      var gradient = ctx_g.getImageData(0, 0, this.gradientcanvas.width, 1);

      //Pass additional args
      var background = colours.palette.background;
      this.inBuffer[0] = fractal.position.zoom;
      this.inBuffer[1] = fractal.position.rotate;
      this.inBuffer[2] = fractal.position.pixelSize(this.canvas);
      this.inBuffer[3] = fractal.position.re;
      this.inBuffer[4] = fractal.position.im;
      this.inBuffer[5] = fractal.selected.re;
      this.inBuffer[6] = fractal.selected.im;

      var inBuffer2 = new Int8Array([antialias, fractal.julia]);
      var inBuffer3 = new Int32Array([fractal.iterations, this.viewport.width, this.viewport.height]);

      var size = this.inBuffer.byteLength;
      var offset = 0;
      this.queue.enqueueWriteBuffer(this.input, false, offset, size, this.inBuffer, []);
      offset += size; size = 4*4;  //4*rgba
      this.queue.enqueueWriteBuffer(this.input, false, offset, size, background.rgbaGL(), []);    
      offset += size; size = inBuffer2.byteLength;
      this.queue.enqueueWriteBuffer(this.input, false, offset, size, inBuffer2, []);    
      offset += size; size = inBuffer3.byteLength;
      this.queue.enqueueWriteBuffer(this.input, false, offset, size, inBuffer3, []);    

      this.queue.enqueueWriteImage(this.palette, false, [0,0,0], [gradient.width,1,1], gradient.width*4, 0, gradient.data, []);

      // Init ND-range
      debug("WebCL: Global (" + this.global[0] + "x" + this.global[1] + 
                   ") Local (" + this.local[0] + "x" + this.local[1] + ")");

      for (var j=0; j<antialias; j++) {
        for (var k=0; k<antialias; k++) {
          debug("Antialias pass ... " + j + " - " + k);
          this.k_sample.setKernelArg(3, j);
          this.k_sample.setKernelArg(4, k);
          this.queue.enqueueNDRangeKernel(this.k_sample, this.global.length, [], this.global, this.local, []);
          this.queue.finish();
        }
      }
      //Combine
      debug("Combining samples...");
      this.k_average.setKernelArg(2, antialias*antialias);
      this.queue.enqueueNDRangeKernel(this.k_average, this.global.length, [], this.global, this.local, []);

      this.queue.enqueueReadImage(this.output, false, [0,0,0], [this.viewport.width,this.viewport.height,1], 0, 0, outImage.data, []);
      this.queue.finish();

      this.ctx2d.putImageData(outImage, this.viewport.x, this.viewport.y);

    } catch(e) {
      alert(e.message);
      throw e;
    }
  }

