//Basic vertex shader position without transforms and texture coords
precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
varying vec2 vTextureCoord;
void main(void)
{
  //Scale 3/4, for testing
  gl_Position = vec4(0.75 * aVertexPosition, 1.0);
  vTextureCoord = aTextureCoord;  
}

