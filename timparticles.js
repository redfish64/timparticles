'use strict'

var TimParticles = (function () {

    function TimParticles()
    {
	this.fields = [];
	this.pTypes = [];
    }

    TimParticles.prototype.addField = function(fieldParams)
    {
	validate_data(fieldParams,
		      {
			  name: 'required',
			  shaderProgram: 'required',
			  size: 'required',
			  radiusCalc: 'required'
		      });
	this.fields.push(fieldParams);
	return this;
    }
    

    TimParticles.prototype.addParticleType = function(pType)
    {
	validate_data(pType,
		      {
			  name: 'required',
			  forceProps: 'required',
			  mass: 'required',
			  size: 'required',
			  color: 'required',
			  particleCount: 'required'
		      }
		      );
	
	pType.particlesWidth = 512;
	pType.particlesHeight = Math.ceil(pType.particleCount/512);
	
	this.pTypes.push(pType);
	return this;
    }
    
    //sets various global parameters
    TimParticles.prototype.setParameters = function(params)
    {
	validate_data(params,
		      {
			  areaSize: 'required',
			  targetSimTimePerSecond: 'required',
			  maxParticleSpeedAreaUnitPerSimTime: 'required',
			  simFramesPerRenderFrame: 'required',
			  minForce: 'required',
			  maxSpeed: 'required'
		      }
		     );

	this.params = params;
    }

    //randomizes the positions and momentum of all particles
    //setParameters, and addParticleTypes must be call for all
    //particles
    TimParticles.prototype.randomizeParticles = function(maxMomentum)
    {
	for(var i = 0; i < this.pTypes.length; i++)
	{
	    var pType = this.pTypes[i];
	    pType.startingPositions = 
		createRandomParticlePositions(pType.particleCount,
					      this.params.areaSize[0],
					      this.params.areaSize[1]);
	    pType.startingMomentums = 
		createRandomParticleMomentums(pType.particleCount,
					      maxMomentum);
	}
    }
    
    TimParticles.prototype.start = function()
    {
	this.params.totalParticleCount = 0;
	for(var i = 0; i < this.pTypes.length; i++)
	{
	    var pType = this.pTypes[i];
	    this.params.totalParticleCount += pType.particleCount;
	}

	for(var i = 0; i < this.fields.length; i++)
	{
	    var field = this.fields[i];
	    
	    assert(this.params.areaSize[0]/this.params.areaSize[1] == 
		   field.size[0]/field.size[1],
		   "param size ratio must equal field size ratio, field "+i
		   +" size "+field.size+", doesn't have the same ratio as "+
		   "areaSize "+this.params.areaSize);
	}
	
	this.canvas = document.getElementById('canvas');
	
	this.wgl = new WrappedGL(canvas);
	
	this.simulatorRenderer = new SimulatorRenderer
	(this.canvas,this.wgl, this.fields, this.pTypes, onSimLoaded.bind(this));

    }
    
    function randomPoint(min,max) { 
	return min + Math.random() * (max - min);
    }

    function createRandomParticlePositions(particleCount,maxX, maxY)
    {
	var particlePositions = [];
	
	for(var p = 0; p < particleCount; p++)
	{
	    particlePositions.push(randomPoint(0,maxX));
	    particlePositions.push(randomPoint(0,maxY));
	}
	
	// //more orderly particles
	// var particlePositions = [];
	// for(var p = 0; p < particleCount; p++)
	// {
	//     particlePositions.push( (p % 10)/10. * maxX);
	//     particlePositions.push( ((p- (p%10)) / 10)/10. * maxY);
	// }


	return particlePositions;
    }

    //note, momentum may exceed maxMomentum by around 30% or so
    function createRandomParticleMomentums(particleCount,maxVelocity)
    {
	var particleMomentums = [];
	
	for(var p = 0; p < particleCount; p++)
	{
	    particleMomentums.push(randomPoint(-maxVelocity,maxVelocity));
	    particleMomentums.push(randomPoint(-maxVelocity,maxVelocity));
	}

	return particleMomentums;
    }

    function resetSimulation()
    {
	this.simulatorRenderer.reset(this.params);
	this.frame=0;
    }

    function onSimLoaded()
    {
	resetSimulation.call(this);

        ////////////////////////////////////////////////////
        // start the update loop
	
        var lastTime = 0;

	var i = 0;
        var update = (function (currentTime) {
            var deltaTime = currentTime - lastTime || 0;
            lastTime = currentTime;
	    
            this.update(deltaTime);
	    
            requestAnimationFrame(update);

	    //if(++i % 50 == 0)
//		resetSimulation.call(this);
        }).bind(this);
        update();
    }

    TimParticles.prototype.update = function (deltaTime) {
	//if we can go faster than a simulation time unit,
	//then we simulate a partial time unit,
	//otherwise we slow time down to exactly one simulation
	//time unit.
	//
	//We do this to prevent particles from jumping around
	//into very strong fields thereby giving them too much energy
	var simTime = 
	    Math.min(
		this.params.targetSimTimePerSecond*0.001*deltaTime,
		1.);

	this.frame++;
        this.simulatorRenderer.update(this.frame,simTime);
    }

    
    return TimParticles;
})();



