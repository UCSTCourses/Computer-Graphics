"use strict";

/**
 * sphere.js - Full mouse control for camera
 * FIXED VERSION - Camera matrices are sent to shader
 */

// ==================== Global Variables ====================

let canvas;
let gl;
let program;

// Sphere data
let spherePoints = [];
let sphereTexCoords = [];
let numVertices = 0;

// Rotation control
let axis = 1;
const X_AXIS = 0, Y_AXIS = 1, Z_AXIS = 2;
let theta = [30, 30, 30];
let isRotating = true;
let speed = 2.0;

// Sphere movement
let spherePos = [0.0, 0.0, 0.0];
let velocity = [0.03, 0.02, 0.01];
let boundary = 1.5;

// Camera control - MOUSE CONTROLLED
let cameraRotationX = 0;
let cameraRotationY = 0.3;
let cameraDistance = 4.0;

// Mouse interaction
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseSensitivity = 0.005;

// Uniform locations
let thetaLoc, spherePosLoc;
let modelViewMatrixLoc, projectionMatrixLoc;

// ==================== Sphere Creation ====================

function createSphere(radius, slices, stacks) {
    spherePoints = [];
    sphereTexCoords = [];
    
    for (let i = 0; i < stacks; i++) {
        const phi1 = (i / stacks) * Math.PI;
        const phi2 = ((i + 1) / stacks) * Math.PI;
        
        for (let j = 0; j < slices; j++) {
            const theta1 = (j / slices) * 2 * Math.PI;
            const theta2 = ((j + 1) / slices) * 2 * Math.PI;
            
            const p1 = vec4(
                radius * Math.sin(phi1) * Math.cos(theta1),
                radius * Math.cos(phi1),
                radius * Math.sin(phi1) * Math.sin(theta1),
                1.0
            );
            
            const p2 = vec4(
                radius * Math.sin(phi1) * Math.cos(theta2),
                radius * Math.cos(phi1),
                radius * Math.sin(phi1) * Math.sin(theta2),
                1.0
            );
            
            const p3 = vec4(
                radius * Math.sin(phi2) * Math.cos(theta2),
                radius * Math.cos(phi2),
                radius * Math.sin(phi2) * Math.sin(theta2),
                1.0
            );
            
            const p4 = vec4(
                radius * Math.sin(phi2) * Math.cos(theta1),
                radius * Math.cos(phi2),
                radius * Math.sin(phi2) * Math.sin(theta1),
                1.0
            );
            
            const t1 = vec2(j / slices, i / stacks);
            const t2 = vec2((j + 1) / slices, i / stacks);
            const t3 = vec2((j + 1) / slices, (i + 1) / stacks);
            const t4 = vec2(j / slices, (i + 1) / stacks);
            
            spherePoints.push(p1, p2, p3);
            sphereTexCoords.push(t1, t2, t3);
            
            spherePoints.push(p1, p3, p4);
            sphereTexCoords.push(t1, t3, t4);
        }
    }
    
    numVertices = spherePoints.length;
    console.log("Sphere created with", numVertices, "vertices");
}

// ==================== WebGL Initialization ====================

function initWebGL() {
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL is not supported");
        return false;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    return true;
}

// ==================== Shaders and Buffers ====================

function initShadersAndBuffers() {
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    if (!program) {
        alert("Failed to initialize shaders");
        return false;
    }
    
    gl.useProgram(program);
    
    // Create sphere
    createSphere(1.0, 30, 30);
    
    // ===== Position buffer =====
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(spherePoints), gl.STATIC_DRAW);
    
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    // ===== Texture coordinate buffer =====
    const tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereTexCoords), gl.STATIC_DRAW);
    
    const vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
    
    // ===== Uniform locations =====
    thetaLoc = gl.getUniformLocation(program, "theta");
    spherePosLoc = gl.getUniformLocation(program, "spherePos");
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
    console.log("Uniform locations:", {
        theta: thetaLoc,
        spherePos: spherePosLoc,
        modelView: modelViewMatrixLoc,
        projection: projectionMatrixLoc
    });
    
    return true;
}

// ==================== Mouse Controls ====================

function setupMouseControls() {
    canvas.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        cameraRotationX += deltaX * mouseSensitivity;
        cameraRotationY += deltaY * mouseSensitivity;
        
        cameraRotationY = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, cameraRotationY));
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        e.preventDefault();
    });

    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isMouseDown = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraDistance += e.deltaY * 0.001;
        cameraDistance = Math.max(2.0, Math.min(8.0, cameraDistance));
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// ==================== Camera Matrix Calculation ====================

function getViewMatrix() {
    // Calculate camera position using spherical coordinates
    const camX = cameraDistance * Math.sin(cameraRotationX) * Math.cos(cameraRotationY);
    const camY = cameraDistance * Math.sin(cameraRotationY);
    const camZ = cameraDistance * Math.cos(cameraRotationX) * Math.cos(cameraRotationY);
    
    const eye = [camX, camY, camZ];
    const at = spherePos;
    const up = [0, 1, 0];
    
    return lookAt(eye, at, up);
}

// ==================== UI Controls ====================

function setupControls() {
    document.getElementById("xButton").onclick = () => {
        axis = X_AXIS;
        document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        document.getElementById("xButton").classList.add('active');
    };
    
    document.getElementById("yButton").onclick = () => {
        axis = Y_AXIS;
        document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        document.getElementById("yButton").classList.add('active');
    };
    
    document.getElementById("zButton").onclick = () => {
        axis = Z_AXIS;
        document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        document.getElementById("zButton").classList.add('active');
    };
    
    document.getElementById("toggleBtn").onclick = () => {
        isRotating = !isRotating;
        const btn = document.getElementById("toggleBtn");
        btn.innerHTML = isRotating ? '⏸️ Pause' : '▶️ Play';
    };
    
    document.getElementById("speedSlider").oninput = (e) => {
        speed = parseFloat(e.target.value);
        document.getElementById("speedValue").innerHTML = speed.toFixed(1);
    };
    
    // Add instruction overlay
    const instruction = document.createElement('div');
    instruction.className = 'instruction';
    instruction.innerHTML = '🖱️ Drag to rotate view | Scroll to zoom';
    document.body.appendChild(instruction);
    
    // Setup mouse controls
    setupMouseControls();
}

// ==================== Update Functions ====================

function updateSphereMovement() {
    if (!isRotating) return;
    
    spherePos[0] += velocity[0] * speed * 0.5;
    spherePos[1] += velocity[1] * speed * 0.5;
    spherePos[2] += velocity[2] * speed * 0.5;
    
    let bounced = false;
    
    for (let i = 0; i < 3; i++) {
        if (Math.abs(spherePos[i]) > boundary) {
            velocity[i] = -velocity[i];
            bounced = true;
        }
    }
    
    if (bounced) {
        document.getElementById('status').style.color = '#e53e3e';
        setTimeout(() => document.getElementById('status').style.color = '#27ae60', 100);
    }
    
    theta[axis] += 0.5 * speed;
    for (let i = 0; i < 3; i++) {
        if (theta[i] > 360) theta[i] -= 360;
    }
}

// ==================== Render Loop ====================

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    updateSphereMovement();
    
    // ===== CAMERA MATRICES - THIS IS THE KEY PART =====
    
    // 1. Projection matrix (perspective)
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = perspective(45, aspect, 0.1, 20.0);
    
    // 2. View matrix (camera position and orientation)
    const viewMatrix = getViewMatrix();
    
    // 3. Model matrix (sphere's own transformation)
    // Since sphere is already positioned by spherePos in shader,
    // we only need view and projection here
    const modelViewMatrix = viewMatrix;
    
    // Send matrices to shader
    if (projectionMatrixLoc) {
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    }
    
    if (modelViewMatrixLoc) {
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    }
    
    // Send sphere data to shader
    if (thetaLoc) gl.uniform3fv(thetaLoc, theta);
    if (spherePosLoc) gl.uniform3fv(spherePosLoc, spherePos);
    
    // Draw the sphere
    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    
    requestAnimationFrame(render);
}

// ==================== Window Resize ====================

window.addEventListener('resize', () => {
    if (!canvas || !gl) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
});

// ==================== Initialization ====================

window.onload = () => {
    console.log("Starting initialization...");
    
    if (!initWebGL()) {
        alert("Failed to initialize WebGL");
        return;
    }
    
    if (!initShadersAndBuffers()) {
        alert("Failed to initialize shaders and buffers");
        return;
    }
    
    setupControls();
    
    document.getElementById('status').innerHTML = '⚡ Drag mouse to rotate camera';
    console.log("✅ Ready - Mouse control active");
    
    render();
};