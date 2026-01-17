import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites, SPRITE_SIZE } from './gameConfig'
import { BattleScreen } from './BattleScreen'

function MainGame() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const keysPressed = useInputController()

  // Game Loop
  useEffect(() => {
    if (activeMenu) return; // Pause game loop when menu is open

    let animationFrameId: number;
    const speed = 5; // pixels per frame

    const checkCollision = (xp: number, yp: number) => {
      for (const sprite of staticSprites) {
        if (
          xp < sprite.x + SPRITE_SIZE &&
          xp + SPRITE_SIZE > sprite.x &&
          yp < sprite.y + SPRITE_SIZE &&
          yp + SPRITE_SIZE > sprite.y
        ) {
          setActiveMenu(sprite.id)
          // Optional: Bounce back slightly to avoid immediate re-trigger on close?
          // For now, simpler is fine, but we might want to ensure we don't get stuck.
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
        newX = Math.max(0, Math.min(newX, window.innerWidth - SPRITE_SIZE));
        newY = Math.max(0, Math.min(newY, window.innerHeight - SPRITE_SIZE));

        // Collision Check uses PREDICTED position to stop movement?
        // Or reactive? Reactive means we overlap. Let's stick effectively to reactive trigger.
        checkCollision(newX, newY);

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu]); // Re-run effect when activeMenu changes (to start/stop loop)

  const activeSprite = staticSprites.find(s => s.id === activeMenu);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
      {/* Battle Screen Overlay takes full precedence if active */}
      {activeMenu && activeSprite ? (
        <BattleScreen 
          enemy={activeSprite}
          onClose={() => {
            setActiveMenu(null)
            // Nudge player away to avoid immediate re-collision
            setPosition(prev => ({
              x: prev.x < activeSprite.x ? prev.x - 10 : prev.x + 10,
              y: prev.y < activeSprite.y ? prev.y - 10 : prev.y + 10
            }))
          }}
        />
      ) : (
        <>
          {/* Player */}
          <Sprite x={position.x} y={position.y} color="red" size={SPRITE_SIZE} />

          {/* Static Sprites */}
          {staticSprites.map((sprite, i) => (
            <Sprite key={i} x={sprite.x} y={sprite.y} color={sprite.color} size={SPRITE_SIZE} />
          ))}
        </>
      )}
    </div>
  )
}

export default MainGame
