  //Handler class from passed functions
  function MouseEventHandler(click, move, wheel) {
    //All these functions should take (event, mouse)
    this.click = click;
    this.move = move;
    this.wheel = wheel;
  }

  function Mouse(element, handler) {
    this.element = element;
    //Custom handler for mouse actions...
    //requires members: click(event, mouse), move(event, mouse) and wheel(event, mouse)
    this.handler = handler;

    this.isdown = false;
    this.button = null;
    this.x = 0;
    this.x = 0;
    this.absoluteX = 0;
    this.absoluteY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.slider = null;
    this.spin = 0;
    this.wheelTimer = false;  //Timer before triggering wheel callback
    this.moveUpdate = false;  //Save mouse move origin once on mousedown or every move

    // for mouse scrolling in Firefox
    if (element.addEventListener) element.addEventListener("DOMMouseScroll", handleMouseWheel, false);
    element.onmousedown = handleMouseDown;
    element.onmousewheel = handleMouseWheel;
    //element.oncontextmenu = function() { return false; }      
  }

  Mouse.prototype.update = function(e) {
    // Get the mouse position relative to the document.
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) {
      this.x = e.pageX;
      this.y = e.pageY;
    }
    else {
      this.x = e.clientX + document.body.scrollLeft +
               document.documentElement.scrollLeft;
      this.y = e.clientY + document.body.scrollTop +
               document.documentElement.scrollTop;
    }
    //Note: screen relative coords are only that are consistent (e.screenX/Y)

    //Save doc relative coords
    this.absoluteX = this.x;
    this.absoluteY = this.y;
    //Get element offset in document
    var offset = findElementPos(this.element);
    //Convert coords to position relative to element
    this.x -= offset[0];
    this.y -= offset[1];
    //Save position without scrolling, only checked in ff5 & chrome12
    this.clientx = e.clientX - offset[0];
    this.clienty = e.clientY - offset[1];
  }

  // Get offset of element
  function findElementPos(obj) {
   var curleft = curtop = 0;
    //if (obj.offsetParent) { //Fix for chrome not getting actual object's offset here
      do {
         curleft += obj.offsetLeft;
         curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
    //}
    return [curleft,curtop];
  }

  function handleMouseDown(event) {
    //Event delegation details
    var e = event || window.event;
    this.mouse.elementId = e.target.id;
    this.mouse.elementClass = e.target.className;

    this.mouse.update(event);
    if (!this.mouse.isdown) {
      this.mouse.lastX = this.mouse.absoluteX;
      this.mouse.lastY = this.mouse.absoluteY;
    }
    this.mouse.isdown = true;
    this.mouse.button = event.button;
    //Set document move & up event handlers to this.mouse object's
    document.mouse = this.mouse;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    //No handler for mouse down at present, prevent default actions anyway
    //var action = false;
    //If handler returns false, prevent default action
    //if (!action && event.preventDefault) event.preventDefault();  // Firefox
    //event.returnValue = action;
  }

  //Default handlers for up & down, call specific handlers on element
  function handleMouseUp(event) {
    var action = true;
    if (this.mouse.isdown) 
    {
      this.mouse.update(event);
      action = this.mouse.handler.click(event, this.mouse);
      this.mouse.isdown = false;
      this.mouse.button = null;
    }
    //Restore default mouse on document
    document.mouse = defaultMouse;

    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  }

  function handleMouseMove(event) {
    this.mouse.update(event);
    this.mouse.deltaX = this.mouse.absoluteX - this.mouse.lastX;
    this.mouse.deltaY = this.mouse.absoluteY - this.mouse.lastY;
    var action = this.mouse.handler.move(event, this.mouse);

    if (this.mouse.moveUpdate) {
      //Constant update of last position
      this.mouse.lastX = this.mouse.absoluteX;
      this.mouse.lastY = this.mouse.absoluteY;
    }

    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  }
 
  function handleMouseWheel(event) {
    var nDelta = 0;
    var action = false;
    if (!event) event = window.event; // For IE, access the global (window) event object
    // cross-bowser handling of eventdata 
    if ( event.wheelDelta ) { // IE and Opera
        nDelta= event.wheelDelta;
        if ( window.opera ) nDelta= -nDelta  // Opera has the values reversed
    }
    else if (event.detail) nDelta= -event.detail; // Mozilla FireFox

    event.spin = nDelta > 0 ? 1 : -1;

    //Set timer for 1/8 sec and accumulate spin
    if (this.mouse.wheelTimer && this.mouse.spin == 0) {
      document.mouse.event = event; //Save event
      //document.body.style.cursor = "wait";
      //setTimeout('mouseWheelTimout(document.mouse);', 125);
      //setTimeout('mouseWheelTimout(document.mouse);', 50);
      setTimeout('mouseWheelTimout(document.mouse);', 50);
    }
    this.mouse.spin += event.spin;

    if (!this.mouse.wheelTimer && this.mouse.spin != 0)
      action = this.mouse.handler.wheel(event, this.mouse);

    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  } 

  function mouseWheelTimout(mouse) {
    //Turn hourglass off
    //document.body.style.cursor = "default";
    mouse.event.spin = mouse.spin;
    mouse.spin = 0;
    //Call implementation handler if changed..
    if (mouse.event.spin != 0) mouse.handler.wheel(mouse.event, mouse);
  }


