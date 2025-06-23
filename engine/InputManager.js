export class InputManager {
    constructor(game) {
        this.game = game;
        
        // Input state
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            leftButton: false,
            rightButton: false,
            middleButton: false
        };
        
        // Settings
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;
        
        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        
        this.init();
    }

    init() {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Mouse events
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('wheel', this.onWheel);
        document.addEventListener('contextmenu', this.onContextMenu);
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock error');
        });
        
        // Click to start pointer lock
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('click', () => {
            if (!this.isPointerLocked && this.game.isRunning && !this.game.isPaused) {
                this.setPointerLock(true);
            }
        });
    }

    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Handle special keys
        switch (event.code) {
            case 'Escape':
                if (this.game.currentScreen === 'game') {
                    if (this.game.isPaused) {
                        this.game.resumeGame();
                    } else {
                        this.game.pauseGame();
                    }
                }
                break;
                
            case 'KeyE':
                if (this.game.currentScreen === 'game' && !this.game.isPaused) {
                    this.toggleInventory();
                }
                break;
                
            case 'KeyF':
                if (this.game.currentScreen === 'game' && !this.game.isPaused) {
                    this.game.player.toggleFlying();
                }
                break;
                
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
                const slot = parseInt(event.code.replace('Digit', '')) - 1;
                if (this.game.player) {
                    this.game.player.inventory.setSelectedSlot(slot);
                }
                break;
        }
        
        event.preventDefault();
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
        event.preventDefault();
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.mouse.deltaX = event.movementX * this.mouseSensitivity;
            this.mouse.deltaY = event.movementY * this.mouseSensitivity;
            
            // Update player camera rotation
            if (this.game.player) {
                this.game.player.updateCameraRotation(this.mouse.deltaX, this.mouse.deltaY);
            }
        }
        
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    onMouseDown(event) {
        switch (event.button) {
            case 0: // Left click
                this.mouse.leftButton = true;
                if (this.isPointerLocked && this.game.player) {
                    this.game.player.startBreaking();
                }
                break;
                
            case 1: // Middle click
                this.mouse.middleButton = true;
                if (this.isPointerLocked && this.game.player) {
                    this.game.player.pickBlock();
                }
                break;
                
            case 2: // Right click
                this.mouse.rightButton = true;
                if (this.isPointerLocked && this.game.player) {
                    this.game.player.placeBlock();
                }
                break;
        }
        
        event.preventDefault();
    }

    onMouseUp(event) {
        switch (event.button) {
            case 0: // Left click
                this.mouse.leftButton = false;
                if (this.game.player) {
                    this.game.player.stopBreaking();
                }
                break;
                
            case 1: // Middle click
                this.mouse.middleButton = false;
                break;
                
            case 2: // Right click
                this.mouse.rightButton = false;
                break;
        }
        
        event.preventDefault();
    }

    onWheel(event) {
        if (this.isPointerLocked && this.game.player) {
            const direction = event.deltaY > 0 ? 1 : -1;
            this.game.player.inventory.scrollHotbar(direction);
        }
        
        event.preventDefault();
    }

    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === document.getElementById('game-canvas');
        
        if (!this.isPointerLocked && this.game.isRunning && !this.game.isPaused) {
            // Auto-pause when losing pointer lock
            this.game.pauseGame();
        }
    }

    onContextMenu(event) {
        event.preventDefault();
    }

    setPointerLock(enabled) {
        const canvas = document.getElementById('game-canvas');
        
        if (enabled && !this.isPointerLocked) {
            canvas.requestPointerLock();
        } else if (!enabled && this.isPointerLocked) {
            document.exitPointerLock();
        }
    }

    toggleInventory() {
        const inventory = document.getElementById('inventory');
        const isOpen = !inventory.classList.contains('hidden');
        
        if (isOpen) {
            inventory.classList.add('hidden');
            this.setPointerLock(true);
        } else {
            inventory.classList.remove('hidden');
            this.setPointerLock(false);
        }
    }

    // Input state getters
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }

    isMouseButtonPressed(button) {
        switch (button) {
            case 0: return this.mouse.leftButton;
            case 1: return this.mouse.middleButton;
            case 2: return this.mouse.rightButton;
            default: return false;
        }
    }

    getMouseDelta() {
        const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        return delta;
    }

    // Movement input helpers
    getMovementInput() {
        const movement = { x: 0, z: 0, jump: false, sneak: false, sprint: false };
        
        // WASD movement
        if (this.isKeyPressed('KeyW')) movement.z -= 1;
        if (this.isKeyPressed('KeyS')) movement.z += 1;
        if (this.isKeyPressed('KeyA')) movement.x -= 1;
        if (this.isKeyPressed('KeyD')) movement.x += 1;
        
        // Jump and sneak
        movement.jump = this.isKeyPressed('Space');
        movement.sneak = this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
        movement.sprint = this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight');
        
        return movement;
    }

    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('contextmenu', this.onContextMenu);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        
        // Exit pointer lock
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
    }
}