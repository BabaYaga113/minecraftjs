// Improved Controls System for VoxelCraftJS
class ImprovedControls {
    constructor(game) {
        this.game = game;
        
        // Input state
        this.keys = {};
        this.mouse = {
            x: 0, y: 0,
            deltaX: 0, deltaY: 0,
            leftButton: false,
            rightButton: false,
            middleButton: false
        };
        
        // Settings
        this.mouseSensitivity = 0.002;
        this.invertY = false;
        this.smoothMovement = true;
        
        // Movement smoothing
        this.movementSmoothing = 0.15;
        this.currentMovement = new THREE.Vector3();
        this.targetMovement = new THREE.Vector3();
        
        // Camera smoothing
        this.cameraSmoothing = 0.1;
        this.currentRotation = new THREE.Euler();
        this.targetRotation = new THREE.Euler();
        
        // Key bindings (customizable)
        this.keyBindings = {
            forward: ['KeyW'],
            backward: ['KeyS'],
            left: ['KeyA'],
            right: ['KeyD'],
            jump: ['Space'],
            sneak: ['ShiftLeft', 'ShiftRight'],
            sprint: ['ControlLeft', 'ControlRight'],
            fly: ['KeyF'],
            inventory: ['KeyE'],
            pause: ['Escape'],
            chat: ['KeyT'],
            drop: ['KeyQ'],
            hotbar1: ['Digit1'],
            hotbar2: ['Digit2'],
            hotbar3: ['Digit3'],
            hotbar4: ['Digit4'],
            hotbar5: ['Digit5'],
            hotbar6: ['Digit6'],
            hotbar7: ['Digit7'],
            hotbar8: ['Digit8'],
            hotbar9: ['Digit9']
        };
        
        // Double-tap detection for sprint
        this.lastKeyPress = {};
        this.doubleTapTime = 300; // ms
        
        this.init();
    }
    
    init() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents(); // For mobile support
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e);
            this.detectDoubleTap(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleKeyUp(e);
        });
        
        // Prevent default browser shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.game.isPointerLocked) {
                // Prevent common browser shortcuts when in game
                if (e.ctrlKey || e.altKey || e.metaKey) {
                    if (['KeyR', 'KeyT', 'KeyW', 'KeyN', 'KeyL'].includes(e.code)) {
                        e.preventDefault();
                    }
                }
                
                // Prevent F5 refresh, F11 fullscreen, etc.
                if (e.code.startsWith('F') && !['KeyF'].includes(e.code)) {
                    e.preventDefault();
                }
            }
        });
    }
    
    setupMouseEvents() {
        // Pointer lock
        this.game.canvas.addEventListener('click', () => {
            if (!this.game.isPointerLocked && !this.game.isPaused) {
                this.game.canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.game.isPointerLocked = document.pointerLockElement === this.game.canvas;
            
            if (!this.game.isPointerLocked && this.game.isRunning && !this.game.isPaused) {
                this.game.togglePause();
            }
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.game.isPointerLocked) {
                this.mouse.deltaX = e.movementX * this.mouseSensitivity;
                this.mouse.deltaY = e.movementY * this.mouseSensitivity * (this.invertY ? -1 : 1);
                
                if (this.smoothMovement) {
                    this.updateCameraRotationSmooth();
                } else {
                    this.updateCameraRotationDirect();
                }
            }
        });
        
        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            if (this.game.isPointerLocked) {
                switch (e.button) {
                    case 0: // Left click
                        this.mouse.leftButton = true;
                        this.handleLeftClick();
                        break;
                    case 1: // Middle click
                        this.mouse.middleButton = true;
                        this.handleMiddleClick();
                        break;
                    case 2: // Right click
                        this.mouse.rightButton = true;
                        this.handleRightClick();
                        break;
                }
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            switch (e.button) {
                case 0:
                    this.mouse.leftButton = false;
                    this.handleLeftClickRelease();
                    break;
                case 1:
                    this.mouse.middleButton = false;
                    break;
                case 2:
                    this.mouse.rightButton = false;
                    break;
            }
        });
        
        // Mouse wheel
        document.addEventListener('wheel', (e) => {
            if (this.game.isPointerLocked) {
                e.preventDefault();
                const direction = e.deltaY > 0 ? 1 : -1;
                this.handleMouseWheel(direction);
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            if (this.game.isPointerLocked) {
                e.preventDefault();
            }
        });
    }
    
    setupTouchEvents() {
        // Basic touch support for mobile devices
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = (touch.clientX - touchStartX) * 0.01;
                const deltaY = (touch.clientY - touchStartY) * 0.01;
                
                this.mouse.deltaX = deltaX;
                this.mouse.deltaY = deltaY;
                this.updateCameraRotationDirect();
                
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        });
    }
    
    detectDoubleTap(keyCode) {
        const now = Date.now();
        const lastPress = this.lastKeyPress[keyCode];
        
        if (lastPress && now - lastPress < this.doubleTapTime) {
            this.handleDoubleTap(keyCode);
        }
        
        this.lastKeyPress[keyCode] = now;
    }
    
    handleDoubleTap(keyCode) {
        // Double-tap W to toggle sprint
        if (keyCode === 'KeyW') {
            this.game.player.isSprinting = !this.game.player.isSprinting;
        }
    }
    
    handleKeyDown(e) {
        const action = this.getActionForKey(e.code);
        
        switch (action) {
            case 'pause':
                this.game.togglePause();
                break;
            case 'fly':
                this.game.toggleFly();
                break;
            case 'inventory':
                this.toggleInventory();
                break;
            case 'drop':
                this.dropItem();
                break;
            case 'chat':
                this.openChat();
                break;
            default:
                if (action && action.startsWith('hotbar')) {
                    const slot = parseInt(action.replace('hotbar', ''));
                    this.selectHotbarSlot(slot);
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        // Handle key release events if needed
    }
    
    getActionForKey(keyCode) {
        for (const [action, keys] of Object.entries(this.keyBindings)) {
            if (keys.includes(keyCode)) {
                return action;
            }
        }
        return null;
    }
    
    isActionPressed(action) {
        const keys = this.keyBindings[action] || [];
        return keys.some(key => this.keys[key]);
    }
    
    updateCameraRotationDirect() {
        this.game.player.rotation.y -= this.mouse.deltaX;
        this.game.player.rotation.x -= this.mouse.deltaY;
        this.game.player.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.game.player.rotation.x));
        
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    updateCameraRotationSmooth() {
        this.targetRotation.y -= this.mouse.deltaX;
        this.targetRotation.x -= this.mouse.deltaY;
        this.targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetRotation.x));
        
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    update(deltaTime) {
        if (this.smoothMovement) {
            this.updateSmoothMovement(deltaTime);
            this.updateSmoothCamera(deltaTime);
        } else {
            this.updateDirectMovement(deltaTime);
        }
    }
    
    updateSmoothMovement(deltaTime) {
        // Calculate target movement
        this.targetMovement.set(0, 0, 0);
        
        if (this.isActionPressed('forward')) this.targetMovement.z -= 1;
        if (this.isActionPressed('backward')) this.targetMovement.z += 1;
        if (this.isActionPressed('left')) this.targetMovement.x -= 1;
        if (this.isActionPressed('right')) this.targetMovement.x += 1;
        
        // Normalize diagonal movement
        if (this.targetMovement.length() > 0) {
            this.targetMovement.normalize();
        }
        
        // Smooth interpolation
        this.currentMovement.lerp(this.targetMovement, this.movementSmoothing);
        
        // Apply movement to player
        this.applyMovementToPlayer(this.currentMovement, deltaTime);
    }
    
    updateDirectMovement(deltaTime) {
        const movement = new THREE.Vector3();
        
        if (this.isActionPressed('forward')) movement.z -= 1;
        if (this.isActionPressed('backward')) movement.z += 1;
        if (this.isActionPressed('left')) movement.x -= 1;
        if (this.isActionPressed('right')) movement.x += 1;
        
        if (movement.length() > 0) {
            movement.normalize();
        }
        
        this.applyMovementToPlayer(movement, deltaTime);
    }
    
    updateSmoothCamera(deltaTime) {
        // Smooth camera rotation
        this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * this.cameraSmoothing;
        this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * this.cameraSmoothing;
        
        this.game.player.rotation.copy(this.currentRotation);
    }
    
    applyMovementToPlayer(movement, deltaTime) {
        // Apply camera rotation to movement
        movement.applyQuaternion(this.game.camera.quaternion);
        movement.y = 0; // Keep horizontal
        
        // Determine speed
        let speed = this.game.player.speed;
        
        if (this.game.player.isFlying) {
            speed = this.game.player.flySpeed;
        } else if (this.isActionPressed('sprint') || this.game.player.isSprinting) {
            speed = this.game.player.speed * 1.3;
        }
        
        if (this.isActionPressed('sneak')) {
            speed *= 0.3;
        }
        
        movement.multiplyScalar(speed * deltaTime);
        
        // Vertical movement for flying
        if (this.game.player.isFlying) {
            if (this.isActionPressed('jump')) {
                movement.y += speed * deltaTime;
            }
            if (this.isActionPressed('sneak')) {
                movement.y -= speed * deltaTime;
            }
        } else {
            // Jumping
            if (this.isActionPressed('jump') && this.game.player.isOnGround) {
                this.game.player.velocity.y = this.game.player.jumpPower;
                this.game.player.isOnGround = false;
            }
        }
        
        // Apply movement
        this.game.player.position.add(movement);
    }
    
    // Mouse action handlers
    handleLeftClick() {
        this.game.breakBlock();
    }
    
    handleLeftClickRelease() {
        // Stop breaking block
    }
    
    handleRightClick() {
        this.game.placeBlock();
    }
    
    handleMiddleClick() {
        this.game.pickBlock();
    }
    
    handleMouseWheel(direction) {
        this.game.selectedBlock += direction;
        if (this.game.selectedBlock > 9) this.game.selectedBlock = 1;
        if (this.game.selectedBlock < 1) this.game.selectedBlock = 9;
        this.game.updateHotbar();
    }
    
    // UI action handlers
    selectHotbarSlot(slot) {
        this.game.selectedBlock = slot;
        this.game.updateHotbar();
    }
    
    toggleInventory() {
        // TODO: Implement inventory toggle
        console.log('Toggle inventory');
    }
    
    dropItem() {
        // TODO: Implement item dropping
        console.log('Drop item');
    }
    
    openChat() {
        // TODO: Implement chat
        console.log('Open chat');
    }
    
    // Settings
    setSensitivity(sensitivity) {
        this.mouseSensitivity = Math.max(0.0001, Math.min(0.01, sensitivity));
    }
    
    setInvertY(invert) {
        this.invertY = invert;
    }
    
    setSmoothMovement(smooth) {
        this.smoothMovement = smooth;
    }
    
    // Key binding customization
    setKeyBinding(action, keys) {
        if (Array.isArray(keys)) {
            this.keyBindings[action] = keys;
        } else {
            this.keyBindings[action] = [keys];
        }
    }
    
    getKeyBinding(action) {
        return this.keyBindings[action] || [];
    }
    
    // Save/load settings
    saveSettings() {
        const settings = {
            mouseSensitivity: this.mouseSensitivity,
            invertY: this.invertY,
            smoothMovement: this.smoothMovement,
            keyBindings: this.keyBindings
        };
        
        localStorage.setItem('voxelcraft_controls', JSON.stringify(settings));
    }
    
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('voxelcraft_controls'));
            if (settings) {
                this.mouseSensitivity = settings.mouseSensitivity || this.mouseSensitivity;
                this.invertY = settings.invertY || this.invertY;
                this.smoothMovement = settings.smoothMovement !== undefined ? settings.smoothMovement : this.smoothMovement;
                this.keyBindings = { ...this.keyBindings, ...settings.keyBindings };
            }
        } catch (error) {
            console.warn('Failed to load control settings:', error);
        }
    }
}

// Export for use in main game
window.ImprovedControls = ImprovedControls;