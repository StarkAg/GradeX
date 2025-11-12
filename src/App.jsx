import React, { useState, useRef, useEffect } from 'react';
import GradeX from './components/GradeX';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const texts = ['INITIALIZING...', 'LOADING SYSTEMS...', 'GRADEX ONLINE'];
    let textIndex = 0;
    let charIndex = 0;
    let progressInterval;
    let textInterval;

    // Typing effect
    textInterval = setInterval(() => {
      if (charIndex < texts[textIndex].length) {
        setLoadingText(texts[textIndex].substring(0, charIndex + 1));
        charIndex++;
      } else {
        setTimeout(() => {
          charIndex = 0;
          textIndex = (textIndex + 1) % texts.length;
          setLoadingText('');
        }, 800);
      }
    }, 100);

    // Progress bar
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(textInterval);
          setTimeout(() => {
            setShowSplash(false);
          }, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 40);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      {showSplash && (
        <div 
          className="splash-screen"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#020202',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            opacity: showSplash ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
            overflow: 'hidden'
          }}
        >
          {/* Scanning lines effect */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(transparent 50%, rgba(245, 245, 245, 0.03) 50%)',
              backgroundSize: '100% 4px',
              animation: 'scan 2s linear infinite',
              pointerEvents: 'none'
            }}
          />
          
          {/* Grid pattern */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `
                linear-gradient(rgba(245, 245, 245, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(245, 245, 245, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              opacity: 0.3,
              pointerEvents: 'none'
            }}
          />

          {/* Arc Reactor with pulse */}
          <div style={{ position: 'relative', marginBottom: '40px' }}>
            <img 
              src="/arc-reactor.png" 
              alt="Arc Reactor" 
              className="splash-arc-reactor"
              style={{
                width: '140px',
                height: '140px',
                animation: 'reactorPulse 2s ease-in-out infinite, reactorGlow 2s ease-in-out infinite',
                filter: 'drop-shadow(0 0 30px rgba(245, 245, 245, 0.4)) drop-shadow(0 0 60px rgba(245, 245, 245, 0.2))'
              }}
            />
            {/* Pulsing rings */}
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '140px',
                height: '140px',
                border: '2px solid rgba(245, 245, 245, 0.2)',
                borderRadius: '50%',
                animation: 'ringPulse 2s ease-out infinite'
              }}
            />
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '160px',
                height: '160px',
                border: '1px solid rgba(245, 245, 245, 0.15)',
                borderRadius: '50%',
                animation: 'ringPulse 2s ease-out infinite 0.5s'
              }}
            />
          </div>

          {/* Loading text with typing effect */}
          <div 
            style={{
              fontFamily: 'Space Grotesk, monospace',
              fontSize: '14px',
              letterSpacing: '0.2em',
              color: '#f5f5f5',
              marginBottom: '30px',
              minHeight: '20px',
              textTransform: 'uppercase',
              opacity: 0.8
            }}
          >
            {loadingText}
            <span style={{ animation: 'blink 1s infinite' }}>|</span>
          </div>

          {/* Progress bar */}
          <div 
            style={{
              width: '300px',
              height: '2px',
              background: 'rgba(245, 245, 245, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div 
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, transparent, #f5f5f5, transparent)',
                animation: 'progressGlow 1.5s ease-in-out infinite',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 10px rgba(245, 245, 245, 0.5)'
              }}
            />
          </div>

          {/* Tech corners */}
          <div 
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderTop: '2px solid rgba(245, 245, 245, 0.3)',
              borderLeft: '2px solid rgba(245, 245, 245, 0.3)',
              animation: 'cornerFade 2s ease-in-out infinite'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderTop: '2px solid rgba(245, 245, 245, 0.3)',
              borderRight: '2px solid rgba(245, 245, 245, 0.3)',
              animation: 'cornerFade 2s ease-in-out infinite'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderBottom: '2px solid rgba(245, 245, 245, 0.3)',
              borderLeft: '2px solid rgba(245, 245, 245, 0.3)',
              animation: 'cornerFade 2s ease-in-out infinite'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderBottom: '2px solid rgba(245, 245, 245, 0.3)',
              borderRight: '2px solid rgba(245, 245, 245, 0.3)',
              animation: 'cornerFade 2s ease-in-out infinite'
            }}
          />
        </div>
      )}
      <div className="app-container" style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s ease-in' }}>
      <header className="app-header single">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            GradeX By 
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Stark
              <img 
                src="/arc-reactor.png" 
                alt="Arc Reactor" 
                style={{ 
                  width: '1em', 
                  height: '1em', 
                  display: 'inline-block', 
                  verticalAlign: 'baseline',
                  marginTop: '-0.1em',
                  objectFit: 'contain'
                }} 
              />
              <button
                onClick={togglePlay}
                style={{
                  width: '16px',
                  height: '16px',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.2,
                  transition: 'opacity 0.2s ease',
                  marginLeft: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.2';
                }}
                title="Easter Egg"
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5f5f5">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f5f5f5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </span>
          </h1>
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(245, 245, 245, 0.5)', fontStyle: 'italic', letterSpacing: '0.05em' }}>
            PS — came into existence on 12th Nov :) since ClassPro and Etc. stopped working :(
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(245, 245, 245, 0.35)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>BY HARSH</span>
            <a 
              href="https://github.com/StarkAg" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: '1px solid rgba(245, 245, 245, 0.15)', 
                background: 'transparent', 
                color: 'rgba(245, 245, 245, 0.4)', 
                textDecoration: 'none',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(245, 245, 245, 0.3)';
                e.target.style.background = 'rgba(245, 245, 245, 0.04)';
                e.target.style.color = 'rgba(245, 245, 245, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(245, 245, 245, 0.15)';
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(245, 245, 245, 0.4)';
              }}
            >
              GitHub
            </a>
            <a 
              href="https://in.linkedin.com/in/harshxagarwal" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: '1px solid rgba(245, 245, 245, 0.15)', 
                background: 'transparent', 
                color: 'rgba(245, 245, 245, 0.4)', 
                textDecoration: 'none',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(245, 245, 245, 0.3)';
                e.target.style.background = 'rgba(245, 245, 245, 0.04)';
                e.target.style.color = 'rgba(245, 245, 245, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(245, 245, 245, 0.15)';
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(245, 245, 245, 0.4)';
              }}
            >
              LinkedIn
            </a>
        </div>
      </header>
      <main className="app-main single">
        <GradeX />
      </main>
      <audio
        ref={audioRef}
        src="/Back_In_Black.mp3"
        onEnded={() => setIsPlaying(false)}
      />
    </div>
    </>
  );
}


