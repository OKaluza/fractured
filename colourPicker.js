/* DHTML Color Picker */
/* Hacked version of: http://www.colorjack.com/software/dhtml+color+picker.html */

function $(v,o) { return((typeof(o)=='object'?o:document).getElementById(v)); }
function $S(o) { o=$(o); if(o) return(o.style); }
function abPos(o) { var o=(typeof(o)=='object'?o:$(o)), z={X:0,Y:0}; while(o!=null) { z.X+=o.offsetLeft; z.Y+=o.offsetTop; o=o.offsetParent; }; return(z); }
function toggle(v) { $S(v).display=($S(v).display=='none'?'block':'none'); }
function within(v,a,z) { return((v>=a && v<=z)?true:false); }
function XY(e,v) { var z=[e.pageX,e.pageY]; return(z[zero(v)]); }
function zero(v) { v=parseInt(v); return(!isNaN(v)?v:0); }


/* COLOR PICKER */
var size=170; //Width and height of H,S & V range
var h_h=9;   //Height of selector
var h_s=5;   //Half size of SV selector
var rangepix=size-h_s;

var picked={H:360, S:100, V:100, A:1.0};
var maxValue={'H':360,'S':100,'V':100, 'A':1.0};
var slideHSV={H:360, S:100, V:100, A:1.0}, zINDEX=15, stop=1;

function HSVslide(d,o,e) {
  e.preventDefault();

  function tXY(e) { tY=XY(e,1)-ab.Y; tX=XY(e)-ab.X; }
  function mkHSV(a,b,c) { return(Math.min(a,Math.max(0,Math.ceil((parseInt(c)/b)*a)))); }
  function ckHSV(a,b) { if(within(a,0,b)) return(a); else if(a>b) return(b); else if(a<0) return('0'); }
  function drag(e) { if(!stop) { if(d!='drag') tXY(e);
  
    if(d=='SVslide') { 
      ds.left=ckHSV(tX,rangepix)+'px'; 
      ds.top=ckHSV(tY,rangepix)+'px';
      //Saturation & brightness adjust
      slideHSV.S=mkHSV(100,rangepix,ds.left);
      slideHSV.V=100-mkHSV(100,162,ds.top); 
      HSVupdate(slideHSV);
    }
    else if(d=='Hslide') { 
      var ck=ckHSV(tY,size);
      var c=size-ck; //Flip range
      //Hue adjust
      slideHSV.H=mkHSV(360,size,ck);
      picked.H = maxValue['H']-mkHSV(maxValue['H'],size,c);
      HSVupdate(picked);
    }
    else if(d=='Oslide') { 
      var ck=ckHSV(tY,size);
      if (ck < 0) ck = 0;
      //Alpha adjust
      picked.A = 1.0 - (ck / size);
      HSVupdate(picked);
      //$S('Oslide').top=(size*(1.0-HSV.A)-2)+'px';
    }
    else if(d=='drag') { ds.left=XY(e)+oX-eX+'px'; ds.top=XY(e,1)+oY-eY+'px'; }

  }}

  if(stop) {
    stop=''; 
    var ds=$S(d!='drag'?d:o);

    if(d=='drag') { 
      var oX=parseInt(ds.left), oY=parseInt(ds.top), eX=XY(e), eY=XY(e,1); 
      $S(o).zIndex=zINDEX++; 
    } else { 
      var ab=abPos($(o)), tX, tY; //(d=='Hslide')?2:4; 
      ab.X+=10; ab.Y+=22; 
      if(d=='SVslide') slideHSV.H=picked.H; 
    }

    document.onmousemove=drag;
    document.onmouseup=function(){
      stop=1; 
      //Restore default handlers
      document.onmousemove = handleMouseMove;
      document.onmouseup = handleMouseUp;
      document.mouse = defaultMouse;
    };
    drag(e);
  }
};

function HSVupdate(HSV) { 
  picked = HSV;
  var colour = new Colour(HSV);
    //consoleWrite('H:' + HSV.H + ' S:' + HSV.S + ' V:' + HSV.V + ' A:' + HSV.A);
    //colour.print();
  var rgba = colour.rgbaObj(); //color.HSV_RGB(HSV);
  var rgbaStr = colour.html(); //color.HSV_RGBA(HSV);
  $('plugHEX').innerHTML=colour.htmlHex();//color.HSV_HEX(HSV);
  $S('plugCUR').background=rgbaStr;
  $S('plugCUR').backgroundColour=rgbaStr;
  
    //alert($S('plugCUR').background);
      var bgcol = new Colour({H:HSV.H, S:100, V:100, A:255});
      $S('SV').backgroundColor=bgcol.htmlHex();//'#'+color.HSV_HEX({H:HSV.H, S:100, V:100});

      //Hue adjust
      $S('Hslide').top=(size*(HSV.H/360.0)-1)+'px';
      //SV adjust
      $S('SVslide').top=(size-size*(HSV.V/100.0)-h_s)+'px';
      $S('SVslide').left=(size*(HSV.S/100.0)-h_s)+'px';
      //Alpha adjust
      $S('Oslide').top=(size*(1.0-HSV.A)-2)+'px';
};

function loadSV() { 
  var z='';
  for(var i=0; i<=170; i++) { 
    var bgcol = new Colour({H:Math.round((360/170)*i), S:100, V:100, A:1.0});
    z+="<div style=\"background: "+bgcol.htmlHex()+";\"> <\/div>"; 
  }
  $('Hmodel').innerHTML=z;
};

function loadA() { 
  var z='';
  for(var i=0; i<=170; i++) {
    var O=1.0-i/170.0;
    z+="<div style=\"opacity: " + O.toFixed(2) + ";\"> <\/div>"; 
  }
  $('Omodel').innerHTML=z;
};

