//creates a field of vectors surrounding particles. This field is used
//to push particles later
attribute vec2 a_textureCoordinates;

uniform sampler2D u_particleTexture;

varying vec3 v_position;

void main () {
    vec3 position = texture2D(u_particleTexture, a_textureCoordinates).rgb;
    //gl_Position = vec4(position,1.0);
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    //v_position = position;
    v_position = vec3(0.1,0.1,0.1);
    gl_PointSize = 10.0;
}
