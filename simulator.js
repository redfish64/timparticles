'use strict'

//particle data (position, etc.) is put
//into a texture so we can alter this data and keep all the memory
//for it within the gpu
var Simulator = (function () {
    var MAX_TIME_STEP = 20;

    function Simulator(wgl, fields, pTypes, callerOnLoaded)
    {
	this.wgl = wgl;

	this.fields = fields;
	this.pTypes = pTypes;

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

	for(var i = 0; i < this.pTypes.length; i++)
	{
	    var pType = this.pTypes[i];
	    //this stores the index into the textures for each particle
	    //(the texture stores the particle data, such as position, etc..)
	    pType.particleVertexBuffer = wgl.createBuffer();

	    //the particle texture stores momentum and velocity information of
	    //all particle for the type
	    pType.particleTexture = wgl.createTexture();
	    pType.particleTextureTemp = wgl.createTexture();

	}

	//this is the output where we store the resulting vector
	//fields since particles can have a different mass in each
	//field, we need a separate texture for each (ex. an electron
	//particle may have negative mass in the electric field)
	for(var i = 0; i < this.fields.length; i++)
	{
	    var field = this.fields[i];
            field.texture = wgl.createTexture();
	}

        this.halfFloatExt = this.wgl.getExtension('OES_texture_half_float');
        this.wgl.getExtension('OES_texture_half_float_linear');

        this.simulationNumberType = this.halfFloatExt.HALF_FLOAT_OES;

	this.frameNumber = 0;

	wgl.createProgramsFromFiles(
	    {
		updateMomentumProgram: {
		    vertexShader: 'shaders/fullscreen.vert',
		    fragmentShader: 'shaders/updatemomentum.frag',
                    attributeLocations: { 'a_position': 0}
		},
		updatePositionProgram: {
		    vertexShader: 'shaders/fullscreen.vert',
		    fragmentShader: 'shaders/updateposition.frag',
                    attributeLocations: { 'a_position': 0}
		},
		sqrForceProgram: {
		    vertexShader: 'shaders/sqrforce.vert',
		    fragmentShader: 'shaders/sqrforce.frag',
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
    Simulator.prototype.fillParticleVertexBuffer = function(pType)
    {
	//console.log("size is %d", size);
        var particleTextureCoordinates = new Float32Array(pType.particleCount*2);
        
	var count = 0;
	for (var y = 0; y < pType.particlesHeight; ++y) {
            for(var x = 0; x < pType.particlesWidth && count < pType.particleCount; x++) {
                particleTextureCoordinates[count * 2] = (x + 0.5) / pType.particlesWidth;
                particleTextureCoordinates[count * 2 + 1] = (y + 0.5) / pType.particlesHeight;
		count++;
            }
        }

        this.wgl.bufferData(pType.particleVertexBuffer, this.wgl.ARRAY_BUFFER, particleTextureCoordinates, this.wgl.STATIC_DRAW);
    }

    function createParticleData(pType)
    {
	//we may want to have less particles than a power of 2 but we
	//still need to create an array to fill out the entire texture
	var totalTextureCount = pType.particlesHeight * pType.particlesWidth;

	var positions = pType.startingPositions;
	var momentums = pType.startingMomentums;

	// texture data is in a rgba format. So we create an array
	// of 4 floats per item to handle this.
        var out = 
            new Float32Array(totalTextureCount * 4);

        for (var i = 0; i < positions.length/2; i++) {
            out[i*4] = positions[i*2];
            out[i*4+1] = positions[i*2+1];
            out[i*4+2] = momentums[i*2];
            out[i*4+3] = momentums[i*2+1];
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
	function()
    {
	//each particle type has its own particle texture for its
	//momentum and position of each particle
	for(var i = 0; i < this.pTypes.length; i++)
	{
	    var pType = this.pTypes[i];
            var particlesData = createParticleData(pType);
	    
	    //Create the particle texture for all particle types and populate
	    //it with starting values
	    //
	    //This will produce the following error. It also appears in fluid
	    //which this is based on, so we'll just ignore it
	    //We are setting the minification filter to NEAREST
	    //which shouldn't require a mipmap, but we do so after this 
	    //error appears
	    //
	    //Error: WebGL: A texture is going to be rendered as if it were black, as per the OpenGL ES 2.0.24 spec section 3.8.2, because it is a 2D texture, with a minification filter requiring a mipmap, and is not mipmap complete (as defined in section 3.7.10).1 wrappedgl.js:776:8
	    this.wgl.rebuildTexture(pType.particleTexture, this.wgl.RGBA, this.wgl.FLOAT, pType.particlesWidth, pType.particlesHeight, particlesData, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	    //particleTexture and particleTextureTemp are swapped every frame
	    this.wgl.rebuildTexture(pType.particleTextureTemp, this.wgl.RGBA, this.wgl.FLOAT, pType.particlesWidth, pType.particlesHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	    
	}
	//create a texture per field
	for(var i = 0; i < this.fields.length; i++)
	{
	    var field = this.fields[i];
	    this.wgl.rebuildTexture(field.texture, this.wgl.RGBA, this.simulationNumberType, field.size[0], field.size[1], null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	    
	}
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
    Simulator.prototype.reset = function(params)
    {
	this.params = params;

	for(var i = 0; i < this.pTypes.length; i++)
	{
	    var pType = this.pTypes[i];
	    this.fillParticleVertexBuffer(pType);
	}
	
	this.resetTextures();
    }

    Simulator.prototype.buildFieldTextures = function()
    {
        var wgl = this.wgl;
	
	for(var i = 0; i < this.fields.length; i++)
	{
	    var field = this.fields[i];

            wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, field.texture, 0);
	    
            wgl.clear(
		wgl.createClearState().bindFramebuffer(this.simulationFramebuffer).clearColor(0, 0, 0, 0),
		wgl.COLOR_BUFFER_BIT);
	    
	    for(var j = 0; j < this.pTypes.length; j++)
	    {
		var pType = this.pTypes[j];

		var forceCharge = pType.forceProps[i].forceCharge;

		//if the particle isn't involved in the force
		//(ex. a neutron not involved in electric forces)
		//there is no reason to run it through the field
		//since it'll have no effect, so we skip it
		if(forceCharge == 0.0)
		{
		    continue;
		}
		
		//PERF save this stuff off somewhere, so we don't need to 
		//calculate it every frame?
		var pointSize = field.radiusCalc(forceCharge, 
						 this.params.minForce);

		var areaPerFieldPixel = this.params.areaSize[0]/field.size[0];
		
		var drawState = wgl.createDrawState()
		    .bindFramebuffer(this.simulationFramebuffer)
		    .viewport(0, 0, field.size[0], 
			      field.size[1]) 
		//this next command designates
		//the vertexes as an attribute into the vert shader as the
		//first attribute, which is 'a_textureCoordinates' (as defined
		//in buildfield.vert
		    .vertexAttribPointer(pType.particleVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)

		    .useProgram(this[field.shaderProgram])
		    .uniform2f('u_areaSize', this.params.areaSize[0],
			       this.params.areaSize[1])
		    .uniform1f('u_pointSize', pointSize)
		    .uniform1f('u_pointSize2', pointSize)
		    .uniform1f('u_l', field.u_l)
		    .uniform1f('u_k', field.u_k)
		    .uniform1f('u_forceCharge', forceCharge)
		    .uniform1f('u_areaPerFieldPixel', areaPerFieldPixel)
		    .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, 
				    pType.particleTexture)
		    .enable(wgl.BLEND)
		    .blendEquation(wgl.FUNC_ADD)
		    .blendFuncSeparate(wgl.ONE, wgl.ONE, wgl.ONE, wgl.ONE)
		;
		wgl.drawArrays(drawState, wgl.POINTS, 0, 
			       pType.particleCount);
			       
	    } // for each particle type
	}//for each field
    }

    //updates the momentum of each particle according to the fields in place
    Simulator.prototype.updateMomentum = function(timeStep)
    {
        var wgl = this.wgl;
	
	for(var j = 0; j < this.pTypes.length; j++)
	{
	    var pType = this.pTypes[j];
	    //co: we shouldn't have to clear it, I think????	
            // wgl.clear(
            //     wgl.createClearState().bindFramebuffer(this.simulationFramebuffer).clearColor(0, 0, 0, 0),
            //     wgl.COLOR_BUFFER_BIT);
	
	    for(var i = 0; i < this.fields.length; i++)
	    {
		//rebind to the temp particle texture (which is swapped by
		//every field)
		wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, pType.particleTextureTemp, 0);

		var field = this.fields[i];
		
		var forceCharge = pType.forceProps[i].forceCharge;
		
		if(forceCharge == 0.0)
		{
		    continue;
		}
		
		var drawState = wgl.createDrawState()
		    .bindFramebuffer(this.simulationFramebuffer)
		//viewport set to the size of the output texture
		    .viewport(0, 0, pType.particlesWidth, pType.particlesHeight) 
		//PERF: for gl efficiency, may want to conver this to a single
	    //buffer
		    .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
		    .useProgram(this.updateMomentumProgram)
		    .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, pType.particleTexture)
		    .uniformTexture('u_fieldTexture', 1, wgl.TEXTURE_2D, 
				    field.texture)
		    .uniform1f('u_timeStep', timeStep)
		    .uniform1f('u_forceCharge', forceCharge)
		    .uniform2f('u_fieldSize', field.size[0],field.size[1])
		    .uniform2f('u_areaSize', this.params.areaSize[0],
			       this.params.areaSize[1])
		;
		
		wgl.drawArrays(drawState, wgl.TRIANGLE_STRIP, 0, 4);
		
		//we must swap the particle texture after every draw
		//so that we can add the forces effect together properly
		swap(pType, 'particleTexture', 'particleTextureTemp');
	    } //for each field
	} //for each particle
    }

    //updates the position of each particle based on its momentum
    //Note that it will also update momentum, if the particle bounces
    //of the edges of the simulation
    Simulator.prototype.updatePosition = function(timeStep)
    {
        var wgl = this.wgl;
	
	for(var j = 0; j < this.pTypes.length; j++)
	{
	    var pType = this.pTypes[j];
            wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, pType.particleTextureTemp, 0);
		
	    var drawState = wgl.createDrawState()
		.bindFramebuffer(this.simulationFramebuffer)
	    //viewport set to the size of the output texture
		.viewport(0, 0, pType.particlesWidth, pType.particlesHeight) 
	    //PERF: for gl efficiency, may want to conver this to a single
	    //buffer
		.vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
		.useProgram(this.updatePositionProgram)
		.uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, pType.particleTexture)
		.uniform1f('u_timeStep', timeStep)
		.uniform1f('u_maxSpeed', this.params.maxSpeed)
		.uniform1f('u_mass0', pType.mass)
		.uniform2f('u_areaSize', this.params.areaSize[0],
			  this.params.areaSize[1])
	    ;
	    
	    wgl.drawArrays(drawState, wgl.TRIANGLE_STRIP, 0, 4);
	    
	    swap(pType, 'particleTexture', 'particleTextureTemp');
	}
    }

    //time step is in simulation frames. It should never go over 1.0
    Simulator.prototype.simulate = function(timeStep)
    {
        if (timeStep == 0.0) return;
	
        this.frameNumber += 1;

	this.buildFieldTextures();
	this.updateMomentum(timeStep);
	this.updatePosition(timeStep);
    }

    return Simulator;
}
)();
