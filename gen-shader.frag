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
#define PI  3.141592654
#define E   2.718281828
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
complex cpow(in real base, in real exponent);
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
real cabs(in real x);
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


#define COMPAT
//Base parameter definitions
//Iterations
const int iterations = 57;
//Repeat (Outside)
const real outrepeat = 1.0;
//Repeat (Inside)
const real inrepeat = 3.0;
//Anti-alias
const int antialias = 3;
//Vary Iterations
const real vary = 0.0;

//z(n+1) =
#define znext div(sub(add(sqr(z),mul(sub(c,a),z)),c),sub(add(z,c),b))
//Power (p)
const real p = 2.0;
const complex a = complex(0.30666667,1.71333333);
const complex b = complex(0.95994444,-0.6);
//Bailout Test
#define bailtest(args) norm(args)
//Escape
const real escape = 100.0;
//Converge
const real converge = 0.00005;

//Converge test
bool converged()
{
  return bailtest(z-complex(1,0)) < converge;
}
#define init()
#define reset()
#define converged converged()
#define escaped (bailtest(z) > escape)

#define pre_transform_init()
#define pre_transform_reset()
#define pre_transform_transform()
//Z function
#define post_transform_z_fn(args) ident(args)
//Real function
#define post_transform_re_fn(args) abs(args)
//Imag function
#define post_transform_im_fn(args) abs(args)
//Induct on
const int post_transform_induct_on = 0;
//Induction
const complex post_transform_induct = complex(-0.306666666666667,-0.713333333333333);
//N (apply every)
const int post_transform_N = 1;
//Circle limit
const real post_transform_circle = 0.0;

void post_transform_reset()
{
  //Circle limit
  if (post_transform_circle > 0.0 && len > post_transform_circle) discard;
}

void post_transform_transform()
{
  //Apply every N steps
  if (post_transform_N > 1 && mod(real(count),real(post_transform_N)) != 0.0) return;
  
  //Apply induction, on z(n-1) (*) or z(n-2) ()
  if (post_transform_induct_on > 0)
  {
    if (post_transform_induct_on == 1)
      z += mul(z_1, post_transform_induct);
    else if (post_transform_induct_on == 2)
      z += mul(z_2, post_transform_induct);
  }

  //Apply separate functions to real/imaginary components
  z = post_transform_z_fn(z);
  z = complex(post_transform_re_fn(z.x), post_transform_im_fn(z.y));
}


#define post_transform_init()

#define outside_colour_init()
#define outside_colour_reset()
#define outside_colour_calc()
#define outside_colour_result(A) background
//Triangle Inequality
//Power
#define inside_colour_power p
//Bailout
#define inside_colour_bailout escape

real inside_colour_il, inside_colour_lp;
real inside_colour_sum = 10.0;
real inside_colour_sum2 = 5.0;
real inside_colour_ac = 0.0;

void inside_colour_init()
{
  inside_colour_il = 1.0/log(inside_colour_power);  //Inverse log of (power).  
  inside_colour_lp = log(log(inside_colour_bailout)/2.0);
}

void inside_colour_reset()
{
  inside_colour_sum = 0.0;
  inside_colour_sum2 = 0.0;
  inside_colour_ac = cabs(c);
}

void inside_colour_calc()
{
  inside_colour_sum2 = inside_colour_sum;
  if (count > 0)
  {
    real az2 = cabs(z - c);
    real lowbound = abs(az2 - inside_colour_ac);
    inside_colour_sum += (cabs(z) - lowbound) / (az2 + inside_colour_ac - lowbound);
  }
}

rgba inside_colour_result(in real repeat)
{
  inside_colour_sum /= real(count);
  inside_colour_sum2 /= real(count-1);
    //Fractured version!
    complex x1 = loge(complex(log(cabs(z))));
    real f = inside_colour_il * (inside_colour_lp - x1.x);
  //Correct version:
  //real f = inside_colour_il * (inside_colour_lp - log(log(cabs(z))));
  real idx = inside_colour_sum2 + (inside_colour_sum - inside_colour_sum2) * (f+1.0);
  return gradient(repeat * idx);
}


void main()
{
  rgba colour = rgba(0.0,0.0,0.0,0.0);
  pre_transform_init();
  init();
  post_transform_init();
  inside_colour_init();
  outside_colour_init();

  //Largest dimension
  dim = dims.y > dims.x ? dims.y : dims.x;
  //Get radius in pixels
  radius = 0.5 * dim * complex(pixelsize, pixelsize);
  //Get distance from current coord to origin
  len = cabs((coord - origin) / radius);  
    
  //Variable iterations?
  if (vary > 0.0)
  {
    //Vary in circle of 1/2 pixelsize radius
    real d = 1.0 + len * vary;
    maxiterations = int(d * real(iterations));
  }
  else
    maxiterations = iterations;
    
  float inc = pixelsize / real(antialias); //Width of variable over fragment
  for (int j=0; j<antialias; j++)
  {
    for (int k=0; k<antialias; k++)
    {
      //Reset fractal
      pixel = coord + complex(real(k)*inc, real(j)*inc);
      pre_transform_reset();
      if (julia)
      {
        //Julia set default
        z = pixel;
        c = selected;
      }
      else
      {
        //Mandelbrot set default
        if (perturb) 
          z = selected; //Perturbation
        else
          z = complex(0,0);
        c = pixel;
      }
      z_1 = z_2 = complex(0,0);
      //converged = false;

      //Formula specific reset...
      reset();
      post_transform_reset();
      inside_colour_reset();
      outside_colour_reset();

      //Iterate the fractal formula
      //(Loop counter can only be compared to constant in GL ES 2.0)
      bool in_set = true;
      for (int i=0; i <= iterations*2; i++)
      {
        //Update z(n-2)
        z_2 = z_1;
        //Save current z value for z(n-1)
        z_1 = z;

        //Run next calc step
        count = i;
        pre_transform_transform();
        z = znext;
        post_transform_transform();

        //Check bailout conditions
        if (escaped || converged)
        {
          in_set = false;
          break;
        }

        //Colour calcs...
        outside_colour_calc();
        inside_colour_calc();

        //Check iterations remain
        if (i == maxiterations) break;
      }

      //This hack forces same results as old program...
      #ifdef COMPAT
        count++;
        if (count > maxiterations) in_set = true;
      #endif

      if (in_set)
        //Inside colour: normalised colour index [0,1]
        colour += inside_colour_result(inrepeat);
      else
        //Outside colour: normalised colour index [0,1]
        colour += outside_colour_result(outrepeat);
    }
  }
  
  //Average to get final colour
  gl_FragColor = colour / real(antialias*antialias);
}


complex add(in complex a, in complex b) {return a + b;}
complex add(in real a, in complex b) {return C(a) + b;}
complex add(in complex a, in real b) {return a + C(b);}
complex add(in real a, in real b)    {return C(a + b);}
complex sub(in complex a, in complex b) {return a - b;}
complex sub(in real a, in complex b) {return C(a) - b;}
complex sub(in complex a, in real b) {return a - C(b);}
complex sub(in real a, in real b)    {return C(a - b);}

complex mul(in complex a, in complex b)
{
  return complex(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

complex mul(in real a, in complex b) {return a * b;}
complex mul(in complex a, in real b) {return a * b;}
complex mul(in real a, in real b) {return C(a * b);}

complex div(in complex z, in complex w)
{
  //real conj = w.x*w.x + w.y*w.y;
  //complex res = complex(z.x*w.x + z.y*w.y, z.y*w.x - z.x*w.y);
  //return res / conj;
  return complex(dot(z,w), z.y*w.x - z.x*w.y) / dot(w,w);
}

complex div(in real a, in complex z) //{return div(C(a), z);}
{
  return complex(a*z.x, -a*z.y) / dot(z,z);
}

complex div(in complex z, in real a) //{return div(z, C(a));}
{
  return complex(z.x*a, z.y*a) / (a*a);
}

complex div(in real a, in real b)    {return C(a / b);}

complex inv(in complex z)
{
  //1.0 / z
  //return complex(z.x, -z.y) / dot(z,z);
  return conj(z) / norm(z);
}

real inv(in real r) {return 1.0/r;}

complex loge(in complex z)
{
  return complex(log(cabs(z)), arg(z));
}

complex log10(in complex z)
{
  return loge(z) / loge(C(10));
}

real log10(in real r)
{
  return log(r) / log(10.0);
}

complex loge(in real r)
{
  if (r < 0.0)
    return complex(log(-r), PI);
  else
    return complex(log(r), 0.0);
}

real manhattan(in complex z)
{
  return abs(z.x) + abs(z.y);
}

real norm(in complex z)
{
  return dot(z,z);
}

real cabs(in real x) {return abs(x);}

//complex abs = length/magnitude = sqrt(norm) = sqrt(dot(z,z))
real cabs(in complex z)
{
  return length(z); //sqrt(dot(z,z));
}

real arg(in complex z)
{
  return atan(z.y,z.x);
}

real neg(in real x)
{
  return -x;
}

real sqr(in real x)
{
  return x*x;
}

real cube(in real x)
{
  return x*x*x;
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

  theta = mod(theta, 2.0*PI);

  return complex(r * cos(theta), r * sin(theta));
}

complex cpow(in real base, in real exponent)
{
  return C(pow(base, exponent));
}

complex cpow(in real base, in complex exponent)
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

complex cpow(in complex base, in real exponent) 
{
  if (base == C(0)) return C(0);
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

complex cpow(in complex base, in complex exponent)
{
  if (exponent.y == 0.0) return cpow(base, exponent.x);
  if (base == C(0)) return C(0);

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

// Hyperbolic Sine (e^x - e^-x) / 2
real sinh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp - 1.0 / tmp);
}

/// Hyperbolic Cosine (e^x + e^-x) / 2
real cosh(in real x)
{
  real tmp = exp(x);
  return 0.5 * (tmp + 1.0 / tmp);
}

// Hyperbolic Tangent (sinh / cosh)
real tanh(in real x)
{
  real tmp = exp(x);
  real invtmp = 1.0 / tmp;
  return (tmp - invtmp) / (tmp + invtmp);
}

// Hyperbolic arc sine log(x+sqrt(1+x^2))
real asinh(in real x)
{
  return log(x + sqrt(1.0+x*x));
}

// Hyperbolic arc cosine 2log(sqrt((x+1)/2) + sqrt((x-1)/2))
real acosh(in real x)
{
  return 2.0 * log(sqrt(0.5*x+0.5) + sqrt(0.5*x-0.5));
}

// Hyperbolic arc tangent (log (1+x) - log (1-x))/2 
real atanh(in real x)
{
  return (log(1.0+x) - log(1.0-x)) / 2.0;
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
  return div(csin(z), ccos(z));
}

// Returns the principal arc sine of a complex number.
//     asin(z)  =  -i * log(i*z + sqrt(1 - z*z))
complex casin(in complex z)
{
  complex a = sqrt(C(1) - mul(z,z));
  a += complex(-z.y, z.x); //z * i + a
  a = loge(a);
  return complex(a.y, -a.x);  // a * -i
}

// Returns the principal arc cosine of a complex number.
//     acos(z)  =  -i * log( z + i * sqrt(1 - z*z) )
complex cacos(in complex z)
{
  complex a = sqrt(C(1) - mul(z,z));
  a = z + complex(-a.y, a.x); //z + i * a
  a = loge(a);
  return complex(a.y, -a.x);  // a * -i
}

// Returns the principal arc tangent of a complex number.
//     atan(z)  =  -i/2 * log( (i-z)/(i+z) )
complex catan(in complex z)
{
  complex a = div(I-z, I+z);
  return mul(CI(-0.5), loge(a));  //-i/2 * log(a)
}

complex csinh(in complex z)
{
  //sinh(a+bi) = sinh(a) cos(b) + i(cosh(a) sin(b))
  return complex(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

complex ccosh(in complex z)
{
  //cosh(a+bi) = cosh(a) cos(b) + i(sinh(a) sin(b))
  return complex(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
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
  return loge(z + sqrt(mul(z,z) + C(1)));
}

// Returns the principal inverse hyperbolic cosine of a complex number.
//     acosh(z)  =  log(z + sqrt(z*z - 1))
complex cacosh(in complex z)
{
  return loge(z + sqrt(mul(z,z) - C(1)));
}

// Returns the principal inverse hyperbolic tangent of a complex number.
//     atanh(z)  =  1/2 * log( (1+z)/(1-z) )
complex catanh(in complex z)
{
  complex a = div(I+z, I-z);
  return mul(C(0.5), loge(a));
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

bool equals(in complex z1, in complex z2, real tolerance)
{
  return distance(z1, z2) <= abs(tolerance);
}

real trunc(in real x)
{
  return real(int(x));
}

complex trunc(in complex z)
{
  return complex(trunc(z.x), trunc(z.y));
}

real round(in real x)
{
  return real(int(x + (x < 0.0 ? -0.5 : 0.5)));
}

complex round(in complex z)
{
  return complex(round(z.x), round(z.y));
}

complex flip(in complex z)
{
  return complex(z.y, z.x);
}

complex sqr(in complex z)
{
  return complex(z.x*z.x - z.y*z.y, z.x*z.y + z.y*z.x);
}

complex cube(in complex z)
{
  real x2 = z.x * z.x;
  real y2 = z.y * z.y;
  return complex(z.x*x2 - z.x*y2 - z.x*y2 - y2*z.x, 
                 x2*z.y + x2*z.y + z.y*x2 - y2*z.y);
}

real imag(in complex z)
{
  return z.y;
}

complex gamma(in complex z)
{
  //An approximation of the gamma function
  complex a = sqrt(div(C(2.0*PI), z));
  complex b = mul(C(12), z) - div(C(1), mul(C(10), z));
  complex c = z + div(C(1), b);
  complex d = mul(C(1.0/E), c);
  return mul(a, d);
}
