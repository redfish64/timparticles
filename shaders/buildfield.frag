precision mediump float;


const float FORCE_MULTIPLIER = 0.05;

//this is the distance where the force no longer increases
const float MIN_DIST_PERC = 0.05;
const float MIN_DIST_PERC_SQR = MIN_DIST_PERC * MIN_DIST_PERC;

void main () {
  //gl_PointCoord goes from 0 to 1 in x and y
  vec2 dist = (gl_PointCoord.xy - 0.5)*2.;
  float dist_sqr = dot(dist,dist);
  float force = FORCE_MULTIPLIER / max(dist_sqr,MIN_DIST_PERC_SQR);


  gl_FragColor = vec4(normalize(dist)*force,0.,1.);
  //gl_FragColor = vec4(1./dist_sqr,1./dist_sqr,0.,1.);
  //gl_FragColor = vec4(1.,1.,0.,1.);
}
