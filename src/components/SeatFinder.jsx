import React, { useState, useEffect } from 'react';

export default function SeatFinder() {
  const [examDate, setExamDate] = useState('today');
  const [dateInput, setDateInput] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seatInfo, setSeatInfo] = useState(null);
  const [seatData, setSeatData] = useState([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if desktop/mobile on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 480);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load seat data on component mount
  useEffect(() => {
    fetch('/seat-data.json')
      .then(res => res.json())
      .then(data => {
        setSeatData(data);
      })
      .catch(err => {
        console.error('Error loading seat data:', err);
      });
  }, []);

  // Get today's and tomorrow's dates
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getSelectedDate = () => {
    if (examDate === 'today') {
      return formatDate(today);
    } else if (examDate === 'tomorrow') {
      return formatDate(tomorrow);
    } else {
      return dateInput;
    }
  };

  const handleDateChange = (type) => {
    setExamDate(type);
    setDateInput('');
    setError(null);
    setSeatInfo(null);
  };

  const handleDateInputChange = (e) => {
    setDateInput(e.target.value);
    setExamDate('custom');
    setError(null);
    setSeatInfo(null);
  };

  const handleRegisterNumberChange = (e) => {
    // Convert to uppercase for consistency, but allow any case input
    const value = e.target.value.toUpperCase();
    setRegisterNumber(value);
    setError(null);
    setSeatInfo(null);
  };

  const handleFindSeat = async () => {
    if (!registerNumber.trim()) {
      setError('Please enter your register number');
      return;
    }

    // Date is optional now - only used for venue filtering
    const selectedDate = getSelectedDate();

    setLoading(true);
    setError(null);
    setSeatInfo(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Search for register number in seat data
      const regNoUpper = registerNumber.trim().toUpperCase();
      // Normalize date format for comparison (handle DD/MM/YYYY format)
      const normalizeDate = (dateStr) => {
        if (!dateStr) return '';
        // Convert DD/MM/YYYY to consistent format
        return dateStr.replace(/\//g, '/');
      };
      
      const normalizedSelectedDate = normalizeDate(selectedDate);
      // First, find all seats matching the register number (for name/department - always show)
      const allMatchingSeats = seatData.filter(seat => {
        const seatRegNo = seat.registerNumber ? seat.registerNumber.toUpperCase() : '';
        return seatRegNo === regNoUpper;
      });
      
      if (allMatchingSeats.length === 0) {
        setError('Register number not found');
        return;
      }
      
      // Get permanent data (name, department) from first match (they're all the same for same register number)
      const permanentData = {
        name: allMatchingSeats[0].name || '-',
        department: allMatchingSeats[0].department || '-'
      };
      
      // Filter by date for venue/room assignment only
      const foundSeats = normalizedSelectedDate 
        ? allMatchingSeats.filter(seat => {
            const seatDate = normalizeDate(seat.date);
            const matchesDate = seatDate === normalizedSelectedDate || !seatDate || seatDate === '';
            // If venue exists and matches date, include it; otherwise show with venue as "-"
            return matchesDate;
          })
        : allMatchingSeats;
      
      // Merge permanent data with venue-filtered results
      // If no venue matches the date, show student info with venue as "-"
      if (foundSeats.length === 0) {
        // No venue for this date, but show student info
        setSeatInfo([{
          registerNumber: regNoUpper,
          name: permanentData.name,
          department: permanentData.department,
          room: '-',
          floor: '-',
          building: '-',
          subcode: '-',
          session: '-',
          date: selectedDate
        }]);
      } else {
        // Venue found for this date, merge with permanent data
        const mergedSeats = foundSeats.map(seat => ({
          ...seat,
          name: seat.name || permanentData.name || '-',
          department: seat.department || permanentData.department || '-'
        }));
        setSeatInfo(mergedSeats);
      }
    } catch (err) {
      setError('Failed to fetch seat information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasSeatInfo = seatInfo && seatInfo.length > 0;

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0',
      minHeight: 'calc(100vh - 60px)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{
        display: isDesktop && hasSeatInfo ? 'flex' : 'block',
        gap: '32px',
        alignItems: 'flex-start',
        padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)',
        maxWidth: isDesktop && hasSeatInfo ? '1200px' : '600px',
        margin: '0 auto',
        transition: 'all 0.5s ease-in-out'
      }}>
        {/* Form Card */}
        <div style={{
          width: isDesktop && hasSeatInfo ? '48%' : '100%',
          flexShrink: 0,
          transition: 'all 0.5s ease-in-out',
          transform: isDesktop && hasSeatInfo ? 'translateX(-10%)' : 'translateX(0)'
        }}>
          {/* Header */}
          {(!isDesktop || !hasSeatInfo) && (
            <div style={{
              textAlign: 'center',
              marginBottom: 'clamp(24px, 6vw, 32px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(8px, 2vw, 12px)',
                marginBottom: '8px',
                flexWrap: 'wrap'
              }}>
                <h1 style={{
                  fontSize: 'clamp(24px, 6vw, 32px)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  padding: 0,
                  color: 'var(--text-primary)',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                }}>
                  SRMIST Seat Finder
                </h1>
                <span style={{
                  fontSize: 'clamp(10px, 2.5vw, 12px)',
                  fontWeight: 600,
                  padding: 'clamp(3px, 1vw, 4px) clamp(6px, 2vw, 8px)',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  v3.0
                </span>
              </div>
            </div>
          )}
          
        {/* Main Card */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: 'clamp(20px, 5vw, 32px)',
          marginBottom: '24px'
        }}>
          <div style={{
            marginBottom: 'clamp(20px, 5vw, 24px)'
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 600,
              margin: '0 0 8px 0',
              color: 'var(--text-primary)'
            }}>
              Find Your Exam Seat
            </h2>
            <p style={{
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Quick & easy seat lookup for your exams
            </p>
          </div>

          {/* Warning Note - Only show if no seat info found */}
          {(!seatInfo || seatInfo.length === 0 || seatInfo.every(seat => !seat.room || seat.room === '-')) && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
              marginBottom: 'clamp(20px, 5vw, 24px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'clamp(8px, 2vw, 12px)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px', minWidth: '18px', width: 'clamp(18px, 4vw, 20px)', height: 'clamp(18px, 4vw, 20px)' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p style={{
                fontSize: 'clamp(12px, 3vw, 13px)',
                color: '#fbbf24',
                margin: 0,
                lineHeight: '1.5'
              }}>
                Note: Seat info appears 24h before exams. Not available? Check back later.
              </p>
            </div>
          )}

          {/* Exam Date */}
          <div style={{
            marginBottom: 'clamp(20px, 5vw, 24px)'
          }}>
            <label style={{
              display: 'block',
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: 'clamp(10px, 2.5vw, 12px)'
            }}>
              Exam Date
            </label>
            <div style={{
              display: 'flex',
              gap: 'clamp(6px, 2vw, 8px)',
              marginBottom: 'clamp(10px, 2.5vw, 12px)',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleDateChange('today')}
                style={{
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  fontWeight: 500,
                  border: '1px solid var(--border-color)',
                  background: examDate === 'today' ? 'var(--text-primary)' : 'var(--card-bg)',
                  color: examDate === 'today' ? 'var(--bg-primary)' : 'var(--text-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  flex: '1 1 auto',
                  minWidth: '100px'
                }}
              >
                Today
              </button>
              <button
                onClick={() => handleDateChange('tomorrow')}
                style={{
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  fontWeight: 500,
                  border: '1px solid var(--border-color)',
                  background: examDate === 'tomorrow' ? 'var(--text-primary)' : 'var(--card-bg)',
                  color: examDate === 'tomorrow' ? 'var(--bg-primary)' : 'var(--text-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  flex: '1 1 auto',
                  minWidth: '100px'
                }}
              >
                Tomorrow
              </button>
            </div>
            <input
              type="text"
              value={examDate === 'today' ? formatDate(today) : examDate === 'tomorrow' ? formatDate(tomorrow) : dateInput}
              onChange={handleDateInputChange}
              placeholder="DD/MM/YYYY"
              style={{
                width: '100%',
                padding: 'clamp(12px, 3vw, 14px) clamp(14px, 4vw, 16px)',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          {/* Register Number */}
          <div style={{
            marginBottom: 'clamp(20px, 5vw, 24px)'
          }}>
            <label style={{
              display: 'block',
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: 'clamp(10px, 2.5vw, 12px)'
            }}>
              Register Number
            </label>
            <input
              type="text"
              value={registerNumber}
              onChange={handleRegisterNumberChange}
              placeholder="RA23XXXX"
              style={{
                width: '100%',
                padding: 'clamp(12px, 3vw, 14px) clamp(14px, 4vw, 16px)',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleFindSeat}
            disabled={loading}
            style={{
              width: '100%',
              padding: 'clamp(14px, 3.5vw, 16px)',
              fontSize: 'clamp(15px, 4vw, 16px)',
              fontWeight: 600,
              border: 'none',
              background: loading ? 'var(--border-color)' : 'var(--text-primary)',
              color: loading ? 'var(--text-tertiary)' : 'var(--bg-primary)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(6px, 2vw, 8px)',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', width: 'clamp(16px, 4vw, 18px)', height: 'clamp(16px, 4vw, 18px)' }}>
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Finding...
              </>
            ) : (
              'Find My Seat'
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: 'clamp(16px, 4vw, 20px)',
              padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'clamp(8px, 2vw, 12px)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px', minWidth: '18px', width: 'clamp(18px, 4vw, 20px)', height: 'clamp(18px, 4vw, 20px)' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p style={{
                fontSize: 'clamp(12px, 3vw, 13px)',
                color: '#ef4444',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Seat Info - Mobile only (inside form) */}
          {!isDesktop && seatInfo && seatInfo.length > 0 && (
            <div style={{
              marginTop: 'clamp(16px, 4vw, 20px)',
              padding: 'clamp(20px, 5vw, 24px)',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.08) 100%)',
              border: '1.5px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22c55e' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: 'clamp(18px, 4.5vw, 20px)',
                  fontWeight: 700,
                  color: '#22c55e',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Seat Information Found!
                </h3>
              </div>
              
              {seatInfo.map((seat, index) => {
                const roomUpper = seat.room && seat.room !== '-' ? seat.room.toUpperCase() : '';
                const hasImage = roomUpper && roomUpper.length > 0 && (roomUpper.startsWith('TP2') || roomUpper.startsWith('TP') || roomUpper.includes('UB'));
                
                return (
                <div key={index} style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  borderRadius: '12px',
                  padding: 'clamp(12px, 3vw, 20px)',
                  marginBottom: index < seatInfo.length - 1 ? 'clamp(12px, 3vw, 16px)' : '0',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  gap: 'clamp(10px, 2.5vw, 16px)',
                  flexDirection: hasImage ? (isMobile ? 'column' : 'row') : 'column'
                }}>
                  {hasImage ? (() => {
                    if (roomUpper.startsWith('TP2')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: isMobile ? '100%' : 'clamp(100px, 20vw, 150px)',
                          maxWidth: isMobile ? '200px' : 'none',
                          margin: isMobile ? '0 auto' : '0',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/TP2.JPG" 
                            alt="TP2 Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: isMobile ? '250px' : '300px',
                              objectFit: 'contain',
                              filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(34, 197, 94, 0.15)',
                              transition: 'all 0.3s ease',
                              border: '2px solid rgba(34, 197, 94, 0.25)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.35)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(34, 197, 94, 0.15)';
                              }
                            }}
                          />
                        </div>
                      );
                    } else if (roomUpper.startsWith('TP')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: isMobile ? '100%' : 'clamp(100px, 20vw, 150px)',
                          maxWidth: isMobile ? '200px' : 'none',
                          margin: isMobile ? '0 auto' : '0',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/TP.jpg" 
                            alt="TP Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: isMobile ? '250px' : '300px',
                              objectFit: 'contain',
                              filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(34, 197, 94, 0.15)',
                              transition: 'all 0.3s ease',
                              border: '2px solid rgba(34, 197, 94, 0.25)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.35)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(34, 197, 94, 0.15)';
                              }
                            }}
                          />
                        </div>
                      );
                    } else if (roomUpper.includes('UB')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: isMobile ? '100%' : 'clamp(100px, 20vw, 150px)',
                          maxWidth: isMobile ? '200px' : 'none',
                          margin: isMobile ? '0 auto' : '0',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/UB.png" 
                            alt="UB Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: isMobile ? '250px' : '300px',
                              objectFit: 'contain',
                              filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(34, 197, 94, 0.15)',
                              transition: 'all 0.3s ease',
                              border: '2px solid rgba(34, 197, 94, 0.25)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.35)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(34, 197, 94, 0.15)';
                              }
                            }}
                          />
                        </div>
                      );
                    }
                    return null;
                  })() : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                  {(seat.name && seat.name !== '-') && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '10px',
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      marginBottom: 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
                      <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: 'clamp(14px, 3.5vw, 16px)' }}>{seat.name}</div>
                    </div>
                  )}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: 'clamp(10px, 2.5vw, 16px)',
                    fontSize: 'clamp(12px, 3vw, 14px)'
                  }}>
                    <div style={{
                      background: seat.room && seat.room !== '-' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      borderRadius: '10px',
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      border: seat.room && seat.room !== '-' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room/Venue</div>
                      <div style={{ 
                        color: seat.room && seat.room !== '-' ? '#22c55e' : '#fbbf24', 
                        fontWeight: 700, 
                        fontSize: 'clamp(14px, 3.5vw, 18px)',
                        fontStyle: seat.room === '-' ? 'italic' : 'normal'
                      }}>{seat.room || '-'}</div>
                      {seat.building && seat.building !== '-' && (
                        <div style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: 'clamp(10px, 2.5vw, 12px)', 
                          marginTop: 'clamp(3px, 1vw, 4px)',
                          fontWeight: 500
                        }}>{seat.building}</div>
                      )}
                      {seat.floor && seat.floor !== '-' && (
                        <div style={{ 
                          color: 'var(--text-primary)', 
                          fontSize: 'clamp(12px, 3vw, 15px)', 
                          marginTop: 'clamp(4px, 1.5vw, 6px)',
                          fontWeight: 600
                        }}>Floor: {seat.floor}</div>
                      )}
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Code</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'clamp(13px, 3vw, 15px)' }}>{seat.subcode || '-'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'clamp(13px, 3vw, 15px)' }}>{seat.department || '-'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'clamp(13px, 3vw, 15px)' }}>{seat.session || '-'}</div>
                    </div>
                  </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
        </div>

        {/* Seat Info - Desktop only (right side) */}
        {isDesktop && seatInfo && seatInfo.length > 0 && (
          <div style={{
            width: '48%',
            flexShrink: 0,
            opacity: hasSeatInfo ? 1 : 0,
            transform: hasSeatInfo ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 0.5s ease-in-out',
            animation: hasSeatInfo ? 'fadeIn 0.5s ease-in-out' : 'none'
          }}>
            <div style={{
              position: 'sticky',
              top: '20px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.08) 100%)',
              border: '1.5px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 12px 32px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1.5px solid rgba(34, 197, 94, 0.25)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22c55e' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#22c55e',
                  margin: 0,
                  letterSpacing: '-0.01em'
                }}>
                  Seat Information Found!
                </h3>
              </div>
              
              {seatInfo.map((seat, index) => {
                const roomUpper = seat.room && seat.room !== '-' ? seat.room.toUpperCase() : '';
                const hasImage = roomUpper && roomUpper.length > 0 && (roomUpper.startsWith('TP2') || roomUpper.startsWith('TP') || roomUpper.includes('UB'));
                
                return (
                <div key={index} style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: index < seatInfo.length - 1 ? '20px' : '0',
                  border: '1.5px solid rgba(34, 197, 94, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  gap: '20px',
                  flexDirection: hasImage ? 'row' : 'column'
                }}>
                  {hasImage ? (() => {
                    if (roomUpper.startsWith('TP2')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: '180px',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/TP2.JPG" 
                            alt="TP2 Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: '400px',
                              objectFit: 'contain',
                              filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.2)',
                              transition: 'all 0.3s ease',
                              border: '2px solid rgba(34, 197, 94, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 14px 32px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(34, 197, 94, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.2)';
                            }}
                          />
                        </div>
                      );
                    } else if (roomUpper.startsWith('TP')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: '180px',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/TP.jpg" 
                            alt="TP Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: '400px',
                              objectFit: 'contain',
                              filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.2)',
                              transition: 'all 0.3s ease',
                              border: '2px solid rgba(34, 197, 94, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 14px 32px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(34, 197, 94, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.2)';
                            }}
                          />
                        </div>
                      );
                    } else if (roomUpper.includes('UB')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: '180px',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/UB.png" 
                            alt="UB Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: '400px',
                              objectFit: 'contain',
                              filter: 'brightness(1.05) contrast(1.1) saturate(1.15)',
                              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.2)',
                              transition: 'all 0.3s ease',
                              border: '2px solid rgba(34, 197, 94, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.1) contrast(1.15) saturate(1.2)';
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 14px 32px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(34, 197, 94, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1.05) contrast(1.1) saturate(1.15)';
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(34, 197, 94, 0.2)';
                            }}
                          />
                        </div>
                      );
                    }
                    return null;
                  })() : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                  {(seat.name && seat.name !== '-') && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      marginBottom: '16px',
                      border: '1.5px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</div>
                      <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: '18px' }}>{seat.name}</div>
                    </div>
                  )}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '14px',
                    fontSize: '14px'
                  }}>
                    <div style={{
                      background: seat.room && seat.room !== '-' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: seat.room && seat.room !== '-' ? '1.5px solid rgba(34, 197, 94, 0.3)' : '1.5px solid rgba(251, 191, 36, 0.3)',
                      boxShadow: seat.room && seat.room !== '-' ? '0 2px 8px rgba(34, 197, 94, 0.15)' : '0 2px 8px rgba(251, 191, 36, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Room/Venue</div>
                      <div style={{ 
                        color: seat.room && seat.room !== '-' ? '#22c55e' : '#fbbf24', 
                        fontWeight: 700, 
                        fontSize: '20px', 
                        letterSpacing: '-0.02em',
                        fontStyle: seat.room === '-' ? 'italic' : 'normal'
                      }}>{seat.room || '-'}</div>
                      {seat.building && seat.building !== '-' && (
                        <div style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '12px', 
                          marginTop: '6px',
                          fontWeight: 500
                        }}>{seat.building}</div>
                      )}
                      {seat.floor && seat.floor !== '-' && (
                        <div style={{ 
                          color: 'var(--text-primary)', 
                          fontSize: '16px', 
                          marginTop: '8px',
                          fontWeight: 600
                        }}>Floor: {seat.floor}</div>
                      )}
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subject Code</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px' }}>{seat.subcode || '-'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Department</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px' }}>{seat.department || '-'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Session</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px' }}>{seat.session || '-'}</div>
                    </div>
                  </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


