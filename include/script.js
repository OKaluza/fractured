window.steps = 10;
window.timer = 150;

window.step = function(count)
{
  var angle_inc = 2*Math.PI / (window.steps-1);
  var angle = angle_inc * count;
  if (angle >= 2*Math.PI) angle -= 2*Math.PI;
  var x = Math.sin(angle);
  var y = Math.cos(angle)-1.0;

  fractal.origin.rotate = angle*180.0/Math.PI;
  fractal.loadParams();
  
  colours.cycle(1.0 / window.steps, true);
  
  fractal.writeShader();
  fractal.draw();
  
  if (count < window.steps)
    setTimeout("window.step("+(count+1)+")", window.timer);
}


window.step(1);



