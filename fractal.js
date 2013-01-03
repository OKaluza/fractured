  //Constants
  var WEBGL = 0;
  var WEBCL = 1;
  var WEBCL64 = 2;
  var renderer = WEBGL;
  //Regular expressions
  var paramreg = /(\/\/(.*))?(?:\r\n|[\r\n])(@@?)(\w*)\s*=\s*(bool|int|real|complex|rgba|range|list|real_function|complex_function|bailout_function|expression|define)\(([\S\s]*?)\);/gi;
  var boolreg = /(true|false)/i;
  var rfreg = /(neg|inv|sqr|cube)/g;
  var listreg = /["'](([^'"|]*\|?)*)["']/i;
  var complexreg = /\(?([-+]?(\d*\.)?\d+([eE][+-]?\d+)?)\s*,\s*([-+]?(\d*\.)?\d+([eE][+-]?\d+)?)\)?/;

  //Take real, return real
  var realfunctions = ["", "abs", "acos", "acosh", "asin", "asinh", "atan", "atanh", "cos", "cosh", "exp", "log", "log10", "lnr", "neg", "inv", "sin", "sinh", "sqr", "cube", "sqrt", "tan", "tanh", "zero"];
  //Take complex, return complex (including real functions that work component-wise)
  var complexfunctions = ["", "abs", "acos", "cacos", "cacosh", "asin", "casin", "casinh", "atan", "catan", "catanh", "ceil", "conj", "cos", "ccos", "ccosh", "exp", "cexp", "flip", "floor", "log", "log10", "neg", "inv", "round", "sin", "csin", "csinh", "sqr", "cube", "sqrt", "tan", "ctan", "ctanh", "trunc", "czero", "cln", "clog10", "csqrt"];
  //Take complex, return real
  var bailfunctions = ["arg", "cabs", "norm", "imag", "manhattan", "real"];
  //atan2=arg, cmag=|z|=norm, recip=inv, log=ln, exp=cexp, all trig fns (sin=csin, cos=ccos, tan=ctan..

  var sectionnames = {"fractal" : "Fractal", "pre_transform" : "Pre-transform", "post_transform" : "Post-transform", "outside_colour" : "Outside Colour", "inside_colour" : "Inside Colour", "filter" : "Filter"}

  var savevars = {};
  var fractal_savevars = {};

  /**
   * @constructor
   */
  function Timer() {
    this.time = new Date().getTime();
  }

  Timer.prototype.print = function(action) {
    this.elapsed = new Date().getTime() - this.time;
    print(action + " took: " + (this.elapsed / 1000) + " seconds");
  }

  /**
   * @constructor
   */
  function Aspect(re, im, rotation, zoom) {
    this.re = re;
    this.im = im;
    this.rotate = rotation;
    this.zoom = zoom; 
  }

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

  //Complex number type
  /**
   * @constructor
   */
  function Complex(real, imag) {
    if (typeof(real) == 'string')
      this.re = parseReal(real);
    else
      this.re = real;

    if (typeof(imag) == 'string')
      this.im = parseReal(imag);
    else
      this.im = imag;
  }

  Complex.prototype.toString = function() {
    return "(" + this.re + "," + this.im + ")";
  }

  function parseComplex(value) {
    //Parse string as complex number
    var match = complexreg.exec(value);
    if (match && match[1] && match[4]) {
      return new Complex(parseReal(match[1]), parseReal(match[4]));
    } else {
      return new Complex(parseReal(value), 0);
    }
  }

  function parseReal(value, invalid_default) {
    //Parse string as real number, uses parseFloat but always returns a valid 
    //number (empty/invalid returns 0)
    var n = parseFloat(value);
    //Check is number
    if (!isNaN(n) && isFinite(n)) return n;
    //Return zero or default if provided
    return invalid_default == undefined ? 0.0 : invalid_default;
  }

  function parseExpressions(code) {
    //Parse all \...\ enclosed sections as expressions
    var reg = /\\([\s\S]*?)\\/gm;
    var match;
    while (match = reg.exec(code)) {
      //Replace the matched expression with parser result
      var newval = code.slice(0, reg.lastIndex - match[0].length);
      var result = parseExpression(match[1]);
      //debug(match[1] + " -> "  + result);
      code = newval + result + code.slice(reg.lastIndex, code.length);
      reg.lastIndex += (result - match[0].length); //Adjust search position
    }
    return code;
  }

  function parseExpression(expr) {
    //Optimisation: 
    //find all variables in expression and if found in param list, replace with their value
    //(requires savevars[] array created when parsing parameters in toCode())
    var reg = /@?([_a-zA-Z][_a-zA-Z0-9]*)/g;
    var match;
    while (match = reg.exec(expr)) {
      var key = match[1];
      var found = savevars[key];
      if (found == undefined) found = fractal_savevars[key];
      if (found != undefined) {
        //Replace the matched param with value
        var newval = expr.slice(0, reg.lastIndex - match[0].length);
        expr = newval + found + expr.slice(reg.lastIndex, expr.length);
        //Removed adjustment as calc slightly out and not neccessary to adjust position
        //reg.lastIndex += (found - match[0].length); //Adjust search position
      }
    }

    //Parse an expression into correct complex maths functions using the Jison parser
    var parsed;
    //parser.yy = fractal;
    //Run the parser and report errors
    try {
      parsed = parser.parse(expr + ""); //Ensure passed a string
    } catch(e) {
      alert('Error parsing expression: "' + expr + '"\n : ' + e.message);
      return "(0,0)"
    }
    return parsed;
  }

  /**
   * @constructor
   */
  function Param(value, type, label, uniform) {
    //A parameter object
    this.type = type;
    this.label = label;
    this.touched = false;
    this.parse(value);
    this.uniform = (uniform == true);
  }

  Param.prototype.parse = function(value) {
    //Parse a value based on type string
    switch (this.type) {
      case 'bool':
        this.typeid = -1;
        if (typeof(value) == 'boolean')
          this.value = value;
        if (typeof(value) == 'number')
          this.value = value != 0;
        if (typeof(value) == 'string')
          this.value = (/^true$/i).test(value);
        break;
      case 'int':
        this.typeid = 0;
        if (typeof(value) == 'number')
          this.value = value | 0; //Bitwise ops convert to integers
        if (typeof(value) == 'string')
          this.value = parseInt(value);
        break;
      case 'real':
        this.typeid = 1;
        if (typeof(value) == 'number')
          this.value = value;
        if (typeof(value) == 'string') {
          this.value = parseReal(value);
          if (isNaN(this.value))  //Attempt to parse as complex and take real component
            this.value = parseComplex(value).re;
        }
        break;
      case 'complex':
        this.typeid = 2;
        if (typeof(value) == 'number')
          this.value = new Complex(value, 0);
        if (typeof(value) == 'object') {
          if (value.length == 2)
            this.value = new Complex(value[0], value[1]);
          else
            this.value = value; //Assume is a Complex already
        }
        if (typeof(value) == 'string')
          this.value = parseComplex(value);
        break;
      case 'real_function':
        this.typeid = 4;
        this.value = value;
        this.functions = realfunctions;
        break;
      case 'complex_function':
        this.typeid = 4;
        this.value = value;
        this.functions = complexfunctions;
        break;
      case 'bailout_function':
        this.typeid = 4;
        this.value = value;
        this.functions = bailfunctions;
        break;
      case 'list':
        this.typeid = 3;
        var listmatch = listreg.exec(value);
        if (!listmatch) {
          //Assume parsing a selection value into a prefined list
          this.value = value;
        } else {
          //Populate list items...'entry=value|entry=value'
          var num = 0;
          var items = listmatch[1].split("|");
          this.list = {};
          for (var i = 0; i < items.length; i++) {
            var vals = items[i].split("=");
            if (vals[1]) num = parseInt(vals[1]);
            this.list[vals[0]] = num;
            num++;
          }
          this.value = 0; //Initial selection is first item
        }
        break;
      case 'rgba':
        this.typeid = 5;
        if (value.indexOf('rgba') < 0) value = 'rgba(' + value + ')';
        this.value = new Colour(value);
        break;
      case 'expression':
        this.typeid = 6;
        this.value = value;
        break;
      case 'define':
        //Similar to list but #define instead of assigning numeric value of list index
        this.typeid = 7;
        var listmatch = listreg.exec(value);
        if (!listmatch) {
          //????Assume parsing a selection value into a prefined list
          this.value = value;
        } else {
          //Populate list items...'entry=value|entry=value'
          var items = listmatch[1].split("|");
          this.list = [];
          for (var i = 0; i < items.length; i++) {
            this.list.push(items[i]);
          }
          this.value = items[0]; //Initial selection is first item
        }
        break;
      case 'range':
        this.typeid = 8;
        //value,min,max,step
        var num = 0;
        var items = value.split(",");
        this.value = 0.0;
        this.min = 0.0;
        this.max = 1.0;
        this.step = 0.05;
        if (items.length > 0) this.value = parseReal(items[0]);
        if (items.length > 1) this.min = parseReal(items[1]);
        if (items.length > 2) this.max = parseReal(items[2]);
        if (items.length > 3) this.step = parseReal(items[3]);
        break;

    }
    //debug(this.label + " parsed as " + this.type + " value = " + this.value);
  }

  Param.prototype.declare = function(key) {
    //Return GLSL const/uniform declaration for this parameter
    var comment = this.label ? "//" + this.label + "\n" : "";
    var declaration = "";
    key = '@' + key;
    type = this.type;

    switch (this.typeid)
    {
      case 3: //Integer list
        type = "int";
      case 0: //Integer
        if (Math.abs(this.value) > 65535) alert("Integer value out of range +/-65535");
      case -1: //Boolean
        declaration =  "const " + type + " " + key + " = " + this.value + ";\n";
        break;
      case 8: //range
        type = "real";
      case 1: //real
        strval = "" + this.value;
        //Add .0 if integer, unless in scientific notation
        if (strval.split('.')[1] == undefined && strval.indexOf('e') < 0)
          strval += ".0";
        declaration = "const " + type + " " + key + " = " + strval + ";\n";
        break;
      case 2: //complex
        //return "complex(" + realStr(this.value.re) + "," + realStr(this.value.im) + ")";
        declaration = "const " + type + " " + key + " = complex(" + this.value.re + "," + this.value.im + ");\n";
        break;
      case 4: //Function name
        if (type == 'real_function' && rfreg.test(this.value))
          declaration = "#define " + key + "(args) _" + this.value + "(args)\n";
        else
          declaration = "#define " + key + "(args) " + this.value + "(args)\n";
        break;
      case 5: //RGBA colour
        declaration = "const " + type + " " + key + " = " + this.value.rgbaGLSL() + ";\n";
        break;
      case 6: //Expression
        declaration = "#define " + key + " " + parseExpression(this.value) + "\n";
        break;
      case 7: //Define list
        declaration = "#define " + key + " " + this.value + "\n";
        break;
    }

    if (this.uniform) {
      //WebCL: "uniforms' passed in input[] array
      if (renderer > WEBGL && fractal.webcl)
        declaration = fractal.webcl.setInput(this, type, key);
      else
        declaration = "uniform " + type + " " + key + ";\n";
    }
    return comment + declaration;
  }

  Param.prototype.setFromElement = function() {
    //Get param value from associated form field
    if (!this.input) return;
    switch (this.typeid)
    {
      case -1: //Boolean = checkbox
        this.value = this.input.checked;
        break;
      case 0: //Integer = entry
      case 3: //Integer from list
        if (this.input.value == "") this.input.value = 0;
        this.value = parseInt(this.input.value);
        break;
      case 1: //real = entry
      case 8: //range = range entry
        this.value = parseReal(this.input.value);
        break;
      case 2: //complex = 2 x entry
        this.value.re = parseReal(this.input[0].value);
        this.value.im = parseReal(this.input[1].value);
        break;
      case 4: //Function name
      case 7: //Define list
        this.value = this.input.value.trim();
        break;
      case 6: //Expression
        if (this.input.editor)
          this.value = this.input.editor.getValue();
        else
          this.value = this.input.value.trim();
        break;
      case 5: //RGBA colour
        this.value = new Colour(this.input.style.backgroundColor);
        break;
    }
  }

  Param.prototype.copyToElement = function() {
    //Copy param value to associated form field
    if (!this.input) return;
    switch (this.typeid)
    {
      case -1: //Boolean = checkbox
        this.input.checked = this.value;
        break;
      case 0: //Integer = entry
      case 1: //real = entry
      case 3: //Integer from list
      case 4: //Function name
      case 7: //Define list
      case 8: //range = range entry
        this.input.value = this.value;
        break;
      case 2: //complex = 2 x entry
        this.input[0].value = this.value.re;
        this.input[1].value = this.value.im;
        break;
      case 6: //Expression
        if (this.input.editor)
          this.input.editor.setValue(this.value);
        else
          this.value = this.input.value = this.value;
        break;
      case 5: //RGBA colour
        this.input.style.backgroundColor = this.value.html();
        break;
    }
  }


  /**
   * @constructor
   */
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
        this[key].setFromElement();
    }
  }

  ParameterSet.prototype.toCode = function() {
    //Return GLSL code defining parameters
    var code = "";
    //First scan and save real/complex params for replacement when parsing expressions
    savevars = {};
    for (key in this) {
      if (this[key].type == 'real') savevars[key] = this[key].value;
      if (this[key].type == 'complex') {
        if (this[key].value.im == 0)
          savevars[key] = this[key].value.re;
        else
          savevars[key] = this[key].value.toString();
      }
    }
    //Generate the declaration
    for (key in this)
    {
      if (typeof(this[key]) == 'object') {
        //debug(key + " = " + this[key].value);
        code += this[key].declare(key);
      }
    }
    return code;
  }

  ParameterSet.prototype.getField = function(id) {
    //Check if a field is created by this parameter set
    var field = $(id);
    for (key in this)
    {
      if (typeof(this[key]) == 'object') {
        if (this[key].input == field) return this[key];
        if (typeof(this[key].input) == 'object') {
          if (this[key].input[0] == field) return this[key];
          if (this[key].input[1] == field) return this[key];
        }
      }
    }
    return null;
  }

  //Read our parameter definitions from provided formula source
  ParameterSet.prototype.parseFormula = function(source) {
    var match;
    while (match = paramreg.exec(source)) {
      //Label/comment (optional)
      //@name = type(value);
      var label = match[2] ? match[2] : match[4];
      var uniform = match[3].length == 2; //@@ == uniform param
      var name = match[4];
      var type = match[5];
      var value = match[6];

      this[name] = new Param(value, type, label, uniform);
    };
  }

  //Copy existing values from previous parameter set to new one
  ParameterSet.prototype.restoreValues = function(other, defaults) {
    if (!other) return;
    for (key in this)
    {
      if (typeof(this[key]) != 'object') continue;

      var temp = this[key].value;
      if (other[key]) {
        if (this[key].type == other[key].type) {
          //Replace original value only when changed from default
          //This means if parameter is edited, changing the formula default will not change its value
          //But if it is still the default, it will be updated to the new default
          if (!defaults[key] || other[key].value != defaults[key].value) {
            this[key].value = other[key].value
            //debug("Restored value for " + key + " : " + temp + " ==> " + this[key].value);
          }
        } else
          //If we changed a parameter type then value can't and shouldn't be restored
          debug("Parameter type changed: " + this[key].type + " != " + other[key].type + 
                       " -- " + key + ", value discarded: " + other[key].value);
      }

      //Save the new default value
      if (defaults[key])
        defaults[key].value = temp;
      else
        print("!No defaults entry for [" + key + "] to save value: " + temp);
    }
  }

  //Add fields for all our parameters dynamically to the page
  ParameterSet.prototype.createFields = function(category, name) {
    //Now processed whenever showPanel called and only displays fields in active panel
    switch (category) {
      case "fractal":
      case "pre_transform":
      case "post_transform":
        if (selectedTab != $('tab_formula')) return;
        break;
      case "inside_colour":
      case "outside_colour":
      case "filter":
        if (selectedTab != $('tab_colour')) return;
        break;
    }
    var field_area = $(category + "_params");
    var divider = document.createElement("div");
    divider.className = "divider";
    var label = "";
    if (sectionnames[category]) {
      var key = formulaKey(category, name);
      if (!formula_list[key]) {
        //Formula from fractal has been deleted and attempting to select...
        alert("Formula does not exist!: " + category + " --> " + name);
        return;
      }
      label = formula_list[key].label;
      //label = formula_list[formulaKey(category, name)].label;
      var divlabel = document.createElement("span");
      divlabel.className = "divider-label";
      divlabel.appendChild(divlabel.ownerDocument.createTextNode(sectionnames[category] + ": " + label));
      divider.appendChild(divlabel);
    }
    field_area.appendChild(divider);

    for (key in this)
    {
      if (typeof(this[key]) != 'object') continue;

      var row = document.createElement("div");
      row.className = "row";

      //Get label (if none provided, use field name)
      var fieldlabel = this[key].label ? this[key].label : key;
      var label = document.createElement("label");
      label.appendChild(label.ownerDocument.createTextNode(fieldlabel));

      var spanin = document.createElement("span");
      spanin.className = "field";

      //Add to row div
      row.appendChild(label);
      row.appendChild(spanin);
      //Add row to area div
      field_area.appendChild(row);

      //Create the input fields
      this[key].input = null;
      var input;
      var onchange = "fractal.applyChanges();"
      switch (this[key].typeid)
      {
        case -1: //Boolean
          input = document.createElement("input");
          input.id = category + '_' + key;
          input.type = "checkbox";
          input.checked = this[key].value;
          spanin.appendChild(input);
          //Checkbox label associate
          label.setAttribute("for", category + '_' + key);
          break;
        case 0: //Integer
        case 1: //real
        case 8: //range
          input = document.createElement("input");
          input.id = category + '_' + key;
          input.type = "number";
          input.value = this[key].value;
          spanin.appendChild(input);
          if (this[key].typeid == 1) input.setAttribute("step", 0.1);
          if (this[key].typeid == 8) {
            input.type = "range";
            input.setAttribute("min", this[key].min);
            input.setAttribute("max", this[key].max);
            input.setAttribute("step", this[key].step);
            input.numval = document.createElement("span");
            input.numval.innerHTML = parseReal(this[key].value).toFixed(2);
            onchange = "this.numval.innerHTML = parseReal(this.value).toFixed(2);" + onchange;
            input.setAttribute("onchange", onchange);
            spanin.appendChild(input.numval);
          }
          break;
        case 2: //complex (2xreal)
          input = [null, null];
          input[0] = document.createElement("input");
          input[0].type = "number";
          input[0].id = category + '_' + key + '_0';
          input[0].setAttribute("step", 0.1);
          input[0].value = this[key].value.re;
          spanin.appendChild(input[0]);
          //Create second field
          input[1] = document.createElement("input");
          input[1].type = "number";
          input[1].id = category + '_' + key + '_1';
          input[1].setAttribute("step", 0.1);
          input[1].value = this[key].value.im;
          spanin.appendChild(input[1]);
          break;
        case 3: 
          //List of integer values (label=value|etc...)
          input = document.createElement("select");
          for (k in this[key].list)
            input.options[input.options.length] = new Option(k, this[key].list[k]);
          input.value = this[key].value;
          spanin.appendChild(input);
          break;
        case 4: 
          //Drop list of functions
          input = document.createElement("select");
          for (var i=0; i<this[key].functions.length; i++)
            input.options[input.options.length] = new Option(this[key].functions[i], this[key].functions[i]);
          input.value = this[key].value;
          spanin.appendChild(input);
          break;
        case 5: 
          //Colour picker
          input = document.createElement("div");
          input.className = "colourbg";
          var cinput = document.createElement("div");
          cinput.className = "colour";
          cinput.style.backgroundColor = this[key].value.html();
          input.appendChild(cinput);
          spanin.appendChild(input);
          input = cinput; //Use inner div as input element
          break;
        case 6: 
          //Expression
          input = document.createElement("textarea");
          input.value = this[key].value;
          input.setAttribute("spellcheck", false);
          spanin.appendChild(input);
          if (typeof CodeMirror == 'function') {
            input.editor = new CodeMirror.fromTextArea(input, {
              mode: "text/x-glsl",
              theme: "fracturedlight",
              indentUnit: 2,
              tabSize: 2,
              matchBrackets: true,
              lineWrapping: true
            });
          }
          break;
        case 7: 
          //List of literal values (val1|val2 etc...)
          input = document.createElement("select");
          for (k in this[key].list)
            input.options[input.options.length] = new Option(this[key].list[k]);
          input.value = this[key].value;
          spanin.appendChild(input);
          break;
      }
      //Instant update for uniform values...
      if (this[key].uniform) {
        if (this[key].typeid == 2) {
          input[0].setAttribute("onchange", onchange);
          input[1].setAttribute("onchange", onchange);
        } else
          input.setAttribute("onchange", onchange);
      }
      //Save the field element
      this[key].input = input;
    }
  }

  //Set field values as uniforms
  ParameterSet.prototype.setUniforms = function(gl, program, category) {
    for (key in this)
    {
      if (typeof(this[key]) != 'object') continue;
      if (!this[key].uniform) continue;

      var uniform = gl.getUniformLocation(program, category + "_" + key);

      switch (this[key].typeid)
      {
        case 0: //Integer
          gl.uniform1i(uniform, this[key].value);
          break;
        case 1: //real
        case 8: //range
          gl.uniform1f(uniform, this[key].value);
          break;
        case 2: //complex (2xreal)
          gl.uniform2f(uniform, this[key].value.re, this[key].value.im);
          break;
        default:
          alert("Error: can't create uniform parameter except for int/real/complex types");
      }
    }
  }


  //Contains a formula selection and its parameter set
  /**
   * @constructor
   */
  function Formula(category) {
    this.category = category;
    this.params = {};
    this.defaultparams = {};
    this.lineoffsets = {};
    this.reselect();
  }

  Formula.prototype.exists = function(value) {
    //Check a formula name is a valid selection
    var sel = $(this.category + '_formula');
    sel.value = value;
    return sel.value == value;
  }

  Formula.prototype.reselect = function(idx) {
    //Select, by index from select control if present and idx provided
    var sel = $(this.category + '_formula');
    var name = 'default';
    //Formula categories may have a select element, in which case use it
    if (sel) {
      if (idx != undefined)
        sel.selectedIndex = idx;
      //TODO: BETTER ERROR HANDLING: This means a formula that is no longer present was selected
      if (sel.selectedIndex < 0) {alert(this.category + " : Invalid selection!"); return;}
      name = sel.options[sel.selectedIndex].value;
    }
    this.select(name);
  }

  Formula.prototype.select = function(name) {
    //Formula selected, parse it's parameters
    if (name) this.selected = name;
    else name = this.selected;  //Re-selecting current
    //debug("Selecting " + name + " for " + this.category + "_params");

    //Delete any existing dynamic form fields
    var element = $(this.category + "_params");
    if (!element) alert("Element is null! " + this.category + " - " + name);
    removeChildren(element);

    //Save existing param set
    var oldparams = this.params[name];

    //Create new empty param set
    this.params[name] = new ParameterSet();
    //Save a reference to active parameters
    this.currentParams = this.params[name];

    var code = this.getSource();
    if (code.length > 0) {
      //Copy the default params if not yet set
      if (!this.defaultparams[name]) {
        this.defaultparams[name] = new ParameterSet();
        this.defaultparams[name].parseFormula(code);
      }

      //Load the parameter set for selected formula
      this.params[name].parseFormula(code);
      //Copy previous values
      this.params[name].restoreValues(oldparams, this.defaultparams[name]);
      //Update the fields
      this.params[name].createFields(this.category, name);
    }
    //debug("Set [" + this.category + "] formula to [" + this.selected + "]"); // + " =====> " + this.currentParams.toString());
       //consoleTrace();
  }

  Formula.prototype.getkey = function() {
    return formulaKey(this.category, this.selected);
  }

  Formula.prototype.getSource = function() {
    //if (this.selected == "none") return "";
    if (this.selected == "none" || this.selected == "same") return "";
    var key = this.getkey();
    if (!key) return "";
    if (formula_list[key]) {
      //TEMPORARY HACK FOR OLD ESCAPE/CONVERGE TESTS and LOGE == LN
      var source = formula_list[key].source.replace(/if \((.*)\) break;/g, "converged = ($1);");
      var source = source.replace("loge", "ln");
      if (source != formula_list[key].source) {
        formula_list[key].source = source;
        alert(source);
      }
      return formula_list[key].source;
    }
    print("Formula Missing! No entry found for: " + key);
    return "";
  }

  Formula.prototype.getCodeSections = function() {
    var code = this.getSource();
    var section = "data";
    var sections = {"init" : "", "reset" : "", "znext" : "", "escaped" : "", "converged" : "", "calc" : "", "result" : "", "transform" : "", "filter" : ""};
    var match;
    var lastIdx = 0;
    var reg = /^([a-z]+):/gm;

    this.lineoffsets = {};

    //Get section blocks by finding start labels:
    while (match = reg.exec(code)) {
      //Save the previous section
      sections[section] = code.slice(lastIdx, reg.lastIndex - match[0].length - 1);
      this.lineoffsets[section] = code.slice(0, lastIdx).split("\n").length +1;
      lastIdx = reg.lastIndex;
      section = match[1]; //match[0].substr(0, match[0].length-1);
    }
    //Save the final section
    sections[section] = code.slice(lastIdx);
    this.lineoffsets[section] = code.slice(0, lastIdx).split("\n").length +1;

    //Defaults for missing sections
    if (this.category == "fractal") {
      //If use znext expression if found, otherwise use function, define default if not found
      if (sections["znext"].length == 0) {
        if (this.currentParams["znext"])
          sections["znext"] = "\n  z = @znext;\n";
        else
          sections["znext"] = "\n  z = sqr(z)+c;\n";
      }

      var converged_defined = true;
      //Converged flag for use in code
      if (sections["converged"].length == 0) {
        //No converged: section defined
        if (this.currentParams["converged"]) {
          //Have a converged parameter
          sections["converged"] += "\nconverged = (@converged);\n";
        } else if (!this.currentParams["converge"]) {
          //No converge limit defined
          converged_defined = false;
        } else {
          //Numeric converge param only, insert default test
          sections["converged"] += "\nconverged = (@bailtest(z) < @converge);\n";
        }
      }

      //Escaped flag for use in code
      if (sections["escaped"].length == 0) {
        //No escaped: section defined
        if (this.currentParams["escaped"]) {
          //Have an escaped parameter
          sections["escaped"] += "\nescaped = (@escaped);\n";
        } else if (!this.currentParams["escape"]) {
          //No escape limit defined, if no converge defined either, create a default bailout
          if (!converged_defined) {
            sections["escaped"] += "\nescaped = (@bailtest(z) > escape);\n";
          }
        } else {
          //Numeric escape param only, insert default test
          sections["escaped"] += "\nescaped = (@bailtest(z) > @escape);\n";
        }
      }

      //Append extra data definitions
      if (!this.currentParams["escape"]) sections["data"] += "\n#define escape 4.0\n";
      if (!this.currentParams["bailtest"]) sections["data"] += "\n#define @bailtest norm\n";

    } else if (this.category.indexOf("colour") > -1) {
      //Default colour result
      if (sections["result"].length == 0)
        sections["result"] = "\n  colour = background;\n";

      //Same colouring, always use the outside result...
      if (this.selected == "same")
        sections["calc"] = "\n  if (i==limit-1) escaped = true;\n";
    }

    return sections;
  }

  Formula.prototype.getParsedFormula = function() {
    //Get formula definition
    var sections = this.getCodeSections();
    var data = sections["data"];

    //Get block of param declarations by finding first and last match index
    var match;
    var firstIdx = -1;
    var lastIdx = 0;
    while (match = paramreg.exec(data)) {
      if (firstIdx < 0) firstIdx = paramreg.lastIndex - match[0].length;
      lastIdx = paramreg.lastIndex;
    }

    //Get the parameter declaration code
    //(This also saves values of parameters in savevars[] array)
    var params = this.currentParams.toCode();
    if (this.category == "fractal") fractal_savevars = savevars;

    //Strip out param definitions, replace with declarations
    var head = firstIdx >= 0 ? data.slice(0, firstIdx) : "";
    var body = data.slice(lastIdx, data.length);
    //alert(this.catageory + " -- " + firstIdx + "," + lastIdx + " ==>\n" + head + "===========\n" + body);
    data = head + params.slice(0, params.length-1) + body;

    //Parse any /expression/s and @params
    //Replace @ symbols with formula type and "_"
    //(to prevent namespace clashes in globals/function names/params)
    sections["data"] = data.replace(/:([a-zA-Z_])/g, "$1"); //Strip ":", now using @ only
    for (key in sections) {
      //sections[key] = sections[key].replace(/:([a-zA-Z_])/g, "$1"); //Strip ":", now using @ only
      sections[key] = parseExpressions(sections[key]);
      sections[key] = sections[key].replace(/@([a-zA-Z_])/g, this.category + "_$1");
    }

    //return code;
    return sections;
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
  function Fractal(parentid, mode, antialias) {
    //Construct a new default fractal object

    this.setRenderer(parentid, mode);

    //Set canvas size
    this.sizeCanvas();

    this.antialias = antialias;
    this.preview = null;

    this.offsets = [];

    this.resetDefaults();
    this.copyToForm();
  }

  Fractal.prototype.setRenderer = function(parentid, mode) {
    //Create new canvas
    this.canvas = document.createElement("canvas");
    this.canvas.id = "fractal-canvas"
    this.canvas.mouse = new Mouse(this.canvas, this);
    this.canvas.mouse.setDefault();

    //Remove existing canvas if any
    var pelement = $(parentid)
    var ccanvas = $("fractal-canvas");
    if (ccanvas) pelement.removeChild(ccanvas);
    pelement.appendChild(this.canvas);

    //Render mode, If not set, use WebCL if available
    renderer = mode;
    if (renderer == undefined) renderer = WEBCL;
    if (window.WebCL == undefined) {
      if (mode > WEBGL) popup("Sorry, Nokia WebCL plugin not found, try <a href='http://webcl.nokiaresearch.com/'>webcl.nokiaresearch.com</a> for more information");
      renderer = WEBGL;
      $("webcl").disabled = true;
      $("fp64").disabled = true;
    }

    if (renderer >= WEBCL) {
      //Init WebCL
      this.webclInit();
      this.webgl = null;
    }

    if (renderer == WEBGL) {
      //Init WebGL
      if (!window.WebGLRenderingContext) {
        popup("Sorry, WebGL support not detected, try <a href='http://get.webgl.org'>http://get.webgl.org</a> for more information");
      } else {
        this.webgl = new WebGL(this.canvas);
        if (this.webgl.errors) {
          popup("Error initialising WebGL (" + this.webgl.errors + "), try <a href='http://get.webgl.org/troubleshooting'>http://get.webgl.org/troubleshooting</a> for more information");
          this.webgl = null;
        } else {
          this.gl = this.webgl.gl;
          this.webgl.init2dBuffers();
          setAll('none', 'webcl');  //hide CL menu options
        }
      }
    }
  }

  Fractal.prototype.webclInit = function(pfid, devid) {
    if (this.webcl && pfid == undefined)
      this.webcl = new WebCL_(this.webcl.pid, this.webcl.devid);  //Use existing settings
    else
      this.webcl = new WebCL_(pfid, devid);

    if (!this.webcl) {
      popup("Error creating WebCL context, attempting fallback to WebGL...");
      renderer = WEBGL;
      return;
    }

    if (renderer > WEBCL && !this.webcl.fp64) {
      popup("Sorry, the <b><i>cl_khr_fp64</i></b> or the <b><i>cl_amd_fp64</i></b> extension is required for double precision support in WebCL");
      renderer = WEBCL;
    }

    $("fp64").disabled = !this.webcl.fp64;
    debug(this.webcl.pid + " : " + this.webcl.devid + " --> " + this.canvas.width + "," + this.canvas.height);
    this.webcl.init(this.canvas, renderer > WEBCL, 8);
    this.webclMenu();
  }

  Fractal.prototype.webclMenu = function() {
    setAll('block', 'webcl');  //show menu options
    //Clear & repopulate list
    var menu = $('platforms');
    removeChildren(menu);
    for (var p=0; p<this.webcl.platforms.length; p++) {
      var plat = this.webcl.platforms[p];
      var pfname = plat.getPlatformInfo(WebCL.CL_PLATFORM_NAME);
      var devices = plat.getDevices(WebCL.CL_DEVICE_TYPE_ALL);
      for (var d=0; d < devices.length; d++, i++) {
        var name = pfname + " : " + devices[d].getDeviceInfo(WebCL.CL_DEVICE_NAME);
        var onclick = "fractal.webclSet(" + p + "," + d + ");";
        var item = addMenuItem(menu, name, onclick);
        if (p == this.webcl.pid && d == this.webcl.devid) selectMenuItem(item);
      }
    }
    checkMenuHasItems(menu);
  }

  Fractal.prototype.webclSet = function(pfid, devid) {
    //Init with new selection
    this.webclInit(pfid, devid);

    //Redraw if updating
    if (sources["generated.shader"]) {
      //Invalidate shader cache
      sources["generated.shader"] = '';
      this.applyChanges();
    }
  }

  Fractal.prototype.precision = function(val) {
    if (renderer > WEBGL && this.webcl.fp64) return val.toFixed(15);
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
    this.position = new Aspect(0.0, 0, 0, 0.5); 
    this.savePos = new Aspect(0.0, 0, 0, 0.5);
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
      if (formula_list[key].source.strip() == source.strip()) return;

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
    var key = formulaKey(select, sel.options[sel.selectedIndex].value);
    if (!key) return;
    var label = formula_list[key].label;
    if (!label || !confirm('Really delete the "' + label + '" formula?')) return;
    delete formula_list[key];
    //Select previous
    sel.selectedIndex--;
    saveSelections(); //Update formula selections into selected variable
    updateFormulaLists();
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
    var code = "[fractal]\n";
    if (!document["inputs"].elements["autosize"].checked) {
      //Only write width & height if autosize disabled
      code += "width=" + this.canvas.width + "\n" +
              "height=" + this.canvas.height + "\n";
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
        if (category=="inside_colour" && this.choices["outside_colour"].selected == this.choices["inside_colour"].selected) break;
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
  Fractal.prototype.load = function(source, noapply) {
    //debug("load<hr>");
    //Reset everything...
    this.resetDefaults();
    this.formulaDefaults();
    //1. Load fixed params as key=value: origin, selected, julia, 
    //2. Load selected formula names
    //3. Load code for each selected formula
    //4. For each formula, load formula params into params[formula]
    //5. Load palette
    /*/Name change fixes... TODO: resave or run a sed script on all existing saved fractals then can remove these lines
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
    source = source.replace(/^bailoutc=/gm, "converge=");*/
      var saved = {}; //Another patch addition, remove once all converted
        //Strip leading : from old data
            source = source.replace(/:([a-zA-Z_])/g, "$1"); //Strip ":", now using @ only

    var lines = source.split("\n"); // split on newlines
    var section = "";
    var curparam = null;

    //var formulas = {};

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
      if (section == "params.base") section = "fractal";  //Base params fix temporary hack

      if (section == "fractal") {
        //parse into attrib=value pairs
        var pair = line.split("=");

        //Process ini format params
        if (pair[0] == "width" || pair[0] == "height" || pair[0] == "iterations")
          this[pair[0]] = parseInt(pair[1]);
        else if (pair[0] == "zoom" || pair[0] == "rotate")
          this.position[pair[0]] = parseReal(pair[1]);
        else if (pair[0] == "origin" || pair[0] == "selected") {
          var c = parseComplex(pair[1]);
          var key = pair[0];
          if (pair[0] == "origin") key = "position";
          this[key].re = c.re;
          this[key].im = c.im;
        } else if (pair[0] == "julia")
          this[pair[0]] = (parseInt(pair[1]) == 1 || pair[1] == 'true');
        else if (pair[0] == "inrepeat") //Moved to colour, hack to transfer param from old saves
          saved["inrepeat"] = pair[1];
        else if (pair[0] == "outrepeat") //Moved to colour, hack to transfer param from old saves
          saved["outrepeat"] = pair[1];
        else {
          //Old formulae, swap transform with post_transform
          if (pair[0] == "transform") pair[0] = "post_transform";
          //Old formulae - replace in lines
          for (var j = i+1; j < lines.length; j++) {
            var oldline = lines[j];
            lines[j] = lines[j].replace("params." + pair[1], "params." + pair[0]);
            lines[j] = lines[j].replace("formula." + pair[1], "formula." + pair[0]);
            if (pair[0] == "inside_colour") lines[j] = lines[j].replace(pair[1] + "_in_", ":");
            if (pair[0] == "outside_colour") lines[j] = lines[j].replace(pair[1] + "_out_", ":");
            //if (lines[j] != oldline) debug(oldline + " ==> " + lines[j]);
          }

          //Formula name, create entry if none
          var name = pair[1];
          var category = pair[0];
          if (!this.choices[category]) {print("INVALID CATEGORY: " + category); continue;} //TEMP 
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
                } else if (formula_list[key].source.strip() != buffer.strip()) {
                  //First search other formulae in this category for duplicate entries!
                  var found = false;
                  for (k in formula_list) {
                    if (formula_list[k].source.strip() == buffer.strip()) {
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
          //alert("formulas[" + pair[1] + "] = " + pair[0]);
          //formulas[pair[1]] = pair[0]; //Save for a reverse lookup
          //alert(pair[0] + " == " + formulas[pair[0]]);
        }
      } else if (section.slice(0, 7) == "params.") {
        var pair1 = section.split(".");
        var category = pair1[1];
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
            if (pair2[0] == "vary") { //Moved to fractured transform, hack to transfer param from old saves
              if (parseReal(pair2[1]) > 0) {
                this.choices["post_transform"].select("fractured");
                saved["vary"] = pair2[1];
              }
            } else if (pair2[0] != "antialias") { //Ignored, now a global renderer setting
              print("Skipped param, not declared: " + section + "--- this.choices[" + formula + "].currentParams[" + pair2[0] + "]=" + pair2[1]);
            }
          }
        }
      }
    }

    //Select formulae and update parameters
    this.loadParams();

    //Amend changed params, remove this when saved fractals updated
    var reup = false;
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
    if (noapply == undefined) this.applyChanges();
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
            this.iterations *= 2;
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
      this.choices['fractal'].currentParams["relax"].parse([relax.re, relax.im]);
      this.choices['fractal'].currentParams["converge"].parse("0.00001");
    }

    if (this.choices["fractal"].selected == "novabs") {
      var relax = (saved["param2"] ? saved["param2"] : saved["param1"]);
      this.choices['fractal'].currentParams["relax"].parse([relax.re, relax.im]);
      this.choices['fractal'].currentParams["converge"].parse("0.00001");
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

      this.choices['post_transform'].currentParams["perturb"].parse(fns[saved["perturb"]]);

      this.choices['post_transform'].currentParams["re_fn"].parse(fns[saved["re_fn"]]);
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
        params["mode"].parse(saved["param2"].re);
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
    this.position = new Aspect(0.0, 0, 0, 0.5);
    this.copyToForm();
    this.draw();
  }

  Fractal.prototype.sizeCanvas = function() {
    //This sanity check necessary, as sizeCanvas called when canvas still hidden
    if (this.canvas.style.display != 'block') {
      debug("sizeCanvas: abort, canvas hidden");
      return;
    }

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

    if (width != this.canvas.width || height != this.canvas.height) {
      debug("Resize " + width + "x" + height);
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.webgl) {
        this.webgl.viewport.width = width;
        this.webgl.viewport.height = height;
      } else if (renderer >= WEBCL && this.webcl) {
        //Update WebCL buffer if size changed
        if (this.webcl.viewport.width != this.canvas.width || this.webcl.viewport.height != this.canvas.height) {
          debug("Size changed, WebCL resize");
          this.webcl.setViewport(0, 0, width, height);
        }
      }
    }
  }

  //Apply any changes to parameters or formula selections and redraw
  Fractal.prototype.applyChanges = function(antialias, notime) {
    //Update palette
    var canvas = $('gradient');
    colours.get(canvas);
    if (this.webgl) this.webgl.updateTexture(this.webgl.gradientTexture, canvas);

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
    this.selected.re = parseReal($("xSelect").value);
    this.selected.im = parseReal($("ySelect").value);

    //Limit rotate to range [0-360)
    if (this.position.rotate < 0) this.position.rotate += 360;
    this.position.rotate %= 360;
    document["inputs"].elements["rotate"].value = this.position.rotate;

    //Copy form values to defined parameters
    for (category in this.choices)
      this.choices[category].currentParams.setFromForm();

    //Update shader code & redraw
    this.writeShader(notime);
    this.draw(antialias, notime);
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

  //Create shader from source components
  Fractal.prototype.generateShader = function(header) {
    //Get formula selections
    var selections = {};
    for (category in this.choices)
      selections[category] = this.choices[category].getParsedFormula();

    //Add headers + core code template
    //var shader = sources[header] + sources["include/complex-header.frag"] + sources["include/fractal-shader.frag"];
    //Insert the complex maths library + core code template
    //var shader = "#define MAXITER " + this.iterations + "\n" + 
    var shader = "#define MAXITER " + (100 * Math.ceil(this.iterations / 100)) + "\n" + 
                 sources[header] + 
                 sources["include/complex-math.frag"] + 
                 sources["include/fractal-shader.frag"];

    //Replace ---SECTION--- in template with formula code
    this.offsets = [];
    shader = this.templateInsert(shader, selections, "DATA", "data", 
                ["pre_transform", "post_transform", "fractal", "inside_colour", "outside_colour", "filter"], 2);
    shader = this.templateInsert(shader, selections, "INIT", "init",
                ["pre_transform", "post_transform", "fractal", "inside_colour", "outside_colour"], 2);
    shader = this.templateInsert(shader, selections, "RESET", "reset", 
                ["pre_transform", "fractal", "post_transform", "inside_colour", "outside_colour"], 2);
    shader = this.templateInsert(shader, selections, "PRE_TRANSFORM", "transform", ["pre_transform"], 4);
    shader = this.templateInsert(shader, selections, "ZNEXT", "znext", ["fractal"], 2);
    shader = this.templateInsert(shader, selections, "POST_TRANSFORM", "transform", ["post_transform"], 4);
    shader = this.templateInsert(shader, selections, "ESCAPED", "escaped", ["fractal"], 2);
    shader = this.templateInsert(shader, selections, "CONVERGED", "converged", ["fractal"], 2);
    shader = this.templateInsert(shader, selections, "OUTSIDE_CALC", "calc", ["outside_colour"], 4);
    shader = this.templateInsert(shader, selections, "INSIDE_CALC", "calc", ["inside_colour"], 4);
    shader = this.templateInsert(shader, selections, "OUTSIDE_COLOUR", "result", ["outside_colour"], 2);
    shader = this.templateInsert(shader, selections, "INSIDE_COLOUR", "result", ["inside_colour"], 2);
    shader = this.templateInsert(shader, selections, "FILTER", "filter", ["filter"], 2);
    this.offsets.push(new LineOffset("(end)", "(end)", shader.split("\n").length));

    //Append the complex maths library
    //shader = shader + sources["include/complex-math.frag"];

    //Remove param declarations, replace with newline to preserve line numbers
    //shader = shader.replace(paramreg, "//(Param removed)\n");

    //Replace any (x,y) constants with complex(x,y)
    //(where x,y can be a numeric constant)
    //var creg = /([^a-zA-Z_])\(([-+]?(\d*\.)?\d+)\s*,\s*([-+]?(\d*\.)?\d+)\)/g;
    //shader = shader.replace(creg, "$1complex($2,$4)");

    //(...modified to also allow single variables, note: first pattern is to ignore function call match)
    var creg = /([^a-zA-Z0-9_\)])\(([-+]?((\d*\.)?\d+|[a-zA-Z_][a-zA-Z0-9_]*))\s*,\s*([-+]?((\d*\.)?\d+|[a-zA-Z_][a-zA-Z0-9_]*))\)/g
    shader = shader.replace(creg, "$1complex($2,$5)");

    shader = shader.replace(/ident/g, ""); //Strip ident() calls

    return shader;
  }

  Fractal.prototype.templateInsert = function(shader, selections, marker, section, sourcelist, indent) {
    var source = "//***" + marker + "***\n";
    var regex = new RegExp("---" + marker + "---");
    var spaces = "          ";
    spaces = spaces.substr(0, indent);

    //Save the line offset where inserted
    var match = regex.exec(shader);
    var offset = shader.slice(0, match.index).split("\n").length;
    //debug("<br>" + section + "-->" + marker + " STARTING offset == " + offset);

    //Get sources
    for (s in sourcelist) {
      //Get code for this section from each of the sources
      var code = selections[sourcelist[s]][section];
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
    return shader.replace(regex, source);
  }

  //Build and redraw shader
  Fractal.prototype.writeShader = function(notime) {
    var source;
    if (this.webgl) {
      //Create the GLSL shader
      source = this.generateShader("include/glsl-header.frag");
    } else if (renderer >= WEBCL && this.webcl) {
      //Build OpenCL kernel
      this.webcl.resetInput();
      source = this.generateShader("include/opencl-header.cl");

      //var native_fn = /(cos|exp|log|log2|log10|sin|sqrt|tan)\(/g;
      //source = source.replace(native_fn, "native_$1(");

      //Switch to C-style casts
      source = source.replace(/complex\(/g, "(complex)(");
      source = source.replace(/real\(/g, "to_real_("); //Modified to allow convert from complex
      source = source.replace(/float\(/g, "(float)(");
      source = source.replace(/int\(/g, "(int)(");
      source = source.replace(/rgba\(/g, "(rgba)(");

    }
    //Only recompile if data has changed!
    if (sources["generated.shader"] != source) {
      this.updateShader(source, notime);
      //Opera doesn't support onbeforeunload, so save state now
      if (window.opera) saveState();
    } else
      debug("Shader build skipped, no changes");
  }

  Fractal.prototype.updateShader = function(source, notime) {
    //Save for debugging
    var timer = new Timer();
    sources["generated.shader"] = source;
    print("Rebuilding fractal shader using:");
    for (category in this.choices)
      if (this.choices[category].selected != "none") print(category + ": " + this.choices[category].selected);

    //Compile the shader using WebGL or WebCL
    var errors = "";
    if (this.webgl) {
      this.program = new WebGLProgram(this.gl, sources["include/shader2d.vert"], source);
      //Restore uniforms/attributes for fractal program
      var uniforms = ["palette", "offset", "iterations", "julia", "origin", "selected_", "dims", "pixelsize", "background"];
      this.program.setup(["aVertexPosition"], uniforms);
      errors = this.program.errors;
      this.parseErrors(errors, /0:(\d+)/);
      //Get HLSL source if available
      if (current.debug) {
        var angle = this.gl.getExtension("WEBGL_debug_shaders");
        if (angle) sources["generated.hlsl"] = angle.getTranslatedShaderSource(this.program.fshader);
      }
    } else if (renderer >= WEBCL && this.webcl) {
      errors = this.webcl.buildProgram(source);
      this.parseErrors(errors, /:(\d+):/);
    }

    if (!notime) timer.print("Compile");
  }

  Fractal.prototype.parseErrors = function(errors, regex) {
    if (errors) {
      var match = regex.exec(errors);
      var found = false;
      if (match) {
        var lineno = parseInt(match[1]);
        if (renderer >= WEBCL && this.webcl) lineno--; //WebCL seems to be reporting errors on next line
        //alert(match[1]);
        var last = null
        for (i in this.offsets) {
          if (last) {
            //debug("CAT: " + this.offsets[last].category + "SECTION: " + this.offsets[last].section + " from: " + this.offsets[last].value + " to " + (this.offsets[i].value-1));
            if (lineno >= this.offsets[last].value && lineno < this.offsets[i].value) {
              var section = this.offsets[last].section;
              //Adjust the line number
              lineno -= this.offsets[last].value + 1;
              lineno += this.choices[this.offsets[last].category].lineoffsets[section];
              var key = formulaKey(this.offsets[last].category, this.choices[this.offsets[last].category].selected);
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
      if (!found) alert(errors);  //Simply show compile error
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

  Fractal.prototype.draw = function(antialias, notime) {
    if (!antialias) antialias = this.antialias;
    var timer = null;
    if (!notime) timer = new Timer();

    //Set canvas size
    this.sizeCanvas();

    if (this.webgl) {
      this.webgl.time = timer;
      this.renderWebGL(antialias);
    } else if (renderer >= WEBCL && this.webcl) {
      this.webcl.time = timer;
      this.webcl.draw(this, antialias);
    } else
      alert("No renderer!");
  }

  Fractal.prototype.clear = function() {
    //Set canvas size
    this.sizeCanvas();

    if (this.webgl)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    else if (renderer >= WEBCL && this.webcl)
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
    } else if (renderer >= WEBCL && this.webcl) {
      this.webcl.time = null; //Disable timer
      this.webcl.setViewport(x, y, w, h);
      this.webcl.draw(this, this.antialias);
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

    //var bg = colours.palette.background.rgbaGL();
    //this.gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
    this.gl.clearColor(0, 0, 0, 0);

    //debug('>> Drawing fractal (aa=' + antialias + ")");
    this.webgl.draw2d(antialias);
    if (current.recording)
      window.outputFrame(); 
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
        return false;
      }
    }

    select.style.display = 'none';
    this.copyToForm();
    this.draw();
  }

  Fractal.prototype.down = function(event, mouse) {
    this.stop();
    clearPreviewJulia();
    return false;
  }

  Fractal.prototype.up = function(event, mouse) {
    clearPreviewJulia();
    return true;
  }

  Fractal.prototype.move = function(event, mouse) {
    //Mouseover processing
      mouse.point = new Aspect(0, 0, 0, 0);
    if (!fractal || current.mode == 0) return true;
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
      $('rotate').value = parseReal($('rotate').value, 1) + event.spin * 10;
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
        select.timer = setTimeout('selectZoom();', 350);

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
      $S("fractal-canvas").backgroundImage = "url('media/bg.png')";
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


