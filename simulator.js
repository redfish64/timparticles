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

	for(var i = 0; i < pTypes.length; i++)
	{
	    var pType = pTypes[i];
	    //this stores the index into the textures for each particle
	    //(the texture stores the particle data, such as position, etc..)
	    pType.particleVertexBuffer = wgl.createBuffer();
	}

	//the particle texture stores momentum and velocity information of
	//all particle types
	this.particleTexture = wgl.createTexture();
	this.particleTextureTemp = wgl.createTexture();

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
		updateParticleTextureProgram: {
		    vertexShader: 'shaders/fullscreen.vert',
		    fragmentShader: 'shaders/updateparticles.frag',
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
    Simulator.prototype.fillParticleVertexBuffer = function(offset, pType)
    {
	//console.log("size is %d", size);
        var particleTextureCoordinates = new Float32Array(pType.particles);

        
	var count = 0;
	var x = offset % this.particlesWidth; 

	for (var y = Math.floor(offset / this.particlesHeight); 
	     y < this.particlesHeight; ++y) {
            while(x < this.particlesWidth && count < pType.particleCount + offset) {
                particleTextureCoordinates[count * 2] = (x + 0.5) / pType.particlesWidth;
                particleTextureCoordinates[count * 2 + 1] = (y + 0.5) / pType.particlesHeight;
		count++;
		x++;
            }

	    x = 0;
        }

        this.wgl.bufferData(pType.particleVertexBuffer, this.wgl.ARRAY_BUFFER, particleTextureCoordinates, this.wgl.STATIC_DRAW);

	return count + offset;

    }

    //copies particle data from positions and momentums to out
    //starting from outIndex
    //return the index of the next empty item in out after the copy
    function copyParticleData(out, positions, momentums, outIndex)
    {
        for (var i = 0; i < positions.length/2; i++) {
            out[outIndex++] = positions[i*2];
            out[outIndex++] = positions[i*2+1];
            out[outIndex++] = momentums[i*2];
            out[outIndex++] = momentums[i*2+1];
        }

	return outIndex;
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
	// texture data is in a rgba format. So we create an array
	// of floats to handle this.
	var particlesData = 
	    new Float32Array(this.params.totalParticleCount * 2);
	
	//each particle type has its particles indexed into a 
	//a single texture. We create a particlesData to hold
	//it all and populate this texture.
	for(var i = 0; i < pTypes.length; i++)
	{
	    var pType = pTypes[i];
            index = copyParticleData(particlesData,
				     pType.positions,
				     pType.momentums, 
				     index);
	}
	    
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
	this.wgl.rebuildTexture(particleTexture, this.wgl.RGBA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, particlesData, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	//particleTexture and particleTextureTemp are swapped every frame
	this.wgl.rebuildTexture(particleTextureTemp, this.wgl.RGBA, this.wgl.FLOAT, this.particlesWidth, this.particlesHeight, null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);

	
	//create a texture per field
	for(var i = 0; i < this.fields.length; i++)
	{
	    var field = this.fields[i];
	    this.wgl.rebuildTexture(field.texture, this.wgl.RGBA, this.simulationNumberType, this.params.fieldSize[0], this.params.fieldSize[1], null, this.wgl.CLAMP_TO_EDGE, this.wgl.CLAMP_TO_EDGE, this.wgl.NEAREST, this.wgl.NEAREST);
	    
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

	var count = 0;

	for(var i = 0; i < pTypes.length; i++)
	{
	    var pType = pTypes[i];
	    count = this.fillParticleVertexBuffer(count, pType);
	}
	
	this.resetTextures();
    }

    Simulator.prototype.buildFieldTextures = function()
    {
        var wgl = this.wgl;
	
	for(var i = 0; i < fields.length; i++)
	{
	    var field = fields[i];

            wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, field.texture, 0);
	    
            wgl.clear(
		wgl.createClearState().bindFramebuffer(this.simulationFramebuffer).clearColor(0, 0, 0, 0),
		wgl.COLOR_BUFFER_BIT);
	    
	    for(var j = 0; j < pTypes.length; j++)
	    {
		var pType = pTypes[j];

		var force_charge = pType.force_props[i].force_charge;

		//if the particle isn't involved in the force
		//(ex. a neutron not involved in electric forces)
		//there is no reason to run it through the field
		//since it'll have no effect, so we skip it
		if(force_charge == 0.0)
		{
		    continue;
		}
		
		//PERF save this stuff off somewhere, so we don't need to 
		//calculate it every frame?
		var pointSize = pType.radius_calc(force_charge, 
						  this.params.minForce) *2;

		var drawState = wgl.createDrawState()
		    .bindFramebuffer(this.simulationFramebuffer)
		    .viewport(0, 0, this.params.fieldSize[0], 
			      this.params.fieldSize[1]) 
		
		//this next command designates
		//the vertexes as an attribute into the vert shader as the
		//first attribute, which is 'a_textureCoordinates' (as defined
		//in buildfield.vert
		    .vertexAttribPointer(pType.particleVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)

		    .useProgram(this[pType.shaderProgram])
		    .uniform2f('u_fieldSize', this.fieldWidth, this.fieldHeight)
		    .uniform1f('u_pointSize', pointSize)
		    .uniform1f('u_l', pType.u_l)
		    .uniform1f('u_k', pType.u_k)
		    .uniform1f('u_force_charge', pType.force_charge)
		    .uniform1f('u_areaPerFieldPixel', pType.u_areaPerFieldPixel)
		    .uniformTexture('u_particleTexture', 0, wgl.TEXTURE_2D, 
				    this.particleTexture)
		    .enable(wgl.BLEND)
		    .blendEquation(wgl.FUNC_ADD)
		    .blendFuncSeparate(wgl.ONE, wgl.ONE, wgl.ONE, wgl.ONE);
		
		wgl.drawArrays(drawState, wgl.GL_POINTS, 0, 
			       pType.particleCount);
			       
	    } // for each particle type
	}//for each field
    }
    
    Simulator.prototype.updateParticlesTexture = function(timeStep)
    {
        var wgl = this.wgl;
	
        wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.particleTextureTemp, 0);

	//co: we shouldn't have to clear it, I think????	
        // wgl.clear(
        //     wgl.createClearState().bindFramebuffer(this.simulationFramebuffer).clearColor(0, 0, 0, 0),
        //     wgl.COLOR_BUFFER_BIT);
	
	for(var j = 0; j < pTypes.length; j++)
	{
	    var pType = pTypes[j];
	    
	    for(var i = 0; i < this.fields.length; i++)
	    {
		var field = this.fields[i];

		var force_charge = pType.force_props[i].force_charge;

		if(force_charge == 0.0)
		{
		    continue;
		}
		
		
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
	}

	var t = this.particleTexture;
	this.particleTexture = this.particleTextureTemp;
	this.particleTextureTemp = t;

    }

    //time step is in simulation frames. It should never go over 1.0
    Simulator.prototype.simulate = function(timeStep)
    {
        if (timeStep == 0.0) return;
	
        this.frameNumber += 1;

	this.buildFieldTexture();
	this.updateParticlesTexture(timeStep);
    }

    return Simulator;
}
)();
