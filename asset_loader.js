// Asset Loader for Minecraft Textures
class AssetLoader {
    constructor() {
        this.textures = new Map();
        this.textureAtlas = null;
        this.material = null;
        this.loader = new THREE.TextureLoader();
        
        // Block texture mappings (update these paths based on your assets folder structure)
        this.blockTextures = {
            // Basic blocks
            grass_top: 'assets/textures/block/grass_block_top.png',
            grass_side: 'assets/textures/block/grass_block_side.png',
            dirt: 'assets/textures/block/dirt.png',
            stone: 'assets/textures/block/stone.png',
            cobblestone: 'assets/textures/block/cobblestone.png',
            sand: 'assets/textures/block/sand.png',
            gravel: 'assets/textures/block/gravel.png',
            
            // Wood blocks
            oak_log_top: 'assets/textures/block/oak_log_top.png',
            oak_log_side: 'assets/textures/block/oak_log.png',
            oak_planks: 'assets/textures/block/oak_planks.png',
            oak_leaves: 'assets/textures/block/oak_leaves.png',
            
            // Ores
            coal_ore: 'assets/textures/block/coal_ore.png',
            iron_ore: 'assets/textures/block/iron_ore.png',
            gold_ore: 'assets/textures/block/gold_ore.png',
            diamond_ore: 'assets/textures/block/diamond_ore.png',
            emerald_ore: 'assets/textures/block/emerald_ore.png',
            redstone_ore: 'assets/textures/block/redstone_ore.png',
            lapis_ore: 'assets/textures/block/lapis_ore.png',
            
            // Special blocks
            bedrock: 'assets/textures/block/bedrock.png',
            obsidian: 'assets/textures/block/obsidian.png',
            water: 'assets/textures/block/water_still.png',
            lava: 'assets/textures/block/lava_still.png',
            
            // Items
            wooden_pickaxe: 'assets/textures/item/wooden_pickaxe.png',
            stone_pickaxe: 'assets/textures/item/stone_pickaxe.png',
            iron_pickaxe: 'assets/textures/item/iron_pickaxe.png',
            diamond_pickaxe: 'assets/textures/item/diamond_pickaxe.png'
        };
    }
    
    async loadAssets() {
        console.log('Loading Minecraft assets...');
        
        try {
            // Load individual textures
            const loadPromises = Object.entries(this.blockTextures).map(([name, path]) => {
                return this.loadTexture(name, path);
            });
            
            await Promise.all(loadPromises);
            
            // Create texture atlas
            this.createTextureAtlas();
            
            console.log('Assets loaded successfully!');
            return true;
            
        } catch (error) {
            console.warn('Failed to load Minecraft assets, using fallback textures:', error);
            this.createFallbackTextures();
            return false;
        }
    }
    
    async loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (texture) => {
                    // Configure texture for pixel art
                    texture.magFilter = THREE.NearestFilter;
                    texture.minFilter = THREE.NearestFilter;
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    
                    this.textures.set(name, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture: ${path}`);
                    reject(error);
                }
            );
        });
    }
    
    createTextureAtlas() {
        // For now, just use the first texture as the atlas
        // In a full implementation, you'd combine all textures into a single atlas
        const grassTexture = this.textures.get('grass_top');
        if (grassTexture) {
            this.textureAtlas = grassTexture;
            this.material = new THREE.MeshLambertMaterial({ 
                map: this.textureAtlas,
                transparent: false
            });
        } else {
            this.createFallbackTextures();
        }
    }
    
    createFallbackTextures() {
        console.log('Creating fallback textures...');
        
        // Create a simple procedural texture atlas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create different colored squares for different block types
        const colors = {
            grass_top: '#4CAF50',
            grass_side: '#8BC34A', 
            dirt: '#8D6E63',
            stone: '#9E9E9E',
            cobblestone: '#616161',
            sand: '#FFC107',
            gravel: '#78909C',
            oak_log_top: '#8D6E63',
            oak_log_side: '#795548',
            oak_planks: '#A1887F',
            oak_leaves: '#4CAF50',
            coal_ore: '#212121',
            iron_ore: '#FF8A65',
            gold_ore: '#FFD700',
            diamond_ore: '#00BCD4',
            emerald_ore: '#4CAF50',
            redstone_ore: '#F44336',
            lapis_ore: '#3F51B5',
            bedrock: '#212121',
            obsidian: '#424242',
            water: '#2196F3',
            lava: '#FF5722'
        };
        
        let x = 0, y = 0;
        const tileSize = 16;
        
        Object.entries(colors).forEach(([name, color]) => {
            ctx.fillStyle = color;
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            // Add some texture variation
            ctx.fillStyle = this.lightenColor(color, 20);
            for (let i = 0; i < 10; i++) {
                const px = x * tileSize + Math.random() * tileSize;
                const py = y * tileSize + Math.random() * tileSize;
                ctx.fillRect(px, py, 2, 2);
            }
            
            x++;
            if (x >= 16) {
                x = 0;
                y++;
            }
        });
        
        // Create Three.js texture from canvas
        this.textureAtlas = new THREE.CanvasTexture(canvas);
        this.textureAtlas.magFilter = THREE.NearestFilter;
        this.textureAtlas.minFilter = THREE.NearestFilter;
        
        this.material = new THREE.MeshLambertMaterial({ 
            map: this.textureAtlas,
            transparent: false
        });
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    getTexture(name) {
        return this.textures.get(name) || this.textureAtlas;
    }
    
    getMaterial() {
        return this.material;
    }
    
    // Get UV coordinates for texture atlas (simplified)
    getUVCoordinates(textureName) {
        // For now, just return full texture coordinates
        // In a real implementation, you'd calculate the position in the atlas
        return {
            u1: 0, v1: 0,
            u2: 1, v2: 1
        };
    }
}

// Enhanced game class with asset loading
class EnhancedVoxelGame extends OptimizedVoxelGame {
    constructor() {
        super();
        this.assetLoader = new AssetLoader();
        this.assetsLoaded = false;
    }
    
    async init() {
        // Show loading message
        document.getElementById('info').innerHTML = '<div>Loading assets...</div>';
        
        // Load assets first
        this.assetsLoaded = await this.assetLoader.loadAssets();
        
        // Continue with normal initialization
        this.setupRenderer();
        this.setupCamera();
        this.setupLighting();
        this.setupInput();
        this.setupUI();
        
        // Generate initial chunks with proper textures
        this.generateInitialWorld();
        
        this.start();
    }
    
    createChunkMesh(chunk) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        
        let vertexCount = 0;
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.worldHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const blockType = this.getBlockInChunk(chunk, x, y, z);
                    if (blockType === this.blockTypes.AIR) continue;
                    
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
                                
                                // Add UV coordinates
                                const u = corner[0] > 0 ? 1 : 0;
                                const v = corner[1] > 0 ? 1 : 0;
                                uvs.push(u, v);
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
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        // Use loaded material or fallback
        const material = this.assetLoader.getMaterial() || new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        
        return new THREE.Mesh(geometry, material);
    }
}

// Replace the global game instance
window.game = new EnhancedVoxelGame();