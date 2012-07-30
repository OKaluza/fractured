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
  this.savefn = savefn;
  this.abortfn = abortfn;
  this.size=170.0; //H,S & V range in pixels
  this.sv=5;   //Half size of SV selector
  this.oh=2;   //Half size of H & O selectors
  this.picked={H:360, S:100, V:100, A:1.0};
  this.max={'H':360,'S':100,'V':100, 'A':1.0};
  this.colour = new Colour();

  //Mouse processing:
  this.mouse = new Mouse($("plugin"), this);
  this.mouse.moveUpdate = true;
  $("plugin").mouse = this.mouse;

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
  var w = $('plugin').offsetWidth,
      h = $('plugin').offsetHeight;
  if (x + w > window.innerWidth - 20)
    $S('plugin').left=(window.innerWidth - w - 20) + 'px';
  if (y + h > window.innerHeight - 20)
    $S('plugin').top=(window.innerHeight - h - 20) + 'px';
}

//Mouse event handling
ColourPicker.prototype.click = function(e, mouse) {
  if (mouse.elementId == "plugCLOSE") {
    this.abortfn();
    toggle('plugin'); 
  } else if (mouse.elementId == "plugOK") {
    this.savefn(this.picked);
    toggle('plugin'); 
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

  if (mouse.elementId == 'plugin' || mouse.elementId == 'plugCUR' || mouse.elementId == 'plugRGB') {
    //Drag position
    var ds=$S('plugin');
    ds.left = parseInt(ds.left) + mouse.deltaX + 'px';
    ds.top = parseInt(ds.top) + mouse.deltaY + 'px';
    return;
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

  $('plugRGB').innerHTML=this.colour.printString();
  $S('plugCUR').background=rgbaStr;
  $S('plugCUR').backgroundColour=rgbaStr;
  $S('SV').backgroundColor=bgcol.htmlHex();

  //Hue adjust
  $S('Hslide').top = this.size * (HSV.H/360.0) - this.oh + 'px';
  //SV adjust
  $S('SVslide').top = Math.round(this.size - this.size*(HSV.V/100.0) - this.sv) + 'px';
  $S('SVslide').left = Math.round(this.size*(HSV.S/100.0) - this.sv) + 'px';
  //Alpha adjust
  $S('Oslide').top = this.size * (1.0-HSV.A) - this.oh - 1 + 'px';
};



