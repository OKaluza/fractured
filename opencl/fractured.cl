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

#define main_function() rgba calcpixel(complex coord, int antialias, bool julia, bool perturb, real pixelsize, complex dims, complex origin, complex selected, image2d_t palette, rgba background)
#define set_result(c) return c;
main_function();  //Prototype

//Input data
typedef struct __attribute__ ((packed)) Input
{
  real zoom;
  real rotate;

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
complex convert(int2 pos, int2 size, real zoom, real rotate)
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
   return rotate2d((complex)(re, im), -rotate);
}

__kernel void fractured(__global struct Input* input, read_only image2d_t palette, write_only image2d_t output)
{
  int2 pos = (int2)(get_global_id(0), get_global_id(1));
  int2 size = (int2)(get_global_size(0), get_global_size(1));
  complex dims = (complex)(size.x, size.y);

  complex coord = input->origin + convert(pos, size, input->zoom, input->rotate);
  rgba pixel = calcpixel(coord, input->antialias, input->julia, input->perturb, input->pixelsize, 
                         dims, input->origin, input->selected, palette, input->background);

  write_imageui(output, (int2)(pos.x, pos.y), (uint4)(255*pixel.x,255*pixel.y,255*pixel.z,255*pixel.w));
}

//Complex maths library prototypes
real __OVERLOADABLE__ inv(in real r);
real __OVERLOADABLE__ neg(in real x);
real __OVERLOADABLE__ sqr(in real x);
real __OVERLOADABLE__ cube(in real x);
//Complex number functions
complex __OVERLOADABLE__ add(in complex a, in complex b);
complex __OVERLOADABLE__ add(in real a, in complex b);
complex __OVERLOADABLE__ add(in complex a, in real b);
complex __OVERLOADABLE__ add(in real a, in real b);
complex __OVERLOADABLE__ sub(in complex a, in complex b);
complex __OVERLOADABLE__ sub(in real a, in complex b);
complex __OVERLOADABLE__ sub(in complex a, in real b);
complex __OVERLOADABLE__ sub(in real a, in real b);
complex __OVERLOADABLE__ mul(in complex a, in complex b);
complex __OVERLOADABLE__ mul(in real a, in complex b);
complex __OVERLOADABLE__ mul(in complex a, in real b);
complex __OVERLOADABLE__ mul(in real a, in real b);
complex __OVERLOADABLE__ div (in complex z, in complex w);
complex __OVERLOADABLE__ div(in real a, in complex b);
complex __OVERLOADABLE__ div(in complex a, in real b);
complex __OVERLOADABLE__ div(in real a, in real b);
complex __OVERLOADABLE__ inv(in complex z);
complex __OVERLOADABLE__ cpow(in real base, in real exponent);
complex __OVERLOADABLE__ cpow(in real base, in complex exponent);
complex __OVERLOADABLE__ cpow(in complex base, in real exponent);
complex __OVERLOADABLE__ cpow(in complex base, in complex exponent);
complex __OVERLOADABLE__ loge(in real r);
complex __OVERLOADABLE__ loge(in complex z);
complex __OVERLOADABLE__ log10(in complex z);
complex __OVERLOADABLE__ cexp(in complex z);
complex __OVERLOADABLE__ csin(in complex z);
complex __OVERLOADABLE__ ccos(in complex z);
complex __OVERLOADABLE__ ctan(in complex z);
complex __OVERLOADABLE__ casin(in complex z);
complex __OVERLOADABLE__ cacos(in complex z);
complex __OVERLOADABLE__ catan(in complex z);
complex __OVERLOADABLE__ csinh(in complex z);
complex __OVERLOADABLE__ ccosh(in complex z);
complex __OVERLOADABLE__ ctanh(in complex z);
complex __OVERLOADABLE__ casinh(in complex z);
complex __OVERLOADABLE__ cacosh(in complex z);
complex __OVERLOADABLE__ catanh(in complex z);
complex __OVERLOADABLE__ csqrt(in complex z);
complex __OVERLOADABLE__ neg(in complex z);
complex __OVERLOADABLE__ conj(in complex z);
complex __OVERLOADABLE__ polar(in real r, in real theta);
complex __OVERLOADABLE__ trunc(in complex z);
complex __OVERLOADABLE__ round(in complex z);
complex __OVERLOADABLE__ flip(in complex z);
complex __OVERLOADABLE__ sqr(in complex z);
complex __OVERLOADABLE__ cube(in complex z);
bool __OVERLOADABLE__ equals(complex z1, complex z2, real tolerance);
real __OVERLOADABLE__ manhattan(in complex z);
real __OVERLOADABLE__ norm(in complex z);
real __OVERLOADABLE__ cabs(in real x);
real __OVERLOADABLE__ cabs(in complex z);
real __OVERLOADABLE__ arg(in complex z);
real __OVERLOADABLE__ imag(in complex z);

//Additional maths functions
#define R(x) (real)(x)
#define C(x) (complex)((real)(x),0.0)
#define CI(x) (complex)(0.0,(real)(x))
#define I (complex)(0.0,1.0)
#define ident(args) args
#define zero(args) 0
#define czero(args) (complex)(0.0,0.0)

#define PI  R(3.141592654)
#define E   R(2.718281828)

main_function()
{
  //Globals
  complex z;
  complex c;
  complex pixel;      //Current pixel coord
  complex z_1;        //Value of z(n-1)
  complex z_2;        //Value of z(n-2)
  int maxiterations;  //Number of iterations to perform
  int count = 0;      //Step counter

    //Base parameter definitions
  //Iterations
  const int iterations = 98;
  //Repeat (Outside)
  const real outrepeat = 1.0;
  //Repeat (Inside)
  const real inrepeat = 15.4;
  //Vary Iterations
  const real vary = 0.0;
  //Z function
  #define post_transform_z_fn(args) ident(args)
  //Real function
  #define post_transform_re_fn(args) abs(args)
  //Imag function
  #define post_transform_im_fn(args) abs(args)
  //Induct on
  const int post_transform_induct_on = 0;
  //Induction
  const complex post_transform_induct = (complex)(-0.4,0.4);
  //N (apply every)
  const int post_transform_N = 1;
  //Circle limit
  const real post_transform_circle = 0.0;
  //Compatibility mode
  const bool post_transform_compat = false;
  //Magnet3
  // similar to kleinien group / mobius transform arangement:
  // Mobius transorm z = az^2 + b / cz^2 + d

  //z(n+1) =
  #define znext add(div(add(mul(A,sqr(z)),B),sub(mul(C,sqr(z)),D)),c)
  //Power (p)
  const real p = 2.0;
  const complex A = (complex)(1.001,-0.10900000000000008);
  const complex B = (complex)(1.0,0.0);
  const complex C = (complex)(1.0,0.0);
  const complex D = (complex)(1.0,0.0);
  //Bailout Test
  #define bailtest(args) norm(args)
  //Escape
  const real escape = 100.0;
  //Converge
  const real converge = 0.00005;

    bool converged;
  //Triangle Inequality
  //Power
  #define inside_colour_power p
  //Bailout
  #define inside_colour_bailout escape

  real inside_colour_il, inside_colour_lp;
  real inside_colour_sum = 10.0;
  real inside_colour_sum2 = 5.0;
  real inside_colour_ac = 0.0;
  

  rgba result_colour = (rgba)(0.0,0.0,0.0,0.0);
  rgba colour = (rgba)(0.0,0.0,0.0,0.0);

  
    inside_colour_il = 1.0/log(inside_colour_power);  //Inverse log of (power).  
    inside_colour_lp = log(log(inside_colour_bailout)/2.0);
  

  //Largest dimension
  real dim = dims.y > dims.x ? dims.y : dims.x;
  //Get radius in pixels
  real radius = 0.5 * dim * pixelsize;
  //Get distance from current coord to origin
  real len = cabs(coord - origin) / radius;  
    
  //Variable iterations?
  if (vary > 0.0)
  {
    //Vary in circle of 1/2 pixelsize radius
    real d = 1.0 + len * vary;
    maxiterations = (int)(d * (real)(iterations));
  }
  else
    maxiterations = iterations;
  
  
    //HACK for old fractals
    if (post_transform_compat)
      maxiterations--;
  
    
  float inc = pixelsize / (real)(antialias); //Width of variable over fragment
  for (int j=0; j<16; j++)
  {
    if (j >= antialias) break;
    for (int k=0; k<16; k++)
    {
      if (k >= antialias) break;
      //Reset fractal
      pixel = coord + (complex)((real)(k)*inc, (real)(j)*inc);

          

      if (julia)
      {
        //Julia set default
        z = pixel;
        c = selected;
      }
      else
      {
        //Mandelbrot set default
        if (perturb) 
          z = selected; //Perturbation
        else
          z = (complex)(0,0);
        c = pixel;
      }
      z_1 = z_2 = (complex)(0,0);

      //Formula specific reset...
      
      //Circle limit
      if (post_transform_circle > 0.0 && len > post_transform_circle) discard;

      inside_colour_sum = 0.0;
      inside_colour_sum2 = 0.0;
      inside_colour_ac = cabs(c);
    

      //Iterate the fractal formula
      //(Loop counter can only be compared to constant in GL ES 2.0)
      bool in_set = true;
      for (int i=0; i <= iterations*2; i++)
      {
        //Update z(n-2)
        z_2 = z_1;
        //Save current z value for z(n-1)
        z_1 = z;

        //Run next calc step
        count = i;
        //z = znext;
        
        z = znext;

        //Apply every N steps
        if (post_transform_N <= 1 || mod((real)(count),(real)(post_transform_N)) == 0.0)
        {
          //Apply induction, on z(n-1) (*) or z(n-2) ()
          if (post_transform_induct_on > 0)
          {
            if (post_transform_induct_on == 1)
              z += mul(z_1, post_transform_induct);
            else if (post_transform_induct_on == 2)
              z += mul(z_2, post_transform_induct);
          }

          //Apply separate functions to real/imaginary components
          z = post_transform_z_fn(z);
          z = (complex)(post_transform_re_fn(z.x), post_transform_im_fn(z.y));

          //HACK for old fractals!
          if (post_transform_compat)  
            count++;
        }
      

        
        bool escaped = bailtest(z) > escape;
      
        
        //Converge test
        converged = bailtest(z-(complex)(1,0)) < converge;
      

        //Check bailout conditions
        if (escaped || converged)
        {
          in_set = false;
          break;
        }

        //Colour calcs...
        
        inside_colour_sum2 = inside_colour_sum;
        if (count > 0)
        {
          real az2 = cabs(z - c);
          real lowbound = abs(az2 - inside_colour_ac);
          inside_colour_sum += (cabs(z) - lowbound) / (az2 + inside_colour_ac - lowbound);
        }
      

        //Check iterations remain
        if (i == maxiterations) break;
      }

      if (in_set)
      {
        //Inside colour: normalised colour index [0,1]
        real repeat = inrepeat;
        
        inside_colour_sum /= (real)(count);
        inside_colour_sum2 /= (real)(count-1);
          //Fractured version!
          complex x1 = loge((complex)(log(cabs(z))));
          real f = inside_colour_il * (inside_colour_lp - x1.x);
        //Correct version:
        //real f = inside_colour_il * (inside_colour_lp - log(log(cabs(z))));
        real idx = inside_colour_sum2 + (inside_colour_sum - inside_colour_sum2) * (f+1.0);
        colour = gradient(repeat * idx);

      
      }
      else
      {
        //Outside colour: normalised colour index [0,1]
        real repeat = outrepeat;
        
        colour = background;
      
      }

      result_colour += colour;
    }
  }
  
  //Average to get final colour
  set_result(result_colour / (float)(antialias*antialias));
}


complex __OVERLOADABLE__ add(in complex a, in complex b) {return a + b;}
complex __OVERLOADABLE__ add(in real a, in complex b) {return C(a) + b;}
complex __OVERLOADABLE__ add(in complex a, in real b) {return a + C(b);}
complex __OVERLOADABLE__ add(in real a, in real b)    {return C(a + b);}
complex __OVERLOADABLE__ sub(in complex a, in complex b) {return a - b;}
complex __OVERLOADABLE__ sub(in real a, in complex b) {return C(a) - b;}
complex __OVERLOADABLE__ sub(in complex a, in real b) {return a - C(b);}
complex __OVERLOADABLE__ sub(in real a, in real b)    {return C(a - b);}

complex __OVERLOADABLE__ mul(in complex a, in complex b)
{
  return (complex)(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

complex __OVERLOADABLE__ mul(in real a, in complex b) {return a * b;}
complex __OVERLOADABLE__ mul(in complex a, in real b) {return a * b;}
complex __OVERLOADABLE__ mul(in real a, in real b) {return C(a * b);}

complex __OVERLOADABLE__ div(in complex z, in complex w)
{
  //real conj = w.x*w.x + w.y*w.y;
  //complex res = (complex)(z.x*w.x + z.y*w.y, z.y*w.x - z.x*w.y);
  //return res / conj;
  return (complex)(dot(z,w), z.y*w.x - z.x*w.y) / dot(w,w);
}

complex __OVERLOADABLE__ div(in real a, in complex z) //{return div(C(a), z);}
{
  return (complex)(a*z.x, -a*z.y) / dot(z,z);
}

complex __OVERLOADABLE__ div(in complex z, in real a) //{return div(z, C(a));}
{
  return (complex)(z.x*a, z.y*a) / (a*a);
}

complex __OVERLOADABLE__ div(in real a, in real b)    {return C(a / b);}

complex __OVERLOADABLE__ inv(in complex z)
{
  //1.0 / z
  //return (complex)(z.x, -z.y) / dot(z,z);
  return conj(z) / norm(z);
}

real __OVERLOADABLE__ inv(in real r) {return 1.0/r;}

complex __OVERLOADABLE__ loge(in complex z)
{
  return (complex)(log(cabs(z)), arg(z));
}

complex __OVERLOADABLE__ log10(in complex z)
{
  return loge(z) / loge(C(10));
}

#ifdef GLSL
real __OVERLOADABLE__ log10(in real r)
{
  return log(r) / log(10.0);
}
#endif

complex __OVERLOADABLE__ loge(in real r)
{
  if (r < 0.0)
    return (complex)(log(-r), PI);
  else
    return (complex)(log(r), 0.0);
}

real __OVERLOADABLE__ manhattan(in complex z)
{
  return abs(z.x) + abs(z.y);
}

real __OVERLOADABLE__ norm(in complex z)
{
  return dot(z,z);
}

real __OVERLOADABLE__ cabs(in real x) {return abs(x);}

//complex abs = length/magnitude = sqrt(norm) = sqrt(dot(z,z))
real __OVERLOADABLE__ cabs(in complex z)
{
  return length(z); //sqrt(dot(z,z));
}

real __OVERLOADABLE__ arg(in complex z)
{
  return atan(z.y,z.x);
}

real __OVERLOADABLE__ neg(in real x)
{
  return -x;
}

real __OVERLOADABLE__ sqr(in real x)
{
  return x*x;
}

real __OVERLOADABLE__ cube(in real x)
{
  return x*x*x;
}

complex __OVERLOADABLE__ neg(in complex z)
{
  return z * R(-1.0);
}

complex __OVERLOADABLE__ conj(in complex z)
{
  return (complex)(z.x, -z.y);
}

complex __OVERLOADABLE__ polar(in real r, in real theta)
{
  if (r < 0.0)
  {
    return (complex)(r * cos(mod(theta+PI, R(2.0*PI))), -r * sin(theta));    
  }
  return (complex)(r * cos(theta), r * sin(mod(theta, R(2.0*PI))));
}

complex __OVERLOADABLE__ cpow(in real base, in real exponent)
{
  return C(pow(base, exponent));
}

complex __OVERLOADABLE__ cpow(in real base, in complex exponent)
{
  if (base == 0.0) return C(0);
  if (exponent.y == 0.0) return C(pow(base, exponent.x));

  real re = log(abs(base));
  real im = atan(0.0, base);

  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);

  real scalar =  exp(re2);

  return  (complex)(scalar * cos(im2), scalar * sin(im2));
}

complex __OVERLOADABLE__ cpow(in complex base, in real exponent) 
{
  if (base.x == 0.0 && base.y == 0.0) return C(0);
  if (exponent == 0.0) return C(1);
  if (exponent == 1.0) return base;
  if (exponent == 2.0) return mul(base,base);
  if (exponent == 3.0) return mul(mul(base,base),base);
  if (base.y == 0.0) return C(pow(base.x, exponent));
  
  real re = exponent * log(cabs(base));
  real im = exponent * arg(base);

  real scalar = exp(re);

  return (complex)(scalar * cos(im), scalar * sin(im));
}

complex __OVERLOADABLE__ cpow(in complex base, in complex exponent)
{
  if (exponent.y == 0.0) return cpow(base, exponent.x);
  if (base.x == 0.0 && base.y == 0.0) return C(0);

  real re =  log(cabs(base));
  real im =  arg(base);

  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);

  real scalar = exp(re2);

  return (complex)(scalar * cos(im2), scalar * sin(im2));
  //complex temp = mul((complex)(log(cabs(base)), arg(base)), exponent);
  //real scalar = exp(temp.x);
  //return (complex)(scalar * cos(temp.y), scalar * sin(temp.y));
}

#ifdef GLSL
// Hyperbolic Sine (e^x - e^-x) / 2
real __OVERLOADABLE__ sinh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp - 1.0 / tmp);
}

/// Hyperbolic Cosine (e^x + e^-x) / 2
real __OVERLOADABLE__ cosh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp + 1.0 / tmp);
}

// Hyperbolic Tangent (sinh / cosh)
real __OVERLOADABLE__ tanh(in real x)
{
  real tmp = exp(x);
  real invtmp = 1.0 / tmp;
  return (tmp - invtmp) / (tmp + invtmp);
}

// Hyperbolic arc sine log(x+sqrt(1+x^2))
real __OVERLOADABLE__ asinh(in real x)
{
  return log(x + sqrt(1.0+x*x));
}

// Hyperbolic arc cosine 2log(sqrt((x+1)/2) + sqrt((x-1)/2))
real __OVERLOADABLE__ acosh(in real x)
{
  return 2.0 * log(sqrt(0.5*x+0.5) + sqrt(0.5*x-0.5));
}

// Hyperbolic arc tangent (log (1+x) - log (1-x))/2 
real __OVERLOADABLE__ atanh(in real x)
{
  return (log(1.0+x) - log(1.0-x)) / 2.0;
}
#endif

complex __OVERLOADABLE__ cexp(in complex z) 
{
    real scalar =  exp(z.x); // e^ix = cis x
    return (complex)(scalar * cos(z.y), scalar * sin(z.y));
}

// Returns the sine of a complex number.
//    sin(z)  =  ( exp(i*z) - exp(-i*z) ) / (2*i)
complex __OVERLOADABLE__ csin(in complex z)
{
  //Using hyperbolic functions
  //sin(x + iy) = sin(x) cosh(y) + i cos(x) sinh(y)
  return (complex)(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

// Returns the cosine of a complex number.
//     cos(z)  =  ( exp(i*z) + exp(-i*z) ) / 2
complex __OVERLOADABLE__ ccos(in complex z)
{
  //Using hyperbolic functions
  //cos(x + iy) = cos(x) cosh(y) - i sin(x) sinh(y)
  return (complex)(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

// Returns the tangent of a complex number.
//     tan(z)  =  sin(z) / cos(z)
complex __OVERLOADABLE__ ctan(in complex z)
{
  return div(csin(z), ccos(z));
}

// Returns the principal arc sine of a complex number.
//     asin(z)  =  -i * log(i*z + sqrt(1 - z*z))
complex __OVERLOADABLE__ casin(in complex z)
{
  complex a = sqrt(C(1) - mul(z,z));
  a += (complex)(-z.y, z.x); //z * i + a
  a = loge(a);
  return (complex)(a.y, -a.x);  // a * -i
}

// Returns the principal arc cosine of a complex number.
//     acos(z)  =  -i * log( z + i * sqrt(1 - z*z) )
complex __OVERLOADABLE__ cacos(in complex z)
{
  complex a = sqrt(C(1) - mul(z,z));
  a = z + (complex)(-a.y, a.x); //z + i * a
  a = loge(a);
  return (complex)(a.y, -a.x);  // a * -i
}

// Returns the principal arc tangent of a complex number.
//     atan(z)  =  -i/2 * log( (i-z)/(i+z) )
complex __OVERLOADABLE__ catan(in complex z)
{
  complex a = div(I-z, I+z);
  return mul(CI(-0.5), loge(a));  //-i/2 * log(a)
}

complex __OVERLOADABLE__ csinh(in complex z)
{
  //sinh(a+bi) = sinh(a) cos(b) + i(cosh(a) sin(b))
  return (complex)(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

complex __OVERLOADABLE__ ccosh(in complex z)
{
  //cosh(a+bi) = cosh(a) cos(b) + i(sinh(a) sin(b))
  return (complex)(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
}

complex __OVERLOADABLE__ ctanh(in complex z)
{
  //tanh(z)  =  sinh(z) / cosh(z)
  return div(csinh(z), ccosh(z));
}

// Returns the principal inverse hyperbolic sine of a complex number.
//     asinh(z)  =  log(z + sqrt(z*z + 1))
complex __OVERLOADABLE__ casinh(in complex z)
{
  return loge(z + sqrt(mul(z,z) + C(1)));
}

// Returns the principal inverse hyperbolic cosine of a complex number.
//     acosh(z)  =  log(z + sqrt(z*z - 1))
complex __OVERLOADABLE__ cacosh(in complex z)
{
  return loge(z + sqrt(mul(z,z) - C(1)));
}

// Returns the principal inverse hyperbolic tangent of a complex number.
//     atanh(z)  =  1/2 * log( (1+z)/(1-z) )
complex __OVERLOADABLE__ catanh(in complex z)
{
  complex a = div(I+z, I-z);
  return mul(C(0.5), loge(a));
}

complex __OVERLOADABLE__ csqrt(in complex z)
{
  if (z.y == 0.0)
  {
    if (z.x < 0.0)
      return (complex)(0.0, sqrt(-z.x));
    else
      return (complex)(sqrt(z.x), 0.0);
  }
  if (z.x == 0.0)
  {
    real r = sqrt(0.5 * abs(z.y));
    if (z.y < 0.0) r = -r;
    return (complex)(r, r);
  }

  real t = sqrt(2.0 * (cabs(z) + abs(z.x)));
  real u = t / 2.0;
  
  if (z.x > 0.0)
    return (complex)(u, z.y / t);

  if (z.y < 0.0) u = -u;
  return (complex)(abs(z.y / t), u);
}

bool __OVERLOADABLE__ equals(in complex z1, in complex z2, real tolerance)
{
  return distance(z1, z2) <= abs(tolerance);
}

#ifdef GLSL
real __OVERLOADABLE__ trunc(in real x)
{
  return (real)((int)(x));
}

real __OVERLOADABLE__ round(in real x)
{
  return (real)((int)(x + (x < 0.0 ? -0.5 : 0.5)));
}
#endif

complex __OVERLOADABLE__ trunc(in complex z)
{
  return (complex)(trunc(z.x), trunc(z.y));
}

complex __OVERLOADABLE__ round(in complex z)
{
  return (complex)(round(z.x), round(z.y));
}

complex __OVERLOADABLE__ flip(in complex z)
{
  return (complex)(z.y, z.x);
}

complex __OVERLOADABLE__ sqr(in complex z)
{
  return (complex)(z.x*z.x - z.y*z.y, z.x*z.y + z.y*z.x);
}

complex __OVERLOADABLE__ cube(in complex z)
{
  real x2 = z.x * z.x;
  real y2 = z.y * z.y;
  return (complex)(z.x*x2 - z.x*y2 - z.x*y2 - y2*z.x, 
                 x2*z.y + x2*z.y + z.y*x2 - y2*z.y);
}

real __OVERLOADABLE__ imag(in complex z)
{
  return z.y;
}


