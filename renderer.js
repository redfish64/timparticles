'use strict'

//renders the resulting simulation
var Renderer = (function () {
    
    //you need to call reset() before drawing
    function Renderer (canvas, wgl, onLoaded) {

        this.canvas = canvas;
        this.wgl = wgl;
	
        this.quadVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array(
	    [
		-1.0, -1.0, 
		-1.0, 1.0, 
		1.0, -1.0, 
		1.0, 1.0
	    ]), wgl.STATIC_DRAW);

        this.textVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.textVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array(
	    [
		0.0, 0.0, 
		0.0, 1.0, 
		1.0, 0.0, 
		1.0, 1.0
	    ]), wgl.STATIC_DRAW);


        wgl.createProgramsFromFiles({
            renderFieldProgram: {
                vertexShader: 'shaders/renderfield.vert',
                fragmentShader: 'shaders/renderfield.frag',
                attributeLocations: { 'a_Position': 0,
				      'a_TexCoord': 1}
            }
        }, (function (programs) {
            for (var programName in programs) {
                this[programName] = programs[programName];
            }

            onLoaded();
        }).bind(this));
    }

    Renderer.prototype.reset = function () 
    {
	this.startTime = new Date().getTime();
    }

    Renderer.prototype.draw = function (simulator) 
    {
        var wgl = this.wgl;

	var time = new Date().getTime() - this.startTime;

	//console.log("drawing %d!", time);
        var drawState = wgl.createDrawState()
            .bindFramebuffer(null)
            .viewport(0, 0, this.canvas.width, this.canvas.height)
            .useProgram(this.renderFieldProgram)

	    //PERF: for gl efficiency, may want to conver this to a single
	    //buffer
            .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
            .vertexAttribPointer(this.textVertexBuffer, 1, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
	    .uniform1f('u_time', time)
            .uniform2f('u_fieldSize', this.fieldWidth, this.fieldHeight)
            .uniformTexture('u_fieldTexture', 0, wgl.TEXTURE_2D, simulator.fieldTexture);
	

        wgl.drawArrays(drawState, wgl.TRIANGLE_STRIP, 0, 4);

    }

    return Renderer;
})();