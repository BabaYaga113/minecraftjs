import { ChunkMeshBuilder } from './ChunkMeshBuilder.js';

export class ChunkManager {
    constructor(world, renderer) {
        this.world = world;
        this.renderer = renderer;
        this.meshBuilder = new ChunkMeshBuilder(renderer.getTextureAtlas());
        
        // Chunk loading settings
        this.renderDistance = 8; // chunks
        this.loadDistance = this.renderDistance + 2;
        this.unloadDistance = this.loadDistance + 4;
        
        // Player position tracking
        this.playerChunkX = 0;
        this.playerChunkZ = 0;
        this.lastPlayerChunkX = null;
        this.lastPlayerChunkZ = null;
        
        // Chunk management
        this.loadedChunks = new Map();
        this.chunkMeshes = new Map();
        this.chunksToUpdate = new Set();
        this.chunksToGenerate = new Set();
        
        // Performance settings
        this.maxChunksPerFrame = 2;
        this.maxMeshUpdatesPerFrame = 4;
        
        // Worker for background chunk generation
        this.useWorkers = false; // Disabled for now, can be enabled later
        this.workers = [];
        
        console.log('ChunkManager initialized');
    }

    updatePlayerPosition(playerPosition) {
        const newChunkX = Math.floor(playerPosition.x / this.world.chunkSize);
        const newChunkZ = Math.floor(playerPosition.z / this.world.chunkSize);
        
        if (newChunkX !== this.playerChunkX || newChunkZ !== this.playerChunkZ) {
            this.lastPlayerChunkX = this.playerChunkX;
            this.lastPlayerChunkZ = this.playerChunkZ;
            this.playerChunkX = newChunkX;
            this.playerChunkZ = newChunkZ;
            
            // Update chunk loading
            this.updateChunkLoading();
        }
    }

    updateChunkLoading() {
        // Determine which chunks should be loaded
        const chunksToLoad = new Set();
        const chunksToUnload = new Set();
        
        // Find chunks that should be loaded
        for (let dx = -this.loadDistance; dx <= this.loadDistance; dx++) {
            for (let dz = -this.loadDistance; dz <= this.loadDistance; dz++) {
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance <= this.loadDistance) {
                    const chunkX = this.playerChunkX + dx;
                    const chunkZ = this.playerChunkZ + dz;
                    const key = this.getChunkKey(chunkX, chunkZ);
                    
                    if (!this.loadedChunks.has(key)) {
                        chunksToLoad.add({ x: chunkX, z: chunkZ, distance });
                    }
                }
            }
        }
        
        // Find chunks that should be unloaded
        for (const [key, chunk] of this.loadedChunks) {
            const dx = chunk.chunkX - this.playerChunkX;
            const dz = chunk.chunkZ - this.playerChunkZ;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > this.unloadDistance) {
                chunksToUnload.add(key);
            }
        }
        
        // Sort chunks to load by distance (closest first)
        const sortedChunksToLoad = Array.from(chunksToLoad).sort((a, b) => a.distance - b.distance);
        
        // Add to generation queue
        for (const chunkInfo of sortedChunksToLoad) {
            this.chunksToGenerate.add(`${chunkInfo.x},${chunkInfo.z}`);
        }
        
        // Unload distant chunks
        for (const key of chunksToUnload) {
            this.unloadChunk(key);
        }
    }

    update(deltaTime) {
        // Generate chunks
        this.generateChunks();
        
        // Update chunk meshes
        this.updateChunkMeshes();
        
        // Clean up old meshes
        this.cleanupMeshes();
    }

    generateChunks() {
        let chunksGenerated = 0;
        const chunksToGenerate = Array.from(this.chunksToGenerate);
        
        for (const chunkKey of chunksToGenerate) {
            if (chunksGenerated >= this.maxChunksPerFrame) {
                break;
            }
            
            const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
            
            if (!this.loadedChunks.has(chunkKey)) {
                const chunk = this.world.generateChunk(chunkX, chunkZ);
                this.loadedChunks.set(chunkKey, chunk);
                this.chunksToUpdate.add(chunkKey);
                chunksGenerated++;
            }
            
            this.chunksToGenerate.delete(chunkKey);
        }
    }

    updateChunkMeshes() {
        let meshesUpdated = 0;
        const chunksToUpdate = Array.from(this.chunksToUpdate);
        
        for (const chunkKey of chunksToUpdate) {
            if (meshesUpdated >= this.maxMeshUpdatesPerFrame) {
                break;
            }
            
            const chunk = this.loadedChunks.get(chunkKey);
            if (chunk && chunk.needsUpdate) {
                this.updateChunkMesh(chunk);
                chunk.needsUpdate = false;
                meshesUpdated++;
            }
            
            this.chunksToUpdate.delete(chunkKey);
        }
    }

    updateChunkMesh(chunk) {
        const chunkKey = this.getChunkKey(chunk.chunkX, chunk.chunkZ);
        
        // Remove old mesh if it exists
        const oldMesh = this.chunkMeshes.get(chunkKey);
        if (oldMesh) {
            this.renderer.removeChunkMesh(oldMesh);
            this.chunkMeshes.delete(chunkKey);
        }
        
        // Generate new mesh
        const mesh = this.meshBuilder.buildChunkMesh(chunk, this.world);
        if (mesh) {
            this.chunkMeshes.set(chunkKey, mesh);
            this.renderer.addChunkMesh(mesh);
            chunk.mesh = mesh;
        }
    }

    markChunkForUpdate(position) {
        const chunkX = Math.floor(position.x / this.world.chunkSize);
        const chunkZ = Math.floor(position.z / this.world.chunkSize);
        const chunkKey = this.getChunkKey(chunkX, chunkZ);
        
        const chunk = this.loadedChunks.get(chunkKey);
        if (chunk) {
            chunk.needsUpdate = true;
            this.chunksToUpdate.add(chunkKey);
        }
        
        // Also mark neighboring chunks if the block is on a boundary
        const localX = ((position.x % this.world.chunkSize) + this.world.chunkSize) % this.world.chunkSize;
        const localZ = ((position.z % this.world.chunkSize) + this.world.chunkSize) % this.world.chunkSize;
        
        const neighbors = [];
        if (localX === 0) neighbors.push({ x: chunkX - 1, z: chunkZ });
        if (localX === this.world.chunkSize - 1) neighbors.push({ x: chunkX + 1, z: chunkZ });
        if (localZ === 0) neighbors.push({ x: chunkX, z: chunkZ - 1 });
        if (localZ === this.world.chunkSize - 1) neighbors.push({ x: chunkX, z: chunkZ + 1 });
        
        for (const neighbor of neighbors) {
            const neighborKey = this.getChunkKey(neighbor.x, neighbor.z);
            const neighborChunk = this.loadedChunks.get(neighborKey);
            if (neighborChunk) {
                neighborChunk.needsUpdate = true;
                this.chunksToUpdate.add(neighborKey);
            }
        }
    }

    unloadChunk(chunkKey) {
        const chunk = this.loadedChunks.get(chunkKey);
        if (chunk) {
            // Remove mesh
            const mesh = this.chunkMeshes.get(chunkKey);
            if (mesh) {
                this.renderer.removeChunkMesh(mesh);
                this.chunkMeshes.delete(chunkKey);
            }
            
            // Save chunk if modified
            if (chunk.modified) {
                // Chunk will be saved when world is saved
            }
            
            // Remove from loaded chunks
            this.loadedChunks.delete(chunkKey);
            
            // Clean up chunk resources
            chunk.dispose();
        }
    }

    cleanupMeshes() {
        // Remove meshes for chunks that are no longer loaded
        const meshesToRemove = [];
        
        for (const [chunkKey, mesh] of this.chunkMeshes) {
            if (!this.loadedChunks.has(chunkKey)) {
                meshesToRemove.push(chunkKey);
            }
        }
        
        for (const chunkKey of meshesToRemove) {
            const mesh = this.chunkMeshes.get(chunkKey);
            if (mesh) {
                this.renderer.removeChunkMesh(mesh);
                this.chunkMeshes.delete(chunkKey);
            }
        }
    }

    getVisibleChunks() {
        const visibleChunks = [];
        
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance <= this.renderDistance) {
                    const chunkX = this.playerChunkX + dx;
                    const chunkZ = this.playerChunkZ + dz;
                    const chunkKey = this.getChunkKey(chunkX, chunkZ);
                    
                    const chunk = this.loadedChunks.get(chunkKey);
                    if (chunk) {
                        visibleChunks.push(chunk);
                    }
                }
            }
        }
        
        return visibleChunks;
    }

    getChunkAt(worldX, worldZ) {
        const chunkX = Math.floor(worldX / this.world.chunkSize);
        const chunkZ = Math.floor(worldZ / this.world.chunkSize);
        const chunkKey = this.getChunkKey(chunkX, chunkZ);
        
        return this.loadedChunks.get(chunkKey);
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    // Performance monitoring
    getLoadedChunkCount() {
        return this.loadedChunks.size;
    }

    getMeshCount() {
        return this.chunkMeshes.size;
    }

    getGenerationQueueSize() {
        return this.chunksToGenerate.size;
    }

    getUpdateQueueSize() {
        return this.chunksToUpdate.size;
    }

    // Settings
    setRenderDistance(distance) {
        this.renderDistance = Math.max(2, Math.min(16, distance));
        this.loadDistance = this.renderDistance + 2;
        this.unloadDistance = this.loadDistance + 4;
        
        // Trigger chunk loading update
        this.updateChunkLoading();
    }

    getRenderDistance() {
        return this.renderDistance;
    }

    // Cleanup
    destroy() {
        // Unload all chunks
        for (const chunkKey of this.loadedChunks.keys()) {
            this.unloadChunk(chunkKey);
        }
        
        // Clear all data structures
        this.loadedChunks.clear();
        this.chunkMeshes.clear();
        this.chunksToUpdate.clear();
        this.chunksToGenerate.clear();
        
        // Cleanup workers if used
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
        
        console.log('ChunkManager destroyed');
    }
}