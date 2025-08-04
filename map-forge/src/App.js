import React, { useRef, useEffect, useState } from 'react';
import './App.css';

const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = 20; // Pixels per cell
const MAP_DIMENSION = GRID_SIZE * CELL_SIZE; // Total canvas size
const BLOCK_UNIT = 10; // Corresponds to 10 Three.js units

const TOOL_TYPES = {
  WALL: 'wall',
  EMPTY: 'empty',
  PLAYER_SPAWN: 'playerSpawn',
  ENEMY_SPAWN: 'enemySpawn',
};

const TOOL_COLORS = {
  [TOOL_TYPES.WALL]: '#880000',
  [TOOL_TYPES.EMPTY]: '#ffffff',
  [TOOL_TYPES.PLAYER_SPAWN]: '#0000ff',
  [TOOL_TYPES.ENEMY_SPAWN]: '#00ff00',
};

function App() {
  const canvasRef = useRef(null);
  const [grid, setGrid] = useState(() => {
    const initialGrid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      initialGrid.push(Array(GRID_SIZE).fill(TOOL_TYPES.EMPTY));
    }
    return initialGrid;
  });
  const [activeTool, setActiveTool] = useState(TOOL_TYPES.WALL);
  const [playerSpawn, setPlayerSpawn] = useState(null);
  const [enemySpawn, setEnemySpawn] = useState(null);

  useEffect(() => {
    drawGrid();
  }, [grid, activeTool]);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, MAP_DIMENSION, MAP_DIMENSION);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cellType = grid[row][col];
        context.fillStyle = TOOL_COLORS[cellType];
        context.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        context.strokeStyle = '#ccc';
        context.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw player spawn
    if (playerSpawn) {
      context.fillStyle = TOOL_COLORS[TOOL_TYPES.PLAYER_SPAWN];
      context.fillRect(playerSpawn.col * CELL_SIZE, playerSpawn.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      context.strokeStyle = '#000';
      context.strokeRect(playerSpawn.col * CELL_SIZE, playerSpawn.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    // Draw enemy spawn
    if (enemySpawn) {
      context.fillStyle = TOOL_COLORS[TOOL_TYPES.ENEMY_SPAWN];
      context.fillRect(enemySpawn.col * CELL_SIZE, enemySpawn.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      context.strokeStyle = '#000';
      context.strokeRect(enemySpawn.col * CELL_SIZE, enemySpawn.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  };

  const handleClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    const newGrid = grid.map(arr => arr.slice()); // Create a deep copy

    if (activeTool === TOOL_TYPES.PLAYER_SPAWN) {
      if (playerSpawn) {
        newGrid[playerSpawn.row][playerSpawn.col] = TOOL_TYPES.EMPTY; // Clear previous spawn
      }
      setPlayerSpawn({ row, col });
      newGrid[row][col] = TOOL_TYPES.PLAYER_SPAWN;
    } else if (activeTool === TOOL_TYPES.ENEMY_SPAWN) {
      if (enemySpawn) {
        newGrid[enemySpawn.row][enemySpawn.col] = TOOL_TYPES.EMPTY; // Clear previous spawn
      }
      setEnemySpawn({ row, col });
      newGrid[row][col] = TOOL_TYPES.ENEMY_SPAWN;
    } else {
      newGrid[row][col] = activeTool;
      // If we're placing a wall or empty, clear any spawn points that were there
      if (playerSpawn && playerSpawn.row === row && playerSpawn.col === col) {
        setPlayerSpawn(null);
      }
      if (enemySpawn && enemySpawn.row === row && enemySpawn.col === col) {
        setEnemySpawn(null);
      }
    }
    setGrid(newGrid);
  };

  const exportLevel = () => {
    const levelName = prompt("Enter a name for your level (e.g., level1, my_custom_map):");
    if (!levelName) return;

    const objects = [];
    let playerStart = { x: 0, y: 10, z: 0 }; // Default player start
    let enemyObject = null;

    // Add floor
    objects.push({
      type: 'plane',
      size: [GRID_SIZE * BLOCK_UNIT, GRID_SIZE * BLOCK_UNIT],
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
      color: 0x808080,
    });

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cellType = grid[row][col];
        const x = (col - GRID_SIZE / 2 + 0.5) * BLOCK_UNIT; // Center the map
        const z = (row - GRID_SIZE / 2 + 0.5) * BLOCK_UNIT; // Center the map

        if (cellType === TOOL_TYPES.WALL) {
          objects.push({
            type: 'box',
            size: [BLOCK_UNIT, BLOCK_UNIT * 2, BLOCK_UNIT], // Default wall size
            position: [x, BLOCK_UNIT, z],
            color: 0x880000, // Default wall color
          });
        } else if (cellType === TOOL_TYPES.PLAYER_SPAWN) {
          playerStart = { x: x, y: 10, z: z };
        } else if (cellType === TOOL_TYPES.ENEMY_SPAWN) {
          enemyObject = {
            type: 'box',
            size: [5, 5, 5],
            position: [x, 2.5, z],
            color: 0x0000ff,
            name: 'enemy',
          };
        }
      }
    }

    // Add enemy object if it exists
    if (enemyObject) {
      objects.push(enemyObject);
    }

    const levelData = {
      name: levelName,
      playerStart: playerStart,
      objects: objects,
    };

    const output = JSON.stringify(levelData, null, 2);

    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${levelName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Level '${levelName}' data downloaded! Save this file in your game's 'game_levels' directory.`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Map Forge</h1>
        <div className="controls">
          <button onClick={() => setActiveTool(TOOL_TYPES.WALL)} className={activeTool === TOOL_TYPES.WALL ? 'active' : ''}>Wall</button>
          <button onClick={() => setActiveTool(TOOL_TYPES.EMPTY)} className={activeTool === TOOL_TYPES.EMPTY ? 'active' : ''}>Empty</button>
          <button onClick={() => setActiveTool(TOOL_TYPES.PLAYER_SPAWN)} className={activeTool === TOOL_TYPES.PLAYER_SPAWN ? 'active' : ''}>Player Spawn</button>
          <button onClick={() => setActiveTool(TOOL_TYPES.ENEMY_SPAWN)} className={activeTool === TOOL_TYPES.ENEMY_SPAWN ? 'active' : ''}>Enemy Spawn</button>
          <button onClick={exportLevel}>Export Level</button>
        </div>
        <canvas
          ref={canvasRef}
          width={MAP_DIMENSION}
          height={MAP_DIMENSION}
          onClick={handleClick}
          className="map-canvas"
        />
        <p>Click on the grid to draw. Select a tool above.</p>
        <p>Exported level data will be copied to your clipboard.</p>
      </header>
    </div>
  );
}

export default App;