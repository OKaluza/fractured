void main()
{
  //gl_FragColor = rgba(1, 1, 1, 0); //background.a);
  //return;
  rgba colour = rgba(0.0,0.0,0.0,0.0);
  //if (background.a < 0.01) discard;
  init();
  inside_colour_init();
  outside_colour_init();
    
  //Variable iterations?
  if (vary > 0.0)
  {
    //Vary in circle of 1/2 pixelsize radius
    real dim = dims.x;
    if (dims.y < dim) dim = dims.y;
    complex radius = 0.5 * dim * complex(pixelsize, pixelsize);
    complex dist = (coord - origin) / radius;
    real len = cabs(dist);
    //if (len > 1.0) discard; //--circle limit
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
          z = C(0);
        c = pixel;
      }
      zoldold = C(0);
      zold = C(0);
      converged = false;

      //Formula specific reset...
      reset();
      inside_colour_reset();
      outside_colour_reset();

      //Iterate the fractal formula
      //(Loop counter can only be compared to constant in GL ES 2.0)
      bool in_set = true;
      for (int i=0; i <= iterations*2; i++)
      {
        //Save previous z value
        zoldold = zold;
        zold = z;

        //Run next calc step
        count = i;
        runstep();
        transform();

        //Check bailout condition
        if (bailed())
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
  //if (colour == background) discard;
  //if (colour == rgba(0.0, 0.0, 0.0, 0.0)) discard;
  //discard;
  
  //Average to get final colour
  gl_FragColor = colour / real(antialias*antialias);
}


