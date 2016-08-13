//creates a field of vectors surrounding particles. This field is used
//to push particles later
attribute vec2 a_textureCoordinates;

uniform sampler2D u_particleTexture;
uniform sampler2D u_fieldTexture;

varying vec3 v_position;

void main () {
    vec3 position = texture2D(u_particleTexture, a_textureCoordinates).rgb;
    gl_Position = position;
    gl_PointSize = 10.0;
}
