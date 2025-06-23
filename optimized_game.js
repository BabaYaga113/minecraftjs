// VoxelCraftJS - Optimized Version
// High-performance Minecraft-like game

class OptimizedVoxelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameMode = 'creative'; // creative, survival
        
        // Performance tracking
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        this.lastFpsUpdate = 0;
        
        // Player
        this.player = {
            position: new THREE.Vector3(0, 50, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            isFlying: true,
            isOnGround: false,
            speed: 10,
            flySpeed: 20,
            jumpPower: 12,
            gravity: 30
        };
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
        this.isPointerLocked = false;
        this.mouseSensitivity = 0.002;
        
        // World
        this.chunks = new Map();
        this.chunkSize = 16;
        this.renderDistance = 4; // Much smaller for performance
        this.worldHeight = 64; // Reduced height
        
        // Block types (simplified)
        this.blockTypes = {
            AIR: 0,
            GRASS: 1,
            DIRT: 2,
            STONE: 3,
            WOOD: 4,
            LEAVES: 5,
            SAND: 6,
            WATER: 7
        };
        
        // Selected block
        this.selectedBlock = 1;
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLighting();
        this.setupInput();
        this.setupUI();
        
        // Generate initial chunks
        this.generateInitialWorld();
        
        this.start();
    }
    
    setupRenderer() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false, // Disable for performance
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
        this.renderer.shadowMap.enabled = false; // Disable shadows for performance
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
        this.camera.position.copy(this.player.position);
    }
    
    setupLighting() {
        // Simple lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
    }
    
    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouse.deltaX = e.movementX * this.mouseSensitivity;
                this.mouse.deltaY = e.movementY * this.mouseSensitivity;
                this.updateCameraRotation();
            }
        });
        
        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            if (this.isPointerLocked) {
                if (e.button === 0) { // Left click - break block
                    this.breakBlock();
                } else if (e.button === 2) { // Right click - place block
                    this.placeBlock();
                }
            }
        });
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Mouse wheel for hotbar
        document.addEventListener('wheel', (e) => {
            if (this.isPointerLocked) {
                const direction = e.deltaY > 0 ? 1 : -1;
                this.selectedBlock += direction;
                if (this.selectedBlock > 7) this.selectedBlock = 1;
                if (this.selectedBlock < 1) this.selectedBlock = 7;
                this.updateHotbar();
            }
        });
    }
    
    setupUI() {
        this.updateHotbar();
    }
    
    handleKeyDown(e) {
        switch (e.code) {
            case 'Escape':
                this.togglePause();
                break;
            case 'KeyF':
                this.toggleFly();
                break;
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
                this.selectedBlock = parseInt(e.code.replace('Digit', ''));
                if (this.selectedBlock > 7) this.selectedBlock = 7;
                this.updateHotbar();
                break;
        }
    }
    
    generateInitialWorld() {
        // Generate a small world around spawn
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(x, z);
            }
        }
    }
    
    generateChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) return;
        
        const chunk = this.createChunk(chunkX, chunkZ);
        this.chunks.set(key, chunk);
        
        // Generate terrain
        this.generateTerrain(chunk, chunkX, chunkZ);
        
        // Create mesh
        const mesh = this.createChunkMesh(chunk);
        if (mesh) {
            this.scene.add(mesh);
            chunk.mesh = mesh;
        }
    }
    
    createChunk(chunkX, chunkZ) {
        return {
            x: chunkX,
            z: chunkZ,
            blocks: new Uint8Array(this.chunkSize * this.worldHeight * this.chunkSize),
            mesh: null,
            needsUpdate: false
        };
    }
    
    generateTerrain(chunk, chunkX, chunkZ) {
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;
                
                // Simple height generation
                const height = Math.floor(30 + 10 * Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1));
                
                for (let y = 0; y < this.worldHeight; y++) {
                    let blockType = this.blockTypes.AIR;
                    
                    if (y < height - 3) {
                        blockType = this.blockTypes.STONE;
                    } else if (y < height - 1) {
                        blockType = this.blockTypes.DIRT;
                    } else if (y < height) {
                        blockType = this.blockTypes.GRASS;
                    } else if (y < 25) { // Water level
                        blockType = this.blockTypes.WATER;
                    }
                    
                    this.setBlockInChunk(chunk, x, y, z, blockType);
                }
                
                // Add some trees
                if (Math.random() < 0.02 && height > 25) {
                    this.generateTree(chunk, x, height, z);
                }
            }
        }
    }
    
    generateTree(chunk, x, baseY, z) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        
        // Trunk
        for (let y = 0; y < treeHeight; y++) {
            if (baseY + y < this.worldHeight) {
                this.setBlockInChunk(chunk, x, baseY + y, z, this.blockTypes.WOOD);
            }
        }
        
        // Leaves
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = -1; dy <= 2; dy++) {
                    if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3 && Math.random() < 0.8) {
                        const leafX = x + dx;
                        const leafZ = z + dz;
                        const leafY = baseY + treeHeight + dy;
                        
                        if (leafX >= 0 && leafX < this.chunkSize && 
                            leafZ >= 0 && leafZ < this.chunkSize && 
                            leafY >= 0 && leafY < this.worldHeight) {
                            this.setBlockInChunk(chunk, leafX, leafY, leafZ, this.blockTypes.LEAVES);
                        }
                    }
                }
            }
        }
    }
    
    setBlockInChunk(chunk, x, y, z, blockType) {
        const index = x + y * this.chunkSize + z * this.chunkSize * this.worldHeight;
        chunk.blocks[index] = blockType;
    }
    
    getBlockInChunk(chunk, x, y, z) {
        if (x < 0 || x >= this.chunkSize || y < 0 || y >= this.worldHeight || z < 0 || z >= this.chunkSize) {
            return this.blockTypes.AIR;
        }
        const index = x + y * this.chunkSize + z * this.chunkSize * this.worldHeight;
        return chunk.blocks[index];
    }
    
    createChunkMesh(chunk) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];
        
        let vertexCount = 0;
        
        // Simple block colors
        const blockColors = {
            [this.blockTypes.GRASS]: [0.4, 0.8, 0.4],
            [this.blockTypes.DIRT]: [0.6, 0.4, 0.2],
            [this.blockTypes.STONE]: [0.5, 0.5, 0.5],
            [this.blockTypes.WOOD]: [0.6, 0.3, 0.1],
            [this.blockTypes.LEAVES]: [0.2, 0.6, 0.2],
            [this.blockTypes.SAND]: [0.9, 0.8, 0.6],
            [this.blockTypes.WATER]: [0.2, 0.4, 0.8]
        };
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const blockType = this.getBlockInChunk(chunk, x, y, z);
                    if (blockType === this.blockTypes.AIR) continue;
                    
                    const color = blockColors[blockType] || [1, 0, 1]; // Magenta for unknown
                    
                    // Check each face
                    const faces = [
                        { dir: [0, 1, 0], corners: [[-1,-1,-1], [1,-1,-1], [1,-1,1], [-1,-1,1]] }, // Top
                        { dir: [0, -1, 0], corners: [[-1,1,-1], [-1,1,1], [1,1,1], [1,1,-1]] }, // Bottom
                        { dir: [0, 0, 1], corners: [[-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]] }, // Front
                        { dir: [0, 0, -1], corners: [[1,-1,-1], [-1,-1,-1], [-1,1,-1], [1,1,-1]] }, // Back
                        { dir: [1, 0, 0], corners: [[1,-1,-1], [1,1,-1], [1,1,1], [1,-1,1]] }, // Right
                        { dir: [-1, 0, 0], corners: [[-1,-1,1], [-1,1,1], [-1,1,-1], [-1,-1,-1]] } // Left
                    ];
                    
                    for (const face of faces) {
                        const [dx, dy, dz] = face.dir;
                        const neighborType = this.getBlockInChunk(chunk, x + dx, y + dy, z + dz);
                        
                        if (neighborType === this.blockTypes.AIR || 
                            (blockType === this.blockTypes.WATER && neighborType !== this.blockTypes.WATER)) {
                            
                            // Add face vertices
                            for (const corner of face.corners) {
                                vertices.push(
                                    x + corner[0] * 0.5 + chunk.x * this.chunkSize,
                                    y + corner[1] * 0.5,
                                    z + corner[2] * 0.5 + chunk.z * this.chunkSize
                                );
                                normals.push(...face.dir);
                                colors.push(...color);
                            }
                            
                            // Add face indices
                            indices.push(
                                vertexCount, vertexCount + 1, vertexCount + 2,
                                vertexCount, vertexCount + 2, vertexCount + 3
                            );
                            vertexCount += 4;
                        }
                    }
                }
            }
        }
        
        if (vertices.length === 0) return null;
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true,
            transparent: false
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
            this.render();
        }
        
        this.updateFPS(currentTime);
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateCamera();
        this.updateChunks();
        this.updateUI();
    }
    
    updatePlayer(deltaTime) {
        const movement = new THREE.Vector3();
        
        // Get movement input
        if (this.keys['KeyW']) movement.z -= 1;
        if (this.keys['KeyS']) movement.z += 1;
        if (this.keys['KeyA']) movement.x -= 1;
        if (this.keys['KeyD']) movement.x += 1;
        
        // Apply camera rotation to movement
        movement.applyQuaternion(this.camera.quaternion);
        movement.y = 0; // Keep horizontal
        movement.normalize();
        
        const speed = this.player.isFlying ? this.player.flySpeed : this.player.speed;
        movement.multiplyScalar(speed * deltaTime);
        
        // Vertical movement
        if (this.player.isFlying) {
            if (this.keys['Space']) movement.y += speed * deltaTime;
            if (this.keys['ShiftLeft']) movement.y -= speed * deltaTime;
        } else {
            // Gravity and jumping
            if (this.keys['Space'] && this.player.isOnGround) {
                this.player.velocity.y = this.player.jumpPower;
                this.player.isOnGround = false;
            }
            this.player.velocity.y -= this.player.gravity * deltaTime;
            movement.y = this.player.velocity.y * deltaTime;
        }
        
        // Apply movement
        this.player.position.add(movement);
        
        // Simple ground collision
        if (!this.player.isFlying) {
            const groundY = this.getGroundHeight(this.player.position.x, this.player.position.z);
            if (this.player.position.y <= groundY + 1.8) {
                this.player.position.y = groundY + 1.8;
                this.player.velocity.y = 0;
                this.player.isOnGround = true;
            }
        }
    }
    
    getGroundHeight(x, z) {
        // Simple ground height calculation
        return Math.floor(30 + 10 * Math.sin(x * 0.1) * Math.cos(z * 0.1));
    }
    
    updateCameraRotation() {
        this.player.rotation.y -= this.mouse.deltaX;
        this.player.rotation.x -= this.mouse.deltaY;
        this.player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.player.rotation.x));
        
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    updateCamera() {
        this.camera.position.copy(this.player.position);
        this.camera.rotation.set(this.player.rotation.x, this.player.rotation.y, 0);
    }
    
    updateChunks() {
        // Simple chunk loading based on player position
        const playerChunkX = Math.floor(this.player.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.player.position.z / this.chunkSize);
        
        // Generate missing chunks
        for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
            for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
                const key = `${x},${z}`;
                if (!this.chunks.has(key)) {
                    this.generateChunk(x, z);
                }
            }
        }
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    updateUI() {
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('position').textContent = 
            `${this.player.position.x.toFixed(1)}, ${this.player.position.y.toFixed(1)}, ${this.player.position.z.toFixed(1)}`;
        document.getElementById('chunks').textContent = this.chunks.size;
        document.getElementById('mode').textContent = this.gameMode + (this.player.isFlying ? ' (Flying)' : '');
    }
    
    updateHotbar() {
        const slots = document.querySelectorAll('.hotbar-slot');
        slots.forEach((slot, index) => {
            slot.classList.toggle('selected', index + 1 === this.selectedBlock);
        });
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Block interaction
    raycast() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = raycaster.intersectObjects(this.scene.children);
        return intersects.length > 0 ? intersects[0] : null;
    }
    
    breakBlock() {
        // Simple block breaking - just remove the intersected mesh
        const intersect = this.raycast();
        if (intersect) {
            this.scene.remove(intersect.object);
        }
    }
    
    placeBlock() {
        // Simple block placement
        const intersect = this.raycast();
        if (intersect) {
            const pos = intersect.point.clone();
            pos.add(intersect.face.normal.multiplyScalar(0.5));
            
            // Create a simple block
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const block = new THREE.Mesh(geometry, material);
            
            block.position.set(
                Math.floor(pos.x) + 0.5,
                Math.floor(pos.y) + 0.5,
                Math.floor(pos.z) + 0.5
            );
            
            this.scene.add(block);
        }
    }
    
    // Game controls
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('menu').classList.toggle('hidden', !this.isPaused);
        
        if (this.isPaused) {
            document.exitPointerLock();
        }
    }
    
    toggleFly() {
        this.player.isFlying = !this.player.isFlying;
        this.player.velocity.y = 0;
    }
}

// Global functions for menu
function resumeGame() {
    game.togglePause();
}

function toggleMode() {
    game.gameMode = game.gameMode === 'creative' ? 'survival' : 'creative';
    if (game.gameMode === 'creative') {
        game.player.isFlying = true;
    }
}

function newWorld() {
    // Clear existing world
    game.scene.children.forEach(child => {
        if (child.type === 'Mesh' && child !== game.player.mesh) {
            game.scene.remove(child);
        }
    });
    game.chunks.clear();
    game.player.position.set(0, 50, 0);
    game.generateInitialWorld();
    game.togglePause();
}

// Start the game
const game = new OptimizedVoxelGame();