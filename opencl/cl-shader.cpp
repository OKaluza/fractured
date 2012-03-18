#include <stdlib.h>
#include <stdio.h>
#include <ctime>
#include <cstring>
#include <assert.h>

#define __NO_STD_VECTOR // Use cl::vector instead of STL version
#define __CL_ENABLE_EXCEPTIONS
#include "cl.hpp"

#include <iostream>
#include <utility>
#include <fstream>
#include <string>

#define real cl_double


//Defines a 32bit colour accessible as rgba byte array, integer and r,g,b,a component struct
typedef union {
   unsigned char rgbaval[4];
   int value;
   float fvalue;
   struct {
      unsigned char cr;
      unsigned char cg;
      unsigned char cb;
      unsigned char ca;
   };
} Colour;

typedef struct {
   cl_float r;
   cl_float g;
   cl_float b;
   cl_float a;
} rgba;

typedef struct {
   real re;
   real im;
} complex;

//Input data
typedef struct Input
{
  real zoom;
  real rotation;

  real pixelsize;
  complex origin;
  complex selected;
  rgba background;

  //Possibly a problem with size of int types
  cl_int antialias;
  cl_int julia;
  cl_int perturb;
} Input;

int main(int argc, char** argv)
{
  int width = 600, height = 600;

   if (argc < 2)
   {
     std::cerr << "Kernel filename required\n" << std::endl;
   }
   char* kernel_src = argv[1];

   if (argc > 3)
   {
      width = atoi(argv[2]);
      height = atoi(argv[3]);
   }

  //Setup input
  Input in;
  in.zoom = 0.5247772987195402;
  in.rotation = -70.0;
  in.pixelsize = 2.0 / (in.zoom * (real)width);
  in.origin.re = -0.9263184606675635;
  in.origin.im = 3.684094254315343;
  in.selected.re = -0.8355383350779051;
  in.selected.im = -0.04760480594534031,
  in.background.r = 0.0;
  in.background.g = 0.0;
  in.background.b = 0.0;
  in.background.a = 1.0;
  in.antialias = 3;
  in.julia = 1;
  in.perturb = 0;

  //Read binary ppm palette file
  Colour palette[1024];  //Palette image
  memset(palette, 255, 1024*sizeof(Colour));
  {
    char* path = "palette.ppm";
    FILE *fp = fopen(path, "rb");
    if (!fp) {printf("[read_ppm] File %s could not be opened for reading", path); return -1;}
    int pw = 1024; //, ph;
    //fscanf( fp, "P6%d%d255", pw, ph); //Ascii Header
    //Read RGB from first line of palette image
    int components = 3;
    printf("Reading %s\n", path);
    //assert(pw == 1024);
    for (int x=0; x<pw; x++)
       fread(&palette[x].rgbaval, components, 1, fp);
    fclose(fp);
  }

  //Calculate the pixels
  Colour* pixels = new Colour[width*height];
   printf("Plotting %d x %d...\n", width, height);

   try
   {
      // Get available platforms
      cl::vector<cl::Platform> platforms;
      cl::Platform::get(&platforms);

      // Select the default platform and create a context using this platform and the GPU
      cl_context_properties cps[3] =
      {
         CL_CONTEXT_PLATFORM,
         (cl_context_properties)(platforms[0])(),
         0
      };
      cl::Context context( CL_DEVICE_TYPE_GPU, cps);

      // Get a list of devices on this platform
      cl::vector<cl::Device> devices = context.getInfo<CL_CONTEXT_DEVICES>();
      std::cout << "Found " << devices.size() << " OpenCL devices" << std::endl;

      // Read source file
      std::ifstream sourceFile(kernel_src);
      std::string sourceCode(
         std::istreambuf_iterator<char>(sourceFile),
         (std::istreambuf_iterator<char>()));
      cl::Program::Sources source(1, std::make_pair(sourceCode.c_str(), sourceCode.length()+1));

      // Make program of the source code in the context
      cl::Program program = cl::Program(context, source);

      // Build program for these specific devices
      try {
        program.build(devices, ""); //"-DFP64");
      } catch(cl::Error& err) {
        // Get the build log
        std::cerr << "Build failed! " << err.what() << '(' << err.err() << ')' << std::endl;
        std::cerr << "retrieving  log ... " << std::endl;
        std::cerr << program.getBuildInfo<CL_PROGRAM_BUILD_LOG>(devices[0])	<< std::endl;
        exit(-1);
      }

      // Create command queue
      cl::CommandQueue queue;

      cl::Buffer input;
      cl::Image2D pal;
      cl::Image2D output;
      cl::Kernel kernel;
      cl::ImageFormat format = cl::ImageFormat(CL_RGBA, CL_UNSIGNED_INT8);

     queue = cl::CommandQueue( context, devices[0]);

     // Create memory buffers
     input = cl::Buffer(context, CL_MEM_READ_ONLY, sizeof(Input));
     pal = cl::Image2D(context, CL_MEM_READ_ONLY, format, 1024, 1);
     output = cl::Image2D(context, CL_MEM_WRITE_ONLY, format, width, height);

     // Copy input to the memory buffers
     cl::size_t<3> origin;
     origin[0] = origin[1] = origin[2] = 0;
     cl::size_t<3> pregion;
     pregion[0] = 1024;
     pregion[1] = 1;
     pregion[2] = 1;
     queue.enqueueWriteBuffer( input, CL_FALSE, 0, sizeof(Input), &in );
     queue.enqueueWriteImage( pal, CL_FALSE, origin, pregion, 0, 0, (void*)palette );

     // Make kernel
     kernel = cl::Kernel(program, "fractured");

      size_t localSize = kernel.getWorkGroupInfo< CL_KERNEL_WORK_GROUP_SIZE >(devices[0]);
      printf("Recommended size %d\n", localSize);

     // Set arguments to kernel
     kernel.setArg(0, input);
     kernel.setArg(1, pal);
     kernel.setArg(2, output);

     // Run the kernel on specific ND range
     cl::NDRange global(width, height);
     //cl::NDRange local(100, 100);
     queue.enqueueNDRangeKernel(kernel, cl::NullRange, global, cl::NullRange); //local);

     // Read buffer into result image 
     cl::size_t<3> fregion;
     fregion[0] = width;
     fregion[1] = height;
     fregion[2] = 1;
     queue.enqueueReadImage( output, CL_FALSE, origin, fregion, 0, 0, (void*)pixels );

     queue.finish();

   }
   catch(cl::Error error)
   {
      std::cout << error.what() << "(" << error.err() << ")" << std::endl;
   }

  //Write binary ppm file
  char* path = "frac.ppm";
  FILE *fp = fopen(path, "wb");
  if (!fp) {printf("[write_ppm] File %s could not be opened for writing", path); return -1;}
  fprintf( fp, "P6\n%d %d\n255\n", width, height); //Ascii Header
  //Write RGB
  int components = 3;
  printf("Writing %s\n", path);
  for (int y=0; y<height; y++)
    for (int x=0; x<width; x++)
      fwrite(pixels[y*width + x].rgbaval, sizeof(char) * components, 1, fp);
  fclose(fp);

  delete[] pixels;

  return 0;
}
