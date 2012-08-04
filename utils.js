//Get key from local storage or return default if not found
function localStorageDefault(key, def) {
  return varDefault(localStorage[key], def);
}

function varDefault(variable, def) {
  if (variable) return variable;
  return def;
}

function removeChildren(element) {
  if (element.hasChildNodes()) {
    while (element.childNodes.length > 0 )
    element.removeChild(element.firstChild);
  }
}

//Browser specific animation helper function
if ( !window.requestAnimationFrame ) {
  window.requestAnimationFrame = ( function() {
    return window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame;
  } )();
}

//JQuery style lookup by id and style
function $(v,o) { return((typeof(o)=='object'?o:document).getElementById(v)); }
function $S(o) { o=$(o); if(o) return(o.style); }
function toggle(v) { var d = $S(v).display; if (d == 'none' || !d) $S(v).display='block'; else $S(v).display='none'; }

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

if (!String.prototype.hashCode) {
  String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i);
      hash = ((hash<<5)-hash)+chr;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

if (!String.prototype.strip) {
  String.prototype.strip = function () {
    return this.replace(/(\r\n|\n|\r)/gm, "");
  };
}


if (!String.prototype.toTitleCase) {
  String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };
}

if (!String.prototype.entityify) {
  String.prototype.entityify = function () {
    return this.replace(/&/g, "&amp;").replace(/</g,
      "&lt;").replace(/>/g, "&gt;");
  };
}

if (!String.prototype.quote) {
  String.prototype.quote = function () {
    var c, i, l = this.length, o = '"';
    for (i = 0; i < l; i += 1) {
      c = this.charAt(i);
      if (c >= ' ') {
        if (c === '\\' || c === '"') {
          o += '\\';
        }
        o += c;
      } else {
        switch (c) {
        case '\b':
          o += '\\b';
          break;
        case '\f':
          o += '\\f';
          break;
        case '\n':
          o += '\\n';
          break;
        case '\r':
          o += '\\r';
          break;
        case '\t':
          o += '\\t';
          break;
        default:
          c = c.charCodeAt();
          o += '\\u00' + Math.floor(c / 16).toString(16) +
            (c % 16).toString(16);
        }
      }
    }
    return o + '"';
  };
} 

if (!String.prototype.supplant) {
  String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
      function (a, b) {
        var r = o[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s*(\S*(?:\s+\S+)*)\s*$/, "$1");
  };
}

if (!String.prototype.pad) {
  String.prototype.pad = function(totalChars, padWith) {
    padWith = (padWith) ? padWith :"0"; // set default pad
    var str = this;
    if(str.length < totalChars){
      while(str.length < totalChars){
        str = padWith + str;
      }
    }
    return str;
  }
}
