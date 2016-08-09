var wgl;
var canvas;
var drawPointProgram;

function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('canvas');

    wgl = new WrappedGL(canvas);

    wgl.createDrawState();

    wgl.createProgramsFromFiles(
	{
            drawPointProgram: {
		vertexShader: 'shaders/vshader.vert',
		fragmentShader: 'shaders/fshader.frag'
            }
	},
	(function (programs) {
	    drawPointProgram = programs.drawPointProgram;
	    onLoaded();
	})
    );
    }

function onLoaded()
{
    var vertices = [];
    
    for(var x = -1; x < 1; x += .5)
    {
	for(var y = -1; y < 1; y += .5)
	{
	    vertices.push(x);
	    vertices.push(y);
	}
    }

    var buf = wgl.createBuffer();
    wgl.bufferData(buf, wgl.ARRAY_BUFFER, new Float32Array(vertices), wgl.STATIC_DRAW);

    var drawState = wgl.createDrawState().useProgram(drawPointProgram);
    
    // Get the storage location of a_Position
    var a_Position = drawPointProgram.getAttribLocation('a_Position');
    if (a_Position < 0) {
	console.log('Failed to get the storage location of a_Position');
	return;
    }

    drawState.vertexAttribPointer(buf, a_Position, 2, wgl.FLOAT,
				  wgl.FALSE, 0, 0);

    drawState.uniform1f('u_Width', canvas.width);
    drawState.uniform1f('u_Height', canvas.height);

    // Specify the color for clearing <canvas>
    var clearState = wgl.createClearState();

    clearState.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Clear <canvas>
    wgl.clear(clearState, wgl.COLOR_BUFFER_BIT);
    
    // Draw a point
    wgl.drawArrays(drawState, wgl.POINTS, 0, vertices.length/2);
//    wgl.drawElements(drawState, wgl.POINTS, 1, wgl.UNSIGNED_SHORT, 0);
}
