window.count = 0;
window.save_re = fractal.fractal.currentParams.A.value.re;
window.save_im = fractal.fractal.currentParams.A.value.im;
window.steps = 36;

window.step = function()
{
  var angle_inc = 2*Math.PI / window.steps;
  var angle = angle_inc * count;
  if (angle >= 2*Math.PI) angle -= 2*Math.PI;
  var x = Math.sin(angle);
  var y = Math.cos(angle)-1.0;

  fractal.fractal.currentParams.A.value.re = window.save_re + x*0.01;
  fractal.fractal.currentParams.A.value.im = window.save_im + y*0.01;
  //fractal.fractal.currentParams.A.value.re += 0.001;
  //fractal.fractal.currentParams.A.value.im += 0.001;
  fractal.origin.rotate = angle*180.0/Math.PI;
  fractal.loadParams();
  
  colours.cycle(1.0 / window.steps);
  
  fractal.writeShader();
  fractal.draw();
  
  count++;
  if (count <= window.steps)
    setTimeout("window.step()",50);
}


window.step();


