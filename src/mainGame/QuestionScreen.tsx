import React from 'react';
import background from '../assets/images/filler-qBackground.jpg';

interface QuestionScreenProps {
  spellName: string;
  onClose: (correct?: boolean) => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({ spellName, onClose }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url(${background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <h1>Question for {spellName}</h1>
        <p>This is where the question will appear.</p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => onClose(true)}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Correct Answer (Filler)
          </button>
          
          <button 
            onClick={() => onClose(false)}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              cursor: 'pointer',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Wrong Answer (Filler)
          </button>
        </div>

      </div>
    </div>
  );
};
