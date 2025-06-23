export class BlockRegistry {
    static blocks = new Map();
    static blockTypes = {};

    static init() {
        console.log('Initializing block registry...');
        
        // Define block types
        this.blockTypes = {
            AIR: 0,
            GRASS: 1,
            DIRT: 2,
            STONE: 3,
            COBBLESTONE: 4,
            SAND: 5,
            GRAVEL: 6,
            OAK_LOG: 7,
            OAK_PLANKS: 8,
            OAK_LEAVES: 9,
            COAL_ORE: 10,
            IRON_ORE: 11,
            GOLD_ORE: 12,
            DIAMOND_ORE: 13,
            EMERALD_ORE: 14,
            REDSTONE_ORE: 15,
            LAPIS_ORE: 16,
            BEDROCK: 17,
            OBSIDIAN: 18,
            WATER: 19,
            LAVA: 20
        };

        // Register all blocks
        this.registerBlock(this.blockTypes.AIR, {
            name: 'Air',
            solid: false,
            transparent: true,
            textures: { all: 'missing' }
        });

        this.registerBlock(this.blockTypes.GRASS, {
            name: 'Grass Block',
            solid: true,
            transparent: false,
            textures: {
                top: 'grass_top',
                bottom: 'dirt',
                sides: 'grass_side'
            },
            hardness: 0.6,
            tool: 'shovel',
            drops: [{ type: this.blockTypes.DIRT, count: 1 }]
        });

        this.registerBlock(this.blockTypes.DIRT, {
            name: 'Dirt',
            solid: true,
            transparent: false,
            textures: { all: 'dirt' },
            hardness: 0.5,
            tool: 'shovel'
        });

        this.registerBlock(this.blockTypes.STONE, {
            name: 'Stone',
            solid: true,
            transparent: false,
            textures: { all: 'stone' },
            hardness: 1.5,
            tool: 'pickaxe',
            drops: [{ type: this.blockTypes.COBBLESTONE, count: 1 }]
        });

        this.registerBlock(this.blockTypes.COBBLESTONE, {
            name: 'Cobblestone',
            solid: true,
            transparent: false,
            textures: { all: 'cobblestone' },
            hardness: 2.0,
            tool: 'pickaxe'
        });

        this.registerBlock(this.blockTypes.SAND, {
            name: 'Sand',
            solid: true,
            transparent: false,
            textures: { all: 'sand' },
            hardness: 0.5,
            tool: 'shovel',
            gravity: true
        });

        this.registerBlock(this.blockTypes.GRAVEL, {
            name: 'Gravel',
            solid: true,
            transparent: false,
            textures: { all: 'gravel' },
            hardness: 0.6,
            tool: 'shovel',
            gravity: true
        });

        this.registerBlock(this.blockTypes.OAK_LOG, {
            name: 'Oak Log',
            solid: true,
            transparent: false,
            textures: {
                top: 'oak_log_top',
                bottom: 'oak_log_top',
                sides: 'oak_log_side'
            },
            hardness: 2.0,
            tool: 'axe'
        });

        this.registerBlock(this.blockTypes.OAK_PLANKS, {
            name: 'Oak Planks',
            solid: true,
            transparent: false,
            textures: { all: 'oak_planks' },
            hardness: 2.0,
            tool: 'axe'
        });

        this.registerBlock(this.blockTypes.OAK_LEAVES, {
            name: 'Oak Leaves',
            solid: true,
            transparent: true,
            textures: { all: 'oak_leaves' },
            hardness: 0.2,
            tool: 'shears'
        });

        // Ores
        this.registerBlock(this.blockTypes.COAL_ORE, {
            name: 'Coal Ore',
            solid: true,
            transparent: false,
            textures: { all: 'coal_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 0,
            drops: [{ type: 'coal', count: 1 }]
        });

        this.registerBlock(this.blockTypes.IRON_ORE, {
            name: 'Iron Ore',
            solid: true,
            transparent: false,
            textures: { all: 'iron_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 1
        });

        this.registerBlock(this.blockTypes.GOLD_ORE, {
            name: 'Gold Ore',
            solid: true,
            transparent: false,
            textures: { all: 'gold_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 2
        });

        this.registerBlock(this.blockTypes.DIAMOND_ORE, {
            name: 'Diamond Ore',
            solid: true,
            transparent: false,
            textures: { all: 'diamond_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 2,
            drops: [{ type: 'diamond', count: 1 }]
        });

        this.registerBlock(this.blockTypes.EMERALD_ORE, {
            name: 'Emerald Ore',
            solid: true,
            transparent: false,
            textures: { all: 'emerald_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 2,
            drops: [{ type: 'emerald', count: 1 }]
        });

        this.registerBlock(this.blockTypes.REDSTONE_ORE, {
            name: 'Redstone Ore',
            solid: true,
            transparent: false,
            textures: { all: 'redstone_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 2,
            drops: [{ type: 'redstone', count: { min: 4, max: 5 } }]
        });

        this.registerBlock(this.blockTypes.LAPIS_ORE, {
            name: 'Lapis Lazuli Ore',
            solid: true,
            transparent: false,
            textures: { all: 'lapis_ore' },
            hardness: 3.0,
            tool: 'pickaxe',
            minToolLevel: 1,
            drops: [{ type: 'lapis', count: { min: 4, max: 9 } }]
        });

        this.registerBlock(this.blockTypes.BEDROCK, {
            name: 'Bedrock',
            solid: true,
            transparent: false,
            textures: { all: 'bedrock' },
            hardness: -1, // Unbreakable
            tool: null
        });

        this.registerBlock(this.blockTypes.OBSIDIAN, {
            name: 'Obsidian',
            solid: true,
            transparent: false,
            textures: { all: 'obsidian' },
            hardness: 50.0,
            tool: 'pickaxe',
            minToolLevel: 3
        });

        this.registerBlock(this.blockTypes.WATER, {
            name: 'Water',
            solid: false,
            transparent: true,
            textures: { all: 'water' },
            hardness: 0,
            tool: null,
            fluid: true
        });

        this.registerBlock(this.blockTypes.LAVA, {
            name: 'Lava',
            solid: false,
            transparent: true,
            textures: { all: 'lava' },
            hardness: 0,
            tool: null,
            fluid: true,
            damage: 4
        });

        console.log(`Registered ${this.blocks.size} block types`);
    }

    static registerBlock(id, properties) {
        const block = {
            id,
            name: properties.name || 'Unknown Block',
            solid: properties.solid !== false,
            transparent: properties.transparent === true,
            textures: properties.textures || { all: 'missing' },
            hardness: properties.hardness || 1.0,
            tool: properties.tool || null,
            minToolLevel: properties.minToolLevel || 0,
            drops: properties.drops || [{ type: id, count: 1 }],
            gravity: properties.gravity === true,
            fluid: properties.fluid === true,
            damage: properties.damage || 0
        };

        this.blocks.set(id, block);
    }

    static getBlock(id) {
        return this.blocks.get(id) || this.blocks.get(this.blockTypes.AIR);
    }

    static getBlockName(id) {
        const block = this.getBlock(id);
        return block.name;
    }

    static isBlockSolid(id) {
        const block = this.getBlock(id);
        return block.solid;
    }

    static isBlockTransparent(id) {
        const block = this.getBlock(id);
        return block.transparent;
    }

    static getBlockTextures(id) {
        const block = this.getBlock(id);
        return block.textures;
    }

    static getBlockHardness(id) {
        const block = this.getBlock(id);
        return block.hardness;
    }

    static canBreakBlock(blockId, tool, toolLevel) {
        const block = this.getBlock(blockId);
        
        // Unbreakable blocks
        if (block.hardness < 0) {
            return false;
        }
        
        // No tool requirement
        if (!block.tool) {
            return true;
        }
        
        // Check tool type and level
        if (tool === block.tool && toolLevel >= block.minToolLevel) {
            return true;
        }
        
        // Can break with wrong tool but slower
        return true;
    }

    static getBreakTime(blockId, tool, toolLevel) {
        const block = this.getBlock(blockId);
        
        if (block.hardness < 0) {
            return Infinity;
        }
        
        let baseTime = block.hardness;
        
        // Tool efficiency
        if (tool === block.tool && toolLevel >= block.minToolLevel) {
            const efficiency = Math.pow(2, toolLevel);
            baseTime /= efficiency;
        } else if (tool !== block.tool) {
            // Wrong tool penalty
            baseTime *= 3;
        }
        
        return Math.max(0.05, baseTime); // Minimum break time
    }

    static getBlockDrops(blockId, tool, toolLevel) {
        const block = this.getBlock(blockId);
        
        // Check if proper tool is used for drops
        if (block.tool && tool !== block.tool) {
            return []; // No drops with wrong tool
        }
        
        if (block.minToolLevel > 0 && toolLevel < block.minToolLevel) {
            return []; // No drops with insufficient tool level
        }
        
        const drops = [];
        
        for (const drop of block.drops) {
            let count = drop.count;
            
            if (typeof count === 'object') {
                // Random count between min and max
                count = Math.floor(Math.random() * (count.max - count.min + 1)) + count.min;
            }
            
            drops.push({
                type: drop.type,
                count: count
            });
        }
        
        return drops;
    }

    static hasGravity(blockId) {
        const block = this.getBlock(blockId);
        return block.gravity;
    }

    static isFluid(blockId) {
        const block = this.getBlock(blockId);
        return block.fluid;
    }

    static getBlockDamage(blockId) {
        const block = this.getBlock(blockId);
        return block.damage;
    }

    static getAllBlocks() {
        return Array.from(this.blocks.values());
    }

    static getBlocksByCategory(category) {
        const blocks = [];
        
        for (const block of this.blocks.values()) {
            // Simple categorization based on name/properties
            if (category === 'building' && !block.fluid && block.solid) {
                blocks.push(block);
            } else if (category === 'ores' && block.name.includes('Ore')) {
                blocks.push(block);
            } else if (category === 'natural' && (block.name.includes('Grass') || block.name.includes('Dirt') || block.name.includes('Stone'))) {
                blocks.push(block);
            }
        }
        
        return blocks;
    }
}