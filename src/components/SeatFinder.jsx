import React, { useState, useEffect } from 'react';

export default function SeatFinder() {
  const [examDate, setExamDate] = useState('today');
  const [dateInput, setDateInput] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seatInfo, setSeatInfo] = useState(null);
  const [seatData, setSeatData] = useState([]);

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
    setRegisterNumber(e.target.value);
    setError(null);
    setSeatInfo(null);
  };

  const handleFindSeat = async () => {
    if (!registerNumber.trim()) {
      setError('Please enter your register number');
      return;
    }

    const selectedDate = getSelectedDate();
    if (!selectedDate) {
      setError('Please select or enter an exam date');
      return;
    }

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
      // First, find all seats matching the register number
      const allMatchingSeats = seatData.filter(seat => {
        const seatRegNo = seat.registerNumber ? seat.registerNumber.toUpperCase() : '';
        return seatRegNo === regNoUpper;
      });
      
      // Then filter by date if date is specified, otherwise show all matches
      const foundSeats = normalizedSelectedDate 
        ? allMatchingSeats.filter(seat => {
            const seatDate = normalizeDate(seat.date);
            return seatDate === normalizedSelectedDate || !seatDate || seatDate === '';
          })
        : allMatchingSeats;

      if (foundSeats.length === 0) {
        setError('Register number not found in any venue/session for this date');
      } else {
        setSeatInfo(foundSeats);
      }
    } catch (err) {
      setError('Failed to fetch seat information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '600px',
        margin: '0 auto',
        padding: 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)'
      }}>
        {/* Header */}
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

          {/* Warning Note */}
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

          {/* Seat Info (when found) */}
          {seatInfo && seatInfo.length > 0 && (
            <div style={{
              marginTop: 'clamp(16px, 4vw, 20px)',
              padding: 'clamp(16px, 4vw, 20px)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22c55e', flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3 style={{
                  fontSize: 'clamp(16px, 4vw, 18px)',
                  fontWeight: 600,
                  color: '#22c55e',
                  margin: 0
                }}>
                  Seat Information Found!
                </h3>
              </div>
              
              {seatInfo.map((seat, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: 'clamp(12px, 3vw, 16px)',
                  marginBottom: index < seatInfo.length - 1 ? '12px' : '0',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'clamp(8px, 2vw, 12px)',
                    fontSize: 'clamp(13px, 3.5vw, 14px)'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: 'clamp(11px, 3vw, 12px)' }}>Room/Venue</div>
                      <div style={{ color: '#22c55e', fontWeight: 600 }}>{seat.room || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: 'clamp(11px, 3vw, 12px)' }}>Subject Code</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{seat.subcode || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: 'clamp(11px, 3vw, 12px)' }}>Department</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{seat.department || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: 'clamp(11px, 3vw, 12px)' }}>Session</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{seat.session || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

