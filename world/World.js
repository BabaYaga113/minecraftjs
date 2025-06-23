import { TerrainGenerator } from './TerrainGenerator.js';
import { BlockRegistry } from '../blocks/BlockRegistry.js';

export class World {
    constructor(seed) {
        this.seed = seed || Math.random().toString(36).substring(7);
        this.chunks = new Map();
        this.terrainGenerator = new TerrainGenerator(this.seed);
        
        // World settings
        this.chunkSize = 16;
        this.worldHeight = 256;
        this.seaLevel = 64;
        
        // Time system
        this.timeOfDay = 0.25; // Start at dawn
        this.dayLength = 20 * 60; // 20 minutes per day
        this.timeSpeed = 1.0;
        
        // Entities and mobs
        this.entities = [];
        this.mobs = [];
        
        console.log(`World created with seed: ${this.seed}`);
    }

    // Chunk management
    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    getChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        return this.chunks.get(key);
    }

    setChunk(chunkX, chunkZ, chunk) {
        const key = this.getChunkKey(chunkX, chunkZ);
        this.chunks.set(key, chunk);
    }

    hasChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        return this.chunks.has(key);
    }

    generateChunk(chunkX, chunkZ) {
        if (this.hasChunk(chunkX, chunkZ)) {
            return this.getChunk(chunkX, chunkZ);
        }

        const chunk = this.terrainGenerator.generateChunk(chunkX, chunkZ, this.chunkSize, this.worldHeight);
        this.setChunk(chunkX, chunkZ, chunk);
        
        return chunk;
    }

    // Block access methods
    worldToChunkCoords(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        
        return { chunkX, chunkZ, localX, localY: y, localZ };
    }

    getBlock(x, y, z) {
        // Bounds checking
        if (y < 0 || y >= this.worldHeight) {
            return y < 0 ? BlockRegistry.blockTypes.BEDROCK : BlockRegistry.blockTypes.AIR;
        }

        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunkX, coords.chunkZ);
        
        if (!chunk) {
            // Generate chunk if it doesn't exist
            const newChunk = this.generateChunk(coords.chunkX, coords.chunkZ);
            return newChunk.getBlock(coords.localX, coords.localY, coords.localZ);
        }

        return chunk.getBlock(coords.localX, coords.localY, coords.localZ);
    }

    setBlock(x, y, z, blockType) {
        // Bounds checking
        if (y < 0 || y >= this.worldHeight) {
            return false;
        }

        const coords = this.worldToChunkCoords(x, y, z);
        let chunk = this.getChunk(coords.chunkX, coords.chunkZ);
        
        if (!chunk) {
            chunk = this.generateChunk(coords.chunkX, coords.chunkZ);
        }

        const success = chunk.setBlock(coords.localX, coords.localY, coords.localZ, blockType);
        
        if (success) {
            // Mark chunk as modified
            chunk.modified = true;
            
            // Check if we need to update neighboring chunks
            this.checkNeighborChunkUpdates(coords.chunkX, coords.chunkZ, coords.localX, coords.localZ);
        }

        return success;
    }

    checkNeighborChunkUpdates(chunkX, chunkZ, localX, localZ) {
        // If block is on chunk boundary, mark neighboring chunks for update
        const neighbors = [];
        
        if (localX === 0) neighbors.push({ x: chunkX - 1, z: chunkZ });
        if (localX === this.chunkSize - 1) neighbors.push({ x: chunkX + 1, z: chunkZ });
        if (localZ === 0) neighbors.push({ x: chunkX, z: chunkZ - 1 });
        if (localZ === this.chunkSize - 1) neighbors.push({ x: chunkX, z: chunkZ + 1 });
        
        for (const neighbor of neighbors) {
            const neighborChunk = this.getChunk(neighbor.x, neighbor.z);
            if (neighborChunk) {
                neighborChunk.needsUpdate = true;
            }
        }
    }

    // Physics and updates
    update(deltaTime) {
        // Update time of day
        this.updateTimeOfDay(deltaTime);
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Update mobs
        this.updateMobs(deltaTime);
        
        // Process block updates (falling blocks, water flow, etc.)
        this.processBlockUpdates(deltaTime);
    }

    updateTimeOfDay(deltaTime) {
        this.timeOfDay += (deltaTime * this.timeSpeed) / this.dayLength;
        if (this.timeOfDay >= 1.0) {
            this.timeOfDay -= 1.0;
        }
    }

    updateEntities(deltaTime) {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(deltaTime);
            
            // Remove dead entities
            if (entity.isDead) {
                this.entities.splice(i, 1);
            }
        }
    }

    updateMobs(deltaTime) {
        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];
            mob.update(deltaTime);
            
            // Remove dead mobs
            if (mob.isDead) {
                this.mobs.splice(i, 1);
            }
        }
    }

    processBlockUpdates(deltaTime) {
        // Process falling blocks
        this.processFallingBlocks();
        
        // Process fluid flow
        this.processFluidFlow();
    }

    processFallingBlocks() {
        // Simple gravity simulation for sand and gravel
        const chunksToCheck = Array.from(this.chunks.values()).filter(chunk => chunk.modified);
        
        for (const chunk of chunksToCheck) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    for (let y = this.worldHeight - 2; y >= 0; y--) {
                        const blockType = chunk.getBlock(x, y, z);
                        
                        if (BlockRegistry.hasGravity(blockType)) {
                            const belowType = chunk.getBlock(x, y - 1, z);
                            
                            if (belowType === BlockRegistry.blockTypes.AIR) {
                                // Make block fall
                                chunk.setBlock(x, y, z, BlockRegistry.blockTypes.AIR);
                                chunk.setBlock(x, y - 1, z, blockType);
                            }
                        }
                    }
                }
            }
        }
    }

    processFluidFlow() {
        // Simple fluid flow simulation
        // This is a basic implementation - real Minecraft has much more complex fluid physics
        const chunksToCheck = Array.from(this.chunks.values()).filter(chunk => chunk.modified);
        
        for (const chunk of chunksToCheck) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    for (let y = 1; y < this.worldHeight - 1; y++) {
                        const blockType = chunk.getBlock(x, y, z);
                        
                        if (BlockRegistry.isFluid(blockType)) {
                            // Try to flow down
                            const belowType = chunk.getBlock(x, y - 1, z);
                            if (belowType === BlockRegistry.blockTypes.AIR) {
                                chunk.setBlock(x, y - 1, z, blockType);
                                continue;
                            }
                            
                            // Try to flow horizontally
                            const directions = [
                                { dx: 1, dz: 0 },
                                { dx: -1, dz: 0 },
                                { dx: 0, dz: 1 },
                                { dx: 0, dz: -1 }
                            ];
                            
                            for (const dir of directions) {
                                const nx = x + dir.dx;
                                const nz = z + dir.dz;
                                
                                if (nx >= 0 && nx < this.chunkSize && nz >= 0 && nz < this.chunkSize) {
                                    const neighborType = chunk.getBlock(nx, y, nz);
                                    if (neighborType === BlockRegistry.blockTypes.AIR) {
                                        chunk.setBlock(nx, y, nz, blockType);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Biome and structure generation
    getBiome(x, z) {
        return this.terrainGenerator.getBiome(x, z);
    }

    // Raycast for block selection
    raycast(origin, direction, maxDistance = 10) {
        const step = 0.1;
        const steps = Math.floor(maxDistance / step);
        
        for (let i = 0; i < steps; i++) {
            const distance = i * step;
            const x = Math.floor(origin.x + direction.x * distance);
            const y = Math.floor(origin.y + direction.y * distance);
            const z = Math.floor(origin.z + direction.z * distance);
            
            const blockType = this.getBlock(x, y, z);
            if (blockType !== BlockRegistry.blockTypes.AIR && BlockRegistry.isBlockSolid(blockType)) {
                // Calculate the face that was hit
                const prevX = Math.floor(origin.x + direction.x * (distance - step));
                const prevY = Math.floor(origin.y + direction.y * (distance - step));
                const prevZ = Math.floor(origin.z + direction.z * (distance - step));
                
                let face = 'top';
                if (prevY < y) face = 'bottom';
                else if (prevY > y) face = 'top';
                else if (prevX < x) face = 'west';
                else if (prevX > x) face = 'east';
                else if (prevZ < z) face = 'north';
                else if (prevZ > z) face = 'south';
                
                return {
                    hit: true,
                    position: { x, y, z },
                    blockType,
                    distance,
                    face,
                    adjacent: { x: prevX, y: prevY, z: prevZ }
                };
            }
        }
        
        return { hit: false };
    }

    // Save/Load methods
    serialize() {
        const data = {
            seed: this.seed,
            timeOfDay: this.timeOfDay,
            chunks: {}
        };
        
        // Only save modified chunks
        for (const [key, chunk] of this.chunks) {
            if (chunk.modified) {
                data.chunks[key] = chunk.serialize();
            }
        }
        
        return data;
    }

    deserialize(data) {
        this.seed = data.seed;
        this.timeOfDay = data.timeOfDay || 0.25;
        
        // Load chunks
        for (const [key, chunkData] of Object.entries(data.chunks)) {
            const [chunkX, chunkZ] = key.split(',').map(Number);
            const chunk = this.terrainGenerator.createEmptyChunk(chunkX, chunkZ, this.chunkSize, this.worldHeight);
            chunk.deserialize(chunkData);
            this.setChunk(chunkX, chunkZ, chunk);
        }
    }

    // Utility methods
    getSpawnPoint() {
        // Find a safe spawn point
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Math.floor(Math.random() * 100) - 50;
            const z = Math.floor(Math.random() * 100) - 50;
            
            // Find the highest solid block
            for (let y = this.worldHeight - 1; y >= 0; y--) {
                const blockType = this.getBlock(x, y, z);
                if (BlockRegistry.isBlockSolid(blockType)) {
                    // Check if there's space above for the player
                    const above1 = this.getBlock(x, y + 1, z);
                    const above2 = this.getBlock(x, y + 2, z);
                    
                    if (above1 === BlockRegistry.blockTypes.AIR && above2 === BlockRegistry.blockTypes.AIR) {
                        return { x: x + 0.5, y: y + 1, z: z + 0.5 };
                    }
                    break;
                }
            }
        }
        
        // Fallback spawn point
        return { x: 0.5, y: 100, z: 0.5 };
    }

    getTimeOfDay() {
        return this.timeOfDay;
    }

    isDay() {
        return this.timeOfDay > 0.25 && this.timeOfDay < 0.75;
    }

    isNight() {
        return !this.isDay();
    }
}