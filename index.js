//TODO:
//Image on flickr (or imgur) deleted (both sites show a placeholder image), detect and remove from db?

//Globals
var state;    //Local storage
var sources;  //Source files
var fractal;  //Fractal renderer
var colours;  //Gradient
var fractals; //Fractal list
var palettes; //Palette list

//Timers
var rztimeout = undefined;

function appInit() {
  try {
    state = new State("---VERSION---");
  } catch (e) {
    popup(e);
    return;
  }
  //Force offline mode when loaded locally
  if (window.location.href.indexOf("file://") == 0) state.offline = true;
  if (!navigator.onLine) state.offline = true;
  showPanel('info');
  setAll('none', 'loggedin');  //hide logged in menu options
  var urlq = decodeURI(window.location.href);
  var h = urlq.indexOf("#");
  if (h > 0) urlq = urlq.substring(0, h);
  var query;
  if (urlq.indexOf("?") > 0) {
    var parts = urlq.split("?"); //whole querystring before and after ?
    query = parts[1]; 
    //Strip stupid trailing /
    if (query.charAt(query.length-1) == "/") query = query.substr(0, query.length-1);
    state.baseurl = parts[0];
  } else {
    if (urlq.indexOf("file:///") == 0)
       state.baseurl = urlq;
    else {
      //URL rewriting
      var pos = urlq.lastIndexOf("/");
      query = urlq.substr(pos+1);
      state.baseurl = urlq.substr(0, pos);
    }
  }
  if (!query && !$(location.hash)) {
    //Convert #id to query if not a section tag
    query = location.hash.substr(1);
  }
  var restored = "";
  var flickr = false;
  if (query) {
    var list = query.split("&");
    for (var i=0; i<list.length; i++) {
      if (list[i].indexOf('debug') >= 0) {
        //debug mode enabled, show extra menus
        state.debugOn();
        state.saveStatus();
      } else if (list[i].indexOf('legacy') >= 0) {
        state.legacy = true;
        debug("Legacy loading mode enabled");
      } else if (list[i].indexOf('flickr') >= 0) {
        flickr = true; //Skip gallery display
      } else if (list[i].indexOf('reset') >= 0) {
        state.resetFormulae();
      } else if (list[i].length > 20) {
        //Load fractal from base64 packed url
        restored = window.atob(list[i]);
      } else if (!state.offline && list[i].length > 3) {
        //Load fractal from hash ID
        restored = list[i];
      }
    }
  }
  debug("Base URL: " + state.baseurl);
  debug("Query options: " + query);

  //Strip commands from url
  window.history.pushState("", "", state.baseurl);

  //Colour editing and palette management
  colours = new GradientEditor($('palette'), function() {if (fractal) fractal.applyChanges();});

  //Fractal & canvas
  fractal = new Fractal('main');

  if (!state.offline) {
    //Session restore:
    //First call to server must not be async or we'll get session creation race conditions
    sessionGet(readURL('ss/session_get.php?info=' + fractal.infoString(), false)); //Get updated list...
    //ajaxReadFile('ss/session_get.php', sessionGet, false); //Get updated list...
    //Load formula lists from server
    ajaxReadFile('ss/formula_get.php', loadFormulaeList, false);
  }

  //Initialise app
  if (!state.load()) return;   //Load the last program state
  fractal.init();             //Create a default fractal

  //Event handling
  document.onkeydown = handleKey;
  window.onresize = autoResize;
  window.onhashchange = hashChanged;
  window.onmozfullscreenchange = toggleFullscreen
  window.onfullscreenchange = toggleFullscreen
  $('main').onwebkitfullscreenchange = toggleFullscreen;
  if (window.opera) window.onunload = beforeUnload;
  window.onbeforeunload = beforeUnload;

  //Form mouse wheel
  var forms = ["param_inputs", "fractal_inputs", "colour_inputs"];
  for (var f in forms) {
    var element = $(forms[f]);
    if (element.addEventListener) element.addEventListener("DOMMouseScroll", handleFormMouseWheel, false);
    element.onmousewheel = handleFormMouseWheel;
  }

  setAntiAliasMenu();

  //Draw & update
  state.lastFractal();  //Restore last if any
  if (restored.length > 30) {
    restoreFractal(restored);   //Restore from URL
  } else if (restored.length > 0) {
    loadUrl(restored); //Load from hash
  } else if (flickr) {
    //Return to last drawn fractal
    hideGallery();
    //Upload when draw finished
    fractal.ondraw = uploadFlickr;
    fractal.applyChanges();
  } else if (!state.offline) {
    showGallery(location.hash);
  }

  loadHelp();
  loadScript("/codemirror.js", "");
}

//Forced reset - used when upgrading
function resetReload() {
  history.pushState("",document.title,location.pathname+"&reset");
  location.reload(true);
}

//Load from a locator hash
function loadUrl(locator) {
  state.locator = locator;
  fractal.clear();
  progress("Loading fractal...");
  ajaxReadFile('ss/fractal_get.php?id=' + state.locator, restoreFractal, false);
  //Set address
  window.history.pushState("", "", state.baseurl + "/" + state.locator);
}

function loadScript(filename, onload) {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = filename;
  script.setAttribute("onload", onload);
  head.appendChild(script);
}

function handleKey(event) {
  switch (event.keyCode) {
    case 13:
      handleFormEnter(event);
      break;
    case 27:
      //ESC
      //Deliberate passthrough:
    case 192:
      //~`
      togglePreview();
      break;
  }
}

function loadHelp() {
  ajaxReadFile('docs_' + state.version + '.html', function(data) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;
    var divs = tempDiv.getElementsByTagName('div')
    if (divs.length > 0)
      $('help').innerHTML = divs[0].innerHTML;
    } );
}

function hashChanged() {
  if ($(location.hash))
    showGallery(location.hash);
  else {
    //Remove other hash
    debug(location.hash);
    history.pushState("", document.title, 
                      window.location.pathname
                      + window.location.search);
  }
}

function showGallery(id) {
  if (!id) {
    id = state.gallery ? state.gallery : "#examples";
    window.history.pushState("", "", state.baseurl);
  } else  {
    state.offset = 0;
  }
  if (state.gallery) {
    $(state.gallery).className = '';
    $S('note' + state.gallery).display = 'none';
  }
  $(id).className = 'selected';
  $S('note' + id).display = 'block';
  state.gallery = id;
  state.mode = 0;
  loadGallery();
}

function loadGallery(offset) {
  $S('gallery').display = "block";
    setAll('none', 'render');  //hide render mode menu options
  $S('fractal-canvas').display = "none";
  if (offset == undefined) offset = state.offset;
  var w = $('gallery').clientWidth; //window.innerWidth - 334;
  var h = $('gallery').clientHeight; //window.innerHeight - 27;
  //$S('gallery').width = w + "px";
  //$S('gallery').height = h + "px";

  type = state.gallery.substr(1);
  //$('gallery-display').innerHTML = readURL('ss/images.php?type=' + type + '&offset=' + offset + '&width=' + w + "&height=" + h);
  ajaxReadFile('ss/images.php?type=' + type + '&offset=' + offset + '&width=' + w + "&height=" + h, fillGallery, false);
  state.offset = offset;
}

function fillGallery(html) {
  $('gallery-display').innerHTML = html;
}

function hideGallery() {
  //Hide gallery, show fractal
  $S('gallery').display = "none";
  $S('fractal-canvas').display = "block";
  setAll('block', 'render');  //Unhide render mode menu options
  setAll(state.loggedin ? 'block' : 'none', 'loggedin');  //show/hide logged in menu options
  //Switch to parameters
  if (state.mode == 0 && selectedTab == $('tab_info')) showPanel('params');;
  state.mode = 1;
}

//session JSON received
function sessionGet(data) {
  state.offline = false;
  var usermenu = $('session_user_menu');
  var loginmenu = $('session_login_menu');
  //Check for invalid or empty response
  if (!data || data.charAt(0) != "[") {
    //Responds with "!" if no session, so check for as valid response
    if (data.charAt(0) != "!") {
      //Offline mode
      print('Offline!');
      state.offline = true;
      return;
    }
  } else {
    //Parse session data, if we get this far we have an active logged in user
    state.loggedin = true;
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
        var item = addMenuItem(menu, label, "loadSession(" + list[i].id + ")", null, true);
        if (state.session == list[i].id) selectMenuItem(item, "deleteSelectedState();");
      }
      checkMenuHasItems(menu);

    } catch(e) {
      alert('LoadSessionList: Error! ' + e);
    }
  }
}

function restoreFractal(restored) {
  hideGallery();
  var lines = restored.split("\n"); // split on newlines
  var name = lines[0];
  lines.splice(0,1);
  var data = lines.join('\n');
  if (name == "[Palette]") {
    state.lastFractal();  //Restore last if any
    colours.read(data);
    fractal.applyChanges();
  } else {
    fractal.load(data);
    $('name').value = name;
  }
  progress();
}

function setAntiAlias(val) {
  if (!val) val = prompt('Enter quality (1-8) Higher values may be very slow!');
  if (val && val > 0 && val <= 8) {
    fractal.antialias = state.antialias = val;
    state.saveStatus();
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

//Menu management functions...
function addMenuItem(menu, label, onclick, icon, atstart) {
  var entry = document.createElement("li");
  var span = document.createElement("span");
  //span.onclick = onclick;
  span.setAttribute("onclick", onclick);
  span.appendChild(span.ownerDocument.createTextNode(label));
  if (icon) span.appendChild(icon);
  entry.appendChild(span);
  if (atstart)
    menu.insertBefore(entry, menu.firstChild);
  else
    menu.appendChild(entry);
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

function selectMenuItem(span, ondelete) {
  if (ondelete) addMenuDelete(span, ondelete);
  span.parentNode.className = "selected_item";
}

function deselectMenuItem(span, ondelete) {
  if (!span) return;
  //Remove delete button if any
  if (ondelete) {
    var children = span.childNodes;
    for (var i=0; i<children.length; i++) {
      if (children[i].type == "button")
        span.removeChild(children[i]);
    }
  }
  span.parentNode.className = "";
}

function checkMenuHasItems(menu) {
  if (!menu.hasChildNodes()) {
    var entry = document.createElement("li");
    entry.appendChild(entry.ownerDocument.createTextNode("(empty)"));
    menu.appendChild(entry);
  }
}

//Utility, set display style of all elements of classname
function setAll(display, classname) {
  var elements = document.getElementsByClassName(classname)
  for (var i=0; i<elements.length; i++)
    elements[i].style.display = display;
}

//Fractal menu management
function fractalMenuThumb(name) {
  if (fractals[name].thumbnail) {
    var img = new Image;
    img.src = fractals[name].thumbnail;
    img.className = "thumb";
    return img;
  }
  return null;
}

function fractalMenuUpdate(name) {
  //Update thumbnail
  var img = fractalMenuThumb(name);
  var item = $(fractals[name].id);
  if (img && item.childNodes.length > 1) {
    item.replaceChild(img, item.childNodes[1]);
  }
}

var next_id = 0;
function fractalMenuAdd(name) {
  var menu = $('fractals');
  var source = fractals[name].source;
  var img = fractalMenuThumb(name);
  var item = addMenuItem(menu, name, "selectedFractal('" + name + "')", img, true)
  if (state.fractal == name) selectMenuItem(item, "deleteFractal('" + name + "');");
  item.id = "fractalmenu_" + next_id;  //Set entry id
  fractals[name].id = item.id;
  next_id++;
}

function fractalMenuSelect(name) {
  if (state.fractal)
    deselectMenuItem($(fractals[state.fractal].id), true);
  state.fractal = name;
  state.saveStatus();
  if (name)
    selectMenuItem($(fractals[name].id), "deleteFractal('" + name + "');");
}

function fractalMenuDelete(name) {
  $('fractals').removeChild($(fractals[name].id).parentNode);
}

/////////////////////////////////////////////////////////////////////////

function deleteFractal(name) {
  if (!name || !confirm('Really delete the fractal: "' + name + '"')) return;
  try {
    fractalMenuDelete(name);
    fractalMenuSelect();
    delete fractals[name];
    if (window.opera) state.save();  //Not saved on beforeunload
  } catch(e) {
    alert('Storage delete error! ' + e);
  }
}

function performTask(number, numToProcess, processItem) {
  var pos = 0;
  var items = [];
  for (var key in fractals) {
    items[pos] = fractals[key];
    if (state.legacy) { //CONVERT ALL
      fractal.load(fractals[key].source, true);
      fractals[key].source = fractal.toStringNoFormulae();
    }
    pos++;
  }
  pos = 0;
  progress("Generating thumbnails...");
  // This is run once for every numToProcess items.
  function iteration() {
      // Calculate last position.
      var j = Math.min(pos + numToProcess, number);
      // Start at current position and loop to last position.
      for (var i = pos; i < j; i++) {
        processItem(items[i]);
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
        var elapsed = new Date().getTime() - state.timer;
        state.output = true;
        print("Generate thumbnails took: " + (elapsed / 1000) + " seconds");
        populateFractals();
        state.lastFractal();  //Restore last if any
        hideGallery();
        fractal.applyChanges();
      }
  }
  iteration();
}

function regenerateThumbs() {
  hideGallery();
  //Recreate all thumbnail images
  state.save();
  state.output = false;
  var count = Object.keys(fractals).length;
  state.timer = new Date().getTime();
  var step = Math.ceil(count/25);
  performTask(count, step,
    function (f) {
      fractal.load(f.source, true);
      $("width").value = $("height").value = 32;
      document["inputs"].elements["autosize"].checked = false;
      fractal.applyChanges(4, true);
      var result = $('fractal-canvas').toDataURL("image/jpeg", 0.75)
      f.thumbnail = result;
    });
}

function populateFractals() {
  //Clear & repopulate list
  next_id = 0;
  var menu = $('fractals');
  removeChildren(menu);
  for (var name in fractals)
    fractalMenuAdd(name);
}

function selectedFractal(name) {
  hideGallery();
  fractalMenuSelect(name);
  fractal.load(fractals[name].source);
  $('name').value = name;
  //Generate thumbnails on select!
  if (!fractals[name].thumbnail) {
    fractals[name].thumbnail = thumbnail();
  }
}

function newFractal() {
    hideGallery();
  fractal.resetDefaults();
  fractal.formulaDefaults();
  fractal.copyToForm();
  //De-select
  fractalMenuSelect();
  fractal.applyChanges();
}

function storeFractal() {
  source = fractal.toStringNoFormulae();  //Default is to save to local storage without formulae
  //Save current fractal to list
  if (state.fractal) {
    //Save existing
    var name = state.fractal;
    if (name == $('name').value && fractals[name]) {
      if (confirm('Overwrite "' + name + '"?')) {
        try {
          fractals[name].source = source;
          fractals[name].thumbnail = thumbnail();
          fractalMenuUpdate(name);
        } catch(e) {
          alert('error! ' + e);
        }
        return;
      }
    }
  }

  //Save new
  //Get name and check list for dupes
  var name = $('name').value;
  if (!name) name = "unnamed";
  var add = 0;
  var checkstr = name;
  //Find unique name
  while (fractals[checkstr])
    checkstr = name + (++add);
  if (name != checkstr && !confirm('Save as "' + checkstr + '"?')) return;
  //if (name == checkstr && !confirm('Save new fractal as "' + name + '"?')) return;
  name = checkstr;
  try {
    fractals[name] = new FractalEntry(source);
    fractalMenuAdd(name);
    fractalMenuSelect(name);
    $('name').value = name;
  } catch(e) {
    //data wasn’t successfully saved due to quota exceed so throw an error
    alert('error! ' + e);
  }
  if (window.opera) state.save();  //Not saved on beforeunload
}

/**
 * @constructor
 */
function FractalEntry(source, thumb) {
  //Construct a new fractal item
  this.source = source;

  if (thumb)
    this.thumbnail = thumb;
  else
    this.thumbnail = thumbnail(); //Create from active
}

/**
 * @constructor
 */
function PaletteEntry(source, thumb) {
  this.data = source;
  this.thumb = thumb;
}

function savePalette() {
  //Save current palette to list
  source = colours.palette + "";
  palettes.push(new PaletteEntry(source, paletteThumbnail()));
  populatePalettes();
  if (window.opera) state.save();
}

function populatePalettes() {
  //Clear & repopulate list
  var menu = $('palettes');
  removeChildren(menu);

  for (var i=0; i<palettes.length; i++) {
    if (!palettes[i].thumb) {
      colours.read(palettes[i].data);
      colours.update(true);
      palettes[i].thumb = paletteThumbnail();
    }

    var palimg = new Image;
    palimg.src = palettes[i].thumb;

    var item = addMenuItem(menu, "", "loadPalette(" + i + "); fractal.applyChanges();", palimg, false);
    addMenuDelete(item, "deletePalette(" + i + ");");
  }

  checkMenuHasItems(menu);
}

function loadPalette(idx) {
  if (palettes[idx])
    colours.read(palettes[idx].data);
  if (window.opera) state.save();
}

function deletePalette(idx) {
  palettes.splice(idx,1);
  populatePalettes();
  if (window.opera) state.save();
}

function packPalette() {
  var data = window.btoa("[Palette]" + "\n" + colours.palette.toString());
  packURL(data);
}

function populateScripts() {
  //Clear & repopulate list
  var menu = $('scripts');
  removeChildren(menu);
  for (var key in localStorage) {
    if (key.indexOf("scripts/") != 0) continue;
    var item = addMenuItem(menu, key.substr(8), "editScript('" + key + "');");
    addMenuDelete(item, "delete localStorage['" + key + "']; populateScripts();");
  }
  checkMenuHasItems(menu);
}

function editScript(key) {
  if (!key) {
    key = prompt("Enter script name:");
    if (!key) return;
    if (key.indexOf(".js") < 0) key += ".js";
    key = 'scripts/' + key;
    localStorage[key] = "";
    populateScripts();
  }
  openEditor(key);
}

function thumbnail(type, size, args) {
  //Thumbnail image gen
  if (type == undefined) type = "jpeg";
  if (args == undefined && type == "jpeg") args = 75;
  if (size == undefined) size = 32; //40;
  var canvas = $("fractal-canvas"),
     oldh = fractal.height,
     oldw = fractal.width;
  fractal.width = fractal.height = size;
  fractal.draw(4, true);

  var result = canvas.toDataURL("image/" + type, args)

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

//Import/export all local storage to server
function uploadState() {
  var formdata = new FormData();
  formdata.append("session_id", (state.session ? state.session : 0)); 
  if (state.session > 0 && confirm('Save changes to this session on server?')) {
    //Update existing
  } else {
    var desc = prompt("Enter description for new session");
    if (!desc || desc.length == 0) return;
    formdata.append("description", desc); 
  }

  formdata.append("data", state.toString()); 
  progress("Uploading session to server...");
  ajaxPost("ss/session_save.php", formdata, sessionSaved, updateProgress);
}

function sessionSaved(data) {
  state.session = data;
  state.saveStatus();
  sessionGet(readURL('ss/session_get.php')); //Get updated list...
  progress();
}

function uploadFractalFile(pub) {
  var formdata = new FormData();
  formdata.append("type", 0);
  if (state.locator && 
      confirm("Overwrite existing fractal on server? (Only works if you created the original)")) {
    formdata.append("locator", state.locator);
  }
  if (pub == undefined) pub = confirm("Share this fractal publicly after uploading?");
  formdata.append("public", Number(pub));
  formdata.append("description", $('name').value);
  formdata.append("thumbnail", thumbnail("jpeg", 150).substring(23));
  formdata.append("source", fractal.toString());
  progress("Uploading fractal to server...");
  ajaxPost("ss/fractal_save.php", formdata, fractalUploaded, updateProgress);
}

function fractalUploaded(url) {
  if (url.indexOf("http") < 0) {alert(url); progress(); return;}
  var link = document.createElement("a");
  link.setAttribute("href", url);
  var linkText = document.createTextNode(url);
  link.appendChild(linkText);
  //$S("progressbar").width = "300px";
  progressDoneLink(link);
}

function packFractal() {
  var data = window.btoa($('name').value + "\n" + fractal.toString());
  packURL(data);
}

function packURL(data) {
  var loc = state.baseurl + "?" + data;
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
  if (state.formulae > 0 && confirm('Save changes to this formula set on server?'))
    formdata.append("formulae", state.formulae);
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
    state.formulae = id;
    state.saveStatus();
  } else
    alert("Formula save error: " + response);

  //Refresh list
  loadFormulaeList(readURL('ss/formula_get.php'));
  progress();
}

//Import/export all local storage to a text file
function exportStateFile() {
  //data url version, always use for now for session state as quicker than server round trip
  location.href = 'data:text/fractal-workspace;base64,' + window.btoa(state.toString());
  /* 
  var d=new Date();
  var fname = "workspace " + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + ".fractured";
  exportFile(fname, "text/fractal-workspace", state.toString());
  */
}

function exportFractalFile() {
  source = fractal.toString();
  exportFile($('name').value + ".fractal", "text/fractal-source", source);
}

function exportFormulaFile(filename, type, source) {
  var fn = filename;
  if (fn.indexOf(".") < 0)
    fn = filenameToName(fn)[0] + "." + categoryToType(type) + ".formula";
  exportFile(fn, "text/fractal-formula", source);
}

function exportFormulaSet() {
  exportFile("fractured.formulae", "text/fractal-formulae", JSON.stringify(formula_list));
}

function exportPaletteFile() {
  source = colours.palette + "";
  exportFile($('name').value + ".palette", "text/palette", source);
}

function exportImage(type, args) {
  //Export using blob, no way to set filename yet
  window.URL = window.URL || window.webkitURL;
  if (window.URL)
    window.open(window.URL.createObjectURL(imageToBlob(type, args)));
  else
    window.open($("fractal-canvas").toDataURL(type, args));
}

function exportFile(filename, content, data) {
  if (state.offline) {
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

function imageBase64(type, args) {
  var canvas = $("fractal-canvas");
  var data = canvas.toDataURL(type, args);
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

function imageToBlob(type, args) {
  //Export using blob, no way to set filename yet
  var data = convertToBinary(imageBase64(type, args));
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
  var canvas = $("fractal-canvas");
  var data = imageToBlob("image/jpeg", 0.95);
 
  var fd = new FormData();
  fd.append("image", data);
  fd.append("title", $('name').value);
  fd.append("description", "Created using Fractured Studio http://fract.ured.me");
  fd.append("name", $('name').value + ".jpg");
  fd.append("key", "70f934afb26ec9a9b9dc50ac1df2b40f");
 
  var onload = function(response) {
    var data;
    try {
      data = JSON.parse(response);
    } catch(e) {
      alert('Parse response error: ' + e + ' : ' + response);
      return;
    }
    if (!data.success) {
      alert('Error: ' + response);
      return;
    }
    //{"data":{"id":"kS57B","deletehash":"hICeieQff1uoBt4","link":"http:\/\/i.imgur.com\/kS57B.jpg"},"success":true,"status":200}
    var url = data.data.link;
    var link = document.createElement("a");
    link.setAttribute("href", url);
    var linkText = document.createTextNode(url);
    link.appendChild(linkText);
    progressDoneLink(link);
    //...save in our db
    var formdata = new FormData();
    formdata.append("url", 'http://i.imgur.com/' + data.data.id + '.jpg');
    formdata.append("description", $('name').value);
    formdata.append("thumbnail", 'http://i.imgur.com/' + data.data.id + 's.jpg');
    formdata.append("info", response);
    ajaxPost("ss/image_save.php", formdata);
  }
  progress("Uploading image to Imgur...");
  ajaxPost("https://api.imgur.com/3/image", fd, onload, updateProgress, {"Authorization" : "Client-ID b29e1ddddcb30a7"});
}

function uploadFlickr() {
  fractal.ondraw = null;  //Remove callback
  var test = JSON.parse(readURL('ss/flickr.php?test'));
  if (!test.username) {
    popup("Not logged in.<br><a href='/ss/flickr.php?auth'>Click here</a> to log in to your flickr account");
    //window.location = "/ss/flickr.php?auth";
    return;
  }

  var data = imageToBlob("image/jpeg", 0.95);
 
  var fd = new FormData();
  fd.append("photo", data);
  fd.append("title", $('name').value);
  fd.append("description", "Created using <a href='http://fract.ured.me'>Fractured Studio (fract.ured.me)</a>");
  fd.append("tags", $('name').value);
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
    progressDoneLink(link);
    //...save in our db
    var formdata = new FormData();
    formdata.append("url", data.url);
    formdata.append("description", $('name').value);
    formdata.append("thumbnail", data.thumb);
    formdata.append("info", response);
    ajaxPost("ss/image_save.php", formdata);
  }
  progress("Uploading image to Flickr...");
  ajaxPost("ss/flickr.php?upload", fd, onload, updateProgress);
}


function loadFormulaeList(data) {
  if (state.offline) return;
  //Load list of saved formula sets from server
  try {
    //Clear & repopulate list
    var menu1 = $('formulae-public');
    var menu2 = $('formulae-private');
    if (state.loggedin == false)
      ondelete = null;
    removeChildren(menu1);
    removeChildren(menu2);
    var list = JSON.parse(data);
    for (var i=0; i<list.length; i++) {
      var label = list[i].date + "\n" + list[i].name;
      var onclick = "loadFormulaSet(" + list[i].id + ")";
      var item;
      if (list[i]["public"] == "1")
        item = addMenuItem(menu1, label, onclick);
      else
        item = addMenuItem(menu2, label, onclick);

      if (state.formulae == list[i].id)
        selectMenuItem(item, "deleteSelectedFormulae();");
    }
    checkMenuHasItems(menu1);
    checkMenuHasItems(menu2);
  } catch(e) {
    alert('LoadFormulaeList: Error! ' + e);
  }
}

function loadFormulaSet(id) {
  if (!confirm('Loading new formula set. This will overwrite currently loaded formulae!')) return;
  state.formulae = id;
  state.saveStatus();
  progress("Downloading formula set...");
  importFormulae(readURL('ss/formula_get.php?id=' + id, true, updateProgress));
  //Repopulate menu (so selected set)
  loadFormulaeList(readURL('ss/formula_get.php'));
  progress();
}

function importFormulae(data) {
  try {
    //Create formula entries in drop-downs (and any saved load sources)
    importFormulaList(data);
    fractal.copyToForm();  //Update selections
    fractal.reselectAll();
  } catch(e) {
    alert('ImportFormulae: Error! ' + e);
  }
}

function deleteSelectedFormulae()
{
  if (state.formulae && confirm('Delete this formula set from the server?')) {
    readURL('ss/formula_delete.php?id=' + state.formulae);
    loadFormulaeList(readURL('ss/formula_get.php'));
    state.formulae = 0;
    state.saveStatus();
  }
}

function loadSession(id)
{
  if (!confirm('Loading new session. This will overwrite everything!')) return;
  state.session = id;
  state.saveStatus();
  ajaxReadFile('ss/session_get.php?id=' + id, function(data) {state.read(data);}, false, updateProgress);
  progress("Downloading session from server...");
}

function deleteSelectedState()
{
  if (state.session && confirm('Delete this session from the server?')) {
    readURL('ss/session_delete.php?id=' + state.session);
    sessionGet(readURL('ss/session_get.php')); //Get updated list...
    state.session = 0;
    state.saveStatus();
  }
}

/////////////////////////////////////////////////////////////////////////
////Tab controls
var panels = ['panel_params', 'panel_formula', 'panel_colour', 'panel_info', 'panel_log'];
var selectedTab = null;
function showPanel(name)
{
  var tab = $('tab_' + name);
  var panel = 'panel_' + name;
  if (!selectedTab) selectedTab = $('tab_params');

  selectedTab.className = 'unselected';
  selectedTab = tab;
  selectedTab.className = 'selected';

  for(i = 0; i < panels.length; i++)
    $(panels[i]).style.display = (panel == panels[i]) ? 'block':'none';

  //Update edit fields
  if (panel == "panel_formula") {
    fractal.choices["fractal"].reselect();
    fractal.choices["pre_transform"].reselect();
    fractal.choices["post_transform"].reselect();
  }
  if (panel == "panel_colour") {
    fractal.choices["outside_colour"].reselect();
    fractal.choices["inside_colour"].reselect();
    fractal.choices["filter"].reselect();
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
  /*
  var popdiv = document.createElement('div');
  popdiv.className = 'popup';
  var popclose = document.createElement('div');
  popclose.className = 'popclose';
  popclose.appendChild(popclose.ownerDocument.createTextNode('X'));
  popclose.setAttribute("onclick", 'this.parentNode.parentNode.removeChild(this.parentNode);');
  popdiv.appendChild(popclose);
  var popmsg = document.createElement('div');
  popmsg.appendChild(popclose.ownerDocument.createTextNode(text));
  popdiv.appendChild(popmsg);
  $('main').appendChild(popdiv);
  */
  var el = $('popup');
  if (text) {
    if (el.style.display == 'block') {
      $('popupmessage').innerHTML += "<hr>" + text;
    } else {
      $('popupmessage').innerHTML = text;
    }
    el.style.marginTop = "-" + Math.floor($('popup').clientHeight / 2) + "px";
    el.style.display = 'block';
  } else
    el.style.display = 'none';
}

function progress(text) {
  var el = $('progress');
  if (text == undefined || el.style.display == 'block') {
    el.style.display = 'none';
    //setTimeout("$('progress').style.display = 'none';", 150);
  } else {
    $('progressmessage').innerHTML = text;
    $('progressstatus').innerHTML = "";
    $S('progressbar').width = 0;
    el.style.display = 'block';
  }
}

function progressDoneLink(link) {
  $("progressstatus").innerHTML = "";
  $("progressmessage").innerHTML = "";
  $("progressmessage").appendChild(link);
  $S("progressbar").width = "0px";
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
  if (confirm("Clear current session after logout?"))
    state.reset(true);
  readURL('ss/logout.php');
  window.location.reload(false);
}

/////////////////////////////////////////////////////////////////////////
//Event handling

function autoResize(newval) {
  if (rztimeout) clearTimeout(rztimeout);

  function doResize() {
    if (state.mode == 0)
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
    debug("Autosize " + newval);
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
  state.save();
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
  return true;
}

function handleFormEnter(event) {
  //Enter key pressed
  event = event || window.event;
  if (event.target.type == 'text' || event.target.type == 'number') {
    //Copy coord to selected field
    if (event.shiftKey || event.altKey || event.ctrlKey) {
      var target = event.target.id;
      //Detect two-component (complex number) field
      if (/_[01]$/i.exec(event.target.id)) {
        target = event.target.id.slice(0, event.target.id.length-1);
        $(target + "0").value = fractal.canvas.mouse.coord.re;
        $(target + "1").value = fractal.canvas.mouse.coord.im;
      }
    }
  }

  //Redraw
  fractal.applyChanges();
  return true;
}


function handleFormMouseWheel(event) {
  //Event delegation from parameters form
  event = event || window.event;
  if (event.target.type == 'text' || event.target.type == 'number' || event.target.type == 'range') {
    var field = event.target; 
    if (field.timer) clearTimeout(field.timer);
    wheelSpin(event);
    field.style.cursor = "wait";
    if (event.target.type == 'range') {
      //Adjust by step
      field.value = parseReal(field.value) + parseReal(field.step) * event.spin;
      field.onchange();
    } else  {
      //If any of modifier keys held, scroll digit under mouse pointer
      var pos;
      var dpt = field.value.indexOf(".");
      if (event.shiftKey || event.altKey || event.ctrlKey) {
        //Get mouse position relative to field
        var coord = mousePageCoord(event);
        elementRelativeCoord(field, coord)
        //Calculate the digit position the mouse is above
        //...for each digit in field
        pos = field.value.length;
        for (var i=1; i<=field.value.length; i++) {
          var txt=field.value.substr(0,i);
          var test = $("fonttest");
          test.innerHTML = txt;
          var width = (test.clientWidth + 1);
          var digit = field.value.substr(i-1, 1);
          //print(i + " : (" + txt + ") " + width);
          //Mouse over and is digit?
          if (coord[0] < width && /[0-9]/.test(digit)) {
            pos = i;
            field.style.cursor = "none";  //Hide cursor so can see digit below
            break;
          }
        }
        //print("Mouse: " + coord[0] + " digit: " + pos);
      } else {
        //Always scroll units when no modifiers pressed
        dpt = field.value.indexOf(".");
        if (dpt > 0)
          pos = dpt; //Place before decimal
        else
          pos = field.value.length; //Last digit
      }

      //Find decimal point and calculate decimal places
      var places = 0;
      if (dpt >= 0) places = field.value.length - dpt - 1;

      //Replace digits with 0 except one we are changing, use this to calculate increment value
      var zeros = field.value.replace(/[1-9]/g, "0");
      //Multiply wheel spin by place unit val
      var spin = event.spin * parseReal(zeros.substr(0,pos-1) + "1" + zeros.substr(pos));
      var val = parseReal(field.value);
      if (val < 0) spin = -spin;  //Reverse direction
      //Add increment value to existing value, ensure same decimal places
      field.value = (spin + val).toFixed(places);
    } 

    field.timer = setTimeout('fractal.applyChanges(); $S("' + field.id + '").cursor = "text";', 150);
    //field.timer = setTimeout('fractal.applyChanges();', 150);
    if (event.preventDefault) event.preventDefault();  // Firefox
    return false;
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
          importFile(e.target.result, file.name, file.lastModifiedDate);
        };
      })(file);

      // Read in the file (AsText/AsDataURL/AsArrayBuffer/AsBinaryString)
      reader.readAsText(file);
    }
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function importFile(source, filename, date) {
  //Determine file type from content
  if (source.charAt(0) == '{') {
    //JSON: session, formulae
    try {
      var parsed = JSON.parse(source);
      if (!parsed) {alert("Invalid data"); return;}
      if (parsed["fractured.name"]) {
        //Session state
        debug("Import: SESSION");
        state.read(parsed);
      } else {
        //Formula set
        debug("Import: FORMULA SET");
        importFormulae(source);
      }
    } catch(e) {
      alert('ImportFile: JSON Parse Error! ' + e);
    }
  } else {
    //Text: formula, fractal, palette
    if (/\[Fractal\]/ig.exec(source)) {
      //Fractal file
      debug("Import: FRACTAL");
      hideGallery();
      if (filename.indexOf(".ini") > -1) {
        fractal.iniLoader(source);
        filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
      } else {
        //Pre 0.7, 0.78+ files have version=
        if (state.legacy || date && date < new Date(2012,9,1))
          fractal.loadOld(source);
        else
          fractal.load(source);
        //if (/version=\(/g.exec(source))
      }
      //$("namelabel").value = filename.substr(0, filename.lastIndexOf('.')) || filename;
      $('name').value = filename.substr(0, filename.lastIndexOf('.')) || filename;
    } else if (source.indexOf('Background=') == 0) {
      //Palette
      debug("Import: PALETTE");
      colours.read(source);
    } else {
      //Assume formula definition
      debug("Import: FORMULA");
      fractal.importFormula(source, filename);
    }
  }
}

function debug(str) {
  if (!state.output) return;
  if (state.debug) print(str);
  //alert(" called by: " + arguments.callee.caller);
}

function print(str) {
  if (!state.output) return;
  var console = $('console');
  console.innerHTML += "<div class='message'>" + str + "</div>";
  $('panel_log').scrollTop = console.clientHeight - $('panel_log').clientHeight + $('panel_log').offsetHeight;
}

function consoleClear() {
  var console = $('console');
  console.innerHTML = '';
}

