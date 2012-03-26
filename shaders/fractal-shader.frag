//Maths library prototypes
#define R(x) real(x)
#define C(x) complex(real(x),0.0)
#define CI(x) complex(0.0,real(x))
#define I complex(0.0,1.0)
#define ident(args) args
#define zero(args) 0
#define czero(args) complex(0.0,0.0)

#define PI  R(3.141592654)
#define E   R(2.718281828)
real __OVERLOADABLE__ inv(in real r);
real __OVERLOADABLE__ neg(in real x);
real __OVERLOADABLE__ sqr(in real x);
real __OVERLOADABLE__ cube(in real x);
//Complex number functions
real __OVERLOADABLE__ manhattan(in complex z);
real __OVERLOADABLE__ norm(in complex z);
real __OVERLOADABLE__ cabs(in real x);
real __OVERLOADABLE__ cabs(in complex z);
real __OVERLOADABLE__ arg(in complex z);
real __OVERLOADABLE__ imag(in complex z);
bool __OVERLOADABLE__ equals(complex z1, complex z2, real tolerance);
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
complex __OVERLOADABLE__ flip(in complex z);
complex __OVERLOADABLE__ sqr(in complex z);
complex __OVERLOADABLE__ cube(in complex z);

main_function()
{
  //Globals
  complex z;
  complex c;
  complex point;      //Current point coord
  complex z_1;        //Value of z(n-1)
  complex z_2;        //Value of z(n-2)
  int maxiterations;  //Number of iterations to perform
  int count = 0;      //Step counter

  ---DATA---

  rgba colour = rgba(0.0,0.0,0.0,0.0);

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
  
  float inc = pixelsize / real(antialias); //Width of variable over fragment

  //Init fractal
  point = coord + complex(real(k)*inc, real(j)*inc);

  ---INIT---

  if (julia)
  {
    //Julia set default
    z = point;
    c = selected;
  }
  else
  {
    //Mandelbrot set default
    if (perturb) 
      z = selected; //Perturbation
    else
      z = (0,0);
    c = point;
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

    ---PRE_TRANSFORM---
    ---ZNEXT---
    ---POST_TRANSFORM---

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

  set_result(colour);
}


