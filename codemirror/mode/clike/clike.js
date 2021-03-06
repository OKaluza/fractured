// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("clike", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      keywords = parserConfig.keywords || {},
      builtin = parserConfig.builtin || {},
      blockKeywords = parserConfig.blockKeywords || {},
      modifiers = parserConfig.modifiers || {},
      labels = parserConfig.labels || {},
      types = parserConfig.types || {},
      stdlib = parserConfig.stdlib || {}, 
      stdvar = parserConfig.stdvar || {},
      atoms = parserConfig.atoms || {},
      hooks = parserConfig.hooks || {},
      multiLineStrings = parserConfig.multiLineStrings;
  var isOperatorChar = /[+\-*&%=<>!?|\/#]/;
  var isMarkChar = /\\/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (ch == ".") {
      //Swizzle - glsl/fractal addition
      if (stream.eatWhile(/[xyzw]/)) {
        return "number";
      }
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    if (isMarkChar.test(ch)) {
      stream.eatWhile(isMarkChar);
      return "marker";
    }
    stream.eatWhile(/[\w\$_:]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    }
    if (builtin.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "builtin";
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    if (modifiers.propertyIsEnumerable(cur)) return "modifier";
    if (labels.propertyIsEnumerable(cur)) return "label";
    if (types.propertyIsEnumerable(cur)) return "type";
    if (stdlib.propertyIsEnumerable(cur))return "stdlib";
    if (stdvar.propertyIsEnumerable(cur)) return "stdvar";
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = null;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    var indent = state.indented;
    if (state.context && state.context.type == "statement")
      indent = state.context.indented;
    return state.context = new Context(indent, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

      if ((curPunc == ";" || curPunc == ":" || curPunc == ",") && ctx.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (((ctx.type == "}" || ctx.type == "top") && curPunc != ';') || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (ctx.align && (!dontAlignCalls || ctx.type != ")")) return ctx.column + (closing ? 0 : 1);
      else if (ctx.type == ")" && !closing) return ctx.indented + statementIndentUnit;
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//",
    fold: "brace"
  };
});

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var cKeywords = "auto if break int case long char register continue return default short do sizeof " +
    "double static else struct entry switch extern typedef float union for unsigned " +
    "goto while enum void const signed volatile";

  function cppHook(stream, state) {
    if (!state.startOfLine) return false;
    for (;;) {
      if (stream.skipTo("\\")) {
        stream.next();
        if (stream.eol()) {
          state.tokenize = cppHook;
          break;
        }
      } else {
        stream.skipToEnd();
        state.tokenize = null;
        break;
      }
    }
    return "meta";
  }

  function cpp11StringHook(stream, state) {
    stream.backUp(1);
    // Raw strings.
    if (stream.match(/(R|u8R|uR|UR|LR)/)) {
      var match = stream.match(/"(.{0,16})\(/);
      if (!match) {
        return false;
      }
      state.cpp11RawStringDelim = match[1];
      state.tokenize = tokenRawString;
      return tokenRawString(stream, state);
    }
    // Unicode strings/chars.
    if (stream.match(/(u8|u|U|L)/)) {
      if (stream.match(/["']/, /* eat */ false)) {
        return "string";
      }
      return false;
    }
    // Ignore this hook.
    stream.next();
    return false;
  }

  // C#-style strings where "" escapes a quote.
  function tokenAtString(stream, state) {
    var next;
    while ((next = stream.next()) != null) {
      if (next == '"' && !stream.eat('"')) {
        state.tokenize = null;
        break;
      }
    }
    return "string";
  }

  // C++11 raw string literal is <prefix>"<delim>( anything )<delim>", where
  // <delim> can be a string up to 16 characters long.
  function tokenRawString(stream, state) {
    var closingSequence = new RegExp(".*?\\)" + state.cpp11RawStringDelim + '"');
    var match = stream.match(closingSequence);
    if (match) {
      state.tokenize = null;
    } else {
      stream.skipToEnd();
    }
    return "string";
  }

  function def(mimes, mode) {
    if (typeof mimes == "string") mimes = [mimes];
    var words = [];
    function add(obj) {
      if (obj) for (var prop in obj) if (obj.hasOwnProperty(prop))
        words.push(prop);
    }
    add(mode.keywords);
    add(mode.builtin);
    add(mode.atoms);
    if (words.length) {
      mode.helperType = mimes[0];
      CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (var i = 0; i < mimes.length; ++i)
      CodeMirror.defineMIME(mimes[i], mode);
  }

  def(["text/x-csrc", "text/x-c", "text/x-chdr"], {
    name: "clike",
    keywords: words(cKeywords),
    blockKeywords: words("case do else for if switch while struct"),
    atoms: words("null"),
    hooks: {"#": cppHook},
    modeProps: {fold: ["brace", "include"]}
  });

  def(["text/x-c++src", "text/x-c++hdr"], {
    name: "clike",
    keywords: words(cKeywords + " asm dynamic_cast namespace reinterpret_cast try bool explicit new " +
                    "static_cast typeid catch operator template typename class friend private " +
                    "this using const_cast inline public throw virtual delete mutable protected " +
                    "wchar_t alignas alignof constexpr decltype nullptr noexcept thread_local final " +
                    "static_assert override"),
    blockKeywords: words("catch class do else finally for if struct switch try while"),
    atoms: words("true false null"),
    hooks: {
      "#": cppHook,
      "u": cpp11StringHook,
      "U": cpp11StringHook,
      "L": cpp11StringHook,
      "R": cpp11StringHook
    },
    modeProps: {fold: ["brace", "include"]}
  });
  def("text/x-java", {
    name: "clike",
    keywords: words("abstract assert boolean break byte case catch char class const continue default " +
                    "do double else enum extends final finally float for goto if implements import " +
                    "instanceof int interface long native new package private protected public " +
                    "return short static strictfp super switch synchronized this throw throws transient " +
                    "try void volatile while"),
    blockKeywords: words("catch class do else finally for if switch try while"),
    atoms: words("true false null"),
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    },
    modeProps: {fold: ["brace", "import"]}
  });
  def("text/x-csharp", {
    name: "clike",
    keywords: words("abstract as base break case catch checked class const continue" +
                    " default delegate do else enum event explicit extern finally fixed for" +
                    " foreach goto if implicit in interface internal is lock namespace new" +
                    " operator out override params private protected public readonly ref return sealed" +
                    " sizeof stackalloc static struct switch this throw try typeof unchecked" +
                    " unsafe using virtual void volatile while add alias ascending descending dynamic from get" +
                    " global group into join let orderby partial remove select set value var yield"),
    blockKeywords: words("catch class do else finally for foreach if struct switch try while"),
    builtin: words("Boolean Byte Char DateTime DateTimeOffset Decimal Double" +
                    " Guid Int16 Int32 Int64 Object SByte Single String TimeSpan UInt16 UInt32" +
                    " UInt64 bool byte char decimal double short int long object"  +
                    " sbyte float string ushort uint ulong"),
    atoms: words("true false null"),
    hooks: {
      "@": function(stream, state) {
        if (stream.eat('"')) {
          state.tokenize = tokenAtString;
          return tokenAtString(stream, state);
        }
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });
  def("text/x-scala", {
    name: "clike",
    keywords: words(

      /* scala */
      "abstract case catch class def do else extends false final finally for forSome if " +
      "implicit import lazy match new null object override package private protected return " +
      "sealed super this throw trait try trye type val var while with yield _ : = => <- <: " +
      "<% >: # @ " +

      /* package scala */
      "assert assume require print println printf readLine readBoolean readByte readShort " +
      "readChar readInt readLong readFloat readDouble " +

      "AnyVal App Application Array BufferedIterator BigDecimal BigInt Char Console Either " +
      "Enumeration Equiv Error Exception Fractional Function IndexedSeq Integral Iterable " +
      "Iterator List Map Numeric Nil NotNull Option Ordered Ordering PartialFunction PartialOrdering " +
      "Product Proxy Range Responder Seq Serializable Set Specializable Stream StringBuilder " +
      "StringContext Symbol Throwable Traversable TraversableOnce Tuple Unit Vector :: #:: " +

      /* package java.lang */
      "Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable " +
      "Compiler Double Exception Float Integer Long Math Number Object Package Pair Process " +
      "Runtime Runnable SecurityManager Short StackTraceElement StrictMath String " +
      "StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void"


    ),
    blockKeywords: words("catch class do else finally for forSome if match switch try while"),
    atoms: words("true false null"),
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });
  def("text/x-glsl", {
    name: "clike",
    keywords: words("if while else do discard return break continue for switch case default"),
    blockKeywords: words("do else for if switch while"),
    atoms: words("true false PI E"),
    modifiers: words("attribute const in inout out varying uniform"),
    labels: words("main: functions: init: reset: znext: escaped: converged: transform: calc: result: filter:"),
    types: words("bool bvec2 bvec3 bvec4 float int ivec2 ivec3 ivec4 mat2 mat3 mat4 " + 
      "sampler1D sampler1DShadow sampler2D sampler2DShadow sampler3D samplerCube " + 
      "vec2 vec3 vec4 void struct " + 
      "complex real rgba " + //Custom types for fractals 
      "list real_function complex_function bailout_function expression define"),
    stdlib: words("abs acos all any asin atan " +
      "ceil clamp cos cross dFdx dFdy " +
      "degrees distance dot equal exp exp2 " +
      "faceforward floor fract ftransform fwidth " +
      "greaterThan greaterThanEqual inversesqrt length " +
      "lessThan lessThenEqual log log2 matrixCompMult " +
      "max min mix mod noise1 noise2 " +
      "noise3 noise4 normalize not notEqual " +
      "pow radians reflect refract shadow1D " +
      "shadow1DLod shadow1DProj shadow1DProjLod shadow2D " +
      "shadow2DLod shadow2DProj shadow2DProjLod sign sin " +
      "smoothstep sqrt step tan texture1D texture1DLod " +
      "texture1DProj texture1DProjLod texture2D texture2DLod " +
      "texture2DProj texture2DProjLod texture3D texture3DLod " +
      "texture3DProj texture3DProjLod textureCube textureCubeLod " +
      //Fractal addons...
      "zero czero gradient mul div inv sqr cube cpow " + 
      "ln lnr log10 manhattan norm cabs arg neg conj polar " + 
      "cosh tanh sinh acosh atanh asinh cexp csin ccos ctan casin cacos " + 
      "catan csinh ccosh ctanh casinh cacosh catanh csqrt equals " + 
      "trunc round flip imag cln clog10"),
    stdvar: words("z c z_1 z_2 point coord selected limit count escaped converged colour alpha " +
      "offset julia pixelsize dims origin selected_ palette background antialias " +
      "gl_BackColor gl_BackLightModelProduct gl_BackLightProduct " +
      "gl_BackMaterial gl_BackSecondaryColor gl_ClipPlane gl_ClipVertex " +
      "gl_Color gl_Color gl_DepthRange gl_DepthRangeParameters " +
      "gl_EyePlaneQ gl_EyePlaneR gl_EyePlaneS gl_EyePlaneT gl_Fog " +
      "gl_FogColor gl_FogFragCoord gl_FogParameters gl_FragColor " +
      "gl_FragCoord gl_FragData gl_FragDepth gl_FragFacing " +
      "gl_FrontColor gl_FrontLightModelProduct gl_FrontLightProduct " +
      "gl_FrontMaterial gl_FrontSecondaryColor gl_LightModel gl_LightModelParameters " +
      "gl_LightModelProducts gl_LightProducts gl_LightSource gl_LightSourceParameters " +
      "gl_MaterialParameters gl_MaxClipPlanes gl_MaxCombinedTextureImageUnits " +
      "gl_MaxDrawBuffers gl_MaxFragmentUniformComponents gl_MaxLights " +
      "gl_MaxTextureCoords gl_MaxTextureImageUnits gl_MaxTextureUnits " +
      "gl_MaxVaryingFloats gl_MaxVertexAttributes gl_MaxVertexTextureImageUnits " +
      "gl_MaxVertexUniformComponents gl_ModelViewMatrix gl_ModelViewMatrixInverse " +
      "gl_ModelViewMatrixInverseTranspose gl_ModelViewMatrixTranspose gl_ModelViewProjectionMatrix " +
      "gl_ModelViewProjectionMatrixInverse gl_ModelViewProjectionMatrixInverseTranspose " +
      "gl_ModelViewProjectionMatrixTranspose gl_MultiTexCoord0 gl_MultiTexCoord1 " +
      "gl_MultiTexCoord2 gl_MultiTexCoord2 gl_MultiTexCoord3 gl_MultiTexCoord4 " +
      "gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 gl_NormScale " +
      "gl_Normal gl_NormalMatrix gl_ObjectPlaneQ gl_ObjectPlaneR " +
      "gl_ObjectPlaneS gl_ObjectPlaneT gl_Point gl_PointParameters " +
      "gl_PointSize gl_Position gl_ProjectionMatrix gl_ProjectionMatrixInverse " +
      "gl_ProjectionMatrixInverseTranspose gl_ProjectionMatrixTranspose gl_SecondaryColor " +
      "gl_SecondaryColor gl_TexCoord gl_TextureEnvColor gl_TextureMatrix " +
      "gl_TextureMatrixInverse gl_TextureMatrixInverseTranspose gl_TextureMatrixTranspose gl_Vertex"),
    hooks: {
      "#": cppHook,
      "@": function(stream, state) {
        if (!state.startOfLine || state.indented) return false;
        stream.eatWhile(/[\w\$_@]/);
        return "param";
      },
      modeProps: {fold: ["brace", "include"]}
    }
  });

});
