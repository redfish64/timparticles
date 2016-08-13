//particle data (position, etc.) is put
//into a texture so we can alter this data and keep all the memory
//for it within the gpu
var Simulator = (function () {

    Simulator.prototype.createBillboard = function()
    {
	var buf = wgl.createBuffer();
	wgl.bufferData(buf, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);

	return buf;
    }
    
    function Simulator(wgl, callerOnLoaded)
    {
	this.wgl = wgl;

        this.simulationFramebuffer = wgl.createFramebuffer();

	//for each particle "billboard"
	this.quadVertexBuffer = createBillboard();


	//this stores the index into the textures for each particle
	//(the texture stores the particle data, such as position, etc..)
        this.particleVertexBuffer = wgl.createBuffer();

	//the particle positions are stored here
	this.particleTexture = wgl.createTexture();

	wgl.createProgramsFromFiles(
	    {
		transferToTextureProgram: {
		    vertexShader: 'shaders/transferToTexture.vert',
		    fragmentShader: 'shaders/transferToTexture.frag'
		}
	    },
	    (function (programs) {
		for (var programName in programs) {
                    this[programName] = programs[programName];
		}
		callerOnLoaded();
	    })
	);
    }

    //fill particle vertex buffer for indexing into textures
    //basically creates a sequential grid of numbers where each
    //x,y represents the center of a pixel (0.5 to grid width/height - 0.5)
    //normalized from -1 to 1
    //This is used as vertices input for our vertex shader to reference
    //all the texture data of the particles
    Simulator.prototype.fillParticleVertexBuffer = function()
    {
        var particleTextureCoordinates = new Float32Array(this.particlesWidth * this.particlesHeight * 2);
        for (var y = 0; y < this.particlesHeight; ++y) {
            for (var x = 0; x < this.particlesWidth; ++x) {
                particleTextureCoordinates[(y * this.particlesWidth + x) * 2] = (x + 0.5) / this.particlesWidth;
                particleTextureCoordinates[(y * this.particlesWidth + x) * 2 + 1] = (y + 0.5) / this.particlesHeight;
            }
        }

        wgl.bufferData(this.particleVertexBuffer, wgl.ARRAY_BUFFER, particleTextureCoordinates, wgl.STATIC_DRAW);

    }

    Simultate.protoype.resetParticlePositionTexture = 
	function(particlePositions)
    {
	// texture data is in a rgba format. So we create an array
	// of floats to handle this.
        var particlePositionsData = new Float32Array(this.particlesWidth * this.particlesHeight * 4);

        for (var i = 0; i < this.particlesWidth * this.particlesHeight; ++i) {
            particlePositionsData[i * 4] = particlePositions[i][0];
            particlePositionsData[i * 4 + 1] = particlePositions[i][1];
            particlePositionsData[i * 4 + 2] = 0.0;
            particlePositionsData[i * 4 + 3] = 0.0;
        }

	wgl.rebuildTexture(this.particleTexture, wgl.RGBA, wgl.FLOAT, this.particlesWidth, this.particlesHeight, particlePositionsData, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);

    }
    
    //particle positions are the location of the particles within the 
    //field

    //particleWidth and particleHeight are the index positions into
    //the texture destinations for particle data. Since we have
    //to store particles as a texture and textures have width and height
    //we have to choose a particular size. It has nothing to do with the
    //location of the particles in the field, and is simply used to help
    //index where the particle data is within the texture.

    //fieldWidth and fieldHeight are pixel destinations for field generated
    //by particles. All indexes in the field are integers

    Simulator.prototype.reset = function(particlePositions, particleWidth, particleHeight, 
		   fieldWidth, fieldHeight)
    {
	this.particleWidth = particleWidth;
	this.particleHeight = particleHeight;
	this.fieldWidth = fieldWidth;
	this.fieldHeight = fieldHeight;

        var particleCount = this.particlesWidth * this.particlesHeight;

	fillParticleVertexBuffer();

	resetParticlePositionTexture(particlePositions);

	
	
    
	// // Get the storage location of a_Position
	// var a_Position = drawPointProgram.getAttribLocation('a_Position');
	// if (a_Position < 0) {
	//     console.log('Failed to get the storage location of a_Position');
	//     return;
	// }

	// drawState.vertexAttribPointer(buf, a_Position, 2, wgl.FLOAT,
	// 			      wgl.FALSE, 0, 0);
	
	// drawState.uniform1f('u_Width', canvas.width);
	// drawState.uniform1f('u_Height', canvas.height);
	
	// // Draw a point
	// wgl.drawArrays(drawState, wgl.POINTS, 0, particlePositions.length/2);
	// //    wgl.drawElements(drawState, wgl.POINTS, 1, wgl.UNSIGNED_SHORT, 0);
    }

    Simulator.prototype.simulate = function(timeStep)
    {
        if (timeStep === 0.0) return;
	
        this.frameNumber += 1;
        var wgl = this.wgl;
	
        var buildFieldDrawState = wgl.createDrawState()
            .bindFramebuffer(this.simulationFramebuffer)
            .viewport(0, 0, this.fieldTextureWidth, this.fieldTextureHeight)
            .vertexAttribPointer(this.particleVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)

            .useProgram(this.buildFieldProgram)
            .uniform3f('u_fieldSize', this.fieldWidth, this.fieldHeight)
            .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, this.particleTexture)
            .uniformTexture('u_fieldTexture', 1, wgl.TEXTURE_2D, this.fieldTexture)

            .enable(wgl.BLEND)
            .blendEquation(wgl.FUNC_ADD)
            .blendFuncSeparate(wgl.ONE, wgl.ONE, wgl.ONE, wgl.ONE);

        wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.weightTexture, 0);


    }
}
