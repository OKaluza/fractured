//TODO:
//Image on flickr (or imgur) deleted, detect and remove from db?
//Fixed size images revert to window size
//Sometimes loaded palette is not drawn
//Download session, if includes.json has changed may need to do a reset, probably need a way to automate this in future
// - possibly reconsider saving includes in session when stored on server

//Globals
var current;  //Status
var sources;  //Source files
var fractal;  //Fractal renderer
var colours;  //Gradient

//Timers
var rztimeout = undefined;

  function appInit() {
    if (!supports_html5_storage()) {alert("Local Storage not supported!"); return;}
    //Force offline mode when loaded locally
    if (window.location.href.indexOf("file://") == 0) current.offline = true;
    if (!navigator.onLine) current.offline = true;

    setAll('none', 'loggedin');  //hide logged in menu options
    showPanel($('tab4'), 'panel4');
    current = new Status();
    var urlq = decodeURI(window.location.href);
    var h = urlq.indexOf("#");
    if (h > 0) urlq = urlq.substring(0, h);
    var query;
    if (urlq.indexOf("?") > 0) {
      var parts = urlq.split("?"); //whole querystring before and after ?
      query = parts[1]; 
      //Strip stupid trailing /
      if (query.charAt(query.length-1) == "/") query = query.substr(0, query.length-1);
      current.baseurl = parts[0];
    } else {
      if (urlq.indexOf("file:///") == 0)
         current.baseurl = urlq;
      else {
        //URL rewriting
        var pos = urlq.lastIndexOf("/");
        query = urlq.substr(pos+1);
        current.baseurl = urlq.substr(0, pos);
      }
    }
    var restored = "";
    var mode;
    var flickr = false;
    if (query) {
      var list = query.split("&");
      for (var i=0; i<list.length; i++) {
        if (list[i].indexOf('debug') >= 0) {
          //debug mode enabled, show extra menus
          current.debugOn();
          current.save();
        } else if (list[i].indexOf('flickr') >= 0) {
          flickr = true; //Skip gallery display
        } else if (list[i].indexOf('reset') >= 0) {
          consoleWrite("Resetting all includes and formulae to defaults");
          delete localStorage["fractured.include"];
          delete localStorage["fractured.formulae"];
        } else if (list[i].indexOf('fp64') == 0 || list[i].indexOf('double') == 0) {
          mode = WEBCL64;
        } else if (list[i].indexOf('webcl') >= 0) {
          mode = WEBCL;
        } else if (list[i].indexOf('webgl') >= 0) {
          mode = WEBGL;
        } else if (list[i].length > 20) {
          //Load fractal from base64 packed url
          restored = window.atob(list[i]);
        } else if (!current.offline && list[i].length > 3) {
          //Load fractal from hash ID
          current.locator = list[i];
          restored = readURL('ss/fractal_get.php?id=' + current.locator);
          if (!restored || restored.indexOf("Error:") == 0) {
            alert("Fractal load failed!");
            restored = "";
            current.locator = null;
          }
        }
      }
    }
    consoleDebug("Base URL: " + current.baseurl);
    consoleDebug("Query options: " + query);

    //Strip commands from url (except hash if provided)
    var base = current.baseurl;
    if (current.locator) base += "/" + current.locator
    window.history.pushState("", "", base);

    //Colour editing and palette management
    colours = new GradientEditor($('palette'));

    //Load the last program state
    loadState();

    if (!current.offline) {
      //Session restore:
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
      //Load formula lists from server
      loadFormulaeList(readURL('ss/formula_get.php'));
    }

    //Initialise app

    //Fractal & canvas
    fractal = new Fractal('main', mode, current.antialias);

    //Event handling
    document.onkeydown = handleKey;
    window.onresize = autoResize;
    window.onhashchange = hashChanged;
    window.onmozfullscreenchange = toggleFullscreen
    $('main').onwebkitfullscreenchange = toggleFullscreen;
    window.onbeforeunload = beforeUnload;

    setAntiAliasMenu();

    //Draw & update
    loadLastFractal();  //Restore last if any
    if (restored.length > 0) {
      hideGallery();
      restoreFractal(restored);   //Restore from URL
    } else if (flickr) {
      //Return to last drawn fractal
      hideGallery();
      fractal.applyChanges();
    } else {
      setGallery(location.hash);
    }

    ajaxReadFile('docs.html', insertHelp);
    loadScript("/codemirror-compressed.js", "");
  }

  function loadScript(filename, onload){
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = filename;
    script.setAttribute("onload", onload);
    head.appendChild(script);
  }

  function switchMode(mode) {
    if (mode == WEBGL && fractal.webgl) return;
    consoleWrite("Switching to " + (mode==WEBGL ? "WebGL" : mode == WEBCL ? "WebCL" : "WebCL fp64"));
    if (mode > WEBGL && fractal.webcl) {
      fractal.webcl.setPrecision(mode > 1); //Switch precision
      sources["generated.shader"] = "";     //Force rebuild
      fractal.applyChanges();
      return;
    }

    //Recreate canvas & fractal
    source = fractal.toStringMinimal();
    fractal = new Fractal('main', mode, fractal.antialias);
    fractal.load(source);
    fractal.name = localStorage["fractured.name"];
  }

  function handleKey(event) {
    switch (event.keyCode) {
      case 27:
        //ESC
        //Deliberate passthrough:
      case 192:
        //~`
        togglePreview();
        break;
    }
  }

  function insertHelp(data) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;
    var divs = tempDiv.getElementsByTagName('div')
    if (divs.length > 0)
      $('help').innerHTML = divs[0].innerHTML;
  }

  //Utility, set display style of all elements of classname
  function setAll(display, classname) {
    var elements = document.getElementsByClassName(classname)
    for (var i=0; i<elements.length; i++)
      elements[i].style.display = display;
  }

  function hashChanged() {
    if ($(location.hash)) setGallery(location.hash);
  }

  function setGallery(id) {
    if (!id) id = "#examples";
    if (current.gallery) {
      $(current.gallery).className = '';
      $S('note' + current.gallery).display = 'none';
    }
    $(id).className = 'selected';
    $S('note' + id).display = 'block';
    current.gallery = id;
    loadGallery(0);
  }

  function loadGallery(offset) {
    $S('gallery').display = "block";
      setAll('none', 'render');  //hide render mode menu options
    $S('fractal-canvas').display = "none";
    if (offset == undefined) offset = this.lastoffset || 0;
    var w = $('gallery').clientWidth; //window.innerWidth - 334;
    var h = $('gallery').clientHeight; //window.innerHeight - 27;
    //$S('gallery').width = w + "px";
    //$S('gallery').height = h + "px";

    type = current.gallery.substr(1);
    $('gallery-display').innerHTML = readURL('ss/images.php?type=' + type + '&offset=' + offset + '&width=' + w + "&height=" + h);
    this.lastoffset = offset;
  }

  function hideGallery() {
    //Hide gallery, show fractal
    $S('gallery').display = "none";
    $S('fractal-canvas').display = "block";
      setAll('block', 'render');  //Unhide render mode menu options
      setAll(current.loggedin ? 'block' : 'none', 'loggedin');  //show/hide logged in menu options
    //Switch to parameters
    if (current.gallery && selectedTab == $('tab4')) showPanel($('tab1'), 'panel1');
    current.gallery = null;
  }

  //session JSON received
  function sessionGet(data) {
    current.offline = false;
    var usermenu = $('session_user_menu');
    var loginmenu = $('session_login_menu');
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
        var menu = $('sessions');
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
      fractal.antialias = current.antialias = val;
      current.save();
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
        current.selectFractal(-1);
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
          //Finished
          progress();
          current.save(); //Save in local storage
          populateFractals();
          loadLastFractal();
          hideGallery();
          fractal.applyChanges();
        }
    }
    iteration();
  }

  function regenerateThumbs() {
    //Recreate all thumbnail images
    var idx = parseInt(localStorage["fractured.fractals"]);
    current.thumbnails = [];  //Clear existing
    current.save(); //Save in local storage
    performTask(idx, Math.ceil(idx/10), 
      function (index) {
        var i = index + 1;
        if (localStorage["fractured.fractal." + i]) {
          fractal.load(localStorage["fractured.fractal." + i], true);
          $("widthInput").value = $("heightInput").value = 32;
          document["inputs"].elements["autosize"].checked = false;
          fractal.applyChanges(6);
          var result = $('fractal-canvas').toDataURL("image/jpeg")
          current.thumbnails[i] = result;
        }
      });
  }

  function populateFractals() {
    //Clear & repopulate list
    var menu = $('fractals');
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
        if (current.thumbnails[i]) {
          var img = new Image;
          img.src = current.thumbnails[i];
          img.className = "thumb";
          span.appendChild(img);
        }
      }
    }
    checkMenuHasItems(menu);
  }

  function selectedFractal(idx) {
    hideGallery();
    current.selectFractal(idx);
    fractal.load(localStorage["fractured.fractal." + idx]);
    fractal.name = localStorage["fractured.names." + idx];
    $('nameInput').value = fractal.name;
    //Generate thumbnails on select!
    if (!current.thumbnails[idx])
      current.thumbnails[idx] = thumbnail();
    populateFractals();
  }

  function newFractal() {
      hideGallery();
    fractal.resetDefaults();
    fractal.formulaDefaults();
    fractal.copyToForm();
    //De-select
    current.selectFractal(-1);
    populateFractals();
    fractal.applyChanges();
  }

  function storeFractal() {
    fractal.applyChanges();
    source = fractal.toStringNoFormulae();  //Default is to save to local storage without formulae
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
            current.thumbnails[idx] = thumbnail();
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
      current.thumbnails[idx] = thumbnail();
      localStorage["fractured.fractals"] = idx;
      current.selectFractal(idx);
      $('nameInput').value = namestr;
    } catch(e) {
      //data wasn’t successfully saved due to quota exceed so throw an error
      alert('Storage error! ' + e);
      //alert('Quota exceeded! ' + idx + " ... Local storage length = " + JSON.stringify(localStorage).length);
    }
    populateFractals();
  }

  function PaletteEntry(source, thumb) {
    this.data = source;
    this.thumb = thumb;
  }

  function savePalette() {
    //Save current palette to list
    try {
      source = colours.palette + "";
      var pstr = localStorage["fractured.palettes"];
      var palettes = [];
      if (pstr) palettes = JSON.parse(pstr);
      //Back compat:
        if (typeof(palettes) != 'object') palettes = [];
      var idx = palettes.length;
      palettes.push(new PaletteEntry(source, paletteThumbnail()));
      localStorage["fractured.palettes"] = JSON.stringify(palettes);
    } catch(e) {
      alert('Storage error! ' + e);
    }
    populatePalettes();
  }

  function populatePalettes() {
    //Clear & repopulate list
    var menu = $('palettes');
    removeChildren(menu);
    addMenuItem(menu, "Save Palette", "savePalette();", null, false, false);
    addMenuItem(menu, "Export Palette", "exportPaletteFile();", null, false, false);
    addMenuItem(menu, "Palette to URL", "packPalette();", null, false, false);
    var palettes;
    if (!localStorage["fractured.palettes"])
      //Default palettes
      palettes = JSON.parse(readURL('/palettes.json', true));
    else
      palettes = JSON.parse(localStorage["fractured.palettes"]);

    for (var i=0; i<palettes.length; i++) {
      var onclick = "loadPalette(" + i + ");";
      var ondelete = "deletePalette(" + i + ");";
      var span = addMenuItem(menu, "", onclick, ondelete, true, false);
      if (!palettes[i].thumb) {
        colours.read(palettes[i].data);
        colours.update();
        palettes[i].thumb = paletteThumbnail();
      }

      var palimg = new Image;
      palimg.src = palettes[i].thumb;
      palimg.style.height = "18px";
      palimg.style.width = "150px";
      palimg.style.margin = "0px";
      palimg.style.padding = "0px";
      span.style.padding = "2px 2px 0px";
      span.style.height = "20px";
      span.appendChild(palimg);
    }

    if (!localStorage["fractured.palettes"])
      localStorage["fractured.palettes"] = JSON.stringify(palettes);

    checkMenuHasItems(menu);
  }

  function loadPalette(idx) {
    try {
      var pstr = localStorage["fractured.palettes"];
      if (pstr) {
        var palettes = JSON.parse(pstr);
        colours.read(palettes[idx].data);
        fractal.applyChanges();
      }
    } catch(e) {
      alert('Storage access error! ' + e);
    }
  }

  function deletePalette(idx) {
    try {
      var pstr = localStorage["fractured.palettes"];
      if (pstr) {
        var palettes = JSON.parse(pstr);
        palettes.splice(idx,1);
        localStorage["fractured.palettes"] = JSON.stringify(palettes);
        populatePalettes();
      }
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
   var canvas = $("fractal-canvas"),
       oldh = fractal.height,
       oldw = fractal.width;
   fractal.width = fractal.height = size;
   fractal.draw(6);

   var result = canvas.toDataURL("image/" + type)

   fractal.width = oldw;
   fractal.height = oldh;
   fractal.draw();

/*/
 // Thumb generated by browser in canvas, badly aliased?
   var thumb = $("thumb");
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
   var canvas = $('gradient');
   colours.get(canvas);
   var thumb = $('thumb');
   thumb.width = 150;
   thumb.height = 1;
   thumb.style.visibility = 'visible';
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
      loadPalette(0); //Palette reset
      newFractal();
      current.clear();
      window.onbeforeunload = null;
    }
  }

  //Import/export all local storage to server
  function uploadState() {
    saveState();  //Update saved data first
    var formdata = new FormData();
    formdata.append("session_id", (current.session ? current.session : 0)); 
    if (current.session > 0 && confirm('Save changes to this session on server?')) {
      //Update existing
    } else {
      var desc = prompt("Enter description for new session");
      if (!desc || desc.length == 0) return;
      formdata.append("description", desc); 
    }

    formdata.append("data", getState()); 
    progress("Uploading session to server...");
    ajaxPost("ss/session_save.php", formdata, sessionSaved, updateProgress);
  }

  function sessionSaved(data) {
    //localStorage['fractured.current.session'] = data;
    current.session = data;
    current.save();
    sessionGet(readURL('ss/session_get.php')); //Get updated list...
    progress();
  }

  function uploadFractalFile(pub) {
    fractal.applyChanges();
    var formdata = new FormData();
    formdata.append("public", Number(pub));
    formdata.append("type", 0);
    if (current.locator && confirm("Overwrite existing fractal on server? (Only works if you created the original)")) formdata.append("locator", current.locator);
    formdata.append("description", $('nameInput').value);
    formdata.append("thumbnail", thumbnail("jpeg", 150).substring(23));
    /*
      if (current.locator)  //TEMPORARY - demo fractals, don't save formulae + palette
        formdata.append("source", fractal.toStringMinimal());
      else//*/
    formdata.append("source", fractal.toString());
    progress("Uploading fractal to server...");
    ajaxPost("ss/fractal_save.php", formdata, fractalUploaded, updateProgress);
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
    var data = window.btoa($('nameInput').value + "\n" + fractal.toString());
    packURL(data);
  }

  function packURL(data) {
    var loc = current.baseurl + "?" + data;
    var link = document.createElement("a");
    link.setAttribute("href", loc);
    var linkText = document.createTextNode("here it is");
    link.appendChild(linkText);
    popup("Copy this link:<br><br>");
    $("popupmessage").appendChild(link);
  }

  function uploadFormulaSet(shared) {
    var formdata = new FormData();
    formdata.append("public", shared);
    //If selected, give option to update existing
    if (shared == 0 && current.formulae > 0 && confirm('Save changes to this formula set on server?'))
      formdata.append("formulae", current.formulae);
    else {
      var name = prompt("Enter name for new formula set");
      if (name == null) return;
      formdata.append("name", name);
    }

    formdata.append("data", JSON.stringify(formula_list));
    progress("Uploading formulae to server...");
    ajaxPost("ss/formula_save.php", formdata, formulaeSaved, updateProgress);
  }

  function formulaeSaved(response) {
    var id = parseInt(response);
    if (id > 0) {
      current.formulae = id;
      current.save();
    } else
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
    /* 
    var d=new Date();
    var fname = "workspace " + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + ".fractured";
    exportFile(fname, "text/fractal-workspace", getState());
    */
  }

  function exportFractalFile() {
    fractal.applyChanges();
    source = fractal.toString();
    exportFile(fractal.name + ".fractal", "text/fractal-source", source);
  }

  function exportFormulaFile(filename, type, source) {
    exportFile(filenameToName(filename)[0] + "." + categoryToType(type) + ".formula", "text/fractal-formula", source);
  }

  function exportFormulaSet() {
    exportFile("fractured.formulae", "text/fractal-formulae", JSON.stringify(formula_list));
  }

  function exportPaletteFile() {
    source = colours.palette + "";
    exportFile(fractal.name + ".palette", "text/palette", source);
  }

  function exportImage(type) {
    //Export using blob, no way to set filename yet
    window.URL = window.URL || window.webkitURL;
    window.open(window.URL.createObjectURL(imageToBlob(type)));
  }

  function exportFile(filename, content, data) {
    if (current.offline) {
      //Export using data URL
      location.href = 'data:' + content + ';base64,' + window.btoa(data);
    } else {

      //Export using server side script to get proper filename
      $("export-filename").setAttribute("value", filename);
      $("export-content").setAttribute("value", content);

      var hiddenField = document.createElement("input");
      hiddenField.setAttribute("type", "hidden");
      hiddenField.setAttribute("name", "data");
      hiddenField.setAttribute("value", data);

      var form = document.forms["exporter"];
      form.appendChild(hiddenField);
      form.submit();
      form.removeChild(hiddenField);
    }
  }

  function imageBase64(type) {
    var canvas = $("fractal-canvas");
    var data = canvas.toDataURL(type);
    var BASE64_MARKER = ';base64,';
    var base64Index = data.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    return data.substring(base64Index);
  }

  function convertToBinary(base64) {
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for(i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  function imageToBlob(type) {
    //Export using blob, no way to set filename yet
    var canvas = $("fractal-canvas");
    var data = convertToBinary(imageBase64(type));
    var blob;
    try {
      //Preferred method
      blob = new Blob([data], {type: type});
    } catch(e) {
      //Deprecated, chrome
      var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder
      var bb = new BlobBuilder;
      bb.append(data.buffer);
      blob = bb.getBlob(type);
    }
    return blob;
  }

  function uploadImgur() {
    fractal.applyChanges();
    var canvas = $("fractal-canvas");
    var data = imageToBlob("image/jpeg");
   
    var fd = new FormData();
    fd.append("image", data);
    fd.append("title", fractal.name);
    fd.append("caption", "Created using Fractured Studio http://fractured.ozone.id.au");
    fd.append("name", fractal.name + ".jpg");
    fd.append("key", "70f934afb26ec9a9b9dc50ac1df2b40f");
   
    var onload = function(response) {
      //alert(response);
      var data = JSON.parse(response);
      var url = data.upload.links.imgur_page;
      var link = document.createElement("a");
      link.setAttribute("href", url);
      var linkText = document.createTextNode(url);
      link.appendChild(linkText);
      $('progressmessage').innerHTML = '';
      $('progressstatus').innerHTML = '';
      $S('progressbar').width = 0;
      $('progressmessage').appendChild(link);
      //...save in our db
      var formdata = new FormData();
      formdata.append("url", 'http://imgur.com/' + data.upload.image.hash + '.jpg');
      formdata.append("description", $('nameInput').value);
      formdata.append("thumbnail", 'http://imgur.com/' + data.upload.image.hash + 's.jpg');
      formdata.append("info", response);
      ajaxPost("ss/image_save.php", formdata);
    }
    // Create the XHR (Cross-Domain XHR FTW!!!)
    var xhr = new XMLHttpRequest();

    progress("Uploading image to Imgur...");
    ajaxPost("http://api.imgur.com/2/upload.json", fd, onload, updateProgress);
  }

  function uploadFlickr() {
    var test = JSON.parse(readURL('ss/flickr.php?test'));
    if (!test.username) {
      window.location = "/ss/flickr.php?auth";
      return;
    }

    fractal.applyChanges();
    var canvas = $("fractal-canvas");
    var data = imageToBlob("image/jpeg");
   
    var fd = new FormData();
    fd.append("photo", data);
    fd.append("title", fractal.name);
    fd.append("description", 'Created using <a href="http://fractured.ozone.id.au">Fractured Studio http://fractured.ozone.id.au</a>');
    fd.append("tags", fractal.name);
    fd.append("public", 1);
    fd.append("friend", 1);
    fd.append("family", 1);
    fd.append("hidden", 2);
   
    var onload = function(response) {
      var data = JSON.parse(response);
      var link = document.createElement("a");
      link.setAttribute("href", data.url);
      var linkText = document.createTextNode(data.url);
      link.appendChild(linkText);
      $('progressmessage').innerHTML = '';
      $('progressstatus').innerHTML = '';
      $S('progressbar').width = 0;
      $('progressmessage').appendChild(link);
      //...save in our db
      var formdata = new FormData();
      formdata.append("url", data.url);
      formdata.append("description", $('nameInput').value);
      formdata.append("thumbnail", data.thumb);
      formdata.append("info", response);
      ajaxPost("ss/image_save.php", formdata);
    }
    // Create the XHR (Cross-Domain XHR FTW!!!)
    var xhr = new XMLHttpRequest();

    progress("Uploading image to Flickr...");
    ajaxPost("ss/flickr.php?upload", fd, onload, updateProgress);
  }


  function loadFormulaeList(data) {
    if (current.offline) return;
    //Load list of saved formula sets from server
    try {
      //Clear & repopulate list
      var menu1 = $('formulae-public');
      var menu2 = $('formulae-private');
      var ondelete = "deleteSelectedFormulae();";
      if (current.loggedin == false)
        ondelete = null;
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
    current.formulae = id;
    current.save();
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
      localStorage["fractured.formulae"] = data;
    } catch(e) {
      alert('ImportFormulae: Error! ' + e);
    }
  }

  function deleteSelectedFormulae()
  {
    if (current.formulae && confirm('Delete this formula set from the server?')) {
      readURL('ss/formula_delete.php?id=' + current.formulae);
      loadFormulaeList(readURL('ss/formula_get.php'));
      current.formulae = 0;
      current.save();
    }
  }

  function loadSession(id)
  {
    if (!confirm('Loading new session. This will overwrite everything!')) return;
    current.session = id;
    current.save();
    ajaxReadFile('ss/session_get.php?id=' + id, importState, false, updateProgress);
    progress("Downloading session from server...");
  }

  function deleteSelectedState()
  {
    if (current.session && confirm('Delete this session from the server?')) {
      readURL('ss/session_delete.php?id=' + current.session);
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
      current.session = 0;
      current.save();
    }
  }

  function getState() {
    //Get current state in local storage minus session/login details and thumbnails
    current.empty();  //Clear local storage settings
      //Save current fractal (as default)
      localStorage["fractured.active"] = fractal;
      localStorage["fractured.name"] = fractal.name;
    var source = JSON.stringify(localStorage);
    current.save(); //Restore settings
    return source;
  }

  function importState(source) {
    try {
      var parsed = JSON.parse(source);
      if (!parsed) return;
      importParsedState(parsed);
    } catch(e) {
      alert('ImportState: Error! ' + e);
    }
  }

  function importParsedState(data) {
    try {
      localStorage.clear(); //clear the entire database
      for (key in data)
        localStorage[key] = data[key];
      //Replace session id, not saved in state data
      current.save();
      sessionGet(readURL('ss/session_get.php')); //Get updated list...
      loadState();  //load the state data
      progress();
      regenerateThumbs();
    } catch(e) {
      alert('ImportParsedState: Error! ' + e);
    }
  }


  function loadState() {
    //Load includes...
    sources = null;
    var i_source = localStorage["fractured.include"];
    if (i_source) sources = JSON.parse(i_source);
    if (!sources) sources = JSON.parse(readURL('/includes.json', true));

    if (current.debug) {
      //Entries for all source files in debug edit menu
      var menu = $('debugedit');
      removeChildren(menu);
      for (key in sources) {
        var onclick = "openEditor('" + key + "')";
        addMenuItem(menu, key, onclick, null, false, false);
      }
    }
    
    //Load formulae
    formula_list = null;
    var f_source = localStorage["fractured.formulae"];
    if (f_source) formula_list = JSON.parse(f_source);
    if (!formula_list) formula_list = JSON.parse(readURL('/defaultformulae.json', true));

    //Custom mouse actions
    a_source = localStorage["fractured.mouseActions"];
    if (a_source)
      mouseActions = JSON.parse(a_source);
    else
      defaultMouseActions();

    //Create formula entries in drop-downs (and any saved load sources)
    updateFormulaLists();

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
      fractal.load(source, true); //Don't display immediately
      fractal.name = localStorage["fractured.name"];
      $('nameInput').value = fractal.name;
    } else {
      //Load & draw default palettes
      loadPalette(0);
    }
  }

  function saveState(thumbs) {
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
      $(panels[i]).style.display = (name == panels[i]) ? 'block':'none';

    //Update edit fields
    if (name == "panel1")
      fractal["base"].reselect();
    if (name == "panel2") {
      fractal["fractal"].reselect();
      fractal["pre_transform"].reselect();
      fractal["post_transform"].reselect();
    }
    if (name == "panel3") {
      fractal["outside_colour"].reselect();
      fractal["inside_colour"].reselect();
    }
    return false;
  }

  function toggleParams() {
    var sidebar = $("left");
    var main = $("main");
    if (sidebar.style.display == 'none') {
      sidebar.style.display = '';
      main.style.left = '334px';
      $('toolsbtn').innerHTML = "Hide Tools &uarr;"
    } else {
      sidebar.style.display = 'none';
      main.style.left = '1px';
      $('toolsbtn').innerHTML = "Show Tools &darr;"
    }
    autoResize(document["inputs"].elements["autosize"].checked);
  }

  function toggleFullscreen(newval) {
    var main = $("main");
    var showparams = ($S("left").display != 'none');
    if (window.requestFullScreen) {
      //Use new html5 full screen API
      if (typeof(newval) == 'boolean' && newval == true) {
        requestFullScreen("main");
        main.style.top = '-1px';  //-1 because chrome sucks
        main.style.left = '0px';
        if (!document["inputs"].elements["autosize"].checked)
          main.style.overflow = "auto";
      } else {
        //Response to fullscreenchange event
        if (!isFullScreen()) {
          main.style.overflow = "visible";
          main.style.top = '27px';
          main.style.left = showparams ? '334px' : '1px';
        }
      }
    }
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
      var id_field = $("openid");
      id_field.setAttribute("value", id);
    }
    var form = document.forms["login_form"];
    form.submit();
  }

  function logout() {
    current.clear();
    if (confirm("Clear current session after logout?"))
      resetState(true);
    readURL('ss/logout.php');
    window.location.reload(false);
  }

/////////////////////////////////////////////////////////////////////////
//Event handling

  function autoResize(newval) {
    if (rztimeout) clearTimeout(rztimeout);

    function doResize() {
      if (current.gallery)
        loadGallery();
      else
        fractal.applyChanges();

      //Hide title if window too small
      if (window.innerWidth < 990)
        $S('title').display = "none";
      else
        $S('title').display = "block";
    }

    //If value passed, setting autoSize, otherwise responding to resize event
    if (typeof(newval) == 'boolean') {
      consoleDebug("Autosize " + newval);
      if (newval!=undefined) {
        //Update width/height immediately
        doResize();
      }
    } else {
      rztimeout = setTimeout(doResize, 150);
    }
  }

  function beforeUnload(event) {
    //This event works in webkit but doesn't allow interaction, always save for now
    saveState();
    return null; //"beforeUnload";
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

/////////////////////////////////////////////////////////////////////////

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
            importFile(e.target.result, file.name);
          };
        })(file);

        // Read in the file (AsText/AsDataURL/AsArrayBuffer/AsBinaryString)
        reader.readAsText(file);
      }
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }
  }

  function importFile(source, filename) {
    //Determine file type from content
    if (source.charAt(0) == '{') {
      //JSON: session, formulae
      try {
        var parsed = JSON.parse(source);
        if (!parsed) return;
        if (parsed["fractured.name"]) {
          //Session state
          consoleDebug("Import: SESSION");
          importParsedState(parsed);
        } else {
          //Formula set
          consoleDebug("Import: FORMULA SET");
          importFormulae(source);
        }
      } catch(e) {
        alert('ImportFile: JSON Parse Error! ' + e);
      }
    } else {
      //Text: formula, fractal, palette
      if (/\[Fractal\]/ig.exec(source)) {
        //Fractal file
        consoleDebug("Import: FRACTAL");
        if (filename.indexOf(".ini") > -1) {
          fractal.iniLoader(source);
          filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
          fractal.applyChanges();
        } else {
            hideGallery();
          fractal.load(source);
        }
        //$("namelabel").value = filename.substr(0, filename.lastIndexOf('.')) || filename;
        fractal.name = filename.substr(0, filename.lastIndexOf('.')) || filename;
        $('nameInput').value = fractal.name;
      } else if (source.indexOf('Background=') == 0) {
        //Palette
        consoleDebug("Import: PALETTE");
        colours.read(source);
      } else {
        //Assume formula definition
        consoleDebug("Import: FORMULA");
        fractal.importFormula(source, filename);
      }
    }
  }

  //Status - logged in, selected values
  // settings kept between sessions
  /**
   * @constructor
   */
  function Status() {
    this.loggedin = false;
    this.offline = null;
    this.gallery = null;
    this.recording = false;
    this.baseurl = "";
    this.locator = null;

    //Persistent settings:
    var source = localStorage["fractured.current"];
    if (source) {
      var data = JSON.parse(source);
      this.fractal = data.fractal;
      this.session = data.session;
      this.formulae = data.formulae;
      this.antialias = data.antialias;
      this.debug = data.debug;
      this.thumbnails = data.thumbnails;
      if (this.debug) this.debugOn();
    } else {
      this.fractal = -1;
      this.session = 0;
      this.formulae = 0;
      this.antialias = 2;
      this.debug = false;
      this.thumbnails = [];
    }
  }

  Status.prototype.empty = function() {
    delete localStorage["fractured.current"];
  }

  Status.prototype.clear = function() {
    this.session = 0;
    this.formulae = 0;
    this.fractal = -1;
    this.save();
  }

  Status.prototype.selectFractal = function(idx) {
    this.fractal = idx;
    this.save();
  }

  Status.prototype.save = function() {
    var data = {};
    data.fractal = this.fractal;
    data.session = this.session;
    data.formulae = this.formulae;
    data.antialias = this.antialias;
    data.debug = this.debug;
    data.thumbnails = this.thumbnails;
    localStorage["fractured.current"] = JSON.stringify(data);
  }

  Status.prototype.debugOn = function() {
    this.debug = true;
    $S('debugmenu').display = 'block';
    $S('recordmenu').display = 'block';
  }

  Status.prototype.debugOff = function() {
    current.debug = false;
    current.save();
    $S('debugmenu').display = 'none';
    $S('recordmenu').display = 'none';
  }



  function consoleDebug(str) {
    if (current.debug) consoleWrite(str);
    //alert(" called by: " + arguments.callee.caller);
  }

  function consoleWrite(str) {
    var console = $('console');
    console.innerHTML += "<div class='message'>" + str + "</div>";
    $('panel5').scrollTop = console.clientHeight - $('panel5').clientHeight + $('panel5').offsetHeight;
  }

  function consoleClear() {
    var console = $('console');
    console.innerHTML = '';
  }

  function record(state) {
    current.recording = state;
    var canvas = $("fractal-canvas");
    if (current.recording) {
      //Ensure a multiple of 2
      if (fractal.width % 2 == 1) fractal.width -= 1;
      if (fractal.height % 2 == 1) fractal.height -= 1;
    }
    $('recordOn').className = current.recording ? 'selected_item' : '';
    $('recordOff').className = !current.recording ? 'selected_item' : '';
  }

  function outputFrame() {
    var canvas = $("fractal-canvas");
    var data = imageBase64("image/png");
    document.body.style.cursor = "wait";
    ajaxPost("http://localhost:8080/frame", data, frameDone);
  }

  function frameDone(response) {
    document.body.style.cursor = "default";
    consoleDebug("Request sent");
  }

  //Save values of all selected parameters for use in scripting
  function ParamVals(paramset) {
    this.set = paramset;
    for (key in paramset) {
      if (typeof(paramset[key]) == "object" && paramset[key].type != undefined)
        this[key] = paramset[key].value; 
    }
  }

  ParamVals.prototype.update = function() {
    //Copy changed values to fields
    for (key in this.set) {
      if (typeof(this.set[key]) == "object" && this.set[key].type != undefined) {
        this.set[key].value = this[key]; 
        this.set[key].copyToElement();
      }
    }
  }

  //Script object, passed source code inserted at the step() function
  function Script(source) {
    this.count = 1;
    this.step = 1;
    this.step = Function(source);
    this.base = new ParamVals(fractal.base.currentParams);
    this.fractal = new ParamVals(fractal.fractal.currentParams);
    this.preTransform = new ParamVals(fractal.pre_transform.currentParams); 
    this.postTransform = new ParamVals(fractal.post_transform.currentParams);
    this.insideColour = new ParamVals(fractal.inside_colour.currentParams); 
    this.outsideColour = new ParamVals(fractal.outside_colour.currentParams);
  }

  Script.prototype.update = function() {
    this.base.update();
    this.fractal.update();
    this.preTransform.update();
    this.postTransform.update();
    this.insideColour.update();
    this.outsideColour.update();
  }

  function runScript() {
    //Run an animation script
    var script = new Script(sources["include/script.js"])

    function next() {
      script.step();
      if (script.count < script.steps) {
        script.count++;
        if (window.requestAnimationFrame)
          window.requestAnimationFrame(next);
        else
          next();
      }
    }

    next();
  }

