'use strict'

//particle data (position, etc.) is put
//into a texture so we can alter this data and keep all the memory
//for it within the gpu
var Simulator = (function () {
    function Simulator(wgl, callerOnLoaded)
    {
	this.wgl = wgl;

        this.simulationFramebuffer = wgl.createFramebuffer();

	//this stores the index into the textures for each particle
	//(the texture stores the particle data, such as position, etc..)
        this.particleVertexBuffer = wgl.createBuffer();

	this.particlePositionsTexture = wgl.createTexture();
	this.particlePositionsTempTexture = wgl.createTexture();

	this.particleVelocitiesTexture = wgl.createTexture();
	this.particleVelocitiesTempTexture = wgl.createTexture();

	//this is the output where we store the resulting vector field
        this.fieldTexture = wgl.createTexture();

        this.halfFloatExt = this.wgl.getExtension('OES_texture_half_float');
        this.wgl.getExtension('OES_texture_half_float_linear');

        this.simulationNumberType = this.halfFloatExt.HALF_FLOAT_OES;

	this.frameNumber = 0;

	wgl.createProgramsFromFiles(
	    {
		// moveParticlesProgram: {
		//     vertexShader: 'shaders/movepart.vert',
		//     fragmentShader: 'shaders/movepart.frag'
		// },
		buildFieldProgram: {
		    vertexShader: 'shaders/buildfield.vert',
		    fragmentShader: 'shaders/buildfield.frag'
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

    function createFloat32ArrayForData(data)
    {

	var out = 
	    new Float32Array(data.length);

        for (var i = 0; i < data.length; i++) {
            out[i] = data[i];
        }

	return out;
    }


    //fills and initializes textures needed to process particles
    Simulator.prototype.resetTextures = 
	function(particlePositions, particleVelocities)
    {
	// texture data is in a rgba format. So we create an array
	// of floats to handle this.
        var particlePositionsData = createFloat32ArrayForData(particlePositions);

	//This will produce the following error. It also appears in fluid
	//which this is based on, so we'll just ignore it
	//We are setting the minification filter to NEAREST
	//which shouldn't require a mipmap, but we do so after this 
	//error appears
	//
	//Error: WebGL: A texture is going to be rendered as if it were black, as per the OpenGL ES 2.0.24 spec section 3.8.2, because it is a 2D texture, with a minification filter requiring a mipmap, and is not mipmap complete (as defined in section 3.7.10).1 wrappedgl.js:776:8
	//
	// We use LA type so we get two values per texture coordinate (X and Y)
	this.wgl.rebuildTexture(this.particlePositionsTexture, this.wgl.LUMINANCE_ALPHA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, particlePositionsData, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	// this.wgl.rebuildTexture(this.particlePositionsTempTexture, this.wgl.LUMINANCE_ALPHA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);

        // var particleVelocitiesData = createFloat32ArrayForData(particleVelocities);
	// this.wgl.rebuildTexture(this.particleVelocitiesTexture, this.wgl.LUMINANCE_ALPHA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, particleVelocitiesData, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	// this.wgl.rebuildTexture(this.particleVelocitiesTempTexture, this.wgl.LUMINANCE_ALPHA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);


	this.wgl.rebuildTexture(this.fieldTexture, this.wgl.RGBA, this.simulationNumberType, this.fieldWidth, this.fieldHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.LINEAR, this.wgl.LINEAR);
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
    Simulator.prototype.reset = function(particlePositions, 
					 particleVelocities,
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

	this.resetTextures(particlePositions, particleVelocities);

    }

    Simulator.prototype.buildFieldTexture = function()
    {
        var wgl = this.wgl;
	
        var buildFieldDrawState = wgl.createDrawState()
            .bindFramebuffer(this.simulationFramebuffer)
	//co: it seems the viewport is set to automatically fill the
	//output texture. Note that from the shader perspective the field
	//will be from -1 to 1 in both directions 
	//
	//.viewport(0, 0, this.fieldWidth, this.fieldHeight) 

	//this next command designates
	//the vertexes as an attribute into the vert shader as the
	//first attribute, which is 'a_textureCoordinates' (as defined
	//in buildfield.vert
            .vertexAttribPointer(this.particleVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)

            .useProgram(this.buildFieldProgram)
            .uniform2f('u_fieldSize', this.fieldWidth, this.fieldHeight)
            .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, this.particlePositionsTexture)
            .enable(wgl.BLEND)
            .blendEquation(wgl.FUNC_ADD)
            .blendFuncSeparate(wgl.ONE, wgl.ONE, wgl.ONE, wgl.ONE);
	
        wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.fieldTexture, 0);
	
	wgl.drawArrays(buildFieldDrawState, wgl.GL_POINTS, 0, 
		       this.particleCount);
    }
    
    Simulator.prototype.simulate = function(timeStep)
    {
        if (this.timeStep == 0.0) return;
	
        this.frameNumber += 1;

	this.buildFieldTexture();
	
    }

    return Simulator;
}
)();
