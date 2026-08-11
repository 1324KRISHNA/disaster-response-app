import React, { useState } from 'react';

export default function Tooltip({ text, children, position = 'top' }) {
  const [show, setShow] = useState(false);

  const getPositionStyles = () => {
    switch(position) {
      case 'bottom': return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'right': return { top: '50%', left: '100%', transform: 'translateY(-50%)', marginLeft: '8px' };
      case 'left': return { top: '50%', right: '100%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'top': 
      default: 
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
    }
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          ...getPositionStyles(),
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#f8fafc',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {text}
        </div>
      )}
    </div>
  );
}
