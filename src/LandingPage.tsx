import type { FC } from 'react'
import landingpage from './assets/landingpage.png'
import startgame from './assets/buttons/startgame.png'
import wundrImg from './assets/buttons/wundr.png'

interface LandingPageProps {
  onStartGame: () => void;
}

export const LandingPage: FC<LandingPageProps> = ({ onStartGame }) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: `url(${landingpage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}
    >
      <img
        src={wundrImg}
        alt=""
        style={{
          position: 'absolute',
          top: '125px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: 'auto',
          pointerEvents: 'none'
        }}
      />
      <button
        onClick={onStartGame}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          backgroundImage: `url(${startgame})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          width: '400px',
          height: '100px',
          marginTop: '-175px',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.transition = 'transform 0.2s ease';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {/* Invisible text for accessibility */}
        <span style={{ position: 'absolute', left: '-9999px' }}>Start Game</span>
      </button>
    </div>
  )
}
