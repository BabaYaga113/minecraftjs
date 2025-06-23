import { Game } from '../engine/Game.js';
import { UI } from '../ui/UI.js';
import { WorldManager } from '../world/WorldManager.js';

class VoxelCraftJS {
    constructor() {
        this.game = null;
        this.ui = null;
        this.worldManager = null;
        this.currentScreen = 'loading';
        
        this.init();
    }

    async init() {
        console.log('Initializing VoxelCraftJS...');
        
        // Initialize UI
        this.ui = new UI(this);
        
        // Initialize World Manager
        this.worldManager = new WorldManager();
        
        // Simulate loading
        await this.simulateLoading();
        
        // Show main menu
        this.showMainMenu();
    }

    async simulateLoading() {
        const loadingText = document.getElementById('loading-text');
        const loadingProgress = document.querySelector('.loading-progress');
        
        const steps = [
            'Loading textures...',
            'Generating noise maps...',
            'Initializing engine...',
            'Loading blocks...',
            'Setting up world...',
            'Ready!'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            loadingText.textContent = steps[i];
            loadingProgress.style.width = `${((i + 1) / steps.length) * 100}%`;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    showMainMenu() {
        this.currentScreen = 'menu';
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    }

    showWorldCreation() {
        this.currentScreen = 'world-creation';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('world-creation').classList.remove('hidden');
    }

    async createWorld(worldName, seed, gameMode) {
        console.log(`Creating world: ${worldName}, Seed: ${seed}, Mode: ${gameMode}`);
        
        // Hide world creation screen
        document.getElementById('world-creation').classList.add('hidden');
        
        // Show loading
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('loading-text').textContent = 'Generating world...';
        document.querySelector('.loading-progress').style.width = '0%';
        
        // Create and start game
        this.game = new Game(this, {
            worldName,
            seed: seed || Math.random().toString(36).substring(7),
            gameMode
        });
        
        await this.game.init();
        
        // Hide loading and show game
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        this.currentScreen = 'game';
        this.game.start();
    }

    pauseGame() {
        if (this.game) {
            this.game.pause();
            document.getElementById('pause-menu').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.game) {
            this.game.resume();
            document.getElementById('pause-menu').classList.add('hidden');
        }
    }

    quitToMenu() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('inventory').classList.add('hidden');
        
        this.showMainMenu();
    }

    saveWorld() {
        if (this.game) {
            this.game.saveWorld();
        }
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voxelCraft = new VoxelCraftJS();
});

export { VoxelCraftJS };