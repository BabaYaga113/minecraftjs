export class TextureAtlas {
    constructor() {
        this.texture = null;
        this.material = null;
        this.textureSize = 16; // Size of each texture in pixels
        this.atlasSize = 256; // Size of the atlas texture
        this.tilesPerRow = this.atlasSize / this.textureSize; // 16 tiles per row
        
        // Texture mapping for different block types
        this.textureMap = {
            // Basic blocks
            grass_top: { x: 0, y: 0 },
            grass_side: { x: 1, y: 0 },
            dirt: { x: 2, y: 0 },
            stone: { x: 3, y: 0 },
            cobblestone: { x: 4, y: 0 },
            sand: { x: 5, y: 0 },
            gravel: { x: 6, y: 0 },
            
            // Wood blocks
            oak_log_top: { x: 0, y: 1 },
            oak_log_side: { x: 1, y: 1 },
            oak_planks: { x: 2, y: 1 },
            oak_leaves: { x: 3, y: 1 },
            
            // Ores
            coal_ore: { x: 0, y: 2 },
            iron_ore: { x: 1, y: 2 },
            gold_ore: { x: 2, y: 2 },
            diamond_ore: { x: 3, y: 2 },
            emerald_ore: { x: 4, y: 2 },
            redstone_ore: { x: 5, y: 2 },
            lapis_ore: { x: 6, y: 2 },
            
            // Special blocks
            bedrock: { x: 0, y: 3 },
            obsidian: { x: 1, y: 3 },
            water: { x: 2, y: 3 },
            lava: { x: 3, y: 3 },
            
            // Default/missing texture
            missing: { x: 15, y: 15 }
        };
    }

    async init() {
        console.log('Initializing texture atlas...');
        
        // Create a procedural texture atlas for now
        // In a real implementation, you would load actual Minecraft textures
        this.createProceduralAtlas();
        
        console.log('Texture atlas initialized');
    }

    createProceduralAtlas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.atlasSize;
        canvas.height = this.atlasSize;
        const ctx = canvas.getContext('2d');
        
        // Create textures for each block type
        this.createGrassTextures(ctx);
        this.createStoneTextures(ctx);
        this.createWoodTextures(ctx);
        this.createOreTextures(ctx);
        this.createSpecialTextures(ctx);
        
        // Create Three.js texture
        this.texture = new THREE.CanvasTexture(canvas);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Create material
        this.material = new THREE.MeshLambertMaterial({
            map: this.texture,
            transparent: false
        });
    }

    createGrassTextures(ctx) {
        // Grass top
        this.drawTexture(ctx, 0, 0, '#4CAF50', '#45a049');
        
        // Grass side
        this.drawTexture(ctx, 1, 0, '#8BC34A', '#7CB342', '#654321');
        
        // Dirt
        this.drawTexture(ctx, 2, 0, '#8D6E63', '#795548');
    }

    createStoneTextures(ctx) {
        // Stone
        this.drawTexture(ctx, 3, 0, '#9E9E9E', '#757575');
        
        // Cobblestone
        this.drawTexture(ctx, 4, 0, '#616161', '#424242');
        
        // Sand
        this.drawTexture(ctx, 5, 0, '#FFC107', '#FF8F00');
        
        // Gravel
        this.drawTexture(ctx, 6, 0, '#78909C', '#546E7A');
    }

    createWoodTextures(ctx) {
        // Oak log top
        this.drawTexture(ctx, 0, 1, '#8D6E63', '#6D4C41');
        
        // Oak log side
        this.drawTexture(ctx, 1, 1, '#795548', '#5D4037');
        
        // Oak planks
        this.drawTexture(ctx, 2, 1, '#A1887F', '#8D6E63');
        
        // Oak leaves
        this.drawTexture(ctx, 3, 1, '#4CAF50', '#388E3C');
    }

    createOreTextures(ctx) {
        const baseStone = '#9E9E9E';
        
        // Coal ore
        this.drawOreTexture(ctx, 0, 2, baseStone, '#212121');
        
        // Iron ore
        this.drawOreTexture(ctx, 1, 2, baseStone, '#FF8A65');
        
        // Gold ore
        this.drawOreTexture(ctx, 2, 2, baseStone, '#FFD700');
        
        // Diamond ore
        this.drawOreTexture(ctx, 3, 2, baseStone, '#00BCD4');
        
        // Emerald ore
        this.drawOreTexture(ctx, 4, 2, baseStone, '#4CAF50');
        
        // Redstone ore
        this.drawOreTexture(ctx, 5, 2, baseStone, '#F44336');
        
        // Lapis ore
        this.drawOreTexture(ctx, 6, 2, baseStone, '#3F51B5');
    }

    createSpecialTextures(ctx) {
        // Bedrock
        this.drawTexture(ctx, 0, 3, '#212121', '#000000');
        
        // Obsidian
        this.drawTexture(ctx, 1, 3, '#424242', '#212121');
        
        // Water
        this.drawTexture(ctx, 2, 3, '#2196F3', '#1976D2');
        
        // Lava
        this.drawTexture(ctx, 3, 3, '#FF5722', '#D84315');
        
        // Missing texture (pink/black checkerboard)
        this.drawMissingTexture(ctx, 15, 15);
    }

    drawTexture(ctx, tileX, tileY, color1, color2, color3 = null) {
        const x = tileX * this.textureSize;
        const y = tileY * this.textureSize;
        
        // Base color
        ctx.fillStyle = color1;
        ctx.fillRect(x, y, this.textureSize, this.textureSize);
        
        // Add some noise/variation
        for (let i = 0; i < 20; i++) {
            const px = x + Math.random() * this.textureSize;
            const py = y + Math.random() * this.textureSize;
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = color2;
            ctx.fillRect(px, py, size, size);
        }
        
        // Add third color if provided (for grass side)
        if (color3) {
            ctx.fillStyle = color3;
            ctx.fillRect(x, y + this.textureSize - 4, this.textureSize, 4);
        }
    }

    drawOreTexture(ctx, tileX, tileY, baseColor, oreColor) {
        const x = tileX * this.textureSize;
        const y = tileY * this.textureSize;
        
        // Base stone texture
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, this.textureSize, this.textureSize);
        
        // Add stone variation
        for (let i = 0; i < 15; i++) {
            const px = x + Math.random() * this.textureSize;
            const py = y + Math.random() * this.textureSize;
            const size = Math.random() * 2 + 1;
            
            ctx.fillStyle = '#757575';
            ctx.fillRect(px, py, size, size);
        }
        
        // Add ore veins
        for (let i = 0; i < 8; i++) {
            const px = x + Math.random() * this.textureSize;
            const py = y + Math.random() * this.textureSize;
            const size = Math.random() * 3 + 2;
            
            ctx.fillStyle = oreColor;
            ctx.fillRect(px, py, size, size);
        }
    }

    drawMissingTexture(ctx, tileX, tileY) {
        const x = tileX * this.textureSize;
        const y = tileY * this.textureSize;
        const halfSize = this.textureSize / 2;
        
        // Pink and black checkerboard
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(x, y, halfSize, halfSize);
        ctx.fillRect(x + halfSize, y + halfSize, halfSize, halfSize);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + halfSize, y, halfSize, halfSize);
        ctx.fillRect(x, y + halfSize, halfSize, halfSize);
    }

    getUVCoordinates(textureName) {
        const textureInfo = this.textureMap[textureName] || this.textureMap.missing;
        
        const u = textureInfo.x / this.tilesPerRow;
        const v = textureInfo.y / this.tilesPerRow;
        const size = 1 / this.tilesPerRow;
        
        return {
            u1: u,
            v1: v,
            u2: u + size,
            v2: v + size
        };
    }

    getMaterial() {
        return this.material;
    }

    getTexture() {
        return this.texture;
    }

    destroy() {
        if (this.texture) {
            this.texture.dispose();
        }
        
        if (this.material) {
            this.material.dispose();
        }
    }
}