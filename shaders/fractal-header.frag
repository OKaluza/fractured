precision highp float;
#define real float
#define complex vec2
#define C(x) vec2(x,0.0) 
#define rgb vec3 
#define rgba vec4 

//Complex number library functions
const real PI = 3.1415926536;
const real TWO_PI = 2.0 * PI;
complex mul(in complex a, in complex b);
complex div (in complex z, in complex w);
complex inv(in complex z);
complex cpow(in real base, in complex exponent);
complex cpow(in complex base, in real exponent);
complex cpow(in complex base, in complex exponent);
complex loge(in complex z);
complex loge(in real r);
real norm(in complex z);
real cabs(in complex z);
real arg(in complex z);
complex neg(in complex z);
complex conj(in complex z);
complex polar(in real r, in real theta);
real cosh(in real val);
real tanh(in real val);
real sinh(in real val);
complex cexp(in complex z);
complex csin(in complex z);
complex ccos(in complex z);
complex ctan(in complex z);
complex csqrt(in complex z);
complex csqrt2(in complex z);
bool equals(complex z1, complex z2, real tolerance);
complex ctrunc(in complex z);
complex cfloor(in complex z);
complex cciel(in complex z);
complex cround(in complex z);
complex cflip(in complex z);

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

