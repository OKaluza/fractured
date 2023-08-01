/////////////////////////////////////////////////////
//Formula list management - merge with Formula class in Fractal?
//var formula_list = null;
var selected = {};

//FormulaEntry - container
/**
 * @constructor
 */
function FormulaEntry(type, label, source, name) {
  if (name == undefined) name = labelToName(label);

  //Automatically rename until unique
  var count = 0;
  var basename = name;
  while (formula_list[type + "/" + name] != undefined) {
    //alert("Formula: " + name + " already exists!");
    //return undefined;
    count++;
    name = basename + "_(" + count + ")";
  }
  if (name != basename) label = label + " (" + count + ")";

  if (!source) {
    //Default sources for new formulae
    var def;
    if (type == 'core')
      source = formula_list["core/default"].source;
    else if (type == 'fractal')
      source = formula_list["fractal/mandelbrot"].source;
    else if (type == 'transform')
      source = formula_list["transform/functions"].source;
    else
      source = formula_list["colour/default"].source;
  }

  this.type = type;
  this.name = name;
  this.label = label;
  this.source = source;

  //Add to the global list
  var key = type + "/" + name;
  formula_list[key] = this;
  //Add to selects
  addSelectEntry(formula_list[key]);
}

FormulaEntry.prototype.toString = function() {
  return "[" + this.type + "/" + this.name + "] = " + this.source;
}

FormulaEntry.prototype.equals = function(source2) {
  //Strips all whitespace and comments and compares resulting string
  function strip(source) {
    source = source.replace(/\/\*([\s\S]*?)\*\/|(\/\/.*)/g, "");
    source = source.replace(/(\r\n|\n|\r)/gm, "");
    //Compat: replace complex/real with macros
      source = source.replace(/complex\(/g, "C(");
      source = source.replace(/real\(/g, "R(");
    return source;
  }
  return (strip(this.source) == strip(source2));
}

//This re-creates the fractal formulae list and dropdowns
function importFormulaList(data) {
  formula_list = {};
  //Clear existing
  document.getElementById("core_formula").options.length = 0;
  document.getElementById("fractal_formula").options.length = 0;
  document.getElementById("pre_transform_formula").options.length = 0;
  document.getElementById("post_transform_formula").options.length = 0;
  document.getElementById("outside_colour_formula").options.length = 0;
  document.getElementById("inside_colour_formula").options.length = 0;
  document.getElementById("filter_formula").options.length = 0;

  addToSelect("pre_transform", "none", "");
  addToSelect("post_transform", "none", "");
  addToSelect("outside_colour", "none", "");
  addToSelect("inside_colour", "none", "");
  //addToSelect("inside_colour", "same", "As above");
  addToSelect("filter", "none", "");

  //Dummy entry for same colour
  var f = new FormulaEntry("colour", "As Above", "\ncalc:\nif (i==limit-1) escaped = true;\n", "same");

  //Create proper FormulaEntry objects from JSON data
  try {
    var parsed = JSON.parse(data);

    //Backwards compat/conversion!!! (load from defaults if no core formula)
    if (!parsed["core/default"]) {
      var temp = JSON.parse(readURL('/formulae_' + state.version + '.json', false));
      parsed["core/default"] = temp["core/default"];
    }

    //Run through the list and add to select lists
    for (key in parsed) {
      if (parsed[key].name == "same") continue;
      //formula_list[key] = new FormulaEntry();
      var f = new FormulaEntry(parsed[key].type, parsed[key].label, parsed[key].source, parsed[key].name);
      //debug(formula_list[key].constructor.name);
    }
  } catch(e) {
    alert('ImportFormulaList error: ' + e);
    formula_list = null;
  }

  //CONVERSION... moved from sources to core formula
  //if (document.getElementById("core_formula").options.length == 0)
  //  var f = new FormulaEntry("core", "Default", sources["include/fractal.template"], "default");

  //Set selected defaults
  document.getElementById('core_formula').value = selected['core'] || document.getElementById("core_formula").options[0].value;
  document.getElementById('fractal_formula').value = selected['fractal'] || document.getElementById("fractal_formula").options[0].value;
  document.getElementById('pre_transform_formula').value = selected['pre_transform'] || "none";
  document.getElementById('post_transform_formula').value = selected['post_transform'] || "none";
  document.getElementById('outside_colour_formula').value = selected['outside_colour'] || document.getElementById("outside_colour_formula").options[1].value;
  document.getElementById('inside_colour_formula').value = selected['inside_colour'] || "none";
  document.getElementById('filter_formula').value = selected['filter'] || "none";
}

function addSelectEntry(entry) {
  if (entry.type.indexOf("colour") > -1) {
    if (entry.name != "same")
      entry.field = addToSelect("outside_colour", entry.name, entry.label);
    entry.field = addToSelect("inside_colour", entry.name, entry.label);
  } else if (entry.type.indexOf("transform") > -1) {
    entry.field = addToSelect("pre_transform", entry.name, entry.label);
    entry.field = addToSelect("post_transform", entry.name, entry.label);
  } else { //if (entry.type.indexOf("fractal") > -1 || entry.type.indexOf("filter") > -1) {
    entry.field = addToSelect(entry.type, entry.name, entry.label);
  }
}

function addToSelect(type, name, label) {
  select = document.getElementById(type + "_formula");
  if (!select) return null;
  var opt = new Option(label, name);
  select.add(opt); //options[select.length] = opt;
  return opt;
}

function saveSelections() {
  var selects = ["core", "fractal", "pre_transform", "post_transform", "outside_colour", "inside_colour", "filter"];
  selected = {};
  for (s in selects) {
    var selname = selects[s] + "_formula";
    var select = document.getElementById(selname);
    //Get selected
    if (select.selectedIndex < 0) select.selectedIndex = 0;
    selected[selects[s]] = select.options[select.selectedIndex].value;
  }
}

function categoryToType(category) {
  var type = category;
  if (category.indexOf("colour") > -1) type = "colour";
  if (category.indexOf("transform") > -1) type = "transform";
  return type;
}

function labelToName(label) {
  return label.replace(/[^\w()]+/g,'_').toLowerCase();
}

function formulaFilename(category, label) {
  return "formulae/" + labelToName(label) + "." + categoryToType(category) + ".formula";
}

function formulaKey(category, label, check) {
  var key = categoryToType(category) + "/" + labelToName(label);
  if (check && !formula_list[key]) {
    //print("No formula entry found for: " + category + " / " + label);
    return null;
  }
  return key;
}

function nameToLabel(name) {
  //Convert to title case and strip underscores
  var result = name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  return result.replace(/_/g,' ');
}

function filenameToName(filename) {
  var start = filename.lastIndexOf('/')+1;
  var end = filename.indexOf('.');
   var eend = filename.lastIndexOf('.');
  if (start < 0) start = 0;
  if (end < 0) end = filename.length;
  //Get extension
  var ext = "";
  if (eend > end)
    ext = filename.substr(end+1, eend-end-1);
  return [filename.substr(start, end), ext];
}

//Contains a formula selection and its parameter set
/**
 * @constructor
 */
function FormulaSelection(category) {
  this.category = category;
  this.params = {};
  this.defaultparams = {};
  this.lineoffsets = {};

  this.sel = document.getElementById(this.category + '_formula');

  if (!this.sel) {
    //Create hidden select to hold data
    this.sel = document.createElement('select');
    this.sel.style = "display: none";
    this.sel.id = this.category + '_formula';
    document.body.appendChild(this.sel);
    //Add default selection
    addToSelect(category, "none", "");
    this.select("none");
  } else {
    this.reselect();
  }
}

FormulaSelection.prototype.exists = function(value) {
  //Check a formula name is a valid selection
  this.sel.value = value;
  return this.sel.value == value;
}

FormulaSelection.prototype.reselect = function(idx) {
  //Select, by index from select control if present and idx provided
  var name = 'default';
  //Formula categories may have a select element, in which case use it
  if (this.sel) {
    if (idx != undefined)
      this.sel.selectedIndex = idx;
    //TODO: BETTER ERROR HANDLING: This means a formula that is no longer present was selected
    if (this.sel.selectedIndex < 0) {alert(this.category + " : Invalid selection! " + idx); return;}
    name = this.sel.options[this.sel.selectedIndex].value;
  }
  this.select(name);
}

FormulaSelection.prototype.select = function(name) {
  //Formula selected, parse it's parameters
  if (name) this.selected = name;
  else name = this.selected;  //Re-selecting current
  //debug("Selecting " + name + " for " + this.category + "_params");

  //Delete any existing dynamic form fields
  var element = document.getElementById(this.category + "_params");
  //if (!element) alert("Element is null! " + this.category + " - " + name);
  if (element) removeChildren(element);

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
    if (element)
      this.params[name].createFields(this.category, name);
  }
  //debug("Set [" + this.category + "] formula to [" + this.selected + "]"); // + " =====> " + this.currentParams.toString());
}

FormulaSelection.prototype.getkey = function() {
  return formulaKey(this.category, this.selected);
}

FormulaSelection.prototype.getSource = function() {
  //if (this.selected == "none") return "";
  if (this.selected == "none") return "";
  //Force escape flagged when using same colouring algorithm
  //if (this.selected == "same") return "result:\nif (i==limit-1) escaped = true;\n";
  var key = this.getkey();
  if (!key) return "";
  if (formula_list[key]) {
    //TEMPORARY HACK FOR OLD ESCAPE/CONVERGE TESTS and LOGE == LN
    //var source = formula_list[key].source.replace(/if \((.*)\) break;/g, "converged = ($1);");
    var source = formula_list[key].source;
    source = source.replace("loge", "ln");
    if (source != formula_list[key].source) {
      formula_list[key].source = source;
      alert("LOGE=>LN\n" + source);
    }
    return formula_list[key].source;
  }
  print("Formula Missing! No entry found for: " + key);
  return "";
}

FormulaSelection.prototype.getCodeSections = function() {
  var code = this.getSource();
  var section = "data";
  var sections = {"main" : "", "init" : "", "reset" : "", "znext" : "", "escaped" : "", "converged" : "", "calc" : "", "result" : "", "transform" : "", "filter" : ""};
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

  }
  return sections;
}

FormulaSelection.prototype.getParsedFormula = function(fractal) {
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
  var params = this.currentParams.toCode(fractal);
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
    sections[key] = this.parseExpressions(sections[key]);
    sections[key] = sections[key].replace(/@([a-zA-Z_])/g, this.category + "_$1");
  }

  //return code;
  return sections;
}

FormulaSelection.prototype.parseExpressions = function(code) {
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


