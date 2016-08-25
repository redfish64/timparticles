precision mediump float;

uniform float u_l;
uniform float u_k;
uniform float u_forceCharge;
uniform float u_areaPerFieldPixel;

//this is hardcoded at a distance of 1, so that the particle won't be
//affected by its own field. It is in field units (and must be converted
// to area units
const float MIN_DIST_PERC = 1.;
const float MIN_DIST_PERC_SQR = 1.;

void main () {
  //gl_PointCoord goes from 0 to 1 in x and y and is in the output texture,
  //which is the field texture units. Since we want the force to be
  //in area units, we need to multiply by u_areaPerFieldPixel
  vec2 dist = (gl_PointCoord.xy - 0.5)*2. * u_areaPerFieldPixel;
  float dist_sqr = dot(dist,dist);
  float dist_sqr_mod = max(dist_sqr, MIN_DIST_PERC_SQR);

  // f(x) = k/(l+x^2)
  float force = u_k / (u_l + dist_sqr) * u_forceCharge
    //this is to provide a one pixel donut hole so the particle
    //isn't affected by its own field. It does create some risk
    //that two particles can occupy the same space at the same time
    //and not push each other away,
    //but as long as they drift a little, that will soon be taken
    //care of.
    //we want the hole the size of one field unit, so we multiply
    //by the appropriate factor
    * step(MIN_DIST_PERC_SQR*u_areaPerFieldPixel, dist_sqr);

  //TODO 4: not sure why, but one axis is backwards???
  dist.y = -dist.y;

  //PERF can we get away without using sqrt?
  gl_FragColor = vec4(dist/sqrt(dist_sqr_mod)*force,0.,1.);
}
