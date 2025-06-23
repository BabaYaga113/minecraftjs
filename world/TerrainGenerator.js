import { Chunk } from './Chunk.js';
import { BlockRegistry } from '../blocks/BlockRegistry.js';
import { SimplexNoise } from './SimplexNoise.js';

export class TerrainGenerator {
    constructor(seed) {
        this.seed = seed;
        this.seedHash = this.hashSeed(seed);
        
        // Initialize noise generators
        this.heightNoise = new SimplexNoise(this.seedHash);
        this.caveNoise = new SimplexNoise(this.seedHash + 1);
        this.oreNoise = new SimplexNoise(this.seedHash + 2);
        this.biomeNoise = new SimplexNoise(this.seedHash + 3);
        this.treeNoise = new SimplexNoise(this.seedHash + 4);
        
        // Terrain generation settings
        this.baseHeight = 64;
        this.heightVariation = 32;
        this.caveThreshold = 0.6;
        this.oreThreshold = 0.7;
        
        // Biome settings
        this.biomes = {
            PLAINS: { id: 0, name: 'Plains', color: 0x90EE90 },
            FOREST: { id: 1, name: 'Forest', color: 0x228B22 },
            DESERT: { id: 2, name: 'Desert', color: 0xF4A460 },
            MOUNTAINS: { id: 3, name: 'Mountains', color: 0x696969 },
            OCEAN: { id: 4, name: 'Ocean', color: 0x4682B4 }
        };
    }

    hashSeed(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    generateChunk(chunkX, chunkZ, chunkSize, worldHeight) {
        const chunk = new Chunk(chunkX, chunkZ, chunkSize, worldHeight);
        
        // Generate terrain for each column in the chunk
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                const worldX = chunkX * chunkSize + x;
                const worldZ = chunkZ * chunkSize + z;
                
                this.generateColumn(chunk, x, z, worldX, worldZ, worldHeight);
            }
        }
        
        // Generate structures (trees, etc.)
        this.generateStructures(chunk, chunkX, chunkZ, chunkSize);
        
        return chunk;
    }

    generateColumn(chunk, localX, localZ, worldX, worldZ, worldHeight) {
        // Get biome for this column
        const biome = this.getBiome(worldX, worldZ);
        
        // Generate height map
        const height = this.getTerrainHeight(worldX, worldZ, biome);
        
        // Generate blocks from bottom to top
        for (let y = 0; y < worldHeight; y++) {
            let blockType = BlockRegistry.blockTypes.AIR;
            
            if (y === 0) {
                // Bedrock layer
                blockType = BlockRegistry.blockTypes.BEDROCK;
            } else if (y < height - 4) {
                // Deep underground - stone with ores
                blockType = this.generateUndergroundBlock(worldX, y, worldZ);
            } else if (y < height - 1) {
                // Shallow underground - dirt/stone
                blockType = biome === this.biomes.DESERT ? BlockRegistry.blockTypes.SAND : BlockRegistry.blockTypes.DIRT;
            } else if (y < height) {
                // Surface layer
                blockType = this.getSurfaceBlock(biome);
            } else if (y <= 64) {
                // Water level
                blockType = BlockRegistry.blockTypes.WATER;
            }
            
            // Check for caves
            if (y > 1 && y < height - 1 && this.isCave(worldX, y, worldZ)) {
                blockType = y <= 64 ? BlockRegistry.blockTypes.WATER : BlockRegistry.blockTypes.AIR;
            }
            
            chunk.setBlock(localX, y, localZ, blockType);
        }
    }

    getTerrainHeight(x, z, biome) {
        let height = this.baseHeight;
        
        // Base terrain noise
        const scale1 = 0.01;
        const scale2 = 0.005;
        const scale3 = 0.002;
        
        const noise1 = this.heightNoise.noise2D(x * scale1, z * scale1);
        const noise2 = this.heightNoise.noise2D(x * scale2, z * scale2);
        const noise3 = this.heightNoise.noise2D(x * scale3, z * scale3);
        
        // Combine noise layers
        const combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
        
        // Apply biome-specific height modifications
        let heightMultiplier = 1.0;
        let heightOffset = 0;
        
        switch (biome.id) {
            case this.biomes.MOUNTAINS.id:
                heightMultiplier = 2.0;
                heightOffset = 20;
                break;
            case this.biomes.OCEAN.id:
                heightMultiplier = 0.3;
                heightOffset = -20;
                break;
            case this.biomes.DESERT.id:
                heightMultiplier = 0.7;
                heightOffset = -5;
                break;
            case this.biomes.PLAINS.id:
                heightMultiplier = 0.8;
                break;
            case this.biomes.FOREST.id:
                heightMultiplier = 1.1;
                heightOffset = 5;
                break;
        }
        
        height += (combinedNoise * this.heightVariation * heightMultiplier) + heightOffset;
        
        return Math.floor(Math.max(1, height));
    }

    getBiome(x, z) {
        const scale = 0.003;
        const temperature = this.biomeNoise.noise2D(x * scale, z * scale);
        const humidity = this.biomeNoise.noise2D((x + 1000) * scale, (z + 1000) * scale);
        
        // Simple biome determination based on temperature and humidity
        if (temperature < -0.5) {
            return this.biomes.OCEAN;
        } else if (temperature > 0.5 && humidity < -0.3) {
            return this.biomes.DESERT;
        } else if (temperature > 0.3) {
            return this.biomes.MOUNTAINS;
        } else if (humidity > 0.2) {
            return this.biomes.FOREST;
        } else {
            return this.biomes.PLAINS;
        }
    }

    getSurfaceBlock(biome) {
        switch (biome.id) {
            case this.biomes.DESERT.id:
                return BlockRegistry.blockTypes.SAND;
            case this.biomes.OCEAN.id:
                return BlockRegistry.blockTypes.SAND;
            default:
                return BlockRegistry.blockTypes.GRASS;
        }
    }

    generateUndergroundBlock(x, y, z) {
        // Check for ores first
        const oreType = this.generateOre(x, y, z);
        if (oreType !== null) {
            return oreType;
        }
        
        // Default to stone
        return BlockRegistry.blockTypes.STONE;
    }

    generateOre(x, y, z) {
        const oreNoise = this.oreNoise.noise3D(x * 0.1, y * 0.1, z * 0.1);
        
        if (oreNoise < this.oreThreshold) {
            return null; // No ore
        }
        
        // Determine ore type based on depth and rarity
        const depth = y;
        const rarity = Math.random();
        
        if (depth < 16) {
            // Deep ores
            if (rarity < 0.01) return BlockRegistry.blockTypes.DIAMOND_ORE;
            if (rarity < 0.02) return BlockRegistry.blockTypes.EMERALD_ORE;
            if (rarity < 0.05) return BlockRegistry.blockTypes.GOLD_ORE;
            if (rarity < 0.1) return BlockRegistry.blockTypes.REDSTONE_ORE;
            if (rarity < 0.15) return BlockRegistry.blockTypes.LAPIS_ORE;
        }
        
        if (depth < 32) {
            // Mid-level ores
            if (rarity < 0.08) return BlockRegistry.blockTypes.IRON_ORE;
            if (rarity < 0.15) return BlockRegistry.blockTypes.COAL_ORE;
        }
        
        if (depth < 64) {
            // Shallow ores
            if (rarity < 0.2) return BlockRegistry.blockTypes.COAL_ORE;
        }
        
        return null;
    }

    isCave(x, y, z) {
        const scale = 0.05;
        const caveNoise1 = this.caveNoise.noise3D(x * scale, y * scale, z * scale);
        const caveNoise2 = this.caveNoise.noise3D((x + 100) * scale * 0.7, (y + 100) * scale * 0.7, (z + 100) * scale * 0.7);
        
        // Combine noise for more interesting cave shapes
        const combinedNoise = Math.abs(caveNoise1) + Math.abs(caveNoise2) * 0.5;
        
        // Caves are more likely at certain depths
        let depthFactor = 1.0;
        if (y < 10) depthFactor = 0.3; // Fewer caves near bedrock
        if (y > 50) depthFactor = 0.5; // Fewer caves near surface
        
        return combinedNoise > (this.caveThreshold * depthFactor);
    }

    generateStructures(chunk, chunkX, chunkZ, chunkSize) {
        // Generate trees
        this.generateTrees(chunk, chunkX, chunkZ, chunkSize);
        
        // Generate villages (simplified)
        if (Math.random() < 0.01) { // 1% chance per chunk
            this.generateVillage(chunk, chunkX, chunkZ, chunkSize);
        }
    }

    generateTrees(chunk, chunkX, chunkZ, chunkSize) {
        const worldX = chunkX * chunkSize;
        const worldZ = chunkZ * chunkSize;
        
        // Check each position for tree generation
        for (let x = 2; x < chunkSize - 2; x++) {
            for (let z = 2; z < chunkSize - 2; z++) {
                const treeNoise = this.treeNoise.noise2D((worldX + x) * 0.1, (worldZ + z) * 0.1);
                
                if (treeNoise > 0.8) { // Tree generation threshold
                    const biome = this.getBiome(worldX + x, worldZ + z);
                    
                    // Only generate trees in appropriate biomes
                    if (biome.id === this.biomes.FOREST.id || 
                        (biome.id === this.biomes.PLAINS.id && Math.random() < 0.3)) {
                        
                        this.generateTree(chunk, x, z, chunkSize);
                    }
                }
            }
        }
    }

    generateTree(chunk, x, z, chunkSize) {
        // Find the ground level
        let groundY = -1;
        for (let y = chunk.worldHeight - 1; y >= 0; y--) {
            const blockType = chunk.getBlock(x, y, z);
            if (blockType === BlockRegistry.blockTypes.GRASS || blockType === BlockRegistry.blockTypes.DIRT) {
                groundY = y;
                break;
            }
        }
        
        if (groundY === -1) return; // No suitable ground found
        
        // Generate a simple tree
        const treeHeight = 4 + Math.floor(Math.random() * 3); // 4-6 blocks tall
        
        // Tree trunk
        for (let y = 1; y <= treeHeight; y++) {
            chunk.setBlock(x, groundY + y, z, BlockRegistry.blockTypes.OAK_LOG);
        }
        
        // Tree leaves (simple sphere)
        const leafRadius = 2;
        const leafTop = groundY + treeHeight;
        
        for (let dx = -leafRadius; dx <= leafRadius; dx++) {
            for (let dz = -leafRadius; dz <= leafRadius; dz++) {
                for (let dy = -1; dy <= 2; dy++) {
                    const leafX = x + dx;
                    const leafZ = z + dz;
                    const leafY = leafTop + dy;
                    
                    // Check bounds
                    if (leafX >= 0 && leafX < chunkSize && leafZ >= 0 && leafZ < chunkSize &&
                        leafY >= 0 && leafY < chunk.worldHeight) {
                        
                        // Distance check for sphere shape
                        const distance = Math.sqrt(dx * dx + dz * dz + dy * dy);
                        if (distance <= leafRadius && Math.random() < 0.8) {
                            const currentBlock = chunk.getBlock(leafX, leafY, leafZ);
                            if (currentBlock === BlockRegistry.blockTypes.AIR) {
                                chunk.setBlock(leafX, leafY, leafZ, BlockRegistry.blockTypes.OAK_LEAVES);
                            }
                        }
                    }
                }
            }
        }
    }

    generateVillage(chunk, chunkX, chunkZ, chunkSize) {
        // Simple village generation - just a few houses
        const centerX = Math.floor(chunkSize / 2);
        const centerZ = Math.floor(chunkSize / 2);
        
        // Find ground level at center
        let groundY = -1;
        for (let y = chunk.worldHeight - 1; y >= 0; y--) {
            const blockType = chunk.getBlock(centerX, y, centerZ);
            if (BlockRegistry.isBlockSolid(blockType)) {
                groundY = y;
                break;
            }
        }
        
        if (groundY === -1) return;
        
        // Generate a simple house
        this.generateHouse(chunk, centerX - 2, groundY + 1, centerZ - 2, chunkSize);
    }

    generateHouse(chunk, startX, startY, startZ, chunkSize) {
        const width = 5;
        const height = 4;
        const depth = 5;
        
        // Build walls
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                for (let y = 0; y < height; y++) {
                    const blockX = startX + x;
                    const blockZ = startZ + z;
                    const blockY = startY + y;
                    
                    // Check bounds
                    if (blockX >= 0 && blockX < chunkSize && blockZ >= 0 && blockZ < chunkSize &&
                        blockY >= 0 && blockY < chunk.worldHeight) {
                        
                        let blockType = BlockRegistry.blockTypes.AIR;
                        
                        // Walls
                        if (x === 0 || x === width - 1 || z === 0 || z === depth - 1) {
                            if (y === 0) {
                                blockType = BlockRegistry.blockTypes.COBBLESTONE; // Foundation
                            } else if (y < height - 1) {
                                blockType = BlockRegistry.blockTypes.OAK_PLANKS; // Walls
                            } else {
                                blockType = BlockRegistry.blockTypes.OAK_PLANKS; // Roof
                            }
                        }
                        // Floor
                        else if (y === 0) {
                            blockType = BlockRegistry.blockTypes.OAK_PLANKS;
                        }
                        // Roof
                        else if (y === height - 1) {
                            blockType = BlockRegistry.blockTypes.OAK_PLANKS;
                        }
                        
                        // Door (simple opening)
                        if (x === width - 1 && z === Math.floor(depth / 2) && (y === 1 || y === 2)) {
                            blockType = BlockRegistry.blockTypes.AIR;
                        }
                        
                        chunk.setBlock(blockX, blockY, blockZ, blockType);
                    }
                }
            }
        }
    }

    createEmptyChunk(chunkX, chunkZ, chunkSize, worldHeight) {
        return new Chunk(chunkX, chunkZ, chunkSize, worldHeight);
    }
}