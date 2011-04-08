  //Regular expressions, TODO: param parsing not handling true/false yet...
  var paramreg = /@([A-Za-z0-9]*) *= *(bool|int|uint|real|float|complex)\((.*)\); *(\/\/(.*))?(?:\r\n|[\r\n])/gi;
  var numreg = /([-+]?([0-9]*\.)?[0-9]+),? *([-+]?([0-9]*\.)?[0-9]+)?/;
  var boolreg = /(true|false)/i;
  var listreg = /("([A-Za-z0-9]*\|?)*")/i;
  var complexreg = /\(([-+]?([0-9]*\.)?[0-9]+), *([-+]?([0-9]*\.)?[0-9]+)\)/;

  function Aspect(re, im, rotation, zoom) {
    this.re = re;
    this.im = im;
    this.rotate = rotation;
    this.zoom = zoom; 
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
    //consoleWrite(element.width + " x " + element.height + " ==> " + size[0] + " x " + size[1]);
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

    //Apply rotation around Z to selected point (uses sylvester.js vector fns)
    var arad = -this.rotate * Math.PI / 180.0;
    var axis = Line.create($V([0,0,0]), $V([0,0,1]));
    var apos = $V([re, im, 0]);
    var newPos = apos.rotate(arad, axis);
    //return new Aspect(newPos.e(1), newPos.e(2), this.rotate, this.zoom);
    return new Complex(newPos.e(1), newPos.e(2));
  }

  //Complex number type
  function Complex(real, imag) {
    if (typeof(real) == 'string')
      this.re = parseFloat(real);
    else
      this.re = real;

    if (typeof(imag) == 'string')
      this.im = parseFloat(imag);
    else
      this.im = imag;
  }

  Complex.prototype.toString = function() {
    return "(" + this.re + "," + this.im + ")";
  }

  function parseComplex(value) {
    //Parse string as complex number
    var match = complexreg.exec(value);
    if (match && match[1] && match[3]) {
      return new Complex(match[1], match[3]);
    } else {
      return new Complex(parseFloat(value), 0);
    }
  }

  function Param(value, label) {
    //A parameter object
    this.label = label;
    this.touched = false;
    this.parse(value);
  }

  Param.prototype.parse = function(value) {
    //Convert passed value to value and type
    //"int" must be passed as a string or will interpret as a real
    if (typeof(value) == 'string') {
      //Parser for complex, int or real parameters passed as strings
      var match = complexreg.exec(value);
      if (match && match[1] && match[3]) {
        this.value = new Complex(match[1], match[3]);
        this.type = 'complex';
        this.typeid = 2;
      } else {
        if (value.indexOf('.') == -1) {
          this.value = parseInt(value);
          this.type = 'int';
          this.typeid = 0;
        } else {
          this.value = parseFloat(value);
          this.type = 'real';
          this.typeid = 1;
        }
      }
    } else if (typeof(value) == 'number') {
      this.value = value;
      this.type = 'real';
      this.typeid = 1;
    } else if (typeof(value) == 'boolean') {
      this.value = value;
      this.type = 'bool';
      this.typeid = -1;
    } else if (typeof(value) == 'object') {
      if (value.length == 2)
        this.value = new Complex(value[0], value[1]);
      else
        this.value = value; //Assume is a Complex already
      this.type = 'complex';
      this.typeid = 2;
    }
  }

  Param.prototype.toGLSL = function() {
    //Convert value to a valid GLSL constant in a string
    function realStr(val) {
      strval = "" + val;
      if (strval.split('.')[1] == undefined)
        return strval + ".0";
      else
        return strval;
    }

    if (this.type == 'real')
      return realStr(this.value);
    else if (this.type == 'complex')
      return "complex(" + realStr(this.value.re) + "," + realStr(this.value.im) + ")";
    else
      return "" + this.value;
  }

  Param.prototype.declare = function(key) {
    //Return GLSL const declaration for this parameter
    if (this.type == 'int' && Math.abs(this.value) > 65535) alert("Integer value out of range +/-65535");
    return "const " + this.type + " " + key + " = " + this.toGLSL() + ";\n";
  }

  Param.prototype.setFromElement = function(key) {
    //Get param value from associated form field
    switch (this.typeid)
    {
      case -1: //Boolean = checkbox
        this.value = document.getElementById(key).checked;
        break;
      case 0: //Integer = entry
        this.value = parseInt(document.getElementById(key).value);
        break;
      case 1: //real = entry
        this.value = parseFloat(document.getElementById(key).value);
        break;
      case 2: //complex = 2 x entry
        this.value.re = parseFloat(document.getElementById(key + "_re").value);
        this.value.im = parseFloat(document.getElementById(key + "_im").value);
        break;
    }
  }

  function ParameterSet() {
    //A collection of functions that operate on sets of parameters
  }

  ParameterSet.prototype.toString = function() {
    //Return text parameters for saving
    var str = "";
    for (key in this)
    {
      if (typeof(this[key]) == 'object')
        str += key + "=" + this[key].value + "\n";
    }
    return str;
  }

  ParameterSet.prototype.count = function() {
    var count = 0;
    for (key in this)
      if (typeof(this[key]) == 'object')
        count++;
    return count;
  }

  ParameterSet.prototype.setFromForm = function() {
    //Copy form values to defined parameters
    for (key in this)
    {
      if (typeof(this[key]) == 'object')
        this[key].setFromElement(key);
    }
  }

  ParameterSet.prototype.toCode = function() {
    //Return GLSL code defining parameters
    var code = "";
    for (key in this)
    {
      if (typeof(this[key]) == 'object')
        code += this[key].declare(key);
    }
    return code;
  }

  //Read our parameter definitions from provided formula source
  ParameterSet.prototype.parseFormula = function(source) {
    var match;
    while (match = paramreg.exec(source)) {
      //name, type, value, //, Label/comment 
      var name = match[1];
      var type = match[2];
      var value = match[3];
      var label = match[5];
      if (!label) label = name; //Default label if none provided

      //Parse the value, accepts numbers including complex
      var nummatch = numreg.exec(value);
      var boolmatch = boolreg.exec(value);
      var listmatch = listreg.exec(value);
      if (nummatch) {
        var val1 = nummatch[1];
        var val2 = nummatch[3];
        if (!val2) val2 = 0;      //Default 2nd val for complex if none

        //Not overwriting param if already exists as same type, causes problems, should probably clear all or detect if changed
        if (!this[name] || (this[name] && this[name].type != type)) {
          if (type == "complex")
            this[name] = new Param([val1, val2], label);
          else if (type == "real" || type == "real")
            this[name] = new Param(parseFloat(val1), label);
          else if (type == "int" || type == "uint")
            this[name] = new Param(val1, label);
          else if (type == "bool")
            this[name] = new Param(parseInt(val1) != 0, label);
        }
      } else if (boolmatch) {
        if (type == "bool")
          this[name] = new Param(boolmatch[1].toLowerCase() == "true", label);
      } else if (listmatch) {
        alert("List match: " + value);
          this[name] = new Param("0", label); //Create int param
      } else {
        alert("No match for parameter (" + name + ") value: " + value);
      }

      //Overwrite the comment label
      this[name].label = label;
    };
  }

  //Add fields for all our parameters dynamically to the page
  ParameterSet.prototype.createFields = function(area) {
    var field_area = document.getElementById(area);
    var divider = document.createElement("div");
    divider.className = "divider";

    for (key in this)
    {
      if (typeof(this[key]) != 'object') continue;

      //Append divider before first param
      if (divider) {
        field_area.appendChild(divider);
        divider = null;
      }

      var row = document.createElement("div");
      row.className = "row";

      var label = document.createElement("span");
      label.className = "label";
      label.appendChild(label.ownerDocument.createTextNode(this[key].label));

      var spanin = document.createElement("span");
      spanin.className = "field";

      var input = document.createElement("input");
      input.id = key;
      input.name = key;

      switch (this[key].typeid)
      {
        case -1: //Boolean
          input.type = "checkbox"; //Type of field - can be any valid input type like text,file,checkbox etc.
          input.checked = this[key].value;
          break;
        case 0: //Integer
        case 1: //real
          input.type = "number"; //Type of field - can be any valid input type like text,file,checkbox etc.
          input.value = this[key].value;
          break;
        case 2: //complex (2xreal)
          input.id = key + "_re";
          input.name = input.id;
          input.type = "number"; //Type of field - can be any valid input type like text,file,checkbox etc.
          input.value = this[key].value.re;
          spanin.appendChild(input);
          //Create second field
          input = document.createElement("input");
          input.id = key + "_im";
          input.name = input.id;
          input.type = "number"; //Type of field - can be any valid input type like text,file,checkbox etc.
          input.value = this[key].value.im;
          break;
        default:
          continue;
      }   

      spanin.appendChild(input);

      //Add to row div
      row.appendChild(label);
      row.appendChild(spanin);
      //Add row to area div
      field_area.appendChild(row);
    }
  }

  function Fractal(re, im, rotation, zoom) {
    this.origin = new Aspect(re, im, rotation, zoom); 
    this.savePos = this.origin;
    this.selected = new Complex(0, 0);
    this.julia = false;
    this.perturb = false;

    this.params = {};
    this.formula = {};

    this.selectFormula("base", "base"); //Dummy formula to hold base params
    this.selectFormula("fractal", "mandelbrot");
    this.selectFormula("transform", "none");
    this.selectFormula("outside_colour", "default");
    this.selectFormula("inside_colour", "none");
  }

  Fractal.prototype.formulaFilename = function(type) {
    var extension = ".frac";
    if (type == "transform") extension = ".transform.frac";
    if (type.indexOf("colour") > -1) extension = ".colour.frac";
    return "formulae/" + this.formula[type] + extension;
  }

  Fractal.prototype.editFormula = function(type) {
    if (this.formula[type] != "none")
      openEditor(type);
      //openEditor(this.formulaFilename(type));
  }

  Fractal.prototype.selectFormula = function(type, name) {
    //Formula selected, parse it's parameters
    if (name) this.formula[type] = name; //$(type + "_formula").value;

    //Delete any existing dynamic form fields
    var element = document.getElementById(type + "_params");
    if (element.hasChildNodes()) {
      while (element.childNodes.length >= 1 )
        element.removeChild(element.firstChild );       
    }

    //Create empty param set if not yet defined
    if (!this.params[this.formula[type]])
      this.params[this.formula[type]] = new ParameterSet();

    if (this.formula[type] != "none") {
      var code = sources[this.formulaFilename(type)];
      //Load the parameter set for selected formula
      this.params[this.formula[type]].parseFormula(code);
      //Update the fields
      this.params[this.formula[type]].createFields(type + "_params");
    }
  }

  Fractal.prototype.getParamDeclarations = function() {
    var code = ""
    for (key in this.formula)
      code += this.params[this.formula[key]].toCode();
    return code;
  }

  Fractal.prototype.toString = function() {
    return "width=" + gl.viewportWidth + "\n" +
           "height=" + gl.viewportHeight + "\n" +
           this.origin +
           "selected=" + this.selected + "\n" +
           "julia=" + this.julia + "\n" +
           "perturb=" + this.perturb + "\n" +
           "fractal=" + this.formula["fractal"] + "\n"  +
           "transform=" + this.formula["transform"] + "\n"  +
           "outside_colour=" + this.formula["outside_colour"] + "\n"  +
           "inside_colour=" + this.formula["inside_colour"];
  }

  //Save fractal (write param/source file)
  Fractal.prototype.save = function() {
    code = "[fractal]\n" + this + "\n"; 
    code += "\n[params.base]\n" + this.params["base"];
    var types;
    if (this.formula["outside_colour"] == this.formula["inside_colour"])
      types = ["fractal", "transform", "outside_colour"];
    else
      types = ["fractal", "transform", "outside_colour", "inside_colour"];

    for (t in types) {
      type = types[t];
      if (this.formula[type] != "none") {
        if (this.params[this.formula[type]].count() > 0) {
          code += "\n[params." + this.formula[type] + "]\n" + 
                  this.params[this.formula[type]];
        }
        code += "\n[formula." + this.formula[type] + "]\n" + 
                sources[this.formulaFilename(type)];
      }
    }
    code += "\n[palette]\n" + getPalette();
    function fileSaved() {window.open("saved.fractal");}
    ajaxWriteFile("saved.fractal", code, fileSaved);
  }

  //Load fractal from file
  Fractal.prototype.load = function(source) {
    //1. Load fixed params as key=value: origin, selected, julia, perturb, 
    //2. Load selected formula names
    //3. Load code for each selected formula (including "base")
    //4. For each formula, load formula params into params[formula]
    //5. Load palette
    var lines = source.split("\n"); // split on newlines
    var section = "";

    var buffer = "";
    var collect = false;
    var collectDone;
    var types = {};

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line[0] == "[") {
        if (collect) {
          //Finished collecting lines, call processor function
          collectDone(buffer);
          collectDone = null;
          collect = false;
        }

        section = line.slice(1, line.length-1);

        if (section == "palette"){
          //Collect lines into palette data
          collect = true;
          buffer = "";
          collectDone = readPalette; 
        } else if (section.slice(0, 8) == "formula.") {
          //Collect lines into formula code
          var pair1 = section.split(".");
          var formula = pair1[1];
          var filename = this.formulaFilename(types[formula]);
          collect = true;
          buffer = "";
          collectDone = function() {sources[filename] = buffer;}
        }
        continue;
      }

      if (collect) {
        buffer += lines[i] + "\n";
        continue;
      }
      if (!line) continue;

      if (section == "fractal") {
        //parse into attrib=value pairs
        var pair = line.split("=");

        //Process ini format params
        if (pair[0] == "width" || pair[0] == "height")
          this[pair[0]] = parseInt(pair[1]);
        else if (pair[0] == "zoom" || pair[0] == "rotate")
          this.origin[pair[0]] = parseFloat(pair[1]);
        else if (pair[0] == "origin" || pair[0] == "selected") {
          var c = parseComplex(pair[1]);
          this[pair[0]].re = c.re;
          this[pair[0]].im = c.im;
        } else if (pair[0] == "julia" || pair[0] == "perturb") {
          this[pair[0]] = (parseInt(pair[1]) == 1 || pair[1] == 'true');
        } else {
          //Formula name
          this.selectFormula(pair[0], pair[1]);
          //this.formula[pair[0]] = pair[1];
          types[pair[1]] = pair[0]; //Save for a reverse lookup
        }
      } else if (section.slice(0, 7) == "params."){
        var pair1 = section.split(".");
        var formula = pair1[1];
        var pair2 = line.split("=");
        if (this.params[formula][pair2[0]]) {
          //Preserve type
          if (this.params[formula][pair2[0]].typeid == 1)
            //Parse as float first or can be interpreted as int
            this.params[formula][pair2[0]].parse(parseFloat(pair2[1]));
          else  //Parse ints/floats as strings
            this.params[formula][pair2[0]].parse(pair2[1]);
        } else
          //Not defined in formula, skip
          consoleWrite("Skipped param, not declared: " + section + "--- this.params[" + formula + "][" + pair2[0] + "]=" + pair2[1]);

      }
    }

    //Process selected formulae
    this.selectFormula('fractal');
    this.selectFormula('transform');
    this.selectFormula('outside_colour');
    this.selectFormula('inside_colour');

    //Process the palette data
    if (buffer) readPalette(buffer);

    //Update parameters
    this.loadParams();
  }

  //Conversion/parser for my old fractal ini files
  Fractal.prototype.iniParser = function(source) {
    function convertFormulaName(name) {
      //Conversion for my old fractal ini formula descriptors
      if (name == "Mandelbrot") return "mandelbrot";
      if (name == "Nova") return "nova";
      if (name == "Nova BS") return "novabs";
      if (name == "NovaBS") return "novabs";
      if (name == "Burning Ship") return "burningship";
      if (name == "BurningShip") return "burningship";
      if (name == "Magnet1") return "magnet1";
      if (name == "Magnet2") return "magnet2";
      if (name == "Magnet3") return "magnet3";
      //Not yet supported....TODO:
      if (name == "Phoenix") return "phoenix";
      if (name == "Cactus") return "cactus";
      if (name == "Stretched") return "stretched";
      if (name == "Gumball") return "gumball";  //rename?
      if (name == "Quadra") return "quadra";  //rename?

      //Colour formulae
      if (name == "None") return "none";
      if (name == "Default") return "default";
      if (name == "Smooth") return "smooth1";
      if (name == "Smooth 2") return "smooth2";
      if (name == "Exp. Smoothing - diverge") return "exp_diverge";
      if (name == "Exp. Smoothing - Xdiverge") return "exp2_diverge";
      if (name == "Exp. Smoothing - converge") return "exp_converge";
      if (name == "Exp. Smoothing - Both") return "exp_combined";
      if (name == "Triangle Inequality") return "triangle_inequality";
      //These are not yet supported but define them anyway...TODO:
      if (name == "Orbit Traps") return "orbit_traps";
      if (name == "Gaussian Integers") return "gaussian_integers";
      return "none";  //Fallback
    }
    var lines = source.split("\n"); // split on newlines
    var section = "";

    this.formula["transform"] = "fractured";
    this.params["fractured"] = new ParameterSet();

    var saved = {};
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
          this.formula["fractal"] = convertFormulaName(pair[1]);
            this.selectFormula("fractal", this.formula["fractal"]);
          //if (!this.params[this.formula["fractal"]])
          //  this.params[this.formula["fractal"]] = new ParameterSet();
        } else if (pair[0] == "JuliaFlag")
          this.julia = parseInt(pair[1]) ? true : false;
        else if (pair[0] == "PerturbFlag")
          this.perturb = parseInt(pair[1]) ? true : false;
        else if (pair[0] == "Iterations")
          this.params["base"]["iterations"].value = parseInt(pair[1]) - 1; //Subtract 1, correct if old system count was out
        else if (pair[0] == "Bailout")
          this.params[this.formula["fractal"]]["bailout"].value = parseFloat(pair[1]);
        else if (pair[0] == "Xstart")
          this.origin.re = parseFloat(pair[1]);
        else if (pair[0] == "Ystart")
          this.origin.im = parseFloat(pair[1]);
        else if (pair[0] == "Width")
          document.getElementById("widthInput").value = pair[1];
        else if (pair[0] == "Height")
          document.getElementById("heightInput").value = pair[1];
        else if (pair[0] == "Zoom")
          {if (pair[1] == 0) this.origin.zoom = 0.5;}
        else if (pair[0] == "UnitsPerPixel")
        {
          var w = document.getElementById("widthInput").value;
          var h = document.getElementById("heightInput").value;

          var upp = parseFloat(pair[1]);
          var fwidth = w * upp;
          var fheight = h * upp;
          var zoomx = 2.0 / fwidth;
          var zoomy = 2.0 / fheight;

          //alert(upp + "(upp) -> zoom (x,y) = " + zoomx + "," + zoomy);
          this.origin.zoom = zoomx;
          
          //Convert top-left coords into origin coord
          this.origin.re += fwidth * 0.5;
          this.origin.im += fheight * 0.5;
        }
        else if (pair[0] == "AntiAlias")
          this.params["base"]["antialias"].value = 1; //pair[1]; Don't override antialias
        else if (pair[0] == "Rotation")
          this.origin.rotate = pair[1];
        //Selected coords for Julia/Perturb
        else if (pair[0] == "CXstart")
          this.selected.re = parseFloat(pair[1]);
        else if (pair[0] == "CYstart")
          this.selected.im = parseFloat(pair[1]);
        else if (pair[0] == "PaletteRepeat")
          this.params["base"]["outrepeat"].parse(parseFloat(pair[1]));
        else if (pair[0] == "PaletteRepeatIn")
          this.params["base"]["inrepeat"].parse(parseFloat(pair[1]));
        else if (pair[0] == "Outside")
          this.formula['outside_colour'] = convertFormulaName(pair[1]);
        else if (pair[0] == "Inside")
          this.formula['inside_colour'] = convertFormulaName(pair[1]);
        else if (pair[0] == "VariableIterations")
          this.params["base"]["vary"].parse(parseFloat(pair[1]));
        else if (pair[0] == "Power")
          this.params[this.formula["fractal"]]["power"].parse([parseFloat(pair[1]), 0]);
        //Following parameters need to be created rather than just set values
        else if (pair[0] == "Power2")
          this.params[this.formula["fractal"]]["power2"] = new Param([parseFloat(pair[1]), 0.0], "Power 2");
        else if (pair[0] == "function1")
          this.params["fractured"]["function1"] = new Param(pair[1], "Real function");
        else if (pair[0] == "function2")
          this.params["fractured"]["function2"] = new Param(pair[1], "Imag function");
        else if (pair[0] == "op")
          this.params["fractured"]["inductop"] = new Param(pair[1], "Induct op");
        else if (pair[0] == "fnreal")
          saved["fnreal"] = pair[1];
        else if (pair[0] == "fnimag")
          this.params["fractured"]["induct"] = new Param([saved["fnreal"], pair[1]], "Induct");
        else if (pair[0] == "real1" || pair[0] == "param1")
          saved["real1"] = pair[1];
        else if (pair[0] == "imag1" || pair[0] == "param2")
          this.params[this.formula["fractal"]]["param1"] = new Param([saved["real1"], pair[1]], "Param1");
        else if (pair[0] == "real2" || pair[0] == "param3")
          saved["real2"] = pair[1];
        else if (pair[0] == "imag2" || pair[0] == "param4")
          this.params[this.formula["fractal"]]["param2"] = new Param([saved["real2"], pair[1]], "Param2");
        else if (pair[0] == "real3" || pair[0] == "param5")
          saved["real3"] = pair[1];
        else if (pair[0] == "imag3" || pair[0] == "param6")
          this.params[this.formula["fractal"]]["param3"] = new Param([saved["real3"], pair[1]], "Param3");
        else if (pair[0] == "real4")
          saved["real4"] = pair[1];
        else if (pair[0] == "imag4")
          this.params[this.formula["fractal"]]["param4"] = new Param([saved["real4"], pair[1]], "Param4");
        else if (pair[0] == "Init")
          ;
        else if (pair[0] == "Inv")
          if (pair[1] != "0") alert("invert = " + pair[1]);
        else
          //Let the Param parser decide the type
          this.params[this.formula["fractal"]][pair[0]] = new Param(pair[1], pair[0]);
      }
    }

    //To apply functions and ops
    if (this.params["fractured"]) {
    //if (this.params["fractured"]["function1"] || this.params["fractured"]["function2"] ||this.params["fractured"]["op"])

      if (this.params["fractured"]["inductop"]) {
        if (this.params["fractured"]["inductop"].value >= 10) {
          this.params["fractured"]["inductop"].value -= 10;
          this.params["fractured"]["induct"].value.re *= 2.0;  //Double induct
        }
        if (!this.params["fractured"]["induct"]) {
          this.params["fractured"]["induct"] = this.params[this.formula["fractal"]]["param1"];
          this.params["fractured"]["induct"].label = "Induct";
        }
      }
    }

    //Process the palette data
    readPalette(paletteSource);

    //Update parameters
    this.loadParams();
  }


  Fractal.prototype.loadParams = function() {
    //Parse param fields from formula code
    for (key in this.formula)
      this.selectFormula(key, this.formula[key]);

    //Copy params to form fields
    this.copyToForm();
  }

  Fractal.prototype.resetZoom = function() {
    this.origin = new Aspect(0, 0, 0, 0.5); 
    this.copyToForm();
    this.draw();
  }

  //Apply any changes to parameters or formula selections and redraw
  Fractal.prototype.applyChanges = function() {
    //Resize canvas if size settings changed
    var canvas = document.getElementById('fractal-canvas');
    var w = parseFloat(document.getElementById("widthInput").value);
    var h = parseFloat(document.getElementById("heightInput").value);
    if (w != canvas.width || h != canvas.height) {
      canvas.width = w;
      canvas.height = h;
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
      gl.viewportWidth = w;
      gl.viewportHeight = h;
    }

    this.julia = document.inputs.elements["julia"].checked ? 1 : 0;
    this.perturb = document.inputs.elements["perturb"].checked ? 1 : 0;
    this.origin.rotate = parseFloat(document.getElementById("rotate").value);
    this.origin.re = parseFloat(document.getElementById("xPosInput").value);
    this.origin.im = parseFloat(document.getElementById("yPosInput").value);
    this.selected.re = parseFloat(document.getElementById("xSelInput").value);
    this.selected.im = parseFloat(document.getElementById("ySelInput").value);
    this.origin.zoom = parseFloat(document.getElementById("zoomLevel").value);

    //Copy form values to defined parameters
    for (key in this.formula)
      this.params[this.formula[key]].setFromForm();

    //Update shader code & redraw
    this.writeShader();
    this.draw();
  }

  //Update form controls with fractal data
  Fractal.prototype.copyToForm = function() {
    document.inputs.elements["xPosInput"].value = this.origin.re;
    document.inputs.elements["yPosInput"].value = this.origin.im;
    document.inputs.elements["xSelInput"].value = this.selected.re;
    document.inputs.elements["ySelInput"].value = this.selected.im;
    document.inputs.elements["zoomLevel"].value = this.origin.zoom;
    document.inputs.elements["rotate"].value = this.origin.rotate;
    document.inputs.elements["julia"].checked = this.julia;
    document.inputs.elements["perturb"].checked = this.perturb;
    $('fractal_formula').value = this.formula["fractal"];
    $('transform_formula').value = this.formula["transform"];
    $('outside_colour_formula').value = this.formula["outside_colour"];
    $('inside_colour_formula').value = this.formula["inside_colour"];
  }

  //Build and redraw shader from source components
  Fractal.prototype.writeShader = function() {
    //Get formula selections
    consoleWrite("Building fractal shader using:\nformula: " + this.formula["fractal"] + "\ntransform: " + this.formula["transform"] + "\noutside colour: " + this.formula["outside_colour"] + "\ninside colour: " + this.formula["inside_colour"]);

    //Vertex shader
    var vertexShader = sources["shaders/shader2d.vert"];

    //Header for all fractal fragment programs
    var header = sources["shaders/fractal-header.frag"];

    //Code for selected colouring algorithms
    var colourcode = "";
    if (this.formula["outside_colour"] != "none") colourcode += sources["formulae/" + this.formula["outside_colour"] + ".colour.frac"];
    if (this.formula["inside_colour"] != "none" && this.formula["inside_colour"] != this.formula["outside_colour"]) colourcode += sources["formulae/" + this.formula["inside_colour"] + ".colour.frac"];

    //Code for selected formula
    var code = sources["formulae/" + this.formula["fractal"] + ".frac"];

    //Code for selected transform
    var transformcode = this.formula["transform"] == "none" ? "void transform() {}" : sources["formulae/" + this.formula["transform"] + ".transform.frac"];

    //These defines will be generated based on parameters used in loops
    //that must be constants and the colouring methods selected
    var defines = "#define OUTSIDE " + (this.formula["outside_colour"] == "none" ? "false" : "true") + "\n" +  
    "#define INSIDE " + (this.formula["inside_colour"] == "none" ? "false" : "true") + "\n" +  
    "#define INOUT " + (this.formula["inside_colour"] == this.formula["outside_colour"] ? "true" : "false") + "\n" +  
    "\n" + 
    "#define outColour_init " + this.formula["outside_colour"] + "_init\n" +  
    "#define outColour_reset " + this.formula["outside_colour"] + "_reset\n" +  
    "#define outColour_calc " + this.formula["outside_colour"] + "_calc\n" +  
    "#define outColour_result " + this.formula["outside_colour"] + "_result\n" +  
    "\n" + 
    "#define inColour_init " + this.formula["inside_colour"] + "_init\n" +  
    "#define inColour_reset " + this.formula["inside_colour"] + "_reset\n" +  
    "#define inColour_calc " + this.formula["inside_colour"] + "_calc\n" +  
    "#define inColour_result " + this.formula["inside_colour"] + "_result\n" +  
    "\n";

    //Define param constants now we have complete list
    var constants = this.getParamDeclarations();

    //Core code for all fractal fragment programs
    var shader = sources["shaders/fractal-shader.frag"];
    var complex = sources["shaders/complex-math.frag"];

    //Combine header with defines & constant params
    header = header + defines + constants;

    //Use number of newlines for line numbering offset
    lineOffset = header.split("\n").length;

    //Combine into final shader (removing param declarations)
    var fragmentShader = (header + colourcode + transformcode + code + shader + complex).replace(paramreg, "");

    //Save for debugging
    sources["gen-shader.frag"] = fragmentShader;
    ajaxWriteFile("gen-shader.frag", fragmentShader, consoleWrite);

    //Load a default shader setup
    //defaultProgram = initProgram(defaultProgram, getShader(gl, "default-vs"), getShader(gl, "default-fs"));
    //textureProgram(defaultProgram); //Setup as texture program

    currentProgram = initProgram(currentProgram, vertexShader, fragmentShader);
    fractalProgram(currentProgram); //Setup as fractal program
  }

  Fractal.prototype.draw = function() {
    gl.useProgram(currentProgram);

      //Enable this to render frame to texture 
      //gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

    var bg = colours[0].colour.rgbaGL();
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]);

    //if (!fractal.julia) {
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //} else
    //  gl.viewport(50, 50, 200, 200);

    /* This is a test to show transparency bug in webgl:
    gl.clearColor(0.1, 0.1, 0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return;*/

    loadIdentity();

    var canvas = document.getElementById('fractal-canvas');

    //Apply translation to origin, any rotation and scaling (inverse of zoom factor)
    mvTranslate([this.origin.re, this.origin.im, 0])
    mvRotate(this.origin.rotate, [0, 0, -1]);
    //Apply zoom and flip Y to match old coord system
    mvScale([1.0/this.origin.zoom, -1.0/this.origin.zoom, 1.0]);
    //Scaling to preserve fractal aspect ratio
    if (canvas.width > canvas.height)
      mvScale([canvas.width / canvas.height, 1.0, 1.0]);  //Scale width
    else if (canvas.height > canvas.width)
      mvScale([1.0, canvas.height / canvas.width, 1.0]);  //Scale height

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //Uniform variables (julia, background, origin, selected, dims, pixel size)
    gl.uniform1i(currentProgram.juliaUniform, this.julia);
    gl.uniform1i(currentProgram.perturbUniform, this.perturb);
    gl.uniform4fv(currentProgram.backgroundUniform, colours[0].colour.rgbaGL());
    gl.uniform2f(currentProgram.originUniform, this.origin.re, this.origin.im);
    gl.uniform2f(currentProgram.selectedUniform, this.selected.re, this.selected.im);
    gl.uniform2f(currentProgram.dimsUniform, canvas.width, canvas.height);
    gl.uniform1f(currentProgram.pixelsizeUniform, this.origin.pixelSize(canvas));

    //Gradient texture
    gl.bindTexture(gl.TEXTURE_2D, gradientTexture);
    gl.uniform1i(currentProgram.paletteUniform, 0);

    //Rotation & translation matrix
    setMatrixUniforms(currentProgram);

    //Draw!
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);

    return; //Below is to display rendered texture
/*
    //Draw result
    gl.uniform1i(defaultProgram.textureUniform, 0);
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(defaultProgram);

    //Enable texture coord array
    gl.enableVertexAttribArray(defaultProgram.textureCoordAttribute);

    //Re-apply rotation & translation matrix
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    loadIdentity();
    //setMatrixUniforms(defaultProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(defaultProgram.vertexPositionAttribute, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.vertexAttribPointer(defaultProgram.textureCoordAttribute, textureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //Draw rendered texture!
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems);

    gl.disableVertexAttribArray(defaultProgram.textureCoordAttribute);
*/
  }

