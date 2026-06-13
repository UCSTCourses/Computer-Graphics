
var canvas;
var gl;

var canvas2;
var gl2;

var dragvalue;
var NumVertices  = 36;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var sX=0.4;
var sY=0.4;
var sZ=0.4;

var axis = 0;
var theta = [ 30, 50, 66 ];
var thetaLoc;
var thetaLoc2;


var flag = true;
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    canvas2 = document.getElementById( "gl-canvas2" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl2 = WebGLUtils.setupWebGL( canvas2 );
    if ( !gl2 ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(1.0,  1.0,1.0,1.0);

    gl2.viewport( 0, 0, canvas2.width, canvas2.height );
    gl2.clearColor(1.0, 1.0,1.0,1.0);
    
    gl.enable(gl.DEPTH_TEST);

    gl2.enable(gl2.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var program2 = initShaders( gl2, "vertex-shader", "fragment-shader" );
    gl2.useProgram( program2 );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var cBuffer2 = gl2.createBuffer();
    gl2.bindBuffer( gl2.ARRAY_BUFFER, cBuffer2 );
    gl2.bufferData( gl2.ARRAY_BUFFER, flatten(colors), gl2.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vColor2 = gl2.getAttribLocation( program2, "vColor" );
    gl2.vertexAttribPointer( vColor2, 4, gl2.FLOAT, false, 0, 0 );
    gl2.enableVertexAttribArray( vColor2 );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vBuffer2 = gl2.createBuffer();
    gl2.bindBuffer( gl2.ARRAY_BUFFER, vBuffer2 );
    gl2.bufferData( gl2.ARRAY_BUFFER, flatten(points), gl2.STATIC_DRAW );
    

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var vPosition2 = gl2.getAttribLocation( program2, "vPosition" );
    gl2.vertexAttribPointer( vPosition2, 4, gl2.FLOAT, false, 0, 0 );
    gl2.enableVertexAttribArray( vPosition2 );


    thetaLoc = gl.getUniformLocation(program, "theta"); 
    var scaleMatrix =gl.getUniformLocation(program,'scaleMatrix');

    thetaLoc2 = gl2.getUniformLocation(program2, "theta"); 
    var scaleMatrix2 =gl2.getUniformLocation(program2,'scaleMatrix');

    
    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById( "zoomin" ).onclick = function () {
        var newformMatrix = new Float32Array([
            sX+=0.5 , 0.0 , 0.0 , 0.0 ,
            0.0 , sY+=0.5 , 0.0 , 0.0 ,
            0.0 , 0.0 , sZ+=0.5 , 0.0 ,
            0.0 , 0.0 , 0.0, 1.0 ,
        ]);
        gl.uniformMatrix4fv(scaleMatrix , false , newformMatrix);
        gl2.uniformMatrix4fv(scaleMatrix2 , false , newformMatrix);
    };

    document.getElementById( "zoomout" ).onclick = function () {
        var newformMatrix = new Float32Array([
            sX-=0.5 , 0.0 , 0.0 , 0.0 ,
            0.0 , sY-=0.5 , 0.0 , 0.0 ,
            0.0 , 0.0 , sZ-=0.5 , 0.0 ,
            0.0 , 0.0 , 0.0, 1.0 ,
        ]);
        gl.uniformMatrix4fv(scaleMatrix , false , newformMatrix);
        gl2.uniformMatrix4fv(scaleMatrix2 , false , newformMatrix);
    };

    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    var formMatrix = new Float32Array([
        sX , 0.0 , 0.0 , 0.0 ,
        0.0 , sY , 0.0 , 0.0 ,
        0.0 , 0.0 , sZ , 0.0 ,
        0.0 , 0.0 , 0.0, 1.0 ,
    ]);

    gl.uniformMatrix4fv(scaleMatrix , false , formMatrix);
    gl2.uniformMatrix4fv(scaleMatrix2 , false , formMatrix);
    move("gl-canvas");
    move("gl-canvas");
    render();
}

function move(id){
    var element=document.getElementById("gl-canvas");
    element.style.position="absolute";
    element.onmousedown = function(){
        dragvalue=element
    }
}

document.onmousemove=function(e){
    var x=e.pageX;
    var y=e.pageY;
    dragvalue.style.left=x+20+"px";
    dragvalue.style.top=y-100+"px";
}

document.onmouseup=function(e){
    dragvalue=null;
}



function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5,  0.5,  0.5, 1.0 ),
        vec4(  0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5,  0.5, -0.5, 1.0 ),
        vec4(  0.5, -0.5, -0.5, 1.0 )
    ];

    var vertexColors = [
        [ 0.5, 0.5, 0.5, 1.0 ],  //0
        [ 0.75, 0.25, 0.5, 1.0 ],  //1
        [ 0.25, 0.25, 0.75, 1.0 ],  //2
        [ 1.0, 0.0, 0.15, 1.0 ],  //3
        [  0.0, 1.0, 0.15, 1.0 ],  //4
        [ 0.5, 0.5, 1.0,1.0],  //5
        [ 0.0,  0.57,0.5,1.0 ], //6 
        [ 1.0, 1.0, 1.0, 1.0 ]   //7
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
    
        colors.push(vertexColors[a]);
        
    }
}



function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl2.clear( gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 5; 
    theta[axis] %=360;
    gl.uniform3fv(thetaLoc, theta);
    gl2.uniform3fv(thetaLoc2, theta)
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    gl2.drawArrays( gl2.TRIANGLES, 0, NumVertices );

    requestAnimFrame( render );
}

