/////////////////////////////////////////////////////
//Formula list management - merge with Formula class in Fractal?
var formula_list = {};
var selected = {};

//FormulaEntry - container
/**
 * @constructor
 */
function FormulaEntry(type, label, source, name) {
  if (name == undefined)
    name = label.replace(/[^\w]+/g,'_').toLowerCase();

  if (formula_list[type + "/" + name] != undefined) {
    alert("Formula: " + name + " already exists!");
    return undefined;
  }

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
  formula_list[type + "/" + name] = this;
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
    entry = formula_list[key];
    if (!entry.type) alert(key);
    if (entry.type.indexOf("colour") > -1) {
      entry.field = addToSelect("outside_colour", entry.name, entry.label);
      entry.field = addToSelect("inside_colour", entry.name, entry.label);
    } else if (entry.type.indexOf("transform") > -1) {
      entry.field = addToSelect("pre_transform", entry.name, entry.label);
      entry.field = addToSelect("post_transform", entry.name, entry.label);
    } else if (entry.type.indexOf("fractal") > -1)
      entry.field = addToSelect(entry.type, entry.name, entry.label);
  }

  //Set selected defaults
  $('fractal_formula').value = selected['fractal'] ? selected['fractal'] : $("fractal_formula").options[0].value;
  $('pre_transform_formula').value = selected['pre_transform'] ? selected['pre_transform'] : "none";
  $('post_transform_formula').value = selected['post_transform'] ? selected['post_transform'] : "none";
  $('outside_colour_formula').value = selected['outside_colour'] ? selected['outside_colour'] : $("outside_colour_formula").options[1].value;
  $('inside_colour_formula').value = selected['inside_colour'] ? selected['inside_colour'] : "none";
}

function addToSelect(type, name, label) {
  select = $(type + "_formula");
  select.options[select.length] = new Option(label, name);
  return select.options[select.length];
}

function saveSelections() {
  var types = ["fractal", "transform", "colour"];
  var selects = ["fractal", "pre_transform", "outside_colour"];
  selected = {};
  for (t in types) {
    var start = 0;
    if (t > 0) start = 1; //Skip "none"
    var selname = selects[t] + "_formula";
    var select = $(selname);
    //Get selected
    selected[types[t]] = select.options[select.selectedIndex].value;
  }
}

function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function categoryToType(category) {
  var type = category;
  if (category.indexOf("colour") > -1) type = "colour";
  if (category.indexOf("transform") > -1) type = "transform";
  return type;
}

function labelToName(label) {
  return label.replace(/[^\w]+/g,'_').toLowerCase();
}

function formulaFilename(category, label) {
  return "formulae/" + labelToName(label) + "." + categoryToType(category) + ".formula";
}

function formulaKey(category, label) {
  return categoryToType(category) + "/" + labelToName(label);
}
