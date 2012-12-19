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
