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

    if(http.readyState == 4) {
      if(http.status == 200) {
        if (progress) setProgress(100);
        debug("RECEIVED: " + filename);
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
    if(http.readyState == 4)
      if(http.status == 200) {
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

