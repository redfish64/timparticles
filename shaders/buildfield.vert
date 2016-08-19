//creates a field of vectors surrounding particles. This field is used
//to push particles later
attribute vec2 a_textureCoordinates;

uniform sampler2D u_particleTexture;
uniform vec2 u_fieldSize;

void main () {
  vec4 position = 
    vec4(
	 (texture2D(u_particleTexture, a_textureCoordinates).xy/u_fieldSize - 0.5)
	 * 2.,0.,1.);
  gl_Position = position;
  //gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  //v_position = position;
  gl_PointSize = 100.0;
}
