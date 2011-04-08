
  var mvMatrix;
  var mvMatrixStack = [];

  function mvPushMatrix(m) {
    if (m) {
      mvMatrixStack.push(m.dup());
      mvMatrix = m.dup();
    } else {
      mvMatrixStack.push(mvMatrix.dup());
    }
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
  }

  function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
  }

  function loadIdentity() {
    mvMatrix = Matrix.I(4);
  }

  function mvScale(v) {
    var m = Matrix.Scale($V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }

  function mvTranslate(v) {
    var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }

  function createRotationMatrix(angle, v) {
    var arad = angle * Math.PI / 180.0;
    return Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
  }

  function mvRotate(angle, v) {
    multMatrix(createRotationMatrix(angle, v));
  }

  function setMatrixUniforms(program) {
    gl.uniformMatrix4fv(program.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));
  }
