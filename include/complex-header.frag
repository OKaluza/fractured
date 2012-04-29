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


