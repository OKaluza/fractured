//--- GLSL specific header ----------------------------------------
precision highp float;
#define GLSL

#define set_result(c) gl_FragColor = c;
#define real float
#define complex vec2
#define rgba vec4

//Initialisers
#define C complex
#define R real

//Uniform data
uniform complex offset;
uniform int iterations;
uniform bool julia;
uniform real pixelsize;
uniform complex dims;
uniform complex origin;
uniform complex selected_;
uniform sampler2D palette;
uniform rgba background;

complex selected = selected_; //Allow transform

//Palette lookup mu = [0,1]
//#define gradient(mu) texture2D(palette, vec2(mu, 0.0))
//Use a function as Opera fails on above define
rgba gradient(float mu)
{
  return texture2D(palette, vec2(mu, 0.0));
}

//Current complex coordinate
varying complex coord;

//Maths Functions only required for GLSL, predefined in OpenCL
#define PI  R(3.141592654)
#define E   R(2.718281828)

#define atan2(a,b) atan(a,b)

//Hacks for opera to fix faulty recursive call detection
#define round_(x) R(int(x + (x < 0.0 ? -0.5 : 0.5)))
#define trunc_(x) R(int(x))

real trunc(in real x)
{
  return trunc_(x);
  //return real(int(x));
}

real round(in real x)
{
  return round_(x);
  //return real(int(x + (x < 0.0 ? -0.5 : 0.5)));
}

real log10(in real r)
{
  return log(r) / log(10.0);
}

complex round(in complex z)
{
  return complex(round_(z.x), round_(z.y));
}

complex trunc(in complex z)
{
  return complex(trunc_(z.x), trunc_(z.y));
}

// Hyperbolic Sine (e^x - e^-x) / 2
real sinh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp - 1.0 / tmp);
}

/// Hyperbolic Cosine (e^x + e^-x) / 2
real cosh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp + 1.0 / tmp);
}

// Hyperbolic Tangent (sinh / cosh)
real tanh(in real x)
{
  real tmp = exp(x);
  real invtmp = 1.0 / tmp;
  return (tmp - invtmp) / (tmp + invtmp);
}

// Hyperbolic arc sine log(x+sqrt(1+x^2))
real asinh(in real x)
{
  return log(x + sqrt(1.0+x*x));
}

// Hyperbolic arc cosine 2log(sqrt((x+1)/2) + sqrt((x-1)/2))
real acosh(in real x)
{
  return 2.0 * log(sqrt(0.5*x+0.5) + sqrt(0.5*x-0.5));
}

// Hyperbolic arc tangent (log (1+x) - log (1-x))/2 
real atanh(in real x)
{
  return (log(1.0+x) - log(1.0-x)) / 2.0;
}

