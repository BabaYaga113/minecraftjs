export class GameLogic {
    constructor(game, gameMode) {
        this.game = game;
        this.gameMode = gameMode;
        
        // Game state
        this.isPaused = false;
        this.gameTime = 0;
        this.dayCount = 0;
        
        // Difficulty settings
        this.difficulty = 'normal'; // peaceful, easy, normal, hard
        this.mobSpawning = true;
        this.hungerEnabled = true;
        this.damageEnabled = true;
        
        // Game rules
        this.rules = {
            doDaylightCycle: true,
            doMobSpawning: true,
            doFireTick: true,
            doWeatherCycle: true,
            keepInventory: false,
            mobGriefing: true,
            naturalRegeneration: true,
            showDeathMessages: true
        };
        
        // Mob spawning
        this.mobSpawnTimer = 0;
        this.mobSpawnInterval = 5; // seconds
        this.maxMobsPerChunk = 4;
        
        // Weather system
        this.weather = {
            type: 'clear', // clear, rain, thunder
            intensity: 0,
            duration: 0,
            nextWeatherChange: 0
        };
        
        this.init();
    }

    init() {
        // Set game rules based on game mode
        this.applyGameModeRules();
        
        // Initialize weather
        this.initWeather();
        
        console.log(`GameLogic initialized for ${this.gameMode} mode`);
    }

    applyGameModeRules() {
        switch (this.gameMode) {
            case 'creative':
                this.damageEnabled = false;
                this.hungerEnabled = false;
                this.rules.doMobSpawning = false;
                this.mobSpawning = false;
                break;
                
            case 'spectator':
                this.damageEnabled = false;
                this.hungerEnabled = false;
                this.rules.doMobSpawning = false;
                this.mobSpawning = false;
                break;
                
            case 'survival':
                this.damageEnabled = true;
                this.hungerEnabled = true;
                this.rules.doMobSpawning = true;
                this.mobSpawning = true;
                break;
                
            default:
                // Default to survival
                this.gameMode = 'survival';
                this.applyGameModeRules();
                break;
        }
    }

    initWeather() {
        this.weather.type = 'clear';
        this.weather.intensity = 0;
        this.weather.duration = 0;
        this.weather.nextWeatherChange = this.gameTime + (Math.random() * 600 + 300); // 5-15 minutes
    }

    update(deltaTime) {
        if (this.isPaused) return;
        
        this.gameTime += deltaTime;
        
        // Update day/night cycle
        if (this.rules.doDaylightCycle) {
            this.updateDayNightCycle();
        }
        
        // Update weather
        if (this.rules.doWeatherCycle) {
            this.updateWeather(deltaTime);
        }
        
        // Update mob spawning
        if (this.rules.doMobSpawning && this.mobSpawning) {
            this.updateMobSpawning(deltaTime);
        }
        
        // Update game-specific logic
        this.updateGameModeLogic(deltaTime);
    }

    updateDayNightCycle() {
        const timeOfDay = this.game.world.getTimeOfDay();
        
        // Update renderer lighting
        if (this.game.renderer) {
            this.game.renderer.updateTimeOfDay(timeOfDay);
        }
        
        // Check for new day
        const currentDay = Math.floor(this.gameTime / this.game.world.dayLength);
        if (currentDay > this.dayCount) {
            this.dayCount = currentDay;
            this.onNewDay();
        }
    }

    updateWeather(deltaTime) {
        // Check if weather should change
        if (this.gameTime >= this.weather.nextWeatherChange) {
            this.changeWeather();
        }
        
        // Update weather effects
        if (this.weather.type !== 'clear') {
            this.weather.duration -= deltaTime;
            
            if (this.weather.duration <= 0) {
                this.weather.type = 'clear';
                this.weather.intensity = 0;
            }
        }
        
        // Apply weather effects
        this.applyWeatherEffects();
    }

    changeWeather() {
        const weatherTypes = ['clear', 'rain', 'thunder'];
        const weights = [0.7, 0.25, 0.05]; // 70% clear, 25% rain, 5% thunder
        
        let random = Math.random();
        let selectedWeather = 'clear';
        
        for (let i = 0; i < weatherTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedWeather = weatherTypes[i];
                break;
            }
        }
        
        this.weather.type = selectedWeather;
        this.weather.intensity = selectedWeather === 'clear' ? 0 : Math.random() * 0.5 + 0.5;
        this.weather.duration = selectedWeather === 'clear' ? 0 : Math.random() * 300 + 60; // 1-6 minutes
        this.weather.nextWeatherChange = this.gameTime + (Math.random() * 600 + 300);
        
        console.log(`Weather changed to: ${selectedWeather}`);
    }

    applyWeatherEffects() {
        // TODO: Implement weather effects
        // - Rain: reduce visibility, extinguish fires, fill cauldrons
        // - Thunder: lightning strikes, mob spawning changes
        // - Snow: in cold biomes, accumulate snow layers
    }

    updateMobSpawning(deltaTime) {
        this.mobSpawnTimer += deltaTime;
        
        if (this.mobSpawnTimer >= this.mobSpawnInterval) {
            this.mobSpawnTimer = 0;
            this.attemptMobSpawn();
        }
    }

    attemptMobSpawn() {
        const player = this.game.player;
        if (!player) return;
        
        const playerChunkX = Math.floor(player.position.x / this.game.world.chunkSize);
        const playerChunkZ = Math.floor(player.position.z / this.game.world.chunkSize);
        
        // Try to spawn mobs in chunks around the player
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -4; dz <= 4; dz++) {
                const chunkX = playerChunkX + dx;
                const chunkZ = playerChunkZ + dz;
                
                // Skip chunks too close to player
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance < 2) continue;
                
                this.spawnMobsInChunk(chunkX, chunkZ);
            }
        }
    }

    spawnMobsInChunk(chunkX, chunkZ) {
        const chunk = this.game.world.getChunk(chunkX, chunkZ);
        if (!chunk) return;
        
        // Count existing mobs in chunk
        const existingMobs = this.game.world.mobs.filter(mob => {
            const mobChunkX = Math.floor(mob.position.x / this.game.world.chunkSize);
            const mobChunkZ = Math.floor(mob.position.z / this.game.world.chunkSize);
            return mobChunkX === chunkX && mobChunkZ === chunkZ;
        });
        
        if (existingMobs.length >= this.maxMobsPerChunk) {
            return; // Chunk already has enough mobs
        }
        
        // Attempt to spawn a mob
        const spawnAttempts = 3;
        for (let i = 0; i < spawnAttempts; i++) {
            const x = chunkX * this.game.world.chunkSize + Math.random() * this.game.world.chunkSize;
            const z = chunkZ * this.game.world.chunkSize + Math.random() * this.game.world.chunkSize;
            
            // Find suitable Y coordinate
            const y = this.findSpawnHeight(x, z);
            if (y !== -1) {
                this.spawnMob(x, y, z);
                break;
            }
        }
    }

    findSpawnHeight(x, z) {
        // Find the highest solid block
        for (let y = this.game.world.worldHeight - 1; y >= 0; y--) {
            const blockType = this.game.world.getBlock(Math.floor(x), y, Math.floor(z));
            if (blockType !== 0) { // Found solid block
                // Check if there's space above for mob
                const above1 = this.game.world.getBlock(Math.floor(x), y + 1, Math.floor(z));
                const above2 = this.game.world.getBlock(Math.floor(x), y + 2, Math.floor(z));
                
                if (above1 === 0 && above2 === 0) {
                    return y + 1;
                }
                break;
            }
        }
        return -1;
    }

    spawnMob(x, y, z) {
        // Determine mob type based on conditions
        const isNight = this.game.world.isNight();
        const lightLevel = 15; // TODO: Get actual light level
        
        let mobType = 'pig'; // Default to peaceful mob
        
        if (isNight && lightLevel < 7) {
            // Spawn hostile mobs at night in dark areas
            const hostileMobs = ['zombie', 'skeleton', 'creeper', 'spider'];
            mobType = hostileMobs[Math.floor(Math.random() * hostileMobs.length)];
        } else {
            // Spawn peaceful mobs during day
            const peacefulMobs = ['pig', 'cow', 'chicken', 'sheep'];
            mobType = peacefulMobs[Math.floor(Math.random() * peacefulMobs.length)];
        }
        
        // TODO: Create actual mob entity
        console.log(`Spawning ${mobType} at ${x.toFixed(1)}, ${y}, ${z.toFixed(1)}`);
    }

    updateGameModeLogic(deltaTime) {
        switch (this.gameMode) {
            case 'survival':
                this.updateSurvivalLogic(deltaTime);
                break;
                
            case 'creative':
                this.updateCreativeLogic(deltaTime);
                break;
                
            case 'spectator':
                this.updateSpectatorLogic(deltaTime);
                break;
        }
    }

    updateSurvivalLogic(deltaTime) {
        // Survival-specific logic
        const player = this.game.player;
        if (!player) return;
        
        // Check for environmental damage
        if (player.isInLava) {
            player.takeDamage(4 * deltaTime);
        }
        
        // Check for fall damage
        if (player.velocity.y < -20 && player.isOnGround) {
            const fallDamage = Math.max(0, Math.abs(player.velocity.y) - 20);
            player.takeDamage(fallDamage);
        }
        
        // Hunger effects
        if (player.hunger <= 6) {
            // Can't sprint when hungry
            player.isSprinting = false;
        }
        
        if (player.hunger <= 0) {
            // Take damage when starving
            player.takeDamage(1 * deltaTime);
        }
    }

    updateCreativeLogic(deltaTime) {
        // Creative mode logic
        const player = this.game.player;
        if (!player) return;
        
        // Ensure player has full health and hunger
        player.health = player.maxHealth;
        player.hunger = player.maxHunger;
        
        // Enable flying
        if (!player.isFlying) {
            player.isFlying = true;
        }
    }

    updateSpectatorLogic(deltaTime) {
        // Spectator mode logic
        const player = this.game.player;
        if (!player) return;
        
        // Disable all damage and needs
        player.health = player.maxHealth;
        player.hunger = player.maxHunger;
        
        // Enable flying and no-clip
        if (!player.isFlying) {
            player.isFlying = true;
        }
    }

    onNewDay() {
        console.log(`Day ${this.dayCount} has begun!`);
        
        // Reset mob spawning timers
        this.mobSpawnTimer = 0;
        
        // Clear weather if it's been going too long
        if (this.weather.type !== 'clear' && this.weather.duration > 300) {
            this.weather.type = 'clear';
            this.weather.intensity = 0;
            this.weather.duration = 0;
        }
    }

    // Game state management
    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    // Difficulty management
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        switch (difficulty) {
            case 'peaceful':
                this.mobSpawning = false;
                this.rules.doMobSpawning = false;
                this.hungerEnabled = false;
                break;
                
            case 'easy':
                this.mobSpawning = true;
                this.rules.doMobSpawning = true;
                this.hungerEnabled = true;
                break;
                
            case 'normal':
                this.mobSpawning = true;
                this.rules.doMobSpawning = true;
                this.hungerEnabled = true;
                break;
                
            case 'hard':
                this.mobSpawning = true;
                this.rules.doMobSpawning = true;
                this.hungerEnabled = true;
                break;
        }
        
        console.log(`Difficulty set to: ${difficulty}`);
    }

    // Game rule management
    setGameRule(rule, value) {
        if (this.rules.hasOwnProperty(rule)) {
            this.rules[rule] = value;
            console.log(`Game rule ${rule} set to: ${value}`);
        }
    }

    getGameRule(rule) {
        return this.rules[rule];
    }

    // Weather control
    setWeather(weatherType, duration = 300) {
        this.weather.type = weatherType;
        this.weather.intensity = weatherType === 'clear' ? 0 : 1;
        this.weather.duration = duration;
        console.log(`Weather set to: ${weatherType}`);
    }

    // Time control
    setTime(timeOfDay) {
        this.game.world.timeOfDay = Math.max(0, Math.min(1, timeOfDay));
    }

    addTime(hours) {
        const timeToAdd = hours / 24; // Convert hours to day fraction
        this.game.world.timeOfDay += timeToAdd;
        if (this.game.world.timeOfDay >= 1) {
            this.game.world.timeOfDay -= 1;
            this.dayCount++;
        }
    }

    // Statistics
    getGameStats() {
        return {
            gameTime: this.gameTime,
            dayCount: this.dayCount,
            gameMode: this.gameMode,
            difficulty: this.difficulty,
            weather: this.weather.type,
            timeOfDay: this.game.world.getTimeOfDay(),
            mobCount: this.game.world.mobs.length,
            loadedChunks: this.game.chunkManager.getLoadedChunkCount()
        };
    }

    // Serialization
    serialize() {
        return {
            gameMode: this.gameMode,
            gameTime: this.gameTime,
            dayCount: this.dayCount,
            difficulty: this.difficulty,
            rules: { ...this.rules },
            weather: { ...this.weather },
            mobSpawning: this.mobSpawning,
            hungerEnabled: this.hungerEnabled,
            damageEnabled: this.damageEnabled
        };
    }

    deserialize(data) {
        this.gameMode = data.gameMode || 'survival';
        this.gameTime = data.gameTime || 0;
        this.dayCount = data.dayCount || 0;
        this.difficulty = data.difficulty || 'normal';
        this.rules = { ...this.rules, ...data.rules };
        this.weather = { ...this.weather, ...data.weather };
        this.mobSpawning = data.mobSpawning !== undefined ? data.mobSpawning : true;
        this.hungerEnabled = data.hungerEnabled !== undefined ? data.hungerEnabled : true;
        this.damageEnabled = data.damageEnabled !== undefined ? data.damageEnabled : true;
    }
}