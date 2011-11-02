
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
var hasChanged = false;
var editorTheme = 'dark';

  function consoleWrite(str) {
    var console = document.getElementById('console');
    console.value = str + "\n" + console.value;
  }

  function pageStart() {
    //Default editor line offset
    formulaOffsets[""] = 1;

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList) {
      // Great success! All required File APIs are supported.
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }

    //Get shader source files on server
    sources["shaders/fractal-header.frag"] = "";
    sources["shaders/fractal-shader.frag"] = "";
    sources["shaders/complex-math.frag"] = "";
    sources["shaders/shader2d.vert"] = "";

    //Base parameters for all formulae defined in here
    sources["formulae/base.base.formula"] = "";

    //Load the last program state
    loadState();

    //Load the content from files
    loadSources();

    showPanel(document.getElementById('tab1'), 'panel1');   //Show first tab
  }

  function loadSources() {
    //Load a from list of remaining source files
    for (filename in sources)
      //if (!sources[filename]) iframeReadFile(filename);  //iFrame file reader that works offline (sometimes)
      if (!sources[filename]) ajaxReadFile(filename, saveSource);
  }

  //External content load via iframe dynamic insert
  function iframeReadFile(doc) {
   //Unfortunately doesn't work in chrome for local files in sub-directories,
   //Stupidly it treats them as from another domain

    // create a new iframe element
    var iframe = document.createElement('iframe');
    // set the src attribute to that url
    iframe.setAttribute('src', doc);
    iframe.setAttribute('name', doc);
    iframe.setAttribute('onload', 'transferHTML(this)');
    // insert the script into our page
      consoleWrite("Loading " + doc);
      //<iframe onload="transferHTML();" id="hiddenContent" name=""></iframe>
    document.getElementById('hidden').appendChild(iframe);
  }

  function transferHTML(srcFrame) {
    var doc = srcFrame.name;
    srcContent='';
    //if (srcFrame.contentDocument) {
      srcContent=srcFrame.contentDocument.body.textContent; //innerHTML; //textContent;
    //}
    //else if (srcFrame.contentWindow) {
    //  srcContent=srcFrame.contentWindow.document.body.textContent;
    //  srcContent=srcFrame.contentWindow.document.body.textContent;
    //}
    sources[doc] = srcContent;

    var remain = 0;
    for (filename in sources)
      if (sources[filename].length == 0) remain++;

    if (remain == 0)
      appInit();  //All data loaded, call init
  }

  //Source file loaded
  function saveSource(filename, data){
    sources[filename] = data; //Save content
    var remain = 0;
    for (filename in sources)
      if (sources[filename].length == 0) remain++;

    if (remain == 0)
      appInit();  //All data loaded, call init
  }

  //Once we have source data, app can be initialised
  function appInit() {
    //Fractal canvas event handling
    var canvas = document.getElementById("fractal-canvas");
    canvas.mouse = new Mouse(canvas, new MouseEventHandler(canvasMouseClick, canvasMouseMove, canvasMouseWheel));
    canvas.mouse.wheelTimer = true;
    defaultMouse = document.mouse = canvas.mouse;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.inputs.elements["autosize"].checked = autosize;
    window.onresize = autoResize;
    window.onbeforeunload = beforeUnload;

    //Init WebGL
    var webgl = new WebGL(canvas);

    //Create a fractal object
    fractal = new Fractal(canvas, webgl);

    //Colour editing and palette management
    colours = new ColourEditor();

    //Draw & update
    loadLastFractal();  //Restore last if any
    fractal.applyChanges();
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

  function deleteFractal() {
    var sel = $('stored');
    var selidx = sel.selectedIndex;
    var name = sel[selidx].text;
    if (!name || !confirm('Really delete the fractal: "' + name + '"')) return;
    var opt = sel[selidx];
    //alert("[" + opt.idx + "] " + opt.text + " == " + opt.value);
    sel.remove(selidx);
    try {
      localStorage.removeItem("fractured.names." + opt.idx);
      localStorage.removeItem("fractured.fractal." + opt.idx);
    } catch(e) {
      alert('Storage delete error! ' + e);
    }
  }

  function selectedFractal(select) {
    var choice = select[select.selectedIndex];
    fractal.load(choice.value);
    fractal.name = choice.text;
    $('nameInput').value = choice.text;
    //alert(colours.palette.toString());
      //fractal.applyChanges();
    //fractal.draw();
  }

  function clearFractal() {
    fractal.resetDefaults();
    fractal.formulaDefaults();
    //De-select
    $('stored').selectedIndex = -1;
  }

  function saveFractal(toExport) {
    fractal.applyChanges();
    source = fractal + "";
    if (toExport) {
      //var exportLink = document.createElement('a');
      //exportLink.setAttribute('href', 'data:text/fractal;base64,' + window.btoa(source));
      //exportLink.appendChild(document.createTextNode('test.csv'));
      //document.getElementById('results').appendChild(exportLink);
      location.href = 'data:text/fractal;base64,' + window.btoa(source);
      //Write to disk on server
      //function fileSaved() {window.open("saved.fractal");}
      //ajaxWriteFile("saved.fractal", source, fileSaved);
    } else {
      //Save current fractal to list
      if (!supports_html5_storage()) return;
      var sel = $('stored')
      if (sel.length > 0 && sel.selectedIndex >= 0) {
        //Save existing
        var choice = sel[sel.selectedIndex];
        if (choice.text == fractal.name) {
          if (confirm('Overwrite "' + choice.text + '"?')) {
            var idx = choice.idx;
            choice.text = fractal.name; //Update name in case changed
            try {
              localStorage["fractured.names." + idx] = fractal.name; //namestr;
              localStorage["fractured.fractal." + idx] = source;
            } catch(e) {
              alert('Storage error! ' + e);
            }
            return;
          }
        }
      }

      //Save new
      //Get name and check list for dupes
      var namestr = fractal.name;
      if (!namestr) namestr = "unnamed";
      var add = 0;
      var checkstr = namestr;
      var i;
      do {
         for (i=0; i<sel.options.length; i++) {
            if (checkstr == sel.options[i].text) {
               checkstr = namestr + (++add);
               break;
            }
         }
      } while (i < sel.options.length);
      if (namestr != checkstr && !confirm('Save as "' + checkstr + '"?')) return;
      namestr = checkstr;
      //Add to select
      var opt = new Option(namestr, source);
      sel.options[sel.length] = opt;

      var idx_str = localStorage["fractured.fractals"];
      var idx = (idx_str ? parseInt(idx_str) : 0);
      idx++;
      //Save index/id with option
      opt.idx = idx;
      try {
        localStorage["fractured.names." + idx] = namestr;
        localStorage["fractured.fractal." + idx] = source;
        localStorage["fractured.fractals"] = idx;
      } catch(e) {
        //data wasn’t successfully saved due to quota exceed so throw an error
        alert('Storage error! ' + e);
        //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
      }
    }
  }

  function resetState() {
    if (confirm('This will clear everything!')) {
      localStorage.clear(); //be careful as this will clear the entire database, TODO: Confirm
      window.location.reload(false);
    }
    //localStorage.removeItem("fractured.formulae");
  }

  //Import/export all local storage to a text file
  function exportState() {
    var source = JSON.stringify(localStorage);
    location.href = 'data:text/store;base64,' + window.btoa(source);
  }

  function importState(source) {
    if (!confirm('This will overwrite everything!')) return;
    try {
      var parsed = JSON.parse(source);
      for (key in parsed)
        localStorage[key] = parsed[key];
      window.location.reload(false);
    } catch(e) {
      alert('Error! ' + e);
    }
  }

  function loadState() {
    //Load formulae from local storage (or defaults from server if not found)
    var formulae;
    var selected;
    var f_source;
    if (supports_html5_storage()) f_source = localStorage["fractured.formulae"];
    if (f_source) {
       formulae = JSON.parse(f_source);
       selected = JSON.parse(localStorage["fractured.selected"]);
       editorTheme = localStorage["fractured.editorTheme"];
    } else {
       //Standard formulae library
       formulae = {"fractal":["Mandelbrot","Burning Ship","Magnet 1","Magnet 2","Magnet 3","Nova","Novabs","Cactus","Phoenix","Stretch","GM","GMM","Quadra"],"transform":["Inverse","Functions","Fractured"],"colour":["Default","Smooth","Exponential Smoothing","Triangle Inequality","Orbit Traps","Gaussian Integers","Hot and Cold"]};

       selected = {"base" : "base", "fractal" : "mandelbrot", "pre_transform" : "none", "post_transform" : "none",
                    "outside_colour": "default", "inside_colour": "none"};
       editorTheme = 'dark';
    }

    labels = {};
    $("fractal_formula").options.length = 0;
    $("pre_transform_formula").options.length = 0;
    $("post_transform_formula").options.length = 0;
    $("outside_colour_formula").options.length = 0;
    $("inside_colour_formula").options.length = 0;
    addToSelect("pre_transform", "none", "");
    addToSelect("post_transform", "none", "");
    addToSelect("outside_colour", "none", "");
    addToSelect("inside_colour", "none", "");
    addToSelect("inside_colour", "same", "As above");
    for (type in formulae) {
      for (i in formulae[type]) {
        var name = addFormula(type, formulae[type][i]);
        //Load sources from local storage
        var filename = formulaFilename(type, name);
        if (localStorage[filename])
          sources[filename] = localStorage[filename];
      }
    }
    //Set selected defaults
    $('fractal_formula').value = selected['fractal'];
    $('pre_transform_formula').value = selected['pre_transform'];
    $('post_transform_formula').value = selected['post_transform'];
    $('outside_colour_formula').value = selected['outside_colour'];
    $('inside_colour_formula').value = selected['inside_colour'];

    //Get list of saved fractals
    if (!supports_html5_storage()) return;
    $('stored').options.length = 0;  //Clear list
    var idx_str = localStorage["fractured.fractals"];
    if (idx_str) {
      var idx = parseInt(idx_str);
      var opt;
      for (var i=1; i<=idx; i++) {
        var namestr = localStorage["fractured.names." + i];
        if (!namestr) continue; //namestr = "unnamed";
        var source = localStorage["fractured.fractal." + i];
        opt = new Option(namestr, source);
        $("stored").options[$("stored").length] = opt;
        //Save index/id on option
        opt.idx = i;
      }
      //Update index if unused at end
      if (opt && i > opt.idx+1)
        localStorage["fractured.fractals"] = opt.idx;
    }
  }

  function loadLastFractal() {

    //Load current fractal (as default)
    var source = localStorage["fractured.active"];
    if (source) {
      fractal.load(source);
      fractal.name = localStorage["fractured.name"];
      $('nameInput').value = fractal.name;
    }

    //var sel = $('stored')
    //sel.selectedIndex = sel.length-1;
    //if (sel.selectedIndex >= 0)
    //   selectedFractal(sel);
  }

  function saveState() {
    //Read the lists
    try {
      var types = ["fractal", "transform", "colour"];
      var selects = ["fractal", "pre_transform", "outside_colour"];
      var formulae = {};
      var selected = {};
      for (t in types) {
        var start = 0;
        if (t > 0) start = 1; //Skip "none"
        var selname = selects[t] + "_formula";
        select = $(selname);
        formulae[types[t]] = [];
        for (i=start; i<select.length; i++) {
          var filename = formulaFilename(types[t], select.options[i].value);
          formulae[types[t]][i-start] = select.options[i].text;
          //Store formula source using filename key
          localStorage[filename] = sources[filename];
        }
        //Get selected
        selected[types[t]] = select.options[select.selectedIndex].value;
      }
      //Save formulae
      localStorage["fractured.formulae"] = JSON.stringify(formulae);
      //Save selected formulae
      localStorage["fractured.selected"] = JSON.stringify(selected);
      //Save current fractal (as default)
      localStorage["fractured.active"] = fractal;
      localStorage["fractured.name"] = fractal.name;
      ////saveFractal(false);
      //Save some global settings
      localStorage["fractured.editorTheme"] = editorTheme;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Quota exceeded! ' + e);
    }
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

  function addFormula(type, label, name) {
    if (name == undefined) name = getNameFromLabel(label);
    if (!labels[name]) {
      //Source not yet loaded
      sources["formulae/" + name + "." + type + ".formula"] = "";
      labels[name] = label;
    }
    if (type.indexOf("colour") > -1) {
      addToSelect("outside_colour", name, label);
      addToSelect("inside_colour", name, label);
    } else if (type.indexOf("transform") > -1) {
      addToSelect("pre_transform", name, label);
      addToSelect("post_transform", name, label);
    } else
      addToSelect(type, name, label);
    return name;
  }

  function formulaFilename(type, name) {
    var ext = type;
    if (type.indexOf("colour") > -1) ext = "colour";
    if (type.indexOf("transform") > -1) ext = "transform";
    return "formulae/" + name + "." + ext + ".formula";
  }


/////////////////////////////////////////////////////////////////////////
////Tab controls
  var panels = ['panel1', 'panel2', 'panel3', 'panel4'];
  var selectedTab = null;
  function showPanel(tab, name)
  {
    if (selectedTab) 
    {
      selectedTab.style.paddingTop = '';
      selectedTab.className = 'gradient';
      selectedTab.style.backgroundColor = '';
    }
    selectedTab = tab;
      selectedTab.className = '';
    selectedTab.style.backgroundColor = '#e9e4cc';
    selectedTab.style.paddingTop = '2px';
    for(i = 0; i < panels.length; i++)
      document.getElementById(panels[i]).style.display = (name == panels[i]) ? 'block':'none';

    //Resize expression edit fields
    if (selectedTab.id == "tab1") growTextAreas();
    return false;
  }

  function growTextAreas() {
    var elem = document.getElementById('inputs').elements;
    for(var i = 0; i < elem.length; i++)
      if (elem[i].type == 'textarea') grow(elem[i]);
  }

  function grow(textarea) {
    // Value of the line-height CSS property for the textarea.
    var newHeight = textarea.scrollHeight;
    var currentHeight = textarea.clientHeight;
    if (newHeight > currentHeight)
       textarea.style.height = newHeight + "px";
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
//Event handling

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

  function beforeUnload() {
    if (hasChanged) return "There are un-saved changes"
  }

//Fractal canvas mouse event handling
  function canvasMouseClick(event, mouse) {
    if (event.button > 0) return true;

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
    if (!fractal) return true;
    if (mouse.x >= 0 && mouse.y >= 0 && mouse.x <= mouse.element.width && mouse.y <= mouse.element.height)
    {
      //Convert mouse coords into fractal coords
      var point = fractal.origin.convert(mouse.x, mouse.y, mouse.element);
      point.re += fractal.origin.re;
      point.im += fractal.origin.im;
      document.getElementById("coords").innerHTML = "&nbsp;re: " + point.re.toFixed(8) + " im: " + point.im.toFixed(8);
    }
    if (!mouse.isdown) return true;

    //Right & middle buttons: drag to scroll
    if (mouse.button > 0) {
      // Set the scroll position
      window.scrollBy(-mouse.deltaX, -mouse.deltaY);
      return true;
    }

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
      return true;
    } else if (event.shiftKey) {
      /* SHIFT + scroll */
      fractal.origin.rotate += 10 * event.spin;
    } else if (event.altKey) {
      /* ALT + scroll -> rotate */
      fractal.origin.rotate += event.spin;
    } else {
      /* Zoom */
      if (event.spin < 0)
         fractal.origin.zoom *= (1/(-event.spin * 1.1));
      else
         fractal.origin.zoom *= (event.spin * 1.1);
    }

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

function ColourEditor(gl) {
  this.inserting = false;
  this.editing = -1;
  this.element = null;
  this.picker = new ColourPicker(saveColour, abortColour);
  this.editcanvas = document.getElementById('palette')
  this.gradientcanvas = document.getElementById('gradient')

  //Load texture data and draw palette
  fractal.gradientTexture.image = this.gradientcanvas;
  //Create default palette object
  this.palette = new Palette();
  this.palette.draw(this.editcanvas, true);
  //Event handling for palette
  this.editcanvas.mouse = new Mouse(this.editcanvas, this);
  this.editcanvas.mouse.ignoreScroll = true;
  this.editcanvas.oncontextmenu="return false;";
  this.editcanvas.oncontextmenu = function() { return false; }      
}

//Palette management
ColourEditor.prototype.read = function(source) {
  //Read a new palette from source data
  this.palette = new Palette(source);
  this.reset();
  this.palette.draw(this.editcanvas, true);
}

ColourEditor.prototype.update = function() {
  this.palette.draw(this.editcanvas, true);
  //Update gradient texture
  this.palette.draw(this.gradientcanvas, false);  //WebGL texture size (power of 2)
  fractal.updateTexture();
}

ColourEditor.prototype.savePalette = function() {
  if (!supports_html5_storage()) return;
  try {
    localStorage["fractured.current.palette"] = this.palette.toString();
  } catch(e) {
    //data wasn’t successfully saved due to quota exceed so throw an error
    alert('Quota exceeded! ' + e);
  }
}

ColourEditor.prototype.loadPalette = function() {
  if (!supports_html5_storage()) return;
  read(localStorage["fractured.current.palette"]);
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
    this.cancel();  //Abort any current edit first
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
    if (event.ctrlKey) {
      //Flip
      for (var i = 1; i < this.palette.colours.length; i++)
        this.palette.colours[i].position = 1.0 - this.palette.colours[i].position;
      this.palette.draw(this.editcanvas, true);
      return false;
    }

  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  if (mouse.slider != null)
  {
    //Slider moved, update texture
    mouse.slider = null;
    this.palette.draw(this.editcanvas, true);
    return false;
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
      }
    } else {
      //Clicked elsewhere, add new colour
      this.insert(mouse.x / pal.width, event.clientX-128, 30);
    }
  }
  return false;
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
  }
  this.palette.draw(this.editcanvas, true);
}


/////////////////////////////////////////////////////////////////////////
//File upload handling
function fileSelected(files) {
  var filetype = document.getElementsByName("filetype");
  var callback = loadFile;
  if (filetype[1].checked) callback = fractal.loadPalette; //loadPalette;
  if (filetype[2].checked) callback = importState;
  filesProcess(files, callback);
}

function filesProcess(files, callback) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    //alert(file.name + " -- " + file.size);
    //new ajaxUploadFile(file, callback);
    //User html5 fileReader api (works offline)
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(file) {
        return function(e) {
          //alert(e.target.result);
          callback(e.target.result, file.name);
        };
      })(file);

      // Read in the file (AsText/AsDataURL/AsArrayBuffer/AsBinaryString)
      reader.readAsText(file);
  }
}

function loadFile(source, filename) {
  if (filename.indexOf(".ini") > -1) {
    fractal.iniLoader(source);
    filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
  } else {
    fractal.load(source);
  }
  //$("namelabel").value = filename.substr(0, filename.lastIndexOf('.')) || filename;
  fractal.name = filename.substr(0, filename.lastIndexOf('.')) || filename;
  $('nameInput').value = fractal.name;
}

