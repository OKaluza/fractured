  //Regular expressions
  var paramreg = /@(\w*)\s*=\s*(bool|int|uint|real|float|complex|rgba|list|real_function|complex_function|bailout_function)\((.*)\);\s*(\/\/(.*))?(?:\r\n|[\r\n])/gi;
  var boolreg = /(true|false)/i;
  var listreg = /["'](([^'"|]*\|?)*)["']/i;
  var complexreg = /\(?([-+]?(\d*\.)?\d+)\s*,\s*([-+]?(\d*\.)?\d+)\)?/;

  //Take real, return real
  var realfunctions = ["abs", "acos", "acosh", "asin", "asinh", "atan", "atanh", "cos", "cosh", "exp", "ident", "log", "log10", "neg", "inv", "sin", "sinh", "sqr", "sqrt", "tan", "tanh", "zero"];
  //Take complex, return complex
  var complexfunctions = ["abs", "cacos", "cacosh", "casin", "casinh", "catan", "catanh", "ceil", "conj", "ccos", "ccosh", "cexp", "flip", "floor", "ident", "loge", "neg", "inv", "round", "csin", "csinh", "sqr", "sqrt", "ctan", "ctanh", "trunc", "czero"];
  //Take complex, return real
  var bailfunctions = ["arg", "cabs", "norm", "imag", "manhattan", "real"];
  //atan2=arg, cmag=|z|=norm, recip=inv, log=loge, exp=cexp, all trig fns (sin=csin, cos=ccos, tan=ctan..

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

  function Param(value, type, label) {
    //A parameter object
    //TODO: type param in constructor, declare types rather than detect
    this.type = type;
    this.label = label;
    this.touched = false;
    this.parse(value);
  }

  Param.prototype.parse = function(value) {
    //Parse a value based on type string
    if (this.type == 'bool') {
      this.typeid = -1;
      if (typeof(value) == 'boolean')
        this.value = value;
      if (typeof(value) == 'number')
        this.value = value != 0;
      if (typeof(value) == 'string')
        this.value = (/^true$/i).test(value);
    }

    if (this.type == 'int' || this.type == 'uint') {
      this.typeid = 0;
      if (typeof(value) == 'number')
        this.value = value | 0; //Bitwise ops convert to integers
      if (typeof(value) == 'string')
        this.value = parseInt(value);
    }

    if (this.type == 'float' || this.type == 'real') {
      this.typeid = 1;
      if (typeof(value) == 'number')
        this.value = value;
      if (typeof(value) == 'string')
        this.value = parseFloat(value);
    }

    if (this.type == 'complex') {
      this.typeid = 2;
      if (typeof(value) == 'number')
        this.value = new Complex(value, 0);
      if (typeof(value) == 'object') {
        if (value.length == 2)
          this.value = new Complex(value[0], value[1]);
        else
          this.value = value; //Assume is a Complex already
      }
      if (typeof(value) == 'string') {
        var match = complexreg.exec(value);
        if (match && match[1] && match[3])
          this.value = new Complex(match[1], match[3]);
        else
          this.value = new Complex(parseFloat(value), 0);
      }
    }

    if (this.type == 'real_function') {
      this.typeid = 4;
      this.value = value;
      this.functions = realfunctions;
    }
    if (this.type == 'complex_function') {
      this.typeid = 4;
      this.value = value;
      this.functions = complexfunctions;
    }
    if (this.type == 'bailout_function') {
      this.typeid = 4;
      this.value = value;
      this.functions = bailfunctions;
    }

    if (this.type == 'list') {
      this.typeid = 3;
      var listmatch = listreg.exec(value);
      if (!listmatch) {
        //Assume parsing a selection value into a prefined list
        this.value = value;
      } else {
        //Populate list items...
        //'entry=value|entry=value'
        var num = 0;
        var items = listmatch[1].split("|");
        this.list = {};
        for (var i = 0; i < items.length; i++) {
          var vals = items[i].split("=");
          if (vals[1]) num = parseInt(vals[1]);
          this.list[vals[0]] = num;
          num++;
        }
        this.value = 0; //Initial selection
      }
    }

    if (this.type == 'rgba') {
      this.typeid = 5;
      this.value = new Colour('rgba(' + value + ')');
    }

    //consoleWrite(this.label + " parsed as " + this.type + " value = " + this.value);
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

    if (this.typeid == 1) //real/float
      return realStr(this.value);
    else if (this.typeid == 2) //complex
      return "complex(" + realStr(this.value.re) + "," + realStr(this.value.im) + ")";
    else if (this.typeid == 5) //'rgba'
      return this.value.rgbaGLSL();
    else
      return "" + this.value;
  }

  Param.prototype.declare = function(key) {
    //Return GLSL const declaration for this parameter
    type = this.type;
    if (this.type == 'list') type = 'int';
    if (this.type == 'int' && Math.abs(this.value) > 65535) alert("Integer value out of range +/-65535");
    if (this.type.indexOf('function') > 0) return "#define " + key + "(args) " + this.value + "(args)\n";
    return "const " + type + " " + key + " = " + this.toGLSL() + ";\n";
  }

  Param.prototype.setFromElement = function(key) {
    //Get param value from associated form field
    var field, field_re, field_im;
    if (this.typeid == 2) {
      field_re = document.getElementById(key + "_re");
      field_im = document.getElementById(key + "_im");
      if (!field_re || !field_im) return;
    } else {
      field = document.getElementById(key);
      if (!field) return;
    }
    //if (this.typeid != 2 && !field) {consoleWrite("No field found for: " + key); return;}
    switch (this.typeid)
    {
      case -1: //Boolean = checkbox
        this.value = field.checked;
        break;
      case 0: //Integer = entry
      case 3: //Integer from list
        this.value = parseInt(field.value);
        break;
      case 1: //real = entry
        this.value = parseFloat(field.value);
        break;
      case 2: //complex = 2 x entry
        if (document.getElementById(key + "_re")) {
          this.value.re = parseFloat(field_re.value);
          this.value.im = parseFloat(field_im.value);
        }
        break;
      case 4: //Function name
        this.value = field.value;
        break;
      case 5: //RGBA colour
        this.value = new Colour(field.style.backgroundColor);
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

      var param = new Param(value, type, label);

      //Restore existing value if same type
      if (this[name]) {
        if (this[name].type == type)
          param.value = this[name].value
        else
          consoleWrite("!! Type mismatch: " + this[name].type + " != " + type + " -- " + name + ", discarded: " + value);
        //consoleWrite("Restored value for " + name + " : " + saved);
      }

      this[name] = param;
      //consoleWrite(type + " " + name + " = " + this[name].value + " (" + value + ")");
    };
  }

  //Add fields for all our parameters dynamically to the page
  ParameterSet.prototype.createFields = function(type, name) {
    var field_area = document.getElementById(type + "_params");
    var divider = document.createElement("div");
    divider.className = "divider";
    sectionnames = {"base" : "", "fractal" : "Fractal", "transform" : "Transform", 
                    "outside_colour" : "Outside Colour", "inside_colour" : "Inside Colour"}
    var label = "";
    if (name != "base") {
      label = labels[name];
      divider.appendChild(divider.ownerDocument.createTextNode(sectionnames[type] + ": " + label));
    }

    for (key in this)
    {
      if (typeof(this[key]) != 'object') continue;

      //Prevent creating duplicate fields when same colouring used for in & out
      if (type == "outside_colour" && key.indexOf("_out_") < 0) continue;
      if (type == "inside_colour" && key.indexOf("_in_") < 0) continue;

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

      //Add to row div
      row.appendChild(label);
      row.appendChild(spanin);
      //Add row to area div
      field_area.appendChild(row);

      //Create the input fields
      switch (this[key].typeid)
      {
        case -1: //Boolean
          var input = document.createElement("input");
          input.id = key;
          input.name = key;
          input.type = "checkbox";
          input.checked = this[key].value;
          spanin.appendChild(input);
          break;
        case 0: //Integer
        case 1: //real
          var input = document.createElement("input");
          input.id = key;
          input.name = key;
          input.type = "number";
          input.value = this[key].value;
          spanin.appendChild(input);
          break;
        case 2: //complex (2xreal)
          var input = document.createElement("input");
          input.id = key;
          input.name = key;
          input.id = key + "_re";
          input.name = input.id;
          input.type = "number";
          input.value = this[key].value.re;
          spanin.appendChild(input);
          //Create second field
          input = document.createElement("input");
          input.id = key + "_im";
          input.name = input.id;
          input.type = "number";
          input.value = this[key].value.im;
          spanin.appendChild(input);
          break;
        case 3: 
          //List of integer values (label=value|etc...)
          input = document.createElement("select");
          input.id = key;
          input.name = key;
          for (k in this[key].list)
            input.options[input.options.length] = new Option(k, this[key].list[k]);
          input.value = this[key].value;
          spanin.appendChild(input);
          break;
        case 4: 
          //Drop list of functions
          input = document.createElement("select");
          input.id = key;
          input.name = key;
          for (var i=0; i<this[key].functions.length; i++)
            input.options[input.options.length] = new Option(this[key].functions[i], this[key].functions[i]);
          input.value = this[key].value;
          spanin.appendChild(input);
          break;
        case 5: 
          //Colour picker
          var input = document.createElement("div");
          input.className = "colourbg";
          var cinput = document.createElement("div");
          cinput.className = "colour";
          cinput.id = key;
          cinput.name = key;
          cinput.style.backgroundColor = this[key].value.html();
          input.appendChild(cinput);
          spanin.appendChild(input);
          break;
      }   
    }
  }

  function Fractal() {
    //Construct a new default fractal object
    this.resetDefaults();
  }

  Fractal.prototype.resetDefaults = function() {
    //Default aspect, parameters and formulae:
    this.width = 600;
    this.height = 600;
    this.origin = new Aspect(0, 0, 0, 0.5); 
    this.savePos = this.origin;
    this.selected = new Complex(0, 0);
    this.julia = false;
    this.perturb = false;
    this.compatibility = false;

    this.params = {};
    this.formula = {"base" : "base", "fractal" : "mandelbrot", "transform" : "none",
                    "outside_colour": "default", "inside_colour": "none"};
    //Load parameters for default formula selections
    this.loadParams();
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
    else name = this.formula[type];

    //Delete any existing dynamic form fields
    var element = document.getElementById(type + "_params");
    if (element.hasChildNodes()) {
      while (element.childNodes.length >= 1 )
        element.removeChild(element.firstChild );       
    }

    //Create empty param set if not yet defined
    if (!this.params[name])
      this.params[name] = new ParameterSet();

    if (this.formula[type] != "none") {
      var code = this.getFormulaCode(type);
      //Load the parameter set for selected formula
      this.params[name].parseFormula(code);
      //Update the fields
      this.params[name].createFields(type, name);
    }
  }

  Fractal.prototype.getFormulaCode = function(type) {
    var name = this.formula[type];
    if (name == "same") {
      //Don't load code for this formula, replace with dummy defines
      var defines = "#define inside_colour_init()\n" +
      "#define inside_colour_reset()\n#define inside_colour_calc()\n" + 
      "#define inside_colour_result " + this.formula["outside_colour"] + "_out_result\n";
      return defines;
    }
    var code = "";
    if (name != "none") code = sources[this.formulaFilename(type)];

    //Check code for required functions
    var initreg = /void\s*~?init\(\)/g;
    var resetreg = /void\s*~?reset\(\)/g;
    var runstepreg = /void\s*runstep\(\)/g;
    var bailedreg = /bool\s*bailed\(\)/g;
    var calcreg = /void\s*~calc\(\)/g;
    var resultreg = /rgba\s*~result\(in\s*real\s*repeat\s*\)/g;
    var transformreg = /void\s*transform\(\)/g;

    //Create defines for formula entry points
    code += "\n";
    if (type == "fractal") {
      if (!initreg.exec(code)) code += "#define init()\n";
      if (!resetreg.exec(code)) code += "#define reset()\n";
      if (!runstepreg.exec(code)) code += "#define runstep() z = mul(z,z)+c\n";
      if (!bailedreg.exec(code)) code += "#define bailed() (norm(z) > 4.0)\n";
    } else if (type == "transform") {
      if (!transformreg.exec(code)) code += "#define transform()\n"
    } else {
      code += "#define " + type + "_init" + (initreg.exec(code) ? " ~init\n" : "()\n");
      code += "#define " + type + "_reset" + (resetreg.exec(code) ? " ~reset\n" : "()\n");
      code += "#define " + type + "_calc" + (calcreg.exec(code) ? " ~calc\n" : "()\n");
      code += "#define " + type + "_result" + (resultreg.exec(code) ? " ~result\n" : "(A) background\n");
    }

    //Replace any ~ symbols with formula name and "_"
    //(to prevent namespace clashes in globals/function names/params)
    //If colour formula, use "name_in_" / "name_out_"
    //(~ is reserved but not used in glsl)
    if (type == "inside_colour")
      code = code.replace(/~/g, name + "_in_");
    else if (type == "outside_colour")
      code = code.replace(/~/g, name + "_out_");
    else
      code = code.replace(/~/g, name + "_");

    return code;
  }

  Fractal.prototype.getParamDeclarations = function() {
    var code = ""
    for (key in this.formula)
    {
      if (key == "inside_colour" && this.formula[key] == this.formula["outside_colour"]) continue;
      code += this.params[this.formula[key]].toCode();
    }
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
    readPalette(buffer);
  }

  //Load fractal from file
  Fractal.prototype.load = function(source) {
    //Reset everything...
    this.resetDefaults();
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
    var formulas = {};

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
          var filename = this.formulaFilename(formulas[formula]);
          collect = true;
          buffer = "";
          ////TODO: reenable this to load formula code, disabled for now as formulae are changing frequently
          ////collectDone = function() {sources[filename] = buffer;}
            collectDone = function() {}
        }
        continue;
      }

      if (collect) {
        buffer += lines[i] + "\n";
        continue;
      }this.params["base"]["inrepeat"]
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
          formulas[pair[1]] = pair[0]; //Save for a reverse lookup
        }
      } else if (section.slice(0, 7) == "params.") {
        var pair1 = section.split(".");
        var formula = pair1[1];
        var pair2 = line.split("=");
        if (this.params[formula][pair2[0]])
          this.params[formula][pair2[0]].parse(pair2[1]);
        else //Not defined in formula, skip
          consoleWrite("Skipped param, not declared: " + section + "--- this.params[" + formula + "][" + pair2[0] + "]=" + pair2[1]);

      }
    }

    //Process the palette data
    if (buffer) readPalette(buffer);

    //Select formulae and update parameters
    this.loadParams();
  }

  //Conversion/parser for my old fractal ini files
  Fractal.prototype.iniParser = function(source) {
    //Reset everything...
    this.resetDefaults();
    this.compatibility = true;  //Set compatibility mode
    var saved = {};

    function convertFormulaName(name) {
      //Conversion for my old fractal ini formula descriptors
      if (name == "Mandelbrot") return "mandelbrot";
      if (name == "Nova") return "nova";
      if (name == "Nova BS" || name == "NovaBS") return "novabs";
      if (name == "Burning Ship" || name == "BurningShip") return "burningship";
      if (name == "Magnet1" || name == "MagnetX") return "magnet1";
      if (name == "Magnet2") return "magnet2";
      if (name == "Magnet3") return "magnet3";
      if (name == "Cactus") return "cactus";
      if (name == "Phoenix") return "phoenix";
      if (name == "Stretched") return "stretch";
      if (name == "Gumball") return "gmm";
      if (name == "Quadra") return "quadra";

      //Colour formulae
      if (name == "None") return "none";
      if (name == "Default") return "default";
      if (name == "Smooth") return "smooth";
      if (name == "Smooth 2") return "smooth";
      if (name == "Exp. Smoothing - diverge") return "exp_smooth";
      if (name == "Exp. Smoothing - Xdiverge") return "exp_smooth";
      if (name == "Exp. Smoothing - converge") return "exp_smooth";
      if (name == "Exp. Smoothing - Both") return "exp_smooth";
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
          this.formula["fractal"] = convertFormulaName(pair[1]);
        } else if (pair[0] == "JuliaFlag")
          this.julia = parseInt(pair[1]) ? true : false;
        else if (pair[0] == "PerturbFlag")
          this.perturb = parseInt(pair[1]) ? true : false;
        else if (pair[0] == "Iterations")
          this.params["base"]["iterations"].value = parseInt(pair[1]); 
        else if (pair[0] == "Xstart")
          this.origin.re = parseFloat(pair[1]);
        else if (pair[0] == "Ystart")
          this.origin.im = parseFloat(pair[1]);
        else if (pair[0] == "Width")
          this.width = pair[1];
        else if (pair[0] == "Height")
          this.height = pair[1];
        else if (pair[0] == "Zoom")
          {if (pair[1] == 0) this.origin.zoom = 0.5;}
        else if (pair[0] == "UnitsPerPixel")
        {
          //Old files provide units per pixel and top left coord (already saved in origin)
          var upp = parseFloat(pair[1]);
          var fwidth = this.width * upp;
          var fheight = this.height * upp;
          //Use largest zoom calculated from units per pixel * pixels in each dimension
          var zoomx = 2.0 / fwidth;
          var zoomy = 2.0 / fheight;
          this.origin.zoom = zoomx > zoomy ? zoomx : zoomy;
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
        else if (pair[0] == "Smooth")
          saved["smooth"] = pair[1];
        else if (pair[0] == "PaletteRepeat") {
          //Initially copy to both repeat params
          this.params["base"]["outrepeat"].parse(pair[1]);
          this.params["base"]["inrepeat"].parse(pair[1]);
        }
        else if (pair[0] == "PaletteRepeatIn")
          this.params["base"]["inrepeat"].parse(pair[1]);
        else if (pair[0] == "Outside") {
          saved["outside"] = pair[1];
          this.formula['outside_colour'] = convertFormulaName(pair[1]);
        }
        else if (pair[0] == "Inside") {
          saved["inside"] = pair[1];
          this.formula['inside_colour'] = convertFormulaName(pair[1]);
        }
        else if (pair[0] == "VariableIterations")
          this.params["base"]["vary"].parse(pair[1]);

        //Following parameters need to be created rather than just set values, save for processing later
        else if (pair[0] == "Bailout")
          saved["bailout"] = parseFloat(pair[1]);
        else if (pair[0] == "Power")
          saved["power"] = parseFloat(pair[1]);
        else if (pair[0] == "Power2")
          saved["power2"] = parseFloat(pair[1]);
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
    readPalette(paletteSource);
    
    if (saved["smooth"]) {
      //Really old
      if (parseInt(saved["smooth"]) == 1)
        this.formula["outside_colour"] = "smooth";
      else
        this.formula["outside_colour"] = "default";
    }

    // Load formulae
    this.loadParams();

    //Bailout and power used by most formulae
    if (saved["bailout"])
      this.params[this.formula["fractal"]]["bailout"].parse(saved["bailout"]);
    if (saved["power"])
      this.params[this.formula["fractal"]]["power"].parse(saved["power"]);

    //Formula specific param parsing
    if (this.formula["fractal"] == "magnet1") {
      if (saved["power2"])
        this.params["magnet1"]["power2"].parse(saved["power2"]);
    }

    if (this.formula["fractal"] == "magnet3") {
      this.params["magnet3"]["A"].parse([saved["param1"].re, saved["param1"].im]);
      this.params["magnet3"]["B"].parse([saved["param3"].re, saved["param3"].im]);
      this.params["magnet3"]["C"].parse([saved["param2"].re, saved["param2"].im]);
      this.params["magnet3"]["D"].parse([saved["param3"].re, saved["param3"].im]);
    }

    if (this.formula["fractal"] == "gmm") {
      this.params["gmm"]["A"].parse([saved["param1"].re, saved["param1"].im]);
      this.params["gmm"]["B"].parse([saved["param2"].re, saved["param2"].im]);
      this.params["gmm"]["C"].parse([saved["param3"].re, saved["param3"].im]);
      this.params["gmm"]["D"].parse([saved["param4"].re, saved["param4"].im]);
    }

    if (this.formula["fractal"] == "quadra") {
      this.params["quadra"]["a"].parse([saved["param1"].re, saved["param1"].im]);
      this.params["quadra"]["b"].parse([saved["param2"].re, saved["param2"].im]);
    }

    if (this.formula["fractal"] == "phoenix") {
      if (saved["power2"])
        this.params["phoenix"]["power2"].parse([saved["power2"], 0.0]);
      this.params["phoenix"]["distort"].parse([saved["param1"].re, saved["param1"].im]);
    }

    if (this.formula["fractal"] == "nova") {
      var relax = (saved["param2"] ? saved["param2"] : saved["param1"]);
      this.params["nova"]["relax"].parse([relax.re, relax.im]);
      this.params["nova"]["bailout"].value = 0.00001;
    }

    if (this.formula["fractal"] == "novabs") {
      var relax = (saved["param2"] ? saved["param2"] : saved["param1"]);
      this.params["novabs"]["relax"].parse([relax.re, relax.im]);
      this.params["novabs"]["bailout"].value = 0.00001;
    }

    //Functions and ops
    if (!saved["inductop"]) saved["inductop"] = "0";
    if (saved["re_fn"] > 0 || saved["im_fn"] > 0 || saved["inductop"] > 0) {
      this.selectFormula("transform", "fractured");

      var fns = ["ident", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "trunc", "log", "log10", "sqrt", "flip", "inv", "abs", "ident"];

      this.params["fractured"]["re_fn"].parse(fns[parseInt(saved["re_fn"])]);
      this.params["fractured"]["im_fn"].parse(fns[parseInt(saved["im_fn"])]);

      //Later versions use separate parameter, older used param1:
      if (saved["induct"])
        this.params["fractured"]["induct"].parse([saved["induct"].re, saved["induct"].im]);
      else if (saved["param1"])
        this.params["fractured"]["induct"].parse([saved["param1"].re, saved["param1"].im]);

      this.params["fractured"]["induct_on"].value = saved["inductop"];
      if (this.params["fractured"]["induct_on"].value >= 10) {
        //Double induct, same effect as induct*2
        this.params["fractured"]["induct_on"].value -= 10;
        this.params["fractured"]["induct"].value.re *= 2.0;
        this.params["fractured"]["induct"].value.im *= 2.0;
      }
      if (this.params["fractured"]["induct_on"].value == 1)
        this.params["fractured"]["induct_on"].value = 2;
      if (this.params["fractured"]["induct_on"].value > 1)
        this.params["fractured"]["induct_on"].value = 1;
    }

    //Colour formulae param conversion
    function convertColourParams(type, formula, params) {
      var inout;
      if (type == "outside") inout = "_out_"; else inout = "_in_";

      if (formula[type + "_colour"] == "smooth") {
        var prefix = "smooth" + inout;
        params["smooth"][prefix + "usepower"].value = false;
        params["smooth"][prefix + "type2"].value = false;
        if (saved[type] == "Smooth 2")
          params["smooth"][prefix + "type2"].value = true;
      }

      if (formula[type + "_colour"] == "exp_smooth") {
        var prefix = "exp_smooth" + inout;
        params["exp_smooth"][prefix + "diverge"].value = true;
        params["exp_smooth"][prefix + "converge"].value = false;
        params["exp_smooth"][prefix + "use_zold"].value = false;
        if (saved[type] == "Exp. Smoothing - Xdiverge")
          params["exp_smooth"][prefix + "use_zold"].value = true;
        if (saved[type] == "Exp. Smoothing - converge") {
          params["exp_smooth"][prefix + "diverge"].value = false;
          params["exp_smooth"][prefix + "converge"].value = true;
          params["exp_smooth"][prefix + "use_zold"].value = true;
        }
        if (saved[type] == "Exp. Smoothing - Both") {
          params["exp_smooth"][prefix + "converge"].value = true;
          params["exp_smooth"][prefix + "use_zold"].value = true;
        }
      }

      if (formula[type + "_colour"] == "gaussian_integers") {
        var prefix = "gaussian_integers" + inout;
        params["gaussian_integers"][prefix + "mode"].parse(saved["param2"].re);
        params["gaussian_integers"][prefix + "colourby"].parse(saved["param2"].im);
      }
    }

    convertColourParams("outside", this.formula, this.params);
    convertColourParams("inside", this.formula, this.params);

    //Update parameters to form
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
    this.width = parseInt(document.getElementById("widthInput").value);
    this.height = parseInt(document.getElementById("heightInput").value);
    if (this.width != canvas.width || this.height != canvas.height) {
      canvas.width = this.width;
      canvas.height = this.height;
      canvas.setAttribute("width", this.width);
      canvas.setAttribute("height", this.height);
      gl.viewportWidth = this.width;
      gl.viewportHeight = this.height;
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
    document.inputs.elements["widthInput"].value = this.width;
    document.inputs.elements["heightInput"].value = this.height;
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
    if (this.compatibility) header += "\n#define COMPAT\n";

    //Code for selected formula
    var code = this.getFormulaCode("fractal");

    //Code for selected transform
    var transformcode = this.getFormulaCode("transform");

    //Code for selected colouring algorithms
    var outcolourcode = this.getFormulaCode("outside_colour");
    var incolourcode = this.getFormulaCode("inside_colour");

    //Define param constants now we have complete list
    var constants = this.getParamDeclarations();

    //Core code for all fractal fragment programs
    var shader = sources["shaders/fractal-shader.frag"];
    var complex = sources["shaders/complex-math.frag"];

    //Combine into final shader, saving line offsets
    var fragmentShader = header + constants;
    formulaOffsets["fractal"] = fragmentShader.split("\n").length;
    fragmentShader += code;
    formulaOffsets["transform"] = fragmentShader.split("\n").length;
    fragmentShader += transformcode;
    formulaOffsets["outside_colour"] = fragmentShader.split("\n").length;
    fragmentShader += outcolourcode;
    formulaOffsets["inside_colour"] = fragmentShader.split("\n").length;
    fragmentShader += incolourcode + shader + complex;

    //Remove param declarations, replace with newline to preserve line numbers
    fragmentShader = fragmentShader.replace(paramreg, "//(Param removed)\n");

    //Finally replace any @ symbols used to reference params in code
    fragmentShader = fragmentShader.replace(/@/g, "");

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

