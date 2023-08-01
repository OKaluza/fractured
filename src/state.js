//Storage - data store, logged in, selected values
// settings kept between sessions
/**
 * @constructor
 */
function State(version) {
  if (!this.supported()) throw "Error initialising state: Local storage not supported";

  this.upgrademsg = "<a href='javascript:resetReload()'>click here" + 
                    "</a> to complete update by reloading from server"; 
  //Property list to save
  this.props = ['version', 'fractal', 'session', 'formulae', 'antialias', 'debug', 
                'renderer', 'platform', 'device', 'cards', 'active', 'name', 'thumbnail'];
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
  this.timers = 350;  //Delay update timers (ms)
  this.cards = {};

  //Defaults in case no saved settings
  this.fractal = null;
  this.session = 0;
  this.formulae = 0;
  this.antialias = 2;
  this.debug = false;
  this.renderer = WEBGL;
  this.platform = this.device = 0;
  this.active = this.thumbnail = null;

  //Mode settings (and set ui inital state)
  this.server = null;
  this.disabled = this.control = false;
  this.drawMode(true);
  this.controlMode(true);

  //Load persistent settings from storage
  this.loadStatus();

  if (!this.cards) this.cards = {};
  if (this.debug) this.debugOn();

  //Legacy
  if (typeof this.fractal != 'string') this.fractal = null;
  //if (!this.active) {
    this.active = localStorage["fractured.active"];
    delete localStorage["fractured.active"];
  //}
  if (!this.thumbnail) {
    this.thumbnail = localStorage["fractured.thumbnail"];
    delete localStorage["fractured.thumbnail"];
  }

  if (version && this.version != version) {
    //Updated - save new version and force reload!
    this.version = version;
    this.saveStatus();
    popup("New version <b>" + this.version + "</b>: Application upgraded<br>" + this.upgrademsg);
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
  var savedata = {};
  for (i in this.props) {
    var key = this.props[i];
    savedata[key] = this[key];
  }
  localStorage["fractured.current"] = JSON.stringify(savedata);
}

State.prototype.loadStatus = function() {
  //Persistent settings:
  var source = localStorage["fractured.current"];
  if (source) {
    var data = JSON.parse(source);
    for (i in this.props) {
      var key = this.props[i];
      this[key] = data[key];
    }
  }
}

State.prototype.debugOn = function() {
  this.debug = true;
  if (!document.getElementById('debugmenu')) return;
  document.getElementById('debugmenu').style.display = 'block';
  document.getElementById('recordmenu').style.display = 'block';
}

State.prototype.debugOff = function() {
  this.debug = false;
  this.saveStatus();
  document.getElementById('debugmenu').style.display = 'none';
  document.getElementById('recordmenu').style.display = 'none';
}

//Draw mode off disables all local rendering
State.prototype.drawMode = function(noset) {
  if (!noset) this.disabled = !this.disabled;
  if (!document.getElementById('drawmodebtn')) return;
  document.getElementById('drawmodebtn').innerHTML = "Draw Mode" + (this.disabled ? "" : "&#10003;");
}
//Control mode controls remote server rendering
State.prototype.controlMode = function(noset) {
  if (!noset) this.control = !this.control;
  if (!document.getElementById('ctrlmodebtn')) return;
  document.getElementById('ctrlmodebtn').innerHTML = "Control Mode" + (this.control ? "&#10003;" : "");
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
  if (fr_str != undefined) {
    try {
      fractals = JSON.parse(fr_str);
      //Detect/convert old format...
      var count = parseInt(fr_str);
      if (isNaN(count))
        fractals = JSON.parse(fr_str);
      else
        fractals = this.convertFractals(count); //Convert from old format
    } catch(e) {
      //Skip
      console.log("Invalid fractal string: " + fr_str);
    }
  }
  return fractals;
}

State.prototype.getPalettes = function() {
  var pstr = localStorage["fractured.palettes"];
  this.palettes = [];
  if (pstr != undefined) {
    try {
      this.palettes = JSON.parse(pstr);
      populatePalettes(this.palettes);
    } catch(e) {
      //Default palettes
      var that = this;
      ajaxReadFile('/palettes.json', function(data) {
        that.palettes = JSON.parse(data);
        populatePalettes(that.palettes);
      }, false);
    }
  }
  //Back compat:
  //if (typeof(palettes) != 'object') palettes = [];
  //return palettes;
}

State.prototype.save = function() {
  if (!fractal) return;
  try {
    localStorage["fractured.formulae"] = JSON.stringify(formula_list);
    localStorage["fractured.fractals"] = JSON.stringify(fractals);
    localStorage["fractured.palettes"] = JSON.stringify(palettes);
    //Save current fractal if changed (as default)
    if (fractal.thumb) {
      this.active = fractal.toString();
      this.thumbnail = fractal.thumb;
      this.fractal = document.getElementById('name').value;
      this.saveStatus();
    }
  } catch(e) {
    alert('error: ' + e);
  }
}

State.prototype.reset = function(noconfirm) {
  if (noconfirm || confirm('This will clear everything!')) {
    localStorage.clear(); //be careful as this will clear the entire database
    this.load();
    if (!this.offline)
      //sessionGet(readURL('ss/session_get.php')); //Get updated list...
      listFilesInApplicationDataFolder(loadDriveFiles);
    loadPalette(0); //Palette reset
    newFractal();
    this.session = 0;
    this.formulae = 0;
    this.fractal = null;
    fractals = {};
    this.saveStatus(); //Restore settings
  }
}

State.prototype.load = function(callback) {
  //Load includes...
  //(Allow cache, when changed update the version number)
  var incfile = '/includes_' + this.version + '.json';
  var that = this;
  ajaxReadFile(incfile, function(incdata) {
    if (!incdata) {
      popup("<b><i>" + incfile + "</i></b> not found! Application may have been upgraded, " + that.upgrademsg);
    } else {
      sources = JSON.parse(incdata);

      if (that.debug) {
        //Entries for all source files in debug edit menu
        var menu = document.getElementById('debugedit');
        if (menu) {
          removeChildren(menu);
          for (key in sources) {
            var onclick = "openEditor('" + key + "')";
            addMenuItem(menu, key, onclick);
          }
        }
      }
      
      //Load formulae
      formula_list = null;
      var f_source = localStorage["fractured.formulae"];
      if (f_source) importFormulaList(f_source);
      if (!formula_list) importFormulaList(readURL('/formulae_' + that.version + '.json', false));

      that.getPalettes();
      fractals = that.getFractals();
      if (that.fractal && !fractals[that.fractal]) that.fractal = null;
      //populatePalettes();
      populateFractals();
      populateScripts();

      //Show an indicator, assumes 5K char limit or 2.5K in WebKit
      var isWebKit = /AppleWebKit/.test(navigator.userAgent);
      var size = JSON.stringify(localStorage).length;
      var indic = size / (isWebKit ? 2500000 : 5000000);
      var ind = document.getElementById('indicator');
      if (ind) ind.style.width = (350 * indic) + 'px';

      if (callback) callback();
    }
  }, false);
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
  this.saveStatus(); //Restore settings
  //sessionGet(readURL('ss/session_get.php')); //Get updated list...
    listFilesInApplicationDataFolder(loadDriveFiles);
  this.load();  //load the state data
  progress();
}

State.prototype.toString = function() {
  //Get current state in local storage minus session/login details
  this.save();
  this.clearStatus();  //Clear local storage settings
  var source = JSON.stringify(localStorage);
  this.saveStatus(); //Restore settings
  return source;
}

State.prototype.lastFractal = function() {
  //Load current fractal (as default)
  if (this.active) {
    fractal.load(this.active, false, true); //Don't display immediately
    document.getElementById('name').value = this.fractal;
    if (this.thumbnail)
      document.getElementById('lastimage').src = this.thumbnail;
    else
      document.getElementById('lastimage').style.display = 'none';
    return true;
  } else {
    //Load & draw default palettes
    loadPalette(0);
    fractal.updatePalette();
  }
  return false;
}


