export class Chunk {
    constructor(chunkX, chunkZ, chunkSize, worldHeight) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.chunkSize = chunkSize;
        this.worldHeight = worldHeight;
        
        // Block data - 3D array [x][y][z]
        this.blocks = new Array(chunkSize);
        for (let x = 0; x < chunkSize; x++) {
            this.blocks[x] = new Array(worldHeight);
            for (let y = 0; y < worldHeight; y++) {
                this.blocks[x][y] = new Array(chunkSize).fill(0); // 0 = air
            }
        }
        
        // Chunk state
        this.generated = false;
        this.modified = false;
        this.needsUpdate = true;
        this.mesh = null;
        
        // Lighting data (simplified)
        this.lightLevels = new Array(chunkSize);
        for (let x = 0; x < chunkSize; x++) {
            this.lightLevels[x] = new Array(worldHeight);
            for (let y = 0; y < worldHeight; y++) {
                this.lightLevels[x][y] = new Array(chunkSize).fill(15); // Max light
            }
        }
    }

    // Block access methods
    getBlock(x, y, z) {
        if (this.isValidPosition(x, y, z)) {
            return this.blocks[x][y][z];
        }
        return 0; // Air for out-of-bounds
    }

    setBlock(x, y, z, blockType) {
        if (this.isValidPosition(x, y, z)) {
            if (this.blocks[x][y][z] !== blockType) {
                this.blocks[x][y][z] = blockType;
                this.modified = true;
                this.needsUpdate = true;
                return true;
            }
        }
        return false;
    }

    isValidPosition(x, y, z) {
        return x >= 0 && x < this.chunkSize &&
               y >= 0 && y < this.worldHeight &&
               z >= 0 && z < this.chunkSize;
    }

    // Lighting methods
    getLightLevel(x, y, z) {
        if (this.isValidPosition(x, y, z)) {
            return this.lightLevels[x][y][z];
        }
        return 0;
    }

    setLightLevel(x, y, z, level) {
        if (this.isValidPosition(x, y, z)) {
            this.lightLevels[x][y][z] = Math.max(0, Math.min(15, level));
        }
    }

    // Calculate basic lighting (simplified)
    calculateLighting() {
        // Reset all light levels
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    this.lightLevels[x][y][z] = 0;
                }
            }
        }

        // Sunlight propagation from top
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                let lightLevel = 15; // Max sunlight
                
                for (let y = this.worldHeight - 1; y >= 0; y--) {
                    const blockType = this.getBlock(x, y, z);
                    
                    if (blockType === 0) { // Air
                        this.setLightLevel(x, y, z, lightLevel);
                    } else {
                        // Block blocks light
                        lightLevel = Math.max(0, lightLevel - 15);
                        this.setLightLevel(x, y, z, lightLevel);
                    }
                }
            }
        }

        // Simple light propagation (very basic)
        for (let pass = 0; pass < 3; pass++) {
            for (let x = 0; x < this.chunkSize; x++) {
                for (let y = 0; y < this.worldHeight; y++) {
                    for (let z = 0; z < this.chunkSize; z++) {
                        const currentLight = this.getLightLevel(x, y, z);
                        
                        // Check neighbors and propagate light
                        const neighbors = [
                            { dx: 1, dy: 0, dz: 0 },
                            { dx: -1, dy: 0, dz: 0 },
                            { dx: 0, dy: 1, dz: 0 },
                            { dx: 0, dy: -1, dz: 0 },
                            { dx: 0, dy: 0, dz: 1 },
                            { dx: 0, dy: 0, dz: -1 }
                        ];
                        
                        for (const neighbor of neighbors) {
                            const nx = x + neighbor.dx;
                            const ny = y + neighbor.dy;
                            const nz = z + neighbor.dz;
                            
                            if (this.isValidPosition(nx, ny, nz)) {
                                const neighborBlock = this.getBlock(nx, ny, nz);
                                const neighborLight = this.getLightLevel(nx, ny, nz);
                                
                                if (neighborBlock === 0 && currentLight > neighborLight + 1) {
                                    this.setLightLevel(nx, ny, nz, currentLight - 1);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Get the highest solid block at given x,z coordinates
    getHeightAt(x, z) {
        if (!this.isValidPosition(x, 0, z)) {
            return -1;
        }

        for (let y = this.worldHeight - 1; y >= 0; y--) {
            const blockType = this.getBlock(x, y, z);
            if (blockType !== 0) {
                return y;
            }
        }
        return -1;
    }

    // Check if chunk is empty (all air)
    isEmpty() {
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    if (this.blocks[x][y][z] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Get all non-air blocks in chunk
    getNonAirBlocks() {
        const blocks = [];
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const blockType = this.blocks[x][y][z];
                    if (blockType !== 0) {
                        blocks.push({
                            x, y, z,
                            type: blockType,
                            worldX: this.chunkX * this.chunkSize + x,
                            worldY: y,
                            worldZ: this.chunkZ * this.chunkSize + z
                        });
                    }
                }
            }
        }
        return blocks;
    }

    // Get blocks in a specific layer
    getLayer(y) {
        if (y < 0 || y >= this.worldHeight) {
            return null;
        }

        const layer = [];
        for (let x = 0; x < this.chunkSize; x++) {
            layer[x] = [];
            for (let z = 0; z < this.chunkSize; z++) {
                layer[x][z] = this.blocks[x][y][z];
            }
        }
        return layer;
    }

    // Fill a region with a specific block type
    fill(x1, y1, z1, x2, y2, z2, blockType) {
        const minX = Math.max(0, Math.min(x1, x2));
        const maxX = Math.min(this.chunkSize - 1, Math.max(x1, x2));
        const minY = Math.max(0, Math.min(y1, y2));
        const maxY = Math.min(this.worldHeight - 1, Math.max(y1, y2));
        const minZ = Math.max(0, Math.min(z1, z2));
        const maxZ = Math.min(this.chunkSize - 1, Math.max(z1, z2));

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    this.setBlock(x, y, z, blockType);
                }
            }
        }
    }

    // Copy blocks from another chunk
    copyFrom(otherChunk, offsetX = 0, offsetY = 0, offsetZ = 0) {
        for (let x = 0; x < this.chunkSize && x + offsetX < otherChunk.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight && y + offsetY < otherChunk.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize && z + offsetZ < otherChunk.chunkSize; z++) {
                    const sourceX = x + offsetX;
                    const sourceY = y + offsetY;
                    const sourceZ = z + offsetZ;
                    
                    if (otherChunk.isValidPosition(sourceX, sourceY, sourceZ)) {
                        const blockType = otherChunk.getBlock(sourceX, sourceY, sourceZ);
                        this.setBlock(x, y, z, blockType);
                    }
                }
            }
        }
    }

    // Serialization for saving/loading
    serialize() {
        const data = {
            chunkX: this.chunkX,
            chunkZ: this.chunkZ,
            chunkSize: this.chunkSize,
            worldHeight: this.worldHeight,
            generated: this.generated,
            modified: this.modified,
            blocks: []
        };

        // Only save non-air blocks to reduce data size
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const blockType = this.blocks[x][y][z];
                    if (blockType !== 0) {
                        data.blocks.push({
                            x, y, z,
                            type: blockType
                        });
                    }
                }
            }
        }

        return data;
    }

    deserialize(data) {
        this.chunkX = data.chunkX;
        this.chunkZ = data.chunkZ;
        this.generated = data.generated;
        this.modified = data.modified;

        // Clear all blocks first
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    this.blocks[x][y][z] = 0;
                }
            }
        }

        // Load saved blocks
        for (const block of data.blocks) {
            if (this.isValidPosition(block.x, block.y, block.z)) {
                this.blocks[block.x][block.y][block.z] = block.type;
            }
        }

        this.needsUpdate = true;
    }

    // Cleanup
    dispose() {
        if (this.mesh) {
            // Dispose of Three.js mesh resources
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
            this.mesh = null;
        }
    }

    // Debug methods
    getBlockCount() {
        let count = 0;
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    if (this.blocks[x][y][z] !== 0) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    getBlockTypeCount(blockType) {
        let count = 0;
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    if (this.blocks[x][y][z] === blockType) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    toString() {
        return `Chunk(${this.chunkX}, ${this.chunkZ}) - ${this.getBlockCount()} blocks`;
    }
}