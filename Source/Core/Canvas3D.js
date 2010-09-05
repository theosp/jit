Canvas.Base['3D'] = new Class({
  Implements: Canvas.Base['2D'],
  
  program: null,
  camera: null,
  
  initialize: function(viz) {
    this.viz = viz;
    this.opt = viz.config;
    this.size = false;
    this.createCanvas();
    this.initWebGL();
    this.initCamera();
  },
  
  initWebGL: function() {
    //initialize context
    var gl = this.getCtx();
    //get viewport size
    var size = this.getSize();
    //compile and get shaders
    var fragmentShader = this.getShader(Canvas.Base['3D'].FragmentShader, gl.FRAGMENT_SHADER);
    var vertexShader = this.getShader(Canvas.Base['3D'].VertexShader, gl.VERTEX_SHADER);
    //create program and link shaders
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw "Could not link shaders";
    }
    gl.useProgram(program);
    //bind name to variable location in shaders
    $.extend(program, {
      'viewMatrix': gl.getUniformLocation(program, 'viewMatrix'),
      'projectionMatrix': gl.getUniformLocation(program, 'projectionMatrix'),
      'color': gl.getUniformLocation(program, 'color'),
      'position': gl.getAttribLocation(program, 'position')
    });
    gl.enableVertexAttribArray(program.position);
    this.program = program;
    //set general rendering options
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.viewport(0, 0, size.width, size.height);
  },
  
  initCamera: function() {
    var size = this.getSize();
    var camera = new Camera(75, size.width / size.height, 1, 100000);
    camera.position.z = 500;
    this.camera = camera;
  },
  
  getShader: function(src, type) {
    var gl = this.ctx;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var info = gl.getShaderInfoLog(shader);
      throw "Could not compile shader src: " + info;
    }
    return shader;
  },

  getCtx: function() {
    if(!this.ctx) 
      return this.ctx = this.canvas.getContext('experimental-webgl');
    return this.ctx;
  },
  
  resize: function(width, height) {
    var size = this.getSize(),
        canvas = this.canvas,
        styles = canvas.style,
        gl = this.getCtx();
    this.size = false;
    canvas.width = width;
    canvas.height = height;
    styles.width = width + "px";
    styles.height = height + "px";
    gl.viewport(0, 0, width, height);

    this.translateOffsetX =
      this.translateOffsetY = 0;
    this.scaleOffsetX = 
      this.scaleOffsetY = 1;
    this.clear();
    this.viz.resize(width, height, this);
  },

  translateToCenter: $.empty,
  scale: $.empty,
  
  translate: function(x, y, z, disablePlot) {
    var sx = this.scaleOffsetX,
        sy = this.scaleOffsetY;
    this.translateOffsetX += x*sx;
    this.translateOffsetY += y*sy;
    var pos = this.camera.position;
    pos.x += x;
    pos.y += y;
    pos.z += z;
    !disablePlot && this.plot();
  },

  clear: function(){
    var gl = this.getCtx();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //TODO(nico) is this OK? I mean, to put this line here.
    this.camera.updateMatrix();
  },
  
  plot: function() {
    this.clear();
    this.viz.plot(this);
  }
});

//Shaders code
Canvas.Base['3D'].FragmentShader = [
  "#ifdef GL_ES",
  "precision highp float;",
  "#endif",
  
  "varying vec4 vcolor;",
  
  "void main(){",
  
    "gl_FragColor = vcolor;",
  
  "}"
].join("\n");

Canvas.Base['3D'].VertexShader = [
  "attribute vec3 position;",
  "uniform vec4 color;",
  
  "uniform mat4 viewMatrix;",
  "uniform mat4 projectionMatrix;",
  "varying vec4 vcolor;",
  
  "void main(void) {",
  
    "vcolor = color;",
    "gl_Position = projectionMatrix * viewMatrix * vec4( position, 1.0 );",
  
  "}"
].join("\n");