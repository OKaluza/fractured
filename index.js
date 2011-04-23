
//Globals
var fractal;
var defaultMouse;
//Colour palette array (global for now...)
var colours = [];
var gradientTexture;
//Source files list
var sources = {};
var labels = {};
var lineOffset; //line numbering offset count

  function pageStart() {
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
    //Create a fractal object
    fractal = new Fractal(0, 0, 0, 0.5);

    //Load texture data and draw palette
    gradientTexture = gl.createTexture();
    gradientTexture.image = document.getElementById('palette');
    //updateTexture(gradientTexture);
    readPalette(sources["default.palette"]);

    //Load shader program and draw
    fractal.loadParams();
    fractal.writeShader();
    fractal.draw();

    //Event handling for palette
    var palette = document.getElementById('palette');
    palette.mouse = new Mouse(palette, paletteMouseClick, paletteMouseMove, paletteMouseWheel);
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
    var btn = document.getElementById("hideshow");
    if (sidebar.style.display == 'none') {
        sidebar.style.display = 'block';
        btn.value = '<<';
    } else {
        sidebar.style.display = 'none';
        btn.value = '>>';
    }
  }

/////////////////////////////////////////////////////////////////////////
//Mouse event handling
  function canvasMouseClick(event) {

    //Convert mouse coords into fractal coords
    var point = fractal.origin.convert(this.x, this.y, this.element);

    if (event.button == 0) {
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
    } else if (event.button == 2) {
       //Right-click: julia set switch
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
      //Middle button, no action
      return;
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
    colourPicker(0, $("backgroundBG").offsetLeft, 60); 
  }

  function paletteMouseClick(event) {
    if (this.slider != null)
    {
      //Slider moved, update texture
      this.slider = null;
      paletteUpdate();
      return;
    }
    var palette = document.getElementById('palette');
    if (palette.getContext){
      colourPickerAbort();  //Abort any current edit first
      var context = palette.getContext('2d'); 
      var slider = document.getElementById("slider");

      for (var i = 1; i < colours.length; i++)
      {
        var x = colours[i].position * palette.width;
        if (this.x >= x - slider.width / 2 && this.x <= x + slider.width / 2) {
          if (event.button == 0) {
            //Edit colour on left click
            colourPicker(i, this.absoluteX-128, 60); //this.absoluteY);
            return;
          } else if (event.button == 2) {
            //Delete on right click
            colours.splice(i,1);
            paletteUpdate();
            return;
          }
        }
      }

      //Clicked elsewhere, add new colour
      var position = this.x / palette.width;
      colours.push(new ColourPos(null, position));
      colours.sort(function(a,b){return a.position - b.position})
            paletteUpdate();
      for (var i = 1; i < colours.length; i++)
      {
        if (colours[i].position == position)
        {
          //Edit new colour
          colourPicker(i, this.absoluteX-128, 60); //this.absoluteY);
          return;
        }
      }
    }
  }

  function paletteMouseMove(event) {
    if (!this.isdown) return;

    var palette = document.getElementById('palette');
    var slider = document.getElementById("slider");

    if (this.slider == null) {
      //Colour slider dragged on?
      for (var i = 2; i < colours.length-1; i++) {
         var oldx = this.x + this.deltaX;
         var x = colours[i].position * palette.width;
         if (oldx >= x - slider.width / 2 && oldx <= x + slider.width / 2) {
           this.slider = i; //Save index
           break;
         }
      }
    }

    if (this.slider == null) this.isdown = false; //Abort action if not on slider
    else {
      if (this.x < 1) this.x = 1;
      if (this.x > palette.width-1) this.x = palette.width-1;
      //Move to adjusted position and redraw
      colours[this.slider].position = this.x / palette.width;
      drawPalette(document.getElementById('palette'), 572, 24, true); //GUI size
    }
  }

  function paletteMouseWheel(event) {
  }

  function paletteUpdate() {
       //var prev = document.getElementById('palette_preview');
       drawPalette(undefined, 360, 16, false);
    var pal = document.getElementById('palette');
    drawPalette(pal, 1024, 1, false);  //WebGL Texture size (power of 2)
    updateTexture(gradientTexture);
    drawPalette(pal, 572, 24, true); //GUI size
  }


/////////////////////////////////////////////////////////////////////////
//Palette parser
  function readPalette(source) {
    delete colours; //Clear existing colour list
    colours = new Array();
    var lines = source.split("\n"); // split on newlines
    var position;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      //Palette: parse into attrib=value pairs
      var pair = line.split("=");
      if (pair[0] == "Background")
        colours.push(new ColourPos(pair[1], -1));
      else if (pair[0][0] == "P") //PositionX=
        position = parseFloat(pair[1]);
      else if (pair[0][0] == "C") { //ColourX=
        //Colour constructor handles html format colours, if no # or rgb/rgba assumes integer format
        colours.push(new ColourPos(pair[1], position));
        //Some old palettes had extra colours at end which screws things up so check end position
        if (position == 1.0) break;
      } else if (pair[0])
        //New style: position=value
        colours.push(new ColourPos(pair[1], pair[0]));
    }

    //Check for all-transparent palette and fix
    var opaque = false;
    for (var c = 0; c < colours.length; c++)
      if (colours[c].colour.alpha > 0) opaque = true;
    if (!opaque) {
      for (var c = 0; c < colours.length; c++)
        colours[c].colour.alpha = 255;
    }

    //Update palette colours
    paletteUpdate();
  }

/////////////////////////////////////////////////////////////////////////
//Colour palette rendering 

  function drawPalette(canvas, width, height, ui){  
    if (!canvas) {
      var area = document.getElementById("palettes");
      canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 16;
      area.appendChild(canvas);
    }

    if (colours.length == 0)
    {
      colours.push(new ColourPos("#ffffff", -1)); //Background
      colours.push(new ColourPos("#000000", 0));
      colours.push(new ColourPos("#ffffff", 1));
    }

    if (canvas.getContext){  
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext('2d');  
      var slider = document.getElementById("slider");
      var my_gradient = context.createLinearGradient(0, 0, width, 0);
      for (var i = 1; i < colours.length; i++)
         my_gradient.addColorStop(colours[i].position, colours[i].colour.html());

      context.fillStyle = my_gradient;
      context.fillRect(0, 0, width, height);

      var bg = document.getElementById('backgroundCUR');
      bg.style.background = colours[0].colour.html();

      if (!ui) return;  //Skip drawing slider interface

      for (var i = 2; i < colours.length-1; i++)
      {
        var x = Math.floor(width * colours[i].position) + 0.5;
        var HSV = colours[i].colour.HSV();
        if (HSV.V > 50)
          context.strokeStyle = "black";
        else
          context.strokeStyle = "white";
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.closePath();
        context.stroke();
        x -= (slider.width / 2);
        context.drawImage(slider, x, 0);  
      } 
    }  
  }

/////////////////////////////////////////////////////////////////////////
//Editor windows & data passing 

var paletteWindow;
var editorWindow;
var editorFilename;

  function openPaletteEditor() {
    paletteWindow = window.open("paletteeditor.html", "PaletteEditor", "toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=1,width=400,height=500");
  }
  function closePaletteEditor() {
    //paletteWindow = null;
  }

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
    var paletteData = getPalette();
    ajaxWriteFile("default.palette", paletteData, consoleWrite);
  }
  //Get palette
  function getPalette(){
    var paletteData = 'Background=' + colours[0].colour.html();
    for (var i = 1; i < colours.length; i++)
      paletteData += '\n' + colours[i].position.toFixed(6) + '=' + colours[i].colour.html();
    return paletteData;
  }


/////////////////////////////////////////////////////////////////////////
//Saving result images 

  function saveImage() {
    var canvas = document.getElementById("fractal-canvas");
    //window.open(canvas.toDataURL());
    window.open(canvas.toDataURL("image/jpeg"));
    //addImage(canvas.toDataURL("image/png"));
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
  var elementId = e.target.id;
  if (e.target.className == "colour") colourPickerElement(e.target);
}

var editColour = -1;
var editElement = null;
function colourPickerOK(val) { 
  if (editColour >= 0)
  {
    //Update colour with selected
    colours[editColour].insert = false; //Clear insert flag
    colours[editColour].colour.setHSV(val);
    paletteUpdate();
  }
  else if (editElement) {
    var col = new Colour(0);
    col.setHSV(val);
    editElement.style.backgroundColor = col.html();
  }

  editColour = -1;
  editElement = null;
}
function colourPickerX() { 
  //If adding a new colour, delete it
  colourPickerAbort();
  editColour = -1;
}

function colourPickerAbort() { 
  //If adding a new colour, delete it
  if (editColour >= 0 && colours[editColour].insert)
  {
    colours.splice(editColour,1);
    paletteUpdate();
  }
}

function colourPickerElement(el) { 
  //Open colour picker for element, not using colour array
  editElement = el;
  var col = new Colour(el.style.backgroundColor)
  HSVupdate(col.HSVA());

    loadSV(); //Shouldn't call these except first load!
    loadA();
  
    $S('plugin').left=el.offsetLeft+'px';
    $S('plugin').top=el.offsetTop+'px';
    $S('plugin').display='block';
}

function colourPicker(i, x, y) { 

  HSVupdate(colours[i].colour.HSVA());

  //Open/position picker unless already open
  if (editColour < 0)
  {
    loadSV(); //Shouldn't call these except first load!
    loadA();

    $S('plugin').left=x+'px';
    $S('plugin').top=y+'px';
    $S('plugin').display='block';
  }

  editColour = i;
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
  if (filename.indexOf(".ini") > -1)
    fractal.iniParser(source, true);
  else
    fractal.loadPalette(source);
}

