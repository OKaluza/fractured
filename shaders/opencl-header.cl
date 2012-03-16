//OpenCL specific header 
//(also need to search & replace all casts type() with c-style cast (type)() complex/real/rgba/int
#define OPENCL
#define real float
#define complex float2
#define RGB float3
#define rgba float4
#define in const
#define discard return (rgba)(0)

#define mod(a,b) fmod((real)a,(real)b)
#define abs(a) fabs(a)

//Palette lookup mu = [0,1]
__constant const sampler_t sampler = CLK_NORMALIZED_COORDS_TRUE | CLK_ADDRESS_REPEAT | CLK_FILTER_NEAREST;
#define gradient(mu) read_imagef(palette, sampler, (float2)(mu, 0.0))
#define sampler2D image2d_t

#define main_function() rgba calcpixel(complex coord, int antialias, bool julia, bool perturb, real pixelsize, complex dims, complex origin, complex selected, sampler2D palette, rgba background)
#define set_result(c) return c;

//Input data
typedef struct Input
{
  int blah;
} Input;

__kernel void fractured(__global struct Input* input, __global float4* output)
{
  //Loop over all pixels in range, calling calcpixel() on each
}

