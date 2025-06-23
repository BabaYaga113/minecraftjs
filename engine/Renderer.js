import { TextureAtlas } from './TextureAtlas.js';

export class Renderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.textureAtlas = null;
        
        // Rendering settings
        this.renderDistance = 8; // chunks
        this.fogNear = 50;
        this.fogFar = 200;
    }

    async init() {
        console.log('Initializing renderer...');
        
        // Get canvas
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, this.fogNear, this.fogFar);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create camera (will be controlled by player)
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Initialize texture atlas
        this.textureAtlas = new TextureAtlas();
        await this.textureAtlas.init();
        
        // Setup lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('Renderer initialized successfully');
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Shadow camera settings
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        
        this.scene.add(directionalLight);
        
        // Store reference for day/night cycle
        this.sunLight = directionalLight;
    }

    render(camera, visibleChunks) {
        // Update camera
        if (camera) {
            this.camera.position.copy(camera.position);
            this.camera.rotation.copy(camera.rotation);
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    addChunkMesh(chunkMesh) {
        this.scene.add(chunkMesh);
    }

    removeChunkMesh(chunkMesh) {
        this.scene.remove(chunkMesh);
        
        // Dispose of geometry and materials
        if (chunkMesh.geometry) {
            chunkMesh.geometry.dispose();
        }
        
        if (chunkMesh.material) {
            if (Array.isArray(chunkMesh.material)) {
                chunkMesh.material.forEach(material => material.dispose());
            } else {
                chunkMesh.material.dispose();
            }
        }
    }

    getTextureAtlas() {
        return this.textureAtlas;
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    // Day/night cycle
    updateTimeOfDay(timeOfDay) {
        // timeOfDay: 0 = midnight, 0.5 = noon, 1 = midnight
        const sunAngle = (timeOfDay - 0.25) * Math.PI * 2;
        
        // Update sun position
        this.sunLight.position.x = Math.cos(sunAngle) * 100;
        this.sunLight.position.y = Math.sin(sunAngle) * 100;
        this.sunLight.position.z = 50;
        
        // Update light intensity based on sun height
        const sunHeight = Math.sin(sunAngle);
        const intensity = Math.max(0.1, sunHeight * 0.8 + 0.2);
        this.sunLight.intensity = intensity;
        
        // Update fog color based on time of day
        let fogColor;
        if (sunHeight > 0.1) {
            // Day
            fogColor = new THREE.Color(0x87CEEB);
        } else if (sunHeight > -0.1) {
            // Sunset/sunrise
            fogColor = new THREE.Color(0xFF6B35);
        } else {
            // Night
            fogColor = new THREE.Color(0x191970);
        }
        
        this.scene.fog.color = fogColor;
        this.renderer.setClearColor(fogColor);
    }

    // Utility methods
    screenToWorld(screenX, screenY) {
        const mouse = new THREE.Vector2();
        mouse.x = (screenX / window.innerWidth) * 2 - 1;
        mouse.y = -(screenY / window.innerHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        return raycaster;
    }

    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.textureAtlas) {
            this.textureAtlas.destroy();
        }
        
        window.removeEventListener('resize', () => this.onWindowResize());
        
        console.log('Renderer destroyed');
    }
}