import React, { useState, useEffect, useRef } from 'react';

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
  const [apiResults, setApiResults] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [useLiveAPI, setUseLiveAPI] = useState(true); // Toggle between live API and static data
  const autoRefreshIntervalRef = useRef(null);

  // Check if desktop/mobile on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 768); // Better mobile detection
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

  // Convert date to API format (YYYY-MM-DD or DD-MM-YYYY)
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return null;
    
    // If already in DD/MM/YYYY or DD-MM-YYYY format
    if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(dateStr)) {
      const parts = dateStr.split(/[-\/]/);
      const [day, month, year] = parts;
      // Return both formats for API to try
      return `${day}-${month}-${year}`; // DD-MM-YYYY
    }
    
    // If it's a Date object
    if (dateStr instanceof Date) {
      const day = String(dateStr.getDate()).padStart(2, '0');
      const month = String(dateStr.getMonth() + 1).padStart(2, '0');
      const year = dateStr.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return dateStr;
  };

  const getSelectedDate = () => {
    return dateInput || formatDate(today);
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

  // Navigate to previous day
  const handlePreviousDay = () => {
    const currentDate = getSelectedDate();
    if (!currentDate) {
      setDateInput(formatDate(today));
      setExamDate('custom');
      return;
    }
    
    const [day, month, year] = currentDate.split('/');
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    
    const newDateStr = formatDate(date);
    setDateInput(newDateStr);
    setExamDate('custom');
    setError(null);
    setSeatInfo(null);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const currentDate = getSelectedDate();
    if (!currentDate) {
      setDateInput(formatDate(tomorrow));
      setExamDate('custom');
      return;
    }
    
    const [day, month, year] = currentDate.split('/');
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    
    const newDateStr = formatDate(date);
    setDateInput(newDateStr);
    setExamDate('custom');
    setError(null);
    setSeatInfo(null);
  };

  // Validate RA number format
  const validateRA = (ra) => {
    const trimmed = ra.trim().toUpperCase();
    
    // Check if empty
    if (!trimmed) {
      return { valid: false, error: 'Please enter your register number' };
    }
    
    // Check if starts with RA
    if (!trimmed.startsWith('RA')) {
      return { valid: false, error: 'Register number must start with "RA"' };
    }
    
    // Extract the digits part (everything after "RA")
    const digitsPart = trimmed.substring(2);
    
    // Check if there are any digits after RA
    if (!digitsPart || digitsPart.length === 0) {
      return { valid: false, error: 'Register number must have digits after "RA"' };
    }
    
    // Check if all characters after RA are digits
    if (!/^\d+$/.test(digitsPart)) {
      return { valid: false, error: 'Register number must contain only digits after "RA"' };
    }
    
    // Check minimum length (RA + at least 13 digits for full RA = 15 characters minimum)
    // Full RA format: RA + 13 digits (e.g., RA2311003012246)
    if (trimmed.length < 15) {
      return { valid: false, error: 'Register number is incomplete. Please enter the full RA number (e.g., RA2311003012246)' };
    }
    
    // Check that the last 6 digits are valid (must be exactly 6 digits at the end)
    if (digitsPart.length < 6) {
      return { valid: false, error: 'Register number must have at least 6 digits after "RA"' };
    }
    
    // Extract last 6 digits
    const last6Digits = digitsPart.slice(-6);
    
    // Validate last 6 digits are numeric (should already be checked, but double-check)
    if (!/^\d{6}$/.test(last6Digits)) {
      return { valid: false, error: 'Invalid register number format. Last 6 digits must be numeric' };
    }
    
    // Check if the last 6 digits are all zeros (likely invalid)
    if (last6Digits === '000000') {
      return { valid: false, error: 'Invalid register number. Last 6 digits cannot be all zeros' };
    }
    
    return { valid: true, error: null };
  };

  const handleRegisterNumberChange = (e) => {
    // Convert to uppercase for consistency, but allow any case input
    const value = e.target.value.toUpperCase();
    setRegisterNumber(value);
    
    // Clear previous errors and seat info
    setSeatInfo(null);
    
    // Real-time validation feedback (only show error if user has typed something and it's incomplete)
    if (value.trim().length > 0) {
      const validation = validateRA(value);
      if (!validation.valid && value.trim().length >= 3) { // Only show error if they've typed at least "RA" + 1 char
        setError(validation.error);
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  };

  // Fetch from live API
  const fetchFromLiveAPI = async (ra, date) => {
    try {
      // STEP 1: Get name from Supabase using last digits approach
      // Extract last 4 digits for search (more flexible)
      const lastDigits = ra.slice(-4); // Get last 4 digits (e.g., "0014" from "RA2311033010014")
      let studentName = '-';
      
      try {
        // Pass both lastDigits and full RA for accurate matching
        const nameResponse = await fetch(`/api/get-name-by-last-digits?lastDigits=${lastDigits}&fullRA=${encodeURIComponent(ra)}`);
        if (nameResponse.ok) {
          const nameData = await nameResponse.json();
          if (nameData.success) {
            // Handle single match - verify RA matches
            if (nameData.name && nameData.registerNumber) {
              if (nameData.registerNumber.toUpperCase() === ra.toUpperCase()) {
                studentName = nameData.name;
                console.log('✅ Name from Supabase:', studentName);
              } else {
                console.warn('⚠️ RA mismatch, trying multiple matches...');
              }
            }
            // Handle multiple matches - find exact RA match
            if (studentName === '-' && nameData.matches && Array.isArray(nameData.matches)) {
              const exactMatch = nameData.matches.find(m => 
                m.registerNumber && m.registerNumber.toUpperCase() === ra.toUpperCase()
              );
              if (exactMatch && exactMatch.name) {
                studentName = exactMatch.name;
                console.log('✅ Name from Supabase (multiple matches):', studentName);
              }
            }
          }
        }
      } catch (nameError) {
        console.warn('⚠️ Could not fetch name from Supabase:', nameError);
      }
      
      // STEP 2: Get venue details from seating API
      const apiDate = formatDateForAPI(date);
      const params = new URLSearchParams({ ra });
      if (apiDate) params.append('date', apiDate);
      
      const response = await fetch(`/api/seating?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResults(data);
      setLastUpdated(data.lastUpdated);
      
      // Transform API results to match existing UI format
      const transformedSeats = [];
      
      // Process results from all campuses
      // studentName is already fetched from Supabase above
      Object.keys(data.results || {}).forEach(campusName => {
        const campusResults = data.results[campusName] || [];
        campusResults.forEach(result => {
          if (result.matched) {
            // Format room name: TPTP-401 -> TP-401, TPVPT-301 -> VPT-301
            // Special case: TPVPT-028 -> Room: VPT-028, Building: Valliammai Block Behind TP, Floor: Ground Floor
            let formattedRoom = result.hall || '-';
            let floorNumber = '-';
            let buildingName = campusName; // Default to campus name
            
            if (formattedRoom === 'TPVPT-028') {
              formattedRoom = 'VPT-028';
              buildingName = 'Valliammai Block Behind TP';
              floorNumber = 'Ground Floor';
            } else if (formattedRoom.startsWith('TPTP-')) {
              formattedRoom = formattedRoom.replace('TPTP-', 'TP-');
            } else if (formattedRoom.startsWith('TPVPT-')) {
              formattedRoom = formattedRoom.replace('TPVPT-', 'VPT-');
            }
            
            // Extract floor number from room name (e.g., TP-401 -> 4th, H301F -> 3rd)
            if (formattedRoom !== '-' && floorNumber === '-') {
              // Extract number from room name (e.g., TP-401, UB604, H301F, 1504)
              const floorMatch = formattedRoom.match(/(\d+)/);
              if (floorMatch) {
                const numStr = floorMatch[1];
                // Check if room starts with letter(s) followed by number (e.g., H301F, S45, UB604, VPT-301)
                const letterNumberPattern = /^[A-Z]+[-]?(\d+)/;
                const letterMatch = formattedRoom.match(letterNumberPattern);
                
                if (letterMatch || formattedRoom.startsWith('VPT-')) {
                  // For H301F, S45, UB604, VPT-301 - first digit after letter is floor
                  const firstDigit = parseInt(numStr.charAt(0));
                  floorNumber = `${firstDigit}th`;
                } else if (formattedRoom.startsWith('TP-')) {
                  // For TP-401, the first digit is the floor (4)
                  const firstDigit = parseInt(numStr.charAt(0));
                  floorNumber = `${firstDigit}th`;
                } else {
                  // For 1504 (pure number), first two digits might be floor (15)
                  if (numStr.length >= 2) {
                    const firstTwo = parseInt(numStr.substring(0, 2));
                    floorNumber = `${firstTwo}th`;
                  } else {
                    const firstDigit = parseInt(numStr.charAt(0));
                    floorNumber = `${firstDigit}th`;
                  }
                }
              }
            }
            
            // Use name from Supabase (fetched earlier), fallback to API name if needed
            let finalName = studentName; // studentName is from Supabase lookup above
            
            // Fallback to API name if Supabase name is still '-'
            if (finalName === '-' && result.name) {
              const apiName = String(result.name).trim();
              if (apiName.length > 0) {
                finalName = apiName;
                console.log('✅ Using API name as fallback:', finalName);
              }
            }
            
            const seatData = {
              registerNumber: ra.toUpperCase(),
              name: finalName,
              department: result.department || '-', // Use API department (from exam seating data)
              room: formattedRoom,
              floor: floorNumber,
              building: buildingName,
              subcode: result.subjectCode || '-',
              session: result.session || '-',
              bench: result.bench || '-', // Seat number
              date: date,
              context: result.context,
              url: result.url,
              campus: campusName
            };
            
            // Debug logging
            console.log('🔍 Seat Transformation:', {
              ra: ra,
              supabaseName: studentName,
              apiName: result.name,
              finalName: seatData.name,
              hall: result.hall,
              formattedRoom: formattedRoom
            });
            
            transformedSeats.push(seatData);
          }
        });
      });
      
      if (transformedSeats.length > 0) {
        console.log('✅ Transformed seats:', transformedSeats);
        // Log name for debugging
        transformedSeats.forEach((seat, idx) => {
          console.log(`Seat ${idx}:`, {
            ra: seat.registerNumber,
            name: seat.name,
            room: seat.room,
            nameType: typeof seat.name,
            nameIsDash: seat.name === '-',
            nameTruthy: !!seat.name
          });
          
          // Final check - if name is still '-', try to fix it
          if (seat.name === '-' && seat.registerNumber === 'RA2311033010014') {
            console.error('❌ CRITICAL: Name is still "-" in final array!', seat);
          }
        });
        setSeatInfo(transformedSeats);
        setError(null);
      } else {
        setSeatInfo(null);
        setError('No seating information found for this register number and date.');
      }
    } catch (err) {
      console.error('Error in fetchFromLiveAPI:', err);
      setSeatInfo(null);
      setError('Failed to fetch seat information. Please try again.');
      throw err; // Re-throw to be caught by handleFindSeat's finally block
    }
  };

  // Fetch from static JSON data (fallback)
  const fetchFromStaticData = async (ra, date) => {
    const regNoUpper = ra.trim().toUpperCase();
    const normalizeDate = (dateStr) => {
      if (!dateStr) return '';
      return dateStr.replace(/\//g, '/');
    };
    
    const normalizedSelectedDate = normalizeDate(date);
    const allMatchingSeats = seatData.filter(seat => {
      const seatRegNo = seat.registerNumber ? seat.registerNumber.toUpperCase() : '';
      return seatRegNo === regNoUpper;
    });
    
    if (allMatchingSeats.length === 0) {
      setError('Register number not found');
      setSeatInfo(null);
      return;
    }
    
    const permanentData = {
      name: allMatchingSeats[0].name || '-',
      department: allMatchingSeats[0].department || '-'
    };
    
    const foundSeats = normalizedSelectedDate 
      ? allMatchingSeats.filter(seat => {
          const seatDate = normalizeDate(seat.date);
          return seatDate === normalizedSelectedDate || !seatDate || seatDate === '';
        })
      : allMatchingSeats;
    
    // Helper function to format room and extract floor
    const formatRoomAndFloor = (room, existingBuilding = null) => {
      if (!room || room === '-') {
        return { formattedRoom: '-', floorNumber: '-', buildingName: existingBuilding || '-' };
      }
      
      // Format room name: TPTP-401 -> TP-401, TPVPT-301 -> VPT-301
      // Special case: TPVPT-028 -> Room: VPT-028, Building: Valliammai Block Behind TP, Floor: Ground Floor
      let formattedRoom = room;
      let floorNumber = '-';
      let buildingName = existingBuilding || null;
      
      if (formattedRoom === 'TPVPT-028') {
        formattedRoom = 'VPT-028';
        buildingName = 'Valliammai Block Behind TP';
        floorNumber = 'Ground Floor';
      } else if (formattedRoom.startsWith('TPTP-')) {
        formattedRoom = formattedRoom.replace('TPTP-', 'TP-');
      } else if (formattedRoom.startsWith('TPVPT-')) {
        formattedRoom = formattedRoom.replace('TPVPT-', 'VPT-');
      }
      
      // Extract floor number from room name (e.g., TP-401 -> 4th, H301F -> 3rd, VPT-301 -> 3rd)
      if (floorNumber === '-') {
        const floorMatch = formattedRoom.match(/(\d+)/);
        if (floorMatch) {
          const numStr = floorMatch[1];
          // Check if room starts with letter(s) followed by number (e.g., H301F, S45, UB604, VPT-301)
          const letterNumberPattern = /^[A-Z]+[-]?(\d+)/;
          const letterMatch = formattedRoom.match(letterNumberPattern);
          
          if (letterMatch || formattedRoom.startsWith('VPT-')) {
            // For H301F, S45, UB604, VPT-301 - first digit after letter is floor
            const firstDigit = parseInt(numStr.charAt(0));
            floorNumber = `${firstDigit}th`;
          } else if (formattedRoom.startsWith('TP-')) {
            // For TP-401, the first digit is the floor (4)
            const firstDigit = parseInt(numStr.charAt(0));
            floorNumber = `${firstDigit}th`;
          } else {
            // For 1504 (pure number), first two digits might be floor (15)
            if (numStr.length >= 2) {
              const firstTwo = parseInt(numStr.substring(0, 2));
              floorNumber = `${firstTwo}th`;
            } else {
              const firstDigit = parseInt(numStr.charAt(0));
              floorNumber = `${firstDigit}th`;
            }
          }
        }
      }
      
      return { formattedRoom, floorNumber, buildingName: buildingName || '-' };
    };
    
    if (foundSeats.length === 0) {
      setSeatInfo([{
        registerNumber: regNoUpper,
        name: permanentData.name,
        department: permanentData.department,
        room: '-',
        floor: '-',
        building: '-',
        subcode: '-',
        session: '-',
        date: date
      }]);
    } else {
      const mergedSeats = foundSeats.map(seat => {
        const { formattedRoom, floorNumber, buildingName } = formatRoomAndFloor(seat.room, seat.building);
        return {
          ...seat,
          name: seat.name || permanentData.name || '-',
          department: seat.department || permanentData.department || '-',
          room: formattedRoom,
          floor: floorNumber,
          building: buildingName
        };
      });
      setSeatInfo(mergedSeats);
    }
  };

  const handleFindSeat = async () => {
    // Validate RA number
    const validation = validateRA(registerNumber);
    if (!validation.valid) {
      setError(validation.error);
      setSeatInfo(null);
      setApiResults(null);
      return;
    }

    const selectedDate = getSelectedDate();
    setLoading(true);
    setError(null);
    setSeatInfo(null);
    setApiResults(null);

    try {
      if (useLiveAPI) {
        await fetchFromLiveAPI(registerNumber.trim(), selectedDate);
      } else {
        await fetchFromStaticData(registerNumber.trim(), selectedDate);
      }
    } catch (err) {
      console.error('Error in handleFindSeat:', err);
      setError(err.message || 'Failed to fetch seat information. Please try again.');
      setSeatInfo(null);
    } finally {
      // Always clear loading state, even on error
      setLoading(false);
    }
  };

  // Auto-refresh every 3 minutes if seat info exists (ideal balance)
  useEffect(() => {
    if (seatInfo && seatInfo.length > 0 && useLiveAPI && registerNumber.trim()) {
      // Clear existing interval
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      
      // Set up new interval
      const refresh = () => {
        const selectedDate = getSelectedDate();
        fetchFromLiveAPI(registerNumber.trim(), selectedDate).catch(err => {
          console.error('Auto-refresh error:', err);
        });
      };
      
      autoRefreshIntervalRef.current = setInterval(refresh, 3 * 60 * 1000); // 3 minutes - ideal refresh rate
      
      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
        }
      };
    } else {
      // Clear interval if conditions not met
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    }
  }, [seatInfo, useLiveAPI, registerNumber, examDate, dateInput]);

  const hasSeatInfo = seatInfo && seatInfo.length > 0;

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0',
      minHeight: isMobile ? 'auto' : 'calc(100vh - 60px)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{
        display: isDesktop && hasSeatInfo ? 'flex' : 'block',
        gap: '32px',
        alignItems: 'flex-start',
        padding: isMobile ? '20px 16px' : 'clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)',
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
              {/* Live Real-Time Tagline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '8px',
                flexWrap: 'wrap',
                maxWidth: '100%',
                padding: '0 clamp(10px, 3vw, 20px)'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'livePulse 2s ease-in-out infinite',
                  boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)',
                  flexShrink: 0
                }}></div>
                <span style={{
                  fontSize: 'clamp(10px, 2.5vw, 12px)',
                  fontWeight: 500,
                  color: '#22c55e',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  Data fetched with the frequency of 1 minute with exceptional accuracy
                </span>
              </div>
            </div>
          )}
          
        {/* Main Card */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: isMobile ? '20px 16px' : 'clamp(20px, 5vw, 32px)',
          marginBottom: '24px',
          position: 'relative',
          minHeight: loading ? '200px' : 'auto'
        }}>
          {/* Loading Overlay */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(12px, 3vw, 16px)',
              zIndex: 1000,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'auto'
            }}>
              {/* Circular Loading Spinner */}
              <div style={{
                width: 'clamp(48px, 12vw, 56px)',
                height: 'clamp(48px, 12vw, 56px)',
                border: '4px solid var(--border-color)',
                borderTop: '4px solid var(--text-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{
                fontSize: isMobile ? '16px' : 'clamp(14px, 3.5vw, 16px)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: 0,
                opacity: 0.9
              }}>
                Fetching seat details...
              </p>
            </div>
          )}
          
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
              background: 'rgba(251, 191, 36, 0.05)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
              borderRadius: '8px',
              padding: 'clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 14px)',
              marginBottom: 'clamp(20px, 5vw, 24px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'clamp(6px, 1.5vw, 8px)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '2px', minWidth: '14px', width: 'clamp(14px, 3.5vw, 16px)', height: 'clamp(14px, 3.5vw, 16px)', opacity: 0.7 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p style={{
                fontSize: 'clamp(11px, 2.8vw, 12px)',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: '1.5',
                opacity: 0.8
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
            {/* Date Navigator with Arrows */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2.5vw, 12px)',
              width: '100%'
            }}>
              {/* Left Arrow */}
              <button
                onClick={handlePreviousDay}
                style={{
              width: isMobile ? '52px' : 'clamp(48px, 12vw, 52px)',
              height: isMobile ? '52px' : 'clamp(48px, 12vw, 52px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'var(--text-primary)';
                    e.currentTarget.style.color = 'var(--bg-primary)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.background = 'var(--text-primary)';
                  e.currentTarget.style.color = 'var(--bg-primary)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
                }}
              >
                <svg width="clamp(18px, 4.5vw, 20px)" height="clamp(18px, 4.5vw, 20px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              {/* Date Display/Input */}
              <div style={{
                flex: 1,
                position: 'relative',
                minWidth: 0
              }}>
                <input
                  type="text"
                  value={dateInput || formatDate(today)}
                  onChange={handleDateInputChange}
                  placeholder="DD/MM/YYYY"
                  style={{
                    width: '100%',
                    padding: 'clamp(12px, 3.5vw, 14px) clamp(10px, 2.5vw, 16px)',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: 500,
                    border: '1px solid var(--border-color)',
                    borderRadius: 'clamp(8px, 2vw, 10px)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    minHeight: isMobile ? '52px' : 'clamp(48px, 12vw, 52px)',
                    textAlign: 'center',
                    touchAction: 'manipulation',
                    WebkitAppearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    fontSize: isMobile ? '16px' : 'clamp(14px, 4vw, 16px)' // Prevent zoom on iOS
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--text-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              {/* Right Arrow */}
              <button
                onClick={handleNextDay}
                style={{
              width: isMobile ? '52px' : 'clamp(48px, 12vw, 52px)',
              height: isMobile ? '52px' : 'clamp(48px, 12vw, 52px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'var(--text-primary)';
                    e.currentTarget.style.color = 'var(--bg-primary)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.background = 'var(--text-primary)';
                  e.currentTarget.style.color = 'var(--bg-primary)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.background = 'var(--card-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
                }}
              >
                <svg width="clamp(18px, 4.5vw, 20px)" height="clamp(18px, 4.5vw, 20px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
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
              placeholder="Enter your full RA number"
              className="seatfinder-ra-input"
              style={{
                width: '100%',
                padding: 'clamp(12px, 3vw, 14px) clamp(14px, 4vw, 16px)',
                fontSize: isMobile ? '16px' : 'clamp(14px, 3.5vw, 16px)',
                border: error && registerNumber.trim().length >= 3 
                  ? '1px solid #ef4444' 
                  : '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
                minHeight: isMobile ? '52px' : '44px',
                touchAction: 'manipulation',
                WebkitAppearance: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
              onFocus={(e) => {
                const validation = validateRA(registerNumber);
                if (!validation.valid && registerNumber.trim().length >= 3) {
                  e.currentTarget.style.borderColor = '#ef4444';
                } else {
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                }
              }}
              onBlur={(e) => {
                const validation = validateRA(registerNumber);
                if (!validation.valid && registerNumber.trim().length >= 3) {
                  e.currentTarget.style.borderColor = '#ef4444';
                } else {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
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
              minHeight: isMobile ? '56px' : '48px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
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

          {/* Last Updated Indicator */}
          {lastUpdated && seatInfo && seatInfo.length > 0 && (
            <div style={{
              marginTop: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(8px, 2vw, 10px) clamp(12px, 3vw, 14px)',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 2vw, 8px)',
              fontSize: 'clamp(11px, 2.5vw, 12px)',
              color: 'var(--text-secondary)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
              {useLiveAPI && (
                <span style={{ marginLeft: 'auto', fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.7 }}>
                  Auto-refreshing every 3 minutes
                </span>
              )}
            </div>
          )}

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

          {/* Contact Information */}
          <div style={{
            marginTop: 'clamp(20px, 5vw, 24px)',
            paddingTop: 'clamp(16px, 4vw, 20px)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: 'clamp(10px, 2.5vw, 11px)',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5',
              opacity: 0.7
            }}>
              For any Problems/inquiries contact{' '}
              <a 
                href="mailto:ha1487@srmist.edu.in" 
                style={{
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  opacity: 0.9
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                  e.currentTarget.style.opacity = '0.9';
                }}
              >
                ha1487@srmist.edu.in
              </a>
            </p>
          </div>

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
                // Also check the original hall name for TPVPT before it was formatted
                const originalHallUpper = seat.context && typeof seat.context === 'string' ? seat.context.toUpperCase() : '';
                const hasTPVPT = originalHallUpper.includes('TPVPT') || roomUpper.includes('VPT') || roomUpper.includes('TPVPT');
                const hasImage = roomUpper && roomUpper.length > 0 && (roomUpper.startsWith('TP2') || roomUpper.startsWith('TP') || roomUpper.includes('UB') || hasTPVPT);
                
                return (
                <div key={index} style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  borderRadius: '12px',
                  padding: isMobile ? '16px' : 'clamp(12px, 3vw, 20px)',
                  marginBottom: index < seatInfo.length - 1 ? (isMobile ? '16px' : 'clamp(12px, 3vw, 16px)') : '0',
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
                          maxWidth: isMobile ? '180px' : 'none',
                          margin: isMobile ? '0 auto 12px auto' : '0',
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
                              maxHeight: isMobile ? '180px' : '300px',
                              maxWidth: isMobile ? '100%' : 'none',
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
                    } else if (hasTPVPT || roomUpper.includes('VPT') || roomUpper.includes('TPVPT')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: isMobile ? '100%' : 'clamp(100px, 20vw, 150px)',
                          maxWidth: isMobile ? '180px' : 'none',
                          margin: isMobile ? '0 auto 12px auto' : '0',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/VPT.JPG" 
                            alt="VPT Venue Map" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              borderRadius: '14px',
                              maxHeight: isMobile ? '180px' : '300px',
                              maxWidth: isMobile ? '100%' : 'none',
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
                          maxWidth: isMobile ? '180px' : 'none',
                          margin: isMobile ? '0 auto 12px auto' : '0',
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
                              maxHeight: isMobile ? '180px' : '300px',
                              maxWidth: isMobile ? '100%' : 'none',
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
                          maxWidth: isMobile ? '180px' : 'none',
                          margin: isMobile ? '0 auto 12px auto' : '0',
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
                              maxHeight: isMobile ? '180px' : '300px',
                              maxWidth: isMobile ? '100%' : 'none',
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
                  {/* Name Box */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '10px',
                    padding: 'clamp(10px, 2.5vw, 12px)',
                    marginBottom: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</div>
                    <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
                      {(() => {
                        const displayName = seat.name && seat.name !== '-' ? seat.name : 'N/A';
                        // Debug for specific RA
                        if (seat.registerNumber === 'RA2311033010014') {
                          console.log('🎯 Mobile Display - Name:', {
                            seatName: seat.name,
                            seatNameType: typeof seat.name,
                            displayName: displayName,
                            seatObject: seat
                          });
                        }
                        return displayName;
                      })()}
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: 'clamp(10px, 2.5vw, 16px)',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: seat.room && seat.room !== '-' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
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
                    </div>
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.1)',
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floor</div>
                      <div style={{ 
                        color: '#fbbf24', 
                        fontWeight: 700, 
                        fontSize: 'clamp(14px, 3.5vw, 18px)'
                      }}>{seat.floor && seat.floor !== '-' ? seat.floor : 'N/A'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seat No.</div>
                      <div style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 'clamp(14px, 3.5vw, 18px)' }}>{seat.bench && seat.bench !== '-' ? seat.bench : 'N/A'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Code</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 'clamp(13px, 3vw, 15px)' }}>{seat.subcode || '-'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</div>
                      <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: 'clamp(13px, 3vw, 15px)' }}>{seat.department && seat.department !== '-' ? seat.department : 'N/A'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      padding: isMobile ? '12px' : 'clamp(10px, 2.5vw, 12px)',
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
                // Also check the original hall name for TPVPT before it was formatted
                const originalHallUpper = seat.context && typeof seat.context === 'string' ? seat.context.toUpperCase() : '';
                const hasTPVPT = originalHallUpper.includes('TPVPT') || roomUpper.includes('VPT') || roomUpper.includes('TPVPT');
                const hasImage = roomUpper && roomUpper.length > 0 && (roomUpper.startsWith('TP2') || roomUpper.startsWith('TP') || roomUpper.includes('UB') || hasTPVPT);
                
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
                    } else if (hasTPVPT || roomUpper.includes('VPT') || roomUpper.includes('TPVPT')) {
                      return (
                        <div style={{
                          flexShrink: 0,
                          width: '180px',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <img 
                            src="/VPT.JPG" 
                            alt="VPT Venue Map" 
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
                  {/* Name Box */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '16px',
                    border: '1.5px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                  }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</div>
                    <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: '18px' }}>
                      {(() => {
                        const displayName = seat.name && seat.name !== '-' ? seat.name : 'N/A';
                        // Debug for specific RA
                        if (seat.registerNumber === 'RA2311033010014') {
                          console.log('🎯 Desktop Display - Name:', {
                            seatName: seat.name,
                            seatNameType: typeof seat.name,
                            displayName: displayName,
                            seatObject: seat
                          });
                        }
                        return displayName;
                      })()}
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '14px',
                    fontSize: '14px',
                    width: '100%',
                    overflow: 'hidden'
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
                    </div>
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1.5px solid rgba(251, 191, 36, 0.3)',
                      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Floor</div>
                      <div style={{ 
                        color: '#fbbf24', 
                        fontWeight: 700, 
                        fontSize: '20px', 
                        letterSpacing: '-0.02em'
                      }}>{seat.floor && seat.floor !== '-' ? seat.floor : 'N/A'}</div>
                    </div>
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1.5px solid rgba(139, 92, 246, 0.3)',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seat No.</div>
                      <div style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.02em' }}>{seat.bench && seat.bench !== '-' ? seat.bench : 'N/A'}</div>
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
                      background: 'rgba(59, 130, 246, 0.15)',
                      borderRadius: '12px',
                      padding: '14px',
                      border: '1.5px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                    }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Department</div>
                      <div style={{ color: '#3b82f6', fontWeight: 600, fontSize: '16px' }}>{seat.department && seat.department !== '-' ? seat.department : 'N/A'}</div>
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


