precision highp float;

#define COMPAT

#define real float
#define complex vec2
#define C(x) complex(real(x),0.0) 
#define CI(x) complex(0.0,real(x)) 
#define I complex(0.0,1.0) 
#define RGB vec3 
#define rgba vec4 
#define ident(args) args
#define zero(args) 0
#define czero(args) C(0.0)

//Palette lookup mu = [0,1]
#define gradient(mu) texture2D(palette, vec2(mu, 0.0))

//Complex number library functions
const real PI = 3.1415926536;
const real TWO_PI = 2.0 * PI;
const real E = 2.71828183;
complex mul(in complex a, in complex b);
complex div (in complex z, in complex w);
complex inv(in complex z);
real inv(in real r);
complex cpow(in real base, in complex exponent);
complex cpow(in complex base, in real exponent);
complex cpow(in complex base, in complex exponent);
complex loge(in complex z);
complex log10(in complex z);
real log10(in real r);
complex loge(in real r);
real manhattan(in complex z);
real norm(in complex z);
real cabs(in complex z);
real arg(in complex z);
complex neg(in complex z);
complex conj(in complex z);
complex polar(in real r, in real theta);
real cosh(in real x);
real tanh(in real x);
real sinh(in real x);
real acosh(in real x);
real atanh(in real x);
real asinh(in real x);
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
complex csqrt2(in complex z);
bool equals(complex z1, complex z2, real tolerance);
real trunc(in real x);
real round(in real x);
complex trunc(in complex z);
complex round(in complex z);
complex flip(in complex z);
complex sqr(in complex z);
real imag(in complex z);
complex gamma(in complex z);

//Globals
complex z;
complex c;
complex pixel;      //Coord calculating for
complex zold;       //Previous value of z
complex zoldold;    //Previous previous value of z
int maxiterations;  //Number of iterations to perform
int count = 0;      //Step counter
bool converged;     //Converge flag

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
