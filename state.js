//Storage - data store, logged in, selected values
// settings kept between sessions
/**
 * @constructor
 */
function State(version) {
  if (!this.supported()) return null;
  this.version = version;
  this.loggedin = false;
  this.offline = null;
  this.gallery = "#examples";
  this.mode = 0;
  this.offset = 0;
  this.recording = false;
  this.baseurl = "";
  this.locator = null;
  this.output = true;

  //Persistent settings:
  var source = localStorage["fractured.current"];
  if (source) {
    var data = JSON.parse(source);
    this.fractal = data.fractal;
    this.session = data.session;
    this.formulae = data.formulae;
    this.antialias = data.antialias;
    this.debug = data.debug;
    if (this.debug) this.debugOn();
  } else {
    this.fractal = null;
    this.session = 0;
    this.formulae = 0;
    this.antialias = 2;
    this.debug = false;
  }
}

State.prototype.supported = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

State.prototype.clearStatus = function() {
  delete localStorage["fractured.current"];
}

State.prototype.saveStatus = function() {
  var data = {};
  data.fractal = this.fractal;
  data.session = this.session;
  data.formulae = this.formulae;
  data.antialias = this.antialias;
  data.debug = this.debug;
  localStorage["fractured.current"] = JSON.stringify(data);
}

State.prototype.debugOn = function() {
  this.debug = true;
  $S('debugmenu').display = 'block';
  $S('recordmenu').display = 'block';
}

State.prototype.debugOff = function() {
  this.debug = false;
  this.save();
  $S('debugmenu').display = 'none';
  $S('recordmenu').display = 'none';
}

State.prototype.resetFormulae = function() {
  print("Resetting all formulae to defaults");
  delete localStorage["fractured.formulae"];
}

State.prototype.convertFractals = function(count) {
  //Convert to new format list (indexed by name, ordered by insertion)
  var fractals = {};
  //Cached thumbnails
  thumbnails = [];
  var t_source = localStorage["fractured.thumbnails"];
  if (t_source) thumbnails = JSON.parse(t_source);

  for (var i=1; i<=count; i++) {
    var source = localStorage["fractured.fractal." + i];
    var name = localStorage["fractured.names." + i];
    if (!source) continue;
    fractals[name] = new FractalEntry(source, thumbnails[i]);
  }

  localStorage["fractured.fractals"] = JSON.stringify(fractals);
  for (var i=1; i<=count; i++) {
    localStorage.removeItem("fractured.names." + i);
    localStorage.removeItem("fractured.fractal." + i);
  }
  localStorage.removeItem("fractured.thumbnails");
  this.fractal = null;
  return fractals;
}

State.prototype.getFractals = function() {
  var fractals = {};
  var fr_str = localStorage["fractured.fractals"];
  if (fr_str) {
    //Detect/convert old format...
    var count = parseInt(fr_str);
    if (count > 0)
      fractals = this.convertFractals(count); //Convert from old format
    else
      fractals = JSON.parse(fr_str);
  }
  return fractals;
}

State.prototype.getPalettes = function() {
  var palettes = [];
  var pstr = localStorage["fractured.palettes"];
  if (!pstr)
    //Default palettes
    palettes = JSON.parse(readURL('/palettes.json', false));
  else
    palettes = JSON.parse(pstr);
  //Back compat:
  if (typeof(palettes) != 'object') palettes = [];
  return palettes;
}

State.prototype.save = function() {
  if (!fractal) return;
  try {
    localStorage["fractured.formulae"] = JSON.stringify(formula_list);
    localStorage["fractured.fractals"] = JSON.stringify(fractals);
    localStorage["fractured.palettes"] = JSON.stringify(palettes);
    //Save current fractal (as default)
    localStorage["fractured.active"] = fractal;
    localStorage["fractured.name"] = $('name').value;
  } catch(e) {
    alert('error: ' + e);
  }
}

State.prototype.reset = function(noconfirm) {
  if (noconfirm || confirm('This will clear everything!')) {
    localStorage.clear(); //be careful as this will clear the entire database
    this.load();
    if (!this.offline)
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
    loadPalette(0); //Palette reset
    newFractal();
    this.session = 0;
    this.formulae = 0;
    this.fractal = null;
    fractals = {};
  }
}

State.prototype.load = function() {
  //Load includes...
  //(Allow cache, when changed update the version number)
  var incfile = '/includes_' + this.version + '.json';
  var incdata = readURL(incfile, false);
  if (!incdata) {
    popup("<b><i>" + incfile + "</i></b> not found! Application may have been upgraded, " + 
          "<a href='javascript:location.reload(true)'>click here" + 
          "</a> to try and reload new version from server"); 
    return false;
  }
  sources = JSON.parse(incdata);

  if (this.debug) {
    //Entries for all source files in debug edit menu
    var menu = $('debugedit');
    removeChildren(menu);
    for (key in sources) {
      var onclick = "openEditor('" + key + "')";
      addMenuItem(menu, key, onclick);
    }
  }
  
  //Load formulae
  formula_list = null;
  var f_source = localStorage["fractured.formulae"];
  if (f_source) importFormulaList(f_source);
  if (!formula_list) importFormulaList(readURL('/formulae_' + this.version + '.json', false));

  palettes = this.getPalettes();
  fractals = this.getFractals();
  populatePalettes();
  populateFractals();
  populateScripts();

  //Show an indicator, assumes 5mb of local storage
  var size = JSON.stringify(localStorage).length;
  var indic = size / 5000000;
  $S('indicator').width = (350 * indic) + 'px';
  return true;
}

State.prototype.read = function(data) {
  //Attempt to parse if not already done
  if (typeof data == 'string') {
    try {
      var data = JSON.parse(data);
      if (!data) return;
    } catch(e) {
      alert('ImportState: Error! ' + e);
      return;
    }
  }
  try {
    localStorage.clear(); //clear the entire database
    for (key in data)
      localStorage[key] = data[key];
  } catch(e) {
    alert('ImportParsedState: Error! ' + e);
    return;
  }
  //Replace session id, not saved in state data
  state.saveStatus();
  sessionGet(readURL('ss/session_get.php')); //Get updated list...
  this.load();  //load the state data
  progress();
}

State.prototype.toString = function() {
  //Get current state in local storage minus session/login details
  this.save();
  this.clearStatus();  //Clear local storage settings
  var source = JSON.stringify(localStorage);
  state.saveStatus(); //Restore settings
  return source;
}

State.prototype.lastFractal = function() {
  //Load current fractal (as default)
  var source = localStorage["fractured.active"];
  if (source) {
    fractal.load(source, true); //Don't display immediately
    $('name').value = localStorage["fractured.name"];
  } else {
    //Load & draw default palettes
    loadPalette(0);
    fractal.applyChanges();
  }
}


