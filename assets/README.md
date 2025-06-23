# Assets Folder

This folder is where you should place your extracted Minecraft assets.

## Expected Structure

```
assets/
├── textures/
│   ├── block/
│   │   ├── grass_block_top.png
│   │   ├── grass_block_side.png
│   │   ├── dirt.png
│   │   ├── stone.png
│   │   ├── cobblestone.png
│   │   ├── sand.png
│   │   ├── gravel.png
│   │   ├── oak_log.png
│   │   ├── oak_log_top.png
│   │   ├── oak_planks.png
│   │   ├── oak_leaves.png
│   │   ├── coal_ore.png
│   │   ├── iron_ore.png
│   │   ├── gold_ore.png
│   │   ├── diamond_ore.png
│   │   ├── emerald_ore.png
│   │   ├── redstone_ore.png
│   │   ├── lapis_ore.png
│   │   ├── bedrock.png
│   │   ├── obsidian.png
│   │   ├── water_still.png
│   │   └── lava_still.png
│   └── item/
│       ├── wooden_pickaxe.png
│       ├── stone_pickaxe.png
│       ├── iron_pickaxe.png
│       └── diamond_pickaxe.png
└── sounds/ (optional)
    ├── block/
    └── ambient/
```

## How to Extract Minecraft Assets

1. **From Minecraft Java Edition:**
   - Navigate to your Minecraft installation folder
   - Find the version jar file (e.g., `1.18.2.jar`)
   - Extract it using any zip tool
   - Copy the `assets/minecraft/textures/` folder to this location

2. **From Minecraft Resource Packs:**
   - Download any resource pack
   - Extract the zip file
   - Copy the texture files to the appropriate folders

3. **Manual Setup:**
   - Simply copy your extracted Minecraft texture files into the corresponding folders
   - Make sure the file names match the expected names in `asset_loader.js`

## Performance Notes

- The game will automatically fall back to procedural textures if assets aren't found
- For best performance, use 16x16 pixel textures (Minecraft's default)
- PNG format is recommended
- The asset loader will automatically configure textures for pixel-perfect rendering

## Customization

You can modify the texture mappings in `asset_loader.js` to use different file names or add new textures.

## Legal Notice

Make sure you have the right to use any Minecraft assets. This is for educational/personal use only.