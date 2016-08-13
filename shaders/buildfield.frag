varying vec3 v_position; //already in the grid coordinate system

void main () {
  vec distance = gl_Position - v_position;
  gl_FragColor = distance;
}
