import { BlockRegistry } from '../blocks/BlockRegistry.js';

export class ChunkMeshBuilder {
    constructor(textureAtlas) {
        this.textureAtlas = textureAtlas;
        
        // Face definitions for cube rendering
        this.faces = {
            // Each face: [normal, vertices, uvs]
            top: {
                normal: [0, 1, 0],
                vertices: [
                    [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
                ],
                indices: [0, 1, 2, 0, 2, 3]
            },
            bottom: {
                normal: [0, -1, 0],
                vertices: [
                    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5]
                ],
                indices: [0, 1, 2, 0, 2, 3]
            },
            north: {
                normal: [0, 0, -1],
                vertices: [
                    [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]
                ],
                indices: [0, 1, 2, 0, 2, 3]
            },
            south: {
                normal: [0, 0, 1],
                vertices: [
                    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
                ],
                indices: [0, 1, 2, 0, 2, 3]
            },
            west: {
                normal: [-1, 0, 0],
                vertices: [
                    [-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]
                ],
                indices: [0, 1, 2, 0, 2, 3]
            },
            east: {
                normal: [1, 0, 0],
                vertices: [
                    [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]
                ],
                indices: [0, 1, 2, 0, 2, 3]
            }
        };
    }

    buildChunkMesh(chunk, world) {
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const colors = [];
        
        let vertexCount = 0;
        
        // Iterate through all blocks in the chunk
        for (let x = 0; x < chunk.chunkSize; x++) {
            for (let y = 0; y < chunk.worldHeight; y++) {
                for (let z = 0; z < chunk.chunkSize; z++) {
                    const blockType = chunk.getBlock(x, y, z);
                    
                    if (blockType === BlockRegistry.blockTypes.AIR) {
                        continue; // Skip air blocks
                    }
                    
                    const block = BlockRegistry.getBlock(blockType);
                    if (!block) continue;
                    
                    // Check each face of the block
                    const worldX = chunk.chunkX * chunk.chunkSize + x;
                    const worldZ = chunk.chunkZ * chunk.chunkSize + z;
                    
                    // Top face
                    if (this.shouldRenderFace(world, worldX, y + 1, worldZ)) {
                        this.addFace('top', x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                    
                    // Bottom face
                    if (this.shouldRenderFace(world, worldX, y - 1, worldZ)) {
                        this.addFace('bottom', x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                    
                    // North face
                    if (this.shouldRenderFace(world, worldX, y, worldZ - 1)) {
                        this.addFace('north', x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                    
                    // South face
                    if (this.shouldRenderFace(world, worldX, y, worldZ + 1)) {
                        this.addFace('south', x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                    
                    // West face
                    if (this.shouldRenderFace(world, worldX - 1, y, worldZ)) {
                        this.addFace('west', x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                    
                    // East face
                    if (this.shouldRenderFace(world, worldX + 1, y, worldZ)) {
                        this.addFace('east', x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                }
            }
        }
        
        // If no faces to render, return null
        if (vertices.length === 0) {
            return null;
        }
        
        // Create Three.js geometry
        const geometry = new THREE.BufferGeometry();
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        // Calculate bounding box and sphere
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        
        // Create material
        const material = this.textureAtlas.getMaterial().clone();
        material.vertexColors = true;
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position the mesh in world space
        mesh.position.set(
            chunk.chunkX * chunk.chunkSize,
            0,
            chunk.chunkZ * chunk.chunkSize
        );
        
        // Enable shadows
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    shouldRenderFace(world, x, y, z) {
        const blockType = world.getBlock(x, y, z);
        
        // Always render face if adjacent block is air
        if (blockType === BlockRegistry.blockTypes.AIR) {
            return true;
        }
        
        // Don't render face if adjacent block is solid and opaque
        const block = BlockRegistry.getBlock(blockType);
        if (block && !block.transparent) {
            return false;
        }
        
        // Render face if adjacent block is transparent
        return true;
    }

    addFace(faceName, x, y, z, block, vertices, normals, uvs, indices, colors, vertexOffset) {
        const face = this.faces[faceName];
        const textures = block.textures;
        
        // Determine which texture to use for this face
        let textureName;
        if (textures.all) {
            textureName = textures.all;
        } else {
            switch (faceName) {
                case 'top':
                    textureName = textures.top || textures.sides || textures.all || 'missing';
                    break;
                case 'bottom':
                    textureName = textures.bottom || textures.sides || textures.all || 'missing';
                    break;
                default:
                    textureName = textures.sides || textures.all || 'missing';
                    break;
            }
        }
        
        // Get UV coordinates for the texture
        const textureUV = this.textureAtlas.getUVCoordinates(textureName);
        
        // Add vertices
        for (let i = 0; i < face.vertices.length; i++) {
            const vertex = face.vertices[i];
            vertices.push(
                x + vertex[0],
                y + vertex[1],
                z + vertex[2]
            );
        }
        
        // Add normals
        for (let i = 0; i < 4; i++) {
            normals.push(...face.normal);
        }
        
        // Add UVs
        const faceUVs = [
            [textureUV.u1, textureUV.v2], // Bottom-left
            [textureUV.u2, textureUV.v2], // Bottom-right
            [textureUV.u2, textureUV.v1], // Top-right
            [textureUV.u1, textureUV.v1]  // Top-left
        ];
        
        for (const uv of faceUVs) {
            uvs.push(uv[0], uv[1]);
        }
        
        // Add colors (for lighting/tinting)
        const color = this.getFaceColor(faceName, block);
        for (let i = 0; i < 4; i++) {
            colors.push(color.r, color.g, color.b);
        }
        
        // Add indices
        for (const index of face.indices) {
            indices.push(vertexOffset + index);
        }
    }

    getFaceColor(faceName, block) {
        // Basic ambient occlusion/lighting simulation
        let brightness = 1.0;
        
        switch (faceName) {
            case 'top':
                brightness = 1.0; // Full brightness for top faces
                break;
            case 'bottom':
                brightness = 0.5; // Darker for bottom faces
                break;
            case 'north':
            case 'south':
                brightness = 0.8; // Medium brightness for north/south faces
                break;
            case 'west':
            case 'east':
                brightness = 0.6; // Slightly darker for west/east faces
                break;
        }
        
        // Apply block-specific tinting (e.g., grass color)
        let r = brightness, g = brightness, b = brightness;
        
        if (block.id === BlockRegistry.blockTypes.GRASS) {
            // Grass tinting
            r *= 0.7;
            g *= 1.0;
            b *= 0.7;
        } else if (block.id === BlockRegistry.blockTypes.OAK_LEAVES) {
            // Leaves tinting
            r *= 0.6;
            g *= 1.0;
            b *= 0.6;
        } else if (block.id === BlockRegistry.blockTypes.WATER) {
            // Water tinting
            r *= 0.5;
            g *= 0.7;
            b *= 1.0;
        } else if (block.id === BlockRegistry.blockTypes.LAVA) {
            // Lava tinting (bright)
            r *= 1.2;
            g *= 0.8;
            b *= 0.4;
        }
        
        return { r: Math.min(1, r), g: Math.min(1, g), b: Math.min(1, b) };
    }

    // Optimized mesh building for water and transparent blocks
    buildTransparentMesh(chunk, world) {
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const colors = [];
        
        let vertexCount = 0;
        
        // Only process transparent blocks
        for (let x = 0; x < chunk.chunkSize; x++) {
            for (let y = 0; y < chunk.worldHeight; y++) {
                for (let z = 0; z < chunk.chunkSize; z++) {
                    const blockType = chunk.getBlock(x, y, z);
                    
                    if (blockType === BlockRegistry.blockTypes.AIR) {
                        continue;
                    }
                    
                    const block = BlockRegistry.getBlock(blockType);
                    if (!block || !block.transparent) {
                        continue;
                    }
                    
                    // Render all faces for transparent blocks
                    const worldX = chunk.chunkX * chunk.chunkSize + x;
                    const worldZ = chunk.chunkZ * chunk.chunkSize + z;
                    
                    for (const faceName of ['top', 'bottom', 'north', 'south', 'west', 'east']) {
                        this.addFace(faceName, x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                        vertexCount += 4;
                    }
                }
            }
        }
        
        if (vertices.length === 0) {
            return null;
        }
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        // Create transparent material
        const material = this.textureAtlas.getMaterial().clone();
        material.transparent = true;
        material.opacity = 0.8;
        material.vertexColors = true;
        material.side = THREE.DoubleSide;
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            chunk.chunkX * chunk.chunkSize,
            0,
            chunk.chunkZ * chunk.chunkSize
        );
        
        return mesh;
    }

    // Generate mesh for specific block types (optimization)
    buildBlockTypeMesh(chunk, world, blockTypes) {
        const vertices = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const colors = [];
        
        let vertexCount = 0;
        
        for (let x = 0; x < chunk.chunkSize; x++) {
            for (let y = 0; y < chunk.worldHeight; y++) {
                for (let z = 0; z < chunk.chunkSize; z++) {
                    const blockType = chunk.getBlock(x, y, z);
                    
                    if (!blockTypes.includes(blockType)) {
                        continue;
                    }
                    
                    const block = BlockRegistry.getBlock(blockType);
                    if (!block) continue;
                    
                    const worldX = chunk.chunkX * chunk.chunkSize + x;
                    const worldZ = chunk.chunkZ * chunk.chunkSize + z;
                    
                    // Check each face
                    const faces = ['top', 'bottom', 'north', 'south', 'west', 'east'];
                    const offsets = [
                        [0, 1, 0], [0, -1, 0], [0, 0, -1],
                        [0, 0, 1], [-1, 0, 0], [1, 0, 0]
                    ];
                    
                    for (let i = 0; i < faces.length; i++) {
                        const [dx, dy, dz] = offsets[i];
                        if (this.shouldRenderFace(world, worldX + dx, y + dy, worldZ + dz)) {
                            this.addFace(faces[i], x, y, z, block, vertices, normals, uvs, indices, colors, vertexCount);
                            vertexCount += 4;
                        }
                    }
                }
            }
        }
        
        if (vertices.length === 0) {
            return null;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        const material = this.textureAtlas.getMaterial().clone();
        material.vertexColors = true;
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            chunk.chunkX * chunk.chunkSize,
            0,
            chunk.chunkZ * chunk.chunkSize
        );
        
        return mesh;
    }
}