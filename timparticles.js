'use strict'

var TimParticles = (function () {

    //velocity is in field units per millisecond
    var MAX_VELOCITY = 0.05;

    function TimParticles(desiredParticleCount)
    {
	this.desiredParticleCount = desiredParticleCount;

	this.canvas = document.getElementById('canvas');
	
	this.wgl = new WrappedGL(canvas);
	
	this.simulatorRenderer = new SimulatorRenderer
	(this.canvas,this.wgl, onSimLoaded.bind(this));

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

    //note, velocity may slightly exceed maxVelocity by around 30% or so
    function createRandomParticleVelocities(particleCount,maxVelocity)
    {
	var particleVelocities = [];
	
	for(var p = 0; p < particleCount; p++)
	{
	    particleVelocities.push(randomPoint(-maxVelocity,maxVelocity));
	    particleVelocities.push(randomPoint(-maxVelocity,maxVelocity));
	}

	return particleVelocities;
    }

    function resetSimulation()
    {
        var particlesWidth = 512;
        var particlesHeight = Math.ceil(this.desiredParticleCount / particlesWidth); //then we calculate the particlesHeight that produces the closest particle count

        var particleCount = particlesWidth * particlesHeight;

	var particlePositions = createRandomParticlePositions(particleCount, canvas.width,
							     canvas.height);
	var particleVelocities = createRandomParticleVelocities(particleCount, MAX_VELOCITY);
	this.simulatorRenderer.reset(particlePositions, particleVelocities, 
				     particlesWidth,
				     particlesHeight);

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



