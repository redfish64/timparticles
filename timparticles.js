var TimParticles = (function () {

    function TimParticles(desiredParticleCount)
    {
	this.canvas = document.getElementById('canvas');
	
	this.wgl = new WrappedGL(canvas);
	
	this.simulator = new Simulator(wgl,onSimLoaded);

	this.desiredParticleCount = desiredParticleCount;
    }
    
    function randomPoint = function (min,max) { 
	return min + Math.random() * (max - min);
    }

    function createRandomParticlePositions(maxX, maxY)
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

	var particlePositions = createRandomParticlePositions(canvas.width,
							     canvas.height);
	this.simulator.reset(particlePositions, particlesWidth,
			     particlesHeight, canvas.width, canvas.height);
    }
    
}



