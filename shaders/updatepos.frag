precision mediump float;

uniform sampler2D u_positionsTexture;
uniform sampler2D u_velocitiesTexture;
varying vec2 v_TexCoord;
uniform float u_timeStep;

void main() {
  vec4 pos = texture2D(u_positionsTexture, v_TexCoord);
  vec4 vel = texture2D(u_velocitiesTexture, v_TexCoord);

  gl_FragColor = pos + vel * u_timeStep;
}
