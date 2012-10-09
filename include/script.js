if (this.count == 1) {
  //Initialisation on the first step
  this.steps = 10;
  this.inc = 2*Math.PI / this.steps;
}

consoleWrite("Animating: step " + this.count + "/" + this.steps);

var angle = this.inc * this.count;
if (angle >= 2*Math.PI) angle -= 2*Math.PI;
var x = Math.sin(angle);
var y = Math.cos(angle)-1.0;

//Rotate
fractal.origin.rotate = angle*180.0/Math.PI;
//Update parameter changes to form
fractal.loadParams();
//Cycle the palette
colours.cycle(1.0 / this.steps, true);
//Update
fractal.applyChanges();
//Redraw
fractal.draw();
