export class Inventory {
    constructor(player) {
        this.player = player;
        this.size = 36; // 9 hotbar + 27 main inventory
        this.hotbarSize = 9;
        this.selectedSlot = 0;
        
        // Initialize empty inventory
        this.items = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.items[i] = { type: 0, count: 0 }; // 0 = empty/air
        }
    }

    // Basic item management
    getItem(slot) {
        if (slot >= 0 && slot < this.size) {
            return this.items[slot];
        }
        return null;
    }

    setItem(slot, item) {
        if (slot >= 0 && slot < this.size) {
            this.items[slot] = item || { type: 0, count: 0 };
            this.updateUI();
            return true;
        }
        return false;
    }

    removeItem(slot, count = 1) {
        if (slot >= 0 && slot < this.size) {
            const item = this.items[slot];
            if (item && item.count > 0) {
                item.count -= count;
                if (item.count <= 0) {
                    this.items[slot] = { type: 0, count: 0 };
                }
                this.updateUI();
                return true;
            }
        }
        return false;
    }

    // Add item to inventory (finds best slot automatically)
    addItem(itemType, count) {
        if (itemType === 0 || count <= 0) return 0; // Can't add air or negative amounts
        
        let remainingCount = count;
        
        // First, try to stack with existing items
        for (let i = 0; i < this.size && remainingCount > 0; i++) {
            const item = this.items[i];
            if (item.type === itemType && item.count < this.getMaxStackSize(itemType)) {
                const canAdd = Math.min(remainingCount, this.getMaxStackSize(itemType) - item.count);
                item.count += canAdd;
                remainingCount -= canAdd;
            }
        }
        
        // Then, try to add to empty slots
        for (let i = 0; i < this.size && remainingCount > 0; i++) {
            const item = this.items[i];
            if (item.type === 0 || item.count === 0) {
                const canAdd = Math.min(remainingCount, this.getMaxStackSize(itemType));
                this.items[i] = { type: itemType, count: canAdd };
                remainingCount -= canAdd;
            }
        }
        
        this.updateUI();
        return count - remainingCount; // Return how many items were actually added
    }

    // Find item in inventory
    findItem(itemType) {
        for (let i = 0; i < this.size; i++) {
            if (this.items[i].type === itemType && this.items[i].count > 0) {
                return i;
            }
        }
        return -1;
    }

    // Count total items of a type
    countItem(itemType) {
        let total = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.items[i].type === itemType) {
                total += this.items[i].count;
            }
        }
        return total;
    }

    // Check if inventory has enough of an item
    hasItem(itemType, count = 1) {
        return this.countItem(itemType) >= count;
    }

    // Remove specific amount of an item type from inventory
    removeItemType(itemType, count) {
        let remainingToRemove = count;
        
        for (let i = 0; i < this.size && remainingToRemove > 0; i++) {
            const item = this.items[i];
            if (item.type === itemType && item.count > 0) {
                const canRemove = Math.min(remainingToRemove, item.count);
                item.count -= canRemove;
                remainingToRemove -= canRemove;
                
                if (item.count <= 0) {
                    this.items[i] = { type: 0, count: 0 };
                }
            }
        }
        
        this.updateUI();
        return count - remainingToRemove; // Return how many were actually removed
    }

    // Hotbar management
    getSelectedItem() {
        return this.getItem(this.selectedSlot);
    }

    setSelectedSlot(slot) {
        if (slot >= 0 && slot < this.hotbarSize) {
            this.selectedSlot = slot;
            this.updateUI();
        }
    }

    scrollHotbar(direction) {
        this.selectedSlot += direction;
        if (this.selectedSlot >= this.hotbarSize) {
            this.selectedSlot = 0;
        } else if (this.selectedSlot < 0) {
            this.selectedSlot = this.hotbarSize - 1;
        }
        this.updateUI();
    }

    // Inventory operations
    swapItems(slot1, slot2) {
        if (slot1 >= 0 && slot1 < this.size && slot2 >= 0 && slot2 < this.size) {
            const temp = this.items[slot1];
            this.items[slot1] = this.items[slot2];
            this.items[slot2] = temp;
            this.updateUI();
            return true;
        }
        return false;
    }

    moveItem(fromSlot, toSlot, count = null) {
        if (fromSlot < 0 || fromSlot >= this.size || toSlot < 0 || toSlot >= this.size) {
            return false;
        }
        
        const fromItem = this.items[fromSlot];
        const toItem = this.items[toSlot];
        
        if (!fromItem || fromItem.count <= 0) {
            return false;
        }
        
        const moveCount = count || fromItem.count;
        
        // If target slot is empty
        if (!toItem || toItem.type === 0 || toItem.count === 0) {
            this.items[toSlot] = { type: fromItem.type, count: moveCount };
            fromItem.count -= moveCount;
            
            if (fromItem.count <= 0) {
                this.items[fromSlot] = { type: 0, count: 0 };
            }
        }
        // If items are the same type, try to stack
        else if (toItem.type === fromItem.type) {
            const maxStack = this.getMaxStackSize(fromItem.type);
            const canMove = Math.min(moveCount, maxStack - toItem.count);
            
            if (canMove > 0) {
                toItem.count += canMove;
                fromItem.count -= canMove;
                
                if (fromItem.count <= 0) {
                    this.items[fromSlot] = { type: 0, count: 0 };
                }
            }
        }
        // Different items, swap them
        else {
            this.swapItems(fromSlot, toSlot);
        }
        
        this.updateUI();
        return true;
    }

    // Clear inventory
    clear() {
        for (let i = 0; i < this.size; i++) {
            this.items[i] = { type: 0, count: 0 };
        }
        this.selectedSlot = 0;
        this.updateUI();
    }

    // Check if inventory is full
    isFull() {
        for (let i = 0; i < this.size; i++) {
            const item = this.items[i];
            if (item.type === 0 || item.count === 0) {
                return false;
            }
        }
        return true;
    }

    // Get empty slot count
    getEmptySlotCount() {
        let count = 0;
        for (let i = 0; i < this.size; i++) {
            const item = this.items[i];
            if (item.type === 0 || item.count === 0) {
                count++;
            }
        }
        return count;
    }

    // Get first empty slot
    getFirstEmptySlot() {
        for (let i = 0; i < this.size; i++) {
            const item = this.items[i];
            if (item.type === 0 || item.count === 0) {
                return i;
            }
        }
        return -1;
    }

    // Item stack size management
    getMaxStackSize(itemType) {
        // Most blocks stack to 64
        if (typeof itemType === 'number') {
            return 64;
        }
        
        // Tools and special items typically don't stack
        if (typeof itemType === 'string') {
            if (itemType.includes('pickaxe') || itemType.includes('axe') || 
                itemType.includes('shovel') || itemType.includes('sword') ||
                itemType.includes('hoe')) {
                return 1;
            }
        }
        
        return 64; // Default stack size
    }

    // Crafting helpers
    getHotbarItems() {
        return this.items.slice(0, this.hotbarSize);
    }

    getMainInventoryItems() {
        return this.items.slice(this.hotbarSize);
    }

    // Quick actions
    quickMoveToHotbar(slot) {
        if (slot >= this.hotbarSize && slot < this.size) {
            // Find first empty hotbar slot
            for (let i = 0; i < this.hotbarSize; i++) {
                const hotbarItem = this.items[i];
                if (hotbarItem.type === 0 || hotbarItem.count === 0) {
                    this.moveItem(slot, i);
                    return true;
                }
            }
        }
        return false;
    }

    quickMoveToInventory(slot) {
        if (slot >= 0 && slot < this.hotbarSize) {
            // Find first empty inventory slot
            for (let i = this.hotbarSize; i < this.size; i++) {
                const invItem = this.items[i];
                if (invItem.type === 0 || invItem.count === 0) {
                    this.moveItem(slot, i);
                    return true;
                }
            }
        }
        return false;
    }

    // Drop item
    dropItem(slot, count = 1) {
        const item = this.getItem(slot);
        if (item && item.count >= count) {
            // TODO: Create dropped item entity in world
            this.removeItem(slot, count);
            return true;
        }
        return false;
    }

    // Update UI
    updateUI() {
        if (this.player.game.app.ui) {
            this.player.game.app.ui.updateHotbar(this);
            this.player.game.app.ui.updateInventory(this);
        }
    }

    // Serialization
    serialize() {
        return {
            items: this.items.map(item => ({ type: item.type, count: item.count })),
            selectedSlot: this.selectedSlot
        };
    }

    deserialize(data) {
        if (data.items) {
            for (let i = 0; i < Math.min(data.items.length, this.size); i++) {
                this.items[i] = { 
                    type: data.items[i].type || 0, 
                    count: data.items[i].count || 0 
                };
            }
        }
        
        this.selectedSlot = data.selectedSlot || 0;
        this.updateUI();
    }

    // Debug methods
    toString() {
        let result = 'Inventory:\n';
        result += 'Hotbar: ';
        for (let i = 0; i < this.hotbarSize; i++) {
            const item = this.items[i];
            if (item.type !== 0) {
                result += `[${i}:${item.type}x${item.count}] `;
            } else {
                result += `[${i}:empty] `;
            }
        }
        result += '\nMain: ';
        for (let i = this.hotbarSize; i < this.size; i++) {
            const item = this.items[i];
            if (item.type !== 0) {
                result += `[${i}:${item.type}x${item.count}] `;
            }
        }
        return result;
    }

    getItemCount() {
        let count = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.items[i].type !== 0 && this.items[i].count > 0) {
                count++;
            }
        }
        return count;
    }
}