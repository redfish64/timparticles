precision mediump float;

uniform sampler2D u_fieldTexture;
varying vec2 v_TexCoord;
uniform float u_time;

void main() {
  //gl_FragColor = vec4(1.0,0.0,1.0,1.0);
  gl_FragColor = texture2D(u_fieldTexture, v_TexCoord);
  gl_FragColor[3] = 1.;
  /* gl_FragColor[2] = 0.;//cos(0.); */
  /* gl_FragColor[1] = 0.; */
  /* gl_FragColor[0] = cos(u_time/10000.);// (v_TexCoord[0]+cos(u_time/1000.))/2.; */
}
