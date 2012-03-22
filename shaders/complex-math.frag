//Maths functions
real __OVERLOADABLE__ inv(in real r)  {return 1.0/r;}
real __OVERLOADABLE__ neg(in real x)  {return -x;}
real __OVERLOADABLE__ sqr(in real x)  {return x*x;}
real __OVERLOADABLE__ cube(in real x) {return x*x*x;}

bool __OVERLOADABLE__ equals(in complex z1, in complex z2, real tolerance)
{
  return distance(z1, z2) <= abs(tolerance);
}

real __OVERLOADABLE__ manhattan(in complex z)
{
  return abs(z.x) + abs(z.y);
}

real __OVERLOADABLE__ norm(in complex z)
{
  return dot(z,z);
}

real __OVERLOADABLE__ cabs(in real x) {return abs(x);}

real __OVERLOADABLE__ cabs(in complex z)
{
  return length(z);
}

real __OVERLOADABLE__ arg(in complex z)
{
  return atan(z.y,z.x);
}

real __OVERLOADABLE__ imag(in complex z)
{
  return z.y;
}

#ifdef GLSL
//Functions only required for GLSL, predefined in OpenCL
real __OVERLOADABLE__ log10(in real r)
{
  return log(r) / log(10.0);
}

real __OVERLOADABLE__ trunc(in real x)
{
  return real(int(x));
}

real __OVERLOADABLE__ round(in real x)
{
  return real(int(x + (x < 0.0 ? -0.5 : 0.5)));
}

complex __OVERLOADABLE__ round(in complex z)
{
  return complex(round(z.x), round(z.y));
}

complex __OVERLOADABLE__ trunc(in complex z)
{
  return complex(trunc(z.x), trunc(z.y));
}

// Hyperbolic Sine (e^x - e^-x) / 2
real __OVERLOADABLE__ sinh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp - 1.0 / tmp);
}

/// Hyperbolic Cosine (e^x + e^-x) / 2
real __OVERLOADABLE__ cosh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp + 1.0 / tmp);
}

// Hyperbolic Tangent (sinh / cosh)
real __OVERLOADABLE__ tanh(in real x)
{
  real tmp = exp(x);
  real invtmp = 1.0 / tmp;
  return (tmp - invtmp) / (tmp + invtmp);
}

// Hyperbolic arc sine log(x+sqrt(1+x^2))
real __OVERLOADABLE__ asinh(in real x)
{
  return log(x + sqrt(1.0+x*x));
}

// Hyperbolic arc cosine 2log(sqrt((x+1)/2) + sqrt((x-1)/2))
real __OVERLOADABLE__ acosh(in real x)
{
  return 2.0 * log(sqrt(0.5*x+0.5) + sqrt(0.5*x-0.5));
}

// Hyperbolic arc tangent (log (1+x) - log (1-x))/2 
real __OVERLOADABLE__ atanh(in real x)
{
  return (log(1.0+x) - log(1.0-x)) / 2.0;
}
#endif

complex __OVERLOADABLE__ add(in complex a, in complex b) {return a + b;}
complex __OVERLOADABLE__ add(in real a, in complex b) {return C(a) + b;}
complex __OVERLOADABLE__ add(in complex a, in real b) {return a + C(b);}
complex __OVERLOADABLE__ add(in real a, in real b)    {return C(a + b);}
complex __OVERLOADABLE__ sub(in complex a, in complex b) {return a - b;}
complex __OVERLOADABLE__ sub(in real a, in complex b) {return C(a) - b;}
complex __OVERLOADABLE__ sub(in complex a, in real b) {return a - C(b);}
complex __OVERLOADABLE__ sub(in real a, in real b)    {return C(a - b);}

complex __OVERLOADABLE__ mul(in complex a, in complex b)
{
  return complex(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

complex __OVERLOADABLE__ mul(in real a, in complex b) {return a * b;}
complex __OVERLOADABLE__ mul(in complex a, in real b) {return a * b;}
complex __OVERLOADABLE__ mul(in real a, in real b) {return C(a * b);}

complex __OVERLOADABLE__ div(in complex z, in complex w)
{
  //real conj = w.x*w.x + w.y*w.y;
  //complex res = complex(z.x*w.x + z.y*w.y, z.y*w.x - z.x*w.y);
  //return res / conj;
  return complex(dot(z,w), z.y*w.x - z.x*w.y) / dot(w,w);
}

complex __OVERLOADABLE__ div(in real a, in complex z) //{return div(C(a), z);}
{
  return complex(a*z.x, -a*z.y) / dot(z,z);
}

complex __OVERLOADABLE__ div(in complex z, in real a) //{return div(z, C(a));}
{
  return complex(z.x*a, z.y*a) / (a*a);
}

complex __OVERLOADABLE__ div(in real a, in real b)    {return C(a / b);}

complex __OVERLOADABLE__ inv(in complex z)
{
  //1.0 / z
  //return complex(z.x, -z.y) / dot(z,z);
  return conj(z) / norm(z);
}

complex __OVERLOADABLE__ loge(in complex z)
{
  return complex(log(cabs(z)), arg(z));
}

complex __OVERLOADABLE__ log10(in complex z)
{
  return loge(z) / loge(C(10));
}

complex __OVERLOADABLE__ loge(in real r)
{
  if (r < 0.0)
    return complex(log(-r), PI);
  else
    return complex(log(r), 0.0);
}

complex __OVERLOADABLE__ neg(in complex z)
{
  return z * R(-1.0);
}

complex __OVERLOADABLE__ conj(in complex z)
{
  return complex(z.x, -z.y);
}

complex __OVERLOADABLE__ polar(in real r, in real theta)
{
  if (r < 0.0)
  {
    return complex(r * cos(mod(theta+PI, R(2.0*PI))), -r * sin(theta));    
  }
  return complex(r * cos(theta), r * sin(mod(theta, R(2.0*PI))));
}

complex __OVERLOADABLE__ cpow(in real base, in real exponent)
{
  return C(pow(base, exponent));
}

complex __OVERLOADABLE__ cpow(in real base, in complex exponent)
{
  if (base == 0.0) return C(0);
  if (exponent.y == 0.0) return C(pow(base, exponent.x));

  real re = log(abs(base));
  real im = atan(0.0, base);

  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);

  real scalar =  exp(re2);

  return  complex(scalar * cos(im2), scalar * sin(im2));
}

complex __OVERLOADABLE__ cpow(in complex base, in real exponent) 
{
  if (base.x == 0.0 && base.y == 0.0) return C(0);
  if (exponent == 0.0) return C(1);
  if (exponent == 1.0) return base;
  if (exponent == 2.0) return mul(base,base);
  if (exponent == 3.0) return mul(mul(base,base),base);
  if (base.y == 0.0) return C(pow(base.x, exponent));
  
  real re = exponent * log(cabs(base));
  real im = exponent * arg(base);

  real scalar = exp(re);

  return complex(scalar * cos(im), scalar * sin(im));
}

complex __OVERLOADABLE__ cpow(in complex base, in complex exponent)
{
  if (exponent.y == 0.0) return cpow(base, exponent.x);
  if (base.x == 0.0 && base.y == 0.0) return C(0);

  real re =  log(cabs(base));
  real im =  arg(base);

  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);

  real scalar = exp(re2);

  return complex(scalar * cos(im2), scalar * sin(im2));
  //complex temp = mul(complex(log(cabs(base)), arg(base)), exponent);
  //real scalar = exp(temp.x);
  //return complex(scalar * cos(temp.y), scalar * sin(temp.y));
}

complex __OVERLOADABLE__ cexp(in complex z) 
{
    real scalar =  exp(z.x); // e^ix = cis x
    return complex(scalar * cos(z.y), scalar * sin(z.y));
}

// Returns the sine of a complex number.
//    sin(z)  =  ( exp(i*z) - exp(-i*z) ) / (2*i)
complex __OVERLOADABLE__ csin(in complex z)
{
  //Using hyperbolic functions
  //sin(x + iy) = sin(x) cosh(y) + i cos(x) sinh(y)
  return complex(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

// Returns the cosine of a complex number.
//     cos(z)  =  ( exp(i*z) + exp(-i*z) ) / 2
complex __OVERLOADABLE__ ccos(in complex z)
{
  //Using hyperbolic functions
  //cos(x + iy) = cos(x) cosh(y) - i sin(x) sinh(y)
  return complex(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

// Returns the tangent of a complex number.
//     tan(z)  =  sin(z) / cos(z)
complex __OVERLOADABLE__ ctan(in complex z)
{
  return div(csin(z), ccos(z));
}

// Returns the principal arc sine of a complex number.
//     asin(z)  =  -i * log(i*z + sqrt(1 - z*z))
complex __OVERLOADABLE__ casin(in complex z)
{
  complex a = sqrt(C(1) - mul(z,z));
  a += complex(-z.y, z.x); //z * i + a
  a = loge(a);
  return complex(a.y, -a.x);  // a * -i
}

// Returns the principal arc cosine of a complex number.
//     acos(z)  =  -i * log( z + i * sqrt(1 - z*z) )
complex __OVERLOADABLE__ cacos(in complex z)
{
  complex a = sqrt(C(1) - mul(z,z));
  a = z + complex(-a.y, a.x); //z + i * a
  a = loge(a);
  return complex(a.y, -a.x);  // a * -i
}

// Returns the principal arc tangent of a complex number.
//     atan(z)  =  -i/2 * log( (i-z)/(i+z) )
complex __OVERLOADABLE__ catan(in complex z)
{
  complex a = div(I-z, I+z);
  return mul(CI(-0.5), loge(a));  //-i/2 * log(a)
}

complex __OVERLOADABLE__ csinh(in complex z)
{
  //sinh(a+bi) = sinh(a) cos(b) + i(cosh(a) sin(b))
  return complex(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

complex __OVERLOADABLE__ ccosh(in complex z)
{
  //cosh(a+bi) = cosh(a) cos(b) + i(sinh(a) sin(b))
  return complex(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
}

complex __OVERLOADABLE__ ctanh(in complex z)
{
  //tanh(z)  =  sinh(z) / cosh(z)
  return div(csinh(z), ccosh(z));
}

// Returns the principal inverse hyperbolic sine of a complex number.
//     asinh(z)  =  log(z + sqrt(z*z + 1))
complex __OVERLOADABLE__ casinh(in complex z)
{
  return loge(z + sqrt(mul(z,z) + C(1)));
}

// Returns the principal inverse hyperbolic cosine of a complex number.
//     acosh(z)  =  log(z + sqrt(z*z - 1))
complex __OVERLOADABLE__ cacosh(in complex z)
{
  return loge(z + sqrt(mul(z,z) - C(1)));
}

// Returns the principal inverse hyperbolic tangent of a complex number.
//     atanh(z)  =  1/2 * log( (1+z)/(1-z) )
complex __OVERLOADABLE__ catanh(in complex z)
{
  complex a = div(I+z, I-z);
  return mul(C(0.5), loge(a));
}

complex __OVERLOADABLE__ csqrt(in complex z)
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

complex __OVERLOADABLE__ flip(in complex z)
{
  return complex(z.y, z.x);
}

complex __OVERLOADABLE__ sqr(in complex z)
{
  return complex(z.x*z.x - z.y*z.y, z.x*z.y + z.y*z.x);
}

complex __OVERLOADABLE__ cube(in complex z)
{
  real x2 = z.x * z.x;
  real y2 = z.y * z.y;
  return complex(z.x*x2 - z.x*y2 - z.x*y2 - y2*z.x, 
                 x2*z.y + x2*z.y + z.y*x2 - y2*z.y);
}

