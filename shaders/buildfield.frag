precision mediump float;

varying vec3 v_position; //already in the grid coordinate system

void main () {
  //vec3 distance = gl_FragCoord.xyz - v_position;
  //float dist_sqr = dot(distance, distance);

  //dist_sqr = max(dist_sqr,2.);

  //gl_FragColor = vec4(normalize(distance)/dist_sqr*255.,1.);
  gl_FragColor = vec4(1.,1.,0.,1.);
}
