/**
 * GLSL tokenizer for codemirror
 * Based on Java tokenizer by Patrick Wied
 * @version 2011-03-27
 */
var tokenizeGLSL = (function() {
  // Advance the stream until the given character (not preceded by a
  // backslash) is encountered, or the end of the line is reached.
  function nextUntilUnescaped(source, end) {
    var escaped = false;
    var next;
    while (!source.endOfLine()) {
      var next = source.next();
      if (next == end && !escaped)
        return false;
      escaped = !escaped && next == "\\";
    }
    return escaped;
  }

  // A map of GLSL's keywords. The a/b/c keyword distinction is
  // very rough, but it gives the parser enough information to parse
  // correct code correctly (we don't care that much how we parse
  // incorrect code). The style information included in these objects
  // is used by the highlighter to pick the correct CSS style for a
  // token.
  var keywords = function(){
    function result(type, style){
      return {type: type, style: "glsl-" + style};
    }
    // keywords that take a parenthised expression, and then a
    // statement (if)
    var keywordA = result("keyword a", "keyword");
    // keywords that take just a statement (else)
    var keywordB = result("keyword b", "keyword");
    // keywords that optionally take an expression, and form a
    // statement (return)
    var keywordC = result("keyword c", "keyword");
    var type = result("keyword c", "type");
    var modifier = result("keyword c", "modifier");
    var operator = result("operator", "keyword");
    var stdlib = result("operator", "stdlib");
    var stdvar = result("operator", "stdvar");
    var atom = result("atom", "atom");

    return {
      "if": keywordA, "while": keywordA, "else": keywordB, "do": keywordB,
      "discard": keywordC, "return": keywordC, "break": keywordC, "continue": keywordC,
      "catch": result("catch", "keyword"), "for": result("for", "keyword"), "switch": result("switch", "keyword"),
      "case": result("case", "keyword"), "default": result("default", "keyword"),
      "true": atom, "false": atom,

      "attribute": modifier, "const": modifier, "in": modifier, "inout": modifier, "out": modifier,
      "varying": modifier, "uniform": modifier,

      "bool": type, "bvec2": type, "bvec3": type, "bvec4": type, "float": type,
      "int": type, "ivec2": type, "ivec3": type, "ivec4": type, 
      "mat2": type, "mat3": type, "mat4": type, 
      "sampler1D": type, "sampler1DShadow": type, "sampler2D": type, 
      "sampler2DShadow": type, "sampler3D": type, "samplerCube": type, 
      "vec2": type, "vec3": type, "vec4": type, "void": type, "struct": type,
      //Custom types for fractals
      "param": type, "complex": type, "C": type, "real": type, "rgb": type, "rgba": type,

      "abs": stdlib, "acos": stdlib, "all": stdlib, "any": stdlib, "asin": stdlib, "atan": stdlib, 
      "ceil": stdlib, "clamp": stdlib, "cos": stdlib, "cross": stdlib, "dFdx": stdlib, "dFdy": stdlib, 
      "degrees": stdlib, "distance": stdlib, "dot": stdlib, "equal": stdlib, "exp": stdlib, "exp2": stdlib, 
      "faceforward": stdlib, "floor": stdlib, "fract": stdlib, "ftransform": stdlib, "fwidth": stdlib, 
      "greaterThan": stdlib, "greaterThanEqual": stdlib, "inversesqrt": stdlib, "length": stdlib, 
      "lessThan": stdlib, "lessThenEqual": stdlib, "log": stdlib, "log2": stdlib, "matrixCompMult": stdlib, 
      "max": stdlib, "min": stdlib, "mix": stdlib, "mod": stdlib, "noise1": stdlib, "noise2": stdlib, 
      "noise3": stdlib, "noise4": stdlib, "normalize": stdlib, "not": stdlib, "notEqual": stdlib, 
      "pow": stdlib, "radians": stdlib, "reflect": stdlib, "refract": stdlib, "shadow1D": stdlib, 
      "shadow1DLod": stdlib, "shadow1DProj": stdlib, "shadow1DProjLod": stdlib, "shadow2D": stdlib, 
      "shadow2DLod": stdlib, "shadow2DProj": stdlib, "shadow2DProjLod": stdlib, "sign": stdlib, "sin": stdlib, 
      "smoothstep": stdlib, "sqrt": stdlib, "step": stdlib, "tan": stdlib, "texture1D": stdlib, "texture1DLod": stdlib, 
      "texture1DProj": stdlib, "texture1DProjLod": stdlib, "texture2D": stdlib, "texture2DLod": stdlib, 
      "texture2DProj": stdlib, "texture2DProjLod": stdlib, "texture3D": stdlib, "texture3DLod": stdlib, 
      "texture3DProj": stdlib, "texture3DProjLod": stdlib, "textureCube": stdlib, "textureCubeLod": stdlib,

      "gl_BackColor": stdvar, "gl_BackLightModelProduct": stdvar, "gl_BackLightProduct": stdvar, 
      "gl_BackMaterial": stdvar, "gl_BackSecondaryColor": stdvar, "gl_ClipPlane": stdvar, "gl_ClipVertex": stdvar, 
      "gl_Color": stdvar, "gl_Color": stdvar, "gl_DepthRange": stdvar, "gl_DepthRangeParameters": stdvar, 
      "gl_EyePlaneQ": stdvar, "gl_EyePlaneR": stdvar, "gl_EyePlaneS": stdvar, "gl_EyePlaneT": stdvar, "gl_Fog": stdvar, 
      "gl_FogColor": stdvar, "gl_FogFragCoord": stdvar, "gl_FogParameters": stdvar, "gl_FragColor": stdvar, 
      "gl_FragCoord": stdvar, "gl_FragData": stdvar, "gl_FragDepth": stdvar, "gl_FragFacing": stdvar, 
      "gl_FrontColor": stdvar, "gl_FrontLightModelProduct": stdvar, "gl_FrontLightProduct": stdvar, 
      "gl_FrontMaterial": stdvar, "gl_FrontSecondaryColor": stdvar, "gl_LightModel": stdvar, "gl_LightModelParameters": stdvar, 
      "gl_LightModelProducts": stdvar, "gl_LightProducts": stdvar, "gl_LightSource": stdvar, "gl_LightSourceParameters": stdvar, 
      "gl_MaterialParameters": stdvar, "gl_MaxClipPlanes": stdvar, "gl_MaxCombinedTextureImageUnits": stdvar, 
      "gl_MaxDrawBuffers": stdvar, "gl_MaxFragmentUniformComponents": stdvar, "gl_MaxLights": stdvar, 
      "gl_MaxTextureCoords": stdvar, "gl_MaxTextureImageUnits": stdvar, "gl_MaxTextureUnits": stdvar, 
      "gl_MaxVaryingFloats": stdvar, "gl_MaxVertexAttributes": stdvar, "gl_MaxVertexTextureImageUnits": stdvar, 
      "gl_MaxVertexUniformComponents": stdvar, "gl_ModelViewMatrix": stdvar, "gl_ModelViewMatrixInverse": stdvar, 
      "gl_ModelViewMatrixInverseTranspose": stdvar, "gl_ModelViewMatrixTranspose": stdvar, "gl_ModelViewProjectionMatrix": stdvar, 
      "gl_ModelViewProjectionMatrixInverse": stdvar, "gl_ModelViewProjectionMatrixInverseTranspose": stdvar, 
      "gl_ModelViewProjectionMatrixTranspose": stdvar, "gl_MultiTexCoord0": stdvar, "gl_MultiTexCoord1": stdvar, 
      "gl_MultiTexCoord2": stdvar, "gl_MultiTexCoord2": stdvar, "gl_MultiTexCoord3": stdvar, "gl_MultiTexCoord4": stdvar, 
      "gl_MultiTexCoord5": stdvar, "gl_MultiTexCoord6": stdvar, "gl_MultiTexCoord7": stdvar, "gl_NormScale": stdvar, 
      "gl_Normal": stdvar, "gl_NormalMatrix": stdvar, "gl_ObjectPlaneQ": stdvar, "gl_ObjectPlaneR": stdvar, 
      "gl_ObjectPlaneS": stdvar, "gl_ObjectPlaneT": stdvar, "gl_Point": stdvar, "gl_PointParameters": stdvar, 
      "gl_PointSize": stdvar, "gl_Position": stdvar, "gl_ProjectionMatrix": stdvar, "gl_ProjectionMatrixInverse": stdvar, 
      "gl_ProjectionMatrixInverseTranspose": stdvar, "gl_ProjectionMatrixTranspose": stdvar, "gl_SecondaryColor": stdvar, 
      "gl_SecondaryColor": stdvar, "gl_TexCoord": stdvar, "gl_TextureEnvColor": stdvar, "gl_TextureMatrix": stdvar, 
      "gl_TextureMatrixInverse": stdvar, "gl_TextureMatrixInverseTranspose": stdvar, "gl_TextureMatrixTranspose": stdvar, "gl_Vertex": stdvar

      };
  }();

  // Some helper regexps
  var isOperatorChar = /[+\-*&%=<>!?|]/;
  var isHexDigit = /[0-9A-Fa-f]/;
  var isWordChar = /[\w\$_]/;
  // Wrapper around glslToken that helps maintain parser state (whether
  // we are inside of a multi-line comment and whether the next token
  // could be a regular expression).
  function glslTokenState(inside, regexp) {
    return function(source, setState) {
      var newInside = inside;
      var type = glslToken(inside, regexp, source, function(c) {newInside = c;});
      var newRegexp = type.type == "operator" || type.type == "keyword c" || type.type.match(/^[\[{}\(,;:]$/);
      if (newRegexp != regexp || newInside != inside)
        setState(glslTokenState(newInside, newRegexp));
      return type;
    };
  }

  // The token reader, inteded to be used by the tokenizer from
  // tokenize.js (through jsTokenState). Advances the source stream
  // over a token, and returns an object containing the type and style
  // of that token.
  function glslToken(inside, regexp, source, setInside) {
    function readHexNumber(){
      source.next(); // skip the 'x'
      source.nextWhileMatches(isHexDigit);
      return {type: "number", style: "glsl-atom"};
    }
    /*Custom*/
    function readParam(){
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      return {type: "variable", style: "glsl-param", content: word};
    }
    function readNumber() {
      source.nextWhileMatches(/[0-9]/);
      if (source.equals(".")){
        source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      if (source.equals("e") || source.equals("E")){
        source.next();
        if (source.equals("-"))
          source.next();
        source.nextWhileMatches(/[0-9]/);
      }
      return {type: "number", style: "glsl-atom"};
    }
    // Read a word, look it up in keywords. If not found, it is a
    // variable, otherwise it is a keyword of the type found.
    function readWord() {
      source.nextWhileMatches(isWordChar);
      var word = source.get();
      var known = keywords.hasOwnProperty(word) && keywords.propertyIsEnumerable(word) && keywords[word];
      return known ? {type: known.type, style: known.style, content: word} :
      {type: "variable", style: "glsl-variable", content: word};
    }
    function readRegexp() {
      nextUntilUnescaped(source, "/");
      source.nextWhileMatches(/[gi]/);
      return {type: "regexp", style: "glsl-string"};
    }
    // Mutli-line comments are tricky. We want to return the newlines
    // embedded in them as regular newline tokens, and then continue
    // returning a comment token for every line of the comment. So
    // some state has to be saved (inside) to indicate whether we are
    // inside a /* */ sequence.
    function readMultilineComment(start){
      var newInside = "/*";
      var maybeEnd = (start == "*");
      while (true) {
        if (source.endOfLine())
          break;
        var next = source.next();
        if (next == "/" && maybeEnd){
          newInside = null;
          break;
        }
        maybeEnd = (next == "*");
      }
      setInside(newInside);
      return {type: "comment", style: "glsl-comment"};
    }

    function readOperator() {
      source.nextWhileMatches(isOperatorChar);
      return {type: "operator", style: "glsl-operator"};
    }
    function readString(quote) {
      var endBackSlash = nextUntilUnescaped(source, quote);
      setInside(endBackSlash ? quote : null);
      return {type: "string", style: "glsl-string"};
    }

    // Fetch the next token. Dispatches on first character in the
    // stream, or first two characters when the first is a slash.
    if (inside == "\"" || inside == "'")
      return readString(inside);
    var ch = source.next();
    if (inside == "/*")
      return readMultilineComment(ch);
    else if (ch == "\"" || ch == "'")
      return readString(ch);
    // with punctuation, the type of the token is the symbol itself
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return {type: ch, style: "glsl-punctuation"};
    else if (ch == "0" && (source.equals("x") || source.equals("X")))
      return readHexNumber();
    else if (/[0-9]/.test(ch))
      return readNumber();
    else if (ch == "#"){
      nextUntilUnescaped(source, null); return {type: "define", style: "glsl-define"};
    }else if (ch == "/"){
      if (source.equals("*")){
    	source.next();

    	return readMultilineComment(ch);
      }
      else if (source.equals("/"))
      { nextUntilUnescaped(source, null); return {type: "comment", style: "glsl-comment"};}
      else if (regexp)
        return readRegexp();
      else
        return readOperator();
    }
    else if (isOperatorChar.test(ch))
      return readOperator();
    else if (ch == "@")
      return readParam();
    else
      return readWord();
  }

  // The external interface to the tokenizer.
  return function(source, startState) {
    return tokenizer(source, startState || glslTokenState(false, true));
  };
})();
