precision highp float;
#define real float
#define complex vec2
#define R(x) real(x)
#define C(x) complex(real(x),0.0)
#define CI(x) complex(0.0,real(x))
#define I complex(0.0,1.0)
#define RGB vec3
#define rgba vec4
#define ident(args) args
#define zero(args) 0
#define czero(args) complex(0.0,0.0)

//Palette lookup mu = [0,1]
#define gradient(mu) texture2D(palette, vec2(mu, 0.0))

//Additional maths functions
const real PI = 3.1415926536;
const real TWO_PI = 2.0 * PI;
const real E = 2.71828183;
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
complex gamma(in complex z);
bool equals(complex z1, complex z2, real tolerance);
real manhattan(in complex z);
real norm(in complex z);
real cabs(in complex z);
real arg(in complex z);
real imag(in complex z);

//Globals
complex z;
complex c;
complex pixel;      //Current pixel coord
complex z_1;        //Value of z(n-1)
complex z_2;        //Value of z(n-2)
int maxiterations;  //Number of iterations to perform
int count = 0;      //Step counter
//bool converged;     //Converge flag

//Uniform data
uniform bool julia;
uniform bool perturb;
uniform real pixelsize;
uniform complex dims;
uniform complex origin; 
uniform complex selected; 
uniform sampler2D palette; 
uniform rgba background; 

//uniform sampler2D texture;

//Current complex coordinate
varying complex coord;

//Largest dimension
real dim;
//Radius in pixels
complex radius;
//Stores distance from current coord to origin
real len;

