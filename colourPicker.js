/* DHTML Color Picker */
/* Originally based on : http://www.colorjack.com/software/dhtml+color+picker.html */

function $(v,o) { return((typeof(o)=='object'?o:document).getElementById(v)); }
function $S(o) { o=$(o); if(o) return(o.style); }
function toggle(v) { $S(v).display=($S(v).display=='none'?'block':'none'); }
function scale(val, range, min, max) {return clamp(max * val / range, min, max);}
function clamp(val, min, max) {return Math.max(min, Math.min(max, val));}

function ColourPicker() {
  this.size=170.0; //H,S & V range in pixels
  this.sv=5;   //Half size of SV selector
  this.oh=2;   //Half size of H & O selectors
  this.picked={H:360, S:100, V:100, A:1.0};
  this.max={'H':360,'S':100,'V':100, 'A':1.0};

  //Mouse processing:
  this.mouse = new Mouse($("plugin"), this.mouseClick, this.mouseMove, this.mouseWheel)
  this.mouse.moveUpdate = true;
  $("plugin").mouse = this.mouse;

  //Load hue strip
  var html='';
  for(var i=0; i<=this.size; i++) { 
    var bgcol = new Colour({H:Math.round((360/this.size)*i), S:100, V:100, A:1.0});
    html+="<div class='hue' style='background: "+bgcol.htmlHex()+";'> <\/div>"; 
  }
  $('Hmodel').innerHTML=html;

  //Load alpha strip
  html='';
  for(var i=0; i<=this.size; i++) {
    var O=1.0-i/this.size;
    html+="<div class='opacity' style='opacity: " + O.toFixed(2) + ";'> <\/div>"; 
  }
  $('Omodel').innerHTML=html;
}

ColourPicker.prototype.pick = function(colour, x, y) {
  //Show the picker, with selected colour
  this.update(colour.HSVA());
  if ($S('plugin').display == 'block') return;

  if (x<0) x=0;
  if (y<0) y=0;
  $S('plugin').left=x+'px';
  $S('plugin').top=y+'px';
  $S('plugin').display='block';

  //Correct if outside window width/height
  var w = $('plugin').offsetWidth;
  var h = $('plugin').offsetHeight;
  if (x + w > window.innerWidth - 20)
    $S('plugin').left=(window.innerWidth - w - 20) + 'px';
  if (y + h > window.innerHeight - 20)
    $S('plugin').top=(window.innerHeight - h - 20) + 'px';
}

ColourPicker.prototype.mouseClick = function(e) {
  if (this.elementId == "plugCLOSE") {
    colourPickerAbort();
    toggle('plugin'); 
  } else if (this.elementId == "plugOK") {
    colourPickerOK(picker.picked);
    toggle('plugin'); 
  } else if (this.elementId=='SV') 
    picker.setSV(this);
  else if (this.elementId == 'Hslide' || this.elementClass=='hue')
    picker.setHue(this);
  else if (this.elementId == 'Oslide' || this.elementClass=='opacity')
    picker.setOpacity(this);
}

ColourPicker.prototype.mouseMove = function(e) {
  if (!this.isdown) return;
  if (this.button > 0) return; //Process left drag only

  if (this.elementId == 'plugin' || this.elementId == 'plugCUR' || this.elementId == 'plugRGB') {
    //Drag position
    var ds=$S('plugin');
    ds.left = parseInt(ds.left) + this.deltaX + 'px';
    ds.top = parseInt(ds.top) + this.deltaY + 'px';
    return;
  } else if (this.elementId=='SV') 
    picker.setSV(this);
  else if (this.elementId == 'Hslide' || this.elementClass=='hue')
    picker.setHue(this);
  else if (this.elementId == 'Oslide' || this.elementClass=='opacity')
    picker.setOpacity(this);
}

ColourPicker.prototype.mouseWheel = function(e) {
  picker.incHue(-e.spin);
}

ColourPicker.prototype.setSV = function(mouse) {
  var X = mouse.clientx - parseInt($('SV').offsetLeft);
  var Y = mouse.clienty - parseInt($('SV').offsetTop);
  //Saturation & brightness adjust
  this.picked.S = scale(X, this.size, 0, this.max['S']);
  this.picked.V = this.max['V'] - scale(Y, this.size, 0, this.max['V']);
  this.update(this.picked);
}

ColourPicker.prototype.setHue = function(mouse) {
  var X = mouse.clientx - parseInt($('H').offsetLeft);
  var Y = mouse.clienty - parseInt($('H').offsetTop);
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
  var X = mouse.clientx - parseInt($('O').offsetLeft);
  var Y = mouse.clienty - parseInt($('O').offsetTop);
  //Alpha adjust
  this.picked.A = 1.0 - clamp(Y / this.size, 0, 1);
  this.update(this.picked);
}

ColourPicker.prototype.update = function(HSV) {
  this.picked = HSV;
  var colour = new Colour(HSV);
  var rgba = colour.rgbaObj();
  var rgbaStr = colour.html();
  $('plugRGB').innerHTML=colour.printString();
  $S('plugCUR').background=rgbaStr;
  $S('plugCUR').backgroundColour=rgbaStr;
  
  var bgcol = new Colour({H:HSV.H, S:100, V:100, A:255});
  $S('SV').backgroundColor=bgcol.htmlHex();

  //Hue adjust
  $S('Hslide').top = this.size * (HSV.H/360.0) - this.oh + 'px';
  //SV adjust
  $S('SVslide').top = Math.round(this.size - this.size*(HSV.V/100.0) - this.sv) + 'px';
  $S('SVslide').left = Math.round(this.size*(HSV.S/100.0) - this.sv) + 'px';
  //Alpha adjust
  $S('Oslide').top = this.size * (1.0-HSV.A) - this.oh - 1 + 'px';
};


