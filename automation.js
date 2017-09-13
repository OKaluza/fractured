function recordStart() {
  //Switched on
  state.recording = true;
  if (state.server) {
    state.controlMode(true);
    state.drawMode(false);
  }
  //Ensure a multiple of 2
  if (fractal.width % 2 == 1) fractal.width -= 1;
  if (fractal.height % 2 == 1) fractal.height -= 1;
  fractal.ondraw = outputFrame;
  document.getElementById('recordOn').className = 'selected_item';
  document.getElementById('recordOff').className = '';
}

function recordStop() {
  if (state.server) {
    state.controlMode(false);
    state.recording = false;
    var http = new XMLHttpRequest();
    //Record off bug immediately starts new recording overwriting previous, quit instead
    //http.open("GET", fractal.server.url + "/command=record", false); 
    http.open("GET", fractal.server.url + "/command=quit", false); 
    http.send(null); 
    state.drawMode(true);
  } else if (state.recording) {
    ajaxReadFile('http://localhost:8080/end', frameDone);
    fractal.ondraw = null;
  }
  document.getElementById('recordOn').className = '';
  document.getElementById('recordOff').className = 'selected_item';
}

function outputFrame() {
  if (state.server) { //Post synchronous to avoid frame ordering problems
    var http = new XMLHttpRequest();
    http.open("POST", fractal.server.url + "/update", false); 
    http.send(fractal.server.data);
    frameDone();
    return;
  }
  var canvas = document.getElementById("fractal-canvas");
  var data = imageToBlob("image/jpeg", 0.95);
  var fd = new FormData();
  fd.append("image", data);
  try {
    var http = new XMLHttpRequest();
    http.open("POST", "http://localhost:8080/frame?name=" + labelToName(document.getElementById('name').value), false); 
    http.send(fd);
  } catch (e) {
    debug(e.message);
  }
  frameDone();
  //ajaxPost("http://localhost:8080/frame?name=" + labelToName(document.getElementById('name').value) + "&frame=" + state.recording, fd, frameDone);
}

function frameDone(response) {
  document.body.style.cursor = "default";
  debug("Request sent");
}

/**
 * @constructor
 */
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
  fractal.copyToForm();
}

/**
 * @constructor
 */
//Script object, passed source code inserted at the step() function
function Script(source) {
  this.count = 1;
  this.step = 1;
  this.step = Function(source);
  this.core = new ParamVals(fractal.choices.core.currentParams);
  this.fractal = new ParamVals(fractal.choices.fractal.currentParams);
  this.preTransform = new ParamVals(fractal.choices.pre_transform.currentParams); 
  this.postTransform = new ParamVals(fractal.choices.post_transform.currentParams);
  this.insideColour = new ParamVals(fractal.choices.inside_colour.currentParams); 
  this.outsideColour = new ParamVals(fractal.choices.outside_colour.currentParams);
  this.filter = new ParamVals(fractal.choices.filter.currentParams);
}

Script.prototype.update = function() {
  this.core.update();
  this.fractal.update();
  this.preTransform.update();
  this.postTransform.update();
  this.insideColour.update();
  this.outsideColour.update();
  this.filter.update();
}

function runScript(filename) {
  //Run an animation script
  var script;
  var timer = new Timer();

  //Resume?
  if (filename) {
    script = new Script(localStorage[filename]);
  } else {
    if (!state.paused) return;
    script = state.paused;
  }
  state.output = false;
  state.paused = false;
  document.getElementById('script_controls').style.display = 'block';
  document.getElementById("resume").disabled = true;
  document.getElementById("pause").disabled = false;

  function next() {
    script.step();
    //Update & redraw (without timers or incremental drawing)
    document.getElementById("steps").innerHTML = script.count + " / " + script.steps;
    fractal.applyChanges(null, true);
    if (state.recording) window.outputFrame(); 
    if (state.paused) {
      //Save in state until resumed
      state.paused = script;
      document.getElementById("resume").disabled = false;
      document.getElementById("pause").disabled = true;
      return;
    }
    //Next step...
    if (script.count < script.steps) {
      script.count++;
      if (window.requestAnimationFrame)
        window.requestAnimationFrame(next);
      else
        next();
    } else {
      state.output = true;
      timer.print("Script");
      document.getElementById('script_controls').style.display = 'none';
    }
  }

  next();
}


