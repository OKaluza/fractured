//--- OpenCL specific header --------------------------------------
#define OPENCL
#ifdef FP64
//Double precision
#pragma OPENCL EXTENSION cl_khr_fp64: enable
#pragma OPENCL EXTENSION cl_amd_fp64: enable
#define real double
#define complex double2
#else
//Single precision
#define real float
#define complex float2
#endif

#define rgba float4
#define in const
#define discard return (rgba)(0)

//Initialisers
//#define C(x,y) (complex)(x,y)
//Initialise complex,
//really strange problem when using (complex)(x,y) (eg: for power, passed to cpow() )
//setting components seems to work around it... (problem on NVIDIA Only)
complex C(in real x, in real y) { complex z; z.x = x; z.y = y; return z; }
#define R(x) (real)(x)

//Maths functions with alternate names
#define mod(a,b) fmod((real)a,(real)b)
#define abs(a) fabs(a)
#define inversesqrt(x) rsqrt(x)
#define PI  M_PI_F
#define E   M_E_F

//Palette lookup mu = [0,1]
__constant sampler_t sampler = CLK_NORMALIZED_COORDS_TRUE | CLK_ADDRESS_REPEAT | CLK_FILTER_NEAREST;
#define gradient(mu) read_palette(palette, mu)
rgba read_palette(image2d_t palette, float mu)
{
  uint4 p = read_imageui(palette, sampler, (float2)(mu, 0.0));
  return (rgba)(p.x/255.0, p.y/255.0, p.z/255.0, p.w/255.0); 
}

#define CALCPIXEL rgba calcpixel(int iterations, complex coord, complex offset, bool julia, real pixelsize, complex dims, complex origin, complex selected, image2d_t palette, rgba background, __global real* input)

#define set_result(c) return clamp(c, 0.0f, 1.0f);
CALCPIXEL;  //Prototype

complex rotate2d(complex v, real angle)
{
  const real Cos = cos(radians(angle));
  const real Sin = sin(radians(angle));
  return (complex)(v.x * Cos - v.y * Sin, v.x * Sin + v.y * Cos);
}

//Converts a set of pixel coords relative to element into
// a new fractal pos based on current fractal origin, zoom & rotate...
complex convert(int2 pos, int2 size, real zoom, real rotation)
{
   real half_w = size.x * 0.5;
   real half_h = size.y * 0.5;

   //Scale based on smallest dimension and aspect ratio
   real box = size.x < size.y ? size.x : size.y;
   real scalex = size.x / box;
   real scaley = size.y / box;

   real re = scalex * (pos.x - half_w) / (half_w * zoom);
   real im = scaley * (pos.y - half_h) / (half_h * zoom);

   //Apply rotation to selected point
   return rotate2d((complex)(re, im), -rotation);
}

__kernel void sample(
    read_only image2d_t palette, 
    __global float4* temp,
    __global real* input, 
    int antialias,
    int julia,
    int iterations,
    int width,
    int height,
    int j, int k)
{
  real zoom = input[0];
  real rotation = input[1];
  real pixelsize = input[2];
  complex origin = (complex)(input[3],input[4]);
  complex selected = (complex)(input[5],input[6]);
  rgba background = (rgba)(input[7],input[8],input[9],input[10]);

  int2 pos = (int2)(get_global_id(0), get_global_id(1));
  int2 size = (int2)(width, height);
  complex dims = (complex)(width, height);
  complex coord = origin + convert(pos, size, zoom, rotation);

  complex offset = (complex)((real)j/(real)antialias-0.5, (real)k/(real)antialias-0.5);
  rgba pixel = calcpixel(iterations, coord, offset, julia, pixelsize, 
                     dims, origin, selected, palette, background, input);

  if (j==0 && k==0) temp[get_global_id(1)*get_global_size(0)+get_global_id(0)] = (rgba)(0);
  temp[get_global_id(1)*get_global_size(0)+get_global_id(0)] += pixel;
}

__kernel void average(write_only image2d_t output, __global float4* temp, int passes)
{
  int2 pos = (int2)(get_global_id(0), get_global_id(1));
  rgba pixel = temp[get_global_id(1)*get_global_size(0)+get_global_id(0)];
  pixel /= (rgba)passes;
  write_imageui(output, (int2)(pos.x, pos.y), (uint4)(255*pixel.x,255*pixel.y,255*pixel.z,255*pixel.w));
}
