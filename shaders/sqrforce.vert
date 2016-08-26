//creates a field of vectors surrounding particles. This field is used
//to push particles later
attribute vec2 a_textureCoordinates;

uniform sampler2D u_particleTexture;
uniform vec2 u_areaSize;
uniform float u_pointSize;

void main () {
  //position is xy, velocity is zw
  vec4 particleData = texture2D(u_particleTexture, a_textureCoordinates);

  //particle position is in area units, so we divide by area size to
  //get the -1 to 1 range for mapping the full field used by the frag shader
  gl_Position = //vec4(0.,0.,0.,1.) //TIMHACK
    vec4((particleData.xy/u_areaSize - 0.5) * 2.0,0.,1.)
    ;

  gl_PointSize = u_pointSize;
}
