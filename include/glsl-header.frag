//GLSL specific header
precision highp float;
#define GLSL

#define GLSL_MAIN void main() {
#define OPENCL_MAIN 

#define set_result(c) gl_FragColor = c;
#define __OVERLOADABLE__ 
#define real float
#define complex vec2
#define rgba vec4

//Palette lookup mu = [0,1]
#define gradient(mu) texture2D(palette, vec2(mu, 0.0))

//Uniform data
uniform complex offset;
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

//GLSL only maths library prototypes
real __OVERLOADABLE__ log10(in real r);
real __OVERLOADABLE__ trunc(in real x);
real __OVERLOADABLE__ round(in real x);
real __OVERLOADABLE__ cosh(in real x);
real __OVERLOADABLE__ tanh(in real x);
real __OVERLOADABLE__ sinh(in real x);
real __OVERLOADABLE__ acosh(in real x);
real __OVERLOADABLE__ atanh(in real x);
real __OVERLOADABLE__ asinh(in real x);
complex __OVERLOADABLE__ round(in complex z);
complex __OVERLOADABLE__ trunc(in complex z);

