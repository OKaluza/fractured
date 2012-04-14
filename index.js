//TODO:
//Write help screen
//Allow disabling of thumbnails (set size?)
//Save/load session - slow, needs status or no reload
//Clear-actions doesn't work!
//Check: that error reporting works in WebCL mode
//Move "clear" option to fractal menu as "New"
//New session, get logged out? (Maybe only when $SESSION timed out too)
//What happens when fractal file loaded with formula not in lists, should insert new formula
//Define a new formula, then use ?reload - fail
//Select formula, change param, select another formula with same param, value overwritten! (restorevalues) (palette repeat)

//Globals
var reloadsources = false;
var mode = "WebGL";
var fractal;
var defaultMouse;
var colours;
//Source files list
var sources = {};
var labels = {};
var autoSize = true;
var showparams = true;
var hasChanged = false;
var currentSession = 0; //Selected session
var currentFractal = -1; //Selected fractal id
var filetype = 'fractal';
var offline = null;
var recording = false;
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
    consoleWrite("Request sent");
  }

  function runScript(filename) {
    eval(sources["script.js"]);
  }

  function pageStart() {
    showPanel($('tab4'), 'panel4');
    //If debug mode enabled, show extra menus
    var query = decodeURI(window.location.href).split("?")[1]; //whole querystring after ?
    if (query) {
      if (query.indexOf('debug') >= 0) {
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
    var hash = decodeURI(window.location.href).split("#")[1]; //whole querystring after #
    if (hash) {
      ajaxReadFile('db/fractal_get.php?id=' + hash, fractalGet);
    }

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList) {
      // Great success! All required File APIs are supported.
    } else {
      consoleWrite('The File APIs are not fully supported in this browser.');
    }

    //Get shader source files on server
    sources["shaders/glsl-header.frag"] = "";
    sources["shaders/opencl-header.cl"] = "";
    sources["shaders/complex-header.frag"] = "";
    sources["shaders/fractal-shader.frag"] = "";
    sources["shaders/complex-math.frag"] = "";
    sources["shaders/shader2d.vert"] = "";

    //Base parameters for all formulae defined in here
    sources["formulae/base.base.formula"] = "";

    //Script
    sources["script.js"] = "";

    //Session to json:
    ajaxReadFile('session_json.php', sessionGet);

    //Load the last program state
    loadState();
    //Load the content from files
    loadSources();
  }

  //Fractal load from hash
  function fractalGet(data) {
    if (!data || data.indexOf("Error:") == 0) {
      alert("Fractal load failed!");
      return;
    }

    //if (fractal) {
    //  fractal.load(data);
    //  autoResize(autoSize);
    //} else
      restored = data;

  }

  //Login session JSON received, load session_menu.php
  function sessionGet(data) {
    if (!data || data.indexOf("Error:") == 0) {
      //Offline mode?
      consoleWrite('Offline!');
      offline = true;
      return;
    }
    offline = false;

    var currentLogin = JSON.parse(data);
    var code = currentLogin.code; //Random
    if (currentLogin.id && currentLogin.id.length == 64) {
      //Have an active login, save and continue
      //  consoleWrite("Login retrieved from session: " + data);
      localStorage['fractured.currentLogin'] = data;
    } else {
      //First attempt to load a stored login session if available
      if (localStorage["fractured.currentLogin"]) {
        //consoleWrite('Loading stored login : ' + localStorage["fractured.currentLogin"]);
        currentLogin = JSON.parse(localStorage["fractured.currentLogin"]);
        if (currentLogin.id && currentLogin.id.length == 64) {
          //Hash the once-off code with the login id
          var hash = SHA256(currentLogin.id + code);
          ajaxPost('db/login_get.php', 'user=' + currentLogin.user + '&hash=' + hash, setLogin);
          return;
        }
      }
    }

    //Load and insert session details
    ajaxReadFile('session_menu.php', sessionLoaded);
  }

  function setLogin(data) {
    //consoleWrite("login_get response: " + data);
    //Called with result from ajax login query
    if (data && data.length > 0) {
      //consoleWrite("Saved login, new Login received from server: " + data)
      localStorage['fractured.currentLogin'] = data;
    } else {
      //Failed, clear the login key?
      if (!confirm("Saved session not found or server unreachable, try again?"))
        localStorage['fractured.currentLogin'] = '';
      else
        window.location.reload(false);
    }
    //window.location.reload(false);
    ajaxReadFile('session_menu.php', sessionLoaded);
  }

  //Insert result of login session load into page
  function sessionLoaded(html) {
    var currentLogin;
    if (localStorage['fractured.currentLogin'])
      currentLogin = JSON.parse(localStorage['fractured.currentLogin']);

    if (currentLogin && currentLogin.id && currentLogin.id.length == 64) {
      //Load sessions list from server
      ajaxReadFile('db/session_get.php', loadStateList);
    }

    var sesmenu = document.getElementById('session_menu');
    sesmenu.innerHTML = html;
  }

  //Update and save
  function applyAndSave() {
    fractal.applyChanges();
    saveActive();
  }

  function loadSources() {
    //Wait until we know if server is available...
    if (offline == null) {
      setTimeout("loadSources();", 250);
      return;
    }
    //Load a from list of remaining source files
    for (filename in sources) {
      //Load from local storage first if available (force load from server by passing "reload" on url)
      if (!reloadsources && supports_html5_storage()) sources[filename] = localStorage[filename];
      if (!sources[filename]) {
        if (offline)
          iframeReadFile(filename);  //iFrame file reader that works offline (sometimes)
        else
          ajaxReadFile(filename, saveSource, true);
      } else {
        consoleWrite("restored: " + filename);
      }
    }
    //Check if all loaded yet, if so call appInit()
    checkSources();
  }

  //External content load via iframe dynamic insert
  function iframeReadFile(doc) {
   //Unfortunately doesn't work in chrome for local files in sub-directories,
   //Stupidly it treats them as from another domain

    // create a new iframe element
    var iframe = document.createElement('iframe');
    // set the src attribute to that url
    iframe.setAttribute('src', doc);
    iframe.setAttribute('name', doc);
    iframe.setAttribute('onload', 'transferHTML(this)');
    // insert the script into our page
      consoleWrite("Loading " + doc);
      //<iframe onload="transferHTML();" id="hiddenContent" name=""></iframe>
    document.getElementById('hidden').appendChild(iframe);
  }

  function transferHTML(srcFrame) {
    var doc = srcFrame.name;
    srcContent='';
    //if (srcFrame.contentDocument) {
      srcContent=srcFrame.contentDocument.body.textContent; //innerHTML; //textContent;
    //}
    //else if (srcFrame.contentWindow) {
    //  srcContent=srcFrame.contentWindow.document.body.textContent;
    //  srcContent=srcFrame.contentWindow.document.body.textContent;
    //}
    sources[doc] = localStorage[doc] = srcContent;

    consoleWrite("loaded: " + doc);
    checkSources();
  }

  //Source file loaded
  function saveSource(data, filename) {
    sources[filename] = localStorage[filename] = data; //Save content
    consoleWrite("loaded: " + filename);
    checkSources();
  }

  function checkSources() {
    //Check if all loaded yet, if so call appInit()
    var remain = false;
    for (filename in sources)
      if (!sources[filename] || sources[filename].length == 0) {remain=true; break;}

    if (!remain) appInit();  //All data loaded, call init
  }

  //Once we have source data, app can be initialised
  function appInit() {
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
    window.onunload = pageUnload;

    //Create a fractal object
    fractal = new Fractal(canvas, mode);
    fractal.antialias = localStorage["fractured.antialias"] ? parseInt(localStorage["fractured.antialias"]) : 2;
    setAntiAliasMenu();

    //Colour editing and palette management
    colours = new ColourEditor();

    //Draw & update
    if (restored.length > 0) {
      var lines = restored.split("\n"); // split on newlines
      var name = lines[0];
      lines.splice(0,1);
      fractal.load(lines.join('\n'), true); //Always replace formula code
      autoResize(autoSize);
      restored = "";
      fractal.name = name;
      $('nameInput').value = fractal.name;
    } else
      loadLastFractal();  //Restore last if any
    fractal.applyChanges();
  }

  function setAntiAlias(val) {
    if (!val) val = prompt('Enter quality (1-16) Higher values may be very slow!');
    if (val && val > 0 && val <= 16) {
      fractal.antialias = val;
      localStorage["fractured.antialias"] = fractal.antialias;
      setAntiAliasMenu();
      fractal.draw();
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

  function populateFractals() {
    //Clear & repopulate list
    var menu = document.getElementById('fractals');
    if (menu.hasChildNodes()) {
      while (menu.childNodes.length > 0 )
      menu.removeChild(menu.firstChild);
    }

    var idx_str = localStorage["fractured.fractals"];
    if (idx_str) {
      var idx = parseInt(idx_str);
      for (var i=1; i<=idx; i++) {
        var namestr = localStorage["fractured.names." + i];
        if (!namestr) continue; //namestr = "unnamed";
        var source = localStorage["fractured.fractal." + i];

        var entry = document.createElement("li");
        var span = document.createElement("span");
        if (currentFractal == i) {
          entry.className = "selected_item"
        }
        if (localStorage["fractured.thumbnail." + i]) {
          //localStorage.removeItem("fractured.thumbnail." + i);
          var img = new Image;
          img.src = localStorage["fractured.thumbnail." + i];
          img.className = "thumb";
          span.appendChild(img);
        }
        span.onclick = Function("selectedFractal(" + i + ")");
        span.appendChild(span.ownerDocument.createTextNode(namestr));
        entry.appendChild(span);
        //menu.appendChild(entry);
        menu.insertBefore(entry, menu.firstChild);
      }
    }

    if (!entry) {
      var entry = document.createElement("li");
      entry.appendChild(entry.ownerDocument.createTextNode("(empty)"));
      menu.appendChild(entry);
    }
  }

  function selectedFractal(idx) {
    localStorage["fractured.currentFractal"] = currentFractal = idx;
    fractal.load(localStorage["fractured.fractal." + idx]);
    fractal.name = localStorage["fractured.names." + idx];
    $('nameInput').value = fractal.name;
    autoResize(autoSize);
    applyAndSave();
        //Generate thumbnails on select!
        if (!localStorage["fractured.thumbnail." + idx])
            localStorage["fractured.thumbnail." + idx] = thumbnail();
    populateFractals();
  }

  function clearFractal() {
    fractal.resetDefaults();
    fractal.formulaDefaults();
    //De-select
    currentFractal = -1;
    populateFractals();
    applyAndSave();
  }

  function exportFractal() {
    //Export without server side script
    fractal.applyChanges();
    source = fractal.toString(true);  //Save formulae when exporting
    //var exportLink = document.createElement('a');
    //exportLink.setAttribute('href', 'data:text/fractal;base64,' + window.btoa(source));
    //exportLink.appendChild(document.createTextNode('test.csv'));
    //document.getElementById('results').appendChild(exportLink);
    location.href = 'data:text/fractal;base64,' + window.btoa(source);
    //Write to disk on server
    //function fileSaved() {window.open("saved.fractal");}
    //ajaxWriteFile("saved.fractal", source, fileSaved);
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
      var oldh = fractal.height;
      var oldw = fractal.width;
      fractal.width = fractal.height = size;
      fractal.draw(4);

   var result = canvas.toDataURL("image/" + type)

/*
 * Thumb generated by browser in canvas, badly aliased
   var thumb = document.getElementById("thumb");
   thumb.style.visibility='visible';
   var context = thumb.getContext('2d');  
   context.drawImage(canvas, 0, 0, thumb.width, thumb.height);
   var result = thumb.toDataURL("image/jpeg")
   thumb.style.visibility='hidden';
*/
      fractal.width = oldw;
      fractal.height = oldh;
      fractal.draw();
   return result;
  }

  function resetState(noconfirm) {
    if (noconfirm || confirm('This will clear everything!')) {
      hasChanged = false;
      var login = localStorage["fractured.currentLogin"]; //Save login
      localStorage.clear(); //be careful as this will clear the entire database
      if (login) localStorage["fractured.currentLogin"] = login; //Restore login
      ajaxReadFile('setvariable.php?name=session_id?value=0', reloadWindow);
      currentSession = 0;  //No sessions to select
      currentFractal = -1;  //No fractals to select
      //window.location.reload(false);
    }
  }

  //Import/export all local storage to server
  function uploadState() {
    if (currentSession > 0 && confirm('Save changes to this session on server?')) {
      //Update existing
    } else {
      var desc = prompt("Enter description for new session");
      if (desc == null) return;
      var descField = document.getElementById("desc");
      descField.setAttribute("value", desc);
      //session_id = 0;   ??
    }

    $("sessid").value = currentSession ? currentSession : 0;

    //Replace from with frm until hosting bug fixed
    var data = getState().replace(/from/g,"frm")
    $("sessdata").value = data;

    var form = document.forms["savesession"];
    form.submit();
  }

  function exportStateFile() {
    var d=new Date();
    var fname = "workspace " + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + ".fractured";
    exportFile(fname, "text/fractal-workspace", getState());
  }

  function uploadFractalFile() {
    fractal.applyChanges();
    $("thumbnail").value = thumbnail("jpeg", 150).substring(23);
    $("source").value = fractal.toString(true);  //Save formulae when exporting
    $("public").value = 1; //prompt('');
    var form = document.forms["inputs"];
    form.submit();
  }

  function exportFractalFile() {
    fractal.applyChanges();
    source = fractal.toString(true);  //Save formulae when exporting
    exportFile(fractal.name + ".fractal", "text/fractal-source", source);
  }

  function exportFile(filename, content, data) {
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

  function loadStateList(data) {
    //Load list of saved states/sessions from server
    try {
      //Get selected id 
      currentSession = parseInt(localStorage["fractured.currentSession"]);

      //Clear & repopulate list
      var menu = document.getElementById('sessions');
      if (menu.hasChildNodes()) {
        while (menu.childNodes.length > 0 )
        menu.removeChild(menu.firstChild );
      }
      var list = JSON.parse(data);
      var i;
      for (i=0; i<list.length; i++) {
        var entry = document.createElement("li");
        var span = document.createElement("span");
        if (currentSession == list[i].id) {
          entry.className = "selected_item"
        }
        span.onclick = Function("loadSession(" + list[i].id + ")");
        span.appendChild(span.ownerDocument.createTextNode(list[i].date + "\n" + list[i].description));
        entry.appendChild(span);
        //menu.appendChild(entry);
        menu.insertBefore(entry, menu.firstChild);
      }

      if (!entry) {
        var entry = document.createElement("li");
        entry.appendChild(entry.ownerDocument.createTextNode("(empty)"));
        menu.appendChild(entry);
      }

      if (currentSession) {
        //Have a saved session #, get the data
        ajaxReadFile('setvariable.php?name=session_id?value=' + currentSession);
      }

    } catch(e) {
      alert('Error! ' + e);
    }
  }

  function loadSession(id)
  {
    if (!confirm('Loading new session. This will overwrite everything!')) return;
    currentSession = id;
    ajaxReadFile('db/session_get.php?id=' + id, importState);
  }

  function deleteSelectedState()
  {
    if (currentSession && confirm('Delete this session from the server?')) {
      ajaxReadFile('db/session_delete.php?id=' + currentSession, reloadWindow);
      currentSession = localStorage["fractured.currentSession"] = 0;
    }
  }

  function reloadWindow(temp)
  {
    //alert("AJAX RESULT: " + temp);
    window.location.reload(false);
  }

  //Import/export all local storage to a text file
  function exportState() {
    location.href = 'data:text/store;base64,' + window.btoa(getState());
  }

  function getState() {
    //Get current state in local storage minus session/login details
    var login = localStorage["fractured.currentLogin"];
    var session = localStorage["fractured.currentSession"];
    var cf = localStorage["fractured.currentFractal"];
    delete localStorage["fractured.currentSession"];
    delete localStorage["fractured.currentLogin"];
    var source = JSON.stringify(localStorage);
    localStorage["fractured.currentLogin"] = login;
    localStorage["fractured.currentSession"] = session;
    localStorage["fractured.currentFractal"] = cf;
    return source;
  }

  function importState(source) {
    var parsed = JSON.parse(source);
    if (!parsed) return;
    try {
      localStorage.clear(); //clear the entire database
      for (key in parsed)
        localStorage[key] = parsed[key];
      //Replace session id, not saved in state data
      localStorage["fractured.currentSession"] = currentSession;
      localStorage["fractured.currentFractal"] = currentFractal;
      window.location.reload(false);
    } catch(e) {
      alert('Error! ' + e);
    }
  }

  function loadState() {
    //Load formulae from local storage (or defaults if not found)
    var formulae;
    var selected;
    var f_source;
    if (supports_html5_storage()) f_source = localStorage["fractured.formulae"];
    if (f_source) {
        //HACK!! TODO: remove
        f_source = f_source.replace(/primes/g, "integers");
       formulae = JSON.parse(f_source);
       selected = JSON.parse(localStorage["fractured.selected"]);
       //Load global settings...
       autoSize = document["inputs"].elements["autosize"].checked = /true/i.test(localStorage["fractured.autoSize"]);
    } else {
       //Standard formulae library
       formulae = {"fractal":["Mandelbrot","Burning Ship","Magnet 1","Magnet 2","Magnet 3","Nova","Novabs","Cactus","Phoenix","Stretch","GM","GMM","Quadra"],"transform":["Inverse","Functions","Fractured"],"colour":["Default","Smooth","Exponential Smoothing","Triangle Inequality","Orbit Traps","Gaussian Integers","Hot and Cold"]};

       selected = {"base" : "base", "fractal" : "mandelbrot", "pre_transform" : "none", "post_transform" : "none",
                    "outside_colour": "default", "inside_colour": "none"};
       localStorage["fractured.editorTheme"] = 'fracturedlight';
       localStorage["fractured.scriptTheme"] = 'monokai';
    }

    //Custom mouse actions
    a_source = localStorage["fractured.mouseActions"];
    if (a_source)
      mouseActions = JSON.parse(a_source);
    else
      defaultMouseActions();

    labels = {};
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
    for (type in formulae) {
      for (i in formulae[type]) {
        var name = addFormula(type, formulae[type][i]);
        //Load sources from local storage
        var filename = formulaFilename(type, name);
        if (reloadsources)  //Forced reload from server?
          sources[filename] = "";
        else
          //Necessary? Should always do this now anyway when available for standard formulae
          if (localStorage[filename] && !sources[filename]) //Added check to only write when not yet in sources
            sources[filename] = localStorage[filename];
      }
      //Script
      sources["script.js"] = localStorage["script.js"];
    }
    //Set selected defaults
    $('fractal_formula').value = selected['fractal'];
    $('pre_transform_formula').value = selected['pre_transform'];
    $('post_transform_formula').value = selected['post_transform'];
    $('outside_colour_formula').value = selected['outside_colour'];
    $('inside_colour_formula').value = selected['inside_colour'];

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
      autoResize(autoSize);
    }
  }

  function saveState() {
    //Read the lists
    try {
      var types = ["fractal", "transform", "colour"];
      var selects = ["fractal", "pre_transform", "outside_colour"];
      var formulae = {};
      var selected = {};
      for (t in types) {
        var start = 0;
        if (t > 0) start = 1; //Skip "none"
        var selname = selects[t] + "_formula";
        select = $(selname);
        formulae[types[t]] = [];
        for (i=start; i<select.length; i++) {
          var filename = formulaFilename(types[t], select.options[i].value);
          formulae[types[t]][i-start] = select.options[i].text;
          //Store formula source using filename key
          localStorage[filename] = sources[filename];
        }
        //Get selected
        selected[types[t]] = select.options[select.selectedIndex].value;
      }
      //Save custom mouse actions
      localStorage["fractured.mouseActions"] = JSON.stringify(mouseActions);
      //Save formulae
      localStorage["fractured.formulae"] = JSON.stringify(formulae);
      //Save selected formulae
      localStorage["fractured.selected"] = JSON.stringify(selected);
      //Save script
      localStorage["script.js"] = sources["script.js"];
      //Save some global settings
      localStorage["fractured.autoSize"] = autoSize;
      //Save current fractal (as default)
      saveActive();
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Quota exceeded! ' + e);
    }
  }

  function saveActive() {
    try {
      //Save current fractal (as default)
      localStorage["fractured.active"] = fractal;
      localStorage["fractured.name"] = fractal.name;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Quota exceeded! ' + e);
    }
  }

  function getNameFromLabel(label) {
    if (!label) return undefined;
    var name = label.replace(/[^\w]+/g,'_').toLowerCase();
    if (labels[name] != undefined) {
      alert("Formula: " + name + " already exists!");
      return undefined;
    }
    return name;
  }

  function addToSelect(type, name, label) {
    select = $(type + "_formula");
    select.options[select.length] = new Option(label, name);
  }

  function addFormula(type, label, name) {
    if (name == undefined) name = getNameFromLabel(label);
    if (!labels[name]) {
      //Source not yet loaded
      sources["formulae/" + name + "." + type + ".formula"] = "";
      labels[name] = label;
    }
    if (type.indexOf("colour") > -1) {
      addToSelect("outside_colour", name, label);
      addToSelect("inside_colour", name, label);
    } else if (type.indexOf("transform") > -1) {
      addToSelect("pre_transform", name, label);
      addToSelect("post_transform", name, label);
    } else
      addToSelect(type, name, label);
    return name;
  }

  function formulaFilename(type, name) {
    var ext = type;
    if (type.indexOf("colour") > -1) ext = "colour";
    if (type.indexOf("transform") > -1) ext = "transform";
    return "formulae/" + name + "." + ext + ".formula";
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
    autoResize(autoSize);
  }

  //Show/hide on click
  function toggle(id) {
    var el = $(id);
    if (el.style.display == 'block')
      el.style.display = 'none';
    else
      el.style.display = 'block';
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
    delete localStorage['fractured.currentLogin'];
    delete localStorage['fractured.currentSession']
    delete localStorage['fractured.currentFractal']
    if (confirm("Clear current session after logout?"))
      resetState(true);
    ajaxReadFile('db/logout.php', reloadWindow);
  }

/////////////////////////////////////////////////////////////////////////
//Event handling

  function autoResize(newval) {
    if (rztimeout) clearTimeout(rztimeout);
    var timer = false;
    if (typeof(newval) == 'boolean')
      localStorage["fractured.autoSize"] = autoSize = newval;
    else
      timer = true;

    if (autoSize == true) {
      fractal.width = window.innerWidth - (showparams ? 388 : 2);
      fractal.height = window.innerHeight - 32;
      fractal.copyToForm();
      var canvas = document.getElementById('fractal-canvas');
      //canvas.width = fractal.width-1;
      //canvas.height = fractal.height-1;

      if (timer) {
        document.body.style.cursor = "wait";
        rztimeout = setTimeout('applyAndSave(); document.body.style.cursor = "default";', 150);
      } else
        applyAndSave();
    }
  }

  function beforeUnload(event) {
    //if (hasChanged) return "There are un-saved changes"
  }

  function pageUnload(event) {
    if (hasChanged && confirm("Save session changes?"))
      saveState();
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
    fractal.draw();
    //Save param changes
    saveActive();
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

    applyAndSave();
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

  function closeEditor() {
    //editorWindow = null;
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
  this.inserting = false;
  this.editing = -1;
  this.element = null;
  this.picker = new ColourPicker(saveColour, abortColour);
  this.editcanvas = document.getElementById('palette')
  this.gradientcanvas = document.getElementById('gradient')

  //Create default palette object
  this.palette = new Palette();
  this.palette.draw(this.editcanvas, true);
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
  this.palette.draw(this.editcanvas, true);
}

ColourEditor.prototype.update = function() {
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
}

ColourEditor.prototype.cancel = function() {
  //If aborting a new colour add, delete it
  if (this.editing >= 0 && this.inserting)
  {
    this.palette.remove(this.editing);
    this.palette.draw(this.editcanvas, true);
  }
  this.reset();
}

ColourEditor.prototype.reset = function() {
  //Reset editing data
  this.inserting = false;
  this.editing = -1;
  this.element = null;
}

//Mouse event handling
ColourEditor.prototype.click = function(event, mouse) {
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
  }
}

/////////////////////////////////////////////////////////////////////////
//File upload handling
function fileSelected(files) {
  var callback = loadFile;
  if (filetype == 'palette') callback = fractal.loadPalette; //loadPalette;
  if (filetype == 'session') {
    if (!confirm('Loading new session. This will overwrite everything!')) return;
    callback = importState;
  }
  filesProcess(files, callback);
}

function filesProcess(files, callback) {
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    //alert(file.name + " -- " + file.size);
    //new ajaxUploadFile(file, callback);
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
}

function loadFile(source, filename) {
  if (filename.indexOf(".ini") > -1) {
    fractal.iniLoader(source);
    filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
    applyAndSave();
  } else {
    fractal.load(source);
    autoResize(autoSize);
  }
  //$("namelabel").value = filename.substr(0, filename.lastIndexOf('.')) || filename;
  fractal.name = filename.substr(0, filename.lastIndexOf('.')) || filename;
  $('nameInput').value = fractal.name;
}

