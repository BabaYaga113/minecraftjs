import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';
import { Player } from '../entities/Player.js';
import { World } from '../world/World.js';
import { ChunkManager } from '../world/ChunkManager.js';
import { BlockRegistry } from '../blocks/BlockRegistry.js';
import { GameLogic } from '../logic/GameLogic.js';

export class Game {
    constructor(app, options) {
        this.app = app;
        this.options = options;
        
        // Core systems
        this.renderer = null;
        this.inputManager = null;
        this.world = null;
        this.chunkManager = null;
        this.player = null;
        this.gameLogic = null;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Performance tracking
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
    }

    async init() {
        console.log('Initializing game systems...');
        
        // Initialize block registry first
        BlockRegistry.init();
        
        // Initialize renderer
        this.renderer = new Renderer();
        await this.renderer.init();
        
        // Initialize input manager
        this.inputManager = new InputManager(this);
        
        // Initialize world and chunk manager
        this.world = new World(this.options.seed);
        this.chunkManager = new ChunkManager(this.world, this.renderer);
        
        // Initialize player
        this.player = new Player(this, this.options.gameMode);
        
        // Initialize game logic
        this.gameLogic = new GameLogic(this, this.options.gameMode);
        
        console.log('Game systems initialized successfully');
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // Start the game loop
        this.gameLoop();
        
        // Start chunk loading around player
        this.chunkManager.updatePlayerPosition(this.player.position);
        
        console.log('Game started');
    }

    pause() {
        this.isPaused = true;
        this.inputManager.setPointerLock(false);
    }

    resume() {
        this.isPaused = false;
        this.inputManager.setPointerLock(true);
        this.lastTime = performance.now();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(this.deltaTime);
            this.render();
        }
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update player
        this.player.update(deltaTime);
        
        // Update chunk manager
        this.chunkManager.update(deltaTime);
        
        // Update game logic
        this.gameLogic.update(deltaTime);
        
        // Update world (mobs, physics, etc.)
        this.world.update(deltaTime);
        
        // Update UI coordinates
        this.updateCoordinatesDisplay();
    }

    render() {
        this.renderer.render(this.player.camera, this.chunkManager.getVisibleChunks());
    }

    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            
            // Update FPS display if needed
            // console.log(`FPS: ${this.fps}`);
        }
    }

    updateCoordinatesDisplay() {
        const coords = document.getElementById('coords-text');
        if (coords) {
            const pos = this.player.position;
            coords.textContent = `X: ${Math.floor(pos.x)}, Y: ${Math.floor(pos.y)}, Z: ${Math.floor(pos.z)}`;
        }
    }

    // Block interaction methods
    placeBlock(blockType, position) {
        if (this.world.setBlock(position.x, position.y, position.z, blockType)) {
            this.chunkManager.markChunkForUpdate(position);
            return true;
        }
        return false;
    }

    removeBlock(position) {
        const blockType = this.world.getBlock(position.x, position.y, position.z);
        if (blockType !== 0) {
            this.world.setBlock(position.x, position.y, position.z, 0);
            this.chunkManager.markChunkForUpdate(position);
            
            // Add block to player inventory if in survival mode
            if (this.options.gameMode === 'survival') {
                this.player.inventory.addItem(blockType, 1);
            }
            
            return blockType;
        }
        return null;
    }

    getBlockAt(position) {
        return this.world.getBlock(position.x, position.y, position.z);
    }

    // Raycast for block selection
    raycastBlocks(origin, direction, maxDistance = 10) {
        const step = 0.1;
        const steps = Math.floor(maxDistance / step);
        
        for (let i = 0; i < steps; i++) {
            const distance = i * step;
            const x = Math.floor(origin.x + direction.x * distance);
            const y = Math.floor(origin.y + direction.y * distance);
            const z = Math.floor(origin.z + direction.z * distance);
            
            const blockType = this.world.getBlock(x, y, z);
            if (blockType !== 0) {
                return {
                    hit: true,
                    position: { x, y, z },
                    blockType,
                    distance
                };
            }
        }
        
        return { hit: false };
    }

    // Save/Load methods
    saveWorld() {
        const worldData = {
            name: this.options.worldName,
            seed: this.options.seed,
            gameMode: this.options.gameMode,
            playerData: this.player.serialize(),
            worldData: this.world.serialize(),
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(`voxelcraft_world_${this.options.worldName}`, JSON.stringify(worldData));
            console.log('World saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save world:', error);
            return false;
        }
    }

    loadWorld(worldName) {
        try {
            const worldData = JSON.parse(localStorage.getItem(`voxelcraft_world_${worldName}`));
            if (worldData) {
                this.player.deserialize(worldData.playerData);
                this.world.deserialize(worldData.worldData);
                console.log('World loaded successfully');
                return true;
            }
        } catch (error) {
            console.error('Failed to load world:', error);
        }
        return false;
    }

    destroy() {
        this.isRunning = false;
        
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.chunkManager) {
            this.chunkManager.destroy();
        }
        
        console.log('Game destroyed');
    }
}