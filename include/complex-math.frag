//--- Maths function library --------------------------------------
#define zero(args) 0
#define czero(args) C(0.0,0.0)

real _inv(in real r)  {return 1.0/r;}
real _neg(in real x)  {return -x;}
real _sqr(in real x)  {return x*x;}
real _cube(in real x) {return x*x*x;}

bool equals(in complex z1, in complex z2, real tolerance)
{
  return distance(z1, z2) <= abs(tolerance);
}

real sgn(real x)
{
  return x / abs(x);
}

real manhattan(in complex z)
{
  return abs(z.x) + abs(z.y);
}

real norm(in complex z)
{
  //Norm squared
  return dot(z,z);
}

real cabs(in complex z)
{
  return length(z);
}

real arg(in complex z)
{
  if (z.x == 0.0) return 0.0;
  return atan2(z.y,z.x);
}

real imag(in complex z)
{
  return z.y;
}

complex conj(in complex z)
{
  return C(z.x, -z.y);
}

complex mul(in complex a, in complex b)
{
  return C(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

complex div(in complex z, in complex w)
{
  real d = norm(w);
  if (d == 0.0) return C(0,0);	//Safe version
  return C(dot(z,w), z.y*w.x - z.x*w.y) / d;
}

complex inv(in complex z)
{
  //1.0 / z
  real d = norm(z);
  if (d == 0.0) return C(0,0);	//Safe version
  return conj(z) / d;
}

real lnr(in real r)
{
  //For colouring algorithms, return real part
  return log(abs(r));
}

real ln(in real x)
{
  return log(x);
}

complex cln(in complex z)
{
  return C(log(cabs(z)), arg(z));
}

complex clog10(in complex z)
{
  return C(log10(cabs(z)), arg(z));
}

complex neg(in complex z)
{
  return z * R(-1);
}

complex polar(in real r, in real theta)
{
  if (r < 0.0)
  {
    return C(r * cos(mod(theta+PI, R(2.0*PI))), -r * sin(theta));    
  }
  return C(r * cos(theta), r * sin(mod(theta, R(2.0*PI))));
}

complex sqr(in complex z)
{
  return C(z.x*z.x - z.y*z.y, z.x*z.y + z.y*z.x);
}

complex cube(in complex z)
{
  real x2 = z.x * z.x;
  real y2 = z.y * z.y;
  return C(z.x*x2 - z.x*y2 - z.x*y2 - y2*z.x, 
           x2*z.y + x2*z.y + z.y*x2 - y2*z.y);
}

complex cpow(in complex base, in complex exponent)
{
  if (base.x == 0.0 && base.y == 0.0) return C(0,0);
  real re =  log(cabs(base));
  real im =  arg(base);
  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);
  real scalar = exp(re2);
  return C(scalar * cos(im2), scalar * sin(im2));
}

complex cexp(in complex z) 
{
  real scalar = exp(z.x); // e^ix = cis 
  return C(scalar * cos(z.y), scalar * sin(z.y));
}

complex csqrt(in complex z)
{
  real ab = cabs(z);
  real x = (1.0 / sqrt(2.0)) * sqrt(ab + z.x);
  real y = (sgn(z.y) / sqrt(2.0)) * sqrt(ab - z.x);
  return C(x, y);
}

// Returns the sine of a complex number.
//    sin(z)  =  ( exp(i*z) - exp(-i*z) ) / (2*i)
complex csin(in complex z)
{
  //Using hyperbolic functions
  //sin(x + iy) = sin(x) cosh(y) + i cos(x) sinh(y)
  return C(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

// Returns the cosine of a complex number.
//     cos(z)  =  ( exp(i*z) + exp(-i*z) ) / 2
complex ccos(in complex z)
{
  //Using hyperbolic functions
  //cos(x + iy) = cos(x) cosh(y) - i sin(x) sinh(y)
  return C(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

// Returns the tangent of a complex number.
//     tan(z)  =  sin(z) / cos(z)
complex ctan(in complex z)
{
  return div(csin(z), ccos(z));
}

// Returns the principal arc sine of a complex number.
//     asin(z)  =  -i * log(i*z + sqrt(1 - z*z))
complex casin(in complex z)
{
  complex a = csqrt(C(1,0) - mul(z,z));
  a += C(-z.y, z.x); //z * i + a
  a = cln(a);
  return C(a.y, -a.x);  // a * -i
}

// Returns the principal arc cosine of a complex number.
//     acos(z)  =  -i * log( z + i * sqrt(1 - z*z) )
complex cacos(in complex z)
{
  complex a = csqrt(C(1,0) - mul(z,z));
  a = z + C(-a.y, a.x); //z + i * a
  a = cln(a);
  return C(a.y, -a.x);  // a * -i
}

// Returns the principal arc tangent of a complex number.
//     atan(z)  =  -i/2 * log( (i-z)/(i+z) )
complex catan(in complex z)
{
  complex a = div(C(0,1)-z, C(0,1)+z);
  return mul(C(0,-0.5), cln(a));  //-i/2 * log(a)
}

complex csinh(in complex z)
{
  //sinh(a+bi) = sinh(a) cos(b) + i(cosh(a) sin(b))
  return C(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

complex ccosh(in complex z)
{
  //cosh(a+bi) = cosh(a) cos(b) + i(sinh(a) sin(b))
  return C(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
}

complex ctanh(in complex z)
{
  //tanh(z)  =  sinh(z) / cosh(z)
  return div(csinh(z), ccosh(z));
}

// Returns the principal inverse hyperbolic sine of a complex number.
//     asinh(z)  =  log(z + sqrt(z*z + 1))
complex casinh(in complex z)
{
  return cln(z + csqrt(mul(z,z) + C(1,0)));
}

// Returns the principal inverse hyperbolic cosine of a complex number.
//     acosh(z)  =  log(z + sqrt(z*z - 1))
complex cacosh(in complex z)
{
  return cln(z + csqrt(mul(z,z) - C(1,0)));
}

// Returns the principal inverse hyperbolic tangent of a complex number.
//     atanh(z)  =  1/2 * log( (1+z)/(1-z) )
complex catanh(in complex z)
{
  complex a = div(C(0,1)+z, C(0,1)-z);
  return mul(C(0.5,0), cln(a));
}

complex flip(in complex z)
{
  return C(z.y, z.x);
}

