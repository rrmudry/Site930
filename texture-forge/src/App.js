import React, { useRef, useEffect, useState } from 'react';
import './App.css';

const PIXEL_SIZE = 10; // Size of each pixel in the canvas
const CANVAS_SIZE = 160; // 16x16 pixels * 10px/pixel

function App() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    setDrawing(true);
    draw(nativeEvent);
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { offsetX, offsetY } = nativeEvent;

    const x = Math.floor(offsetX / PIXEL_SIZE) * PIXEL_SIZE;
    const y = Math.floor(offsetY / PIXEL_SIZE) * PIXEL_SIZE;

    context.fillStyle = currentColor;
    context.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
  };

  const handleColorChange = (event) => {
    setCurrentColor(event.target.value);
  };

  const downloadTexture = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'texture.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Texture Forge</h1>
        <div className="controls">
          <input type="color" value={currentColor} onChange={handleColorChange} />
          <button onClick={downloadTexture}>Download Texture</button>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          className="texture-canvas"
        />
        <p>Click and drag to draw. Select a color and download your texture!</p>
        <h2>How to use in Site 930:</h2>
        <p>1. Download the texture.png file.</p>
        <p>2. In your game's script.js, load the texture using THREE.TextureLoader:</p>
        <pre>
          <code>
            const textureLoader = new THREE.TextureLoader();
            const customTexture = textureLoader.load('path/to/your/texture.png');
            const customMaterial = new THREE.MeshBasicMaterial(&#123; map: customTexture &#125;);
            // Then apply customMaterial to your game objects
          </code>
        </pre>
        <p>3. Make sure the texture.png file is in a directory accessible by your game (e.g., the same directory as index.html).</p>
      </header>
    </div>
  );
}

export default App;