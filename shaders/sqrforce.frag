precision mediump float;

uniform float u_l;
uniform float u_k;
uniform float u_d;
uniform float u_forceCharge;
uniform float u_areaPerFieldPixel;
uniform float u_pointSize2;

//this is hardcoded at a distance of 1.5, so that the particle won't be
//affected by its own field. It is in field units (and must be converted
// to area units
const float MIN_DIST_PERC = 1.5;

void main () {
  //gl_PointCoord goes from 0 to 1 in x and y and is in the output texture,
  //which is the field texture units. Since we want the force to be
  //in area units, we need to multiply by u_areaPerFieldPixel
  vec2 dist = (gl_PointCoord.xy - 0.5)*2. * u_pointSize2 * u_areaPerFieldPixel;
  float dist_length = length(dist);
  float donut_dist = dist_length - u_d;

  // f(x) = k/(l+(x-d)^2)
  float force = u_k / (u_l + donut_dist * donut_dist) * u_forceCharge
    //this is to provide a small hole so the particle
    //isn't affected by its own field. It does create some risk
    //that two particles can occupy the same space at the same time
    //but if there is a repeling force setup and as long as they drift 
    //a little, that will soon be taken care of.
    //
    //we want the hole the size of one field unit, so we multiply
    //by the appropriate factor
    * step(MIN_DIST_PERC*u_areaPerFieldPixel, dist_length)
    ;

  //TODO 4: not sure why, but one axis is backwards???
  dist.y = -dist.y;

  //the min() is so that we don't divide by zero. Inside this distance
  //force is always zero anyway
  gl_FragColor = vec4(dist/max(dist_length,MIN_DIST_PERC*u_areaPerFieldPixel)
		      *force,0.,1.);
  //gl_FragColor = vec4(1.,1.,0.,1.);
}
