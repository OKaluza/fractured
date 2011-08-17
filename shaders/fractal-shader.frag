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
          z = (0,0);
        c = pixel;
      }
      z_1 = z_2 = (0,0);
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


