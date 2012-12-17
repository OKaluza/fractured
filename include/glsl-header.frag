//GLSL specific header
precision highp float;
#define GLSL

#define GLSL_MAIN void main() {
#define OPENCL_MAIN 

#define set_result(c) gl_FragColor = c;
#define real float
#define complex vec2
#define rgba vec4

#define atan2(a,b) atan(a,b)

//Uniform data
uniform complex offset;
uniform int iterations;
uniform bool julia;
uniform bool perturb;
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
vec4 gradient(float mu)
{
  return texture2D(palette, vec2(mu, 0.0));
}

//Current complex coordinate
varying complex coord;

//GLSL only maths library prototypes
real log10(in real r);
real trunc(in real x);
real round(in real x);
real cosh(in real x);
real tanh(in real x);
real sinh(in real x);
real acosh(in real x);
real atanh(in real x);
real asinh(in real x);
complex round(in complex z);
complex trunc(in complex z);

