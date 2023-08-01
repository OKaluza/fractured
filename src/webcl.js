  /**
   * OpenCL: WebCL interface object
   * manage WebCL context, building OpenCL kernels and rendering fractals
   * (c) Owen Kaluza 2012
   */

  /**
   * @constructor
   */
  function OpenCL(pid, devid) {
    if (devid == undefined) devid = 0;
    this.pid = pid;
    this.devid = devid;
    this.fp64avail = this.fp64 = false;
    this.timer = null;

    if (!window.webcl) throw "No WebCL interface";
    if (!webcl.getPlatforms) throw "Unknown WebCL interface";
    try {
      this.platforms = webcl.getPlatforms();
    } catch (e) {
      print("detectCL exception: " + e);
      throw "No OpenCL drivers available"
    }

    //Get & select default platforms, devices (if not supplied)
    if (this.platforms.length<1) throw "No OpenCL platforms found!";
    if (!this.pid || this.pid >= this.platforms.length) this.pid = 0;
    this.devices = this.platforms[this.pid].getDevices(WebCL.DEVICE_TYPE_ALL);
    if (this.devices.length<1) throw "No OpenCL devices found!";
    if (!this.devid) this.devid = 0;

    //Alternative createContext with list of devices...
    this.devices = this.platforms[this.pid].getDevices(WebCL.CL_DEVICE_TYPE_ALL);
    //this.devices = this.platforms[this.pid].getDevices(WebCL.CL_DEVICE_TYPE_GPU);
    //this.devices = this.platforms[this.pid].getDevices(WebCL.CL_DEVICE_TYPE_CPU);
    if (this.devid >= this.devices.length) this.devid = this.devices.length-1;
    //Create the context
    //this.ctx = webcl.createContext({devices : this.devices, platform : this.platforms[this.pid]});
    this.ctx = webcl.createContext(this.devices);
    
    debug("Using: " + this.platforms[this.pid].getInfo(WebCL.PLATFORM_NAME) + " (" + this.platforms[this.pid] + ")" +  
                " - " + this.devices[this.devid].getInfo(WebCL.DEVICE_NAME) + " (" + this.devices[this.devid] + ")");

    //Check for double precision support
    var extensions = this.platforms[this.pid].getInfo(WebCL.PLATFORM_EXTENSIONS);
    extensions += " " + this.devices[this.devid].getInfo(WebCL.DEVICE_EXTENSIONS);
    if (/cl_khr_fp64|cl_amd_fp64/i.test(extensions))
      this.fp64avail = true; //Availability of fp64 support
    debug("WebCL ready, extensions: " + extensions);
    //Get max threads
    this.maxsize = this.devices[this.devid].getInfo(WebCL.DEVICE_MAX_WORK_GROUP_SIZE);
  }

  OpenCL.prototype.populateDevices = function(select) {
    //Clear & repopulate platforms+devices select list
    if (!select || !select.options) return;
    this.pfstrings = "";  //Info about available devices for debugging
    select.options.length = 0;
    for (var p=0; p<this.platforms.length; p++) {
      var plat = this.platforms[p];
      var pfname = '#' + (p+1) + ' ' + plat.getInfo(WebCL.PLATFORM_NAME);
      //Store debugging info about platforms found
      this.pfstrings += "+" + /^[^\s]*/.exec(pfname)[0];
      var devices = plat.getDevices(WebCL.DEVICE_TYPE_ALL);
      for (var d=0; d < devices.length; d++) {
        var name = devices[d].getInfo(WebCL.DEVICE_NAME) + ' (' + pfname + ')';
        select.options[select.length] = new Option(name, JSON.stringify({"platform" : p, "device" : d}));
        if (p == this.pid && d == this.devid) select.selectedIndex = select.length-1;
        //Store debugging info about devices found
        var dtype = devices[d].getInfo(WebCL.DEVICE_TYPE);
        if (dtype == WebCL.DEVICE_TYPE_CPU)
          this.pfstrings += "-C"; 
        else if (dtype == WebCL.DEVICE_TYPE_GPU)
          this.pfstrings += "-G";
        else
          this.pfstrings += "-O";
      }
    }
    if (select.selectedIndex < 0) select.selectedIndex = 0;
  }

  OpenCL.prototype.init = function(canvas, fp64, threads, gradient) {
    this.canvas = canvas;
    this.gradientcanvas = gradient;
    this.threads = threads;
    //Check thread size
    if (threads*threads > this.maxsize) {
      this.threads = Math.floor(Math.sqrt(this.maxsize));
      debug("#too many threads " + threads + " ( " + (threads*threads) + ") --> max size: " + this.maxsize);
      debug("#Adjusted to " + this.threads + " ( " + (this.threads*this.threads) + ") --> max size: " + this.maxsize);
    }
    this.setPrecision(fp64);

    /*var w = this.devices[this.devid].getInfo(WebCL.DEVICE_IMAGE2D_MAX_WIDTH);
    var h = this.devices[this.devid].getInfo(WebCL.DEVICE_IMAGE2D_MAX_HEIGHT);
    var sizes = this.devices[this.devid].getInfo(WebCL.DEVICE_MAX_WORK_ITEM_SIZES);
    debug("DEVICE IMAGE MAX: " + w + " x " + h);
    debug("DEVICE MAX SIZES: " + JSON.stringify(sizes));*/

    //Setup image format descriptor
    this.format = {
      channelOrder : WebCL.RGBA,
      channelDataType : WebCL.UNSIGNED_INT8,
      width : this.gradientcanvas.width,
      height : 1,
      rowPitch: 0
    }
    //debug(JSON.stringify(this.format));
    //var webCLImageDescriptor = this.ctx.getSupportedImageFormats(WebCL.MEM_READ_ONLY, this.gradientcanvas.width, 1);
    //this.format = {width:this.gradientcanvas.width, height:1, channelOrder:webCLImageDescriptor[0].channelOrder, channelType:webCLImageDescriptor[0].channelType};

    //this.palette = this.ctx.createImage(WebCL.MEM_READ_ONLY, this.format, this.format.width, this.format.height, 0);
    this.palette = this.ctx.createImage(WebCL.MEM_READ_ONLY, this.format);
    this.queue = this.ctx.createCommandQueue(this.devices[this.devid], 0);
    this.ctx2d = canvas.getContext("2d");
    this.setViewport(0, 0, canvas.width, canvas.height);
  }

  OpenCL.prototype.setPrecision = function(fp64) {
    this.fp64 = (fp64 == true && this.fp64avail);
    this.paramBuffer = this.fp64 ? new Float64Array(128) : new Float32Array(128);
    this.params = this.ctx.createBuffer(WebCL.MEM_READ_ONLY, this.paramBuffer.byteLength);
  }

  OpenCL.prototype.buildProgram = function(kernelSrc) {
    if (this.timer) {clearTimeout(this.timer); this.timer = null;}
    if (!this.ctx) return;
    if (this.fp64) kernelSrc = "#define FP64\n" + kernelSrc;

    this.program = this.ctx.createProgram(kernelSrc);
    try {
      var options = "-cl-no-signed-zeros -cl-mad-enable -cl-fast-relaxed-math"
      this.program.build([this.devices[this.devid]], options);
      debug("<hr>" + this.program.getBuildInfo(this.devices[this.devid], WebCL.PROGRAM_BUILD_LOG) + "<hr>");
    } catch(e) {
      throw "Failed to build WebCL program. Error "
            + this.program.getBuildInfo(this.devices[this.devid], WebCL.PROGRAM_BUILD_STATUS)
            + ":  " 
            + this.program.getBuildInfo(this.devices[this.devid], WebCL.PROGRAM_BUILD_LOG);
    }
    this.k_sample = this.program.createKernel("sample");
    this.k_sample.setArg(0, this.palette);
    this.k_sample.setArg(2, this.params);
    if (this.temp) this.k_sample.setArg(1, this.temp);
    this.k_average = this.program.createKernel("average");
    if (this.output) this.k_average.setArg(0, this.output);
    if (this.temp) this.k_average.setArg(1, this.temp);
  }

  //Calculates global work size given problem size and thread count
  OpenCL.prototype.getGlobalSize = function(n, threads) {
    return threads * Math.ceil(n/threads);
  }

  //OpenCL.prototype.sizeChanged = function(width, height) {
  OpenCL.prototype.setViewport = function(x, y, width, height) {
    //Clear canvas first
    if (!this.ctx2d) {debug("SetViewport: No 2d context!"); return;}
    this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //Adjust global size to at least [width][height], ensuring is a multiple of work-group size
    this.local = [this.threads, this.threads];
    this.global = [this.getGlobalSize(width, this.threads), this.getGlobalSize(height, this.threads)];
    debug("Global size " + this.global + " threads " + this.threads + " ( " + (this.threads*this.threads) + ") --> max size: " + this.maxsize);
    if (this.global[0] <= 0 || this.global[1] <- 0) return;

    //If width and height changed, recreate output buffer
    if (!this.viewport || this.viewport.width != width || this.viewport.height != height) {
      this.viewport = new Viewport(x, y, width, height);
      this.format.width = this.global[0];
      this.format.height = this.global[1];
      this.output = this.ctx.createImage(WebCL.MEM_WRITE_ONLY, this.format);
      //this.output = this.ctx.createImage(WebCL.MEM_WRITE_ONLY, this.format, this.format.width, this.format.height, 0);
      this.temp = this.ctx.createBuffer(WebCL.MEM_READ_WRITE, this.global[0]*this.global[1] * 4*4);
      if (this.k_sample) this.k_sample.setArg (1, this.temp);
      if (this.k_average) this.k_average.setArg(0, this.output);
      if (this.k_average) this.k_average.setArg(1, this.temp);
    } else {
      this.viewport.x = x;
      this.viewport.y = y;
    }
  }

  OpenCL.prototype.draw = function(fractal, antialias, background) {
    if (!this.k_sample) return; //Sanity checks
    if (this.global[0] <= 0 || this.global[1] <= 0) return;
    if (this.timer) {clearTimeout(this.timer); this.timer = null;}
    if (antialias == undefined) antialias = 1;
    this.antialias = antialias;
    if (!this.queue) return;
    try {
      ctx_g = this.gradientcanvas.getContext("2d");
      this.outImage = this.ctx2d.createImageData(this.global[0], this.global[1]);
      var gradient = ctx_g.getImageData(0, 0, this.gradientcanvas.width, 1);

      //Pass additional args
      this.paramBuffer[0] = fractal.position.zoom;
      this.paramBuffer[1] = fractal.position.rotate;
      this.paramBuffer[2] = fractal.position.pixelSize(this.canvas);
      this.paramBuffer[3] = fractal.position.re;
      this.paramBuffer[4] = fractal.position.im;
      this.paramBuffer[5] = fractal.selected.re;
      this.paramBuffer[6] = fractal.selected.im;
      //Background
      this.paramBuffer[7] = background.red/255.0;
      this.paramBuffer[8] = background.green/255.0;
      this.paramBuffer[9] = background.blue/255.0;
      this.paramBuffer[10] = background.alpha;

      this.k_sample.setArg(3, new Int32Array([antialias]));
      this.k_sample.setArg(4, new Int32Array([(fractal.julia) ? 1 : 0]));
      this.k_sample.setArg(5, new Int32Array([fractal.iterations]));
      this.k_sample.setArg(6, new Int32Array([this.viewport.width]));
      this.k_sample.setArg(7, new Int32Array([this.viewport.height]));

      //Copy parameter variables to input buffer
      for (var i=0; i<fractal.paramvars.length; i++)
        this.paramBuffer[11+i] = fractal.paramvars[i];

      this.queue.enqueueWriteBuffer(this.params, false, 0, this.paramBuffer.byteLength, this.paramBuffer);

      //this.queue.enqueueWriteImage(this.palette, false, [0,0,0], [gradient.width,1,1], 0, 0, gradient.data, []);
      //this.queue.enqueueWriteImage(this.palette, false, [0,0,0], [gradient.width,1,1], 0, gradient.data)
      this.queue.enqueueWriteImage(this.palette, false, [0,0], [gradient.width,1], 0, gradient.data);

      // Init ND-range
      debug("WebCL: Global (" + this.global[0] + "x" + this.global[1] + 
                   ") Local (" + this.local[0] + "x" + this.local[1] + ")");

      this.j = 0;
      this.k = 0;
      this.pass();

    } catch(e) {
      alert("Draw: " + e.message);
      throw e;
    }
  }

  OpenCL.prototype.pass = function() {
    //debug("Antialias pass ... " + this.j + " - " + this.k);
    this.k_sample.setArg(8, new Int32Array([this.j]));
    this.k_sample.setArg(9, new Int32Array([this.k]));
    //debug("Dims: " + this.global.length + " Global: " + JSON.stringify(this.global) + " Local: " + JSON.stringify(this.local));
    try {
      this.queue.enqueueNDRangeKernel(this.k_sample, this.global.length, null, this.global, this.local);
    } catch (e) {  //Some devices/implementations don't like the local size specified
      this.queue.enqueueNDRangeKernel(this.k_sample, this.global.length, null, this.global);
    }

    //Combine
    this.k_average.setArg(2, new Int32Array([this.j*this.antialias+this.k+1]));
    try {
      this.queue.enqueueNDRangeKernel(this.k_average, this.global.length, null, this.global, this.local);
    } catch (e) {  //Some devices/implementations don't like the local size specified
      this.queue.enqueueNDRangeKernel(this.k_average, this.global.length, null, this.global);
    }

    //  var outBuffer = new Float32Array(this.global[0]*this.global[1]*4);
    //  this.queue.enqueueReadBuffer(this.temp, false, 0, outBuffer.byteLength, outBuffer);

    this.queue.enqueueReadImage(this.output, false, [0,0],
         [this.global[0],this.global[1]], 0, this.outImage.data);
         //[this.global[0],this.global[1],1], 0, 0, this.outImage.data, []);

    //Run everything
    this.queue.finish();

    //alert(outBuffer[0] + "," + outBuffer[1] + "," + outBuffer[2] + "," + outBuffer[3] + "," + outBuffer[4]);
    //alert(this.outImage.data.byteLength);
    //alert(this.outImage.data[0] + "," + this.outImage.data[1] + "," + this.outImage.data[2] + "," + this.outImage.data[3] + "," + this.outImage.data[4]);

    this.ctx2d.putImageData(this.outImage, this.viewport.x, this.viewport.y);

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
        //window.requestAnimationFrame(function () {that.pass();});
      }
    } else {
      this.timer = null;
      if (this.time) this.time.print("Draw");
    }
  }

  OpenCL.prototype.free = function() {
    if (this.ctx)
      this.ctx.releaseAll();
  }

