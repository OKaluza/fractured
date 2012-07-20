//Reads a file from server, responds when done with file data + passed name to callback function
function ajaxReadFile(filename, callback, nocache, progress)
{ 
  var http = new XMLHttpRequest();
  if (progress != undefined) http.onprogress = progress;

  http.onreadystatechange = function()
  {
    if(http.readyState == 4) {
      if(http.status == 200) {
        setProgress(100);
        consoleDebug("RECEIVED: " + filename);
        if (callback)
          callback(http.responseText, filename);
      } else {
        if (callback)
          callback("Error: " + http.status);    //Error callback
        else
          consoleWrite("Ajax Read File Error: returned status code " + http.status + " " + http.statusText);
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

function updateProgress(evt) 
{
  //evt.loaded: bytes browser received/sent
  //evt.total: total bytes set in header by server (for download) or from client (upload)
  if (evt.lengthComputable) 
    setProgress(evt.loaded / evt.total)*100;  
} 

function setProgress(percentage)
{
  var val = Math.round(percentage);
  $S('progressbar').width = (3 * val) + "px";
  $('progressstatus').innerHTML = val + "%";
} 

//Posts request to server, responds when done with response data to callback function
function ajaxPost(url, params, callback, progress)
{ 
  var http = new XMLHttpRequest();
  if (progress != undefined) http.upload.onprogress = progress;

  http.onreadystatechange = function()
  { 
    if(http.readyState == 4)
      if(http.status == 200) {
        setProgress(100);
        consoleDebug("POST: " + url);
        if (callback)
          callback(http.responseText);
      } else {
        if (callback)
          callback("Error, status:" + http.status);    //Error callback
        else
          consoleWrite("Ajax Post Error: returned status code " + http.status + " " + http.statusText);
      }
  }

  http.open("POST", url, true); 

  //Send the proper header information along with the request
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.setRequestHeader("Content-length", params.length);

  http.send(params); 
}

//Saves a file to the server, must exist and be writable
function ajaxWriteFile(filename, data, callback) {
  var http = new XMLHttpRequest();

  var url = "ss/writefile.php";
  var encoded = encodeURIComponent(data);
  var params = "filename=" + filename + "&data=" + encoded;
  http.open("POST", url, true);

  //Send the proper header information along with the request
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.setRequestHeader("Content-length", params.length);

  http.onreadystatechange = function() 
  {
    if(http.readyState == 4)
      if (http.status == 200)
        callback(http.responseText); //Supply response to callback fn
      else
        consoleWrite("Ajax Write File Error: returned status code " + http.status + " " + http.statusText);
  }
  http.send(params);
}

//Request from server, responds when done with file data + passed name to callback function
function ajaxRequestPost(callback)
{ 
  var http = new XMLHttpRequest();

  http.onreadystatechange = function()
  { 
    if(http.readyState == 4)
      if(http.status == 200) {
        consoleWrite("loaded: " + filename);
        if (callback)
          callback(filename, http.responseText);
      } else  
        consoleWrite("Ajax Read File Error: returned status code " + http.status + " " + http.statusText);
  } 
  //Add date to url to prevent caching
  var d = new Date();
  http.open("GET", filename + "?d=" + d.getTime(), true); 
  http.send(null); 
}

function callJsonp()
{
  // the url of the script where we send the asynchronous call
      data = window.btoa(fractal + ""); //Test sending a bunch of base64 encoded data with url
  var url = "http://localhost:8080/" + data;
  // create a new script element
  var script = document.createElement('script');
  // set the src attribute to that url
  script.setAttribute('src', url);
  // insert the script in our page
    consoleWrite("Calling " + url);
  document.getElementsByTagName('head')[0].appendChild(script);
}

// this function should parse responses.. you can do anything you need..
// you can make it general so it would parse all the responses the page receives based on a response field
function parseRequest(response)
{
  consoleWrite(response);
}
