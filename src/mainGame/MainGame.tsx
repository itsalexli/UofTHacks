import { useState, useEffect } from 'react'
import '../App.css'
import { useInputController } from '../shared/useInputController'
import { Sprite } from '../shared/Sprite'
import { staticSprites, SPRITE_SIZE } from './gameConfig'
import type { UserAnswers } from '../ChoosingGame/MainChoosingGame'
import { BattleScreen } from './BattleScreen'
import { matchBackground, type BackgroundImage } from './backgroundMatcher'

interface MainGameProps {
  userAnswers: UserAnswers;
  onBack: () => void;
}

function MainGame({ userAnswers, onBack }: MainGameProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [background, setBackground] = useState<BackgroundImage | null>(null)
  const [isLoadingBg, setIsLoadingBg] = useState(false)
  const keysPressed = useInputController()

  // Match background on mount based on user's answer
  useEffect(() => {
    if (userAnswers?.background) {
      setIsLoadingBg(true)
      matchBackground(userAnswers.background)
        .then(matched => {
          setBackground(matched)
          setIsLoadingBg(false)
        })
        .catch(err => {
          console.error('Background matching failed:', err)
          setIsLoadingBg(false)
        })
    }
  }, [userAnswers?.background])

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

        checkCollision(newX, newY);

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu]);

  const activeSprite = staticSprites.find(s => s.id === activeMenu);

  // Build background style
  const backgroundStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    ...(background && {
      backgroundImage: `url(/src/assets/backgrounds/${background.filename})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    })
  }

  return (
    <div style={backgroundStyle}>
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
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '10px 20px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                zIndex: 1000
              }}
            >
              ← Back to Choices
            </button>
          )}

          {/* Show user choices if available */}
          {userAnswers && Object.keys(userAnswers).length > 0 && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              zIndex: 1000
            }}>
              {isLoadingBg && <div style={{ marginBottom: '8px', color: '#666' }}>Creating world... 🎨</div>}
              <strong>Your choices:</strong>
              {userAnswers.character && <div>👤 {userAnswers.character}</div>}
              {userAnswers.music && <div>🎵 {userAnswers.music}</div>}
              {userAnswers.background && <div>🖼️ {userAnswers.background}</div>}
            </div>
          )}

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
