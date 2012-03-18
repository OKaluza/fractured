//OpenCL specific header 
//(also need to search & replace all casts type() with c-style cast (type)() complex/real/rgba/int
#ifdef FP64
//Double precision
#pragma OPENCL EXTENSION cl_khr_fp64: enable
#define real double
#define complex double2
#else
//Single precision
#define real float
#define complex float2
#endif

#define OPENCL
#define rgba float4
#define in const
#define discard return (rgba)(0)

//Functions with alternate names
#define mod(a,b) fmod((real)a,(real)b)
#define abs(a) fabs(a)
#define atan(a,b) atan2(a,b)

//Palette lookup mu = [0,1]
__constant const sampler_t sampler = CLK_NORMALIZED_COORDS_TRUE | CLK_ADDRESS_REPEAT | CLK_FILTER_NEAREST;
#define gradient(mu) read_palette(palette, mu)
rgba read_palette(image2d_t palette, float mu)
{
  uint4 p = read_imageui(palette, sampler, (float2)(mu, 0.0));
  return (rgba)(p.x/255.0, p.y/255.0, p.z/255.0, p.w/255.0); 
}

//---TESTING---

#ifdef TESTING  //use constant parameters
#define main_function() rgba calcpixel(complex coord, image2d_t palette)
#else
#define main_function() rgba calcpixel(complex coord, int antialias, bool julia, bool perturb, real pixelsize, complex dims, complex origin, complex selected, image2d_t palette, rgba background)
#endif

#define set_result(c) return c;
main_function();  //Prototype

//Input data
typedef struct __attribute__ ((packed)) Input
{
  real zoom;
  real rotation;

  real pixelsize;
  complex origin;
  complex selected;
  rgba background;

  int antialias;
  int julia;
  int perturb;
} Input;

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

__kernel void fractured(__global struct Input* input, read_only image2d_t palette, write_only image2d_t output)
{
  int2 pos = (int2)(get_global_id(0), get_global_id(1));
  int2 size = (int2)(get_global_size(0), get_global_size(1));
  complex dims = (complex)(size.x, size.y);

#ifdef TESTING
  complex coord = origin + convert(pos, size, zoom, rotation);
  rgba pixel = calcpixel(coord, palette); 
#else
  complex coord = input->origin + convert(pos, size, input->zoom, input->rotation);
  rgba pixel = calcpixel(coord, input->antialias, input->julia, input->perturb, input->pixelsize, 
                         dims, input->origin, input->selected, palette, input->background);
#endif

  write_imageui(output, (int2)(pos.x, pos.y), (uint4)(255*pixel.x,255*pixel.y,255*pixel.z,255*pixel.w));
}
