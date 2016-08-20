precision mediump float;

uniform sampler2D u_particleTexture;
uniform sampler2D u_fieldTexture;

uniform vec2 u_fieldSize;

varying vec2 v_coordinates;

uniform float u_timeStep;

void main() {
  //position is xy, velocity is zw
  //v_coordinates goes from 0 to 1 in x and y.
  vec4 particleData = texture2D(u_particleTexture, v_coordinates);

  vec2 pos = particleData.xy;

  vec4 fieldData = texture2D(u_fieldTexture, pos/u_fieldSize);
  vec2 force = fieldData.xy;

  //eventually we can multiply force by mass, but now we assume its 1
  vec2 vel = particleData.zw + force/10000.;
  vel.y -= 0.001; //TIMHACK gravity

  vec2 newPos = min(u_fieldSize,max(pos + vel * u_timeStep,0.));

  //bounce off bottom left edge
  //we use vel, unless newPos equals exactly zero, in which we assume we have 
  //reached
  //the edge and are ready to bounce
  vec2 newVel  = vel - (step(0., -newPos) * vel * 2.0);

  //bounce off top right edge
  vec2 newVel2  = newVel -
    (step(u_fieldSize, newPos) * newVel * 2.0);

  gl_FragColor = vec4(newPos, newVel2);
  /* //bounce off right bottom edge */
  /* vec2 newVel2  = -newVel.x + */
  /*   (step(, -newPos) * newVel * 2.0); */
}
