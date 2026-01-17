import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from './useInputController'
import { Sprite } from './Sprite'

function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const keysPressed = useInputController()
  
  // Static blue squares
  const blueSquares = [
    { x: 200, y: 150 },
    { x: 400, y: 150 },
    { x: 200, y: 350 },
    { x: 400, y: 350 },
  ]
  const cubeSize = 50

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const speed = 5; // pixels per frame

    const checkCollision = (xp: number, yp: number) => {
      for (const square of blueSquares) {
        if (
          xp < square.x + cubeSize &&
          xp + cubeSize > square.x &&
          yp < square.y + cubeSize &&
          yp + cubeSize > square.y
        ) {
          console.log("hello")
        }
      }
    }

    const gameLoop = () => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (keysPressed.current.has('ArrowUp')) newY -= speed;
        if (keysPressed.current.has('ArrowDown')) newY += speed;
        if (keysPressed.current.has('ArrowLeft')) newX -= speed;
        if (keysPressed.current.has('ArrowRight')) newX += speed;

        // Boundary Check
        newX = Math.max(0, Math.min(newX, window.innerWidth - cubeSize));
        newY = Math.max(0, Math.min(newY, window.innerHeight - cubeSize));

        // Collision Check
        checkCollision(newX, newY);

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // blueSquares is constant, so safe to omit from dependency if we want strict behaviour, but best practice is to include if not stable. Here they are defined in render but static content effectively.

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
      {/* Player */}
      <Sprite x={position.x} y={position.y} color="red" size={cubeSize} />
      
      {/* Blue Squares */}
      {blueSquares.map((sq, i) => (
        <Sprite key={i} x={sq.x} y={sq.y} color="blue" size={cubeSize} />
      ))}
    </div>
  )
}

export default App


