export class UI {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('new-world-btn').addEventListener('click', () => {
            this.app.showWorldCreation();
        });

        document.getElementById('load-world-btn').addEventListener('click', () => {
            this.showWorldList();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        // World creation buttons
        document.getElementById('create-world-btn').addEventListener('click', () => {
            this.createWorld();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.app.showMainMenu();
        });

        // Pause menu buttons
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.app.resumeGame();
        });

        document.getElementById('save-world-btn').addEventListener('click', () => {
            this.app.saveWorld();
        });

        document.getElementById('settings-pause-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('quit-to-menu-btn').addEventListener('click', () => {
            this.app.quitToMenu();
        });
    }

    createWorld() {
        const worldName = document.getElementById('world-name').value || 'New World';
        const seed = document.getElementById('world-seed').value;
        const gameMode = document.getElementById('game-mode').value;

        this.app.createWorld(worldName, seed, gameMode);
    }

    showWorldList() {
        // Get saved worlds from localStorage
        const savedWorlds = this.getSavedWorlds();
        
        if (savedWorlds.length === 0) {
            alert('No saved worlds found!');
            return;
        }

        // Create world selection dialog
        const dialog = this.createWorldListDialog(savedWorlds);
        document.body.appendChild(dialog);
    }

    getSavedWorlds() {
        const worlds = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('voxelcraft_world_')) {
                try {
                    const worldData = JSON.parse(localStorage.getItem(key));
                    worlds.push({
                        name: worldData.name,
                        seed: worldData.seed,
                        gameMode: worldData.gameMode,
                        timestamp: worldData.timestamp
                    });
                } catch (error) {
                    console.error('Error parsing world data:', error);
                }
            }
        }
        return worlds.sort((a, b) => b.timestamp - a.timestamp);
    }

    createWorldListDialog(worlds) {
        const dialog = document.createElement('div');
        dialog.className = 'world-list-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(50,50,50,0.95);
            border: 2px solid #666;
            border-radius: 10px;
            padding: 20px;
            max-width: 600px;
            max-height: 80%;
            overflow-y: auto;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Select World';
        title.style.marginBottom = '20px';
        content.appendChild(title);

        worlds.forEach(world => {
            const worldItem = document.createElement('div');
            worldItem.style.cssText = `
                background: rgba(0,0,0,0.5);
                border: 1px solid #666;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: background 0.3s ease;
            `;

            worldItem.innerHTML = `
                <h3>${world.name}</h3>
                <p>Mode: ${world.gameMode}</p>
                <p>Seed: ${world.seed}</p>
                <p>Last played: ${new Date(world.timestamp).toLocaleString()}</p>
            `;

            worldItem.addEventListener('mouseenter', () => {
                worldItem.style.background = 'rgba(255,255,255,0.1)';
            });

            worldItem.addEventListener('mouseleave', () => {
                worldItem.style.background = 'rgba(0,0,0,0.5)';
            });

            worldItem.addEventListener('click', () => {
                document.body.removeChild(dialog);
                this.loadWorld(world.name);
            });

            content.appendChild(worldItem);
        });

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cancel';
        closeButton.style.cssText = `
            padding: 10px 20px;
            background: #666;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        `;

        closeButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        content.appendChild(closeButton);
        dialog.appendChild(content);

        return dialog;
    }

    loadWorld(worldName) {
        this.app.createWorld(worldName, null, 'survival');
    }

    showSettings() {
        // Create settings dialog
        const dialog = this.createSettingsDialog();
        document.body.appendChild(dialog);
    }

    createSettingsDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'settings-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(50,50,50,0.95);
            border: 2px solid #666;
            border-radius: 10px;
            padding: 20px;
            min-width: 400px;
        `;

        content.innerHTML = `
            <h2>Settings</h2>
            <div style="margin: 20px 0;">
                <label>Render Distance: <span id="render-distance-value">8</span></label>
                <input type="range" id="render-distance" min="4" max="16" value="8" style="width: 100%; margin-top: 5px;">
            </div>
            <div style="margin: 20px 0;">
                <label>Mouse Sensitivity: <span id="mouse-sensitivity-value">50</span></label>
                <input type="range" id="mouse-sensitivity" min="10" max="100" value="50" style="width: 100%; margin-top: 5px;">
            </div>
            <div style="margin: 20px 0;">
                <label>
                    <input type="checkbox" id="vsync" checked> VSync
                </label>
            </div>
            <div style="margin: 20px 0;">
                <label>
                    <input type="checkbox" id="shadows" checked> Shadows
                </label>
            </div>
            <button id="settings-close" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        `;

        // Settings event listeners
        const renderDistance = content.querySelector('#render-distance');
        const renderDistanceValue = content.querySelector('#render-distance-value');
        renderDistance.addEventListener('input', () => {
            renderDistanceValue.textContent = renderDistance.value;
        });

        const mouseSensitivity = content.querySelector('#mouse-sensitivity');
        const mouseSensitivityValue = content.querySelector('#mouse-sensitivity-value');
        mouseSensitivity.addEventListener('input', () => {
            mouseSensitivityValue.textContent = mouseSensitivity.value;
        });

        const closeButton = content.querySelector('#settings-close');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        dialog.appendChild(content);
        return dialog;
    }

    // HUD update methods
    updateHealth(health, maxHealth = 20) {
        const heartsContainer = document.getElementById('hearts');
        if (!heartsContainer) return;

        heartsContainer.innerHTML = '';
        const heartCount = Math.ceil(maxHealth / 2);

        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            
            const heartValue = (i * 2) + 2;
            if (health >= heartValue) {
                // Full heart
                heart.style.opacity = '1';
            } else if (health >= heartValue - 1) {
                // Half heart
                heart.style.opacity = '0.5';
            } else {
                // Empty heart
                heart.style.opacity = '0.2';
            }
            
            heartsContainer.appendChild(heart);
        }
    }

    updateHunger(hunger, maxHunger = 20) {
        const hungerContainer = document.getElementById('hunger');
        if (!hungerContainer) return;

        hungerContainer.innerHTML = '';
        const hungerCount = Math.ceil(maxHunger / 2);

        for (let i = 0; i < hungerCount; i++) {
            const hungerIcon = document.createElement('div');
            hungerIcon.className = 'hunger-icon';
            
            const hungerValue = (i * 2) + 2;
            if (hunger >= hungerValue) {
                hungerIcon.style.opacity = '1';
            } else if (hunger >= hungerValue - 1) {
                hungerIcon.style.opacity = '0.5';
            } else {
                hungerIcon.style.opacity = '0.2';
            }
            
            hungerContainer.appendChild(hungerIcon);
        }
    }

    updateHotbar(inventory) {
        const hotbarSlots = document.getElementById('hotbar-slots');
        if (!hotbarSlots) return;

        hotbarSlots.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            
            if (i === inventory.selectedSlot) {
                slot.classList.add('selected');
            }

            const item = inventory.getItem(i);
            if (item && item.type !== 0) {
                // Add item icon (placeholder for now)
                const icon = document.createElement('div');
                icon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    background: #666;
                    border-radius: 2px;
                `;
                slot.appendChild(icon);

                if (item.count > 1) {
                    const count = document.createElement('div');
                    count.className = 'count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
            }

            hotbarSlots.appendChild(slot);
        }
    }

    updateInventory(inventory) {
        const inventoryGrid = document.getElementById('inventory-grid');
        if (!inventoryGrid) return;

        inventoryGrid.innerHTML = '';

        for (let i = 0; i < 36; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;

            const item = inventory.getItem(i);
            if (item && item.type !== 0) {
                const icon = document.createElement('div');
                icon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    background: #666;
                    border-radius: 2px;
                `;
                slot.appendChild(icon);

                if (item.count > 1) {
                    const count = document.createElement('div');
                    count.className = 'count';
                    count.textContent = item.count;
                    slot.appendChild(count);
                }
            }

            inventoryGrid.appendChild(slot);
        }
    }
}