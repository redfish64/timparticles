precision mediump float;

uniform float u_pointSize2;
uniform vec3 u_color;

void main () {
  vec2 dist = (gl_PointCoord.xy - 0.5)*2.;
  float inCircle = 1.-step(1., dot(dist,dist));
  gl_FragColor = vec4(u_color*inCircle,inCircle);
}
