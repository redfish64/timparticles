precision mediump float;

uniform sampler2D u_fieldTexture;
varying vec2 v_coordinates;
uniform float u_time;

void main() {
  gl_FragColor = texture2D(u_fieldTexture, v_coordinates);
  gl_FragColor[3] = 1.;
}
