
  function ColourPos(colour, pos) {
    //Stores colour as rgba and position as real [0,1]
    this.position = parseFloat(pos);
    if (colour) {
      this.insert = false;
      this.colour = new Colour(colour);
    } else {
      this.insert = true;
      this.colour = new Colour("#ff0000");
    }
  }
  
  function Colour(colour) {
    //Construct... stores colour as r,g,b,a values
    //Can pass in html colour string, HSV object or integer rgba
    if (typeof(colour) == 'string')
      this.set(colour);
    else if (typeof(colour) == 'object')
    {
      //Determine passed type, RGBA or HSV
      if (typeof colour.H != "undefined")
        this.setHSV(colour);
      else
      {
        this.red = colour.R;
        this.green = colour.G;
        this.blue = colour.B;
        this.alpha = typeof colour.A == "undefined" ? 1.0 : colour.A;
      }
    }
    else
    { //Convert from integer AABBGGRR
      this.fromInt(colour);
    }
  }

  Colour.prototype.set = function(val) {
    if (!val) alert("No Value provided!");
    var re = /^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,?\s*(\d\.?\d*)?\)$/;
    var bits = re.exec(val);
    if (bits)
    {
      this.red = parseInt(bits[1]);
      this.green = parseInt(bits[2]);
      this.blue = parseInt(bits[3]);
      this.alpha = typeof bits[4] == "undefined" ? 1.0 : parseFloat(bits[4]);

    } else if (val.charAt(0) == "#") {
      var hex = val.substring(1,7);
      this.alpha = 255;
      this.red = parseInt(hex.substring(0,2),16);
      this.green = parseInt(hex.substring(2,4),16);
      this.blue = parseInt(hex.substring(4,6),16);
    } else {
      //Attempt to parse as integer
      this.fromInt(parseInt(val));
    }
  }

  Colour.prototype.fromInt = function(intcolour) {
    //Convert from integer AABBGGRR
    this.red = (intcolour&0x000000ff);
    this.green = (intcolour&0x0000ff00) >>> 8;
    this.blue = (intcolour&0x00ff0000) >>> 16;
    this.alpha = ((intcolour&0xff000000) >>> 24) / 255.0;
  }

  Colour.prototype.toString = function() {return this.html();}

  Colour.prototype.html = function() {
    return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha + ")";
  }

  Colour.prototype.rgbaGL = function() {
    var arr = new Array(this.red/255.0, this.green/255.0, this.blue/255.0, this.alpha);
    return new Float32Array(arr);
  }

  Colour.prototype.rgbaGLSL = function() {
    var c = this.rgbaGL();
    return "rgba(" + c[0].toFixed(4) + "," + c[1].toFixed(4) + "," + c[2].toFixed(4) + "," + c[3].toFixed(4) + ")";
  }

  Colour.prototype.rgba = function() {
    var rgba = new Array(this.red, this.green, this.blue, this.alpha);
    return rgba;
  }

  Colour.prototype.rgbaObj = function() {
  //consoleWrite('R:' + this.red + ' G:' + this.green + ' B:' + this.blue + ' A:' + this.alpha);
    return({'R':this.red, 'G':this.green, 'B':this.blue, 'A':this.alpha});
  }

  Colour.prototype.print = function() {
    consoleWrite('R:' + this.red + ' G:' + this.green + ' B:' + this.blue + ' A:' + this.alpha);
  }

  Colour.prototype.htmlHex=function(o) { 
    HEX=function(o) { o=Math.round(Math.min(Math.max(0,o),255));
     return("0123456789ABCDEF".charAt((o-o%16)/16)+"0123456789ABCDEF".charAt(o%16));
    };
    return("#" + HEX(this.red) + HEX(this.green) + HEX(this.blue)); 
  };

  Colour.prototype.setHSV = function(o)
  {
    var R, G, A, B, C, S=o.S/100, V=o.V/100, H=o.H/360;

    if(S>0) { 
      if(H>=1) H=0;

      H=6*H; F=H-Math.floor(H);
      A=Math.round(255*V*(1-S));
      B=Math.round(255*V*(1-(S*F)));
      C=Math.round(255*V*(1-(S*(1-F))));
      V=Math.round(255*V); 

      switch(Math.floor(H)) {
          case 0: R=V; G=C; B=A; break;
          case 1: R=B; G=V; B=A; break;
          case 2: R=A; G=V; B=C; break;
          case 3: R=A; G=B; B=V; break;
          case 4: R=C; G=A; B=V; break;
          case 5: R=V; G=A; B=B; break;
      }

      this.red = R ? R : 0;
      this.green = G ? G : 0;
      this.blue = B ? B : 0;
    } else {
      this.red = (V=Math.round(V*255));
      this.green = V;
      this.blue = V;
    }
    this.alpha = typeof o.A == "undefined" ? 1.0 : o.A;
  }

  Colour.prototype.HSV = function() {
    var r = ( this.red / 255.0 );                   //RGB values = 0 ÷ 255
    var g = ( this.green / 255.0 );
    var b = ( this.blue / 255.0 );

    var min = Math.min( r, g, b );    //Min. value of RGB
    var max = Math.max( r, g, b );    //Max. value of RGB
    deltaMax = max - min;             //Delta RGB value

    var v = max;
    var s, h;
    var deltaRed, deltaGreen, deltaBlue;

    if ( deltaMax == 0 )                     //This is a gray, no chroma...
    {
       h = 0;                               //HSV results = 0 ÷ 1
       s = 0;
    }
    else                                    //Chromatic data...
    {
       s = deltaMax / max;

       deltaRed = ( ( ( max - r ) / 6 ) + ( deltaMax / 2 ) ) / deltaMax;
       deltaGreen = ( ( ( max - g ) / 6 ) + ( deltaMax / 2 ) ) / deltaMax;
       deltaBlue = ( ( ( max - b ) / 6 ) + ( deltaMax / 2 ) ) / deltaMax;

       if      ( r == max ) h = deltaBlue - deltaGreen;
       else if ( g == max ) h = ( 1 / 3 ) + deltaRed - deltaBlue;
       else if ( b == max ) h = ( 2 / 3 ) + deltaGreen - deltaRed;

       if ( h < 0 ) h += 1;
       if ( h > 1 ) h -= 1;
    }

    return({'H':360*h, 'S':100*s, 'V':v*100});
  }

  Colour.prototype.HSVA = function() {
    var hsva = this.HSV();
    hsva.A = this.alpha;
    return hsva;
  }

