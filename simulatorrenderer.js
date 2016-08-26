var SimulatorRenderer = (function () {
    function SimulatorRenderer (canvas, wgl, fields, pTypes, onLoaded) {
        this.canvas = canvas;
        this.wgl = wgl;
	this.pTypes = pTypes;

        wgl.getExtension('OES_texture_float');
        wgl.getExtension('OES_texture_float_linear');

        var rendererLoaded = false,
            simulatorLoaded = false;

        this.renderer = new Renderer
	(this.canvas, this.wgl, fields, pTypes, 
	 (function () {
	     rendererLoaded = true;  
	     if (rendererLoaded && simulatorLoaded) {
		 start.call(this);
             }
         }).bind(this));

        this.simulator = new Simulator(
	    this.wgl, 
	    fields,
	    pTypes,
	    (function () {
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
	function (params)
    {
	this.params = params;
	this.simulator.reset(params);
        this.renderer.reset(params);
    }

    SimulatorRenderer.prototype.update = function (frame, timeStep) {
        this.simulator.simulate(timeStep);
	if(frame%this.params.simFramesPerRenderFrame == 0)
            this.renderer.draw(this.simulator);
    }

    SimulatorRenderer.prototype.onResize = function (event) {
        this.renderer.onResize(event);
    }

    return SimulatorRenderer;
}());
