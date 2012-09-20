window['mouseWheelTimeout'] = mouseWheelTimeout;

  var enableContext = false;
  var defaultMouse;
  var mousetimer = null;

  //Handler class from passed functions
  /**
   * @constructor
   */
  function MouseEventHandler(click, down, move, wheel) {
    //All these functions should take (event, mouse)
    this.fallback = Function('return false;');
    this.down = down;
    this.click = click;
    this.move = move;
    this.wheel = wheel;
    if (!this.down) this.down = this.fallback;
    if (!this.click) this.click = this.fallback;
    if (!this.move) this.move = this.fallback;
    if (!this.wheel) this.wheel = this.fallback;
  }

  /**
   * @constructor
   */
  function Mouse(element, handler) {
    this.element = element;
    //Custom handler for mouse actions...
    //requires members: click(event, mouse), move(event, mouse) and wheel(event, mouse)
    this.handler = handler;

    this.disabled = false;
    this.isdown = false;
    this.button = null;
    this.dragged = false;
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
    //To disable context menu
    //element.oncontextmenu = function() { return false; }
    element.oncontextmenu = function() {
      if (enableContext) {
        enableContext = false;
        return true;
      }
      return false; 
    }
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

  function getMouse(event) {
    var mouse = event.target.mouse;
    if (mouse) return mouse;
    //Attempt to find in parent nodes
    var target = event.target;
    var i = 0;
    while (target != document) {
      target = target.parentNode;
      if (target.mouse) return target.mouse;
    }

    return null;
  }

  function handleMouseDown(event) {
    //Event delegation details
    var mouse = getMouse(event);
    if (!mouse || mouse.disabled) return true;
    var e = event || window.event;
    mouse.elementId = e.target.id;
    mouse.elementClass = e.target.className;
    //Clear dragged flag on mouse down
    mouse.dragged = false;

    mouse.update(event);
    if (!mouse.isdown) {
      mouse.lastX = mouse.absoluteX;
      mouse.lastY = mouse.absoluteY;
    }
    mouse.isdown = true;
    mouse.button = event.button;
    //Set document move & up event handlers to this.mouse object's
    document.mouse = mouse;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    //Handler for mouse down
    var action = mouse.handler.down(event, mouse);
    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  }

  //Default handlers for up & down, call specific handlers on element
  function handleMouseUp(event) {
    var mouse = document.mouse;
    if (!mouse || mouse.disabled) return true;
    var action = true;
    if (mouse.isdown) 
    {
      mouse.update(event);
      action = mouse.handler.click(event, mouse);
      mouse.isdown = false;
      mouse.button = null;
      mouse.dragged = false;
    }
    //Restore default mouse on document
    document.mouse = defaultMouse;

    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  }

  function handleMouseMove(event) {
    var mouse = document.mouse;
    if (!mouse || mouse.disabled) return true;
    mouse.update(event);
    mouse.deltaX = mouse.absoluteX - mouse.lastX;
    mouse.deltaY = mouse.absoluteY - mouse.lastY;
    var action = mouse.handler.move(event, mouse);

    //Set dragged flag if moved more than limit
    if (!mouse.dragged && mouse.isdown && Math.abs(mouse.deltaX) + Math.abs(mouse.deltaY) > 3)
      mouse.dragged = true;

    if (mouse.moveUpdate) {
      //Constant update of last position
      mouse.lastX = mouse.absoluteX;
      mouse.lastY = mouse.absoluteY;
    }

    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  }
 
  function handleMouseWheel(event) {
    if (mousetimer) clearTimeout(mousetimer);
    var mouse = getMouse(event);
    if (!mouse || mouse.disabled) return true;
    mouse.update(event);
    var nDelta = 0;
    var action = false;
    if (!event) event = window.event; // For IE, access the global (window) event object
    // cross-bowser handling of eventdata 
    if (event.wheelDelta) // IE and Opera
      nDelta= event.wheelDelta;
    else if (event.detail)
      nDelta= -event.detail; // Mozilla FireFox

    event.spin = nDelta > 0 ? 1 : -1;
    mouse.spin += event.spin;

    //Set timer for 1/8 sec and accumulate spin
    if (mouse.wheelTimer) { // && mouse.spin == 0) {
      document.mouse.event = event; //Save event
      document.body.style.cursor = "wait";
      mousetimer = setTimeout('mouseWheelTimeout(document.mouse);', 200);
      //setTimeout('mouseWheelTimeout(document.mouse);', 50);
    }

    if (!mouse.wheelTimer && mouse.spin != 0)
      action = mouse.handler.wheel(event, mouse);

    //If handler returns false, prevent default action
    if (!action && event.preventDefault) event.preventDefault();  // Firefox
    event.returnValue = action;
  } 

  function mouseWheelTimeout(mouse) {
    //Turn hourglass off
    document.body.style.cursor = "default";
    mouse.event.spin = mouse.spin;
    mouse.spin = 0;
    mousetimer = null;
    //Call implementation handler if changed..
    if (mouse.event.spin != 0) mouse.handler.wheel(mouse.event, mouse);
  }


