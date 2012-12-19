OPENCL_MAIN

---DATA---

GLSL_MAIN

  //Globals
  complex z, c;
  complex point;            //Current point coord
  complex z_1;              //Value of z(n-1)
  complex z_2;              //Value of z(n-2)
  int count = 0;            //Step counter
  bool escaped = false;     //Bailout flags
  bool converged = false;

  int limit = iterations;   //Max iterations
  rgba colour = rgba(0.0,0.0,0.0,0.0);

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
    z = (0,0);
    c = point;
  }
  z_1 = z_2 = (0,0);

  //Formula specific reset...
  ---RESET---

  //Iterate the fractal formula
  //(Loop counter can only be compared to constant in GL ES 2.0)
  for (int i=0; i < MAXITER; i++)
  {
    //Second iterations check: "limit" can be overridden to cut short iterations,
    //"iterations" must be a constant because of lame OpenGL ES 2.0 limitations on loops
    if (i == limit) break;
    if (i == iterations) break; //

    //Update z(n-2)
    z_2 = z_1;
    //Save current z value for z(n-1)
    z_1 = z;

    {
      ---PRE_TRANSFORM---
    }

    //Run next calc step
    count = i+1;  //Current step count
    ---ZNEXT---

    {
      ---POST_TRANSFORM---
    }

    //Check bailout conditions
    ---ESCAPED---
    ---CONVERGED---

    if (escaped || converged) break;

    //Colour calcs...
    {
      ---OUTSIDE_CALC---
    }
    {
      ---INSIDE_CALC---
    }
  }

  if (escaped || converged)
  {
    //Outside colour: normalised colour index [0,1]
    ---OUTSIDE_COLOUR---
  }
  else
  {
    //Inside colour: normalised colour index [0,1]
    ---INSIDE_COLOUR---
  }

  //Combine with global alpha from background colour
  float alpha = colour.w + background.w;

  ---FILTER---

  //Set alpha
  colour.w = alpha;
  //Set final colour
  set_result(colour);
}

