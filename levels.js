
// levels.js
import * as THREE from 'three';

export const levels = {
    level1: {
        name: "Basic Arena",
        playerStart: { x: 0, y: 10, z: 0 },
        objects: [
            // Floor
            { type: 'plane', size: [100, 100], position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], color: 0x808080 },
            // Walls (H-shape)
            { type: 'box', size: [10, 20, 50], position: [-25, 10, 0], color: 0x880000 }, // Left vertical bar
            { type: 'box', size: [10, 20, 50], position: [25, 10, 0], color: 0x880000 },  // Right vertical bar
            { type: 'box', size: [60, 20, 10], position: [0, 10, 0], color: 0x880000 },   // Horizontal connecting bar
            // Some additional blocks
            { type: 'box', size: [5, 5, 5], position: [10, 2.5, -10], color: 0x00ff00 },
            { type: 'box', size: [5, 5, 5], position: [-10, 2.5, -10], color: 0x00ff00 },
            { type: 'box', size: [5, 5, 5], position: [0, 2.5, -20], color: 0x00ff00 },
            // Enemy (blue box)
            { type: 'box', size: [5, 5, 5], position: [0, 2.5, -10], color: 0x0000ff, name: 'enemy' }
        ]
    }
};
