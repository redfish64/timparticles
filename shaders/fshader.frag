precision mediump float;
uniform float u_Width;
uniform float u_Height;

void main() {
  vec4 x = gl_FragCoord;
  gl_FragColor = vec4(1.0,1.0,1.0,1.0);//gl_PointCoord);
  /* gl_FragColor = vec4(gl_FragCoord.x/u_Width, gl_FragCoord.y/u_Height,  */
  /* 		      0,1.0); */
  /* gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); */
}

