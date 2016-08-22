precision mediump float;

const float FORCE_MULTIPLIER = 0.005;

//this is the distance where the force is empty, like a donut.
const float MIN_DIST_PERC = 0.02;
const float MIN_DIST_PERC_SQR = MIN_DIST_PERC * MIN_DIST_PERC;

void main () {
  //gl_PointCoord goes from 0 to 1 in x and y
  vec2 dist = (gl_PointCoord.xy - 0.5)*2.;
  float dist_sqr = dot(dist,dist);
  float dist_sqr_mod = max(dist_sqr, MIN_DIST_PERC_SQR);
  float force = FORCE_MULTIPLIER / dist_sqr_mod
    * step(MIN_DIST_PERC_SQR, dist_sqr);

  //TODO 4: not sure why, but one axis is backwards???
  dist.y = -dist.y;

  gl_FragColor = vec4(dist/dist_sqr_mod*force,0.,1.);
}
