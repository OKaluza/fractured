//Reads a file from server, responds when done with file data + passed name to callback function
function ajaxReadFile(filename, callback, nocache)
{ 
  var http = new XMLHttpRequest();

  http.onreadystatechange = function()
  {
    if(http.readyState == 4) {
      if(http.status == 200) {
        consoleWrite("loaded: " + filename);
        if (callback)
          callback(http.responseText, filename);
      } else {
        if (callback)
          callback();    //Error callback
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

//Posts request to server, responds when done with response data to callback function
function ajaxPost(url, params, callback)
{ 
  var http = new XMLHttpRequest();

  http.onreadystatechange = function()
  { 
    if(http.readyState == 4)
      if(http.status == 200) {
        consoleWrite("POST: " + url + "&" + params);
        if (callback)
          callback(http.responseText);
      } else {
        if (callback)
          callback();    //Error callback
        else
          consoleWrite("Ajax Post Error: returned status code " + http.status + " " + http.statusText);
      }
  }

  http.open("POST", url, true); 

  //Send the proper header information along with the request
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.setRequestHeader("Content-length", params.length);
  http.setRequestHeader("Connection", "close");

  http.send(params); 
}

//Saves a file to the server, must exist and be writable
function ajaxWriteFile(filename, data, callback) {
  var http = new XMLHttpRequest();

  var url = "writefile.php";
  var encoded = encodeURIComponent(data);
  var params = "filename=" + filename + "&data=" + encoded;
  http.open("POST", url, true);

  //Send the proper header information along with the request
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.setRequestHeader("Content-length", params.length);
  http.setRequestHeader("Connection", "close");

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



function ajaxUploadFile(file, callback) {
  var fileName = file.name;
  var fileSize = file.size;
  var fileType = file.type;
  var reader = new FileReader(); //Create FileReader object to read the data
  reader.readAsText(file); //Start reading the file

  reader.onload = function() { //Execute this when the file is successfully read
    //callback(fileData);  //Call passed function on data directly
    var fileData = reader.result + "\r\n";
    callback(fileData, file.name);  //Call passed function on data directly
/* This is all for uploading to the server...

    var boundary = "fileboundary"; //Boundary name
    var uri = "uploader.php"; //Path to script for handling the file sent

    var http = new XMLHttpRequest(); //Create the object to handle async requests

    http.onreadystatechange = function() 
    {
      if(http.readyState == 4)
        if (http.status == 200) {
          alert(http.responseText);
          //callback("./upload" + fileName);  //Call passed function on filename
        } else
          alert("Error: returned status code " + http.status + " " + http.statusText);
    }

    http.open("POST", uri, true); //Open a request to the web address set
    //Next two lines set headers to fool receiving server into thinking they were sent via form
    http.setRequestHeader("Content-Type", "multipart/form-data, boundary="+boundary);
    http.setRequestHeader("Content-Length", fileSize);

    //Set up the body of the POST data includes the name & image data.
    var body = "--" + boundary + "\r\n";
    body += "Content-Disposition: form-data; name='file'; filename='" + fileName + "'\r\n";
    body += "Content-Type: application/octet-stream\r\n\r\n";
    body += fileData + "\r\n";
    //body += reader.result + "\r\n";
    body += "--" + boundary + "--";

    //Use sendAsBinary to send binary data. If you are sending text just use send.
    //http.sendAsBinary(body);
    http.send(body);
  */
  }
  return true;
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
