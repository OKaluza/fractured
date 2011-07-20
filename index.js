
//Globals
var fractal;
var defaultMouse;
var palette;
var picker;
var gradientTexture;
//Source files list
var sources = {};
var labels = {};
var formulaOffsets = {}; //line numbering offset counts for each formula

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

    sources["formulae/base.frac"] = "";

    function addFractalFormula(name, label) {
      sources["formulae/" + name + ".frac"] = "";
      labels[name] = label;
      select = $("fractal_formula");
      select.options[select.length] = new Option(label, name);
    }
    function addTransformFormula(name, label) {
      sources["formulae/" + name + ".transform.frac"] = "";
      labels[name] = label;
      select = $("transform_formula");
      select.options[select.length] = new Option(label, name);
    }
    function addColourFormula(name, label) {
      sources["formulae/" + name + ".colour.frac"] = "";
      labels[name] = label;
      select = $("outside_colour_formula");
      select.options[select.length] = new Option(label, name);
      select = $("inside_colour_formula");
      select.options[select.length] = new Option(label, name);
    }

    addFractalFormula("mandelbrot", "Mandelbrot");
    addFractalFormula("burningship", "Burning Ship");
    addFractalFormula("magnet1", "Magnet 1");
    addFractalFormula("magnet2", "Magnet 2");
    addFractalFormula("magnet3", "Magnet 3");
    addFractalFormula("nova", "Nova");
    addFractalFormula("novabs", "Novabs");
    addFractalFormula("cactus", "Cactus");
    addFractalFormula("phoenix", "Phoenix");
    addFractalFormula("stretch", "Stretch");
    addFractalFormula("gm", "GM");
    addFractalFormula("gmm", "GMM");
    addFractalFormula("quadra", "Quadra");

    addTransformFormula("functions", "Functions");
    addTransformFormula("fractured", "Fractured");

    addColourFormula("default", "Default");
    addColourFormula("smooth", "Smooth");
    addColourFormula("exp_smooth", "Exponential Smoothing");
    addColourFormula("triangle_inequality", "Triangle Inequality");
    addColourFormula("orbit_traps", "Orbit Traps");
    addColourFormula("gaussian_integers", "Gaussian Integers");
    addColourFormula("hot_cold", "Hot & Cold");

    loadSources();

    showPanel(document.getElementById('tab1'), 'panel1');   //Show first tab
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
      appInit();
  }

  function appInit() {
    //Have source data, init

    //Start webGL
    initGL("fractal-canvas");

    //Load texture data and draw palette
    gradientTexture = gl.createTexture();
    gradientTexture.image = document.getElementById('gradient');
    //updateTexture(gradientTexture);
    palette = new Palette(sources["default.palette"]);
    //Update palette colours
    var pal = document.getElementById('palette');
    palette.draw(pal, true);
    //Event handling for palette
    pal.mouse = new Mouse(pal, paletteMouseClick, paletteMouseMove, paletteMouseWheel);
    pal.mouse.ignoreScroll = true;

    //Create a fractal object
    fractal = new Fractal();
    //Load shader program and draw
    fractal.writeShader();
    //fractal.draw();
    drawFractal();

    picker = new ColourPicker();
  }

  function drawFractal() {
    //Update palette history
    if (palette.changed) {
      var area = document.getElementById("palettes");
      var canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 16;
      area.appendChild(canvas);
      palette.draw(canvas, false);  //Save history
      palette.changed = false;
    }
    var pal = document.getElementById('palette');
    palette.draw(pal, true);

    //Update gradient texture
    var pal = document.getElementById('gradient');
    palette.draw(pal, false);  //WebGL Texture size (power of 2)
    updateTexture(gradientTexture);

    fractal.applyChanges();
  }


/////////////////////////////////////////////////////////////////////////
////Tab controls
  var panels = new Array('panel1', 'panel2', 'panel3', 'panel4', 'panel5');
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
  }

/////////////////////////////////////////////////////////////////////////
//Mouse event handling
  function canvasMouseClick(event) {
    if (event.button > 0) return;

    //Convert mouse coords into fractal coords
    var point = fractal.origin.convert(this.x, this.y, this.element);

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
          var offset = findElementPos(this.element);
          //Convert coords to position relative to element
          select.x -= offset[0];
          select.y -= offset[1];
          //Get centre of selection in fractal coords
          var centre = fractal.origin.convert(select.x + select.w/2, select.y + select.h/2, this.element);
          //Adjust centre position to match mouse left click
          fractal.origin.re += centre.re;
          fractal.origin.im += centre.im;
          //Adjust zoom by factor of element width to selection
          var ratio = this.element.width / select.w;
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

  function canvasMouseMove(event) {
    //Mouseover processing
    if (!fractal) return;
    if (this.x >= 0 && this.y >= 0 && this.x <= this.element.width && this.y <= this.element.height)
    {
      //Convert mouse coords into fractal coords
      var point = fractal.origin.convert(this.x, this.y, this.element);
      point.re += fractal.origin.re;
      point.im += fractal.origin.im;
      document.getElementById("coords").innerHTML = "&nbsp;re: " + point.re.toFixed(8) + " im: " + point.im.toFixed(8);
    }
    if (!this.isdown) return;
    if (this.button > 0) return; //Process left drag only

    //Drag processing
    var select = document.getElementById("select");
    select.style.display = 'block';

    //Constrain selection size to canvas aspect ratio
    select.w = Math.abs(this.deltaX)
    var ratio = this.element.width / select.w;
    select.h = this.element.height / ratio;

    if (this.deltaX < 0)
      select.x = this.absoluteX;
    else
      select.x = this.absoluteX - select.w;

    if (this.deltaY < 0)
      select.y = this.lastY - select.h;
    else
      select.y = this.lastY;

    //Copy to style to set positions
    select.style.left = select.x + "px";
    select.style.top = select.y + "px";
    select.style.width = select.w + "px";
    select.style.height = select.h + "px";

    document.getElementById("coords").innerHTML = select.style.width + "," + select.style.height;
  }

  function canvasMouseWheel(event) {
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
    editColour = 0;
    picker.pick(palette.colours[0].colour, $("backgroundBG").offsetLeft, 30); 
  }

  function paletteMouseClick(event) {
    //Use non-scrolling position
    this.x = this.clientx;
    this.x = this.clientx;

    if (this.slider != null)
    {
      //Slider moved, update texture
      this.slider = null;
      palette.draw(document.getElementById('palette'), true);
      return;
    }
    var pal = document.getElementById('palette');
    if (pal.getContext){
      colourPickerAbort();  //Abort any current edit first
      var context = pal.getContext('2d'); 
      var slider = document.getElementById("slider");

      //Get selected colour
      var i = palette.inRange(this.x, slider.width, pal.width);
      if (i > 0) {
        if (event.button == 0) {
          //Edit colour on left click
          editColour = i;
          picker.pick(palette.colours[i].colour, event.clientX-128, 30);
        } else if (event.button == 2) {
          //Delete on right click
          palette.remove(i);
          palette.draw(document.getElementById('palette'), true);
        }
      } else {
        //Clicked elsewhere, add new colour
        var position = this.x / pal.width;
        var col = new Colour();
        editColour = palette.newColour(position, col)
        palette.draw(document.getElementById('palette'), true);
        //Edit new colour
        picker.pick(col, event.clientX-128, 30);
      }
    }
  }

  function paletteMouseMove(event) {
    if (!this.isdown) return;

    //Use non-scrolling position
    this.x = this.clientx;
    this.x = this.clientx;

    var pal = document.getElementById('palette');
    var slider = document.getElementById("slider");

    if (this.slider == null) {
      //Colour slider dragged on?
      var i = palette.inDragRange(this.x, slider.width, pal.width);
      if (i>1) this.slider = i;
    }

    if (this.slider == null) this.isdown = false; //Abort action if not on slider
    else {
      if (this.x < 1) this.x = 1;
      if (this.x > pal.width-1) this.x = pal.width-1;
      //Move to adjusted position and redraw
      palette.colours[this.slider].position = this.x / pal.width;
      palette.draw(document.getElementById('palette'), true);
    }
  }

  function paletteMouseWheel(event) {
  }


/////////////////////////////////////////////////////////////////////////
//Editor windows & data passing 

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

  //Save palette
  function savePalette(){
    var paletteData = palette.toString();
    ajaxWriteFile("default.palette", paletteData, consoleWrite);
  }

/////////////////////////////////////////////////////////////////////////
//Saving result images 

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
  //Event delegation from form
  e = e || window.event;
  if (e.target.className == "colour") colourPickerElement(e.target);
}

var editColour = -1;
var editElement = null;
function colourPickerOK(val) { 
  if (editColour >= 0)
  {
    //Update colour with selected
    palette.colours[editColour].insert = false; //Clear insert flag
    palette.colours[editColour].colour.setHSV(val);
    palette.draw(document.getElementById('palette'), true);
  }
  else if (editElement) {
    var col = new Colour(0);
    col.setHSV(val);
    editElement.style.backgroundColor = col.html();
  }
  editColour = -1;
  editElement = null;
}

function colourPickerAbort() { 
  //If aborting a new colour add, delete it
  if (editColour >= 0 && palette.colours[editColour].insert)
  {
    palette.remove(editColour);
    palette.draw(document.getElementById('palette'), true);
  }
  editColour = -1;
  editElement = null;
}

function colourPickerElement(el) { 
  //Open colour picker for element, not using colour array
  editElement = el;
  var col = new Colour(el.style.backgroundColor)
  picker.pick(col, el.offsetLeft, el.offsetTop);
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

