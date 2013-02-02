function record(state) {
  state.recording = state;
  var canvas = $("fractal-canvas");
  if (state.recording) {
    //Ensure a multiple of 2
    if (fractal.width % 2 == 1) fractal.width -= 1;
    if (fractal.height % 2 == 1) fractal.height -= 1;
  }
  $('recordOn').className = state.recording ? 'selected_item' : '';
  $('recordOff').className = !state.recording ? 'selected_item' : '';
}

function outputFrame() {
  var canvas = $("fractal-canvas");
  var data = imageToBlob("image/jpeg", 0.95);
  var fd = new FormData();
  fd.append("image", data);
  ajaxPost("http://localhost:8080/frame?name=" + labelToName($('name').value), fd, frameDone);
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
  this.fractal = new ParamVals(fractal.choices.fractal.currentParams);
  this.preTransform = new ParamVals(fractal.choices.pre_transform.currentParams); 
  this.postTransform = new ParamVals(fractal.choices.post_transform.currentParams);
  this.insideColour = new ParamVals(fractal.choices.inside_colour.currentParams); 
  this.outsideColour = new ParamVals(fractal.choices.outside_colour.currentParams);
  this.filter = new ParamVals(fractal.choices.filter.currentParams);
}

Script.prototype.update = function() {
  this.fractal.update();
  this.preTransform.update();
  this.postTransform.update();
  this.insideColour.update();
  this.outsideColour.update();
  this.filter.update();
}

function runScript(filename) {
  //Run an animation script
  state.output = false;
  var script = new Script(localStorage[filename])

  function next() {
    script.step();
    //Update & redraw (without timers or incremental drawing)
    fractal.applyChanges(null, true);
    //Next step...
    if (script.count < script.steps) {
      script.count++;
      if (window.requestAnimationFrame)
        window.requestAnimationFrame(next);
      else
        next();
    } else {
      state.output = true;
      print("Script finished");
    }
  }

  next();
}

