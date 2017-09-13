//Constants
var WEBGL = 0;
var WEBCL = 1;
var WEBCL64 = 2;
var SERVER = -1;
var newline = /\r\n?|\n/;

var sectionnames = {"core" : "Core", "fractal" : "Fractal", "pre_transform" : "Pre-transform", "post_transform" : "Post-transform", "outside_colour" : "Outside Colour", "inside_colour" : "Inside Colour", "filter" : "Filter"}
var formulaTypes = ["core", "fractal", "transform", "colour"];

var savevars = {};
var fractal_savevars = {};

/**
 * @constructor
 */
function Timer(oncomplete) {
  this.time = new Date().getTime();
  this.oncomplete = oncomplete;
}

Timer.prototype.print = function(action) {
  this.elapsed = new Date().getTime() - this.time;
  print(action + " took: " + (this.elapsed / 1000) + " seconds");
  //If set, call the completion action
  if (this.oncomplete) this.oncomplete();
}


/**
 * @constructor
 */
function Server(url) {
  this.url = url;
  //Only allow one request at a time to be issued
  this.http = new XMLHttpRequest();
  //Show download progress
  this.http.onprogress = function(e) {setProgress(e.loaded / e.total * 100);};

  this.data = "";
  this.timer = null;
}

Server.prototype.draw = function(data, render) {
  this.data = data;
  if (render) {
    //Only issue one draw request at a time with a 100ms timeout
    if (this.timer) clearTimeout(this.timer);
    var that = this;
    this.timer = setTimeout(function () {that.post('/post', true);}, 100);
  } else if (!state.recording) //outputFrame will do the request in record mode (synchronous)
    //Immediate for server control, no image requested
    this.post('/update');
}

Server.prototype.post = function(res, image) {
  var http = this.http;
  if (!image)
    http = new XMLHttpRequest();
  else
    progress("Rendering & downloading fractal image...");

  http.onload = function()
  { 
    if (http.status == 200) {
      if (image) {
        setProgress(100);
        var canvas = document.getElementById("main-fractal-canvas");
        var context = canvas.getContext("2d"); 
        var img = new Image();
        img.onload = function(e) {
          window.URL.revokeObjectURL(img.src); // Clean up after yourself.
          canvas.getContext("2d").drawImage(img, 0, 0);
          progress();
        };
        img.src = window.URL.createObjectURL(http.response);
      }

    } else {
      print("Ajax Post Error: returned status code " + http.status + " " + http.statusText);
    }
  }

  //alert(this.url + res + " : " + fractal.state.control);
  var url = this.url + res;
  http.open("POST", url, true); 
  //http.open("POST", url, false); //Synchronous test

  //Send the proper header information along with the request
  //http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  //XMLHttmpRequest 2
  if (image)
    http.responseType = 'blob';

  http.send(this.data);

  //Timeout 5 seconds
  //setTimeout(function() { http.abort(); }, 5000);
}

/**
 * @constructor
 */
function Aspect(re, im, rotation, zoom) {
  // call base class constructor
  Complex.call(this, re, im); 
  this.rotate = rotation;
  this.zoom = zoom; 
}

//Inherits from Complex
Aspect.prototype = new Complex();
Aspect.prototype.constructor = Aspect;

Aspect.prototype.print = function() {
  return this.re + ',' + this.im + ',' + this.rotate + ',' + this.zoom;
}

Aspect.prototype.toString = function() {
  return "origin=(" + this.re + "," + this.im + ")\n" + 
         "zoom=" + this.zoom + "\n" + 
         "rotate=" + this.rotate + "\n";
}

Aspect.prototype.clone = function() {
  return new Aspect(this.re, this.im, this.rotate, this.zoom);
}

//Returns size of a pixel at current zoom level
Aspect.prototype.pixelSize = function(element) {
  //var unit = 2.0 / this.zoom;
  //var pixel = unit / element.width; //height?
  //debug(element.width + " x " + element.height + " ==> " + size[0] + " x " + size[1]);
  //if (this.zoom > 100) debug("Warning, precision too low, pixel size: " + pixel);
  return 2.0 / (this.zoom * element.width);
//    return new Array(pwidth,pheight);
}

//Converts a set of pixel coords relative to element into
// a new fractal pos based on current fractal origin, zoom & rotate...
Aspect.prototype.convert = function(x, y, element) {

  var half_w = element.width * 0.5;
  var half_h = element.height * 0.5;

  //Scale based on smallest dimension and aspect ratio
  var box = element.width < element.height ? element.width : element.height;
  var scalex = element.width / box;
  var scaley = element.height / box;

  var re = scalex * (x - half_w) / (half_w * this.zoom);
  var im = scaley * (y - half_h) / (half_h * this.zoom);

  //Apply rotation around Z to selected point
  var arad = -this.rotate * Math.PI / 180.0;
  var m = mat4.create();
  mat4.identity(m); // Set to identity
  mat4.rotate(m, arad, [0, 0, 1]); // Rotate around the Z axis
  var vec = vec3.create([re, im, 0]);
  mat4.multiplyVec3(m, vec);
  return new Complex(vec[0], vec[1]);
}

/**
 * @constructor
 */
function LineOffset(category, section, value) {
  this.category = category;
  this.section = section;
  this.value = value;
}

/**
 * @constructor
 */
function Fractal(parentid, colours, ui, selbox) {
  //Construct a new default fractal object
  if (parentid && typeof parentid == 'string') parentid = document.getElementById(parentid);
  this.element = parentid || document.body;
  //Set canvas size
  //this.sizeCanvas();
  this.paramvars = [];
  this.preview = null;
  this.name = "";
  this.ui = ui;

  //Selection box
  if (selbox) {
    this.select = document.createElement("div");
    this.select.id = "select";
    this.select.className = "select";
    this.element.appendChild(this.select);
  }

  //Object with Palette class and read/get functions can be provided (eg: GradientEditor)
  if (colours) {
    this.colours = colours;
  } else {
    //Default is just a wrapper for a palette object
    this.colours = {
        "palette" : new Palette(null, true),
        "read" : function(source) {this.palette = new Palette(source, true);},
        "get"  : function(canvas) {this.palette.draw(canvas, false);}
      };
  }
  //Texture canvas
  this.gradient = document.createElement("canvas");
  this.gradient.width = 2048;
  this.gradient.height = 1;
}

Fractal.prototype.init = function(state) {
  //Use passed state object or create one
  if (!state) state = {};
  this.state = state;

  //Initialise the renderer
  this.setRenderer(this.state.renderer);

  //Set the default fractal options
  this.resetDefaults();
  this.copyToForm();
}

Fractal.prototype.infoString = function() {
  //Some info about browser capability
  var info = "";
  if (window.WebGLRenderingContext) info += "W";
  if (this.webgl) info += "G";
  if (this.webcl) {
    info += "C";
    if (this.webcl.fp64avail) info += "D";
    if (this.webcl.pfstrings) info += this.webcl.pfstrings;
  }
  debug("INFO: " + info);
  return info;
}

Fractal.prototype.switchMode = function(mode) {
  if (mode == SERVER && this.renderer == SERVER) return;
  if (mode == WEBGL && this.webgl) return;
  //Recreate canvas & fractal
  this.setRenderer(mode);
  if (this.cache) {
    this.cache = null;  //Force rebuild
    this.servercache = null;
    this.applyChanges();
  }
}

Fractal.prototype.setRenderer = function(mode) {
  //Create new canvas
  this.canvas = document.createElement("canvas");
  this.canvas.id = this.element.id + "-fractal-canvas";
  this.canvas.className = "checkerboard";
  this.canvas.style.width = this.canvas.style.height = "100%";
  this.canvas.mouse = new Mouse(this.canvas, this);
  this.canvas.mouse.setDefault();

  //Remove existing canvas if any
  var ccanvas = document.getElementById(this.canvas.id);
  if (ccanvas) this.element.removeChild(ccanvas);
  this.element.appendChild(this.canvas);

  //Render mode, If not set, use WebGL if available
  this.renderer = mode;
  if (this.renderer == undefined) this.renderer = WEBGL;
  //if (window.webcl == undefined && this.renderer > WEBGL) this.renderer = WEBGL;

  //Create the local renderer if enabled
  if (!this.state.disabled) {
    //WebCL local renderer
    if (this.renderer >= WEBCL) {
      //Init WebCL
      if (this.webcl) this.webcl.free();
      try {
        this.webcl = new OpenCL(this.state.platform, this.state.device);  //Use existing settings

        if (this.renderer > WEBCL && !this.webcl.fp64avail) {
          popup("Sorry, the <b><i>cl_khr_fp64</i></b> or the <b><i>cl_amd_fp64</i></b> " + 
                "extension is required for double precision support in WebCL");
          this.renderer = WEBCL;
        }

        debug(this.state.platform + " : " + this.state.device + " --> " + this.canvas.width + "," + this.canvas.height);
        this.webcl.init(this.canvas, this.renderer > WEBCL, 8, this.gradient);
        this.webgl = undefined;
      } catch(e) {
        //WebCL init failed, fallback to WebGL
        var error = e;
        if (e.message) error = e.message;
        if (mode >= WEBGL) popup("WebCL could not be initialised (" + error + ")");
        this.webcl = null;
        this.renderer = WEBGL;
      }
    }

    //WebGL local renderer
    if (this.renderer == WEBGL) {
      try {
        if (this.disabled) this.webgl = 1;
        //Init WebGL
        //Antialias, optional?
        //var options = { antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true};
        //var antialias = gl.getContextAttributes().antialias; //Query and set built in aa lower??
        var options = {premultipliedAlpha: false, preserveDrawingBuffer: true};
        //Opera bug: if this is not set images are upside down
        this.webgl = new WebGL(this.canvas, options);
        this.gl = this.webgl.gl;
        this.webgl.init2dBuffers();
      } catch(e) {
        //WebGL init failed
        var error = e;
        if (e.message) error = e.message;
        popup("WebGL support not available (" + error + 
              ")<br>Try <a href='http://get.webgl.org/troubleshooting'>" + 
              "http://get.webgl.org/troubleshooting</a> for more information.");
        this.webgl = null;
        this.renderer = SERVER;
      }
    }
  }

  //Server side renderer
  if (this.state.server)
    this.server = new Server(this.state.server);

  debug(this.state.server + " SERVER: " + this.server);
  
  //#Update UI
  if (this.ui) {
    //(reset all to enabled, 
    //shouldn't be necessary but this state seems not to be cleared sometimes)
    document.getElementById("server").disabled = false;
    document.getElementById("webgl").disabled = false;
    document.getElementById("webcl").disabled = false;
    document.getElementById("fp64").disabled = false;
    document.getElementById("webcl_list").disabled = true;
    if (!this.webcl) {
      if (window.webcl == undefined || !webcl.getPlatforms) {
        document.getElementById("webcl").disabled = true;
        document.getElementById("fp64").disabled = true;
      }
    } else {
      document.getElementById("fp64").disabled = !this.webcl.fp64avail;
      this.webcl.populateDevices(document.getElementById("webcl_list"));
      if (this.renderer >= WEBCL) document.getElementById("webcl_list").disabled = false;
    }
    if (!window.WebGLRenderingContext || this.webgl === null) {
      document.getElementById("webgl").disabled = true;
    }
    if (!this.state.server) {
      document.getElementById("server").disabled = true;
    }

    //Style buttons
    document.getElementById("server").className = "";
    document.getElementById("webgl").className = "";
    document.getElementById("webcl").className = "";
    document.getElementById("fp64").className = "";
    if (this.renderer == SERVER) 
      document.getElementById("server").className = "activemode";
    else if (this.renderer == WEBGL) 
      document.getElementById("webgl").className = "activemode";
    else if (this.renderer == WEBCL64 && this.webcl.fp64)
      document.getElementById("fp64").className = "activemode";
    else if (this.renderer == WEBCL)
      document.getElementById("webcl").className = "activemode";

    var renderer_names = ["Server", "WebGL", "WebCL", "WebCL fp64"];
    print("Mode set to " + renderer_names[this.renderer+1]);

    //Save last used renderer in state
    this.state.renderer = this.renderer;
    this.state.saveStatus();
  }
}

//Fractal.prototype.webclSet = function(pfid, devid) {
Fractal.prototype.webclSet = function(valstr) {
  var val = JSON.parse(valstr);
  //Init with new selection
  this.state.platform = val.platform;
  this.state.device = val.device;
  this.setRenderer(this.renderer);

  //Redraw if updating
  if (this.cache) {
    //Invalidate shader cache
    this.cache = null;
    this.applyChanges();
  }
}

Fractal.prototype.precision = function(val) {
  if (this.renderer > WEBGL && this.webcl.fp64) return val.toFixed(15);
  return val.toFixed(8);
}

//Actions
Fractal.prototype.restore = function(im, re, rotate, zoom, selected, julia) {
  //Restore position settings to a previous state
  this.position = new Aspect(im, re, rotate, zoom);
  this.selected = selected;
  this.julia = julia;
  this.copyToForm();
  this.draw();
}

Fractal.prototype.setOrigin = function(point) {
  //Adjust centre position
  this.position.re += point.re;
  this.position.im += point.im;
}

Fractal.prototype.applyZoom = function(factor) {
  //Adjust zoom
  this.position.zoom *= factor;
}

Fractal.prototype.selectPoint = function(point) {
  //Julia set switch
  if (point && !this.julia) {
    this.julia = true;
    this.selected.re = this.position.re + point.re;
    this.selected.im = this.position.im + point.im;
    if (this.ui) {
      document.getElementById("xSelect").value = this.selected.re;
      document.getElementById("ySelect").value = this.selected.im;
    }
  } else {
    this.julia = false;
  }

  //Switch saved views
  var tempPos = this.position.clone();
  this.position = this.savePos.clone();
  this.savePos = tempPos;
}

Fractal.prototype.resetDefaults = function() {
  //debug("resetDefaults<hr>");
  //Default aspect & parameters
  this.width = 0;
  this.height = 0;
  this.position = new Aspect(0, 0, 0, 0.5); 
  this.savePos = new Aspect(0, 0, 0, 0.5);
  this.selected = new Complex(0, 0);
  this.julia = false;
  this.iterations = 100;

  this.choices = {"core" : null, "fractal" : null, "pre_transform" : null, "post_transform" : null,
                  "outside_colour" : null, "inside_colour" : null, "filter" : null};

  //#Reset default params
  for (category in this.choices)
    this.choices[category] = new FormulaSelection(category);
}

Fractal.prototype.formulaDefaults = function() {
  //# UI
  if (!this.ui) return;
  for (category in this.choices)
    this.choices[category].reselect(0);
  this.choices['outside_colour'].reselect(1); //Exception for default!
}

Fractal.prototype.editFormula = function(category) {
  if (this.choices[category].selected != "none")
    openEditor(this.choices[category].getkey() + "#" + category);
}

Fractal.prototype.newFormula = function(select) {
  var type = categoryToType(select);
  var label = prompt("Please enter name for new " + type + " formula", "");
  if (!label) return;

  //Add the formula
  var key = this.choices[select].getkey();
  var source = null;
  if (formula_list[key])
     source = formula_list[key].source;
  var f = new FormulaEntry(type, label, source);
  if (!f) return;

  this.choices[select].select(f.name); //Set selected
  document.getElementById(select + '_formula').value = f.name;
  this.editFormula(select);
}

Fractal.prototype.importFormula = function(source, filename) {
  var arr = filenameToName(filename);
  var name = arr[0];
  var type = arr[1];
  if (formulaTypes.indexOf(type) < 0) return; //Must contain valid type as extension, prevents junk import
  var key = type + "/" + name;
  if (formula_list[key]) {
    if (formula_list[key].equals(source)) return;

    if (confirm("Replace formula definition " + key + " with new definition from this file?")) {
      formula_list[key].source = source;
      debug("Replacing formula code for: " + key);
      return;
    }
  }

  //New formula
  var f = new FormulaEntry(type, nameToLabel(name), source);
}

Fractal.prototype.deleteFormula = function(select) {
  var sel = document.getElementById(select + '_formula');
  var selid = sel.selectedIndex;
  var key = formulaKey(select, sel.options[selid].value);
  if (!key) return;
  var label = formula_list[key].label;
  if (!label || !confirm('Really delete the "' + label + '" formula?')) return;
  sel.remove(selid);
  delete formula_list[key];
  //Select previous
  sel.selectedIndex = selid - 1;
  saveSelections(); //Update formula selections into selected variable
  //Finally, reselect
  this.reselectAll();
}

Fractal.prototype.reselectAll = function() {
  for (category in this.choices)
    this.choices[category].reselect();
}

//Save fractal (write param/source file)
Fractal.prototype.toString = function() {
  //All information required to reconstruct fractal
  return this.paramString() + this.formulaParamString() + this.formulaSourceString() + this.paletteString() + this.scriptString();
}

Fractal.prototype.toStringNoFormulae = function() {
  //All information required to reconstruct fractal if formula set already loaded
  return this.paramString() + this.formulaParamString() + this.paletteString() + this.scriptString();
}

Fractal.prototype.toStringMinimal = function() {
  //All information required to reconstruct fractal if formula set and palette already loaded
  return this.paramString() + this.formulaParamString();
}

Fractal.prototype.paramString = function(server) {
  //Return fractal parameters as a string
  var code = "[fractal]\n";
  code += "name=\"" + this.name + "\"\n";
  if (this.state.version) code += "version=" + this.state.version + "\n";
  if (server) {
    //Always send actual size
    code += "width=" + this.canvas.clientWidth + "\n" +
            "height=" + this.canvas.clientHeight + "\n";
  } else if (this.width && this.height) {
    //No width & height = autosize
    code += "width=" + this.width + "\n" +
            "height=" + this.height + "\n";
  }
  code += this.position +
          "selected=" + this.selected + "\n" +
          "julia=" + this.julia + "\n" +
          "iterations=" + this.iterations + "\n";

  //Formula selections
  if (!server) {
    for (category in this.choices)
      code += category + "=" + this.choices[category].selected + "\n";
  }

  if (!server && this.savePos) code += "\n[preview]\n" + this.savePos + "\n";

  return code;
}

Fractal.prototype.formulaParamString = function() {
  //Return selected formula parameters as a string
  var code = "";
  for (category in this.choices) {
    //Parameter values
    if (this.choices[category].selected != "none" && this.choices[category].currentParams.count() > 0)
        code += "\n[params." + category + "]\n" + this.choices[category].currentParams;
  }
  return code;
}

Fractal.prototype.formulaSourceString = function() {
  //Return selected formula definitions as a string
  var code = "";
  for (category in this.choices) {
    //Formula code (###)
    if (this.choices[category].selected != "none") {
      //Don't save formula source twice if same used
      if (category=="post_transform" && this.choices["post_transform"].selected == this.choices["pre_transform"].selected) continue;
      if (category=="inside_colour" && this.choices["outside_colour"].selected == this.choices["inside_colour"].selected) continue;
      code += "\n[formula." + category + "]\n" + this.choices[category].getSource();
    }
  }
  return code;
}

Fractal.prototype.paletteString = function() {
  //Return active palette as a string
  return "\n[palette]\n" + this.colours.palette;
}

Fractal.prototype.scriptString = function() {
  //Return active script as a string
  var script = localStorage["scripts/" + this.name + ".js"];
  if (script)
    return "\n\n[script]\n" + script;
  return "";
}

Fractal.prototype.loadPalette = function(source) {
  //Parse out palette section only, works with old and new file formats
  var lines = source.split(newline); // split on newlines
  var buffer = "";
  var section = "";
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line[0] == "[")
      section = line.slice(1, line.length-1);
    else if (section.toLowerCase() == "palette")
      buffer += lines[i] + "\n";
  }
  this.colours.read(buffer);
}

//Load fractal from file
Fractal.prototype.load = function(source, checkversion, noapply) {
  //if (!this.webgl && !this.webcl) return;
  //Strip leading : from old data
  source = source.replace(/:([a-zA-Z_])/g, "$1"); //Strip ":", now using @ only
  //Only prompt for old fractals when loaded from file or stored, not restored or from server
  if (this.state.debug && checkversion && source.indexOf("version=") < 0
      && confirm("No version found in fractal source. Load fractal in compatibility mode?")) {
    return this.loadOld(source, noapply);
  }
  //Reset everything...
  this.resetDefaults();
  this.formulaDefaults();
  //1. Load fixed params as key=value: origin, selected, julia, 
  //2. Load selected formula names
  //3. Load code for each selected formula
  //4. For each formula, load formula params into params[formula]
  //5. Load palette
  var lines = source.split(newline); // split on newlines
  var section = "";
  var curparam = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line[0] == "[") {
      var buffer = "";
      section = line.slice(1, line.length-1);

      if (section == "palette" || section == "script") {
        //Collect lines
        for (var j = i+1; j < lines.length; j++) {
          if (lines[j][0] == "[") break;
          buffer += lines[j] + "\n";
        }

        if (section == "palette")
          this.colours.read(buffer);

        if (section == "script")
        {
          localStorage["scripts/" + this.name + ".js"] = buffer;
          //TODO: Fix calling global function from here
          populateScripts();
        }

        i = j-1;
      }
      continue;
    }

    if (!line) continue;

    ///Remove this some day
    if (section == "params.base") section = "fractal";

    if (section == "preview") {
      //Saved preview/julia settings
      var pair = line.split("=");
      if (pair[0] == "origin")
        this.savePos.set(pair[1]);
      else if (pair[0] == "zoom" || pair[0] == "rotate")
        this.savePos[pair[0]] = parseReal(pair[1]);
    }

    if (section == "fractal") {
      //parse into attrib=value pairs
      var pair = line.split("=");

      //Process ini format params
      if (pair[0] == "version")
        print("Loading Fractal params, version: " + pair[1]);
      else if (pair[0] == "width" || pair[0] == "height" || pair[0] == "iterations")
        this[pair[0]] = parseInt(pair[1]);
      else if (pair[0] == "zoom" || pair[0] == "rotate")
        this.position[pair[0]] = parseReal(pair[1]);
      else if (pair[0] == "origin")
        this.position.set(pair[1]);
      else if (pair[0] == "selected")
        this.selected.set(pair[1]);
      else if (pair[0] == "julia")
        this[pair[0]] = (parseInt(pair[1]) == 1 || pair[1] == 'true');
      //Formula selection?
      else if (pair[0] in this.choices) {
        //Formula name, create entry if none
        var name = pair[1];
        var category = pair[0];
        var key = formulaKey(category, name, false);   //3rd param, check flag: Don't check exists because might not yet!
        if (key) {
          //Read ahead to get formula definition!
          var formula_section = "";
          for (var j=i+1; j < lines.length; j++) {
            if (lines[j][0] == "[")
              formula_section = lines[j].slice(1, lines[j].lastIndexOf("]"));
            if (formula_section == "formula." + category) break;
          }
            
          //Included definition for this formula?
          if (formula_section == "formula." + category) {
            //Collect lines into formula code
            var buffer = "";
            for (j = j+1; j < lines.length; j++) {
              if (lines[j][0] == "[") break;
              buffer += lines[j] + "\n";
            }

            //formula load (###)
            if (buffer.length > 0) {
              //New entry?
              if (!formula_list[key]) {
                debug("Imported new formula: " + key);
                var f = new FormulaEntry(categoryToType(category), nameToLabel(name), buffer);
              } else if (!formula_list[key].equals(buffer)) {
                //First search other formulae in this category for duplicate entries!
                var found = false;
                for (k in formula_list) {
                  if (formula_list[k].equals(buffer)) {
                    debug("Found duplicate formula definition, using name: " + formula_list[k].name + " (was: " + name + ")");
                    name = formula_list[k].name;
                    found = true;
                    break;
                  }
                }
                //Existing entry, new definition, create as: formula_name(#)
                if (!found) {
                  var f = new FormulaEntry(categoryToType(category), nameToLabel(name), buffer);
                  name = f.name; //Get new name
                  debug("Imported new formula definition for existing formula: " + key + ", saved as " + name);
                }
              }
            }
          }
        }

        //Formula not existing and not imported?
        if (!this.choices[category].exists(name)) {
          //Last resort is strip off any _(#) additions to get base formula
          var pos = name.lastIndexOf("_");
          if (pos > 0) name = name.substr(0, pos);
        }

        this.choices[category].select(name);
      } else {
        print("Unrecognised fractal parameter: " + line);
      }
    } else if (section.slice(0, 7) == "params.") {
      var pair1 = section.split(".");
      var category = pair1[1];
      if (!category in this.choices) {print("INVALID CATEGORY: " + category); continue;}
      var formula = this.choices[category].selected;
      if (curparam && line.indexOf("=") < 0 && line.length > 0) {
        //Multi-line value (ok for expressions)
        curparam.value += "\n" + lines[i];
      } else {
        var pair2 = line.split("=");
        if (this.choices[category].currentParams[pair2[0]]) {
          curparam = this.choices[category].currentParams[pair2[0]];
          curparam.parse(pair2[1]);
        } else { //Not defined in formula, skip
          print("Undeclared: (" + formula + ") [" + pair2[0] + "]=" + pair2[1]);
        }
      }
    }
  }

  //Select formulae and update parameters
  this.loadParams();

  if (!noapply) this.applyChanges();
}

//Load fractal from file (with back compatibility)
Fractal.prototype.loadOld = function(source, noapply) {
  print("Parsing old fractal style");
  //Reset everything...
  this.resetDefaults();
  this.formulaDefaults();
  //Name change fixes... TODO: resave or run a sed script on all existing saved fractals then can remove these lines
  source = source.replace(/_primes/g, "_integers");
  source = source.replace(/exp_smooth/g, "exponential_smoothing");
  source = source.replace(/magnet(\d)/g, "magnet_$1");
  source = source.replace(/burningship/g, "burning_ship");
  source = source.replace(/zold/gm, "z_old");
  source = source.replace(/^power=/gm, "p=");
  source = source.replace(/^bailfunc=/gm, "bailtest=");
  if (source.indexOf("nova") > 0)
    source = source.replace(/^bailout=/gm, "converge=");
  else
    source = source.replace(/^bailout=/gm, "escape=");
  source = source.replace(/^bailoutc=/gm, "converge=");

    var saved = {}; //Another patch addition, remove once all converted

  var lines = source.split(newline); // split on newlines
  var section = "";
  var curparam = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line[0] == "[") {
      var buffer = "";
      section = line.slice(1, line.length-1);

      if (section == "palette"){
        //Collect lines into palette data
        for (var j = i+1; j < lines.length; j++) {
          if (lines[j][0] == "[") break;
          buffer += lines[j] + "\n";
        }
        this.colours.read(buffer);
        i = j-1;
      }
      continue;
    }

    if (!line) continue;

    ///Remove this later
    if (section == "params.base") {
      //Base params fix temporary hack
      if (line.indexOf("iterations") == 0)
        section = "fractal";
      else
        section = "params.transform";
    }

    if (section == "fractal") {
      //parse into attrib=value pairs
      var pair = line.split("=");

      //Process ini format params
      if (pair[0] == "width" || pair[0] == "height" || pair[0] == "iterations")
        this[pair[0]] = parseInt(pair[1]);
      else if (pair[0] == "zoom" || pair[0] == "rotate")
        this.position[pair[0]] = parseReal(pair[1]);
      else if (pair[0] == "origin")
        this.position.set(pair[1]);
      else if (pair[0] == "selected")
        this.selected.set(pair[1]);
      else if (pair[0] == "julia")
        this[pair[0]] = (parseInt(pair[1]) == 1 || pair[1] == 'true');
      else if (pair[0] == "perturb" && (parseInt(pair[1]) == 1 || pair[1] == 'true'))
        saved["perturb"] = 'true';
      else if (pair[0] == "inrepeat") //Moved to colour, hack to transfer param from old saves
        saved["inrepeat"] = pair[1];
      else if (pair[0] == "outrepeat") //Moved to colour, hack to transfer param from old saves
        saved["outrepeat"] = pair[1];
      else if (pair[0] in this.choices || pair[0] == "transform") {
        //Old formulae, swap transform with post_transform
        if (pair[0] == "transform") pair[0] = "post_transform";
        //Old formulae - replace in lines
        for (var j = i+1; j < lines.length; j++) {
          var oldline = lines[j];
          lines[j] = lines[j].replace("params." + pair[1], "params." + pair[0]);
          lines[j] = lines[j].replace("formula." + pair[1], "formula." + pair[0]);
          if (pair[0] == "inside_colour") lines[j] = lines[j].replace(pair[1] + "_in_", "");
          if (pair[0] == "outside_colour") lines[j] = lines[j].replace(pair[1] + "_out_", "");
          if (lines[j] != oldline) debug(oldline + " ==> " + lines[j]);
        }

        //Formula name, create entry if none
        var name = pair[1];
        var category = pair[0];
        if (!category in this.choices) {print("INVALID CATEGORY: " + category); continue;}
        //Skip formula loading in old files...must have correct formula loaded already
        var key = formulaKey(category, name, false);
        //Formula not existing and not imported?
        if (!this.choices[category].exists(name)) {
          //Last resort is strip off any _(#) additions to get base formula
          var pos = name.lastIndexOf("_");
          if (pos > 0) name = name.substr(0, pos);
          if (!this.choices[category].exists(name)) {
            alert("Formula not found: " + name);
            return;
          }
        }
        this.choices[category].select(name);
      } else {
        print("Unrecognised parameter: " + line);
      }
    } else if (section.slice(0, 7) == "params.") {
      var pair1 = section.split(".");
        //Old formulae, swap transform with post_transform
        if (pair1[1] == "transform") pair1[1] = "post_transform";
      var category = pair1[1];
        if (!category in this.choices) {print("INVALID CATEGORY: " + category); continue;}
      var formula = this.choices[category].selected;
      if (curparam && line.indexOf("=") < 0 && line.length > 0) {
        //Multi-line value (ok for expressions)
        curparam.value += "\n" + lines[i];
      } else {
        var pair2 = line.split("=");
          //Old formulae... remove prefixes
          //so in section [params.inside_colour] remove inside_colour_
          if (pair2[0].indexOf(pair1[1] + "_") == 0) pair2[0] = pair2[0].replace(pair1[1] + "_", "");
        if (this.choices[category].currentParams[pair2[0]]) {
          curparam = this.choices[category].currentParams[pair2[0]];
          curparam.parse(pair2[1]);
        } else { //Not defined in formula, skip
          if (pair2[0] == "vary") { //Moved to fractured transform, hack to transfer param from old saves
            if (parseReal(pair2[1]) > 0) {
              this.choices["post_transform"].select("fractured");
              saved["vary"] = pair2[1];
            }
          } else if (pair2[0] != "antialias") { //Ignored, now a global renderer setting
            print("Undeclared: (" + formula + ") [" + pair2[0] + "]=" + pair2[1]);
          }
        }
      }
    }
  }

  //Select formulae and update parameters
  this.loadParams();

  //Amend changed params, remove this when saved fractals updated
  var reup = false;
  if (saved["perturb"]) {
    this.choices["post_transform"].currentParams["perturb"].parse(saved["perturb"]); 
    reup  = true;
  }
  if (saved["vary"]) {
    this.choices["post_transform"].currentParams["vary"].parse(saved["vary"]); 
    this.choices["post_transform"].currentParams["miniter"].value = this.iterations; 
    reup  = true;
    this.iterations *= 2;
  }
  if (saved["inrepeat"] && this.choices["inside_colour"].currentParams["repeat"] != undefined) {
    this.choices["inside_colour"].currentParams["repeat"].parse(saved["inrepeat"]);
    reup  = true;
  }
  if (saved["outrepeat"] && this.choices["outside_colour"].currentParams["repeat"] != undefined) {
    this.choices["outside_colour"].currentParams["repeat"].parse(saved["outrepeat"]);
    reup  = true;
  }
  if (reup) this.loadParams();
  if (!noapply) this.applyChanges();
}

//Conversion from my old fractal ini files
Fractal.prototype.iniLoader = function(source) {
  //Reset everything...
  this.resetDefaults();
  this.formulaDefaults();
  var saved = {};
  this.choices["post_transform"].select("fractured");

  function convertFormulaName(name) {
    //Conversion for my old fractal ini formula descriptors
    if (name == "Mandelbrot") return "mandelbrot";
    if (name == "Nova") return "nova";
    if (name == "Nova BS" || name == "NovaBS") return "novabs";
    if (name.indexOf("Burning") == 0) return "burning_ship";
    if (name == "Magnet2") return "magnet_2";
    if (name == "Magnet3") return "magnet_3";
    if (name.indexOf("Magnet") == 0) return "magnet_1";
    if (name == "Cactus") return "cactus";
    if (name == "Phoenix") return "phoenix";
    if (name == "Stretched") return "stretch";
    if (name == "Gumball") return "gmm";
    if (name == "Quadra") return "quadra";
    //Colour formulae
    if (name == "Default") return "default";
    if (name.indexOf("Smooth") == 0) return "smooth";
    if (name.indexOf("Exp") == 0) return "exponential_smoothing";
    if (name == "Triangle Inequality") return "triangle_inequality";
    if (name == "Orbit Traps") return "orbit_traps";
    if (name == "Gaussian Integers") return "gaussian_integers";
    return "none";  //Fallback
  }

  var lines = source.split(newline); // split on newlines
  var section = "";

  var paletteSource = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line[0] == "[") {
      section = line;
      continue;
    }

    if (section == "[Palette]") {
      paletteSource += line + "\n";
    } else if (section == "[Parameters]" || section == "[ExtraParams]" || section == "[Fractal]") {
      //Parameters/ExtraParams: parse into attrib=value pairs and add to form
      var pair = line.split("=");

      //Process ini format params
      if (pair[0] == "Formula" || pair[0] == "Type" || pair[0] == "OperationType") {
        this.choices["fractal"].select(convertFormulaName(pair[1]));
      } else if (pair[0] == "JuliaFlag")
        this.julia = parseInt(pair[1]) ? true : false;
      else if (pair[0] == "PerturbFlag" || pair[0] == "zFlag")
        saved["perturb"] = parseInt(pair[1]) ? true : false;
      else if (pair[0] == "Iterations")
        this.iterations = parseInt(pair[1]) + 1;   //Extra iteration in loop
      else if (pair[0] == "Xstart")
        this.position.re = parseReal(pair[1]);
      else if (pair[0] == "Ystart")
        this.position.im = parseReal(pair[1]);
      else if (pair[0] == "Width")
        this.width = pair[1];
      else if (pair[0] == "Height")
        this.height = pair[1];
      else if (pair[0] == "Zoom")
        {if (pair[1] == 0) this.position.zoom = 0.5;}
      else if (pair[0] == "UnitsPerPixel")
      {
        //Old files provide units per pixel and top left coord (already saved in position)
        var upp = parseReal(pair[1]);
        var fwidth = this.width * upp;
        var fheight = this.height * upp;
        //Use largest zoom calculated from units per pixel * pixels in each dimension
        var zoomx = 2.0 / fwidth;
        var zoomy = 2.0 / fheight;
        this.position.zoom = zoomx > zoomy ? zoomx : zoomy;
        //Convert top-left coords into origin coord
        this.position.re += fwidth * 0.5;
        this.position.im += fheight * 0.5;
      }
      else if (pair[0] == "AntiAlias")
        {}//Global property, don't override antialias
      else if (pair[0] == "Rotation")
        this.position.rotate = pair[1];
      //Selected coords for Julia/Perturb
      else if (pair[0] == "CXstart")
        this.selected.re = parseReal(pair[1]);
      else if (pair[0] == "CYstart")
        this.selected.im = parseReal(pair[1]);
      else if (pair[0] == "Smooth")
        saved["smooth"] = pair[1];
      else if (pair[0] == "PaletteRepeat") {
        //Initially copy to both repeat params
        saved["inrepeat"] = parseReal(pair[1]);
        saved["outrepeat"] = parseReal(pair[1]);
      }
      else if (pair[0] == "PaletteRepeatIn")
        saved["inrepeat"] = parseReal(pair[1]);
      else if (pair[0] == "Outside") {
        saved["outside"] = pair[1];
        this.choices['outside_colour'].select(convertFormulaName(pair[1]));
      }
      else if (pair[0] == "Inside") {
        saved["inside"] = pair[1];
        this.choices['inside_colour'].select(convertFormulaName(pair[1]));
      }
      else if (pair[0] == "VariableIterations") {
        if (parseReal(pair[1]) > 0) {
          this.choices["post_transform"].select("fractured");
          this.choices["post_transform"].currentParams["vary"].parse(pair[1]);
          this.choices["post_transform"].currentParams["miniter"].value = this.iterations; 
          this.iterations = Math.floor(this.iterations*2.414); //1+sqrt(2)
        }
      }
      //Following parameters need to be created rather than just set values, save for processing later
      else if (pair[0] == "Bailout")
        saved["bailout"] = parseReal(pair[1]);
      else if (pair[0] == "Power")
        saved["power"] = parseReal(pair[1]);
      else if (pair[0] == "Power2")
        saved["power2"] = parseReal(pair[1]);
      else if (pair[0] == "function1")
        saved["re_fn"] = parseInt(pair[1]);
      else if (pair[0] == "function2")
        saved["im_fn"] = parseInt(pair[1]);
      else if (pair[0] == "op")
        saved["inductop"] = parseInt(pair[1]);
      else if (pair[0] == "fnreal")
        saved["induct"] = pair[1];
      else if (pair[0] == "fnimag")
        saved["induct"] = new Complex(saved["induct"], pair[1]);
      else if (pair[0] == "real1" || pair[0] == "param1")
        saved["param1"] = pair[1];
      else if (pair[0] == "imag1" || pair[0] == "param2")
        saved["param1"] = new Complex(saved["param1"], pair[1]);
      else if (pair[0] == "real2" || pair[0] == "param3")
        saved["param2"] = pair[1];
      else if (pair[0] == "imag2" || pair[0] == "param4")
        saved["param2"] = new Complex(saved["param2"], pair[1]);
      else if (pair[0] == "real3" || pair[0] == "param5")
        saved["param3"] = pair[1];
      else if (pair[0] == "imag3" || pair[0] == "param6")
        saved["param3"] = new Complex(saved["param3"], pair[1]);
      else if (pair[0] == "real4")
        saved["param4"] = pair[1];
      else if (pair[0] == "imag4")
        saved["param4"] = new Complex(saved["param4"], pair[1]);
      else if (pair[0] == "Init")
        saved["init"] = pair[1];
      else if (pair[0] == "Inv")
        saved["invert"] = pair[1];
      else if (pair[0] == "Version")
        saved["version"] = pair[1];
      else
        alert("Unknown param: " + pair[0] + " == " + pair[1]);
    }
  }

  //Process the palette data
  this.colours.read(paletteSource);
  if (this.state.legacy) this.colours.palette.background.alpha = 1.0;
  
  if (saved["smooth"]) {
    //Really old
    if (parseInt(saved["smooth"]) == 1)
      this.choices["outside_colour"].select("smooth");
    else
      this.choices["outside_colour"].select("default");
  }

  // Load formulae
  //this.loadParams();

  //Bailout and power
  if (saved["bailout"] && this.choices["fractal"].selected.indexOf("nova") < 0)
    this.choices["fractal"].currentParams["escape"].parse(saved["bailout"]);
  if (saved["power"] != undefined)
    this.choices["fractal"].currentParams["p"].parse(saved["power"]);
  //Correct error where possible, may require further param adjust
  if (this.choices["fractal"].currentParams["p"].value <= 0) {
    alert("NOTE: power <= 0");
    this.choices["fractal"].currentParams["p"].value = 1;
  }

  //Formula specific param parsing
  if (this.choices["fractal"].selected == "magnet_1") {
    if (saved["power2"])
      this.choices['fractal'].currentParams["q"].parse(saved["power2"]);
  }

  if (this.choices["fractal"].selected == "magnet_3") {
    this.choices['fractal'].currentParams["A"].parse([saved["param1"].re, saved["param1"].im]);
    this.choices['fractal'].currentParams["B"].parse([saved["param3"].re, saved["param3"].im]);
    this.choices['fractal'].currentParams["C"].parse([saved["param2"].re, saved["param2"].im]);
    this.choices['fractal'].currentParams["D"].parse([saved["param3"].re, saved["param3"].im]);
  }

  if (this.choices["fractal"].selected == "nova") {
    var relax = (saved["param2"] ? saved["param2"] : saved["param1"]);
    if (relax) {
      this.choices['fractal'].currentParams["relax"].parse([relax.re, relax.im]);
      this.choices['fractal'].currentParams["converge"].parse("0.00001");
    }
  }

  if (this.choices["fractal"].selected == "novabs") {
    var relax = (saved["param2"] ? saved["param2"] : saved["param1"]);
    if (relax) {
      this.choices['fractal'].currentParams["relax"].parse([relax.re, relax.im]);
      this.choices['fractal'].currentParams["converge"].parse("0.00001");
    }
  }

  if (this.choices["fractal"].selected == "gmm") {
    this.choices['fractal'].currentParams["A"].parse([saved["param1"].re, saved["param1"].im]);
    this.choices['fractal'].currentParams["B"].parse([saved["param2"].re, saved["param2"].im]);
    this.choices['fractal'].currentParams["C"].parse([saved["param3"].re, saved["param3"].im]);
    this.choices['fractal'].currentParams["D"].parse([saved["param4"].re, saved["param4"].im]);
  }

  if (this.choices["fractal"].selected == "quadra") {
    this.choices['fractal'].currentParams["a"].parse([saved["param1"].re, saved["param1"].im]);
    this.choices['fractal'].currentParams["b"].parse([saved["param2"].re, saved["param2"].im]);
  }

  if (this.choices["fractal"].selected == "phoenix") {
    if (saved["power2"])
      this.choices['fractal'].currentParams["q"].parse([saved["power2"], 0.0]);
    this.choices['fractal'].currentParams["distort"].parse([saved["param1"].re, saved["param1"].im]);
  }

  //Functions and ops
  if (!saved["inductop"]) saved["inductop"] = "0";
  if (saved["re_fn"] > 0 || saved["im_fn"] > 0 || saved["inductop"] > 0 || saved["perturb"]) {
    var fns = ["", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "trunc", "log", "log10", "sqrt", "flip", "inv", "abs"];

    this.choices['post_transform'].currentParams["perturb"].parse(saved["perturb"]);

    if (saved["re_fn"])
      this.choices['post_transform'].currentParams["re_fn"].parse(fns[saved["re_fn"]]);
    if (saved["im_fn"])
      this.choices['post_transform'].currentParams["im_fn"].parse(fns[saved["im_fn"]]);

    //Later versions use separate parameter, older used param1:
    if (saved["induct"])
      this.choices['post_transform'].currentParams["induct"].parse([saved["induct"].re, saved["induct"].im]);
    else if (saved["param1"])
      this.choices['post_transform'].currentParams["induct"].parse([saved["param1"].re, saved["param1"].im]);

    this.choices['post_transform'].currentParams["induct_on"].value = saved["inductop"];
    if (this.choices['post_transform'].currentParams["induct_on"].value >= 10) {
      //Double induct, same effect as induct*2
      this.choices['post_transform'].currentParams["induct_on"].value -= 10;
      this.choices['post_transform'].currentParams["induct"].value.re *= 2.0;
      this.choices['post_transform'].currentParams["induct"].value.im *= 2.0;
    }
    if (this.choices['post_transform'].currentParams["induct_on"].value == 1)
      this.choices['post_transform'].currentParams["induct_on"].value = 2;
    if (this.choices['post_transform'].currentParams["induct_on"].value > 1)
      this.choices['post_transform'].currentParams["induct_on"].value = 1;
  }

  //Colour formula param conversion
  function convertColourParams(category, formula) {
    var catname = category + "_colour";
    var params = formula[catname].currentParams;

    if (params["repeat"])
      params["repeat"].value = category.indexOf('in') == 0 ? saved["inrepeat"] : saved["outrepeat"];

    if (formula[catname].selected == "smooth") {
      params["type2"].value = false;
      if (saved[category] == "Smooth 2")
        params["type2"].value = true;
      //???? Override these? or leave?
      params["power"].value = "2";
      params["bailout"].value = saved["bailout"] ? saved["bailout"] : "escape";
    }

    if (formula[catname].selected == "triangle_inequality") {
      //???? Override these? or leave?
      params["power"].value = "2";
      params["bailout"].value = saved["bailout"] ? saved["bailout"] : "escape";
    }

    if (formula[catname].selected == "exponential_smoothing") {
      params["diverge"].value = true;
      params["converge"].value = false;
      params["use_z_old"].value = false;
      if (saved[category] == "Exp. Smoothing - Xdiverge")
        params["use_z_old"].value = true;
      if (saved[category] == "Exp. Smoothing - converge") {
        params["diverge"].value = false;
        params["converge"].value = true;
        params["use_z_old"].value = true;
      }
      if (saved[category] == "Exp. Smoothing - Both") {
        params["converge"].value = true;
        params["use_z_old"].value = true;
      }
    }

    if (formula[catname].selected == "gaussian_integers") {
      switch (parseInt(saved["param2"].re)) {
        case 0: params["rmode"].parse("round"); break;
        case 1: params["rmode"].parse("trunc"); break;
        case 2: params["rmode"].parse("floor"); break;
        case 3: params["rmode"].parse("ceil"); break;
      }
      params["colourby"].parse(saved["param2"].im);
    }
  }

  convertColourParams("outside", this.choices);
  convertColourParams("inside", this.choices);

  //Update parameters to form
  this.loadParams();
  this.applyChanges();
}


Fractal.prototype.loadParams = function() {
  //# UI
  if (!this.ui) return;
  //debug("loadParams<hr>");
  //Parse param fields from formula code
  for (category in this.choices)
    this.choices[category].select();
  //Copy params to form fields
  this.copyToForm();
}

Fractal.prototype.resetZoom = function() {
  this.position = new Aspect(0, 0, 0, 0.5);
  this.copyToForm();
  this.draw();
}

Fractal.prototype.sizeCanvas = function() {
  var width = this.width;
  var height = this.height;
  if (!width || !height) {
    document.documentElement.style.overflow = "hidden";
    //Get size from element
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    width = this.canvas.clientWidth;
    height = this.canvas.clientHeight;
    //#Update UI
    if (this.ui) {
      document.getElementById("width").value = width;
      document.getElementById("height").value = height;
    }
    //Disable scrollbars when using autosize
  } else { //Enable scrollbars
    document.documentElement.style.overflow = "auto";
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
  }

  //This sanity check necessary for now as sizeCanvas is 
  //sometimes called when canvas still hidden (so width/height=0)
  if (width < 32 || height < 32) {
    debug("sizeCanvas: skipped, width/height too small: " + width + " x " + height);
    return;
  }

  if (width != this.canvas.width || height != this.canvas.height) {
    debug("Resize " + width + "x" + height);
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.webgl) {
      this.webgl.viewport.width = width;
      this.webgl.viewport.height = height;
    } else if (this.renderer >= WEBCL && this.webcl) {
      //Update WebCL buffer if size changed
      if (this.webcl.viewport.width != this.canvas.width || this.webcl.viewport.height != this.canvas.height) {
        debug("Size changed, WebCL resize");
        this.webcl.setViewport(0, 0, width, height);
      }
    }
  }
}

Fractal.prototype.updatePalette = function() {
  if (!this.webgl && !this.webcl) return;
  //Update palette texture
  this.colours.get(this.gradient, true);
  if (this.webgl) this.webgl.updateTexture(this.webgl.gradientTexture, this.gradient);
}

//Apply any changes to parameters or formula selections and redraw
Fractal.prototype.applyChanges = function(antialias, notime) {
  //if (!this.webgl && !this.webcl) return;
  //Only redraw when visible
  if (this.canvas.offsetWidth < 1 || this.canvas.offsetHeight < 1) return;
  //Update palette texture
  this.updatePalette();

  if (this.ui) {
    //Resize canvas if size settings changed
    if (document["inputs"].elements["autosize"].checked) {
      //Clear so draw() gets size from window
      this.width = 0;
      this.height = 0;
    } else {
      //Use size from form
      this.width = parseInt(document.getElementById("width").value);
      this.height = parseInt(document.getElementById("height").value);
    }

    this.iterations = parseReal(document.getElementById("iterations").value);
    this.julia = document["inputs"].elements["julia"].checked ? 1 : 0;
    this.position = new Aspect(parseReal(document.getElementById("xOrigin").value), parseReal(document.getElementById("yOrigin").value),
                               parseReal(document.getElementById("rotate").value), parseReal(document.getElementById("zoom").value));
    this.selected = new Complex(parseReal(document.getElementById("xSelect").value), parseReal(document.getElementById("ySelect").value));

    //Limit rotate to range [0-360)
    if (this.position.rotate < 0) this.position.rotate += 360;
    this.position.rotate %= 360;
    document["inputs"].elements["rotate"].value = this.position.rotate;

    //Copy form values to defined parameters
    for (category in this.choices)
      this.choices[category].currentParams.setFromForm();
  }

  //Has anything actually changed (parameters)?
  if (this.paramcache != this.toString) {
    //Update shader code & redraw
    this.generated = new Generator(this, notime);
    this.draw(antialias, notime);

    this.paramcache = this.toString();
  }
}

//Update form controls with fractal data
Fractal.prototype.copyToForm = function() {
  //# UI
  if (!this.ui) return;
  //debug("copyToForm<hr>");
  document["inputs"].elements["name"].value = this.name;
  document["inputs"].elements["width"].value = this.width;
  document["inputs"].elements["height"].value = this.height;
  document["inputs"].elements["xOrigin"].value = this.position.re;
  document["inputs"].elements["yOrigin"].value = this.position.im;
  document["inputs"].elements["xSelect"].value = this.selected.re;
  document["inputs"].elements["ySelect"].value = this.selected.im;
  document["inputs"].elements["zoom"].value = this.position.zoom;
  document["inputs"].elements["rotate"].value = this.position.rotate;
  document["inputs"].elements["julia"].checked = this.julia;
  document["inputs"].elements["iterations"].value = this.iterations;
  for (category in this.choices)
    document.getElementById(category + '_formula').value = this.choices[category].selected;
  //No width or height? Set autosize, otherwise disable
  var autosize = (this.width == 0 || this.height == 0);
  document["inputs"].elements["autosize"].checked = autosize;
  document["inputs"].elements["width"].disabled = autosize;
  document["inputs"].elements["height"].disabled = autosize;
}

/**
 * @constructor
 */
function Generator(fractal, notime) {
  this.fractal = fractal;
  this.webcl = fractal.renderer >= WEBCL && fractal.webcl;
  this.webgl = (fractal.webgl ? true : false);
  this.notime = notime;
  this.source = "";
  this.generate();
}

//Create shader from source components
Generator.prototype.generate = function() {
  //Generate language agnostic core code from templates
  this.generateCore();

  //Insert into code template for target language
  var targetsrc = "";
  if (this.webcl)
    //OpenCL kernel
    targetsrc = sources["include/opencl-template.cl"];
  else
    //GLSL shader
    targetsrc = sources["include/glsl-template.frag"];

  //Insert the complex maths library
  targetsrc = targetsrc.replace(/---LIBRARY---/, sources["include/complex.library"]);

  //Insert any additional functions defined
  targetsrc = targetsrc.replace(/---FUNCTIONS---/, this.selections["core"]["functions"] || "");
  
  //Calculate offset of code before core body
  this.headerlen = targetsrc.substr(0, targetsrc.indexOf("---CODE---")).split(newline).length;

  //Insert the code body
  targetsrc = targetsrc.replace(/---CODE---/, this.source);

  //WebCL target modifications...
  if (this.webcl) {
    //Switch to C-style casts for OpenCL
    targetsrc = targetsrc.replace(/complex\(/g, "C(");
    targetsrc = targetsrc.replace(/real\(/g, "(real)(");
    targetsrc = targetsrc.replace(/float\(/g, "(float)(");
    targetsrc = targetsrc.replace(/int\(/g, "(int)(");
    targetsrc = targetsrc.replace(/bool\(/g, "(bool)(");
    targetsrc = targetsrc.replace(/rgba\(/g, "(rgba)(");
  }

  //Recompile
  this.compile(targetsrc);
}

//Create shader core source components
Generator.prototype.generateCore = function() {
  //Insert at beginning of source
  this.source = "#define MAXITER " + (100 * Math.ceil(this.fractal.iterations / 100)) + "\n";

  //Get formula selections
  this.selections = {};
  this.fractal.paramvars = [];  //Clear uniform values array
  for (category in this.fractal.choices) {
    this.selections[category] = this.fractal.choices[category].getParsedFormula(this.fractal);
  }

  //Main code template body
  this.offsets = [];
  //this.source += sources["include/fractal.template"]; 
  this.source += "---DATA---\n---CORE---\n"; 
  this.templateInsert("DATA", "data", ["core"], 0);
  this.templateInsert("CORE", "main", ["core"], 0);

  //Replace ---SECTION--- in template with formula code
  var alltypes = ["pre_transform", "fractal", "post_transform", "inside_colour", "outside_colour", "filter"];
  this.templateInsert("DATA", "data", alltypes, 2);
  this.templateInsert("INIT", "init", alltypes, 0);
  //These entries can be inserted multiple times
  while (this.templateInsert("RESET", "reset", alltypes, 0)) {}
  while (this.templateInsert("PRE_TRANSFORM", "transform", ["pre_transform"], 4)) {}
  while (this.templateInsert("ZNEXT", "znext", ["fractal"], 2)) {}
  while (this.templateInsert("POST_TRANSFORM", "transform", ["post_transform"], 4)) {}
  while (this.templateInsert("ESCAPED", "escaped", ["fractal"], 2)) {}
  while (this.templateInsert("CONVERGED", "converged", ["fractal"], 2)) {}
  while (this.templateInsert("OUTSIDE_CALC", "calc", ["outside_colour"], 4)) {}
  while (this.templateInsert("INSIDE_CALC", "calc", ["inside_colour"], 4)) {}
  while (this.templateInsert("OUTSIDE_COLOUR", "result", ["outside_colour"], 2)) {}
  while (this.templateInsert("INSIDE_COLOUR", "result", ["inside_colour"], 2)) {}
  while (this.templateInsert("FILTER", "filter", ["filter"], 0)) {}
  this.offsets.push(new LineOffset("(end)", "(end)", this.source.split(newline).length));

  //Replace any (x,y) constants with complex(x,y)
  //(where x,y can be a numeric constant)
  //(...modified to also allow single variables, note: first pattern is to ignore function call match)
  var creg = /([^a-zA-Z0-9_\)])\(([-+]?((\d*\.)?\d+|[a-zA-Z_][a-zA-Z0-9_]*))\s*,\s*([-+]?((\d*\.)?\d+|[a-zA-Z_][a-zA-Z0-9_]*))\)/g
  //var creg = /([^a-zA-Z_])\(([-+]?(\d*\.)?\d+)\s*,\s*([-+]?(\d*\.)?\d+)\)/g;
  this.source = this.source.replace(creg, "$1C($2,$5)");

  this.source = this.source.replace(/ident/g, ""); //Strip ident() calls
}

Generator.prototype.templateInsert = function(marker, section, sourcelist, indent) {
  var newsource = "//***" + marker + "***\n";
  var regex = new RegExp("---" + marker + "---");
  var spaces = "          ";
  spaces = spaces.substr(0, indent);

  //Save the line offset where inserted
  var match = regex.exec(this.source);
  if (!match) return false; //No section entry found for this template
  var offset = this.source.slice(0, match.index).split(newline).length;
  //alert(offset + "\n" + this.source.slice(0, match.index));
  //debug(section + "-->" + marker + " STARTING offset == " + offset);

  //Get sources
  for (s in sourcelist) {
    //Get code for this section from each of the sources
    var code = this.selections[sourcelist[s]][section];
    if (!code) continue;

    //Insert spaces at line beginnings to specified indent
    var lines = code.split(newline); // split on newlines
    code = "";
    for (var i = 0; i < lines.length; i++) {
      code += spaces + lines[i] + "\n"; 
    }

    //Save offset for this section from this formula selection
    this.offsets.push(new LineOffset(sourcelist[s], section, offset + newsource.split(newline).length - 1));
    //debug(section + " --> " + sourcelist[s] + " offset == " + this.offsets[this.offsets.length-1].value);

    //Concatentate to final code to insert at marker position
    newsource += code + "\n";
  }

  //Replaces a template section with the passed source
  this.source = this.source.replace(regex, newsource);
  return true;
}

//Rebuild from source
Generator.prototype.compile = function(targetsrc) {
  //Only recompile if data has changed!
  if (this.fractal.cache != targetsrc) {
    //Cache final source
    this.fractal.cache = sources["generated.source"] = targetsrc;

    //Save for debugging
    var timer = new Timer();

    //Compile the shader using WebGL or WebCL
    //Any build errors will cause exceptions
    var error_regex = /0:(\d+)/;
    try {
      if (this.webcl) {
        error_regex = /[^-](\d+):/;
        //error_regex = /:(\d+):/;
        this.fractal.webcl.buildProgram(targetsrc);
      } else if (this.webgl) {
        this.fractal.updateShader(targetsrc);
      }
      if (!this.notime) timer.print("Compile");
    } catch (e) {
      this.parseErrors(e, error_regex);
    }
  } else
    debug("Shader build skipped, no changes");
}

Generator.prototype.parseErrors = function(errors, regex) {
  //Parse errors using supplied regex to find line number
  popup();
  var match = regex.exec(errors);
  var found = false;
  if (match) {
    var lineno = parseInt(match[1]) - this.headerlen + 1; //Subtract header length
    //console.log("ERROR: " + lineno + " offset: " + this.headerlen);
    var last = null
    for (i in this.offsets) {
      if (last) {
        //debug("CAT: " + this.offsets[last].category + "SECTION: " + this.offsets[last].section + 
        //" from: " + this.offsets[last].value + " to " + (this.offsets[i].value-1));
        if (lineno >= this.offsets[last].value && lineno < this.offsets[i].value) {
          var section = this.offsets[last].section;
          //Adjust the line number
          lineno -= this.offsets[last].value + 1;
          lineno += this.fractal.choices[this.offsets[last].category].lineoffsets[section];
          var key = formulaKey(this.offsets[last].category, this.fractal.choices[this.offsets[last].category].selected);
          if (key) {
            popup("<b>Error</b>: line number: <b>" + (isNaN(lineno) ? "??" : lineno) + "</b><br>" + 
                  "Section: <i>" + section + "</i><br>" + 
                  sectionnames[this.offsets[last].category] + 
                  " formula: " + (key ? formula_list[key].label : "?") + 
                  "<hr><code style='font-family: monospace;'>" + errors.substr(0,511) + "</code>");
            found = true;
          }
          break;
        }
      }
      last = i;
    }
  }
  if (!found) {
    //Otherwise show raw error
    popup("<b>Error</b>:<hr><code style='font-family: monospace;'>" + errors.substr(0,511) + "</code>");
  }
}

Fractal.prototype.updateShader = function(source) {
  //Compile the WebGL shader
  this.program = new WebGLProgram(this.gl, sources["include/shader2d.vert"], source);
  //Restore uniforms/attributes for fractal program
  var uniforms = ["palette", "offset", "iterations", "julia", "origin", "selected_", "dims", "pixelsize", "background", "params"];
  this.program.setup(["aVertexPosition"], uniforms);
  //Get HLSL source if available
  if (this.state.debug) {
    var angle = this.gl.getExtension("WEBGL_debug_shaders");
    if (angle) sources["generated.hlsl"] = angle.getTranslatedShaderSource(this.program.fshader);
  }
}

Fractal.prototype.timeAction = function(action) {
  if (!window.requestAnimationFrame) return;
  var timer = new Date().getTime();
  function logTime() {
    var elapsed = new Date().getTime() - timer;
    if (elapsed < 50) 
      window.requestAnimationFrame(logTime); //Not enough time, assume triggered too early, try again
    else
      print(action + " took: " + (elapsed / 1000) + " seconds");
  }
  window.requestAnimationFrame(logTime);
}

function ondrawn() {
  //Call the user-defined ondraw function
  if (fractal.ondraw) fractal.ondraw();
  //Save last drawn thumbnail
  var thumb = thumbnailQuick("jpeg", 80, 0, 85);
  if (thumb) fractal.thumb = thumb;
  hideGallery();  //Always hide the gallery now
}

Fractal.prototype.draw = function(antialias, notime) {
  var timer = null;
  //OnDrawn callback relies on UI elements (for thumbnail)
  if (this.ui && !notime && this.state.timers > 0)
    timer = new Timer(ondrawn);

  this.drawCore(antialias, timer);

  this.saveState();
}

Fractal.prototype.drawCore = function(antialias, timer) {
  if (!antialias) antialias = this.state.antialias;

  //Set canvas size
  this.sizeCanvas();

  //Local render can be disabled by debug flag
  if (!this.state.disabled) {
    if (this.webgl) {
      this.webgl.time = timer;
      this.renderWebGL(antialias);
    } else if (this.renderer >= WEBCL && this.webcl) {
      this.webcl.time = timer;
      this.webcl.draw(this, antialias, this.colours.palette.background);
    } 
  }

  //Render on server or control flag set for rendering on server?
  if (this.renderer == SERVER || this.state.control)
    if (this.server) this.serverRender(antialias);
}

Fractal.prototype.saveState = function(replace) {
  //Note: should never do this when animating!
  if (!this.state.output) return;

  //Experimental: history state push on change
  var data = this.name + "\n" + this.toStringNoFormulae();
  if (replace || !history.state) {
    debug("Replaced State: " + data.length + " # " + history.length);
    window.history.replaceState(window.btoa(data), "", this.state.baseurl);
  } else {
    debug("Saved State: " + data.length + " # " + history.length);
    window.history.pushState(window.btoa(data), "");
  }
}

Fractal.prototype.serverRender = function(antialias) {
  //Send shader & params to remote server
  if (!antialias) antialias = this.state.antialias;
  var src = this.paramString(true) + "antialias=" + antialias + "\n";

  //Add any uniform vars
  if (this.paramvars.length)
    src += "variables=" + JSON.stringify(this.paramvars);
  
  //Finish with palette and shader code...
  src += this.paletteString() + "\n[shader]\n" + this.cache;

  //Check re-render required...
  if (this.servercache != src) {
    //Request image from server only if in server mode and draw not disabled
    this.server.draw(src, !this.state.disabled && this.renderer == SERVER);
    this.servercache = src;
  }
}

Fractal.prototype.clear = function() {
  //Set canvas size
  this.sizeCanvas();

  if (this.webgl)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  else //if (this.renderer >= WEBCL && this.webcl)
    this.canvas.width = this.canvas.width;  //Clears 2d canvas
}

Fractal.prototype.renderViewport = function(x, y, w, h) {
  //Draw julia viewport on remote app
  /*if (this.server) {
    this.serverRender();
    return;
  }*/

  var alpha = this.colours.palette.background.alpha; //Save bg alpha
  this.colours.palette.background.alpha = 1.0;
  if (this.webgl) {
    this.webgl.time = null; //Disable timer
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.webgl.viewport = new Viewport(x, y, w, h);
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.scissor(x, y, w, h);
    this.renderWebGL(this.state.antialias);
    this.webgl.viewport = new Viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.disable(this.gl.SCISSOR_TEST);
  } else if (this.renderer >= WEBCL && this.webcl) {
    this.webcl.time = null; //Disable timer
    this.webcl.setViewport(x, y, w, h);
    this.webcl.draw(this, this.state.antialias, this.colours.palette.background);
    this.webcl.setViewport(0, 0, this.canvas.width, this.canvas.height);
  }
  this.colours.palette.background.alpha = alpha;  //Restore alpha
}

Fractal.prototype.renderWebGL = function(antialias) {
  if (!this.program || !this.program.uniforms) return;
    //debug("USE: " + objectId(this.program));
  this.webgl.use(this.program);

  //Uniform variables
  this.gl.uniform1i(this.program.uniforms["iterations"], this.iterations);
  this.gl.uniform1i(this.program.uniforms["julia"], this.julia);
  this.gl.uniform4fv(this.program.uniforms["background"], this.colours.palette.background.rgbaGL());
  this.gl.uniform2f(this.program.uniforms["origin"], this.position.re, this.position.im);
  this.gl.uniform2f(this.program.uniforms["selected_"], this.selected.re, this.selected.im);
  this.gl.uniform2f(this.program.uniforms["dims"], this.webgl.viewport.width, this.webgl.viewport.height);
  this.gl.uniform1f(this.program.uniforms["pixelsize"], this.position.pixelSize(this.webgl.viewport));

  //Parameter uniforms...
  this.gl.uniform1fv(this.program.uniforms["params"], new Float32Array(this.paramvars));

  //Gradient texture
  this.gl.activeTexture(this.gl.TEXTURE0);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.webgl.gradientTexture);
  this.gl.uniform1i(this.program.uniforms["palette"], 0);

  //Apply translation to origin, any rotation and scaling (inverse of zoom factor)
  this.webgl.modelView.identity()
  this.webgl.modelView.translate([this.position.re, this.position.im, 0])
  this.webgl.modelView.rotate(this.position.rotate, [0, 0, -1]);
  //Apply zoom and flip Y to match old coord system
  this.webgl.modelView.scale([1.0/this.position.zoom, -1.0/this.position.zoom, 1.0]);
  //Scaling to preserve fractal aspect ratio
  if (this.webgl.viewport.width > this.webgl.viewport.height)
    this.webgl.modelView.scale([this.webgl.viewport.width / this.webgl.viewport.height, 1.0, 1.0]);  //Scale width
  else if (this.webgl.viewport.height > this.webgl.viewport.width)
    this.webgl.modelView.scale([1.0, this.webgl.viewport.height / this.webgl.viewport.width, 1.0]);  //Scale height

  //Always use transparent background,
  //bg colour is used in shader and pre-blended into palette
  this.gl.clearColor(0, 0, 0, 0);

  //debug('>> Drawing fractal (aa=' + antialias + ")");
  if (this.timer) {clearTimeout(this.timer); this.timer = null;}

  //Prepare 2d draw
  this.webgl.initDraw2d();

  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  
  //Draw passes...
  this.gl.enable(this.gl.BLEND);
  if (antialias > 1) {
    //Draw and blend multiple passes for anti-aliasing
    this.gl.blendFunc(this.gl.CONSTANT_ALPHA, this.gl.ONE_MINUS_CONSTANT_ALPHA);
    this.blendinc = 0;

    this.j = 0;
    this.k = 0;
    this.antialias = antialias;
    this.renderPassWebGL();

  } else {
    //Draw, single pass
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.webgl.vertexPositionBuffer.numItems);
    if (this.time) this.time.print("Draw");
  }
}

Fractal.prototype.renderPassWebGL = function() {
  var blendval = 1.0 - this.blendinc;
  //debug("Antialias pass ... " + this.j + " - " + this.k + " blendinc: " + this.blendinc + " blendval: " + blendval + " bv2: " + Math.pow(blendval, 1.5));
  //blendval *= blendval;
  blendval = Math.pow(blendval, 1.5);
  this.gl.blendColor(0, 0, 0, blendval);
  //print(blendval);
  this.blendinc += 1.0/(this.antialias*this.antialias);
  var pixelX = 2.0 / (this.position.zoom * this.webgl.viewport.width);
  var pixelY = 2.0 / (this.position.zoom * this.webgl.viewport.height);
  this.gl.uniform2f(this.webgl.program.uniforms['offset'], pixelX * (this.j/this.antialias-0.5), pixelY * (this.k/this.antialias-0.5));
  //Draw!
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.webgl.vertexPositionBuffer.numItems);

  //Next...
  this.k++;
  if (this.k >= this.antialias) {
    this.k = 0;
    this.j++;
  }

  if (this.j < this.antialias) {
    if (!this.time)
      this.renderPassWebGL();  //Don't draw incrementally when timers disabled
    else {
      var that = this;
      this.timer = setTimeout(function () {that.renderPassWebGL();}, 10);
    }
  } else {
    this.timer = null;
    if (this.time) this.time.print("Draw");
  }
}

//////////////////////////////////////////////////////////////////
//Canvas event handling
Fractal.prototype.stop = function() {
  if (this.webgl && this.webgl.timer) {
    clearTimeout(this.webgl.timer);
    this.webgl.timer = null;
  } else if (this.webcl && this.webcl.timer) {
    clearTimeout(this.webcl.timer);
    this.webcl.timer = null;
  }
}

Fractal.prototype.click = function(event, mouse) {
  //Don't exit preview on click when controlling remote
  if (this.state.control && this.state.disabled && this.preview) {
    return this.move(event, mouse);
  }
  //Convert mouse coords into fractal coords
  var point = this.position.convert(mouse.x, mouse.y, mouse.element);

  //Selection box? Ignore if too small a region selected
  if (this.select && this.select.style.display == 'block' && this.select.w > 5 && this.select.h > 5) {
    //Get element offset in document
    //var offset = findElementPos(mouse.element);
    //Convert coords to position relative to element
    //select.x -= offset[0];
    //select.y -= offset[1];
    //Get centre of selection in fractal coords
    var centre = this.position.convert(this.select.x + this.select.w/2, this.select.y + this.select.h/2, mouse.element);
    //Adjust centre position to match mouse left click
    this.setOrigin(centre);
    //Adjust zoom by factor of element width to selection
    this.applyZoom(mouse.element.width / this.select.w);
  } else if (event.button == 0) {
    if (event.ctrlKey)
      //Switch to julia set at selected point (alternative for single button mice)
      this.selectPoint(point);
    else
      //Adjust centre position to match mouse left click
      this.setOrigin(point);
  } else if (event.button > 0 || event.ctrlKey) {
    //Right-click, not dragging
    if (event.button == 2 && !mouse.dragged) {
      //Switch to julia set at selected point
      this.selectPoint(point);
    } else {
      //No redraw
      return true;
    }
  }

  if (this.select) this.select.style.display = 'none';
  this.copyToForm();
  this.draw();
  return true;
}

Fractal.prototype.down = function(event, mouse) {
  //Issue clear to server when in control mode
  if (this.server && this.state.control)
    this.server.post('/clear');

  //Clear focus from menu popups to hide them if active
  //document.getElementById('popup').focus();
  //document.activeElement.blur()
  //Stop any current render
  this.stop();
  //Switch out of preview mode (unless controlling server renderer only)
  if (!(this.state.control && this.state.disabled)) this.clearPreview();
  //return false;
  return true;
}

Fractal.prototype.up = function(event, mouse) {
  //this.clearPreview();
  return true;
}

Fractal.prototype.move = function(event, mouse) {
  //Mouseover processing
  mouse.point = new Aspect(0, 0, 0, 0);
  if (!this.state || this.state.mode == 0) return true;
  if (mouse.x >= 0 && mouse.y >= 0 && mouse.x <= mouse.element.width && mouse.y <= mouse.element.height)
  {
    //Convert mouse coords into fractal coords
    mouse.point = this.position.convert(mouse.x, mouse.y, mouse.element);
    mouse.coord = new Complex(mouse.point.re + this.position.re, mouse.point.im + this.position.im);
    if (this.ui)
      document.getElementById("coords").innerHTML = "&nbsp;re: " + this.precision(mouse.coord.re) + " im: " + this.precision(mouse.coord.im);

    //Constantly updated mini julia set rendering
    if (this.preview && !this.julia) {
      this.selected = mouse.coord;
      this.drawPreview();
      return;
    }
  }

  if (!mouse.isdown) return true;

  //Right & middle buttons: drag to scroll
  if (mouse.button > 0 && this.ui) {
    // Set the scroll position
    if (document.fullScreenEnabled) {
      this.element.scrollLeft -= mouse.deltaX;
      this.element.scrollTop -= mouse.deltaY;
    } else
      window.scrollBy(-mouse.deltaX, -mouse.deltaY);
    return true;
  }

  //Drag processing
  if (this.select) {
    this.select.style.display = 'block';

    //Constrain selection size to canvas aspect ratio
    this.select.w = Math.abs(mouse.deltaX)
    var ratio = mouse.element.width / this.select.w;
    this.select.h = mouse.element.height / ratio;

    if (mouse.deltaX < 0)
      this.select.x = mouse.x;
    else
      this.select.x = mouse.x - this.select.w;

    var offset = findElementPos(this.element);
    if (mouse.deltaY < 0)
      this.select.y = mouse.lastY - this.select.h - offset[1];
    else
      this.select.y = mouse.lastY - offset[1];

    //Copy to style to set positions
    this.select.style.left = this.select.x + "px";
    this.select.style.top = this.select.y + "px";
    this.select.style.width = this.select.w + "px";
    this.select.style.height = this.select.h + "px";

    if (this.ui)
      document.getElementById("coords").innerHTML = this.select.style.width + "," + this.select.style.height;
  }
}

Fractal.prototype.wheel = function(event, mouse) {
  this.stop();
  if (!this.preview && event.shiftKey) {
    //document.getElementById('rotate').value = parseReal(document.getElementById('rotate').value, 1) + event.spin * 10;
    document.getElementById('iterations').value = parseInt(document.getElementById('iterations').value) + event.spin;
    //Accumulate spin before applying changes
    //First clear any existing timer
    if (this.spintimer) clearTimeout(this.spintimer);
    //Set timer
    document.body.style.cursor = "wait";
    var that = this;
    this.spintimer = setTimeout(function () {that.applyChanges(); document.body.style.cursor = "default";}, this.state.timers);
  } else {
    // Zoom
    var zoom;
    var factor = 1.1;
    if (event.altKey) factor = 1.01;  //Alt for slower zoom
    if (event.spin < 0)
       zoom = 1/(-event.spin * factor);
    else
       zoom = event.spin * factor;

    if (this.preview) {
       this.savePos.zoom *= zoom;
       this.drawPreview();
    } else if (this.preview || this.state.timers <= 1 || !this.select) {
      //Instant update
      this.applyZoom(zoom);
      //Update form fields
      this.copyToForm();
      this.draw();
    } else if (this.select) {
      //Zoom box processing
      if (this.select.timer) clearTimeout(this.select.timer);
      if (!this.select.zoom) this.select.zoom = 1.0;
      if (!this.select.mouse) {
        //Handle wheel events on select element too
        this.select.mouse = mouse;
        this.select.addEventListener("onwheel" in document ? "wheel" : "mousewheel", handleMouseWheel, false);
      }
      this.select.zoom *= zoom;

      //Constrain selection size to mouse.element aspect ratio
      var z = this.select.zoom;
      if (z > 1.0) {
        z = 1.0 / z;
        this.select.w = this.canvas.offsetWidth * z;
        this.select.h = this.canvas.offsetHeight * z;
        this.select.x = 0.5*(this.canvas.offsetWidth - this.select.w);
        this.select.y = 0.5*(this.canvas.offsetHeight - this.select.h);
      } else {
        this.select.style.background = "transparent";
        this.select.style.borderColor = "#EECC11";
        this.select.x = this.select.y = 0;
        this.select.w = this.canvas.offsetWidth * z;
        this.select.h = this.canvas.offsetHeight * z;
        this.select.style.borderLeftWidth = Math.round(0.5 * (this.canvas.offsetWidth - this.select.w)) + "px";
        this.select.style.borderRightWidth = this.select.style.borderLeftWidth;
        this.select.style.borderTopWidth = Math.round(0.5 * (this.canvas.offsetHeight - this.select.h)) + "px";
        this.select.style.borderBottomWidth = this.select.style.borderTopWidth;
      }

      //Copy to style to set positions
      this.select.style.left = this.select.x + "px";
      this.select.style.top = this.select.y + "px";
      this.select.style.width = this.select.w + "px";
      this.select.style.height = this.select.h + "px";
      this.select.style.display = 'block';

      //Set timer
      document.body.style.cursor = "wait";
      var that = this;
      this.select.timer = setTimeout(function () {that.selectZoom();}, this.state.timers);
    }
  }

  return false;
}

Fractal.prototype.selectZoom = function() {
  //Zoom box processing
  this.select.timer = null;
  document.body.style.cursor = "default";
  this.applyZoom(this.select.zoom);
  //Update form fields
  this.copyToForm();
  this.applyChanges();
  this.select.zoom = null;
  this.select.style.display = 'none';
  this.select.style.background = "#EECC11";
  this.select.style.borderColor = "#596380";
  this.select.style.borderWidth = "1px";
}

/////////////////////////////////////////////////////////////////////////
//Julia set preview window
Fractal.prototype.drawPreview = function() {
  this.preview.julia = true;
  this.preview.selected = new Complex(this.selected.re, this.selected.im);
  this.preview.position = this.savePos; //.clone();

  if (this.preview.win) this.preview.win.focus();

  this.preview.drawCore();
  //Draw julia viewport on remote app
  if (this.state.control)
    this.preview.serverRender();
}

Fractal.prototype.clearPreview = function() {
  if (!this.preview) return;
  document.getElementById('previewbtn').innerHTML = "Show Preview"
  clearTimeout(this.preview.timeout);
  document.mouse.moveUpdate = false;
  if (this.preview.win) this.preview.win.close();
  //this.preview.move = null;
  this.preview = null;
  //Ensure UI selections are restored (TODO: preview shouldn't change UI, but it does)
  this.reselectAll();
}

Fractal.prototype.showPreview = function() {
  document.mouse.moveUpdate = true;  //Enable constant deltaX/Y updates
  //if (pwin) this.preview = pwin.fractal;
  if (!this.preview) {
    //Open the previewer unless local drawing disabled
    if (!this.state.disabled) {
      var pwin = window.open("", "view1", "resizable=1,width=500,height=500");
      pwin.document.open();
      pwin.document.write("<html><head><link rel='stylesheet' type='text/css' href='styles.css'></head><body><div id='previewer'></div></body></html>")
      //pwin.document.write("<html><head><style>* {margin: 0; padding: 0;}</style></head><body><div id='preview'></div></body></html>")
      pwin.document.close();
      pwin.document.onkeydown = handleKey;
      this.preview = new Fractal(pwin.document.getElementById('previewer'));
      this.preview.win = pwin;
    } else
      this.preview = new Fractal('preview');

    this.preview.init(this.state);
    //this.preview.state.timers = 0; //Instant updates
    //this.preview.load(this.toStringMinimal());
    this.preview.load(this.toStringNoFormulae());

    //this.preview.resetZoom();
    this.preview.width = this.preview.height = 0; //Fit to container

  } else
    this.preview.load(this.toStringMinimal());

  if (this.preview.win) {
//    this.preview.win.open(100, 100);
    //that = this;
    //this.preview.move = function(event, mouse) {
    //  return that.preview.win.move(event, that.preview.win.mouse);
    //};
    this.preview.click = null; //function() {return true;};
    this.preview.down = null; //function() {return true;};
    this.preview.up = null; //function() {return true;};
  }

  //this.preview.selected = Point(this.preview.point);
  //this.preview.generated = new Generator(this.preview, true);
  this.preview.applyChanges();
  this.drawPreview();
}

Fractal.prototype.togglePreview = function() {
  if (this.preview || this.julia) {
    this.clearPreview();
  } else {
    this.showPreview();
    if (document.getElementById('previewbtn'))
      document.getElementById('previewbtn').innerHTML = "Show Preview &#10003;"
  }
}

Fractal.prototype.pinch = function(event, mouse) {
  //Don't exit preview on click when controlling remote
  if (this.state.control && this.state.disabled && this.preview) return;
  var zoom;
  if (event.distance > 0)
    zoom = 1.0 + (event.distance * 0.0001);
  else
    zoom = 1/(1.0 + event.distance * -0.0001);
  //print(diff + ' --> ' + zoom);
  this.applyZoom(zoom);
  this.copyToForm();
  this.draw();
  //Hide select box
  if (this.select) this.select.style.display = 'none';
}

//////////////////////////////////////////////////////////////////////////
//Experimental popup window functions, preview & resizeable palette editor
//////////////////////////////////////////////////////////////////////////
var paletteWin;
function openPalette() {
  paletteWin = window.open("palette.html", "palette", "resizable=1,width=500,height=600,scrollbars=yes");
}


