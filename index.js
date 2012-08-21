//TODO:
//Allow disabling of thumbnails when saving session to server (user privilege?) (set size?)
//Clear-actions doesn't always work!?

//Globals
var sources = null;
var fractal;
var colours;
var showparams = true;
var fullscreen = false;
var filetype = 'fractal';
var recording = false;
var debug = false; //enable for testing
//Timers
var rztimeout = undefined;

var current = new Status();
var mouseActions = {}; //left,right,middle,wheel - 'shift', 'ctrl', 'alt', 'shift+ctrl', 'shift+alt', 'ctrl+alt', 'shift+ctrl+alt'

  //Status - logged in, selected values
  /**
   * @constructor
   */
  function Status() {
    this.loggedin = false;
    this.offline = null;
    this.session = 0;
    this.formulae = 0;
    this.fractal = -1;
  }

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
    //alert(" called by: " + arguments.callee.caller);
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

  //Save values of all selected parameters for use in scripting
  function ParamVals(paramset) {
      for (key in paramset) {
        if (typeof(paramset[key]) == "object" && paramset[key].type != undefined)
          this[key] = paramset[key].value; 
      }
    }

  //Script object, passed source code inserted at the step() function
  function Script(source) {
    this.count = 1;
    this.step = 1;
    this.step = Function(source);
    this.fractal = new ParamVals(fractal.fractal.currentParams);
    this.preTransform = new ParamVals(fractal.pre_transform.currentParams); 
    this.postTransform = new ParamVals(fractal.post_transform.currentParams);
    this.insideColour = new ParamVals(fractal.inside_colour.currentParams); 
    this.outsideColour = new ParamVals(fractal.outside_colour.currentParams);
  }

  function runScript() {
    //Run an animation script
    var script = new Script(sources["include/script.js"])

    function next() {
      script.step();
      if (script.count < script.steps) {
        script.count++;
        window.requestAnimationFrame(next);
      }
    }

    next();
  }

  var timer;
  function timeDraw() {
    timer = new Date().getTime();
    window.requestAnimationFrame(logTime);
  }

  function logTime() {
    var elapsed = new Date().getTime() - timer;
    if (elapsed < 50) 
      window.requestAnimationFrame(logTime); //Not enough time, assume triggered too early, try again
    else
      consoleWrite("Draw took: " + (elapsed / 1000) + " seconds");
  }
      

  function appInit() {
    if (!supports_html5_storage()) {alert("Local Storage not supported!"); return;}
    //Force offline mode when loaded locally
    if (window.location.href.indexOf("file://") == 0) current.offline = true;

    showPanel($('tab4'), 'panel4');
    var urlq = decodeURI(window.location.href);
    var query;
    var baseurl = "";
    if (urlq.indexOf("?") > 0) {
      var parts = urlq.split("?"); //whole querystring before and after ?
      query = parts[1]; 
      //Strip stupid trailing /
      if (query.charAt(query.length-1) == "/") query = query.substr(0, query.length-1);
      baseurl = parts[0];
    } else {
      if (urlq.indexOf("file:///") == 0)
         baseurl = urlq;
      else {
        //URL rewriting
        var pos = urlq.lastIndexOf("/");
        query = urlq.substr(pos+1);
        baseurl = urlq.substr(0, pos);
      }
    }
    var restored = "";
    var mode;
    if (query) {
      var list = query.split("&");
      for (var i=0; i<list.length; i++) {
        if (list[i].indexOf('debug') >= 0) {
          //debug mode enabled, show extra menus
          debug = true;
          $S('debugmenu').display = 'block';
          $S('recordmenu').display = 'block';
        } else if (list[i].indexOf('fp64') == 0 || list[i].indexOf('double') == 0) {
          mode = WEBCL64;
        } else if (list[i].indexOf('webcl') >= 0) {
          mode = WEBCL;
        } else if (list[i].indexOf('webgl') >= 0) {
          mode = WEBGL;
        } else if (list[i].length > 20) {
          //Load fractal from base64 packed url
          restored = window.atob(list[i]);
        } else if (!current.offline && list[i].length > 4) {
          //Load fractal from hash ID
          restored = readURL('ss/fractal_get.php?id=' + list[i]);
          if (!restored || restored.indexOf("Error:") == 0) {
            alert("Fractal load failed!");
            restored = "";
          } else 
            baseurl += "/" + list[i]; //Save hash in baseurl
        }
      }
    }
    consoleDebug("Base URL: " + baseurl);
    consoleDebug("Query options: " + query);

    //Strip commands from url (except hash if provided)
    window.history.pushState("", "", baseurl);

    //Load the last program state
    loadState();

    if (!current.offline) {
      //Session restore:
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
      //Load formula lists from server
      loadFormulaeList(readURL('ss/formula_get.php'));
    }

    //Initialise app
    showPanel($('tab1'), 'panel1');
    //Fractal canvas event handling
    var canvas = document.getElementById("fractal-canvas");
    canvas.mouse = new Mouse(canvas, new MouseEventHandler(canvasMouseClick, canvasMouseDown, canvasMouseMove, canvasMouseWheel));
    canvas.mouse.wheelTimer = true;
    defaultMouse = document.mouse = canvas.mouse;
    document.onkeypress = handleKey;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    window.onresize = autoResize;
    window.onmozfullscreenchange = toggleFullscreen
    $('main').onwebkitfullscreenchange = toggleFullscreen;
    window.onbeforeunload = beforeUnload;

    //Create a fractal object
    fractal = new Fractal(canvas, mode);
    fractal.antialias = localStorage["fractured.antialias"] ? parseInt(localStorage["fractured.antialias"]) : 2;
    setAntiAliasMenu();

    //Colour editing and palette management
    colours = new GradientEditor($('palette'));

    //Draw & update
    if (restored.length > 0)
      restoreFractal(restored);   //Restore from URL
    else
      loadLastFractal();  //Restore last if any

     ajaxReadFile('docs.html', insertHelp);
  }

  function switchMode(mode) {
    if (mode == 0 && fractal.webgl) return;
    consoleWrite("Switching to " + (mode==0 ? "WebGL" : mode == 1 ? "WebCL" : "WebCL fp64"));
    if (mode > 0 && fractal.webcl) {
      fractal.webcl.setPrecision(mode > 1); //Switch precision
      sources["generated.shader"] = "";     //Force rebuild
      fractal.applyChanges();
      return;
    }

    //Recreate canvas & fractal
    source = fractal + "";
    var aa = fractal.antialias;
    var canvas = document.getElementById("fractal-canvas");
    var cparent = canvas.parentNode;
    cparent.removeChild(canvas);
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = 600;
    canvas.id = "fractal-canvas"
    canvas.mouse = new Mouse(canvas, new MouseEventHandler(canvasMouseClick, canvasMouseDown, canvasMouseMove, canvasMouseWheel));
    canvas.mouse.wheelTimer = true;
    defaultMouse = document.mouse = canvas.mouse;
    cparent.appendChild(canvas);

    fractal = new Fractal(canvas, mode);
    fractal.antialias = aa;
    fractal.load(source);
    fractal.name = localStorage["fractured.name"];
  }

  function handleKey(event) {
    if (fullscreen && event.keyCode == 27) toggleFullscreen();
  }

  function insertHelp(data) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;
    var divs = tempDiv.getElementsByTagName('div')
    if (divs.length > 0)
      $('help').innerHTML = divs[0].innerHTML;
    else
      $('help').innerHTML = "Help file could not be loaded";
  }

  //Utility, set display style of all elements of classname
  function setAll(display, classname) {
    var elements = document.getElementsByClassName(classname)
    for (var i=0; i<elements.length; i++)
      elements[i].style.display = display;
  }

  //session JSON received
  function sessionGet(data) {
    current.offline = false;
    var usermenu = document.getElementById('session_user_menu');
    var loginmenu = document.getElementById('session_login_menu');
    //Check for invalid or empty response
    if (!data || data.charAt(0) != "[") {
      //Responds with "!" if no session, so check for as valid response
      if (data.charAt(0) != "!") {
        //Offline mode
        consoleWrite('Offline!');
        current.offline = true;
        return;
      }
    } else {
      //Parse session data, if we get this far we have an active logged in user
      current.loggedin = true;
      var session = JSON.parse(data);
      loginmenu.style.display = 'none';
      setAll('block', 'loggedin');  //Unhide logged in menu options
      setAll('none', 'loggedout');  //Hide logged out menu options
      //Load list of saved states/sessions
      try {
        //Clear & repopulate list
        var menu = document.getElementById('sessions');
        removeChildren(menu);
        var list = JSON.parse(data);
        for (var i=0; i<list.length; i++) {
          var label = list[i].date + "\n" + list[i].description;
          var onclick = "loadSession(" + list[i].id + ")";
          var ondelete = "deleteSelectedState();";
          addMenuItem(menu, label, onclick, ondelete, current.session == list[i].id, true);
        }
        checkMenuHasItems(menu);

      } catch(e) {
        alert('LoadSessionList: Error! ' + e);
      }
    }
  }

  function restoreFractal(restored) {
    var lines = restored.split("\n"); // split on newlines
    var name = lines[0];
    lines.splice(0,1);
    var data = lines.join('\n');
    if (name == "[Palette]") {
      loadLastFractal();  //Restore last if any
      colours.read(data);
      fractal.applyChanges();
    } else {
      fractal.load(data);
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

  function deleteFractal(idx) {
    //if (current.fractal >= 0) {
      //var idx = current.fractal;
      var name = localStorage["fractured.names." + idx];
      if (!name || !confirm('Really delete the fractal: "' + name + '"')) return;
      try {
        localStorage.removeItem("fractured.names." + idx);
        localStorage.removeItem("fractured.fractal." + idx);
        localStorage.removeItem("fractured.thumbnail." + idx);
        current.fractal = localStorage["fractured.current.fractal"] = -1;
        populateFractals();
      } catch(e) {
        alert('Storage delete error! ' + e);
      }
    //}
  }

  //Menu management functions...
  function addMenuItem(menu, label, onclick, ondelete, selected, atstart) {
    var entry = document.createElement("li");
    var span = document.createElement("span");
    //span.onclick = onclick;
    span.setAttribute("onclick", onclick);
    span.appendChild(span.ownerDocument.createTextNode(label));
    entry.appendChild(span);
    if (atstart)
      menu.insertBefore(entry, menu.firstChild);
    else
      menu.appendChild(entry);
    if (selected) {
      entry.className = "selected_item";
      if (ondelete) addMenuDelete(span, ondelete);
    }
    //Return span so any additional controls can be added
    return span;
  }

  function addMenuDelete(span, onclick) {
    var btn = document.createElement("input");
    btn.type = "button";
    btn.value = " X ";
    btn.className = "right";
    //btn.className = "right loggedin";
    btn.setAttribute("onclick", onclick + " event.stopPropagation();");
    span.appendChild(btn);
  }

  function checkMenuHasItems(menu) {
    if (!menu.hasChildNodes()) {
      var entry = document.createElement("li");
      entry.appendChild(entry.ownerDocument.createTextNode("(empty)"));
      menu.appendChild(entry);
    }
  }

function performTask(number, numToProcess, processItem) {
    var pos = 0;
    progress("Generating thumbnails...");
    var savedaa = fractal.antialias;
    // This is run once for every numToProcess items.
    function iteration() {
        // Calculate last position.
        var j = Math.min(pos + numToProcess, number);
        // Start at current position and loop to last position.
        for (var i = pos; i < j; i++) {
            processItem(i);
        }
        // Increment current position.
        pos += numToProcess;
        setProgress(pos / number * 100.0);
        // Only continue if there are more items to process.
        if (pos < number)
            setTimeout(iteration, 10); // Wait 10 ms to let the UI update.
        else {
          populateFractals();
          progress();
          fractal.antialias = savedaa;
          loadLastFractal();
        }
    }
    iteration();
}

  function regenerateThumbs() {
    //Recreate all thumbnail images
    var idx = parseInt(localStorage["fractured.fractals"]);
    performTask(idx, Math.round(idx/10), 
        function (index) {
          var i = index + 1;
          if (localStorage["fractured.fractal." + i]) {
            fractal.load(localStorage["fractured.fractal." + i], true);
            $("widthInput").value = $("heightInput").value = 32;
            document["inputs"].elements["autosize"].checked = false;
            fractal.antialias = 6;
            fractal.applyChanges();
            var result = $('fractal-canvas').toDataURL("image/jpeg")
            localStorage["fractured.thumbnail." + i] = result;
          }
        });

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
        var onclick = "selectedFractal(" + i + ")";
        var ondelete = "deleteFractal(" + i + ");";
        var span = addMenuItem(menu, namestr, onclick, ondelete, current.fractal == i, true);
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
    localStorage["fractured.current.fractal"] = current.fractal = idx;
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
    current.fractal = -1;
    populateFractals();
    fractal.applyChanges();
  }

  function saveFractal() {
    fractal.applyChanges();
    source = fractal + "";
    //Save current fractal to list
    if (current.fractal >= 0) {
      //Save existing
      var name = localStorage["fractured.names." + current.fractal];
      if (name == fractal.name) {
        if (confirm('Overwrite "' + name + '"?')) {
          var idx = current.fractal;
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
    //if (namestr == checkstr && !confirm('Save new fractal as "' + namestr + '"?')) return;
    namestr = checkstr;
    idx++;  //Increment index
    try {
      localStorage["fractured.names." + idx] = namestr;
      localStorage["fractured.fractal." + idx] = source;
      localStorage["fractured.thumbnail." + idx] = thumbnail();
      localStorage["fractured.fractals"] = idx;
      localStorage["fractured.current.fractal"] = current.fractal = idx;
      $('nameInput').value = namestr;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Storage error! ' + e);
      //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
    }
    populateFractals();
  }

  function savePalette() {
    source = colours.palette + "";
    //Save current palette to list
    var idx_str = localStorage["fractured.palettes"];
    var idx = (idx_str ? parseInt(idx_str) : 0);
    idx++;  //Increment index
    try {
      localStorage["fractured.palette." + idx] = source;
      localStorage["fractured.palette_img." + idx] = paletteThumbnail();
      localStorage["fractured.palettes"] = idx;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Storage error! ' + e);
      //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
    }
    populatePalettes();
  }

  function populatePalettes() {
    //Clear & repopulate list
    var menu = document.getElementById('palettes');
    removeChildren(menu);
    addMenuItem(menu, "Save Palette", "savePalette();", null, false, false);
    addMenuItem(menu, "Export Palette", "exportPaletteFile();", null, false, false);
    addMenuItem(menu, "Palette to URL", "packPalette();", null, false, false);
    var idx_str = localStorage["fractured.palettes"];
    var inc = 1;
    if (idx_str) {
      var idx = parseInt(idx_str);
      for (var i=1; i<=idx; i++) {
        var source = localStorage["fractured.palette." + i];
        if (!source) continue; //namestr = "unnamed";
        var onclick = "colours.read(localStorage['fractured.palette." + i + "']); fractal.applyChanges()";
        var ondelete = "deletePalette(" + i + ");";
        var span = addMenuItem(menu, "", onclick, ondelete, true, false);
        inc++;
        if (localStorage["fractured.palette_img." + i]) {
          var palimg = span; //document.createElement("span");
          palimg.style.backgroundImage = "url('" + localStorage["fractured.palette_img." + i] + "')";
          palimg.style.backgroundRepeat = "repeat-y";
          palimg.style.height = "14px";
          palimg.style.width = "150px";
          palimg.style.margin = "1px 0px";
          palimg.style.padding = "3px 0px";
          //span.appendChild(palimg);
        }
      }
    }
    checkMenuHasItems(menu);
  }

  function deletePalette(idx) {
    try {
      localStorage.removeItem("fractured.palette." + idx);
      localStorage.removeItem("fractured.palette_img." + idx);
      populatePalettes();
    } catch(e) {
      alert('Storage delete error! ' + e);
    }
  }

  function packPalette() {
    var data = window.btoa("[Palette]" + "\n" + colours.palette.toString());
    packURL(data);
  }

  function thumbnail(type, size) {
   //Thumbnail image gen
   //if (type == undefined) type = "png";
   if (type == undefined) type = "jpeg";
   if (size == undefined) size = 32; //40;
   var canvas = document.getElementById("fractal-canvas");

   //*
      var oldh = fractal.height;
      var oldw = fractal.width;
      var oldaa = fractal.antialias;
      fractal.width = fractal.height = size;
      fractal.draw(6);

   var result = canvas.toDataURL("image/" + type)

      fractal.antialias = oldaa;
      fractal.width = oldw;
      fractal.height = oldh;
      fractal.draw();
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

  function paletteThumbnail() {
   //Thumbnail image gen
   var canvas = document.getElementById("gradient");
   var thumb = document.getElementById("thumb");
   thumb.width = 150;
   thumb.height = 1;
   thumb.style.visibility='visible';
   var context = thumb.getContext('2d');  
   context.drawImage(canvas, 0, 0, thumb.width, thumb.height);
   var result = thumb.toDataURL("image/png")
   thumb.style.visibility='hidden';
   return result;
  }

  function resetState(noconfirm) {
    if (noconfirm || confirm('This will clear everything!')) {
      localStorage.clear(); //be careful as this will clear the entire database
      loadState();
      if (!current.offline)
        sessionGet(readURL('ss/session_get.php')); //Get updated list...
      colours.read(); //Palette reset
      newFractal();
      current.session = 0;  //No sessions to select
      current.formulae = 0;  //No sessions to select
      current.fractal = -1;  //No fractals to select
      window.onbeforeunload = null;
    }
  }

  //Import/export all local storage to server
  function uploadState() {
    saveState();  //Update saved data first
    var data = "session_id=" + (current.session ? current.session : 0);
    if (current.session > 0 && confirm('Save changes to this session on server?')) {
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
    localStorage['fractured.current.session'] = data;
    sessionGet(readURL('ss/session_get.php')); //Get updated list...
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
    packURL(data);
  }

  function packURL(data) {
    var loc = window.location + "?" + data;
    var link = document.createElement("a");
    link.setAttribute("href", loc);
    var linkText = document.createTextNode("here it is");
    link.appendChild(linkText);
    popup("Copy this link:<br><br>");
    $("popupmessage").appendChild(link);
  }

  function uploadFormulaFile(shared) {
    var data = "public=" + shared;
    //If selected, give option to update existing
    if (shared == 0 && current.formulae > 0 && confirm('Save changes to this formula set on server?'))
      data += "&formulae=" + current.formulae;
    else {
      var name = prompt("Enter name for new formula set");
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
      current.formulae = localStorage["fractured.current.formulae"] = id;
    else
      alert("Formula save error: " + response);

    //Refresh list
    loadFormulaeList(readURL('ss/formula_get.php'));
    progress();
  }

  //Import/export all local storage to a text file
  function exportStateFile() {
    saveState();  //Update saved data first
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

  function exportFormulaFile(filename, type, source) {
    exportFile(filenameToName(filename)[0] + "." + categoryToType(type) + ".formula", "text/fractal-formula", source);
  }

  function exportPaletteFile() {
    source = colours.palette + "";
    exportFile(fractal.name + ".palette", "text/palette", source);
  }

  function exportFile(filename, content, data) {
    if (current.offline) {
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
    if (current.offline) return;
    //Load list of saved formula sets from server
    try {
      //Get selected id 
      current.formulae = parseInt(localStorage["fractured.current.formulae"]);

      //Clear & repopulate list
      var menu1 = document.getElementById('formulae-public');
      var menu2 = document.getElementById('formulae-private');
      var ondelete = "deleteSelectedFormulae();";
      //If not logged in, menu only contains public formula list
      if (current.loggedin == false) {
        menu1 = document.getElementById('formulae-list');
        ondelete = null;
      }
      removeChildren(menu1);
      removeChildren(menu2);
      var list = JSON.parse(data);
      for (var i=0; i<list.length; i++) {
        var label = list[i].date + "\n" + list[i].name;
        var onclick = "loadFormulaSet(" + list[i].id + ")";
        if (list[i]["public"] == "1")
          addMenuItem(menu1, label, onclick, ondelete, current.formulae == list[i].id);
        else
          addMenuItem(menu2, label, onclick, ondelete, current.formulae == list[i].id);
      }
      checkMenuHasItems(menu1);
      checkMenuHasItems(menu2);
    } catch(e) {
      alert('LoadFormulaeList: Error! ' + e);
    }
  }

  function loadFormulaSet(id) {
    if (!confirm('Loading new formula set. This will overwrite currently loaded formulae!')) return;
    localStorage["fractured.current.formulae"] = current.formulae = id;
    importFormulae(readURL('ss/formula_get.php?id=' + id));
    //Repopulate menu (so selected set)
    loadFormulaeList(readURL('ss/formula_get.php'));
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
    if (current.formulae && confirm('Delete this formula set from the server?')) {
      readURL('ss/formula_delete.php?id=' + current.formulae);
      loadFormulaeList(readURL('ss/formula_get.php'));
      current.formulae = localStorage["fractured.current.formulae"] = 0;
    }
  }

  function loadSession(id)
  {
    if (!confirm('Loading new session. This will overwrite everything!')) return;
    current.session = id;
    ajaxReadFile('ss/session_get.php?id=' + id, importState, false, updateProgress);
    progress("Downloading session from server...");
  }

  function deleteSelectedState()
  {
    if (current.session && confirm('Delete this session from the server?')) {
      readURL('ss/session_delete.php?id=' + current.session);
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
      current.session = localStorage["fractured.current.session"] = 0;
    }
  }

  function getState() {
    //Get current state in local storage minus session/login details
    var session = localStorage["fractured.current.session"];
    var formulae = localStorage["fractured.current.formulae"];
    delete localStorage["fractured.current.session"];
    delete localStorage["fractured.current.formulae"];
      //Save current fractal (as default)
      localStorage["fractured.active"] = fractal;
      localStorage["fractured.name"] = fractal.name;
    var source = JSON.stringify(localStorage);
    localStorage["fractured.current.session"] = session;
    localStorage["fractured.current.formulae"] = formulae;
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
      localStorage["fractured.current.session"] = current.session;
      localStorage["fractured.current.formulae"] = current.formulae;
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
      loadState();
      loadLastFractal();
      progress();
    } catch(e) {
      alert('ImportState: Error! ' + e);
    }
  }

  function loadScript(filename) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = filename;
    head.appendChild(script);
  }

  function loadState() {
    //Load includes...
    var i_source = localStorage["fractured.include"];
    if (i_source) sources = JSON.parse(i_source);
    if (!sources) sources = JSON.parse(readURL('/includes.json'));

    //Load formulae
    var f_source = localStorage["fractured.formulae"];
    if (f_source) formula_list = JSON.parse(f_source);
    if (!formula_list) formula_list = JSON.parse(readURL('defaultformulae.json'));

    //Custom mouse actions
    a_source = localStorage["fractured.mouseActions"];
    if (a_source)
      mouseActions = JSON.parse(a_source);
    else
      defaultMouseActions();

    //Create formula entries in drop-downs (and any saved load sources)
    updateFormulaLists();

    //Get selected id's
    current.session = parseInt(localStorage["fractured.current.session"]);
    current.fractal = parseInt(localStorage["fractured.current.fractal"]);
    current.formulae = parseInt(localStorage["fractured.current.formulae"]);

    populateFractals();
    populatePalettes();

    //Show an indicator, assumes 5mb of local storage
    var size = JSON.stringify(localStorage).length;
    var indic = size / 5000000;
    $S('indicator').width = (350 * indic) + 'px';
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
    if (!fractal) return;
    try {
      //Save custom mouse actions
      localStorage["fractured.mouseActions"] = JSON.stringify(mouseActions);
      //Save formulae
      localStorage["fractured.formulae"] = JSON.stringify(formula_list);
      //Save include sources
      sources["generated.shader"] = "";
      localStorage["fractured.include"] = JSON.stringify(sources);
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
  var panels = ['panel1', 'panel2', 'panel3', 'panel4', 'panel5'];
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
    var sidebar = document.getElementById("left");
    var main = document.getElementById("main");
    if (sidebar.style.display == 'none') {
      sidebar.style.display = 'block';
      main.style.left = '334px';
      $('toolsbtn').innerHTML = "Hide Tools &uarr;"
    } else {
      sidebar.style.display = 'none';
      main.style.left = '1px';
      $('toolsbtn').innerHTML = "Show Tools &darr;"
    }
    showparams = (sidebar.style.display == 'block');
    autoResize(document["inputs"].elements["autosize"].checked);
  }

  function toggleFullscreen(newval) {
    var main = document.getElementById("main");
    if (window.requestFullScreen) {
      //Use new html5 full screen API
      if (typeof(newval) == 'boolean' && newval == true) {
        document["inputs"].elements["autosize"].checked = true;
        requestFullScreen("main");
        main.style.top = '0px';
        main.style.left = '0px';
      } else {
        //Response to fullscreenchange event
        if (fullscreen) {
          main.style.top = '27px';
          main.style.left = showparams ? '334px' : '1px';
        }
        fullscreen = !fullscreen;
      }
      return;
    }
    //Old method, full browser screen, user can then manually fullscreen the browser
    var header = document.getElementById("header");
    var sidebar = document.getElementById("left");
    if (header.style.display == 'none') {
      header.style.display = 'block';
      sidebar.style.display = 'block';
      main.style.top = '27px';
      main.style.left = showparams ? '334px' : '1px';
    } else {
      header.style.display = 'none';
      sidebar.style.display = 'none';
      main.style.top = '0px';
      main.style.left = '0px';
      popup("Press ESC to leave full screen mode");
    }
    fullscreen = (header.style.display == 'none');
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
    if (text == undefined || el.style.display == 'block') {
      el.style.display = 'none';
      //setTimeout("$('progress').style.display = 'none';", 150);
    } else {
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
    delete localStorage['fractured.current.session']
    delete localStorage['fractured.current.formulae']
    delete localStorage['fractured.current.fractal']
    if (confirm("Clear current session after logout?"))
      resetState(true);
    readURL('ss/logout.php');
    window.location.reload(false);
  }

/////////////////////////////////////////////////////////////////////////
//Event handling

  function autoResize(newval) {
    if (rztimeout) clearTimeout(rztimeout);
    var timer = false;
    //If value passed, setting autoSize, otherwise responding to resize event
    if (typeof(newval) == 'boolean') {
      consoleDebug("Autosize " + newval);
      if (!newval) return; //No change necessary
    } else
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
    if (julia) clearPreviewJulia(mouse);
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
          //var offset = findElementPos(mouse.element);
          //Convert coords to position relative to element
          //select.x -= offset[0];
          //select.y -= offset[1];
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
          //consoleWrite("Julia set @ re: " + point.re.toFixed(8) + " im: " + point.im.toFixed(8));
          if (fractal.julia) consoleWrite("Julia set @ (" + fractal.selected.re.toFixed(8) + ", " + fractal.selected.im.toFixed(8) + ")");
        } else {
          return true;
        }
      }
    }

    select.style.display = 'none';
    fractal.copyToForm();
    fractal.draw();
  }

  function canvasMouseDown(event, mouse) {
    return false;
  }

var julia;

  function drawPreviewJulia() {
    fractal.selectPoint(julia.point);
    fractal.renderViewport(julia.x, julia.y, julia.w, julia.h);
    fractal.selectPoint();
  }

  function clearPreviewJulia(mouse) {
    clearTimeout(julia.timeout);
    mouse.moveUpdate = false;
      $S("fractal-canvas").backgroundImage = "url('media/bg.png')";
      $S("background").display = "none";
    julia = null;
    if (fractal.webcl) fractal.webcl.setViewport(0, 0, mouse.element.width, mouse.element.height);
    fractal.draw();
  }

  function canvasMouseMove(event, mouse) {
    //Mouseover processing
    if (!fractal) return true;
    if (mouse.x >= 0 && mouse.y >= 0 && mouse.x <= mouse.element.width && mouse.y <= mouse.element.height)
    {
      //Convert mouse coords into fractal coords
      var point = fractal.origin.convert(mouse.x, mouse.y, mouse.element);
      var coord = new Aspect(point.re + fractal.origin.re, point.im + fractal.origin.im, 0, 0);
      document.getElementById("coords").innerHTML = "&nbsp;re: " + coord.re.toFixed(8) + " im: " + coord.im.toFixed(8);

      //Constantly updated mini julia set rendering
      if (event.shiftKey && (julia || !fractal.julia)) {
        if (!julia) {
          julia = {};
          //WebGL implicitly clears the canvas, unless preserveDrawingBuffer requested 
          //(which apparently is a performance problem on some platforms) so copy fractal
          //image into background while rendering julia set previews
          $("background").src = fractal.imagedata;
          $S("background").display = "block";
          $S("fractal-canvas").backgroundImage = "none";
          mouse.moveUpdate = true;  //Enable constant deltaX/Y updates
        }
        julia.point = point;
        julia.x = mouse.x;
        julia.y = fractal.webgl ? mouse.element.height - mouse.y : mouse.y;
        julia.w = 250;
        julia.h = 250 * mouse.element.height / mouse.element.width;
        if (mouse.x > mouse.element.width - julia.w) julia.x -= julia.w;
        if (fractal.webgl && mouse.y < mouse.element.height - julia.h) julia.y -= julia.h; 
        if (fractal.webcl && mouse.y > mouse.element.height - julia.h) julia.y -= julia.h; 
        drawPreviewJulia();
        return;
      }
    }

    if (julia) clearPreviewJulia(mouse);

    if (!mouse.isdown) return true;

    //Right & middle buttons: drag to scroll
    if (mouse.button > 0) {
      // Set the scroll position
      window.scrollBy(-mouse.deltaX, -mouse.deltaY);
      return true;
    }

    //Drag processing
    var select = document.getElementById("select");
    var main = document.getElementById("main");
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

    document.getElementById("coords").innerHTML = select.style.width + "," + select.style.height;
  }

  function canvasMouseWheel(event, mouse) {
    var action = getCustomAction(event, "wheel");
    //alert(action.id);
    if (julia || !(event.shiftKey || event.altKey || event.ctrlKey)) {
      // Zoom
      action = new WheelAction(null, 0);
      var zoom;
      if (event.spin < 0)
         zoom = 1/(-event.spin * 1.1);
      else
         zoom = event.spin * 1.1;

      if (julia) {
         fractal.savePos.zoom *= zoom;
         drawPreviewJulia();
         return;
      } else {
        fractal.applyZoom(zoom);
        //Update form fields
        fractal.copyToForm();
      }
    }

    if (!action) return true; //Default browser action

    //Assign field value
    if (action.id && $(action.id))
      $(action.id).value = parseReal($(action.id).value, 1) + event.spin * action.value;

    fractal.applyChanges();
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

