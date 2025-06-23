export class WorldManager {
    constructor() {
        this.worlds = new Map();
        this.currentWorld = null;
        this.storageKey = 'voxelcraft_worlds';
        
        this.init();
    }

    init() {
        this.loadWorldList();
        console.log('WorldManager initialized');
    }

    // World creation
    createWorld(name, seed, gameMode = 'survival') {
        if (this.worlds.has(name)) {
            throw new Error(`World "${name}" already exists`);
        }

        const worldData = {
            name: name,
            seed: seed || this.generateSeed(),
            gameMode: gameMode,
            created: Date.now(),
            lastPlayed: Date.now(),
            playTime: 0,
            version: '1.0.0'
        };

        this.worlds.set(name, worldData);
        this.saveWorldList();
        
        console.log(`Created world: ${name}`);
        return worldData;
    }

    // World loading
    loadWorld(name) {
        const worldData = this.worlds.get(name);
        if (!worldData) {
            throw new Error(`World "${name}" not found`);
        }

        // Update last played time
        worldData.lastPlayed = Date.now();
        this.saveWorldList();

        this.currentWorld = worldData;
        console.log(`Loaded world: ${name}`);
        return worldData;
    }

    // World deletion
    deleteWorld(name) {
        if (!this.worlds.has(name)) {
            throw new Error(`World "${name}" not found`);
        }

        // Delete world data from storage
        const worldKey = `voxelcraft_world_${name}`;
        try {
            localStorage.removeItem(worldKey);
        } catch (error) {
            console.warn('Failed to delete world data:', error);
        }

        // Remove from world list
        this.worlds.delete(name);
        this.saveWorldList();

        console.log(`Deleted world: ${name}`);
    }

    // World duplication
    duplicateWorld(originalName, newName) {
        const originalWorld = this.worlds.get(originalName);
        if (!originalWorld) {
            throw new Error(`World "${originalName}" not found`);
        }

        if (this.worlds.has(newName)) {
            throw new Error(`World "${newName}" already exists`);
        }

        // Copy world data
        const newWorldData = {
            ...originalWorld,
            name: newName,
            created: Date.now(),
            lastPlayed: Date.now(),
            playTime: 0
        };

        // Copy world save data if it exists
        const originalWorldKey = `voxelcraft_world_${originalName}`;
        const newWorldKey = `voxelcraft_world_${newName}`;
        
        try {
            const originalSaveData = localStorage.getItem(originalWorldKey);
            if (originalSaveData) {
                const saveData = JSON.parse(originalSaveData);
                saveData.name = newName;
                localStorage.setItem(newWorldKey, JSON.stringify(saveData));
            }
        } catch (error) {
            console.warn('Failed to copy world save data:', error);
        }

        this.worlds.set(newName, newWorldData);
        this.saveWorldList();

        console.log(`Duplicated world: ${originalName} -> ${newName}`);
        return newWorldData;
    }

    // World renaming
    renameWorld(oldName, newName) {
        const worldData = this.worlds.get(oldName);
        if (!worldData) {
            throw new Error(`World "${oldName}" not found`);
        }

        if (this.worlds.has(newName)) {
            throw new Error(`World "${newName}" already exists`);
        }

        // Update world data
        worldData.name = newName;
        
        // Move save data
        const oldWorldKey = `voxelcraft_world_${oldName}`;
        const newWorldKey = `voxelcraft_world_${newName}`;
        
        try {
            const saveData = localStorage.getItem(oldWorldKey);
            if (saveData) {
                const parsedData = JSON.parse(saveData);
                parsedData.name = newName;
                localStorage.setItem(newWorldKey, JSON.stringify(parsedData));
                localStorage.removeItem(oldWorldKey);
            }
        } catch (error) {
            console.warn('Failed to move world save data:', error);
        }

        // Update world list
        this.worlds.delete(oldName);
        this.worlds.set(newName, worldData);
        this.saveWorldList();

        console.log(`Renamed world: ${oldName} -> ${newName}`);
        return worldData;
    }

    // World listing and info
    getWorldList() {
        return Array.from(this.worlds.values()).sort((a, b) => b.lastPlayed - a.lastPlayed);
    }

    getWorldInfo(name) {
        const worldData = this.worlds.get(name);
        if (!worldData) {
            return null;
        }

        // Get additional info from save data
        const worldKey = `voxelcraft_world_${name}`;
        let saveInfo = {};
        
        try {
            const saveData = localStorage.getItem(worldKey);
            if (saveData) {
                const parsed = JSON.parse(saveData);
                saveInfo = {
                    hasPlayerData: !!parsed.playerData,
                    hasWorldData: !!parsed.worldData,
                    saveSize: new Blob([saveData]).size,
                    timestamp: parsed.timestamp
                };
            }
        } catch (error) {
            console.warn('Failed to get world save info:', error);
        }

        return {
            ...worldData,
            ...saveInfo
        };
    }

    worldExists(name) {
        return this.worlds.has(name);
    }

    getWorldCount() {
        return this.worlds.size;
    }

    // Seed generation
    generateSeed() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let seed = '';
        for (let i = 0; i < 8; i++) {
            seed += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return seed;
    }

    // World validation
    validateWorldName(name) {
        if (!name || typeof name !== 'string') {
            return 'World name must be a non-empty string';
        }

        if (name.length < 1 || name.length > 50) {
            return 'World name must be between 1 and 50 characters';
        }

        if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
            return 'World name can only contain letters, numbers, spaces, hyphens, and underscores';
        }

        if (this.worlds.has(name)) {
            return 'A world with this name already exists';
        }

        return null; // Valid
    }

    validateSeed(seed) {
        if (!seed) {
            return null; // Empty seed is valid (will be auto-generated)
        }

        if (typeof seed !== 'string') {
            return 'Seed must be a string';
        }

        if (seed.length > 100) {
            return 'Seed must be 100 characters or less';
        }

        return null; // Valid
    }

    // Storage management
    loadWorldList() {
        try {
            const worldListData = localStorage.getItem(this.storageKey);
            if (worldListData) {
                const worldList = JSON.parse(worldListData);
                this.worlds.clear();
                
                for (const worldData of worldList) {
                    this.worlds.set(worldData.name, worldData);
                }
                
                console.log(`Loaded ${this.worlds.size} worlds`);
            }
        } catch (error) {
            console.error('Failed to load world list:', error);
            this.worlds.clear();
        }
    }

    saveWorldList() {
        try {
            const worldList = Array.from(this.worlds.values());
            localStorage.setItem(this.storageKey, JSON.stringify(worldList));
        } catch (error) {
            console.error('Failed to save world list:', error);
        }
    }

    // Storage cleanup
    cleanupOrphanedSaves() {
        const validWorldNames = new Set(this.worlds.keys());
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('voxelcraft_world_')) {
                const worldName = key.replace('voxelcraft_world_', '');
                if (!validWorldNames.has(worldName)) {
                    keysToRemove.push(key);
                }
            }
        }
        
        for (const key of keysToRemove) {
            localStorage.removeItem(key);
            console.log(`Removed orphaned save: ${key}`);
        }
        
        return keysToRemove.length;
    }

    // Storage statistics
    getStorageStats() {
        let totalSize = 0;
        let worldCount = 0;
        const worldSizes = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = new Blob([value]).size;
            totalSize += size;
            
            if (key.startsWith('voxelcraft_world_')) {
                const worldName = key.replace('voxelcraft_world_', '');
                worldSizes[worldName] = size;
                worldCount++;
            }
        }
        
        return {
            totalSize,
            worldCount,
            worldSizes,
            availableSpace: this.getAvailableStorage()
        };
    }

    getAvailableStorage() {
        try {
            // Test storage capacity
            const testKey = 'voxelcraft_storage_test';
            const testData = 'x'.repeat(1024); // 1KB test
            let availableSpace = 0;
            
            for (let i = 0; i < 10000; i++) { // Test up to ~10MB
                try {
                    localStorage.setItem(testKey, testData.repeat(i));
                    availableSpace = i * 1024;
                } catch (e) {
                    break;
                }
            }
            
            localStorage.removeItem(testKey);
            return availableSpace;
        } catch (error) {
            return 0;
        }
    }

    // Import/Export
    exportWorld(name) {
        const worldData = this.worlds.get(name);
        if (!worldData) {
            throw new Error(`World "${name}" not found`);
        }

        const worldKey = `voxelcraft_world_${name}`;
        const saveData = localStorage.getItem(worldKey);
        
        const exportData = {
            worldInfo: worldData,
            saveData: saveData ? JSON.parse(saveData) : null,
            exportedAt: Date.now(),
            version: '1.0.0'
        };

        return JSON.stringify(exportData);
    }

    importWorld(importData, newName = null) {
        let parsedData;
        
        try {
            parsedData = JSON.parse(importData);
        } catch (error) {
            throw new Error('Invalid import data format');
        }

        if (!parsedData.worldInfo || !parsedData.saveData) {
            throw new Error('Import data is missing required fields');
        }

        const worldName = newName || parsedData.worldInfo.name;
        
        if (this.worlds.has(worldName)) {
            throw new Error(`World "${worldName}" already exists`);
        }

        // Create world entry
        const worldData = {
            ...parsedData.worldInfo,
            name: worldName,
            created: Date.now(),
            lastPlayed: Date.now(),
            playTime: 0
        };

        // Save world data
        const worldKey = `voxelcraft_world_${worldName}`;
        const saveData = {
            ...parsedData.saveData,
            name: worldName
        };
        
        localStorage.setItem(worldKey, JSON.stringify(saveData));
        
        this.worlds.set(worldName, worldData);
        this.saveWorldList();

        console.log(`Imported world: ${worldName}`);
        return worldData;
    }

    // Backup and restore
    createBackup(name) {
        const worldData = this.worlds.get(name);
        if (!worldData) {
            throw new Error(`World "${name}" not found`);
        }

        const backupName = `${name}_backup_${Date.now()}`;
        return this.duplicateWorld(name, backupName);
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatPlayTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Cleanup
    destroy() {
        this.worlds.clear();
        this.currentWorld = null;
        console.log('WorldManager destroyed');
    }
}