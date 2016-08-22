'use strict'

//particle data (position, etc.) is put
//into a texture so we can alter this data and keep all the memory
//for it within the gpu
var Simulator = (function () {
    var MAX_TIME_STEP = 20;

    function Simulator(wgl, callerOnLoaded)
    {
	this.wgl = wgl;

        this.simulationFramebuffer = wgl.createFramebuffer();
	
	//this is used to draw the whole input buffer in the frag shader
	//useful for moving particles and updating their velocities
        this.quadVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array(
	    [
		-1.0, -1.0, 
		-1.0, 1.0, 
		1.0, -1.0, 
		1.0, 1.0
	    ]), wgl.STATIC_DRAW);

	//this stores the index into the textures for each particle
	//(the texture stores the particle data, such as position, etc..)
        this.particleVertexBuffer = wgl.createBuffer();

	this.particleTexture = wgl.createTexture();
	this.particleTextureTemp = wgl.createTexture();

	//this is the output where we store the resulting vector field
        this.fieldTexture = wgl.createTexture();

        this.halfFloatExt = this.wgl.getExtension('OES_texture_half_float');
        this.wgl.getExtension('OES_texture_half_float_linear');

        this.simulationNumberType = this.halfFloatExt.HALF_FLOAT_OES;

	this.frameNumber = 0;

	wgl.createProgramsFromFiles(
	    {
		updateParticleTextureProgram: {
		    vertexShader: 'shaders/fullscreen.vert',
		    fragmentShader: 'shaders/updateparticles.frag',
                    attributeLocations: { 'a_position': 0}
		},
		buildFieldProgram: {
		    vertexShader: 'shaders/buildfield.vert',
		    fragmentShader: 'shaders/buildfield.frag',
                    attributeLocations: { 'a_textureCoordinates': 0}
		}
	    },
	    (function (programs) {
		for (var programName in programs) {
                    this[programName] = programs[programName];
		}
		callerOnLoaded();
	    }).bind(this)
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
	var size = this.particlesWidth * this.particlesHeight * 2;
	//console.log("size is %d", size);
        var particleTextureCoordinates = new Float32Array(size);
        
	for (var y = 0; y < this.particlesHeight; ++y) {
            for (var x = 0; x < this.particlesWidth; ++x) {
                particleTextureCoordinates[(y * this.particlesWidth + x) * 2] = (x + 0.5) / this.particlesWidth;
                particleTextureCoordinates[(y * this.particlesWidth + x) * 2 + 1] = (y + 0.5) / this.particlesHeight;
            }
        }

        this.wgl.bufferData(this.particleVertexBuffer, this.wgl.ARRAY_BUFFER, particleTextureCoordinates, this.wgl.STATIC_DRAW);

    }

    function createParticleData(positions, velocities)
    {

	var out = 
	    new Float32Array(positions.length * 2);

        for (var i = 0; i < positions.length/2; i++) {
            out[i*4] = positions[i*2];
            out[i*4+1] = positions[i*2+1];
            out[i*4+2] = velocities[i*2];
            out[i*4+3] = velocities[i*2+1];
        }

	return out;
    }


    function swap (object, a, b) {
        var temp = object[a];
        object[a] = object[b];
        object[b] = temp;
    }

    //fills and initializes textures needed to process particles
    Simulator.prototype.resetTextures = 
	function(positions, velocities)
    {
	// texture data is in a rgba format. So we create an array
	// of floats to handle this.
        var particlesData = createParticleData(positions, velocities);

	//This will produce the following error. It also appears in fluid
	//which this is based on, so we'll just ignore it
	//We are setting the minification filter to NEAREST
	//which shouldn't require a mipmap, but we do so after this 
	//error appears
	//
	//Error: WebGL: A texture is going to be rendered as if it were black, as per the OpenGL ES 2.0.24 spec section 3.8.2, because it is a 2D texture, with a minification filter requiring a mipmap, and is not mipmap complete (as defined in section 3.7.10).1 wrappedgl.js:776:8
	this.wgl.rebuildTexture(this.particleTexture, this.wgl.RGBA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, particlesData, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	//particleTexture and particleTextureTemp are swapped every frame
	this.wgl.rebuildTexture(this.particleTextureTemp, this.wgl.RGBA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);

	this.wgl.rebuildTexture(this.fieldTexture, this.wgl.RGBA, this.simulationNumberType, this.fieldWidth, this.fieldHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
    }
    
    //particle positions are the location of the particles within the 
    //field
    //
    //particlesWidth and particlesHeight are the index positions into
    //the texture destinations for particle data. Since we have to
    //store particles as a texture and textures have width and height
    //we have to choose a particular width and height. It has nothing
    //to do with the location of the particles in the field, and is
    //simply used to help index where the particle data is within the
    //texture.
    //
    //fieldWidth and fieldHeight are pixel destinations for field generated
    //by particles. All indexes in the field are integers
    //
    Simulator.prototype.reset = function(positions, 
					 velocities,
					 particlesWidth, 
					 particlesHeight, 
					 fieldWidth, fieldHeight)
    {
	this.particlesWidth = particlesWidth;
	this.particlesHeight = particlesHeight;
	this.fieldWidth = fieldWidth;
	this.fieldHeight = fieldHeight;

        this.particleCount = this.particlesWidth * this.particlesHeight;

	this.fillParticleVertexBuffer();

	this.resetTextures(positions, velocities);

    }

    Simulator.prototype.buildFieldTexture = function()
    {
        var wgl = this.wgl;
	
        wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.fieldTexture, 0);
	
        wgl.clear(
            wgl.createClearState().bindFramebuffer(this.simulationFramebuffer).clearColor(0, 0, 0, 0),
            wgl.COLOR_BUFFER_BIT);

        var drawState = wgl.createDrawState()
            .bindFramebuffer(this.simulationFramebuffer)
	    .viewport(0, 0, this.fieldWidth, this.fieldHeight) 

	//this next command designates
	//the vertexes as an attribute into the vert shader as the
	//first attribute, which is 'a_textureCoordinates' (as defined
	//in buildfield.vert
            .vertexAttribPointer(this.particleVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)

            .useProgram(this.buildFieldProgram)
            .uniform2f('u_fieldSize', this.fieldWidth, this.fieldHeight)
            .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, 
			    this.particleTexture)
            .enable(wgl.BLEND)
            .blendEquation(wgl.FUNC_ADD)
            .blendFuncSeparate(wgl.ONE, wgl.ONE, wgl.ONE, wgl.ONE);
	
	wgl.drawArrays(drawState, wgl.GL_POINTS, 0, 
		       this.particleCount);
    }
    
    Simulator.prototype.updateParticlesTexture = function(timeStep)
    {
        var wgl = this.wgl;
	
        wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.particleTextureTemp, 0);

	//co: we shouldn't have to clear it, I think????	
        // wgl.clear(
        //     wgl.createClearState().bindFramebuffer(this.simulationFramebuffer).clearColor(0, 0, 0, 0),
        //     wgl.COLOR_BUFFER_BIT);

        var drawState = wgl.createDrawState()
            .bindFramebuffer(this.simulationFramebuffer)
	//viewport set to the size of the output texture
	    .viewport(0, 0, this.particlesWidth, this.particlesHeight) 
	    //PERF: for gl efficiency, may want to conver this to a single
	    //buffer
            .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
            .useProgram(this.updateParticleTextureProgram)
            .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, this.particleTexture)
            .uniformTexture('u_fieldTexture', 1, wgl.TEXTURE_2D, this.fieldTexture)
	    .uniform1f('u_timeStep', timeStep)
            .uniform2f('u_fieldSize', this.fieldWidth, this.fieldHeight)
	;
	
        wgl.drawArrays(drawState, wgl.TRIANGLE_STRIP, 0, 4);

	var t = this.particleTexture;
	this.particleTexture = this.particleTextureTemp;
	this.particleTextureTemp = t;

    }
    
    Simulator.prototype.simulate = function(timeStep)
    {
        if (timeStep == 0.0) return;
	
	//if the computer paused for awhile to do something else, we
	//don't want it causing our particles to drift too far
	if(timeStep > MAX_TIME_STEP)
	    timeStep = MAX_TIME_STEP;

        this.frameNumber += 1;

	this.buildFieldTexture();
	this.updateParticlesTexture(timeStep);
    }

    return Simulator;
}
)();
