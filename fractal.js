//Constants
var WEBGL = 0;
var WEBCL = 1;
var WEBCL64 = 2;
var NONE = -1;

var sectionnames = {"fractal" : "Fractal", "pre_transform" : "Pre-transform", "post_transform" : "Post-transform", "outside_colour" : "Outside Colour", "inside_colour" : "Inside Colour", "filter" : "Filter"}

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
  var unit = 2.0 / this.zoom;
  var pixel = unit / element.width; //height?
  //debug(element.width + " x " + element.height + " ==> " + size[0] + " x " + size[1]);
  //if (this.zoom > 100) debug("Warning, precision too low, pixel size: " + pixel);
  return pixel;
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
function Fractal(parentid) {
  //Construct a new default fractal object
  this.setRenderer(parentid, state.renderer);

  //Set canvas size
  this.sizeCanvas();

  this.antialias = state.antialias;
  this.preview = null;
}

Fractal.prototype.init = function() {
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
    if (this.webcl.fp64) info += "D";
    if (this.webcl.pfstrings) info += this.webcl.pfstrings;
  }
  debug("INFO: " + info);
  return info;
}

Fractal.prototype.switchMode = function(mode) {
  if (mode == WEBGL && this.webgl) return;
  //Recreate canvas & fractal
  this.setRenderer('main', mode);
  if (sources["generated.source"]) {
    sources["generated.source"] = "";     //Force rebuild
    this.applyChanges();
  }
}

Fractal.prototype.setRenderer = function(parentid, mode) {
  //Create new canvas
  this.canvas = document.createElement("canvas");
  this.canvas.id = "fractal-canvas"
  this.canvas.className = "checkerboard";
  this.canvas.mouse = new Mouse(this.canvas, this);
  this.canvas.mouse.setDefault();

  //Remove existing canvas if any
  var pelement = $(parentid)
  var ccanvas = $("fractal-canvas");
  if (ccanvas) pelement.removeChild(ccanvas);
  pelement.appendChild(this.canvas);

  //Render mode, If not set, use WebCL if available
  this.renderer = mode;
  if (this.renderer == undefined) this.renderer = WEBGL;
  if (window.WebCL == undefined) {
    this.renderer = WEBGL;
    $("webcl").disabled = true;
    $("fp64").disabled = true;
    $("webcl_list").disabled = true;
  }

  if (this.renderer >= WEBCL) {
    //Init WebCL
    try {
      this.webcl = new OpenCL(state.platform, state.device);  //Use existing settings

      if (this.renderer > WEBCL && !this.webcl.fp64) {
        popup("Sorry, the <b><i>cl_khr_fp64</i></b> or the <b><i>cl_amd_fp64</i></b> " + 
              "extension is required for double precision support in WebCL");
        this.renderer = WEBCL;
      }

      $("fp64").disabled = !this.webcl.fp64;
      debug(state.platform + " : " + state.device + " --> " + this.canvas.width + "," + this.canvas.height);
      this.webcl.init(this.canvas, this.renderer > WEBCL, 8);
      this.webcl.populateDevices($("webcl_list"));
      this.webgl = null;
      $("webcl_list").disabled = false;
    } catch(e) {
      //WebCL init failed, fallback to WebGL
      var error = e;
      if (e.message) error = e.message;
      popup("WebCL could not be initialised (" + error + ")<br>Try <a href='http://webcl.nokiaresearch.com/'>webcl.nokiaresearch.com</a> for more information.");
      this.webcl = null;
      this.renderer = WEBGL;
      $("webcl").disabled = true;
      $("fp64").disabled = true;
      $("webcl_list").disabled = true;
    }
  }

  if (this.renderer == WEBGL) {
    try {
      //Init WebGL
      this.webgl = new WebGL(this.canvas);
      this.gl = this.webgl.gl;
      this.webgl.init2dBuffers();
      $("webcl_list").disabled = true;
    } catch(e) {
      //WebGL init failed
      var error = e;
      if (e.message) error = e.message;
      popup("WebGL support not available (" + error + 
            ")<br>Try <a href='http://get.webgl.org/troubleshooting'>" + 
            "http://get.webgl.org/troubleshooting</a> for more information.");
      this.webgl = null;
      this.renderer = NONE;
      $("webgl").disabled = true;
    }
  }

  //Style buttons
  $("webgl").className = "";
  $("webcl").className = "";
  $("fp64").className = "";
  if (this.renderer == WEBGL) 
    $("webgl").className = "activemode";
  else if (this.renderer == WEBCL64 && this.webcl.fp64)
    $("fp64").className = "activemode";
  else if (this.renderer == WEBCL)
    $("webcl").className = "activemode";

  var renderer_names = ["None", "WebGL", "WebCL", "WebCL fp64"];
  print("Mode set to " + renderer_names[this.renderer+1]);
  state.renderer = this.renderer;
  state.saveStatus();
}

//Fractal.prototype.webclSet = function(pfid, devid) {
Fractal.prototype.webclSet = function(valstr) {
  var val = JSON.parse(valstr);
  //Init with new selection
  state.platform = val.pfid;
  state.device = val.devid;
  this.setRenderer('main', this.renderer);

  //Redraw if updating
  if (sources["generated.source"]) {
    //Invalidate shader cache
    sources["generated.source"] = '';
    this.applyChanges();
  }
}

Fractal.prototype.precision = function(val) {
  if (this.renderer > WEBGL && this.webcl.fp64) return val.toFixed(15);
  return val.toFixed(8);
}

//Actions
Fractal.prototype.restoreLink = function() {
  return '<a href="javascript:fractal.restore('+ this.position.print() + ', new Complex'+ this.selected + ', ' + fractal.julia + ');">@</a> '; 
}

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
  print(this.restoreLink() + "Origin: re: " + this.precision(this.position.re) + " im: " + this.precision(this.position.im));
}

Fractal.prototype.applyZoom = function(factor) {
  //Adjust zoom
  this.position.zoom *= factor;
  print(this.restoreLink() + "Zoom: " + this.precision(this.position.zoom));
}

Fractal.prototype.selectPoint = function(point, log) {
  //Julia set switch
  if (point && !this.julia) {
    this.julia = true;
    $("xSelect").value = this.selected.re = this.position.re + point.re;
    $("ySelect").value = this.selected.im = this.position.im + point.im;
  } else {
    this.julia = false;
  }

  //Switch saved views
  var tempPos = this.position.clone();
  this.position = this.savePos.clone();
  this.savePos = tempPos;

  if (log) {
    if (this.julia) 
      print(this.restoreLink() + "Julia set @ (" + this.precision(this.selected.re) + ", " + this.precision(this.selected.im) + ")");
    else
      print(this.restoreLink() + "Mandelbrot set switch");
  }
}

Fractal.prototype.resetDefaults = function() {
  //debug("resetDefaults<hr>");
  //Default aspect & parameters
  $('name').value = "unnamed"
  this.width = 0;
  this.height = 0;
  this.position = new Aspect(0, 0, 0, 0.5); 
  this.savePos = new Aspect(0, 0, 0, 0.5);
  this.selected = new Complex(0, 0);
  this.julia = false;
  this.iterations = 100;

  this.choices = {"fractal" : null, "pre_transform" : null, "post_transform" : null, "outside_colour" : null, "inside_colour" : null, "filter" : null};

  //Reset default params
  for (category in this.choices)
    this.choices[category] = new Formula(category);
}

Fractal.prototype.formulaDefaults = function() {
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
  $(select + '_formula').value = f.name;
  this.editFormula(select);
}

Fractal.prototype.importFormula = function(source, filename) {
  var arr = filenameToName(filename);
  var name = arr[0];
  var type = arr[1];
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
  var sel = $(select + '_formula');
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
  return this.paramString() + this.formulaParamString() + this.formulaSourceString() + this.paletteString();
}

Fractal.prototype.toStringNoFormulae = function() {
  //All information required to reconstruct fractal if formula set already loaded
  return this.paramString() + this.formulaParamString() + this.paletteString();
}

Fractal.prototype.toStringMinimal = function() {
  //All information required to reconstruct fractal if formula set and palette already loaded
  return this.paramString() + this.formulaParamString();
}

Fractal.prototype.paramString = function() {
  //Return fractal parameters as a string
  var code = "[fractal]\nversion=" + state.version + "\n";
  if (this.width && this.height) {
    //No width & height = autosize
    code += "width=" + this.width + "\n" +
            "height=" + this.height + "\n";
  }
  code += this.position +
          "selected=" + this.selected + "\n" +
          "julia=" + this.julia + "\n" +
          "iterations=" + this.iterations + "\n";

  //Formula selections
  for (category in this.choices)
    code += category + "=" + this.choices[category].selected + "\n";

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
  return "\n[palette]\n" + colours.palette;
}

Fractal.prototype.loadPalette = function(source) {
  //Parse out palette section only, works with old and new file formats
  var lines = source.split("\n"); // split on newlines
  var buffer = "";
  var section = "";
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line[0] == "[")
      section = line.slice(1, line.length-1);
    else if (section.toLowerCase() == "palette")
      buffer += lines[i] + "\n";
  }
  colours.read(buffer);
}

//Load fractal from file
Fractal.prototype.load = function(source, checkversion, noapply) {
  if (!this.webgl && !this.webcl) return;
  //Strip leading : from old data
  source = source.replace(/:([a-zA-Z_])/g, "$1"); //Strip ":", now using @ only
  //Only prompt for old fractals when loaded from file or stored, not restored or from server
  if (state.debug && checkversion && source.indexOf("version=") < 0
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
  var lines = source.split("\n"); // split on newlines
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
        colours.read(buffer);
        i = j-1;
      }
      continue;
    }

    if (!line) continue;

    ///Remove this some day
    if (section == "params.base") section = "fractal";

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

  var lines = source.split("\n"); // split on newlines
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
        colours.read(buffer);
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

  var lines = source.split("\n"); // split on newlines
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
  colours.read(paletteSource);
  if (state.legacy) colours.palette.background.alpha = 1.0;
  
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
    $("width").value = width;
    $("height").value = height;
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
  var canvas = $('gradient');
  colours.get(canvas);
  if (this.webgl) this.webgl.updateTexture(this.webgl.gradientTexture, canvas);
}

//Apply any changes to parameters or formula selections and redraw
Fractal.prototype.applyChanges = function(antialias, notime) {
  if (!this.webgl && !this.webcl) return;
  //Only redraw when visible
  if (this.canvas.offsetWidth < 1 || this.canvas.offsetHeight < 1) return;
  //Update palette texture
  this.updatePalette();

  //Resize canvas if size settings changed
  if (document["inputs"].elements["autosize"].checked) {
    //Clear so draw() gets size from window
    this.width = 0;
    this.height = 0;
  } else {
    //Use size from form
    this.width = parseInt($("width").value);
    this.height = parseInt($("height").value);
  }

  this.iterations = parseReal($("iterations").value);
  this.julia = document["inputs"].elements["julia"].checked ? 1 : 0;
  this.position = new Aspect(parseReal($("xOrigin").value), parseReal($("yOrigin").value),
                             parseReal($("rotate").value), parseReal($("zoom").value));
  this.selected = new Complex(parseReal($("xSelect").value), parseReal($("ySelect").value));

  //Limit rotate to range [0-360)
  if (this.position.rotate < 0) this.position.rotate += 360;
  this.position.rotate %= 360;
  document["inputs"].elements["rotate"].value = this.position.rotate;

  //Copy form values to defined parameters
  for (category in this.choices)
    this.choices[category].currentParams.setFromForm();

  //Update shader code & redraw
  this.rebuild(notime);
  this.draw(antialias, notime);
}

Fractal.prototype.rebuild = function(notime) {
  this.generated = new Generator(this, this.renderer >= WEBCL && this.webcl, notime);
  this.generated.generate();
}

//Update form controls with fractal data
Fractal.prototype.copyToForm = function() {
  //debug("copyToForm<hr>");
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
    $(category + '_formula').value = this.choices[category].selected;
  //No width or height? Set autosize, otherwise disable
  if (this.width == 0 || this.height == 0)
    document["inputs"].elements["autosize"].checked = true;
  else
    document["inputs"].elements["autosize"].checked = false;
}

/**
 * @constructor
 */
function Generator(fractal, webcl, notime) {
  this.fractal = fractal;
  this.webcl = webcl;
  this.notime = notime;
  this.source = "";
}

Generator.prototype.headers = function() {
  //Add headers + core code template
  var headers = "";
  if (this.webcl) {
    //OpenCL kernel
    this.fractal.webcl.resetInput();
    headers += sources["include/opencl-header.cl"];
  } else {
    //GLSL shader
    headers += sources["include/glsl-header.frag"];
  }

  headers += sources["include/complex-math.frag"]; 

  //Insert at beginning of source
  headers += "\n#define MAXITER " + (100 * Math.ceil(this.fractal.iterations / 100)) + "\n";
  if (this.fractal.choices["inside_colour"].selected == "same")
    headers += "\n#define outside_set true\n";
  else
    headers += "\n#define outside_set escaped || converged\n";
  this.headerlen = headers.split("\n").length;
  this.source = headers + this.source;
}

//Create shader from source components
Generator.prototype.generate = function() {
  this.source = sources["include/fractal-shader.frag"]; 
  //Get formula selections
  this.selections = {};
  for (category in this.fractal.choices)
    this.selections[category] = this.fractal.choices[category].getParsedFormula();

  //Replace ---SECTION--- in template with formula code
  this.offsets = [];
  var alltypes = ["pre_transform", "fractal", "post_transform", "inside_colour", "outside_colour", "filter"];
  this.templateInsert("DATA", "data", alltypes, 2);
  this.templateInsert("INIT", "init", alltypes, 2);
  this.templateInsert("RESET", "reset", alltypes, 2);
  this.templateInsert("PRE_TRANSFORM", "transform", ["pre_transform"], 4);
  this.templateInsert("ZNEXT", "znext", ["fractal"], 2);
  this.templateInsert("POST_TRANSFORM", "transform", ["post_transform"], 4);
  this.templateInsert("ESCAPED", "escaped", ["fractal"], 2);
  this.templateInsert("CONVERGED", "converged", ["fractal"], 2);
  this.templateInsert("OUTSIDE_CALC", "calc", ["outside_colour"], 4);
  this.templateInsert("INSIDE_CALC", "calc", ["inside_colour"], 4);
  this.templateInsert("OUTSIDE_COLOUR", "result", ["outside_colour"], 2);
  this.templateInsert("INSIDE_COLOUR", "result", ["inside_colour"], 2);
  this.templateInsert("FILTER", "filter", ["filter"], 2);
  this.offsets.push(new LineOffset("(end)", "(end)", this.source.split("\n").length));

  //Replace any (x,y) constants with complex(x,y)
  //(where x,y can be a numeric constant)
  //(...modified to also allow single variables, note: first pattern is to ignore function call match)
  var creg = /([^a-zA-Z0-9_\)])\(([-+]?((\d*\.)?\d+|[a-zA-Z_][a-zA-Z0-9_]*))\s*,\s*([-+]?((\d*\.)?\d+|[a-zA-Z_][a-zA-Z0-9_]*))\)/g
  //var creg = /([^a-zA-Z_])\(([-+]?(\d*\.)?\d+)\s*,\s*([-+]?(\d*\.)?\d+)\)/g;
  this.source = this.source.replace(creg, "$1C($2,$5)");

  this.source = this.source.replace(/ident/g, ""); //Strip ident() calls

  //Switch to C-style casts for OpenCL
  if (this.webcl) {
    this.source = this.source.replace(/complex\(/g, "C(");
    this.source = this.source.replace(/real\(/g, "(real)(");
    this.source = this.source.replace(/float\(/g, "(float)(");
    this.source = this.source.replace(/int\(/g, "(int)(");
    this.source = this.source.replace(/rgba\(/g, "(rgba)(");
  }

  //Insert headers
  this.headers();
  //Recompile
  this.compile();
}

Generator.prototype.templateInsert = function(marker, section, sourcelist, indent) {
  var source = "//***" + marker + "***\n";
  var regex = new RegExp("---" + marker + "---");
  var spaces = "          ";
  spaces = spaces.substr(0, indent);

  //Save the line offset where inserted
  var match = regex.exec(this.source);
  var offset = this.source.slice(0, match.index).split("\n").length;
  //debug("<br>" + section + "-->" + marker + " STARTING offset == " + offset);

  //Get sources
  for (s in sourcelist) {
    //Get code for this section from each of the sources
    var code = this.selections[sourcelist[s]][section];
    if (!code) continue;

    //Replace spaces at line beginnings with specified indent
    //source = source.replace(/^\s*/gm, spaces);
    var reg = /^\s*/gm;
    var match;
    while (match = reg.exec(code)) {
      code = code.slice(0, reg.lastIndex) + spaces + code.slice(reg.lastIndex, code.length);
      reg.lastIndex += indent;
    }

    //Save offset for this section from this formula selection
    this.offsets.push(new LineOffset(sourcelist[s], section, offset + source.split("\n").length - 1));
    //debug(section + " --> " + sourcelist[s] + " offset == " + this.offsets[this.offsets.length-1].value);

    //Concatentate to final code to insert at marker position
    source += code + "\n";
  }

  //Replaces a template section with the passed source
  this.source = this.source.replace(regex, source);
}

Generator.prototype.update = function(source) {
  //Replacement source and recompile
  this.source = source;
  this.compile();
}

//Rebuild from source
Generator.prototype.compile = function() {
  //Only recompile if data has changed!
  if (sources["generated.source"] != this.source) {
    //Save for debugging
    var timer = new Timer();
    sources["generated.source"] = this.source;

    //Compile the shader using WebGL or WebCL
    //Any build errors will cause exceptions
    var error_regex = /0:(\d+)/;
    try {
      if (this.webcl) {
        error_regex = /[^-](\d+):/;
        //error_regex = /:(\d+):/;
        this.fractal.webcl.buildProgram(this.source);
      } else {
        this.fractal.updateShader(this.source);
      }
      if (!this.notime) timer.print("Compile");
    } catch (e) {
      this.parseErrors(e, error_regex);
    }

    //Opera doesn't support onbeforeunload, so save state now
    if (window.opera && state.output) state.save();
  } else
    debug("Shader build skipped, no changes");
}

Generator.prototype.parseErrors = function(errors, regex) {
  //Parse errors using supplied regex to find line number
  var match = regex.exec(errors);
  var found = false;
  if (match) {
    var lineno = parseInt(match[1]) - this.headerlen + 1; //Subtract header length
    var last = null
    for (i in this.offsets) {
      if (last) {
        //debug("CAT: " + this.offsets[last].category + "SECTION: " + this.offsets[last].section + " from: " + this.offsets[last].value + " to " + (this.offsets[i].value-1));
        if (lineno >= this.offsets[last].value && lineno < this.offsets[i].value) {
          var section = this.offsets[last].section;
          //Adjust the line number
          lineno -= this.offsets[last].value + 1;
          lineno += this.fractal.choices[this.offsets[last].category].lineoffsets[section];
          var key = formulaKey(this.offsets[last].category, this.fractal.choices[this.offsets[last].category].selected);
          if (key) {
            alert("Error on line number: " + (isNaN(lineno) ? "??" : lineno) +  "\nSection: " + section + "\nof " + 
                  sectionnames[this.offsets[last].category] + " formula: " + 
                  (key ? formula_list[key].label : "?") + "\n--------------\n" + errors);
            found = true;
          }
          break;
        }
      }
      last = i;
    }
  }
  if (!found) alert(errors);  //Otherwise show raw error
}

Fractal.prototype.updateShader = function(source) {
  //Compile the WebGL shader
  this.program = new WebGLProgram(this.gl, sources["include/shader2d.vert"], source);
  //Restore uniforms/attributes for fractal program
  var uniforms = ["palette", "offset", "iterations", "julia", "origin", "selected_", "dims", "pixelsize", "background"];
  this.program.setup(["aVertexPosition"], uniforms);
  //Get HLSL source if available
  if (state.debug) {
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
  if (!antialias) antialias = this.antialias;
  var timer = null;
  if (!notime)
    timer = new Timer(ondrawn);

  //Set canvas size
  this.sizeCanvas();

  if (this.webgl) {
    this.webgl.time = timer;
    this.renderWebGL(antialias);
  } else if (this.renderer >= WEBCL && this.webcl) {
    this.webcl.time = timer;
    this.webcl.draw(this, antialias, colours.palette.background);
  } else
    alert("No renderer!");
}

Fractal.prototype.clear = function() {
  //Set canvas size
  this.sizeCanvas();

  if (this.webgl)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  else if (this.renderer >= WEBCL && this.webcl)
    this.canvas.width = this.canvas.width;  //Clears 2d canvas
}

Fractal.prototype.renderViewport = function(x, y, w, h) {
  var alpha = colours.palette.background.alpha; //Save bg alpha
  colours.palette.background.alpha = 1.0;
  if (this.webgl) {
    this.webgl.time = null; //Disable timer
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.webgl.viewport = new Viewport(x, y, w, h);
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.scissor(x, y, w, h);
    this.renderWebGL(this.antialias);
    this.webgl.viewport = new Viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.disable(this.gl.SCISSOR_TEST);
  } else if (this.renderer >= WEBCL && this.webcl) {
    this.webcl.time = null; //Disable timer
    this.webcl.setViewport(x, y, w, h);
    this.webcl.draw(this, this.antialias, colours.palette.background);
    //this.webcl.setViewport(0, 0, this.canvas.width, this.canvas.height);
  }
  colours.palette.background.alpha = alpha;  //Restore alpha
}

Fractal.prototype.renderWebGL = function(antialias) {
  if (!this.program || !this.program.uniforms) return;
  this.webgl.use(this.program);

  //Uniform variables
  this.gl.uniform1i(this.program.uniforms["iterations"], this.iterations);
  this.gl.uniform1i(this.program.uniforms["julia"], this.julia);
  this.gl.uniform4fv(this.program.uniforms["background"], colours.palette.background.rgbaGL());
  this.gl.uniform2f(this.program.uniforms["origin"], this.position.re, this.position.im);
  this.gl.uniform2f(this.program.uniforms["selected_"], this.selected.re, this.selected.im);
  this.gl.uniform2f(this.program.uniforms["dims"], this.webgl.viewport.width, this.webgl.viewport.height);
  this.gl.uniform1f(this.program.uniforms["pixelsize"], this.position.pixelSize(this.webgl.viewport));

  //Parameter uniforms...
  for (category in this.choices)
    this.choices[category].currentParams.setUniforms(this.gl, this.program.program, category);

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
  this.webgl.draw2d(antialias);
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
  var select = $("select");

  //Convert mouse coords into fractal coords
  var point = this.position.convert(mouse.x, mouse.y, mouse.element);

  //Selection box? Ignore if too small a region selected
  if (select.style.display == 'block' && select.w > 5 && select.h > 5) {
    //Get element offset in document
    //var offset = findElementPos(mouse.element);
    //Convert coords to position relative to element
    //select.x -= offset[0];
    //select.y -= offset[1];
    //Get centre of selection in fractal coords
    var centre = this.position.convert(select.x + select.w/2, select.y + select.h/2, mouse.element);
    //Adjust centre position to match mouse left click
    this.setOrigin(centre);
    //Adjust zoom by factor of element width to selection
    this.applyZoom(mouse.element.width / select.w);
  } else if (event.button == 0) {
    //Adjust centre position to match mouse left click
    this.setOrigin(point);
  } else if (event.button > 0) {
    //Right-click, not dragging
    if (event.button == 2 && !mouse.dragged) {
      //Switch to julia set at selected point
      this.selectPoint(point, true);
    } else {
      //No redraw
      return true;
    }
  }

  select.style.display = 'none';
  this.copyToForm();
  this.draw();
  return true;
}

Fractal.prototype.down = function(event, mouse) {
  //Clear focus from menu popups to hide them if active
  //$('popup').focus();
  //document.activeElement.blur()
  //Stop any current render
  this.stop();
  clearPreviewJulia();
  //return false;
  return true;
}

Fractal.prototype.up = function(event, mouse) {
  clearPreviewJulia();
  return true;
}

Fractal.prototype.move = function(event, mouse) {
  //Mouseover processing
    mouse.point = new Aspect(0, 0, 0, 0);
  if (!fractal || state.mode == 0) return true;
  if (mouse.x >= 0 && mouse.y >= 0 && mouse.x <= mouse.element.width && mouse.y <= mouse.element.height)
  {
    //Convert mouse coords into fractal coords
    mouse.point = this.position.convert(mouse.x, mouse.y, mouse.element);
    mouse.coord = new Aspect(mouse.point.re + this.position.re, mouse.point.im + this.position.im, 0, 0);
    $("coords").innerHTML = "&nbsp;re: " + this.precision(mouse.coord.re) + " im: " + this.precision(mouse.coord.im);

    //Constantly updated mini julia set rendering
    if (this.preview && !this.julia) {
      drawPreviewJulia();
      return;
    }
  }

  if (!mouse.isdown) return true;

  //Right & middle buttons: drag to scroll
  if (mouse.button > 0) {
    // Set the scroll position
    if (isFullScreen()) {
      $('main').scrollLeft -= mouse.deltaX;
      $('main').scrollTop -= mouse.deltaY;
    } else
      window.scrollBy(-mouse.deltaX, -mouse.deltaY);
    return true;
  }

  //Drag processing
  var select = $("select");
  var main = $("main");
  select.style.display = 'block';

  //Constrain selection size to canvas aspect ratio
  select.w = Math.abs(mouse.deltaX)
  var ratio = mouse.element.width / select.w;
  select.h = mouse.element.height / ratio;

  if (mouse.deltaX < 0)
    select.x = mouse.x;
  else
    select.x = mouse.x - select.w;

  var offset = findElementPos(main);
  if (mouse.deltaY < 0)
    select.y = mouse.lastY - select.h - offset[1];
  else
    select.y = mouse.lastY - offset[1];

  //Copy to style to set positions
  select.style.left = select.x + "px";
  select.style.top = select.y + "px";
  select.style.width = select.w + "px";
  select.style.height = select.h + "px";

  $("coords").innerHTML = select.style.width + "," + select.style.height;
}

Fractal.prototype.wheel = function(event, mouse) {
  this.stop();
  if (!this.preview && event.shiftKey) {
    //$('rotate').value = parseReal($('rotate').value, 1) + event.spin * 10;
    $('iterations').value = parseInt($('iterations').value) + event.spin;
    //Accumulate spin before applying changes
    //First clear any existing timer
    if (this.timer) clearTimeout(this.timer);
    //Set timer
    document.body.style.cursor = "wait";
    this.timer = setTimeout('fractal.applyChanges(); document.body.style.cursor = "default";', 350);

  } else {
    // Zoom
    var zoom;
    if (event.spin < 0)
       zoom = 1/(-event.spin * 1.1);
    else
       zoom = event.spin * 1.1;

    if (this.preview) {
       this.savePos.zoom *= zoom;
       drawPreviewJulia();
    } else {
      //Zoom box processing
      var select = $("select");
      var el = this.canvas; //$("el");

      if (select.timer) clearTimeout(select.timer);
      if (!select.zoom) select.zoom = 1.0;
      if (!select.mouse) {
        //Handle wheel events on select element too
        select.mouse = mouse;
        select.onmousewheel = handleMouseWheel;
        if (select.addEventListener) select.addEventListener("DOMMouseScroll", handleMouseWheel, false);
      }
      select.zoom *= zoom;

      //Constrain selection size to mouse.element aspect ratio
      var z = select.zoom;
      if (z > 1.0) {
        z = 1.0 / z;
        select.w = el.offsetWidth * z;
        select.h = el.offsetHeight * z;
        select.x = 0.5*(el.offsetWidth - select.w);
        select.y = 0.5*(el.offsetHeight - select.h);
      } else {
        select.style.background = "transparent";
        select.style.borderColor = "#EECC11";
        select.x = select.y = 0;
        select.w = el.offsetWidth * z;
        select.h = el.offsetHeight * z;
        select.style.borderLeftWidth = Math.round(0.5 * (el.offsetWidth - select.w)) + "px";
        select.style.borderRightWidth = select.style.borderLeftWidth;
        select.style.borderTopWidth = Math.round(0.5 * (el.offsetHeight - select.h)) + "px";
        select.style.borderBottomWidth = select.style.borderTopWidth;
      }

      //Copy to style to set positions
      select.style.left = select.x + "px";
      select.style.top = select.y + "px";
      select.style.width = select.w + "px";
      select.style.height = select.h + "px";
      select.style.display = 'block';

      //Set timer
      document.body.style.cursor = "wait";
      //select.timer = setTimeout('selectZoom();', 350);
      select.timer = setTimeout('selectZoom();', 550);

    }
  }

  return false;
}

function selectZoom() {
  //Zoom box processing
  var select = $('select');
  select.timer = null;
  document.body.style.cursor = "default";
  fractal.applyZoom(select.zoom);
  //Update form fields
  fractal.copyToForm();
  fractal.applyChanges();
  select.zoom = null;
  select.style.display = 'none';
  select.style.background = "#EECC11";
  select.style.borderColor = "#596380";
  select.style.borderWidth = "1px";
}
/////////////////////////////////////////////////////////////////////////
//Julia set preview window
function drawPreviewJulia() {
  var canvas = $("fractal-canvas");
  mouse = canvas.mouse;

  fractal.preview.point = mouse.point;
  fractal.preview.x = mouse.x;
  fractal.preview.y = fractal.webgl ? canvas.height - mouse.y : mouse.y;
  fractal.preview.w = 250;
  fractal.preview.h = Math.round(250 * canvas.height / canvas.width);
  if (mouse.x > canvas.width - fractal.preview.w) fractal.preview.x -= fractal.preview.w;
  if (fractal.webgl && mouse.y < canvas.height - fractal.preview.h) fractal.preview.y -= fractal.preview.h; 
  if (fractal.webcl && mouse.y > canvas.height - fractal.preview.h) fractal.preview.y -= fractal.preview.h; 

  fractal.selectPoint(fractal.preview.point);
  fractal.renderViewport(fractal.preview.x, fractal.preview.y, fractal.preview.w, fractal.preview.h);
  fractal.selectPoint();
}

function clearPreviewJulia() {
  if (!fractal.preview) return;
  $('previewbtn').innerHTML = "Show Preview"
  var canvas = $("fractal-canvas");
  clearTimeout(fractal.preview.timeout);
  document.mouse.moveUpdate = false;
    $S("fractal-canvas").backgroundImage = $S("palette").backgroundImage; //"url('media/bg.png')";
    $S("background").display = "none";
  $("background").src = "";
  fractal.preview = null;
  if (fractal.webcl) fractal.webcl.setViewport(0, 0, canvas.width, canvas.height);
  fractal.draw();
}

function showPreviewJulia() {
  //Save frame image (used for julia preview background)
  fractal.imagedata = fractal.canvas.toDataURL("image/png");
  fractal.preview = {};
  //WebGL implicitly clears the canvas, unless preserveDrawingBuffer requested 
  //(which apparently is a performance problem on some platforms) so copy fractal
  //image into background while rendering julia set previews
  $("background").src = fractal.imagedata;
  $S("background").display = "block";
  $S("fractal-canvas").backgroundImage = "none";
  document.mouse.moveUpdate = true;  //Enable constant deltaX/Y updates
  drawPreviewJulia();
}

function togglePreview() {
  if (fractal.preview || fractal.julia) {
    clearPreviewJulia();
  } else {
    showPreviewJulia();
    $('previewbtn').innerHTML = "Show Preview &#10003;"
  }
}


Fractal.prototype.pinch = function(event, mouse) {
  var zoom;
  if (event.distance > 0)
    zoom = 1.0 + (event.distance * 0.001);
  else
    zoom = 1/(1.0 + event.distance * -0.001);
  //print(diff + ' --> ' + zoom);
  fractal.applyZoom(zoom);
  fractal.copyToForm();
  fractal.draw();
  //Hide select box
  var select = $('select');
  select.style.display = 'none';
}

