/**
 * Draggable window class *
 * @constructor
 */
function MoveWindow(id) {
  //Mouse processing:
  if (!id) return;
  this.element = $(id);
  if (!this.element) {alert("No such element: " + id); return null;}
  this.mouse = new Mouse(this.element, this);
  this.mouse.moveUpdate = true;
  this.element.mouse = this.mouse;
}

MoveWindow.prototype.open = function(x, y) {
  //Show the window
  var style = this.element.style;

  if (x<0) x=0;
  if (y<0) y=0;
  if (x != undefined) style.left = x + "px";
  if (y != undefined) style.top = y + "px";
  style.display = 'block';

  //Correct if outside window width/height
  var w = this.element.offsetWidth,
      h = this.element.offsetHeight;
  if (x + w > window.innerWidth - 20)
    style.left=(window.innerWidth - w - 20) + 'px';
  if (y + h > window.innerHeight - 20)
    style.top=(window.innerHeight - h - 20) + 'px';
  //console.log("Open " + this.element.id + " " + style.left + "," + style.top + " : " + style.display);
}

MoveWindow.prototype.close = function() {
  this.element.style.display = 'none';
}

MoveWindow.prototype.move = function(e, mouse) {
  //console.log("Move: " + mouse.isdown);
  if (!mouse.isdown) return;
  if (mouse.button > 0) return; //Process left drag only
  //Drag position
  var style = mouse.element.style;
  style.left = parseInt(style.left) + mouse.deltaX + 'px';
  style.top = parseInt(style.top) + mouse.deltaY + 'px';
}

/* Originally based on : */
/* DHTML Color Picker, Programming by Ulyses, ColorJack.com (Creative Commons License) */
/* http://www.dynamicdrive.com/dynamicindex11/colorjack/index.htm */
/* (Stripped down, clean class based interface no IE6 support for HTML5 browsers only) */

function scale(val, range, min, max) {return clamp(max * val / range, min, max);}
function clamp(val, min, max) {return Math.max(min, Math.min(max, val));}

/**
 * @constructor
 */
function ColourPicker(savefn, abortfn) {
  // call base class constructor
  MoveWindow.call(this, "picker"); 

  this.savefn = savefn;
  this.abortfn = abortfn;
  this.size=170.0; //H,S & V range in pixels
  this.sv=5;   //Half size of SV selector
  this.oh=2;   //Half size of H & O selectors
  this.picked={H:360, S:100, V:100, A:1.0};
  this.max={'H':360,'S':100,'V':100, 'A':1.0};
  this.colour = new Colour();

  //Load hue strip
  var i, html='', bgcol, opac;
  for(i=0; i<=this.size; i++) { 
    bgcol = new Colour({H:Math.round((360/this.size)*i), S:100, V:100, A:1.0});
    html+="<div class='hue' style='background: "+bgcol.htmlHex()+";'> <\/div>"; 
  }
  $('Hmodel').innerHTML=html;

  //Load alpha strip
  html='';
  for(i=0; i<=this.size; i++) {
    opac=1.0-i/this.size;
    html+="<div class='opacity' style='opacity: " + opac.toFixed(2) + ";'> <\/div>"; 
  }
  $('Omodel').innerHTML=html;
}

//Inherits from MoveWindow
ColourPicker.prototype = new MoveWindow;
ColourPicker.prototype.constructor = MoveWindow;

ColourPicker.prototype.pick = function(colour, x, y) {
  //Show the picker, with selected colour
  this.update(colour.HSVA());
  if (this.element.style.display == 'block') return;
  MoveWindow.prototype.open.call(this, x, y);
}

//Mouse event handling
ColourPicker.prototype.click = function(e, mouse) {
  if (mouse.elementId == "pickCLOSE") {
    this.abortfn();
    toggle('picker'); 
  } else if (mouse.elementId == "pickOK") {
    this.savefn(this.picked);
    toggle('picker'); 
  } else if (mouse.elementId=='SV') 
    this.setSV(mouse);
  else if (mouse.elementId == 'Hslide' || mouse.elementClass=='hue')
    this.setHue(mouse);
  else if (mouse.elementId == 'Oslide' || mouse.elementClass=='opacity')
    this.setOpacity(mouse);
}

ColourPicker.prototype.down = function(e, mouse) {
   return false;
}

ColourPicker.prototype.move = function(e, mouse) {
  if (!mouse.isdown) return;
  if (mouse.button > 0) return; //Process left drag only

  if (mouse.elementId == 'picker' || mouse.elementId == 'pickCUR' || mouse.elementId == 'pickRGB') {
    //Call base class function
    MoveWindow.prototype.move.call(this, e, mouse);
    /*/Drag position
    var ds=$S('picker');
    ds.left = parseInt(ds.left) + mouse.deltaX + 'px';
    ds.top = parseInt(ds.top) + mouse.deltaY + 'px';*/
  } else if (mouse.elementId=='SV') 
    this.setSV(mouse);
  else if (mouse.elementId == 'Hslide' || mouse.elementClass=='hue')
    this.setHue(mouse);
  else if (mouse.elementId == 'Oslide' || mouse.elementClass=='opacity')
    this.setOpacity(mouse);
}

ColourPicker.prototype.wheel = function(e, mouse) {
  this.incHue(-e.spin);
}

ColourPicker.prototype.setSV = function(mouse) {
  var X = mouse.clientx - parseInt($('SV').offsetLeft),
      Y = mouse.clienty - parseInt($('SV').offsetTop);
  //Saturation & brightness adjust
  this.picked.S = scale(X, this.size, 0, this.max['S']);
  this.picked.V = this.max['V'] - scale(Y, this.size, 0, this.max['V']);
  this.update(this.picked);
}

ColourPicker.prototype.setHue = function(mouse) {
  var X = mouse.clientx - parseInt($('H').offsetLeft),
      Y = mouse.clienty - parseInt($('H').offsetTop);
  //Hue adjust
  this.picked.H = scale(Y, this.size, 0, this.max['H']);
  this.update(this.picked);
}

ColourPicker.prototype.incHue = function(inc) {
  //Hue adjust incrementally
  this.picked.H += inc;
  this.picked.H = clamp(this.picked.H, 0, this.max['H']);
  this.update(this.picked);
}

ColourPicker.prototype.setOpacity = function(mouse) {
  var X = mouse.clientx - parseInt($('O').offsetLeft),
      Y = mouse.clienty - parseInt($('O').offsetTop);
  //Alpha adjust
  this.picked.A = 1.0 - clamp(Y / this.size, 0, 1);
  this.update(this.picked);
}

ColourPicker.prototype.updateString = function(str) {
  if (!str) str = prompt('Edit colour:', this.colour.html());
  if (!str) return;
  this.colour = new Colour(str);
  this.update(this.colour.HSV());
}

ColourPicker.prototype.update = function(HSV) {
  this.picked = HSV;
  this.colour = new Colour(HSV),
      rgba = this.colour.rgbaObj(),
      rgbaStr = this.colour.html(),
      bgcol = new Colour({H:HSV.H, S:100, V:100, A:255});

  $('pickRGB').innerHTML=this.colour.printString();
  $S('pickCUR').background=rgbaStr;
  $S('pickCUR').backgroundColour=rgbaStr;
  $S('SV').backgroundColor=bgcol.htmlHex();

  //Hue adjust
  $S('Hslide').top = this.size * (HSV.H/360.0) - this.oh + 'px';
  //SV adjust
  $S('SVslide').top = Math.round(this.size - this.size*(HSV.V/100.0) - this.sv) + 'px';
  $S('SVslide').left = Math.round(this.size*(HSV.S/100.0) - this.sv) + 'px';
  //Alpha adjust
  $S('Oslide').top = this.size * (1.0-HSV.A) - this.oh - 1 + 'px';
};



