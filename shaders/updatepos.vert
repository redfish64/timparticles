attribute vec2 a_Position;
attribute vec2 a_TexCoord; //PERF: do we even need this? Can't we calculate it from a_Position
varying vec2 v_TexCoord;

void main() {
  gl_Position = vec4(a_Position,0.0,1.0);
  v_TexCoord = a_TexCoord;
}

