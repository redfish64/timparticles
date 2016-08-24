'use strict'

var TimParticles = (function () {

    this.fields = [];
    this.pTypes = [];

    function TimParticles()
    {
    }

    TimParticles.prototype.addField = function(fieldParams)
    {
	validate_data(fieldParams,
		      {
			  name: 'required',
			  radius_calc: 'required',
			  uniforms: 'required'
		      });
	this.fields.push(fieldParams);
	return this;
    }
    

    TimParticles.prototype.addParticleType = function(pType)
    {
	validate_data(pType,
		      {
			  name: 'required',
			  force_props: 'required',
			  mass: 'required',
			  particleCount: 'required',
		      }
		      );
	
	pType.particlesWidth = 512;
	pType.particlesHeight = Math.ceil(Math.pType.particles/512);
	
	this.pTypes.push(pType);
	return this;
    }
    
    //sets various global parameters
    TimParticles.prototype.setParameters(params)
    {
	validate_data(params,
		      {
			  fieldSize: 'required',
			  areaPerFieldPixel: 'required',
			  targetSimTimePerSecond: 'required',
			  maxParticleSpeedAreaUnitPerSimTime: 'required',
			  simFramesPerRenderFrame: 'required'
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
					      this.params.fieldSize[0],
					      this.params.fieldSize[1]);
	    pType.startingMomentums = 
		createRandomParticleMomentums(particleCount,
					      maxMomentum);
	}
    }
    
    TimParticles.prototype.start = function()
    {
	this.params.totalParticleCount = 0;
	for(var i = 0; i < this.pTypes.length; i++)
	{
	    var pType = pTypes[i];
	    this.params.totalParticleCount += pType.particleCount;
	}

	this.canvas = document.getElementById('canvas');
	
	this.wgl = new WrappedGL(canvas);
	
	this.simulatorRenderer = new SimulatorRenderer
	(this.canvas,this.wgl, pTypes, onSimLoaded.bind(this));

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
        this.simulatorRenderer.update(deltaTime);
    }

    
    return TimParticles;
})();



