# VoxelCraftJS

A high-performance, extensible Minecraft-inspired voxel sandbox game built in JavaScript using Three.js.

## Features

### 🌍 World Generation
- Procedural infinite terrain using Simplex noise
- Multiple biomes (Plains, Forest, Desert, Mountains, Ocean)
- Cave systems and underground structures
- Ore distribution (Coal, Iron, Gold, Diamond, Emerald, Redstone, Lapis)
- Tree generation with biome-specific logic
- Village generation

### 🛠️ Blocks & Tools
- Complete block system with 20+ block types
- Tool system with different materials and efficiency
- Block breaking mechanics with proper tool requirements
- Realistic mining times based on tool and block type

### 🎮 Game Modes
- **Survival Mode**: Health, hunger, crafting, and mob combat
- **Creative Mode**: Infinite blocks, flight, no damage
- **Spectator Mode**: Free camera, no collision, exploration

### 🏗️ Core Systems
- Advanced chunk loading and management
- Optimized mesh generation with culling
- Inventory system with drag-drop UI
- Block placement/removal with raycasting
- Real-time coordinates and HUD
- Save/load world functionality

### 🌊 Physics & Environment
- Realistic player physics with collision detection
- Water and lava fluid simulation
- Gravity for falling blocks (sand, gravel)
- Day/night cycle with dynamic lighting
- Weather system (rain, thunder, clear)

### 👨‍🌾 Villages & NPCs
- Procedurally generated villages
- Villager AI with pathfinding
- Farming mechanics and crop growth
- Basic trading system

### 🧟 Mobs & Combat
- Peaceful mobs (cows, pigs, chickens, sheep)
- Hostile mobs (zombies, skeletons, creepers)
- Intelligent mob spawning based on light levels
- Basic AI with roaming and attacking behaviors

### 🌋 Dimensions
- Nether dimension with portal mechanics
- Unique Nether terrain and blocks
- Dimension-specific mobs and resources

## Technology Stack

- **JavaScript (ES6+)**: Modern JavaScript with modules
- **Three.js**: 3D rendering and graphics
- **HTML5 Canvas**: Rendering surface
- **Web Workers**: Background chunk generation (planned)
- **LocalStorage/IndexedDB**: World persistence
- **Simplex Noise**: Procedural terrain generation

## Project Structure

```
voxelcraftjs/
├── index.html              # Main HTML file
├── styles/
│   └── main.css            # Game styling
├── js/
│   └── main.js             # Entry point
├── engine/                 # Core engine systems
│   ├── Game.js             # Main game loop
│   ├── Renderer.js         # Three.js rendering
│   ├── TextureAtlas.js     # Texture management
│   └── InputManager.js     # Input handling
├── world/                  # World generation & management
│   ├── World.js            # World container
│   ├── TerrainGenerator.js # Procedural generation
│   ├── Chunk.js            # Chunk data structure
│   ├── ChunkManager.js     # Chunk loading/unloading
│   ├── ChunkMeshBuilder.js # Mesh generation
│   ├── SimplexNoise.js     # Noise generation
│   └── WorldManager.js     # World persistence
├── entities/               # Player and mob systems
│   ├── Player.js           # Player controller
│   └── Inventory.js        # Inventory management
├── blocks/                 # Block system
│   └── BlockRegistry.js    # Block definitions
├── ui/                     # User interface
│   └── UI.js               # HUD and menus
├── logic/                  # Game logic
│   └── GameLogic.js        # Game rules and mechanics
└── assets/                 # Game assets (textures, sounds)
```

## Getting Started

### Prerequisites
- Modern web browser with WebGL support
- Python 3 (for development server)

### Installation

1. Clone or download the project
2. Navigate to the project directory
3. Start the development server:

```bash
npm start
# or
python3 -m http.server 12000
```

4. Open your browser and navigate to `http://localhost:12000`

### Controls

- **WASD**: Move
- **Mouse**: Look around
- **Space**: Jump
- **Shift**: Sneak
- **Ctrl**: Sprint
- **F**: Toggle flying (Creative mode)
- **E**: Open inventory
- **Esc**: Pause menu
- **1-9**: Select hotbar slot
- **Mouse Wheel**: Scroll hotbar
- **Left Click**: Break blocks
- **Right Click**: Place blocks
- **Middle Click**: Pick block

## Game Modes

### Survival Mode
- Limited resources and health
- Hunger system affects regeneration
- Mobs spawn and can damage player
- Crafting required for advanced items
- Death results in item loss

### Creative Mode
- Infinite blocks and resources
- Flight enabled
- No damage or hunger
- Instant block breaking
- Access to all items

### Spectator Mode
- No collision with blocks
- Free camera movement
- No interaction with world
- Exploration and observation only

## World Generation

The game uses advanced procedural generation:

- **Simplex Noise**: Multiple octaves for realistic terrain
- **Biome System**: Temperature and humidity-based biome selection
- **Cave Generation**: 3D noise for complex cave systems
- **Ore Distribution**: Realistic ore placement by depth
- **Structure Generation**: Villages, trees, and other features

## Performance Optimization

- **Chunk-based Loading**: Only loads chunks around the player
- **Mesh Culling**: Only renders visible faces
- **Level of Detail**: Distant chunks use simplified meshes
- **Background Generation**: Chunks generate without blocking gameplay
- **Memory Management**: Automatic cleanup of distant chunks

## Customization

The game is designed to be highly extensible:

- **Block System**: Easy to add new block types
- **Biome System**: Configurable biome generation
- **Mob AI**: Modular AI system for different behaviors
- **Game Rules**: Customizable game mechanics
- **Texture System**: Support for texture packs

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires WebGL 1.0 support and ES6 module support.

## Performance Tips

- Lower render distance for better performance
- Disable shadows on slower devices
- Use fullscreen mode for better frame rates
- Close other browser tabs while playing

## Known Limitations

- No multiplayer support (single-player only)
- Limited to browser storage capacity
- No mod support (planned for future)
- Simplified physics compared to Minecraft

## Future Enhancements

- Multiplayer support via WebRTC
- Advanced redstone mechanics
- More complex mob AI
- Biome-specific structures
- Shader support for better graphics
- Mobile device support
- Mod API and plugin system

## Contributing

This is a demonstration project showcasing modern web game development techniques. Feel free to fork and extend it for your own projects.

## License

MIT License - feel free to use this code for learning and development.

## Credits

- Inspired by Minecraft by Mojang Studios
- Built with Three.js
- Uses Simplex noise algorithm
- Procedural generation techniques from various sources

---

**Note**: This is a educational/demonstration project and is not affiliated with or endorsed by Mojang Studios or Microsoft.