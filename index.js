//TODO:
//Write help screen
//Allow disabling of thumbnails (set size?)
//Clear-actions doesn't work!
//Check: that error reporting works in WebCL mode
//Define a new formula, then use ?reload - fail
//Select formula, change param, select another formula with same param, value overwritten! (restorevalues) (palette repeat)

//Globals
var sources = default_sources;
var reloadsources = false;
var mode = "WebGL";
var fractal;
var defaultMouse;
var colours;
var showparams = true;
var currentSession = 0; //Selected session
var currentFormulae = 0; //Selected formula set
var currentFractal = -1; //Selected fractal id
var filetype = 'fractal';
var offline = null;
var recording = false;
var debug = true;//false; //Always enabled for testing
var restored = "";
//Timers
var rztimeout = undefined;

var mouseActions = {}; //left,right,middle,wheel - 'shift', 'ctrl', 'alt', 'shift+ctrl', 'shift+alt', 'ctrl+alt', 'shift+ctrl+alt'

  //WheelAction - field id and value
  /**
   * @constructor
   */
  function WheelAction(id, value) {
    this.id = id;
    this.value = value;
  }

  function defaultMouseActions() {
    mouseActions["left"] = {'shift':null, 'ctrl':null, 'alt':null, 'shift+ctrl':null, 'shift+alt':null, 'ctrl+alt':null, 'shift+ctrl+alt':null};
    mouseActions["right"] = {'shift':null, 'ctrl':null, 'alt':null, 'shift+ctrl':null, 'shift+alt':null, 'ctrl+alt':null, 'shift+ctrl+alt':null};
    mouseActions["middle"] = {'shift':null, 'ctrl':null, 'alt':null, 'shift+ctrl':null, 'shift+alt':null, 'ctrl+alt':null, 'shift+ctrl+alt':null};
    mouseActions["wheel"] = {'shift':new WheelAction('rotate',10), 'ctrl':null, 'alt':new WheelAction('rotate',1), 'shift+ctrl':null, 'shift+alt':null, 'ctrl+alt':null, 'shift+ctrl+alt':null};
  }

  function consoleDebug(str) {
    if (debug) consoleWrite(str);
  }

  function consoleWrite(str) {
    var console = document.getElementById('console');
    console.innerHTML += "<div class='message'>" + str + "</div>";
    $('panel4').scrollTop = console.clientHeight - $('panel4').clientHeight + $('panel4').offsetHeight;
  }

  function consoleClear() {
    var console = document.getElementById('console');
    console.innerHTML = '';
  }

  function consoleHelp() {
    var console = document.getElementById('console');
    console.innerHTML = 'HELP TEXT GOES HERE';
  }

  function record(state) {
    recording = state;
    var canvas = document.getElementById("fractal-canvas");
    canvas.mouse.wheelTimer = !recording;
    if (recording) {
      //Ensure a multiple of 2
      if (fractal.width % 2 == 1) fractal.width -= 1;
      if (fractal.height % 2 == 1) fractal.height -= 1;
    }
    $('recordOn').className = recording ? 'selected_item' : '';
    $('recordOff').className = !recording ? 'selected_item' : '';
  }

  function outputFrame() {
    var canvas = document.getElementById("fractal-canvas");
    var data = canvas.toDataURL("image/png").substring(22);  //Strip from start: "data:image/png;base64,"
    document.body.style.cursor = "wait";
    ajaxPost("http://localhost:8080/frame", data, frameDone);
  }

  function frameDone(response) {
    document.body.style.cursor = "default";
    consoleDebug("Request sent");
  }

  function runScript() {
    var script = "function ParamVals(paramset) { \
        for (key in paramset)   \
          this[key] = paramset[key].value;  \
      } \
      var baseFractal = new ParamVals(fractal.fractal.currentParams); \
      var preTransform = new ParamVals(fractal.pre_transform.currentParams);  \
      var postTransform = new ParamVals(fractal.pre_transform.currentParams); \
      var insideColour = new ParamVals(fractal.inside_colour.currentParams);  \
      var outsideColour = new ParamVals(fractal.outside_colour.currentParams); \
      ";

    script += sources["include/script.js"];
    eval(script);
  }

  function appInit() {
    if (!supports_html5_storage()) {alert("Local Storage not supported!"); return;}
    //Force offline mode when loaded locally
    if (window.location.href.indexOf("file://") == 0) offline = true;

    showPanel($('tab4'), 'panel4');
    //If debug mode enabled, show extra menus
    var query = decodeURI(window.location.href).split("?")[1]; //whole querystring after ?
    if (query) {
      if (query.indexOf('debug') >= 0) {
        debug = true;
        $S('debugmenu').display = 'block';
        $S('recordmenu').display = 'block';
      }
      if (query.indexOf('webcl') >= 0) {
        mode = "WebCL";
        if (query.indexOf('double') >= 0)
          mode = "WebCL-double";
      }
      if (query.indexOf('reload') >= 0) {
        reloadsources = true;
      }
    }

    if (!offline) {
      //Load fractal from #ID
      var hash = decodeURI(window.location.href).split("#")[1]; //whole querystring after #
      if (hash) {
        if (hash.length > 20) {
          restored = window.atob(hash);
          if (fractal) restoreFractal();
        } else 
          ajaxReadFile('ss/fractal_get.php?id=' + hash, fractalGet);
      }

      //Session restore:
      refreshSessions();
      //Load formula lists from server
      ajaxReadFile('ss/formula_get.php', loadFormulaeList);
    }

    //Load the last program state
    loadState();

    //Initialise app
    showPanel($('tab1'), 'panel1');
    //Fractal canvas event handling
    var canvas = document.getElementById("fractal-canvas");
    canvas.mouse = new Mouse(canvas, new MouseEventHandler(canvasMouseClick, canvasMouseDown, canvasMouseMove, canvasMouseWheel));
    canvas.mouse.wheelTimer = true;
    defaultMouse = document.mouse = canvas.mouse;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    window.onresize = autoResize;
    window.onbeforeunload = beforeUnload;

    //Create a fractal object
    fractal = new Fractal(canvas, mode);
    fractal.antialias = localStorage["fractured.antialias"] ? parseInt(localStorage["fractured.antialias"]) : 2;
    setAntiAliasMenu();

    //Colour editing and palette management
    colours = new ColourEditor();

    //Draw & update
    if (restored.length > 0)
      restoreFractal();
    else
      loadLastFractal();  //Restore last if any
  }

  //Fractal load from hash
  function fractalGet(data) {
    if (!data || data.indexOf("Error:") == 0) {
      alert("Fractal load failed!");
      return;
    }

    restored = data;
    if (fractal)
      restoreFractal();
    //If not yet ready, defer load until later
  }

  //session JSON received
  function sessionGet(data) {
    if (!data || data.indexOf("Error") == 0) {
      //Offline mode?
      consoleWrite('Offline!');
      offline = true;
      return;
    }
    offline = false;

    //First attempt to load a stored login session if available
    consoleDebug("Session response: " + data + "<hr>");

    var usermenu = document.getElementById('session_user_menu');
    var loginmenu = document.getElementById('session_login_menu');

    //Parse session data
    var session = JSON.parse(data);
    if (session.empty) {
      loginmenu.style.display = 'block';
      usermenu.style.display = 'none';
    } else {
      //Have an active session user
      loginmenu.style.display = 'none';
      usermenu.style.display = 'block';
      //Load list of saved states/sessions
      try {
        //Get selected id 
        currentSession = parseInt(localStorage["fractured.currentSession"]);

        //Clear & repopulate list
        var menu = document.getElementById('sessions');
        removeChildren(menu);
        var list = JSON.parse(data);
        for (var i=0; i<list.length; i++) {
          var label = list[i].date + "\n" + list[i].description;
          var onclick = Function("loadSession(" + list[i].id + ")");
          addMenuItem(menu, label, onclick, currentSession == list[i].id ? "selected_item" : null, true);
        }
        checkMenuHasItems(menu);

        if (currentSession) {
          //Have a saved session #, get the data
          ajaxReadFile('ss/setvariable.php?name=session_id?value=' + currentSession);
        }
      } catch(e) {
        alert('LoadSessionList: Error! ' + e);
      }
    }
  }

  function restoreFractal() {
    if (restored.length > 0) {
      var lines = restored.split("\n"); // split on newlines
      var name = lines[0];
      lines.splice(0,1);
      fractal.load(lines.join('\n'));
      restored = "";
      fractal.name = name;
      $('nameInput').value = fractal.name;
    }
  }

  function setAntiAlias(val) {
    if (!val) val = prompt('Enter quality (1-16) Higher values may be very slow!');
    if (val && val > 0 && val <= 16) {
      fractal.antialias = val;
      localStorage["fractured.antialias"] = fractal.antialias;
      setAntiAliasMenu();
      fractal.draw();
consoleDebug("draw: antialias");
    }
  }

  function setAntiAliasMenu() {
    if (!fractal.antialias) fractal.antialias = 1;
    $('aa1').className = fractal.antialias == 1 ? 'selected_item' : '';
    $('aa2').className = fractal.antialias == 2 ? 'selected_item' : '';
    $('aa3').className = fractal.antialias == 3 ? 'selected_item' : '';
    $('aa4').className = fractal.antialias > 3 ? 'selected_item' : '';
  }

/////////////////////////////////////////////////////////////////////////
//Save/load in local storage
  function supports_html5_storage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  function deleteFractal() {
    if (currentFractal >= 0) {
      var idx = currentFractal;
      var name = localStorage["fractured.names." + idx];
      if (!name || !confirm('Really delete the fractal: "' + name + '"')) return;
      try {
        localStorage.removeItem("fractured.names." + idx);
        localStorage.removeItem("fractured.fractal." + idx);
        localStorage.removeItem("fractured.thumbnail." + idx);
        currentFractal = localStorage["fractured.currentFractal"] = -1;
        populateFractals();
      } catch(e) {
        alert('Storage delete error! ' + e);
      }
    }
  }

  //Menu management functions...
  function removeChildren(element) {
    if (element.hasChildNodes()) {
      while (element.childNodes.length > 0 )
      element.removeChild(element.firstChild);
    }
  }

  function addMenuItem(menu, label, onclick, classname, atstart) {
    var entry = document.createElement("li");
    var span = document.createElement("span");
    if (classname)
      entry.className = classname;
    span.onclick = onclick;
    span.appendChild(span.ownerDocument.createTextNode(label));
    entry.appendChild(span);
    if (atstart)
      menu.insertBefore(entry, menu.firstChild);
    else
      menu.appendChild(entry);
    //Return span so any additional controls can be added
    return span;
  }

  function checkMenuHasItems(menu) {
    if (!menu.hasChildNodes()) {
      var entry = document.createElement("li");
      entry.appendChild(entry.ownerDocument.createTextNode("(empty)"));
      menu.appendChild(entry);
    }
  }

  function populateFractals() {
    //Clear & repopulate list
    var menu = document.getElementById('fractals');
    removeChildren(menu);
    var idx_str = localStorage["fractured.fractals"];
    if (idx_str) {
      var idx = parseInt(idx_str);
      for (var i=1; i<=idx; i++) {
        var namestr = localStorage["fractured.names." + i];
        if (!namestr) continue; //namestr = "unnamed";
        var source = localStorage["fractured.fractal." + i];
        var onclick = Function("selectedFractal(" + i + ")");
        var span = addMenuItem(menu, namestr, onclick, currentFractal == i ? "selected_item" : null, true);
        if (localStorage["fractured.thumbnail." + i]) {
          //localStorage.removeItem("fractured.thumbnail." + i);
          var img = new Image;
          img.src = localStorage["fractured.thumbnail." + i];
          img.className = "thumb";
          span.appendChild(img);
        }
      }
    }
    checkMenuHasItems(menu);
  }

  function selectedFractal(idx) {
    localStorage["fractured.currentFractal"] = currentFractal = idx;
    fractal.load(localStorage["fractured.fractal." + idx]);
    fractal.name = localStorage["fractured.names." + idx];
    $('nameInput').value = fractal.name;
        //Generate thumbnails on select!
        if (!localStorage["fractured.thumbnail." + idx])
            localStorage["fractured.thumbnail." + idx] = thumbnail();
    populateFractals();
  }

  function newFractal() {
    fractal.resetDefaults();
    fractal.formulaDefaults();
    fractal.copyToForm();
    //De-select
    currentFractal = -1;
    populateFractals();
    fractal.applyChanges();
  }

  function saveFractal() {
    fractal.applyChanges();
    source = fractal + "";
    //Save current fractal to list
    if (!supports_html5_storage()) return;
    if (currentFractal >= 0) {
      //Save existing
      var name = localStorage["fractured.names." + currentFractal];
      if (name == fractal.name) {
        if (confirm('Overwrite "' + name + '"?')) {
          var idx = currentFractal;
          try {
            localStorage["fractured.names." + idx] = fractal.name; //namestr;
            localStorage["fractured.fractal." + idx] = source;
            localStorage["fractured.thumbnail." + idx] = thumbnail();
            populateFractals();
          } catch(e) {
            alert('Storage error! ' + e);
          }
          return;
        }
      }
    }

    //Save new
    var idx_str = localStorage["fractured.fractals"];
    var idx = (idx_str ? parseInt(idx_str) : 0);
    //Get name and check list for dupes
    var namestr = fractal.name;
    if (!namestr) namestr = "unnamed";
    var add = 0;
    var checkstr = namestr;
    var i;
    do {
       for (i=0; i<=idx; i++) {
          if (checkstr == localStorage["fractured.names." + i]) {
             checkstr = namestr + (++add);
             break;
          }
       }
    } while (i <= idx);
    if (namestr != checkstr && !confirm('Save as "' + checkstr + '"?')) return;
    if (namestr == checkstr && !confirm('Save new fractal as "' + namestr + '"?')) return;
    namestr = checkstr;
    idx++;  //Increment index
    try {
      localStorage["fractured.names." + idx] = namestr;
      localStorage["fractured.fractal." + idx] = source;
      localStorage["fractured.thumbnail." + idx] = thumbnail();
      localStorage["fractured.fractals"] = idx;
      localStorage["fractured.currentFractal"] = currentFractal = idx;
      $('nameInput').value = namestr;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Storage error! ' + e);
      //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
    }
    populateFractals();
  }

  function thumbnail(type, size) {
   //Thumbnail image gen
   if (type == undefined) type = "png";
   if (size == undefined) size = 40;
   var canvas = document.getElementById("fractal-canvas");

   //*
      var oldh = fractal.height;
      var oldw = fractal.width;
      var oldaa = fractal.antialias;
      fractal.width = fractal.height = size;
      fractal.draw(6);
consoleDebug("draw: thumb");

   var result = canvas.toDataURL("image/" + type)

      fractal.antialias = oldaa;
      fractal.width = oldw;
      fractal.height = oldh;
      fractal.draw();
consoleDebug("draw: thumb2");
/*/
 // Thumb generated by browser in canvas, badly aliased?
   var thumb = document.getElementById("thumb");
   thumb.style.visibility='visible';
   var context = thumb.getContext('2d');  
   context.drawImage(canvas, 0, 0, thumb.width, thumb.height);
   var result = thumb.toDataURL("image/jpeg")
   thumb.style.visibility='hidden';

//*/
   return result;
  }

  function resetState(noconfirm) {
    if (noconfirm || confirm('This will clear everything!')) {
      localStorage.clear(); //be careful as this will clear the entire database
      sources = default_sources;  //Reset sources
      if (!offline)
        ajaxReadFile('ss/setvariable.php?name=session_id?value=0', refreshSessions);
      loadState();
        colours.read(); //Palette reset
      newFractal();
      currentSession = 0;  //No sessions to select
      currentFormulae = 0;  //No sessions to select
      currentFractal = -1;  //No fractals to select
      //window.location.reload(false);
      window.onbeforeunload = null;
    }
  }

  function refreshSessions() {
    ajaxReadFile('ss/session_get.php', sessionGet); //Get updated list...
  }

  //Import/export all local storage to server
  function uploadState() {
    var data = "session_id=" + (currentSession ? currentSession : 0);
    if (currentSession > 0 && confirm('Save changes to this session on server?')) {
      //Update existing
    } else {
      var desc = prompt("Enter description for new session");
      if (!desc || desc.length == 0) return;
      data += "&description=" + encodeURIComponent(desc);
    }

    data += "&data=" + encodeURIComponent(getState());
    progress("Uploading session to server...");
    ajaxPost("ss/session_save.php", data, sessionSaved, updateProgress);
  }

  function sessionSaved(data) {
    localStorage['fractured.currentSession'] = data;
    refreshSessions();
    progress();
  }

  function uploadFractalFile() {
    fractal.applyChanges();
    var data = "public=" + confirm("Publish on website after uploading?");
    data += "&description=" + encodeURIComponent($('nameInput').value);
    data += "&thumbnail=" + encodeURIComponent(thumbnail("jpeg", 150).substring(23));
    data += "&source=" + encodeURIComponent(fractal.toString(true));
    progress("Uploading fractal to server...");
    ajaxPost("ss/fractal_save.php", data, fractalUploaded, updateProgress);
  }

  function fractalUploaded(url) {
    var link = document.createElement("a");
    link.setAttribute("href", url);
    var linkText = document.createTextNode(url);
    link.appendChild(linkText);

    $("progressstatus").innerHTML = "";
    $("progressmessage").innerHTML = "";
    $("progressmessage").appendChild(link);
    $S("progressbar").width = "300px";
  }

  function packFractal() {
    fractal.applyChanges();
    var data = window.btoa($('nameInput').value + "\n" + fractal.toString(true));
    window.location = "/#" + data
    window.location.reload(false);
  }

  function uploadFormulaFile(shared) {
    var data = "public=" + shared;
    if (shared == 0 && currentFormulae > 0) {
      //Update existing (selected)
      if (!confirm('Save changes to this formula set on server?')) return;
      data += "&formulae=" + currentFormulae;
    } else {
      var name = prompt("Enter name for formula set");
      if (name == null) return;
      data += "&name=" + encodeURIComponent(name);
    }

    data += "&data=" + encodeURIComponent(JSON.stringify(formula_list));
    progress("Uploading formulae to server...");
    ajaxPost("ss/formula_save.php", data, formulaeSaved, updateProgress);
  }

  function formulaeSaved(response) {
    var id = parseInt(response);
    if (id > 0)
      currentFormulae = localStorage["fractured.currentFormulae"] = id;
    else
      alert("Formula save error: " + response);

    //Refresh list
    ajaxReadFile('ss/formula_get.php', loadFormulaeList);
    progress();
  }

  //Import/export all local storage to a text file
  function exportStateFile() {
    //data url version, always use for now for session state as quicker than server round trip
    location.href = 'data:text/fractal-workspace;base64,' + window.btoa(getState());
    return;
    
    var d=new Date();
    var fname = "workspace " + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + ".fractured";
    exportFile(fname, "text/fractal-workspace", getState());
  }

  function exportFractalFile() {
    fractal.applyChanges();
    source = fractal.toString(true);  //Save formulae when exporting
    exportFile(fractal.name + ".fractal", "text/fractal-source", source);
  }

  function exportFile(filename, content, data) {
    if (offline) {
      //Export using data URL
      location.href = 'data:' + content + ';base64,' + window.btoa(data);
      return;
    }

    //Export using server side script to get proper filename
    var fField = document.getElementById("export-filename");
    fField.setAttribute("value", filename);

    var cField = document.getElementById("export-content");
    cField.setAttribute("value", content);

    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "data");
    hiddenField.setAttribute("value", data);

    var form = document.forms["exporter"];
    form.appendChild(hiddenField);
    form.submit();
    form.removeChild(hiddenField);
  }

  function loadFormulaeList(data) {
    //Load list of saved formula sets from server
    try {
      //Get selected id 
      currentFormulae = parseInt(localStorage["fractured.currentFormulae"]);

      //Clear & repopulate list
      var menu1 = document.getElementById('formulae-public');
      var menu2 = document.getElementById('formulae-private');
      removeChildren(menu1);
      removeChildren(menu2);
      var list = JSON.parse(data);
      for (var i=0; i<list.length; i++) {
        var label = list[i].date + "\n" + list[i].name;
        var onclick = Function("loadFormulaSet(" + list[i].id + ")");
        if (list[i]["public"] == "1")
          addMenuItem(menu1, label, onclick, currentFormulae == list[i].id ? "selected_item" : null);
        else
          addMenuItem(menu2, label, onclick, currentFormulae == list[i].id ? "selected_item" : null);
      }
      checkMenuHasItems(menu1);
      checkMenuHasItems(menu2);
    } catch(e) {
      alert('LoadFormulaeList: Error! ' + e);
    }
  }

  function loadFormulaSet(id) {
    if (!confirm('Loading new formula set. This will overwrite currently loaded formulae!')) return;
    localStorage["fractured.currentFormulae"] = currentFormulae = id;
    ajaxReadFile('ss/formula_get.php?id=' + id, importFormulae);
    //Repopulate menu (so selected set)
    ajaxReadFile('ss/formula_get.php', loadFormulaeList);
  }

  function importFormulae(data) {
    var parsed = JSON.parse(data);
    if (!parsed) return;
    try {
      //localStorage['formula_list'] = parsed;
      formula_list = parsed; //localStorage["fractured.formula"]);
      //Create formula entries in drop-downs (and any saved load sources)
      updateFormulaLists();
      fractal.copyToForm();  //Update selections
      fractal.reselectAll();
    } catch(e) {
      alert('ImportFormulae: Error! ' + e);
    }
  }

  function deleteSelectedFormulae()
  {
    if (currentFormulae && confirm('Delete this formula set from the server?')) {
      ajaxReadFile('ss/formula_delete.php?id=' + currentFormulae, refreshFormulae);
      currentFormulae = localStorage["fractured.currentFormulae"] = 0;
    }
  }

  function refreshFormulae() {
    //Load formula lists from server
    ajaxReadFile('ss/formula_get.php', loadFormulaeList);
  }

  function loadSession(id)
  {
    if (!confirm('Loading new session. This will overwrite everything!')) return;
    currentSession = id;
    ajaxReadFile('ss/session_get.php?id=' + id, importState, false, updateProgress);
    progress("Downloading session from server...");
  }

  function deleteSelectedState()
  {
    if (currentSession && confirm('Delete this session from the server?')) {
      ajaxReadFile('ss/session_delete.php?id=' + currentSession, refreshSessions);
      currentSession = localStorage["fractured.currentSession"] = 0;
    }
  }

  function reloadWindow(temp)
  {
    //alert("AJAX RESULT: " + temp);
    window.location.reload(false);
  }

  function getState() {
    //Get current state in local storage minus session/login details
    var session = localStorage["fractured.currentSession"];
    var formulae = localStorage["fractured.currentFormulae"];
    delete localStorage["fractured.currentSession"];
    delete localStorage["fractured.currentFormulae"];
      //Save current fractal (as default)
      localStorage["fractured.active"] = fractal;
      localStorage["fractured.name"] = fractal.name;
    var source = JSON.stringify(localStorage);
    localStorage["fractured.currentSession"] = session;
    localStorage["fractured.currentFormulae"] = formulae;
    return source;
  }

  function importState(source) {
    try {
      var parsed = JSON.parse(source);
      if (!parsed) return;
      localStorage.clear(); //clear the entire database
      for (key in parsed)
        localStorage[key] = parsed[key];
      //Replace session id, not saved in state data
      localStorage["fractured.currentSession"] = currentSession;
      localStorage["fractured.currentFormulae"] = currentFormulae;
      refreshSessions();
      loadState();
      loadLastFractal();
      progress();
      //window.location.reload(false);
    } catch(e) {
      alert('ImportState: Error! ' + e);
    }
  }

  function loadState() {
    //Load formulae from local storage (or defaults if not found)
    var f_source = localStorage["fractured.formulae"];
    if (f_source && f_source.length < 400) f_source = null; //Old formula list
    if (f_source) {
         //HACK!! TODO: remove
         f_source = f_source.replace(/primes/g, "integers");
      formula_list = JSON.parse(f_source); //localStorage["fractured.formula"]);
    } else
      formula_list = default_formula_list;  //From bootstrap.js

    //Custom mouse actions
    a_source = localStorage["fractured.mouseActions"];
    if (a_source)
      mouseActions = JSON.parse(a_source);
    else
      defaultMouseActions();

    //Create formula entries in drop-downs (and any saved load sources)
    updateFormulaLists();

    //Default script
    if (localStorage["include/script.js"]) sources["include/script.js"] = localStorage["include/script.js"];

    //Get list of saved fractals
    if (!supports_html5_storage()) return;

    //Get selected id 
    currentFractal = parseInt(localStorage["fractured.currentFractal"]);

    populateFractals();

    //Show an indicator, assumes 5mb of local storage
    var size = JSON.stringify(localStorage).length;
    var indic = size / 5000000;
        //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
    $S('indicator').width = (350 * indic) + 'px';
        //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
  }

  function loadLastFractal() {
    //Load current fractal (as default)
    var source = localStorage["fractured.active"];
    if (source) {
      fractal.load(source);
      fractal.name = localStorage["fractured.name"];
      $('nameInput').value = fractal.name;
    } else {
      //Draw default
      fractal.applyChanges();
    }
  }

  function saveState() {
    //Read the lists
    try {
      //Save custom mouse actions
      localStorage["fractured.mouseActions"] = JSON.stringify(mouseActions);
      //Save formulae
      localStorage["fractured.formulae"] = JSON.stringify(formula_list);
      //Save script
      localStorage["include/script.js"] = sources["include/script.js"];
      //Save current fractal (as default)
      localStorage["fractured.active"] = fractal;
      localStorage["fractured.name"] = fractal.name;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Quota exceeded! ' + e);
    }
  }

/////////////////////////////////////////////////////////////////////////
////Tab controls
  var panels = ['panel1', 'panel2', 'panel3', 'panel4'];
  var selectedTab = null;
  function showPanel(tab, name)
  {
    if (!selectedTab) selectedTab = $('tab1');

    selectedTab.className = 'unselected';
    selectedTab = tab;
    selectedTab.className = 'selected';

    for(i = 0; i < panels.length; i++)
      document.getElementById(panels[i]).style.display = (name == panels[i]) ? 'block':'none';

    //Resize expression edit fields
    if (name == "panel2") growTextAreas('fractal_inputs');
    if (name == "panel3") growTextAreas('colour_inputs');
    return false;
  }

  function growTextAreas(form_id) {
    var elem = $(form_id).elements;
    for(var i = 0; i < elem.length; i++)
      if (elem[i].type == 'textarea') grow(elem[i]);
  }

  function grow(textarea) {
    // Value of the line-height CSS property for the textarea.
    var newHeight = textarea.scrollHeight;
    var currentHeight = textarea.clientHeight;
    if (newHeight > currentHeight)
       textarea.style.height = newHeight + "px";
  }

  function toggleParams() {
    var sidebar = document.getElementById("sidebar");
    var main = document.getElementById("main");
    if (sidebar.style.display == 'none') {
      sidebar.style.display = 'block';
      main.style.left = '386px';
      $('toolsbtn').innerHTML = "Hide Tools &uarr;"
    } else {
      sidebar.style.display = 'none';
      main.style.left = '1px';
      $('toolsbtn').innerHTML = "Show Tools &darr;"
    }
    showparams = (sidebar.style.display == 'block');
    autoResize(document["inputs"].elements["autosize"].checked);
  }

  //Show/hide on click
  function toggle(id) {
    var el = $(id);
    if (el.style.display == 'block')
      el.style.display = 'none';
    else
      el.style.display = 'block';
  }

  function popup(text) {
    var el = $('popup');
    if (el.style.display == 'block')
      el.style.display = 'none';
    else {
      $('popupmessage').innerHTML = text;
      el.style.display = 'block';
    }
  }

  function progress(text) {
    var el = $('progress');
    if (el.style.display == 'block')
      //rel.style.display = 'none';
      setTimeout("$('progress').style.display = 'none';", 150);
    else {
      $('progressmessage').innerHTML = text;
      $('progressstatus').innerHTML = "0%";
      $S('progressbar').width = 0;
      el.style.display = 'block';
    }
  }

  function login(id) {
    if (id) {
      var id_field = document.getElementById("openid");
      id_field.setAttribute("value", id);
    }
    var form = document.forms["login_form"];
    form.submit();
  }

  function logout() {
    delete localStorage['fractured.currentSession']
    delete localStorage['fractured.currentFormulae']
    delete localStorage['fractured.currentFractal']
    if (confirm("Clear current session after logout?"))
      resetState(true);
    ajaxReadFile('ss/logout.php', reloadWindow);
  }

/////////////////////////////////////////////////////////////////////////
//Event handling

  function autoResize(newval) {
    if (rztimeout) clearTimeout(rztimeout);
    var timer = false;
    //If value passed, setting autoSize, otherwise responding to resize event
    if (typeof(newval) == 'boolean')
      consoleDebug("Autosize " + newval);
    else
      timer = true;

    if (timer && document["inputs"].elements["autosize"].checked == true) {
      document.body.style.cursor = "wait";
      rztimeout = setTimeout('fractal.applyChanges(); document.body.style.cursor = "default";', 150);
      return;
    }
    //Update width/height immediately
    fractal.applyChanges();
  }

  function beforeUnload(event) {
    //This event works in webkit but doesn't allow interaction, always save for now
    saveState();
    return null; //"beforeUnload";
  }

//Fractal canvas mouse event handling
  function getCustomAction(event, button) {
    var action = null;
    if (!button) {
      if (event.button == 1) button = "middle";
      else if (event.button == 2) button = "right";
      else button = "left";
    }

    if (event.shiftKey && event.altKey && event.ctrlKey) {
      action = mouseActions[button]["shift+ctrl+alt"];
    } else if (event.shiftKey && event.altKey) {
      action = mouseActions[button]["shift+alt"];
    } else if (event.shiftKey && event.ctrlKey) {
      action = mouseActions[button]["shift+ctrl"];
    } else if (event.altKey && event.ctrlKey) {
      action = mouseActions[button]["ctrl+alt"];
    } else if (event.ctrlKey) {
      action = mouseActions[button]["ctrl"];
    } else if (event.shiftKey) {
      action = mouseActions[button]["shift"];
    } else if (event.altKey) {
      action = mouseActions[button]["alt"];
    }

    return action;
  }

  function canvasMouseClick(event, mouse) {
    var select = document.getElementById("select");

    //Convert mouse coords into fractal coords
    var point = fractal.origin.convert(mouse.x, mouse.y, mouse.element);

    var action = getCustomAction(event);

    if (action) {
      //Set point to assigned field
      if ($(action + "0")) {
        $(action + "0").value = point.re;
        $(action + "1").value = point.im;
        fractal.applyChanges();
      }
    } else {
      //Selection box?
      if (select.style.display == 'block') {

        //Ignore if too small a region selected
        if (select.w > 5 && select.h > 5) {
          //Get element offset in document
          var offset = findElementPos(mouse.element);
          //Convert coords to position relative to element
          select.x -= offset[0];
          select.y -= offset[1];
          //Get centre of selection in fractal coords
          var centre = fractal.origin.convert(select.x + select.w/2, select.y + select.h/2, mouse.element);
          //Adjust centre position to match mouse left click
          fractal.setOrigin(centre);
          //Adjust zoom by factor of element width to selection
          fractal.applyZoom(mouse.element.width / select.w);
        }
      } else if (event.button == 0) {
        //Adjust centre position to match mouse left click
        fractal.setOrigin(point);
      } else if (event.button > 0) {
        //Right-click, not dragging
        if (event.button == 2 && !mouse.dragged) {
          //Enable the context menu on right click if ctrl+alt+shift held
          if (event.shiftKey && event.altKey && event.ctrlKey) {
            enableContext = true;
            return true;
          }
          //Switch to julia set at selected point
          fractal.selectPoint(point);
        } else {
          return true;
        }
      }
    }

    select.style.display = 'none';
    fractal.copyToForm();
consoleDebug("draw: mouse");
    fractal.draw();
  }

  function canvasMouseDown(event, mouse) {
    return false;
  }

  function canvasMouseMove(event, mouse) {
    //Mouseover processing
    if (!fractal) return true;
    if (mouse.x >= 0 && mouse.y >= 0 && mouse.x <= mouse.element.width && mouse.y <= mouse.element.height)
    {
      //Convert mouse coords into fractal coords
      var point = fractal.origin.convert(mouse.x, mouse.y, mouse.element);
      point.re += fractal.origin.re;
      point.im += fractal.origin.im;
      document.getElementById("coords").innerHTML = "&nbsp;re: " + point.re.toFixed(8) + " im: " + point.im.toFixed(8);
    }
    if (!mouse.isdown) return true;

    //Right & middle buttons: drag to scroll
    if (mouse.button > 0) {
      // Set the scroll position
      window.scrollBy(-mouse.deltaX, -mouse.deltaY);
      return true;
    }

    //Drag processing
    var select = document.getElementById("select");
    select.style.display = 'block';

    //Constrain selection size to canvas aspect ratio
    select.w = Math.abs(mouse.deltaX)
    var ratio = mouse.element.width / select.w;
    select.h = mouse.element.height / ratio;

    if (mouse.deltaX < 0)
      select.x = mouse.absoluteX;
    else
      select.x = mouse.absoluteX - select.w;

    if (mouse.deltaY < 0)
      select.y = mouse.lastY - select.h;
    else
      select.y = mouse.lastY;

    //Copy to style to set positions
    select.style.left = select.x + "px";
    select.style.top = select.y + "px";
    select.style.width = select.w + "px";
    select.style.height = select.h + "px";

    document.getElementById("coords").innerHTML = select.style.width + "," + select.style.height;
  }

  function canvasMouseWheel(event, mouse) {
    var action = getCustomAction(event, "wheel");
    //alert(action.id);
    if (!(event.shiftKey || event.altKey || event.ctrlKey)) {
      // Zoom
      action = new WheelAction(null, 0);
      if (event.spin < 0)
         fractal.applyZoom(1/(-event.spin * 1.1));
      else
         fractal.applyZoom(event.spin * 1.1);
      //Update form fields
      fractal.copyToForm();
    }

    if (!action) return true; //Default browser action

    //Assign field value
    if (action.id && $(action.id))
      $(action.id).value = parseReal($(action.id).value, 1) + event.spin * action.value;

    fractal.applyChanges();
  }

  function bgColourMouseClick() {
    colours.edit(0, $("backgroundBG").offsetLeft, 30);
  }


/////////////////////////////////////////////////////////////////////////
//Editor windows, data passing, saving & loading

var editorWindow;
var editorFilename;

  function openEditor(filename) {
    if (!filename) return;
    editorFilename = filename;
    editorWindow = window.open(encodeURI("editor.html?file=" + filename), filename, "toolbar=no,scrollbars=no,location=no,statusbar=no,menubar=no,resizable=1,width=600,height=700");
  }

  function hrefImage() {
    var canvas = document.getElementById("fractal-canvas");
    document.location.href = canvas.toDataURL("image/jpeg");
  }

  function saveImageJPEG() {
    var canvas = document.getElementById("fractal-canvas");
    //window.open(canvas.toDataURL());
    //window.open(canvas.toDataURL("image/jpeg"));
    //addImage(canvas.toDataURL("image/png"));
    exportFile(fractal.name + ".jpg", "jpeg", canvas.toDataURL("image/jpeg"));
  }

  function saveImagePNG() {
    var canvas = document.getElementById("fractal-canvas");
    //window.open(canvas.toDataURL("image/png"));
    exportFile(fractal.name + ".png", "png", canvas.toDataURL("image/png"));
  }

  function addImage(url){
    var img = document.createElement('img');
    //img.setAttribute("width", "100");  
    document.getElementById('image').appendChild(img);
    img.src = url;
  }

/////////////////////////////////////////////////////////////////////////
//Colour picker functions

function handleFormMouseDown(event) {
  //Event delegation from parameters form to edit colour params
  event = event || window.event;
  if (event.target.className == "colour") colours.edit(event.target);
  if (event.target.type == 'text' || event.target.type == 'number') {
    //Assigning actions to fields? (unfinished?)
    //Parameter values
    var types = ["base", "fractal", "pre_transform", "post_transform", "outside_colour", "inside_colour"];
    for (t in types) {
      var params = fractal[types[t]].currentParams;
      var field;
      if (params)
        field = params.getField(event.target.id);
    }

    //Assign function to selected field
    if (event.shiftKey || event.altKey || event.ctrlKey) {
      var action = "";
      var button = "wheel"
      var target = event.target.id;
      var value = 0;

      if (event.shiftKey && event.altKey && event.ctrlKey) {
        action = "shift+ctrl+alt";
      } else if (event.shiftKey && event.altKey) {
        action = "shift+alt";
      } else if (event.shiftKey && event.ctrlKey) {
        action = "shift+ctrl";
      } else if (event.altKey && event.ctrlKey) {
        action = "ctrl+alt";
      } else if (event.ctrlKey) {
        action = "ctrl";
      } else if (event.shiftKey) {
        action = "shift";
      } else if (event.altKey) {
        action = "alt";
      }

      //Detect two-component (complex number) field
      if (/_[01]$/i.exec(event.target.id)) {
        if (event.button == 0) button = "left";
        else if (event.button == 2) button = "right";
        else button = "middle";
        target = event.target.id.slice(0, event.target.id.length-1);
        if (confirm("Assign position value on [" + action + "] + mouse " + button + "-click to selected field?"))
          mouseActions[button][action] = target;
        else {
          var value = prompt("Assign action on mouse scroll wheel + [" + action + "] to selected field. Enter increment value or 0 to cancel", 0.1);
          if (value) mouseActions["wheel"][action] = new WheelAction(event.target.id, value);
          return false;
        }

      } else {
        //Get increment amount for scroll wheel actions...
        var value = prompt("Assigning action on mouse scroll wheel + [" + action + "] to selected field. Enter increment value or 0 to cancel", 1);
        if (value) mouseActions["wheel"][action] = new WheelAction(target, value);
        return false;
      }
    }
  }
  return true;
}

function saveColour(val) {colours.save(val);}
function abortColour() {colours.cancel();}

/**
 * @constructor
 */
function ColourEditor(gl) {
  this.changed = true;
  this.inserting = false;
  this.editing = -1;
  this.element = null;
  this.picker = new ColourPicker(saveColour, abortColour);
  this.editcanvas = document.getElementById('palette')
  this.gradientcanvas = document.getElementById('gradient')

  //Create default palette object
  this.palette = new Palette();
    ////this.palette.draw(this.editcanvas, true);
  //Event handling for palette
  this.editcanvas.mouse = new Mouse(this.editcanvas, this);
  this.editcanvas.mouse.ignoreScroll = true;
  this.editcanvas.oncontextmenu="return false;";
  this.editcanvas.oncontextmenu = function() { return false; }      
}

//Palette management
ColourEditor.prototype.read = function(source) {
  //Read a new palette from source data
  this.palette = new Palette(source);
  this.reset();
  this.changed = true;
  this.palette.draw(this.editcanvas, true);
}

ColourEditor.prototype.update = function() {
  if (!this.changed) return;
  this.changed = false;
  this.palette.draw(this.editcanvas, true);
  //Update gradient texture
  this.palette.draw(this.gradientcanvas, false);  //WebGL texture size (power of 2)
  fractal.updateTexture();
}

ColourEditor.prototype.savePalette = function() {
  if (!supports_html5_storage()) return;
  try {
    localStorage["fractured.current.palette"] = this.palette.toString();
  } catch(e) {
    //data wasn’t successfully saved due to quota exceed so throw an error
    alert('Quota exceeded! ' + e);
  }
}

ColourEditor.prototype.loadPalette = function() {
  if (!supports_html5_storage()) return;
  read(localStorage["fractured.current.palette"]);
}

ColourEditor.prototype.insert = function(position, x, y) {
  //Flag unsaved new colour
  this.inserting = true;
  var col = new Colour();
  this.editing = this.palette.newColour(position, col)
  this.palette.draw(this.editcanvas, true);
  //Edit new colour
  this.picker.pick(col, x, y);
  this.changed = true;
}

ColourEditor.prototype.edit = function(val, x, y) {
  if (typeof(val) == 'number') {
    this.editing = val;
    this.picker.pick(this.palette.colours[val].colour, x, y);
  } else if (typeof(val) == 'object') {
    //Edit element
    this.cancel();  //Abort any current edit first
    this.element = val;
    var col = new Colour(val.style.backgroundColor)
    this.picker.pick(col, val.offsetLeft, val.offsetTop);
  }
  this.changed = true;
}

ColourEditor.prototype.save = function(val) {
  if (this.editing >= 0)
  {
    //Update colour with selected
    this.palette.colours[this.editing].colour.setHSV(val);
    this.palette.draw(this.editcanvas, true);
  }
  else if (this.element) {
    var col = new Colour(0);
    col.setHSV(val);
    this.element.style.backgroundColor = col.html();
  }
  this.reset();
  this.changed = true;
}

ColourEditor.prototype.cancel = function() {
  //If aborting a new colour add, delete it
  if (this.editing >= 0 && this.inserting)
  {
    this.palette.remove(this.editing);
    this.palette.draw(this.editcanvas, true);
  }
  this.reset();
  this.changed = true;
}

ColourEditor.prototype.reset = function() {
  //Reset editing data
  this.inserting = false;
  this.editing = -1;
  this.element = null;
}

//Mouse event handling
ColourEditor.prototype.click = function(event, mouse) {
  this.changed = true;
  if (event.ctrlKey) {
    //Flip
    for (var i = 1; i < this.palette.colours.length; i++)
      this.palette.colours[i].position = 1.0 - this.palette.colours[i].position;
    this.palette.draw(this.editcanvas, true);
    return false;
  }

  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  if (mouse.slider != null)
  {
    //Slider moved, update texture
    mouse.slider = null;
    this.palette.draw(this.editcanvas, true);
    return false;
  }
  var pal = document.getElementById('palette');
  if (pal.getContext){
    this.cancel();  //Abort any current edit first
    var context = pal.getContext('2d'); 
    var slider = document.getElementById("slider");

    //Get selected colour
    var i = this.palette.inRange(mouse.x, slider.width, pal.width);
    if (i > 0) {
      if (event.button == 0) {
        //Edit colour on left click
        this.edit(i, event.clientX-128, 30);
      } else if (event.button == 2) {
        //Delete on right click
        this.palette.remove(i);
        this.palette.draw(this.editcanvas, true);
      }
    } else {
      //Clicked elsewhere, add new colour
      this.insert(mouse.x / pal.width, event.clientX-128, 30);
    }
  }
  return false;
}

ColourEditor.prototype.down = function(event, mouse) {
   return false;
}

ColourEditor.prototype.move = function(event, mouse) {
  if (!mouse.isdown) return true;

  //Use non-scrolling position
  mouse.x = mouse.clientx;
  mouse.x = mouse.clientx;

  var slider = document.getElementById("slider");

  if (mouse.slider == null) {
    //Colour slider dragged on?
    var i = this.palette.inDragRange(mouse.x, slider.width, this.editcanvas.width);
    if (i>1) mouse.slider = i;
  }

  if (mouse.slider == null)
    mouse.isdown = false; //Abort action if not on slider
  else {
    if (mouse.x < 1) mouse.x = 1;
    if (mouse.x > this.editcanvas.width-1) mouse.x = this.editcanvas.width-1;
    //Move to adjusted position and redraw
    this.palette.colours[mouse.slider].position = mouse.x / this.editcanvas.width;
    this.palette.draw(this.editcanvas, true);
  }
}

ColourEditor.prototype.wheel = function(event, mouse) {
  //If shift held, redraw after change
  this.changed = true;
  this.cycle(0.01 * event.spin, event.shiftKey);
}

ColourEditor.prototype.cycle = function(inc, update) {
  //Shift all colours cyclically
  for (var i = 2; i < this.palette.colours.length-1; i++)
  {
    var x = this.palette.colours[i].position;
    x += inc;
    if (x <= 0) x += 1.0;
    if (x >= 1.0) x -= 1.0;
    this.palette.colours[i].position = x;
  }
  this.palette.draw(this.editcanvas, true);
  if (update) {
    this.update();
    fractal.draw();
consoleDebug("draw: pcycle");
  }
}

/////////////////////////////////////////////////////////////////////////
//File upload handling
function fileSelected(files) {
  var callback = loadFile;
  if (filetype == 'palette') callback = fractal.loadPalette;
  if (filetype == 'formula') callback = fractal.importFormula;
  if (filetype == 'session') {
    if (!confirm('Loading new session. This will overwrite everything!')) return;
    callback = importState;
  }
  filesProcess(files, callback);
}

function filesProcess(files, callback) {
  // Check for the various File API support.
  if (window.File && window.FileReader) { // && window.FileList) {
    //All required File APIs are supported.
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      //User html5 fileReader api (works offline)
      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(file) {
        return function(e) {
          //alert(e.target.result);
          callback(e.target.result, file.name);
        };
      })(file);

      // Read in the file (AsText/AsDataURL/AsArrayBuffer/AsBinaryString)
      reader.readAsText(file);
    }
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function loadFile(source, filename) {
  if (filename.indexOf(".ini") > -1) {
    fractal.iniLoader(source);
    filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
    fractal.applyChanges();
  } else {
    fractal.load(source);
  }
  //$("namelabel").value = filename.substr(0, filename.lastIndexOf('.')) || filename;
  fractal.name = filename.substr(0, filename.lastIndexOf('.')) || filename;
  $('nameInput').value = fractal.name;
}

