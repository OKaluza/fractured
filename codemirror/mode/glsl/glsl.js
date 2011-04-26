CodeMirror.defineMode("glsl", function(config, parserConfig) {
  var indentUnit = config.indentUnit, keywords = parserConfig.keywords,
      modifiers = parserConfig.modifiers, atoms = parserConfig.atoms, types = parserConfig.types,
      stdlib = parserConfig.stdlib, stdvar = parserConfig.stdvar,
      multiLineStrings = parserConfig.multiLineStrings;
  var isOperatorChar = /[+\-*&%=<>!?|]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  var type;
  function ret(tp, style) {
    type = tp;
    return style;
  }

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'")
      return chain(stream, state, tokenString(ch));
    else if (/[\[\]{}\(\),;\:\.]/.test(ch))
      return ret(ch);
    else if (ch == "#" && state.startOfLine) {
      stream.skipToEnd();
      return ret("directive", "glsl-preprocessor");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/)
      return ret("number", "glsl-atom");
    }
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, tokenComment);
      }
      else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "glsl-comment");
      }
      else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", "glsl-operator");
      }
    }
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", "glsl-operator");
    }
    else if (ch == "@") {
      stream.eatWhile(/[\w\$_~]/);  //Note: ~ added for formula param names
      return ret("word", "glsl-param");
    }
    else {
      stream.eatWhile(/[\w\$_]/);
      if (keywords && keywords.propertyIsEnumerable(stream.current())) return ret("keyword", "glsl-keyword");
      if (modifiers && modifiers.propertyIsEnumerable(stream.current())) return ret("keyword", "glsl-modifier");
      if (atoms && atoms.propertyIsEnumerable(stream.current())) return ret("keyword", "glsl-atom");
      if (types && types.propertyIsEnumerable(stream.current())) return ret("keyword", "glsl-type");
      if (stdlib && stdlib.propertyIsEnumerable(stream.current())) return ret("keyword", "glsl-stdlib");
      if (stdvar && stdvar.propertyIsEnumerable(stream.current())) return ret("keyword", "glsl-stdvar");
      return ret("word", "glsl-word");
    }
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
      return ret("string", "glsl-string");
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
    return ret("comment", "glsl-comment");
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
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: tokenBase,
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
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      if (ctx.align == null) ctx.align = true;

      if ((type == ";" || type == ":") && ctx.type == "statement") popContext(state);
      else if (type == "{") pushContext(state, stream.column(), "}");
      else if (type == "[") pushContext(state, stream.column(), "]");
      else if (type == "(") pushContext(state, stream.column(), ")");
      else if (type == "}") {
        if (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        if (ctx.type == "statement") ctx = popContext(state);
      }
      else if (type == ctx.type) popContext(state);
      else if (ctx.type == "}") pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), ctx = state.context, closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

(function() {
  function keywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var Keywords = "if while else do discard return break continue for switch case default";
  var Modifiers = "attribute const in inout out varying uniform";
  var Atoms = "true false PI TWO_PI E";
  var Types = "bool bvec2 bvec3 bvec4 float  int ivec2 ivec3 ivec4 mat2 mat3 mat4 " + 
      "sampler1D sampler1DShadow sampler2D sampler2DShadow sampler3D samplerCube " + 
      "vec2 vec3 vec4 void struct " + 
      "param complex real RGB rgba C CI I " + //Custom types for fractals 
      "list real_function complex_function";
  var Stdlib = 
      "abs acos all any asin atan " +
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
      "ident zero czero gradient mul div  inv inv cpow cpow cpow " + 
      "loge log10 log10 loge manhattan norm cabs arg neg conj polar " + 
      "cosh tanh sinh acosh atanh asinh cexp csin ccos ctan casin cacos " + 
      "catan csinh ccosh ctanh casinh cacosh catanh csqrt csqrt2 equals " + 
      "trunc round trunc round flip sqr imag gamma";

  var Stdvar = 
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
      "gl_TextureMatrixInverse gl_TextureMatrixInverseTranspose gl_TextureMatrixTranspose gl_Vertex";

  CodeMirror.defineMIME("text/x-glslsrc", {
    name: "glsl",
    keywords: keywords(Keywords),
    modifiers: keywords(Modifiers),
    atoms: keywords(Atoms),
    types: keywords(Types),
    stdlib: keywords(Stdlib),
    stdvar: keywords(Stdvar)
  });
}());


