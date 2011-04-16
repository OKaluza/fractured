//////////////////////////////////////////////////////////////////////////

//Default functions for use when no colouring algorithm selected
void none_in_init() {}
void none_in_reset() {} 
void none_in_calc() {}
real none_in_result() { return 0.0; }
void none_out_init() {}
void none_out_reset() {} 
void none_out_calc() {}
real none_out_result() { return 0.0; }

void main()
{
  //gl_FragColor = rgba(1, 1, 1, 0); //background.a);
  //return;
  rgba colour = rgba(0.0,0.0,0.0,0.0);
  //if (background.a < 0.01) discard;
  init();
  inColour_init();
  outColour_init();
    
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
          z = complex(0,0);
        c = pixel;
      }
      zoldold = C(0.0);
      zold = C(0.0);

      //Formula specific reset...
      reset();
      inColour_reset();
      outColour_reset();

      //Iterate the fractal formula
      //(Loop counter can only be compared to constant in GL ES 2.0)
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
        if (bailed()) break;
        
        //Colour calc...
        if (OUTSIDE) outColour_calc();
        if (INSIDE) inColour_calc();

        //Check iterations remain
        if (i == maxiterations) break;
      }

      if (count < maxiterations)
      {
        //Outside colour
        if (OUTSIDE)
        {
          //Normalised colour index [0,1]
          real mu = outColour_result() * outrepeat / real(maxiterations);
          colour += texture2D(palette, vec2(mu, 0.0));
        }
        else
          colour += background;
      }
      else
      {
        //Inside colour
        if (INSIDE)
        {
          //Normalised colour index [0,1]
          real mu = inColour_result() * inrepeat / real(maxiterations);
          colour += texture2D(palette, vec2(mu, 0.0));
        }
        else
          colour += background;
      }
    }
  }
  //if (colour == background) discard;
  //if (colour == rgba(0.0, 0.0, 0.0, 0.0)) discard;
  //discard;
  
  //Average to get final colour
  gl_FragColor = colour / real(antialias*antialias);
}


