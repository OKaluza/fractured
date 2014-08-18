/* Javascript graphics utility library
 * Helper functions, WebGL classes, Mouse input, Colours and Gradients UI
 * Copyright (c) 2014, Owen Kaluza
 * Released into public domain:
 * This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it as long as this header remains intact
 */
//Miscellaneous javascript helper functions
//Module definition, TODO: finish module
var OK = (function () {
  var ok = {};

  ok.debug_on = false;
  ok.debug = function(str) {
      if (!ok.debug_on) return;
      var uconsole = document.getElementById('console');
      if (uconsole)
        uconsole.innerHTML = "<div style=\"font-family: 'monospace'; font-size: 8pt;\">" + str + "</div>" + uconsole.innerHTML;
      else
        console.log(str);
  };

  ok.clear = function consoleClear() {
    var uconsole = document.getElementById('console');
    if (uconsole) uconsole.innerHTML = '';
  };

  return ok;
}());

function getSearchVariable(variable, defaultVal) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (unescape(pair[0]) == variable) {
      return unescape(pair[1]);
    }
  }
  return defaultVal;
}

function getImageDataURL(img) {
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/png");
  return dataURL;
}

//DOM

//Shortcuts for element and style lookup
if (!window.$) {
  window.$ = function(v,o) { return((typeof(o)=='object'?o:document).getElementById(v)); }
}
if (!window.$S) {
  window.$S = function(o)  { o = $(o); if(o) return(o.style); }
}
if (!window.toggle) {
  window.toggle = function(v) { var d = $S(v).display; if (d == 'none' || !d) $S(v).display='block'; else $S(v).display='none'; }
}

//Set display style of all elements of classname
function setAll(display, classname) {
  var elements = document.getElementsByClassName(classname)
  for (var i=0; i<elements.length; i++)
    elements[i].style.display = display;
}

//Get some data stored in a script element
function getSourceFromElement(id) {
  var script = document.getElementById(id);
  if (!script) return null;
  var str = "";
  var k = script.firstChild;
  while (k) {
    if (k.nodeType == 3)
      str += k.textContent;
    k = k.nextSibling;
  }
  return str;
}

function removeChildren(element) {
  if (element.hasChildNodes()) {
    while (element.childNodes.length > 0)
      element.removeChild(element.firstChild);
  }
}

//Browser specific animation frame request
if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
    return window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame;
  } )();
}

//Browser specific full screen request
function requestFullScreen(id) {
  var element = document.getElementById(id);
  if (element.requestFullscreen)
      element.requestFullscreen();
  else if (element.mozRequestFullScreen)
      element.mozRequestFullScreen();
  else if (element.webkitRequestFullScreen)
      element.webkitRequestFullScreen();
}

function typeOf(value) {
  var s = typeof value;
  if (s === 'object') {
    if (value) {
      if (typeof value.length === 'number' &&
          !(value.propertyIsEnumerable('length')) &&
          typeof value.splice === 'function') {
        s = 'array';
      }
    } else {
      s = 'null';
    }
  }
  return s;
}

function isEmpty(o) {
  var i, v;
  if (typeOf(o) === 'object') {
    for (i in o) {
      v = o[i];
      if (v !== undefined && typeOf(v) !== 'function') {
        return false;
      }
    }
  }
  return true;
}

//AJAX
//Reads a file from server, responds when done with file data + passed name to callback function
function ajaxReadFile(filename, callback, nocache, progress)
{ 
  var http = new XMLHttpRequest();
  var total = 0;
  if (progress != undefined) {
    if (typeof(progress) == 'number')
      total = progress;
    else
      http.onprogress = progress;
  }

  http.onreadystatechange = function()
  {
    if (total > 0 && http.readyState > 2) {
      //Passed size progress
      var recvd = parseInt(http.responseText.length);
      //total = parseInt(http.getResponseHeader('Content-length'))
      if (progress) setProgress(recvd / total * 100);
    }

    if (http.readyState == 4) {
      if (http.status == 200) {
        if (progress) setProgress(100);
        OK.debug("RECEIVED: " + filename);
        if (callback)
          callback(http.responseText, filename);
      } else {
        if (callback)
          callback("Error: " + http.status);    //Error callback
        else
          print("Ajax Read File Error: returned status code " + http.status + " " + http.statusText);
      }
    }
  } 

  //Add date to url to prevent caching
  if (nocache)
  {
    var d = new Date();
    http.open("GET", filename + "?d=" + d.getTime(), true); 
  }
  else
    http.open("GET", filename, true); 
  http.send(null); 
}

function readURL(url, nocache, progress) {
  //Read url (synchronous)
  var http = new XMLHttpRequest();
  var total = 0;
  if (progress != undefined) {
    if (typeof(progress) == 'number')
      total = progress;
    else
      http.onprogress = progress;
  }

  http.onreadystatechange = function()
  {
    if (total > 0 && http.readyState > 2) {
      //Passed size progress
      var recvd = parseInt(http.responseText.length);
      //total = parseInt(http.getResponseHeader('Content-length'))
      if (progress) setProgress(recvd / total * 100);
    }
  } 

  //Add date to url to prevent caching
  if (nocache)
  {
    var d = new Date();
    http.open("GET", url + "?d=" + d.getTime(), false); 
  } else
    http.open('GET', url, false);
  http.overrideMimeType('text/plain; charset=x-user-defined');
  http.send(null);
  if (http.status != 200) return '';
  if (progress) setProgress(100);
  return http.responseText;
}

function updateProgress(evt) 
{
  //evt.loaded: bytes browser received/sent
  //evt.total: total bytes set in header by server (for download) or from client (upload)
  if (evt.lengthComputable) {
    setProgress(evt.loaded / evt.total * 100);
    debug(evt.loaded + " / " + evt.total);
  }
} 

function setProgress(percentage)
{
  var val = Math.round(percentage);
  $S('progressbar').width = (3 * val) + "px";
  $('progressstatus').innerHTML = val + "%";
} 

//Posts request to server, responds when done with response data to callback function
function ajaxPost(url, params, callback, progress, headers)
{ 
  var http = new XMLHttpRequest();
  if (progress != undefined) http.upload.onprogress = progress;

  http.onreadystatechange = function()
  { 
    if (http.readyState == 4) {
      if (http.status == 200) {
        if (progress) setProgress(100);
        debug("POST: " + url);
        if (callback)
          callback(http.responseText);
      } else {
        if (callback)
          callback("Error, status:" + http.status);    //Error callback
        else
          print("Ajax Post Error: returned status code " + http.status + " " + http.statusText);
      }
    }
  }

  http.open("POST", url, true); 

  //Send the proper header information along with the request
  if (typeof(params) == 'string') {
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.setRequestHeader("Content-length", params.length);
  }

  //Custom headers
  if (headers) {
    for (key in headers)
      //alert(key + " : " + headers[key]);
      http.setRequestHeader(key, headers[key]);
  }

  http.send(params); 
}

