'use strict'

var TimParticles = (function () {

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

	return particlePositions;
    }

    function onSimLoaded()
    {
        var particlesWidth = 512; //we fix particlesWidth
        var particlesHeight = Math.ceil(this.desiredParticleCount / particlesWidth); //then we calculate the particlesHeight that produces the closest particle count

        var particleCount = particlesWidth * particlesHeight;

	var particlePositions = createRandomParticlePositions(particleCount, canvas.width,
							     canvas.height);
	this.simulatorRenderer.reset(particlePositions, particlesWidth,
				     particlesHeight);

        ////////////////////////////////////////////////////
        // start the update loop
	
        var lastTime = 0;
        var update = (function (currentTime) {
            var deltaTime = currentTime - lastTime || 0;
            lastTime = currentTime;
	    
            this.update(deltaTime);
	    
            requestAnimationFrame(update);
        }).bind(this);
        update();
    }

    TimParticles.prototype.update = function () {
        this.simulatorRenderer.update(this.timeStep);
    }

    
    return TimParticles;
})();



