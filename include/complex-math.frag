//Maths function library
#define ident(args) args
#define zero(args) 0
#define czero(args) complex(0.0,0.0)

#define PI  real(3.141592654)
#define E   real(2.718281828)

real _call_ inv(in real r)  {return 1.0/r;}
real _call_ neg(in real x)  {return -x;}
real _call_ sqr(in real x)  {return x*x;}
real _call_ cube(in real x) {return x*x*x;}

bool _call_ equals(in complex z1, in complex z2, real tolerance)
{
  return distance(z1, z2) <= abs(tolerance);
}

real _call_ manhattan(in complex z)
{
  return abs(z.x) + abs(z.y);
}

real _call_ norm(in complex z)
{
  return dot(z,z);
}

real _call_ cabs(in real x) {return abs(x);}

real _call_ cabs(in complex z)
{
  return length(z);
}

real _call_ arg(in complex z)
{
  return atan(z.y,z.x);
}

real _call_ imag(in complex z)
{
  return z.y;
}

complex _call_ conj(in complex z)
{
  return complex(z.x, -z.y);
}

#ifdef GLSL
//Functions only required for GLSL, predefined in OpenCL
real _call_ log10(in real r)
{
  return log(r) / log(10.0);
}

//Hacks for opera to fix faulty recursive call detection
#define RROUND(x) real(int(x + (x < 0.0 ? -0.5 : 0.5)))
#define RTRUNC(x) real(int(x))

real _call_ trunc(in real x)
{
  return RTRUNC(x);
  //return real(int(x));
}

real _call_ round(in real x)
{
  return RROUND(x);
  //return real(int(x + (x < 0.0 ? -0.5 : 0.5)));
}

complex _call_ round(in complex z)
{
  return complex(RROUND(z.x), RROUND(z.y));
}

complex _call_ trunc(in complex z)
{
  return complex(RTRUNC(z.x), RTRUNC(z.y));
}

// Hyperbolic Sine (e^x - e^-x) / 2
real _call_ sinh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp - 1.0 / tmp);
}

/// Hyperbolic Cosine (e^x + e^-x) / 2
real _call_ cosh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp + 1.0 / tmp);
}

// Hyperbolic Tangent (sinh / cosh)
real _call_ tanh(in real x)
{
  real tmp = exp(x);
  real invtmp = 1.0 / tmp;
  return (tmp - invtmp) / (tmp + invtmp);
}

// Hyperbolic arc sine log(x+sqrt(1+x^2))
real _call_ asinh(in real x)
{
  return log(x + sqrt(1.0+x*x));
}

// Hyperbolic arc cosine 2log(sqrt((x+1)/2) + sqrt((x-1)/2))
real _call_ acosh(in real x)
{
  return 2.0 * log(sqrt(0.5*x+0.5) + sqrt(0.5*x-0.5));
}

// Hyperbolic arc tangent (log (1+x) - log (1-x))/2 
real _call_ atanh(in real x)
{
  return (log(1.0+x) - log(1.0-x)) / 2.0;
}
#endif

complex _call_ add(in complex a, in complex b) {return a + b;}
complex _call_ add(in real a, in complex b) {return (a,0) + b;}
complex _call_ add(in complex a, in real b) {return a + (b,0);}
complex _call_ add(in real a, in real b)    {return complex(a + b,0);}
complex _call_ sub(in complex a, in complex b) {return a - b;}
complex _call_ sub(in real a, in complex b) {return (a,0) - b;}
complex _call_ sub(in complex a, in real b) {return a - (b,0);}
complex _call_ sub(in real a, in real b)    {return complex(a - b,0);}

complex _call_ mul(in complex a, in complex b)
{
  return complex(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

complex _call_ mul(in real a, in complex b) {return a * b;}
complex _call_ mul(in complex a, in real b) {return a * b;}
complex _call_ mul(in real a, in real b) {return complex(a * b,0);}

complex _call_ div(in complex z, in complex w)
{
  //real conj = w.x*w.x + w.y*w.y;
  //complex res = complex(z.x*w.x + z.y*w.y, z.y*w.x - z.x*w.y);
  //return res / conj;
  return complex(dot(z,w), z.y*w.x - z.x*w.y) / dot(w,w);
}

complex _call_ div(in real a, in complex z) //{return div((a,0), z);}
{
  return complex(a*z.x, -a*z.y) / dot(z,z);
}

complex _call_ div(in complex z, in real a) //{return div(z, (a,0));}
{
  return complex(z.x*a, z.y*a) / (a*a);
}

complex _call_ div(in real a, in real b)    {return complex(a / b,0);}

complex _call_ inv(in complex z)
{
  //1.0 / z
  //return complex(z.x, -z.y) / dot(z,z);
  return conj(z) / norm(z);
}

complex _call_ ln(in complex z)
{
  return complex(log(cabs(z)), arg(z));
}

complex _call_ log10(in complex z)
{
  return ln(z) / ln((10,0));
}

real _call_ lnr(in real r)
{
  //For colouring algorithms, return real part
  return log(abs(r));
}

complex _call_ ln(in real r)
{
  if (r < 0.0)
    return complex(lnr(r), PI);
  else
    return complex(lnr(r), 0.0);
}

real _call_ lnr(in complex z)
{
  //For colouring algorithms, return real part
  complex l = ln(z);
  return l.x;
}

complex _call_ neg(in complex z)
{
  return z * real(-1);
}

complex _call_ polar(in real r, in real theta)
{
  if (r < 0.0)
  {
    return complex(r * cos(mod(theta+PI, real(2.0*PI))), -r * sin(theta));    
  }
  return complex(r * cos(theta), r * sin(mod(theta, real(2.0*PI))));
}

complex _call_ cpow(in real base, in real exponent)
{
  return complex(pow(base, exponent),0);
}

complex _call_ cpow(in real base, in complex exponent)
{
  if (base == 0.0) return (0,0);
  if (exponent.y == 0.0) return complex(pow(base, exponent.x),0);

  real re = log(abs(base));
  real im = atan(0.0, base);

  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);

  real scalar =  exp(re2);

  return  complex(scalar * cos(im2), scalar * sin(im2));
}

complex _call_ cpow(in complex base, in real exponent) 
{
  if (base.x == 0.0 && base.y == 0.0) return (0,0);
  if (exponent == 0.0) return (1,0);
  if (exponent == 1.0) return base;
  if (exponent == 2.0) return mul(base,base);
  if (exponent == 3.0) return mul(mul(base,base),base);
  if (base.y == 0.0) return complex(pow(base.x, exponent),0);
  
  real re = exponent * log(cabs(base));
  real im = exponent * arg(base);

  real scalar = exp(re);

  return complex(scalar * cos(im), scalar * sin(im));
}

complex _call_ cpow(in complex base, in complex exponent)
{
  if (base.x == 0.0 && base.y == 0.0) return (0,0);

  real re =  log(cabs(base));
  real im =  arg(base);

  real re2, im2;
  if (exponent.y == 0.0) 
  {
    re2 = exponent.x * re;
    im2 = exponent.x * im;
  }
  else
  {
    re2 = (re*exponent.x) - (im*exponent.y);
    im2 = (re*exponent.y) + (im*exponent.x);
  }

  real scalar = exp(re2);

  return complex(scalar * cos(im2), scalar * sin(im2));
  //complex temp = mul(complex(log(cabs(base)), arg(base)), exponent);
  //real scalar = exp(temp.x);
  //return complex(scalar * cos(temp.y), scalar * sin(temp.y));
}

complex _call_ cexp(in complex z) 
{
    real scalar =  exp(z.x); // e^ix = cis x
    return complex(scalar * cos(z.y), scalar * sin(z.y));
}

// Returns the sine of a complex number.
//    sin(z)  =  ( exp(i*z) - exp(-i*z) ) / (2*i)
complex _call_ csin(in complex z)
{
  //Using hyperbolic functions
  //sin(x + iy) = sin(x) cosh(y) + i cos(x) sinh(y)
  return complex(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

// Returns the cosine of a complex number.
//     cos(z)  =  ( exp(i*z) + exp(-i*z) ) / 2
complex _call_ ccos(in complex z)
{
  //Using hyperbolic functions
  //cos(x + iy) = cos(x) cosh(y) - i sin(x) sinh(y)
  return complex(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

// Returns the tangent of a complex number.
//     tan(z)  =  sin(z) / cos(z)
complex _call_ ctan(in complex z)
{
  return div(csin(z), ccos(z));
}

// Returns the principal arc sine of a complex number.
//     asin(z)  =  -i * log(i*z + sqrt(1 - z*z))
complex _call_ casin(in complex z)
{
  complex a = sqrt((1,0) - mul(z,z));
  a += complex(-z.y, z.x); //z * i + a
  a = ln(a);
  return complex(a.y, -a.x);  // a * -i
}

// Returns the principal arc cosine of a complex number.
//     acos(z)  =  -i * log( z + i * sqrt(1 - z*z) )
complex _call_ cacos(in complex z)
{
  complex a = sqrt((1,0) - mul(z,z));
  a = z + complex(-a.y, a.x); //z + i * a
  a = ln(a);
  return complex(a.y, -a.x);  // a * -i
}

// Returns the principal arc tangent of a complex number.
//     atan(z)  =  -i/2 * log( (i-z)/(i+z) )
complex _call_ catan(in complex z)
{
  complex a = div((0,1)-z, (0,1)+z);
  return mul((0,-0.5), ln(a));  //-i/2 * log(a)
}

complex _call_ csinh(in complex z)
{
  //sinh(a+bi) = sinh(a) cos(b) + i(cosh(a) sin(b))
  return complex(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

complex _call_ ccosh(in complex z)
{
  //cosh(a+bi) = cosh(a) cos(b) + i(sinh(a) sin(b))
  return complex(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
}

complex _call_ ctanh(in complex z)
{
  //tanh(z)  =  sinh(z) / cosh(z)
  return div(csinh(z), ccosh(z));
}

// Returns the principal inverse hyperbolic sine of a complex number.
//     asinh(z)  =  log(z + sqrt(z*z + 1))
complex _call_ casinh(in complex z)
{
  return ln(z + sqrt(mul(z,z) + (1,0)));
}

// Returns the principal inverse hyperbolic cosine of a complex number.
//     acosh(z)  =  log(z + sqrt(z*z - 1))
complex _call_ cacosh(in complex z)
{
  return ln(z + sqrt(mul(z,z) - (1,0)));
}

// Returns the principal inverse hyperbolic tangent of a complex number.
//     atanh(z)  =  1/2 * log( (1+z)/(1-z) )
complex _call_ catanh(in complex z)
{
  complex a = div((0,1)+z, (0,1)-z);
  return mul((0.5,0), ln(a));
}

complex _call_ csqrt(in complex z)
{
  if (z.y == 0.0)
  {
    if (z.x < 0.0)
      return complex(0.0, sqrt(-z.x));
    else
      return complex(sqrt(z.x), 0.0);
  }
  if (z.x == 0.0)
  {
    real r = sqrt(0.5 * abs(z.y));
    if (z.y < 0.0) r = -r;
    return complex(r, r);
  }

  real t = sqrt(2.0 * (cabs(z) + abs(z.x)));
  real u = t / 2.0;
  
  if (z.x > 0.0)
    return complex(u, z.y / t);

  if (z.y < 0.0) u = -u;
  return complex(abs(z.y / t), u);
}

complex _call_ flip(in complex z)
{
  return complex(z.y, z.x);
}

complex _call_ sqr(in complex z)
{
  return complex(z.x*z.x - z.y*z.y, z.x*z.y + z.y*z.x);
}

complex _call_ cube(in complex z)
{
  real x2 = z.x * z.x;
  real y2 = z.y * z.y;
  return complex(z.x*x2 - z.x*y2 - z.x*y2 - y2*z.x, 
                 x2*z.y + x2*z.y + z.y*x2 - y2*z.y);
}

