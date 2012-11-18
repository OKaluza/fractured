//GLSL specific header
precision highp float;
#define GLSL

#define GLSL_MAIN void main() {
#define OPENCL_MAIN 

#define set_result(c) gl_FragColor = c;
#define _call_
#define real float
#define complex vec2
#define rgba vec4

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
real _call_ log10(in real r);
real _call_ trunc(in real x);
real _call_ round(in real x);
real _call_ cosh(in real x);
real _call_ tanh(in real x);
real _call_ sinh(in real x);
real _call_ acosh(in real x);
real _call_ atanh(in real x);
real _call_ asinh(in real x);
complex _call_ round(in complex z);
complex _call_ trunc(in complex z);

