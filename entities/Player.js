import { Inventory } from './Inventory.js';
import { BlockRegistry } from '../blocks/BlockRegistry.js';

export class Player {
    constructor(game, gameMode = 'survival') {
        this.game = game;
        this.gameMode = gameMode;
        
        // Position and movement
        this.position = new THREE.Vector3(0, 100, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.copy(this.position);
        
        // Player properties
        this.health = 20;
        this.maxHealth = 20;
        this.hunger = 20;
        this.maxHunger = 20;
        this.experience = 0;
        this.level = 0;
        
        // Movement settings
        this.walkSpeed = 4.3; // blocks per second
        this.runSpeed = 5.6;
        this.flySpeed = 10.9;
        this.jumpHeight = 1.25; // blocks
        this.gravity = 32; // blocks per second squared
        
        // Player state
        this.isOnGround = false;
        this.isFlying = false;
        this.isSprinting = false;
        this.isSneaking = false;
        this.isInWater = false;
        this.isInLava = false;
        
        // Inventory and tools
        this.inventory = new Inventory(this);
        this.selectedSlot = 0;
        
        // Block interaction
        this.reach = 5; // blocks
        this.breakingBlock = null;
        this.breakingProgress = 0;
        this.breakingTime = 0;
        
        // Physics
        this.boundingBox = {
            width: 0.6,
            height: 1.8,
            depth: 0.6
        };
        
        // Initialize player
        this.init();
    }

    init() {
        // Set spawn position
        const spawnPoint = this.game.world.getSpawnPoint();
        this.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        this.camera.position.copy(this.position);
        
        // Enable flying in creative mode
        if (this.gameMode === 'creative') {
            this.isFlying = true;
        }
        
        // Initialize inventory with basic items
        this.initializeInventory();
        
        console.log(`Player spawned at: ${this.position.x}, ${this.position.y}, ${this.position.z}`);
    }

    initializeInventory() {
        if (this.gameMode === 'creative') {
            // Give player all block types in creative mode
            const blocks = [
                BlockRegistry.blockTypes.GRASS,
                BlockRegistry.blockTypes.DIRT,
                BlockRegistry.blockTypes.STONE,
                BlockRegistry.blockTypes.COBBLESTONE,
                BlockRegistry.blockTypes.SAND,
                BlockRegistry.blockTypes.OAK_LOG,
                BlockRegistry.blockTypes.OAK_PLANKS,
                BlockRegistry.blockTypes.OAK_LEAVES
            ];
            
            for (let i = 0; i < blocks.length && i < 9; i++) {
                this.inventory.setItem(i, { type: blocks[i], count: 64 });
            }
        } else {
            // Survival mode - start with basic tools
            this.inventory.setItem(0, { type: 'wooden_pickaxe', count: 1 });
            this.inventory.setItem(1, { type: 'wooden_axe', count: 1 });
            this.inventory.setItem(2, { type: 'wooden_shovel', count: 1 });
        }
    }

    update(deltaTime) {
        // Get input
        const input = this.game.inputManager.getMovementInput();
        
        // Update movement
        this.updateMovement(input, deltaTime);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update camera
        this.updateCamera();
        
        // Update block breaking
        this.updateBlockBreaking(deltaTime);
        
        // Update health and hunger
        this.updateHealthAndHunger(deltaTime);
        
        // Update UI
        this.updateUI();
    }

    updateMovement(input, deltaTime) {
        // Calculate movement direction
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        
        // Apply camera rotation to movement vectors
        forward.applyQuaternion(this.camera.quaternion);
        right.applyQuaternion(this.camera.quaternion);
        
        // Flatten vectors for horizontal movement
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        // Calculate movement vector
        const movement = new THREE.Vector3();
        movement.addScaledVector(forward, -input.z);
        movement.addScaledVector(right, input.x);
        
        // Determine speed
        let speed = this.walkSpeed;
        if (this.isFlying) {
            speed = this.flySpeed;
        } else if (input.sprint && !input.sneak) {
            speed = this.runSpeed;
            this.isSprinting = true;
        } else {
            this.isSprinting = false;
        }
        
        if (input.sneak) {
            speed *= 0.3; // Slow down when sneaking
            this.isSneaking = true;
        } else {
            this.isSneaking = false;
        }
        
        // Apply movement
        if (movement.length() > 0) {
            movement.normalize();
            movement.multiplyScalar(speed * deltaTime);
            
            if (this.isFlying) {
                // Flying movement
                this.velocity.x = movement.x;
                this.velocity.z = movement.z;
                
                if (input.jump) {
                    this.velocity.y = speed * deltaTime;
                } else if (input.sneak) {
                    this.velocity.y = -speed * deltaTime;
                } else {
                    this.velocity.y = 0;
                }
            } else {
                // Ground movement
                this.velocity.x = movement.x;
                this.velocity.z = movement.z;
            }
        } else {
            // No horizontal input
            this.velocity.x = 0;
            this.velocity.z = 0;
            
            if (this.isFlying && !input.jump && !input.sneak) {
                this.velocity.y = 0;
            }
        }
        
        // Jumping
        if (input.jump && !this.isFlying) {
            if (this.isOnGround) {
                this.velocity.y = Math.sqrt(2 * this.gravity * this.jumpHeight);
                this.isOnGround = false;
            }
        }
    }

    updatePhysics(deltaTime) {
        if (!this.isFlying) {
            // Apply gravity
            this.velocity.y -= this.gravity * deltaTime;
            
            // Terminal velocity
            this.velocity.y = Math.max(this.velocity.y, -50);
        }
        
        // Apply velocity
        const newPosition = this.position.clone();
        newPosition.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Collision detection
        const collisionResult = this.checkCollisions(newPosition);
        
        // Update position based on collision results
        this.position.copy(collisionResult.position);
        this.velocity.copy(collisionResult.velocity);
        this.isOnGround = collisionResult.onGround;
        
        // Check for water/lava
        this.checkFluidCollisions();
        
        // Prevent falling through the world
        if (this.position.y < -10) {
            this.position.y = 100;
            this.velocity.y = 0;
            this.takeDamage(4); // Fall damage
        }
    }

    checkCollisions(newPosition) {
        const result = {
            position: newPosition.clone(),
            velocity: this.velocity.clone(),
            onGround: false
        };
        
        // Simple AABB collision detection
        const halfWidth = this.boundingBox.width / 2;
        const halfDepth = this.boundingBox.depth / 2;
        const height = this.boundingBox.height;
        
        // Check Y collision (vertical)
        const feetY = Math.floor(newPosition.y);
        const headY = Math.floor(newPosition.y + height);
        
        // Check blocks around player
        for (let x = Math.floor(newPosition.x - halfWidth); x <= Math.floor(newPosition.x + halfWidth); x++) {
            for (let z = Math.floor(newPosition.z - halfDepth); z <= Math.floor(newPosition.z + halfDepth); z++) {
                // Check ground collision
                const groundBlock = this.game.world.getBlock(x, feetY, z);
                if (BlockRegistry.isBlockSolid(groundBlock)) {
                    if (this.velocity.y <= 0) {
                        result.position.y = feetY + 1;
                        result.velocity.y = 0;
                        result.onGround = true;
                    }
                }
                
                // Check ceiling collision
                const ceilingBlock = this.game.world.getBlock(x, headY, z);
                if (BlockRegistry.isBlockSolid(ceilingBlock)) {
                    if (this.velocity.y > 0) {
                        result.position.y = headY - height;
                        result.velocity.y = 0;
                    }
                }
                
                // Check horizontal collisions
                const bodyY = Math.floor(newPosition.y + height / 2);
                const bodyBlock = this.game.world.getBlock(x, bodyY, z);
                if (BlockRegistry.isBlockSolid(bodyBlock)) {
                    // Simple horizontal collision - stop movement
                    const blockCenterX = x + 0.5;
                    const blockCenterZ = z + 0.5;
                    const playerCenterX = newPosition.x;
                    const playerCenterZ = newPosition.z;
                    
                    const deltaX = playerCenterX - blockCenterX;
                    const deltaZ = playerCenterZ - blockCenterZ;
                    
                    if (Math.abs(deltaX) > Math.abs(deltaZ)) {
                        // Collision on X axis
                        if (deltaX > 0) {
                            result.position.x = x + 1 + halfWidth;
                        } else {
                            result.position.x = x - halfWidth;
                        }
                        result.velocity.x = 0;
                    } else {
                        // Collision on Z axis
                        if (deltaZ > 0) {
                            result.position.z = z + 1 + halfDepth;
                        } else {
                            result.position.z = z - halfDepth;
                        }
                        result.velocity.z = 0;
                    }
                }
            }
        }
        
        return result;
    }

    checkFluidCollisions() {
        const feetY = Math.floor(this.position.y);
        const x = Math.floor(this.position.x);
        const z = Math.floor(this.position.z);
        
        const blockAtFeet = this.game.world.getBlock(x, feetY, z);
        const blockAtHead = this.game.world.getBlock(x, feetY + 1, z);
        
        this.isInWater = (blockAtFeet === BlockRegistry.blockTypes.WATER || 
                         blockAtHead === BlockRegistry.blockTypes.WATER);
        
        this.isInLava = (blockAtFeet === BlockRegistry.blockTypes.LAVA || 
                        blockAtHead === BlockRegistry.blockTypes.LAVA);
        
        // Apply fluid effects
        if (this.isInWater) {
            // Slow down movement in water
            this.velocity.multiplyScalar(0.8);
            
            // Buoyancy
            if (this.velocity.y < 0) {
                this.velocity.y *= 0.8;
            }
        }
        
        if (this.isInLava) {
            // Take damage from lava
            this.takeDamage(4);
            
            // Slow down movement in lava
            this.velocity.multiplyScalar(0.5);
        }
    }

    updateCamera() {
        // Update camera position
        this.camera.position.copy(this.position);
        this.camera.position.y += this.boundingBox.height * 0.9; // Eye level
        
        // Apply rotation
        this.camera.rotation.copy(this.rotation);
    }

    updateCameraRotation(deltaX, deltaY) {
        // Update rotation based on mouse movement
        this.rotation.y -= deltaX;
        this.rotation.x -= deltaY;
        
        // Clamp vertical rotation
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        // Apply rotation to camera
        this.camera.rotation.set(this.rotation.x, this.rotation.y, 0);
    }

    updateBlockBreaking(deltaTime) {
        if (this.breakingBlock) {
            this.breakingTime += deltaTime;
            
            const blockType = this.game.world.getBlock(
                this.breakingBlock.x,
                this.breakingBlock.y,
                this.breakingBlock.z
            );
            
            const tool = this.getCurrentTool();
            const breakTime = BlockRegistry.getBreakTime(blockType, tool.type, tool.level);
            
            this.breakingProgress = this.breakingTime / breakTime;
            
            if (this.breakingProgress >= 1.0) {
                // Block is broken
                this.finishBreaking();
            }
        }
    }

    updateHealthAndHunger(deltaTime) {
        // Hunger decreases over time
        if (this.gameMode === 'survival') {
            this.hunger -= deltaTime * 0.1; // Lose hunger slowly
            this.hunger = Math.max(0, this.hunger);
            
            // Health regeneration when well-fed
            if (this.hunger > 18 && this.health < this.maxHealth) {
                this.health += deltaTime * 2;
                this.health = Math.min(this.maxHealth, this.health);
            }
            
            // Take damage when starving
            if (this.hunger <= 0) {
                this.takeDamage(deltaTime * 2);
            }
        }
    }

    updateUI() {
        // Update HUD elements
        if (this.game.app.ui) {
            this.game.app.ui.updateHealth(this.health, this.maxHealth);
            this.game.app.ui.updateHunger(this.hunger, this.maxHunger);
            this.game.app.ui.updateHotbar(this.inventory);
        }
    }

    // Block interaction methods
    startBreaking() {
        const raycast = this.raycastBlocks();
        if (raycast.hit) {
            this.breakingBlock = raycast.position;
            this.breakingTime = 0;
            this.breakingProgress = 0;
        }
    }

    stopBreaking() {
        this.breakingBlock = null;
        this.breakingTime = 0;
        this.breakingProgress = 0;
    }

    finishBreaking() {
        if (!this.breakingBlock) return;
        
        const blockType = this.game.world.getBlock(
            this.breakingBlock.x,
            this.breakingBlock.y,
            this.breakingBlock.z
        );
        
        if (blockType !== BlockRegistry.blockTypes.AIR) {
            // Remove block
            this.game.removeBlock(this.breakingBlock);
            
            // Add drops to inventory in survival mode
            if (this.gameMode === 'survival') {
                const tool = this.getCurrentTool();
                const drops = BlockRegistry.getBlockDrops(blockType, tool.type, tool.level);
                
                for (const drop of drops) {
                    this.inventory.addItem(drop.type, drop.count);
                }
            }
        }
        
        this.stopBreaking();
    }

    placeBlock() {
        const raycast = this.raycastBlocks();
        if (raycast.hit && raycast.adjacent) {
            const selectedItem = this.inventory.getSelectedItem();
            if (selectedItem && selectedItem.type !== 0) {
                // Check if the block type is valid
                if (BlockRegistry.getBlock(selectedItem.type)) {
                    const success = this.game.placeBlock(selectedItem.type, raycast.adjacent);
                    
                    if (success && this.gameMode === 'survival') {
                        // Remove item from inventory
                        this.inventory.removeItem(this.inventory.selectedSlot, 1);
                    }
                }
            }
        }
    }

    pickBlock() {
        const raycast = this.raycastBlocks();
        if (raycast.hit) {
            const blockType = raycast.blockType;
            if (blockType !== BlockRegistry.blockTypes.AIR) {
                // Add block to inventory or select it if already present
                const existingSlot = this.inventory.findItem(blockType);
                if (existingSlot !== -1) {
                    this.inventory.setSelectedSlot(existingSlot);
                } else {
                    // Add to first empty slot in hotbar
                    for (let i = 0; i < 9; i++) {
                        const item = this.inventory.getItem(i);
                        if (!item || item.type === 0) {
                            this.inventory.setItem(i, { type: blockType, count: 1 });
                            this.inventory.setSelectedSlot(i);
                            break;
                        }
                    }
                }
            }
        }
    }

    raycastBlocks() {
        const origin = this.camera.position.clone();
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        
        return this.game.raycastBlocks(origin, direction, this.reach);
    }

    getCurrentTool() {
        const selectedItem = this.inventory.getSelectedItem();
        if (selectedItem) {
            // Determine tool type and level from item
            // This is simplified - in a real implementation, you'd have a proper item system
            if (typeof selectedItem.type === 'string') {
                if (selectedItem.type.includes('pickaxe')) {
                    return { type: 'pickaxe', level: this.getToolLevel(selectedItem.type) };
                } else if (selectedItem.type.includes('axe')) {
                    return { type: 'axe', level: this.getToolLevel(selectedItem.type) };
                } else if (selectedItem.type.includes('shovel')) {
                    return { type: 'shovel', level: this.getToolLevel(selectedItem.type) };
                }
            }
        }
        
        return { type: 'hand', level: 0 };
    }

    getToolLevel(toolName) {
        if (toolName.includes('wooden')) return 0;
        if (toolName.includes('stone')) return 1;
        if (toolName.includes('iron')) return 2;
        if (toolName.includes('diamond')) return 3;
        return 0;
    }

    // Player state methods
    toggleFlying() {
        if (this.gameMode === 'creative' || this.gameMode === 'spectator') {
            this.isFlying = !this.isFlying;
            if (this.isFlying) {
                this.velocity.y = 0;
            }
        }
    }

    takeDamage(amount) {
        if (this.gameMode === 'creative' || this.gameMode === 'spectator') {
            return; // No damage in creative/spectator mode
        }
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health += amount;
        this.health = Math.min(this.maxHealth, this.health);
    }

    die() {
        console.log('Player died!');
        
        // Respawn at spawn point
        const spawnPoint = this.game.world.getSpawnPoint();
        this.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        
        // Drop inventory in survival mode
        if (this.gameMode === 'survival') {
            // TODO: Drop items at death location
            this.inventory.clear();
            this.initializeInventory();
        }
    }

    // Serialization
    serialize() {
        return {
            position: this.position.toArray(),
            rotation: [this.rotation.x, this.rotation.y, this.rotation.z],
            health: this.health,
            hunger: this.hunger,
            experience: this.experience,
            level: this.level,
            gameMode: this.gameMode,
            inventory: this.inventory.serialize()
        };
    }

    deserialize(data) {
        this.position.fromArray(data.position);
        this.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
        this.health = data.health || this.maxHealth;
        this.hunger = data.hunger || this.maxHunger;
        this.experience = data.experience || 0;
        this.level = data.level || 0;
        this.gameMode = data.gameMode || 'survival';
        
        if (data.inventory) {
            this.inventory.deserialize(data.inventory);
        }
        
        this.updateCamera();
    }
}