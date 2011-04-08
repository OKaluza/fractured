complex mul(in complex a, in complex b)
{
  return complex(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

complex div(in complex z, in complex w)
{
  //real conj = w.x*w.x + w.y*w.y;
  //complex res = complex(z.x*w.x + z.y*w.y, z.y*w.x - z.x*w.y);
  //return res / conj;
  return complex(dot(z,w), z.y*w.x - z.x*w.y) / dot(w,w);
}

complex inv(in complex z)
{
  //1.0 / z
  return complex(z.x, -z.y) / dot(z,z);
}

complex loge(in complex z)
{
  return complex(log(cabs(z)), arg(z));
}

complex loge(in real r)
{
  if (r < 0.0)
    return complex(log(-r), PI);
  else
    return complex(log(r), 0.0);
}

real norm(in complex z)
{
  return dot(z,z);
}

//complex abs = length/magnitude = sqrt(norm) = sqrt(dot(z,z))
real cabs(in complex z)
{
  return sqrt(dot(z,z));
}

real arg(in complex z)
{
  return atan(z.y,z.x);
}

complex neg(in complex z)
{
  return z * -1.0;
}

complex conj(in complex z)
{
  return complex(z.x, -z.y);
}

complex polar(in real r, in real theta)
{
  if (r < 0.0)
  {
    theta += PI;
    r = -r;
  }

  theta = mod(theta, TWO_PI);

  return complex(r * cos(theta), r * sin(theta));
}

complex cpow(in real base, in complex exponent)
{
  if (base == 0.0) return C(0.0);

  real re = log(abs(base));
  real im = atan(0.0, base);

  real re2 = (re*exponent.x) - (im*exponent.y);
  real im2 = (re*exponent.y) + (im*exponent.x);

  real scalar =  exp(re2);

  return  complex(scalar * cos(im2), scalar * sin(im2));
}

complex cpow(in complex base, in real exponent) 
{
  if (base == C(0.0)) return C(0.0);
  real re = exponent * log(cabs(base));
  real im = exponent * arg(base);

  real scalar = exp(re);

  return complex(scalar * cos(im), scalar * sin(im));
}

complex cpow(in complex base, in complex exponent)
{
  if (base == C(0.0)) return C(0.0);
  if (exponent == C(0.0)) return C(1.0);
  if (exponent == C(1.0)) return base;
  if (exponent.y == 0.0) return cpow(base, exponent.x);

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

/// COSH Function (Hyperbolic Cosine)
real cosh(in real val)
{
  real tmp = exp(val);
  return 0.5 * (tmp + 1.0 / tmp);
}

// TANH Function (Hyperbolic Tangent)
real tanh(in real val)
{
  real tmp = exp(val);
  real invtmp = 1.0 / tmp;
  return (tmp - invtmp) / (tmp + invtmp);
}

// SINH Function (Hyperbolic Sine)
real sinh(in real val)
{
  real tmp = exp(val);
  return 0.5 * (tmp - 1.0 / tmp);
}

complex cexp(in complex z) 
{
    real scalar =  exp(z.x); // e^ix = cis x
    return complex(scalar * cos(z.y), scalar * sin(z.y));
}

// Returns the sine of a complex number.
//    sin(z)  =  ( exp(i*z) - exp(-i*z) ) / (2*i)
complex csin(in complex z)
{
  //Using hyperbolic functions
  //sin(x + iy) = sin(x) cosh(y) + i cos(x) sinh(y)
  return complex(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

// Returns the cosine of a complex number.
//     cos(z)  =  ( exp(i*z) + exp(-i*z) ) / 2
complex ccos(in complex z)
{
  //Using hyperbolic functions
  //cos(x + iy) = cos(x) cosh(y) - i sin(x) sinh(y)
  return complex(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

// Returns the tangent of a complex number.
//     tan(z)  =  sin(z) / cos(z)
complex ctan(in complex z)
{
  return div(sin(z), cos(z));
}

complex csqrt(in complex z)
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
    return complex(r, z.y > 0.0 ? r : -r);
  }

  real t = sqrt(2.0 * (cabs(z) + abs(z.x)));
  real u = t / 2.0;
  if (z.x > 0.0)
    return complex(u, z.y / t);
  else
    return complex(abs(z.y / t), z.y > 0.0 ? u : -u);
}

bool equals(complex z1, complex z2, real tolerance) 
{
  return distance(z1, z2) <= abs(tolerance);
}
