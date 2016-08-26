'use strict'

//renders the resulting simulation
var Renderer = (function () {
    
    //you need to call reset() before drawing
    function Renderer (canvas, wgl, fields, pTypes, onLoaded) {

        this.canvas = canvas;
        this.wgl = wgl;
	this.fields = fields;
	this.pTypes = pTypes;
	
        this.quadVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array(
	    [
		-1.0, -1.0, 
		-1.0, 1.0, 
		1.0, -1.0, 
		1.0, 1.0
	    ]), wgl.STATIC_DRAW);

        wgl.createProgramsFromFiles({
            renderFieldProgram: {
                vertexShader: 'shaders/renderfield.vert',
                fragmentShader: 'shaders/renderfield.frag',
                attributeLocations: { 'a_position': 0}
            },
            renderParticlesProgram: {
                vertexShader: 'shaders/renderparticles.vert',
                fragmentShader: 'shaders/renderparticles.frag',
                attributeLocations: { 'a_position': 0}
            }
        }, (function (programs) {
            for (var programName in programs) {
                this[programName] = programs[programName];
            }

            onLoaded();
        }).bind(this));
    }

    Renderer.prototype.reset = function (params) 
    {
	this.startTime = new Date().getTime();
	this.params = params;
    }

    Renderer.prototype.renderParticles = function (pType) 
    {
        var wgl = this.wgl;

	var drawState = wgl.createDrawState()
	    .bindFramebuffer(null)
            .viewport(0, 0, this.canvas.width, this.canvas.height)
	    .vertexAttribPointer(pType.particleVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
	    .useProgram(this.renderParticlesProgram)
	    .uniform2f('u_areaSize', this.params.areaSize[0],
		       this.params.areaSize[1])
	    .uniform3f('u_color', pType.color[0],
		       pType.color[1],
		       pType.color[2])
	    .uniform1f('u_pointSize', pType.size)
	    .uniform1f('u_pointSize2', pType.size) //we can't use the same uniform in both frag and vert shader, so we rename the second one
	    .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, 
			    pType.particleTexture)
	    .enable(wgl.BLEND)
	    .blendEquation(wgl.FUNC_ADD)
	    .blendFuncSeparate(wgl.ONE, wgl.ONE, wgl.ONE, wgl.ONE);
		
	wgl.drawArrays(drawState, wgl.POINTS, 0, 
		       pType.particleCount);
    }

    Renderer.prototype.renderField = function(field)
    {
        var wgl = this.wgl;

	//console.log("drawing %d!", time);
        var drawState = wgl.createDrawState()
            .bindFramebuffer(null)
            .viewport(0, 0, this.canvas.width, this.canvas.height)
            .useProgram(this.renderFieldProgram)

            .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
            .uniformTexture('u_fieldTexture', 0, wgl.TEXTURE_2D, field.texture);

        wgl.drawArrays(drawState, wgl.TRIANGLE_STRIP, 0, 4);

    }

    Renderer.prototype.renderAllParticles = function () 
    {
	for(var j = 0; j < this.pTypes.length; j++)
	{
	    var pType = this.pTypes[j];
	    
	    this.renderParticles(pType);
	}
    }
    
    Renderer.prototype.draw = function () 
    {
	var wgl = this.wgl;

        wgl.clear(
            wgl.createClearState().bindFramebuffer(null).clearColor(0, 0, 0, 1),
            wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

	if(this.params.renderFirstField)
	    this.renderField(this.fields[0]);
	
	if(this.params.renderParticles)
	    this.renderAllParticles();
    }

    return Renderer;
})();
