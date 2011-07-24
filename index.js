
//Globals
var fractal;
var defaultMouse;
var colours;
//Source files list
var sources = {};
var labels = {};
var formulaOffsets = {}; //line numbering offset counts for each formula
var autosize = true;
var showparams = true;

var formulae = {};

  function pageStart() {
    //Default editor line offset
    formulaOffsets[""] = 1;

    //Preload some images
    ajaxReadFile("media/SatVal.png");

    //Get shader source and palette from files on server
    sources["default.palette"] = "";
    sources["shaders/fractal-header.frag"] = "";
    sources["shaders/fractal-shader.frag"] = "";
    sources["shaders/complex-math.frag"] = "";
    sources["shaders/shader2d.vert"] = "";

    //Base parameters for all formulae defined in here
    sources["formulae/base.base.formula"] = "";

    formulae["fractal"] = ["Mandelbrot", "Burning Ship", "Magnet 1", "Magnet 2", "Magnet 3", 
                           "Nova", "Novabs", "Cactus", "Phoenix", "Stretch", "GM", "GMM", "Quadra"];
    formulae["transform"] = ["Functions", "Fractured"];
    formulae["colour"] = ["Default", "Smooth", "Exponential Smoothing", "Triangle Inequality", 
                          "Orbit Traps", "Gaussian Integers", "Hot and Cold"];

    for (type in formulae)
      reloadFormulae(type);

    loadSources();

    showPanel(document.getElementById('tab1'), 'panel1');   //Show first tab
  }

  function reloadFormulae(type) {
    for (i in formulae[type])
      addFormula(type, formulae[type][i]);
  }

  function getNameFromLabel(label) {
    if (!label) return undefined;
    var name = label.replace(/[^\w]+/g,'_').toLowerCase();
    if (labels[name] != undefined) {
      alert("Formula: " + name + " already exists!");
      return undefined;
    }
    return name;
  }

  function addToSelect(type, name, label) {
    select = $(type + "_formula");
    select.options[select.length] = new Option(label, name);
  }

  function addFormula(type, label) {
    var name = getNameFromLabel(label);
    if (!labels[name]) {
      //Source not yet loaded
      sources["formulae/" + name + "." + type + ".formula"] = "";
      labels[name] = label;
    }
    if (type.indexOf("colour") > -1) {
      addToSelect("outside_colour", name, label);
      addToSelect("inside_colour", name, label);
    } else
      addToSelect(type, name, label);
    return name;
  }

  function loadSources() {
    //Load a from list of remaining source files
    for (filename in sources)
      ajaxReadFile(filename, saveSource);
  }

  //Source file loaded
  function saveSource(filename, data){
    sources[filename] = data; //Save content

    //consoleWrite("Source file loaded: " + filename);

    var remain = 0;
    for (filename in sources)
      if (sources[filename].length == 0) remain++;

    if (remain == 0)
      appInit();  //All data loaded, call init
  }

  //Once we have source data, app can be initialised
  function appInit() {
    //Start webGL
    var canvas = document.getElementById("fractal-canvas");
    initGL(canvas);

    //Fractal canvas event handling
    canvas.mouse = new Mouse(canvas, new MouseEventHandler(canvasMouseClick, canvasMouseMove, canvasMouseWheel));
    canvas.mouse.wheelTimer = true;
    defaultMouse = document.mouse = canvas.mouse;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    //Colour editing and palette management
    colours = new ColourEditor(sources["default.palette"]);

    //Create a fractal object
    fractal = new Fractal();
    fractal.applyChanges();

    window.onresize = autoResize;
    document.inputs.elements["autosize"].checked = autosize;
  }

var rztimeout = undefined;

  function autoResize(newval) {
    if (rztimeout) clearTimeout(rztimeout);
    var timer = false;
    if (typeof(newval) == 'boolean')
      autosize = newval;
    else
      timer = true;

    if (autosize) {
      fractal.width = window.innerWidth - (showparams ? 390 : 4);
      fractal.height = window.innerHeight - 34;
      fractal.copyToForm();
      var canvas = document.getElementById('fractal-canvas');
      canvas.width = fractal.width-1;
      canvas.height = fractal.height-1;

      if (timer) {
        document.body.style.cursor = "wait";
        rztimeout = setTimeout('fractal.applyChanges(); document.body.style.cursor = "default";', 150);
      } else
        fractal.applyChanges();
    }
  }

/////////////////////////////////////////////////////////////////////////
//Save/load in local storage
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function saveState(source) {
  if (!supports_html5_storage()) return;
  localStorage["fractured.current.fractal"] = source;
}

function loadState() {
  if (!supports_html5_storage()) return;
  fractal.load(localStorage["fractured.current.fractal"]);
}

function savePaletteLocal(source) {
  if (!supports_html5_storage()) return;
  localStorage["fractured.current.palette"] = source;
}

function loadPaletteLocal() {
  if (!supports_html5_storage()) return;
  colours.read(localStorage["fractured.current.palette"]);
}


/////////////////////////////////////////////////////////////////////////
////Tab controls
  var panels = ['panel1', 'panel2', 'panel3', 'panel4', 'panel5'];
  var selectedTab = null;
  function showPanel(tab, name)
  {
    if (selectedTab) 
    {
      selectedTab.style.backgroundColor = '';
      selectedTab.style.paddingTop = '';
    }
    selectedTab = tab;
    selectedTab.style.backgroundColor = '#e9e4cc';
    selectedTab.style.paddingTop = '2px';
    for(i = 0; i < panels.length; i++)
      document.getElementById(panels[i]).style.display = (name == panels[i]) ? 'block':'none';
    return false;
  }

  function toggleParams() {
    var sidebar = document.getElementById("sidebar");
    var hide = document.getElementById("hide");
    var show = document.getElementById("show");
    var main = document.getElementById("main");
    if (sidebar.style.display == 'none') {
        sidebar.style.display = 'block';
        hide.style.display = 'inline-block';
        show.style.display = 'none';
        main.style.left = '386px';
    } else {
        sidebar.style.display = 'none';
        hide.style.display = 'none';
        show.style.display = 'inline-block';
        main.style.left = '1px';
    }
    showparams = (sidebar.style.display == 'block');
    autoResize(autosize);
  }

/////////////////////////////////////////////////////////////////////////
//Fractal canvas mouse event handling
  function canvasMouseClick(event, mouse) {
    if (event.button > 0) return;

    //Convert mouse coords into fractal coords
    var point = fractal.origin.convert(mouse.x, mouse.y, mouse.element);

    if (event.ctrlKey) {
       //CTRL-click: julia set switch
       if (!fractal.julia) {
          fractal.julia = true;
          fractal.selected.re = fractal.origin.re + point.re;
          fractal.selected.im = fractal.origin.im + point.im;
          var select0 = document.getElementById("xSelInput");
          select0.value = fractal.origin.re + point.re;
          var select1 = document.getElementById("ySelInput");
          select1.value = fractal.origin.im + point.im;
       } else
          fractal.julia = false;

       //Switch saved views
       var tempPos = fractal.origin.clone();
       fractal.origin = fractal.savePos.clone();
       fractal.savePos = tempPos;
    } else {
      //Selection box?
      var select = document.getElementById("select");
      if (select.style.display == 'block') {
        select.style.display = 'none';

        //Ignore if too small a region selected
        if (select.w > 5 && select.h > 5) {
          //Get element offset in document
          var offset = findElementPos(mouse.element);
          //Convert coords to position relative to element
          select.x -= offset[0];
          select.y -= offset[1];
          //Get centre of selection in fractal coords
          var centre = fractal.origin.convert(select.x + select.w/2, select.y + select.h/2, mouse.element);
          //Adjust centre position to match mouse left click
          fractal.origin.re += centre.re;
          fractal.origin.im += centre.im;
          //Adjust zoom by factor of element width to selection
          var ratio = mouse.element.width / select.w;
          fractal.origin.zoom *= ratio;
        }
      } else {
        //Adjust centre position to match mouse left click
        fractal.origin.re += point.re;
        fractal.origin.im += point.im;
      }
    }
    fractal.copyToForm();
    fractal.draw();
  }

  function canvasMouseMove(event, mouse) {
    //Mouseover processing
    if (!fractal) return;
    if (mouse.x >= 0 && mouse.y >= 0 && mouse.x <= mouse.element.width && mouse.y <= mouse.element.height)
    {
      //Convert mouse coords into fractal coords
      var point = fractal.origin.convert(mouse.x, mouse.y, mouse.element);
      point.re += fractal.origin.re;
      point.im += fractal.origin.im;
      document.getElementById("coords").innerHTML = "&nbsp;re: " + point.re.toFixed(8) + " im: " + point.im.toFixed(8);
    }
    if (!mouse.isdown) return;
    if (mouse.button > 0) return; //Process left drag only

    //Drag processing
    var select = document.getElementById("select");
    select.style.display = 'block';

    //Constrain selection size to canvas aspect ratio
    select.w = Math.abs(mouse.deltaX)
    var ratio = mouse.element.width / select.w;
    select.h = mouse.element.height / ratio;

    if (mouse.deltaX < 0)
      select.x = mouse.absoluteX;
    else
      select.x = mouse.absoluteX - select.w;

    if (mouse.deltaY < 0)
      select.y = mouse.lastY - select.h;
    else
      select.y = mouse.lastY;

    //Copy to style to set positions
    select.style.left = select.x + "px";
    select.style.top = select.y + "px";
    select.style.width = select.w + "px";
    select.style.height = select.h + "px";

    document.getElementById("coords").innerHTML = select.style.width + "," + select.style.height;
  }

  function canvasMouseWheel(event, mouse) {
    //alert(event.spin);
    if (event.ctrlKey) {
      /* Zoom */
      if (event.spin < 0)
         fractal.origin.zoom *= (1/(-event.spin * 1.1));
      else
         fractal.origin.zoom *= (event.spin * 1.1);
    } else if (event.shiftKey) {
      /* SHIFT + scroll */
      fractal.origin.rotate += 10 * event.spin;
    } else if (event.altKey) {
      /* ALT + scroll -> rotate */
      fractal.origin.rotate += event.spin;
    } else
      return;

    //Limit to range [0-360)
    if (fractal.origin.rotate < 0) fractal.origin.rotate += 360;
    fractal.origin.rotate %= 360;

    fractal.copyToForm();
    fractal.draw();
  }

  function bgColourMouseClick() {
    colours.edit(0, $("backgroundBG").offsetLeft, 30);
  }


/////////////////////////////////////////////////////////////////////////
//Editor windows, data passing, saving & loading

var editorWindow;
var editorFilename;

  function openEditor(filename) {
    if (!filename) return;
    editorFilename = filename;
    editorWindow = window.open(encodeURI("editor.html?file=" + filename), filename, "toolbar=no,scrollbars=no,location=no,statusbar=no,menubar=no,resizable=1,width=600,height=700");
  }
  function closeEditor() {
    //editorWindow = null;
  }

  function hrefImage() {
    var canvas = document.getElementById("fractal-canvas");
    document.location.href = canvas.toDataURL("image/jpeg");
  }
/*
function saveViaAJAX()
{
    var testCanvas = document.getElementById("testCanvas");
    var canvasData = testCanvas.toDataURL("image/png");
    var postData = "canvasData="+canvasData;
    var debugConsole= document.getElementById("debugConsole");

    //alert("canvasData ="+canvasData );

    var ajax = new XMLHttpRequest();
    ajax.open("POST",'testSave.php',true);
    ajax.setRequestHeader('Content-Type', 'canvas/upload');

    ajax.onreadystatechange=function()
    {
        if (ajax.readyState == 4)
        {
            //alert(ajax.responseText);
            // Write out the filename.
            window.location.href="test-download-html5-canvas-image.php?path="+ajax.responseText;
        }
    }
    ajax.send(postData);
}*/

  function saveImage() {
    var canvas = document.getElementById("fractal-canvas");
    //window.open(canvas.toDataURL());
    //window.open(canvas.toDataURL("image/jpeg"));
    //addImage(canvas.toDataURL("image/png"));
    return canvas.toDataURL("image/jpeg");
  }

  function addImage(url){
    var img = document.createElement('img');
    img.setAttribute("width", "100");  
    document.getElementById('image').appendChild(img);
    img.src = url;
  }

/////////////////////////////////////////////////////////////////////////
//Colour picker functions

handleFormMouseDown = function(e) {
  //Event delegation from parameters form to edit colour params
  e = e || window.event;
  if (e.target.className == "colour") colours.edit(e.target);
}

function saveColour(val) {colours.save(val);}
function abortColour() {colours.cancel();}

function ColourEditor(source) {
  this.inserting = false;
  this.editing = -1;
  this.element = null;
  this.picker = new ColourPicker(saveColour, abortColour);
  this.editcanvas = document.getElementById('palette')
  this.gradientcanvas = document.getElementById('gradient')

  //Load texture data and draw palette
  this.gradientTexture = gl.createTexture();
  this.gradientTexture.image = this.gradientcanvas;
  //Update palette colours
  this.changed = true;
  this.palette = new Palette(source);
  this.palette.draw(this.editcanvas, true);
  //Event handling for palette
  this.editcanvas.mouse = new Mouse(this.editcanvas, this);
  this.editcanvas.mouse.ignoreScroll = true;
}

//Palette management
ColourEditor.prototype.read = function(source) {
  //Read a new palette from source data
  this.palette = new Palette(source);
  this.reset();
  this.changed = true;
  this.palette.draw(this.editcanvas, true);
}

ColourEditor.prototype.update = function() {
  //Update gradient from palette
  if (this.changed) {
   //Update palette history
    var area = document.getElementById("palettes");
    var canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 16;
    area.appendChild(canvas);
    this.palette.draw(canvas, false);  //Save history
    this.changed = false;
  }
  this.palette.draw(this.editcanvas, true);

  //Update gradient texture
  this.palette.draw(this.gradientcanvas, false);  //WebGL texture size (power of 2)
  updateTexture(this.gradientTexture);
}

ColourEditor.prototype.savePalette = function() {
  //Write palette source data (to default only for now)
  ajaxWriteFile("default.palette", this.palette.toString(), consoleWrite);
}

ColourEditor.prototype.insert = function(position, x, y) {
  //Flag unsaved new colour
  this.inserting = true;
  var col = new Colour();
  this.editing = this.palette.newColour(position, col)
  this.palette.draw(this.editcanvas, true);
  //Edit new colour
  this.picker.pick(col, x, y);
}

ColourEditor.prototype.edit = function(val, x, y) {
  if (typeof(val) == 'number') {
    this.editing = val;
    this.picker.pick(this.palette.colours[val].colour, x, y);
  } else if (typeof(val) == 'object') {
    //Edit element
    this.element = val;
    var col = new Colour(val.style.backgroundColor)
    this.picker.pick(col, val.offsetLeft, val.offsetTop);
  }
}

ColourEditor.prototype.save = function(val) {
  if (this.editing >= 0)
  {
    //Update colour with selected
    this.palette.colours[this.editing].colour.setHSV(val);
    this.palette.draw(this.editcanvas, true);
    this.changed = true;
  }
  else if (this.element) {
    var col = new Colour(0);
    col.setHSV(val);
    this.element.style.backgroundColor = col.html();
  }
  this.reset();
}

ColourEditor.prototype.cancel = function() {
  //If aborting a new colour add, delete it
  if (this.editing >= 0 && this.inserting)
  {
    this.palette.remove(this.editing);
    this.palette.draw(this.editcanvas, true);
  }
  this.reset();
}

ColourEditor.prototype.reset = function() {
  //Reset editing data
  this.inserting = false;
  this.editing = -1;
  this.element = null;
}

//Mouse event handling
ColourEditor.prototype.click = function(event, mouse) {
  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  if (mouse.slider != null)
  {
    //Slider moved, update texture
    mouse.slider = null;
    this.palette.draw(this.editcanvas, true);
    return;
  }
  var pal = document.getElementById('palette');
  if (pal.getContext){
    this.cancel();  //Abort any current edit first
    var context = pal.getContext('2d'); 
    var slider = document.getElementById("slider");

    //Get selected colour
    var i = this.palette.inRange(mouse.x, slider.width, pal.width);
    if (i > 0) {
      if (event.button == 0) {
        //Edit colour on left click
        this.edit(i, event.clientX-128, 30);
      } else if (event.button == 2) {
        //Delete on right click
        this.palette.remove(i);
        this.palette.draw(this.editcanvas, true);
        this.changed = true;
      }
    } else {
      //Clicked elsewhere, add new colour
      this.insert(mouse.x / pal.width, event.clientX-128, 30);
    }
  }
}

ColourEditor.prototype.move = function(event, mouse) {
  if (!mouse.isdown) return;

  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  var slider = document.getElementById("slider");

  if (mouse.slider == null) {
    //Colour slider dragged on?
    var i = this.palette.inDragRange(mouse.x, slider.width, this.editcanvas.width);
    if (i>1) mouse.slider = i;
  }

  if (mouse.slider == null)
    mouse.isdown = false; //Abort action if not on slider
  else {
    if (mouse.x < 1) mouse.x = 1;
    if (mouse.x > this.editcanvas.width-1) mouse.x = this.editcanvas.width-1;
    //Move to adjusted position and redraw
    this.palette.colours[mouse.slider].position = mouse.x / this.editcanvas.width;
    this.changed = true;
    this.palette.draw(this.editcanvas, true);
  }
}

ColourEditor.prototype.wheel = function(event, mouse) {
  //Shift all colours cyclically
  for (var i = 2; i < this.palette.colours.length-1; i++)
  {
    var x = this.palette.colours[i].position;
    x += 0.01 * event.spin;
    if (x <= 0) x += 1.0;
    if (x >= 1.0) x -= 1.0;
    this.palette.colours[i].position = x;
    this.changed = true;
  }
  this.palette.draw(this.editcanvas, true);
}


/////////////////////////////////////////////////////////////////////////
//File upload handling

function filesProcess(files, callback) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    //var typeFilter = /image.*/;

    //if(!file.type.match(typeFilter)) {
    //  alert('This file isn\'t an image. Skipping...');
    //  continue;
    //}

    new ajaxUploadFile(file, callback);
  }
}

function loadFile(filename, source) {
  if (filename.indexOf(".ini") > -1)
    fractal.iniParser(source);
  else
    fractal.load(source);
}

function loadPalette(filename, source) {
  fractal.loadPalette(source);
}

