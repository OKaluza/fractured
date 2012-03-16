CodeMirror.defineMode("clike", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      keywords = parserConfig.keywords || {},
      blockKeywords = parserConfig.blockKeywords || {},
      modifiers = parserConfig.modifiers || {},
      labels = parserConfig.labels || {},
      types = parserConfig.types || {},
      stdlib = parserConfig.stdlib || {}, 
      stdvar = parserConfig.stdvar || {},
      atoms = parserConfig.atoms || {},
      hooks = parserConfig.hooks || {},
      multiLineStrings = parserConfig.multiLineStrings;
  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

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
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null
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
    stream.eatWhile(/[\w\$_:]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    if (modifiers.propertyIsEnumerable(cur)) return "modifier";
    if (labels.propertyIsEnumerable(cur)) return "label";
    if (types.propertyIsEnumerable(cur)) return "type";
    if (stdlib.propertyIsEnumerable(cur)) return "stdlib";
    if (stdvar.propertyIsEnumerable(cur)) return "stdvar";
    return "word";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
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
    return state.context = new Context(state.indented, col, type, null, state.context);
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

      if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top" || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return 0;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

(function() {
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
    stream.skipToEnd();
    return "meta";
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

  CodeMirror.defineMIME("text/x-csrc", {
    name: "clike",
    keywords: words(cKeywords),
    blockKeywords: words("case do else for if switch while struct"),
    atoms: words("null"),
    hooks: {"#": cppHook}
  });
  CodeMirror.defineMIME("text/x-c++src", {
    name: "clike",
    keywords: words(cKeywords + " asm dynamic_cast namespace reinterpret_cast try bool explicit new " +
                    "static_cast typeid catch operator template typename class friend private " +
                    "this using const_cast inline public throw virtual delete mutable protected " +
                    "wchar_t"),
    blockKeywords: words("catch class do else finally for if struct switch try while"),
    atoms: words("true false null"),
    hooks: {"#": cppHook}
  });
  CodeMirror.defineMIME("text/x-java", {
    name: "clike",
    keywords: words("abstract assert boolean break byte case catch char class const continue default " + 
                    "do double else enum extends final finally float for goto if implements import " +
                    "instanceof int interface long native new package private protected public " +
                    "return short static strictfp super switch synchronized this throw throws transient " +
                    "try void volatile while"),
    blockKeywords: words("catch class do else finally for if switch try while"),
    atoms: words("true false null"),
    hooks: {
      "@": function(stream, state) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });
  CodeMirror.defineMIME("text/x-csharp", {
    name: "clike",
    keywords: words("abstract as base bool break byte case catch char checked class const continue decimal" + 
                    " default delegate do double else enum event explicit extern finally fixed float for" + 
                    " foreach goto if implicit in int interface internal is lock long namespace new object" + 
                    " operator out override params private protected public readonly ref return sbyte sealed short" + 
                    " sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked" + 
                    " unsafe ushort using virtual void volatile while add alias ascending descending dynamic from get" + 
                    " global group into join let orderby partial remove select set value var yield"),
    blockKeywords: words("catch class do else finally for foreach if struct switch try while"),
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
  CodeMirror.defineMIME("text/x-groovy", {
    name: "clike",
    keywords: words("abstract as assert boolean break byte case catch char class const continue def default " +
                    "do double else enum extends final finally float for goto if implements import " +
                    "in instanceof int interface long native new package property private protected public " +
                    "return short static strictfp super switch synchronized this throw throws transient " +
                    "try void volatile while"),
    atoms: words("true false null"),
    hooks: {
      "@": function(stream, state) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });
  CodeMirror.defineMIME("text/x-glsl", {
    name: "clike",
    keywords: words("if while else do discard return break continue for switch case default"),
    blockKeywords: words("do else for if switch while"),
    atoms: words("true false PI TWO_PI E"),
    modifiers: words("attribute const in inout out varying uniform"),
    labels: words("init: reset: znext: escaped: converged: transform: calc: result:"),
    types: words("bool bvec2 bvec3 bvec4 float int ivec2 ivec3 ivec4 mat2 mat3 mat4 " + 
      "sampler1D sampler1DShadow sampler2D sampler2DShadow sampler3D samplerCube " + 
      "vec2 vec3 vec4 void struct " + 
      "complex real RGB rgba " + //Custom types for fractals 
      "list real_function complex_function bailout_function expression"),
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
      "ident zero czero gradient mul div add sub inv sqr cube cpow " + 
      "loge log10 manhattan norm cabs arg neg conj polar " + 
      "cosh tanh sinh acosh atanh asinh cexp csin ccos ctan casin cacos " + 
      "catan csinh ccosh ctanh casinh cacosh catanh csqrt csqrt2 equals " + 
      "trunc round trunc round flip sqr imag gamma"),
    stdvar: words("gl_BackColor gl_BackLightModelProduct gl_BackLightProduct " +
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
        if (stream.eat('"')) {
          state.tokenize = tokenAtString;
          return tokenAtString(stream, state);
        }
        stream.eatWhile(/[\w\$_:]/);
        return "param";
      }/*,
      ":": function(stream, state) {
        if (stream.eat('"')) {
          state.tokenize = tokenAtString;
          return tokenAtString(stream, state);
        }
        stream.eatWhile(/[\w\$_@]/);
        return "local";
      }*/
    }
  });
}());
