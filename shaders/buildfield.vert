//creates a field of vectors surrounding particles. This field is used
//to push particles later
attribute vec2 a_textureCoordinates;

uniform sampler2D u_particleTexture;
uniform vec2 u_fieldSize;

void main () {
  //texture is using luminance alpha, so the R,G,B (x,y,z) are all the same and
  //equal to LUMINANCE
  //The ALPHA is, of course, the 4th value, or w
  vec4 position = 
    vec4(
	 (texture2D(u_particleTexture, a_textureCoordinates).zw/u_fieldSize - 0.5)
	 * 2.,0.,1.);
  gl_Position = position;
  gl_PointSize = 100.0;
}
