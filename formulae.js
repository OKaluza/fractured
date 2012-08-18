/////////////////////////////////////////////////////
//Formula list management - merge with Formula class in Fractal?
var formula_list = null;
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
    if (type == 'fractal')
      source = formula_list["fractal/mandelbrot"].source;
    else if (type == 'transform')
      source = formula_list["transform/functions"].source;
    else
      source = formula_list["colour/default"].source;
  }

  this.type = type;
  this.name = name;
  this.label = label;
  this.type = type;
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

function updateFormulaLists() {
  //Clear existing
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

  //Run through the list and add to select lists
  for (key in formula_list) {
    addSelectEntry(formula_list[key]);
  }

  //Set selected defaults
  $('fractal_formula').value = varDefault(selected['fractal'], $("fractal_formula").options[0].value);
  $('pre_transform_formula').value = varDefault(selected['pre_transform'], "none");
  $('post_transform_formula').value = varDefault(selected['post_transform'], "none");
  $('outside_colour_formula').value = varDefault(selected['outside_colour'], $("outside_colour_formula").options[1].value);
  $('inside_colour_formula').value = varDefault(selected['inside_colour'], "none");
}

function addSelectEntry(entry) {
  if (entry.type.indexOf("colour") > -1) {
    entry.field = addToSelect("outside_colour", entry.name, entry.label);
    entry.field = addToSelect("inside_colour", entry.name, entry.label);
  } else if (entry.type.indexOf("transform") > -1) {
    entry.field = addToSelect("pre_transform", entry.name, entry.label);
    entry.field = addToSelect("post_transform", entry.name, entry.label);
  } else if (entry.type.indexOf("fractal") > -1)
    entry.field = addToSelect(entry.type, entry.name, entry.label);
}

function addToSelect(type, name, label) {
  select = $(type + "_formula");
  if (!select) return null;
  select.options[select.length] = new Option(label, name);
  return select.options[select.length];
}

function saveSelections() {
  var selects = ["fractal", "pre_transform", "post_transform", "outside_colour", "inside_colour"];
  selected = {};
  for (s in selects) {
    var selname = selects[s] + "_formula";
    var select = $(selname);
    //Get selected
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
    //consoleWrite("No formula entry found for: " + category + " / " + label);
    return null;
  }
  return key;
}

function nameToLabel(name) {
  return name.replace(/_/g,' ').toTitleCase();
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
