  /**
   * @constructor
   */
  function WebCL_(canvas, fp64) {
     this.canvas = canvas;
     this.gradientcanvas = document.getElementById('gradient');
     try {
       if (window.WebCL == undefined) {
         alert("Unfortunately your system does not support WebCL");
         return false;
       }

       this.platforms = WebCL.getPlatformIDs();
       this.ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, 
                                               this.platforms[0]],
                                               WebCL.CL_DEVICE_TYPE_DEFAULT);
       this.devices = this.ctx.getContextInfo(WebCL.CL_CONTEXT_DEVICES);

       consoleDebug("WebCL ready, " + (fp64 ? "double" : "single") + " precision");

     } catch(e) {
       alert(e.message);
       throw e;
     }
     this.threads = 64;
     this.fp64 = (fp64 != undefined);
  }


  WebCL_.prototype.initProgram = function(kernelSrc, width, height) {
    if (!this.ctx) return;
    if (this.fp64) kernelSrc = "#define FP64\n" + kernelSrc;

    this.inBuffer = this.fp64 ? new Float64Array(7) : new Float32Array(7);

    this.program = this.ctx.createProgramWithSource(kernelSrc);
    try {
      this.program.buildProgram ([this.devices[0]], "");
    } catch(e) {
      alert ("Failed to build WebCL program. Error "
             + this.program.getProgramBuildInfo (this.devices[0], WebCL.CL_PROGRAM_BUILD_STATUS)
             + ":  " 
             + this.program.getProgramBuildInfo (this.devices[0], WebCL.CL_PROGRAM_BUILD_LOG));
      throw e;
    }
    this.kernel = this.program.createKernel ("fractured");
    this.input = this.ctx.createBuffer(WebCL.CL_MEM_WRITE_ONLY, this.inBuffer.byteLength + 4*4 + 3 + 2*4);
    this.format = {channelOrder:WebCL.CL_RGBA, channelDataType:WebCL.CL_UNSIGNED_INT8};
    this.palette = this.ctx.createImage2D(WebCL.CL_MEM_READ_ONLY, this.format, this.gradientcanvas.width, 1, 0);

    this.kernel.setKernelArg (0, this.input);
    this.kernel.setKernelArg (1, this.palette);
            
    //Create output buffer in specified size
    this.sizeChanged(width, height);

    //this.queue = this.ctx.createCommandQueue(this.devices[0], 0);
  }

  //Calculates global work size given problem size and thread count
  WebCL_.prototype.getGlobalSize = function(n, threads) {
    return threads * Math.ceil(n/threads);
  }

  WebCL_.prototype.sizeChanged = function(width, height) {
    //Adjust width/height, ensure is a multiple of work-group size
    this.width = width;
    this.height = height;

    var threads = Math.round(Math.sqrt(this.threads));   //Threads per dimension
    this.local = [threads, threads];
    this.global = [this.getGlobalSize(width, threads), this.getGlobalSize(height, threads)];

    this.width = this.global[0];
    this.height = this.global[1];

    this.output = this.ctx.createImage2D(WebCL.CL_MEM_WRITE_ONLY, this.format, this.width, this.height, 0);
    this.kernel.setKernelArg (2, this.output);
    this.queue = this.ctx.createCommandQueue(this.devices[0], 0);
  }

  WebCL_.prototype.draw = function(fractal) {
     try {
      ctx_g = this.gradientcanvas.getContext("2d");
      var gradient = ctx_g.getImageData(0, 0, this.gradientcanvas.width, 1);

      //Pass additional args
      //this.kernel.setKernelArg (2, value, WebCL.types.FLOAT);
      var background = colours.palette.colours[0].colour;
      this.inBuffer[0] = fractal.origin.zoom;
      this.inBuffer[1] = fractal.origin.rotate;
      this.inBuffer[2] = fractal.origin.pixelSize(this.canvas);
      this.inBuffer[3] = fractal.origin.re;
      this.inBuffer[4] = fractal.origin.im;
      this.inBuffer[5] = fractal.selected.re;
      this.inBuffer[6] = fractal.selected.im;

      var inBuffer2 = new Int8Array([fractal.antialias, fractal.julia, fractal.perturb]);
      var inBuffer3 = new Int32Array([this.width, this.height]);

      var size = this.inBuffer.byteLength;
      this.queue.enqueueWriteBuffer(this.input, false, 0,          size, this.inBuffer, []);    
      this.queue.enqueueWriteBuffer(this.input, false, size,       4*4,  background.rgbaGL(), []);    
      this.queue.enqueueWriteBuffer(this.input, false, size+4*4,   3,    inBuffer2, []);    
      this.queue.enqueueWriteBuffer(this.input, false, size+4*4+3, 2*4,  inBuffer3, []);    

      this.queue.enqueueWriteImage(this.palette, false, [0,0,0], [gradient.width,1,1], gradient.width*4, 0, gradient.data, []);

      // Init ND-range
      consoleDebug("WebCL: Global (" + this.width + "x" + this.height + 
                   ") Local (" + this.local[0] + "x" + this.local[1] + ")");

      this.queue.enqueueNDRangeKernel(this.kernel, this.global.length, [], this.global, this.local, []);

      ctx_c = this.canvas.getContext("2d");
      var outImage = ctx_c.createImageData(this.width, this.height);

      this.queue.enqueueReadImage(this.output, false, [0,0,0], [this.width,this.height,1], 0, 0, outImage.data, []);

      this.queue.finish();

      ctx_c.putImageData(outImage, 0, 0);

    } catch(e) {
      alert(e.message);
      throw e;
    }
  }

