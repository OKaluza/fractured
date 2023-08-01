attribute vec3 aVertexPosition;
uniform mat4 uMVMatrix;
varying vec2 coord;
void main(void) {
  gl_Position = vec4(aVertexPosition, 1.0);
  //Apply translation, rotation & scaling matrix to vertices to get fractal space coords
  vec4 coords = uMVMatrix * vec4(aVertexPosition.xy, 0.0, 1.0);
  coord = coords.xy;
}
