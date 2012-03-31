main_function()
{
  //Globals
  complex z;
  complex c;
  complex point;      //Current point coord
  complex z_1;        //Value of z(n-1)
  complex z_2;        //Value of z(n-2)
  int maxiterations;  //Number of iterations to perform
  int count = 0;      //Step counter
  bool escaped, converged;

  ---DATA---

  rgba colour = rgba(0.0,0.0,0.0,0.0);

  //Largest dimension
  real dim = dims.y > dims.x ? dims.y : dims.x;
  //Get radius in pixels
  real radius = 0.5 * dim * pixelsize;
  //Get distance from current coord to origin
  real len = cabs(coord - origin) / radius;  
    
  //Variable iterations?
  if (vary > 0.0)
  {
    //Vary in circle of 1/2 dim*pixelsize radius
    real d = 1.0 + len * vary;
    maxiterations = int(d * real(iterations));
  }
  else
    maxiterations = iterations;
  
  //Init fractal
  point = coord + complex(offset.x*pixelsize, offset.y*pixelsize);

  ---INIT---

  if (julia)
  {
    //Julia set default
    z = point;
    c = selected;
  }
  else
  {
    //Mandelbrot set default
    if (perturb) 
      z = selected; //Perturbation
    else
      z = (0,0);
    c = point;
  }
  z_1 = z_2 = (0,0);

  //Formula specific reset...
  ---RESET---

  //Iterate the fractal formula
  //(Loop counter can only be compared to constant in GL ES 2.0)
  for (int i=0; i <= iterations*2; i++)
  {
    //Update z(n-2)
    z_2 = z_1;
    //Save current z value for z(n-1)
    z_1 = z;

    //Run next calc step
    count = i;

    ---PRE_TRANSFORM---
    ---ZNEXT---
    ---POST_TRANSFORM---

    //Check bailout conditions
    escaped = true;
    ---ESCAPED---
    escaped = false;
    converged = true;
    ---CONVERGED---
    converged = false;

    //Colour calcs...
    ---COLOUR_CALC---

    //Check iterations remain
    if (i == maxiterations) break;
  }

  if (escaped || converged)
  {
    //Outside colour: normalised colour index [0,1]
    real repeat = outrepeat;
    ---OUTSIDE_COLOUR---
  }
  else
  {
    //Inside colour: normalised colour index [0,1]
    real repeat = inrepeat;
    ---INSIDE_COLOUR---
  }

  set_result(colour);
}

