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

Complex.prototype.set = function(pos) {
  if (typeof pos == 'string')
    pos = parseComplex(pos);
  this.re = pos.re;
  this.im = pos.im;
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

function parseExpression(expr) {
  //Ensure is a string
  expr = expr + "";
  //Optimisation: 
  //find all variables in expression and if found in param list, replace with their value
  //(requires savevars[] array created when parsing parameters in toCode())
  var reg = /@?([_a-zA-Z][_a-zA-Z0-9]*)/g;
  var match;
  while (match = reg.exec(expr)) {
    var key = match[1];
    var found = savevars[key];
    //Check global fractal savevars too...
    if (found == undefined) found = fractal_savevars[key];
    //Found a variable with known (constant) value, substitute value into expression
    if (found != undefined) {
      //Cast to string
      found = found + "";
      //Replace the matched param with value
      var newval = expr.slice(0, reg.lastIndex - match[0].length);
      expr = newval + found + expr.slice(reg.lastIndex, expr.length);
      //Adjust search position to account for substituted value
      reg.lastIndex += (found.length - match[0].length);
    }
  }

  //Implicit multiply no longer supported by parser
  //()(), #(), ()a, #a(), #a
  expr = expr.replace(/\)\(/g, ")*(");
  expr = expr.replace(/([-+]?\d*\.?\d+)\(/g, "$1*(");
  expr = expr.replace(/\)(@?[_a-zA-Z][_a-zA-Z0-9]*)/g, ")*$1");
  expr = expr.replace(/([-+]?\d*\.?\d+)(@?[_a-zA-Z][_a-zA-Z0-9]*)\(/g, "$1*$2*(");
  expr = expr.replace(/([-+]?\d*\.?\d+)(@?[_a-zA-Z][_a-zA-Z0-9]*)/g, "$1*$2");
  debug("expr: " + expr);

  //Parse an expression into correct complex maths functions using the Jison parser
  var parsed;
  parser.yy = {};
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
      declaration = "const " + type + " " + key + " = C(" + this.value.re + "," + this.value.im + ");\n";
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
    if (fractal.renderer > WEBGL && fractal.webcl)
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
      if (this.input.tagName == 'TEXTAREA')
        this.value = this.input.value.trim();
      else
        this.value = this.input.getValue();
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
      if (this.input.tagName == 'TEXTAREA')
        this.input.value = this.value;
      else
        this.input.setValue(this.value);
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
  /* Hack: detect Android and disable CodeMirror on fields */
  var isAndroid = /android/.test(navigator.userAgent.toLowerCase());
  var field_area = $(category + "_params");
  var parambox = document.createElement("div");
  parambox.className = "parambox";
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
    divlabel.className = "parambox-label";
    divlabel.innerHTML = sectionnames[category] + ": <b>" + label + "</b>";
    //divlabel.appendChild(divlabel.ownerDocument.createTextNode(sectionnames[category] + ": " + label));
    parambox.appendChild(divlabel);
  }
  field_area.appendChild(parambox);

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
    parambox.appendChild(row);

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
        input.className = "colourbg checkerboard";
        var cinput = document.createElement("div");
        cinput.className = "colour";
        cinput.style.backgroundColor = this[key].value.html();
        input.appendChild(cinput);
        spanin.appendChild(input);
        input = cinput; //Use inner div as input element
        break;
      case 6: 
        //Expression
        if (!isAndroid && typeof CodeMirror == 'function') {
          input = CodeMirror(spanin, {
            value: this[key].value,
            mode: "text/x-glsl",
            theme: "fracturedlight",
            indentUnit: 2,
            tabSize: 2,
            matchBrackets: true,
            lineWrapping: true
          });
          input.on("blur", function() {fractal.applyChanges();});
        } else {
          input = document.createElement("textarea");
          input.value = this[key].value;
          input.setAttribute("spellcheck", false);
          spanin.appendChild(input);
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
    //Instant update... (on for all now draw button removed)
    if (this[key].typeid == 2) {
      input[0].setAttribute("onchange", onchange);
      input[1].setAttribute("onchange", onchange);
    } else if (input.setAttribute)
      input.setAttribute("onchange", onchange);
    //Save the field element
    this[key].input = input;
  }

  //Clear
  var clr = document.createElement("div");
  clr.className = "clear gap";
  parambox.appendChild(clr);
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

