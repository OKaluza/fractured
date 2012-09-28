/**
 * @constructor
 */
function GradientEditor(canvas, callback) {
  this.canvas = canvas;
  this.callback = callback;
  this.changed = true;
  this.inserting = false;
  this.editing = null;
  this.element = null;
  var self = this;
  function saveColour(val) {self.save(val);}
  function abortColour() {self.cancel();}
  this.picker = new ColourPicker(saveColour, abortColour);

  //Create default palette object
  this.palette = new Palette();
  //Event handling for palette
  this.canvas.mouse = new Mouse(this.canvas, this);
  this.canvas.mouse.ignoreScroll = true;
  this.canvas.oncontextmenu="return false;";
  this.canvas.oncontextmenu = function() { return false; }      

  //this.update();
}

//Palette management
GradientEditor.prototype.read = function(source) {
  //Read a new palette from source data
  this.palette = new Palette(source);
  this.reset();
  this.update();
}

GradientEditor.prototype.update = function(source) {
  //Redraw and flag change
  this.changed = true;
  this.palette.draw(this.canvas, true);
  //Trigger callback if any
  if (this.callback) this.callback(this);
}

//Draw gradient to passed canvas if data has changed
//If no changes, return false
GradientEditor.prototype.get = function(canvas) {
  if (!this.changed) return false;
  this.changed = false;
  //Update passed canvas
  this.palette.draw(canvas, false);
  return true;
}

GradientEditor.prototype.insert = function(position, x, y) {
  //Flag unsaved new colour
  this.inserting = true;
  var col = new Colour();
  this.editing = this.palette.newColour(position, col)
  this.update();
  //Edit new colour
  this.picker.pick(col, x, y);
}

GradientEditor.prototype.editBackground = function(element) {
  this.editing = -1;
  var offset = findElementPos(element); //From mouse.js
  this.element = element;
  this.picker.pick(this.palette.background, offset[0]+32, offset[1]+32);
}

GradientEditor.prototype.edit = function(val, x, y) {
  if (typeof(val) == 'number') {
    this.editing = val;
    this.picker.pick(this.palette.colours[val].colour, x, y);
  } else if (typeof(val) == 'object') {
    //Edit element
    this.cancel();  //Abort any current edit first
    this.element = val;
    var col = new Colour(val.style.backgroundColor)
    var offset = findElementPos(val); //From mouse.js
    this.picker.pick(col, offset[0]+32, offset[1]+32);
  }
  this.update();
}

GradientEditor.prototype.save = function(val) {
  if (this.editing != null) {
    if (this.editing >= 0)
      //Update colour with selected
      this.palette.colours[this.editing].colour.setHSV(val);
    else
      //Update background colour with selected
      this.palette.background.setHSV(val);
  }
  if (this.element) {
    var col = new Colour(0);
    col.setHSV(val);
    this.element.style.backgroundColor = col.html();
  }
  this.reset();
  this.update();
}

GradientEditor.prototype.cancel = function() {
  //If aborting a new colour add, delete it
  if (this.editing >= 0 && this.inserting)
    this.palette.remove(this.editing);
  this.reset();
  this.update();
}

GradientEditor.prototype.reset = function() {
  //Reset editing data
  this.inserting = false;
  this.editing = null;
  this.element = null;
}

//Mouse event handling
GradientEditor.prototype.click = function(event, mouse) {
  //this.changed = true;
  if (event.ctrlKey) {
    //Flip
    for (var i = 0; i < this.palette.colours.length; i++)
      this.palette.colours[i].position = 1.0 - this.palette.colours[i].position;
    this.update();
    return false;
  }

  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  if (mouse.slider != null)
  {
    //Slider moved, update texture
    mouse.slider = null;
    this.update();
    return false;
  }
  var pal = this.canvas;
  if (pal.getContext){
    this.cancel();  //Abort any current edit first
    var context = pal.getContext('2d'); 
    var ypos = findElementPos(pal)[1]+30;

    //Get selected colour
    var i = this.palette.inRange(mouse.x, this.palette.slider.width, pal.width);
    if (i >= 0) {
      if (event.button == 0) {
        //Edit colour on left click
        this.edit(i, event.clientX-128, ypos);
      } else if (event.button == 2) {
        //Delete on right click
        this.palette.remove(i);
        this.update();
      }
    } else {
      //Clicked elsewhere, add new colour
      this.insert(mouse.x / pal.width, event.clientX-128, ypos);
    }
  }
  return false;
}

GradientEditor.prototype.down = function(event, mouse) {
   return false;
}

GradientEditor.prototype.move = function(event, mouse) {
  if (!mouse.isdown) return true;

  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  if (mouse.slider == null) {
    //Colour slider dragged on?
    var i = this.palette.inDragRange(mouse.x, this.palette.slider.width, this.canvas.width);
    if (i>0) mouse.slider = i;
  }

  if (mouse.slider == null)
    mouse.isdown = false; //Abort action if not on slider
  else {
    if (mouse.x < 1) mouse.x = 1;
    if (mouse.x > this.canvas.width-1) mouse.x = this.canvas.width-1;
    //Move to adjusted position and redraw
    this.palette.colours[mouse.slider].position = mouse.x / this.canvas.width;
    this.update();
  }
}

GradientEditor.prototype.wheel = function(event, mouse) {
  this.cycle(0.01 * event.spin);
}

GradientEditor.prototype.leave = function(event, mouse) {
}

GradientEditor.prototype.cycle = function(inc) {
  //Shift all colours cyclically
  for (var i = 1; i < this.palette.colours.length-1; i++)
  {
    var x = this.palette.colours[i].position;
    x += inc;
    if (x <= 0) x += 1.0;
    if (x >= 1.0) x -= 1.0;
    this.palette.colours[i].position = x;
  }
  this.update();
}


