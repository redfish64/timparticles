//updates the momementum per particle per field

precision mediump float;

uniform sampler2D u_particleTexture;
uniform sampler2D u_fieldTexture;

varying vec2 v_coordinates;

uniform float u_timeStep;
uniform float u_forceCharge;
uniform vec2 u_fieldSize;

void main() {
  //position is xy, momentum is zw
  //v_coordinates goes from 0 to 1 in x and y.
  vec4 particleData = texture2D(u_particleTexture, v_coordinates);

  vec2 pos = particleData.xy;

  vec4 fieldData = texture2D(u_fieldTexture, pos/u_fieldSize);
  vec2 force = fieldData.xy;

  vec2 newMomentum = fieldData.zw + force * u_forceCharge * u_timeStep;

  gl_FragColor = vec4(pos, newMomentum);
}
