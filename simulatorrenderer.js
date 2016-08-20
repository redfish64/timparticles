var SimulatorRenderer = (function () {
    function SimulatorRenderer (canvas, wgl, onLoaded) {
        this.canvas = canvas;
        this.wgl = wgl;

        wgl.getExtension('OES_texture_float');
        wgl.getExtension('OES_texture_float_linear');

        var rendererLoaded = false,
            simulatorLoaded = false;

        this.renderer = new Renderer(this.canvas, this.wgl, (function () {
            rendererLoaded = true;  
            if (rendererLoaded && simulatorLoaded) {
                start.call(this);
            }
        }).bind(this));

        this.simulator = new Simulator(this.wgl, (function () {
            simulatorLoaded = true;
            if (rendererLoaded && simulatorLoaded) {
                start.call(this);
            }
        }).bind(this));

	
        function start () {
	    setTimeout(onLoaded, 1);
        }
    }

    // SimulatorRenderer.prototype.onMouseMove = function (event) {
    // };

    // SimulatorRenderer.prototype.onMouseDown = function (event) {
    // };

    // SimulatorRenderer.prototype.onMouseUp = function (event) {
    // };

    SimulatorRenderer.prototype.reset = 
	function (particlePositions, 
		  particleVelocities,
		  particlesWidth, 
		  particlesHeight)
    {
	this.simulator.reset(particlePositions, particleVelocities,
			     particlesWidth,
			     particlesHeight, 
			     this.canvas.width, this.canvas.height);
        this.renderer.reset();
    }

    SimulatorRenderer.prototype.update = function (timeStep) {
        this.simulator.simulate(timeStep);
        this.renderer.draw(this.simulator);
    }

    SimulatorRenderer.prototype.onResize = function (event) {
        this.renderer.onResize(event);
    }

    return SimulatorRenderer;
}());
