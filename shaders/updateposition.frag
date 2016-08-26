//updates the position per momementum per particle per field

precision mediump float;

uniform sampler2D u_particleTexture;
uniform sampler2D u_fieldTexture;

varying vec2 v_coordinates;

uniform float u_timeStep;

uniform float u_mass0;
uniform float u_maxSpeed;

uniform vec2 u_areaSize;

void main() {
  //position is xy, velocity is zw
  //v_coordinates goes from 0 to 1 in x and y.
  vec4 particleData = texture2D(u_particleTexture, v_coordinates);

  vec2 pos = particleData.xy;
  vec2 momentum = particleData.zw;

  //we use the lorentz (light speed) equations to keep velocity from getting 
  //too high
  //y = sqrt(1 + (p/(m0*c))^2)
  float lorentz = sqrt(1.0 + (dot(momentum,momentum)/
			      (u_mass0 * u_mass0
			       * u_maxSpeed * u_maxSpeed)));
  
  float mass = u_mass0 * lorentz;

  momentum = momentum * (1. - 0.06 * u_timeStep); //TIMHACK decay
  momentum = momentum + vec2(0,-0.01)*mass;

  vec2 vel = momentum/(lorentz * u_mass0);
  pos = pos + vel * u_timeStep;

  //keep the particle within the bounds
  pos = clamp(pos, vec2(0,0), u_areaSize);

  //reverse velocity direction for bottom left edge (bounce off the wall)
  //we use vel, unless newPos equals exactly zero, in which we assume we have 
  //reached the edge and are ready to bounce
  momentum  = (momentum - (step(0., -pos) * momentum * 2.0));

  //bounce off top right edge
  momentum  = momentum - (step(u_areaSize, pos) * momentum * 2.0);

  gl_FragColor = vec4(pos, momentum);
}
