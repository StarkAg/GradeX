import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import GradeX from './components/GradeX';
import SeatFinder from './components/SeatFinder';
import FeedFill from './components/FeedFill';
import AdminPortal from './components/AdminPortal';

const NAV_ITEMS = [
  { id: 'seatfinder', label: 'Seat Finder', path: '/' },
  { id: 'feedfill', label: 'FeedFill', badge: 'NEW', path: '/feedfill' },
  { id: 'gradex', label: 'GradeX', path: '/gradex' },
  { id: 'admin', label: 'Admin', path: '/admin' },
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('gradex-theme');
    return savedTheme || 'dark';
  });
  const audioRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path === '/' || path === '/seatfinder' || path === '/seat-finder') return 'seatfinder';
    if (path === '/feedfill') return 'feedfill';
    if (path === '/gradex') return 'gradex';
    return 'seatfinder';
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gradex-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
            background: 'var(--splash-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            opacity: showSplash ? 1 : 0,
            transition: 'opacity 0.8s ease-out, background 0.3s ease',
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
              background: `linear-gradient(transparent 50%, var(--splash-overlay) 50%)`,
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
                linear-gradient(var(--splash-overlay) 1px, transparent 1px),
                linear-gradient(90deg, var(--splash-overlay) 1px, transparent 1px)
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
              color: 'var(--splash-text)',
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
              background: 'var(--splash-overlay)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div 
              style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, transparent, var(--splash-text), transparent)`,
                animation: 'progressGlow 1.5s ease-in-out infinite',
                transition: 'width 0.1s linear',
                boxShadow: `0 0 10px var(--splash-overlay)`
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
              borderTop: `2px solid var(--splash-overlay)`,
              borderLeft: `2px solid var(--splash-overlay)`,
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
              borderTop: `2px solid var(--splash-overlay)`,
              borderRight: `2px solid var(--splash-overlay)`,
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
              borderBottom: `2px solid var(--splash-overlay)`,
              borderLeft: `2px solid var(--splash-overlay)`,
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
              borderBottom: `2px solid var(--splash-overlay)`,
              borderRight: `2px solid var(--splash-overlay)`,
              animation: 'cornerFade 2s ease-in-out infinite'
            }}
          />
        </div>
      )}
      <div className="app-container" style={{ opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s ease-in' }}>
      <header className="app-header single">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              GradeX
              <img 
                src="/arc-reactor.png" 
                alt="Arc Reactor" 
                onClick={togglePlay}
                style={{ 
                  width: '1em', 
                  height: '1em', 
                  display: 'inline-block', 
                  verticalAlign: 'baseline',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s ease, filter 0.2s ease',
                  filter: theme === 'light' ? 'invert(1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                title="Easter Egg - Click to play"
              />
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>
                By Stark
              </span>
            </h1>
            {currentPage === 'gradex' && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', letterSpacing: '0.05em' }}>
                PS — came into existence on 12th Nov :) since ClassPro and Etc. were unreliable manytimes :(
              </p>
            )}
            {currentPage === 'feedfill' && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
                Need to blitz through SRM Academia feedback? Use the FeedFill helper below to install the one-click form filler responsibly.
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {NAV_ITEMS.map((item) => {
                const isActive = currentPage === item.id;
                const isFeedFill = item.id === 'feedfill';
                return (
                  <button
                    key={item.id}
                    className={`nav-button${isFeedFill ? ' feedfill-nav-button' : ''}${isActive ? ' is-active' : ''}`}
                    onClick={() => navigate(item.path)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid ' + (isActive ? 'var(--border-hover)' : 'var(--border-color)'),
                      background: isActive ? 'var(--hover-bg)' : 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: isFeedFill && !isActive ? '0 0 18px rgba(59, 130, 246, 0.4)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.background = 'var(--hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isActive ? 'var(--border-hover)' : 'var(--border-color)';
                      e.currentTarget.style.background = isActive ? 'var(--hover-bg)' : 'var(--card-bg)';
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="nav-button-badge">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={toggleTheme}
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.background = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--card-bg)';
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>BY HARSH</span>
            <a 
              href="https://github.com/StarkAg" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                border: '1px solid var(--border-color)', 
                background: 'transparent', 
                color: 'var(--text-tertiary)', 
                textDecoration: 'none',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--border-hover)';
                e.target.style.background = 'var(--hover-bg)';
                e.target.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--text-tertiary)';
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
                border: '1px solid var(--border-color)', 
                background: 'transparent', 
                color: 'var(--text-tertiary)', 
                textDecoration: 'none',
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'var(--border-hover)';
                e.target.style.background = 'var(--hover-bg)';
                e.target.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--text-tertiary)';
              }}
            >
              LinkedIn
            </a>
          </div>
      </header>
      <main className="app-main single">
        <Routes>
          <Route path="/" element={<SeatFinder />} />
          <Route path="/seatfinder" element={<SeatFinder />} />
          <Route path="/seat-finder" element={<SeatFinder />} />
          <Route path="/feedfill" element={<FeedFill />} />
          <Route path="/gradex" element={<GradeX />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <audio
        ref={audioRef}
        src="/back-in-black.mp3"
        onEnded={() => setIsPlaying(false)}
      />
      <Analytics />
    </div>
    </>
  );
}


