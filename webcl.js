  /**
   * @constructor
   */
  function WebCL(canvas) {
     this.canvas = canvas;
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
                        
     
     } catch(e) {
       alert(e.message);
       throw e;
     }
  }


  WebCL.prototype.initProgram = function(kernelSrc) {
    this.program = this.ctx.createProgramWithSource(kernelSrc);
    try {
      this.program.buildProgram ([this.devices[0]], "");
    } catch(e) {
      alert ("Failed to build WebCL program. Error "
             + program.getProgramBuildInfo (this.devices[0], WebCL.CL_PROGRAM_BUILD_STATUS)
             + ":  " 
             + program.getProgramBuildInfo (this.devices[0], WebCL.CL_PROGRAM_BUILD_LOG));
      throw e;
    }
    this.kernel = this.program.createKernel ("fractured");
    this.input = this.ctx.createBuffer(WebCL.CL_MEM_WRITE_ONLY, 4*14);  //14*float(assumes 4-byte float!)
      var format = {channelOrder:WebCL.CL_RGBA, channelDataType:WebCL.CL_UINT};
    this.palette = this.ctx.createImage2D(WebCL.CL_MEM_READ_ONLY, 1024, 1);
    this.output = this.ctx.createImage2D(WebCL.CL_MEM_WRITE_ONLY, canvas.width, canvas.height);
    this.kernel.setKernelArg (0, this.input);
    this.kernel.setKernelArg (1, this.palette);
    this.kernel.setKernelArg (2, this.output);
            
    this.queue = this.ctx.createCommandQueue(this.devices[0], 0);
    
  }

  WebCL.prototype.draw = function(fractal) {
    var gradientcanvas = document.getElementById('gradient');
    ctx_g = gradientcanvas.canvas.getContext("2d");
    var gradient = ctx_g.getImageData(0, 0, 1024, 1);

    //Pass additional args
    //this.kernel.setKernelArg (2, value, WebCL.types.FLOAT);
    var inBuffer = new Float32Array(14);
    var background = colours.palette.colours[0].colour;
    inBuffer[0] = fractal.origin.zoom;
    inBuffer[1] = fractal.origin.rotation;
    inBuffer[2] = fractal.origin.pixelSize(this.canvas);
    inBuffer[3] = fractal.origin.re;
    inBuffer[4] = fractal.origin.im;
    inBuffer[5] = fractal.selected.re;
    inBuffer[6] = fractal.selected.im;
    inBuffer[7] = background.red/255.0;
    inBuffer[8] = background.green/255.0;
    inBuffer[9] = background.blue/255.0;
    inBuffer[10] = background.alpha;
    inBuffer[11] = fractal.antialias;
    inBuffer[12] = fractal.julia;
    inBuffer[13] = fractal.perturb;

    this.queue.enqueueReadBuffer(this.input, false, 0, 4*14, inBuffer, []);    

    this.queue.enqueueWriteImage(this.palette, false, [0,0,0], [1024,1,1], 0, 0, gradient, []);

    // Init ND-range
    var localWS = [0,0];
    var globalWS = [ canvas.width, canvas.height ];

    this.queue.enqueueNDRangeKernel(this.kernel, globalWS.length, [], globalWS, localWS, []);

    ctx_c = this.canvas.getContext("2d");
    var outImage = ctx_c.createImageData(canvas.width, canvas.height);

    this.queue.enqueueReadImage(this.output, false, [0,0,0], [canvas.width,canvas.height,1], 0, 0, outImage, []);

    this.queue.finish();

    ctx_c.putImageData(outImage, 0, 0);

  }

/*
var ctx_c, imgd, nc = 30, maxCol = nc*3, cr,cg,cb;

function init_pix() {
   var canvas = document.getElementById("canvas");
   if (!canvas.getContext) return;
   ctx_c = canvas.getContext("2d");
   var st = 255/nc;
   cr = new Array(maxCol); cg = new Array(maxCol); cb = new Array(maxCol);
   for (var i = 0; i < nc; i++){
     var d = Math.floor(st*i);
     cr[i] = 255 - d;  cr[i+nc] = 0;  cr[i+2*nc] = d;
     cg[i] = d;  cg[i+nc] = 255 - d;  cg[i+2*nc] = 0;
     cb[i] = 0;  cb[i+nc] = d;  cb[i+2*nc] = 255 - d;
   }
   cr[maxCol] = cg[maxCol] = cb[maxCol] = 0;
   imgd = ctx_c.createImageData(512, 512);
}

function CL_mandelbrot () {
  try {
    if (window.WebCL == undefined) {
      alert("Unfortunately your system does not support WebCL");
      return false;
    }

    var n = 512;
    init_pix();
    var platforms = WebCL.getPlatformIDs();
    var ctx = WebCL.createContextFromType ([WebCL.CL_CONTEXT_PLATFORM, 
                                            platforms[0]],
                                           WebCL.CL_DEVICE_TYPE_DEFAULT);
    var devices = ctx.getContextInfo(WebCL.CL_CONTEXT_DEVICES);
                     
    var kernelSrc = loadKernel("clProgramMandelbrot");
    var program = ctx.createProgramWithSource(kernelSrc);
    try {
      program.buildProgram ([devices[0]], "");
    } catch(e) {
      alert ("Failed to build WebCL program. Error "
             + program.getProgramBuildInfo (devices[0], 
                                            WebCL.CL_PROGRAM_BUILD_STATUS)
             + ":  " 
             + program.getProgramBuildInfo (devices[0], 
                                            WebCL.CL_PROGRAM_BUILD_LOG));
      throw e;
    }
    var kernel = program.createKernel ("ckMandelbrot");
    var bufMax = ctx.createBuffer (WebCL.CL_MEM_WRITE_ONLY, 4*n*n);
    kernel.setKernelArg (0, bufMax);
    kernel.setKernelArg (1, 10000*300, WebCL.types.FLOAT);
            
    var cmdQueue = ctx.createCommandQueue (devices[0], 0);
    
    // Init ND-range
    var localWS = [8,8];
    var globalWS = [ n, n ];

    cmdQueue.enqueueNDRangeKernel(kernel, globalWS.length, [], globalWS, localWS, []);
    var outBuffer = new Int32Array(4*n*n);
    cmdQueue.enqueueReadBuffer (bufMax, false, 0, 4*n*n, outBuffer, []);    
    cmdQueue.finish ();

 var pix = imgd.data, c = 0, ic;
 for (var t = 0; t < 512*512; t++) {
   var i = outBuffer[t];
   if (i == 512) ic = maxCol;
   else ic = i % maxCol;
   pix[c++] = cr[ic];  pix[c++] = cg[ic];  pix[c++] = cb[ic];  pix[c++] = 255;
 }
 ctx_c.putImageData(imgd, 0, 0);

  
  } catch(e) {
    alert(e.message);
    throw e;
  }
}

#ifdef cl_khr_fp64
#pragma OPENCL EXTENSION cl_khr_fp64 : enable
#else
#pragma OPENCL EXTENSION cl_amd_fp64 : enable
#endif

__constant int test = 0;   //Read only

#define real float

  __kernel void ckMandelbrot(__global int* max, float scale){
    int x = get_global_id(0),  y = get_global_id(1);
    real Cr = (x - 256) / scale + .407476;
    real Ci = (y - 256) / scale + .234204;
    real I=0, R=0,  I2=0, R2=0;
    int n=0;
    while ( (R2+I2 < 2.) && (n < 512) ){
      I=(R+R)*I+Ci;  R=R2-I2+Cr;  R2=R*R;  I2=I*I;  n++;
    }
    max[y*512 + x] = n;
  }
*/


