//GLSL specific header
precision highp float;
#define GLSL
#define main_function() void main()
#define set_result(c) gl_FragColor = c;
#define __OVERLOADABLE__ 
#define real float
#define complex vec2
#define RGB vec3
#define rgba vec4

//Palette lookup mu = [0,1]
#define gradient(mu) texture2D(palette, vec2(mu, 0.0))

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

