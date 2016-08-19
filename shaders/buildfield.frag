precision mediump float;

void main () {
  vec2 dist = (gl_PointCoord.xy - 0.5)*2.;
  float dist_sqr = dot(dist,dist);

  dist_sqr = max(dist_sqr,0.001);

  gl_FragColor = vec4(gl_PointCoord,0.,1.);
  //gl_FragColor = vec4(1./dist_sqr,1./dist_sqr,0.,1.);
  //gl_FragColor = vec4(1.,1.,0.,1.);
}
