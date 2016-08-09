//note that these files produce an error to the console when loaded by
//wrappedgl.js for some reason (This happens in "fluid" which this is
//based on also). It seems harmless enough

attribute vec4 a_Position;

void main () {
  gl_Position = a_Position;
  gl_PointSize = 100.0;
}
