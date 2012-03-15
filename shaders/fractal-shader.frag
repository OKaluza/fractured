precision highp float;
#define main_function() void main()
#define real float
#define complex vec2
#define RGB vec3
#define rgba vec4

//Palette lookup mu = [0,1]
#define gradient(mu) texture2D(palette, vec2(mu, 0.0))

//Additional maths functions
#define R(x) real(x)
#define C(x) complex(real(x),0.0)
#define CI(x) complex(0.0,real(x))
#define I complex(0.0,1.0)
#define ident(args) args
#define zero(args) 0
#define czero(args) complex(0.0,0.0)

#define PI  3.141592654
#define E   2.718281828
real inv(in real r);
real log10(in real r);
real cosh(in real x);
real tanh(in real x);
real sinh(in real x);
real acosh(in real x);
real atanh(in real x);
real asinh(in real x);
real neg(in real x);
real sqr(in real x);
real cube(in real x);
real trunc(in real x);
real round(in real x);
//Complex number functions
complex add(in complex a, in complex b);
complex add(in real a, in complex b);
complex add(in complex a, in real b);
complex add(in real a, in real b);
complex sub(in complex a, in complex b);
complex sub(in real a, in complex b);
complex sub(in complex a, in real b);
complex sub(in real a, in real b);
complex mul(in complex a, in complex b);
complex mul(in real a, in complex b);
complex mul(in complex a, in real b);
complex mul(in real a, in real b);
complex div (in complex z, in complex w);
complex div(in real a, in complex b);
complex div(in complex a, in real b);
complex div(in real a, in real b);
complex inv(in complex z);
complex cpow(in real base, in real exponent);
complex cpow(in real base, in complex exponent);
complex cpow(in complex base, in real exponent);
complex cpow(in complex base, in complex exponent);
complex loge(in real r);
complex loge(in complex z);
complex log10(in complex z);
complex cexp(in complex z);
complex csin(in complex z);
complex ccos(in complex z);
complex ctan(in complex z);
complex casin(in complex z);
complex cacos(in complex z);
complex catan(in complex z);
complex csinh(in complex z);
complex ccosh(in complex z);
complex ctanh(in complex z);
complex casinh(in complex z);
complex cacosh(in complex z);
complex catanh(in complex z);
complex csqrt(in complex z);
complex neg(in complex z);
complex conj(in complex z);
complex polar(in real r, in real theta);
complex trunc(in complex z);
complex round(in complex z);
complex flip(in complex z);
complex sqr(in complex z);
complex cube(in complex z);
bool equals(complex z1, complex z2, real tolerance);
real manhattan(in complex z);
real norm(in complex z);
real cabs(in real x);
real cabs(in complex z);
real arg(in complex z);
real imag(in complex z);

//Uniform data
uniform int antialias;
uniform bool julia;
uniform bool perturb;
uniform real pixelsize;
uniform complex dims;
uniform complex origin; 
uniform complex selected; 
uniform sampler2D palette; 
uniform rgba background; 

//Current complex coordinate
varying complex coord;

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

  ---DATA---

  rgba result_colour = rgba(0.0,0.0,0.0,0.0);
  rgba colour = rgba(0.0,0.0,0.0,0.0);

  ---INIT---

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
    maxiterations = int(d * real(iterations));
  }
  else
    maxiterations = iterations;
  
  ---INIT2---
    
  float inc = pixelsize / real(antialias); //Width of variable over fragment
  for (int j=0; j<16; j++)
  {
    if (j >= antialias) break;
    for (int k=0; k<16; k++)
    {
      if (k >= antialias) break;
      //Reset fractal
      pixel = coord + complex(real(k)*inc, real(j)*inc);

      ---RESET0---

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
          z = (0,0);
        c = pixel;
      }
      z_1 = z_2 = (0,0);

      //Formula specific reset...
      ---RESET---

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
        ---ZNEXT---

        ---ESCAPED---
        ---CONVERGED---

        //Check bailout conditions
        if (escaped || converged)
        {
          in_set = false;
          break;
        }

        //Colour calcs...
        ---COLOUR_CALC---

        //Check iterations remain
        if (i == maxiterations) break;
      }

      if (in_set)
      {
        //Inside colour: normalised colour index [0,1]
        real repeat = inrepeat;
        ---INSIDE_COLOUR---
      }
      else
      {
        //Outside colour: normalised colour index [0,1]
        real repeat = outrepeat;
        ---OUTSIDE_COLOUR---
      }

      result_colour += colour;
    }
  }
  
  //Average to get final colour
  gl_FragColor = result_colour / real(antialias*antialias);
}


