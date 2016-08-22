//creates a field of vectors surrounding particles. This field is used
//to push particles later
attribute vec2 a_textureCoordinates;

uniform sampler2D u_particleTexture;
uniform vec2 u_fieldSize;

void main () {
  //position is xy, velocity is zw
  vec4 particleData = texture2D(u_particleTexture, a_textureCoordinates);

  gl_Position = vec4((particleData.xy/u_fieldSize - 0.5) * 2.0,0.,1.);

  //TODO 2: adjust pointsize to a specific field cutoff value
  //(using uniforms)
  gl_PointSize = 1000.0;
}
