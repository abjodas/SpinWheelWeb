import React, { useState, useRef, useEffect } from "react";
import {
  getLocationDistributions,
  updateLocationSlots,
} from "./services/distributionService";
import { recordSpin } from "./services/spinHistoryService";

const SpinWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(() => {
    // Get saved location from localStorage or default to location1
    return localStorage.getItem('selectedGameLocation') || "location1";
  });
  const [rotation, setRotation] = useState(0);
  const [locationData, setLocationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWinning, setShowWinning] = useState(false);
  const wheelRef = useRef(null);
  const audioContextRef = useRef(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioTested, setAudioTested] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAudioUnlock, setShowAudioUnlock] = useState(false);
  const [actualLocation, setActualLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('unknown'); // 'granted', 'denied', 'unknown'

  // Detect mobile device on mount
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
                           ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints > 0);
      setIsMobile(isMobileDevice);
      console.log('📱 Mobile device detected:', isMobileDevice);
    };
    
    detectMobile();
    requestLocation(); // Try to get location on mount
  }, []);

  // Request user's actual location
  const requestLocation = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported by this browser');
      setLocationPermission('denied');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 Location obtained:', { latitude, longitude });
      
      // Reverse geocode to get location name
      const locationName = await reverseGeocode(latitude, longitude);
      
      setActualLocation({
        latitude,
        longitude,
        name: locationName,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      });
      
      setLocationPermission('granted');
      console.log('✅ Location successfully obtained:', locationName);
      
    } catch (error) {
      console.log('❌ Location access denied or failed:', error.message);
      setLocationPermission('denied');
      setActualLocation(null);
    }
  };

  // Reverse geocode coordinates to location name
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using a simple reverse geocoding approach
      // In production, you might want to use a proper service like Google Maps or Mapbox
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      // Extract relevant location information
      const city = data.city || data.locality || data.principalSubdivision;
      const country = data.countryName;
      const region = data.principalSubdivision;
      
      let locationName = '';
      if (city && country) {
        locationName = `${city}, ${country}`;
      } else if (region && country) {
        locationName = `${region}, ${country}`;
      } else if (country) {
        locationName = country;
      } else {
        locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      
      console.log('🌍 Reverse geocoded location:', locationName);
      return locationName;
      
    } catch (error) {
      console.log('⚠️ Reverse geocoding failed:', error);
      // Fallback to coordinates
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Handle location change with persistence
  const handleLocationChange = (newLocation) => {
    setCurrentLocation(newLocation);
    localStorage.setItem('selectedGameLocation', newLocation);
    console.log('🎯 Game location changed and saved:', newLocation);
  };

  // Fetch location data from Firebase on component mount
  useEffect(() => {
    const fetchDistributions = async () => {
      try {
        setLoading(true);
        const data = await getLocationDistributions();
        setLocationData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch distributions:", err);
        setError("Échec du chargement des données de localisation");
        // Fallback to hardcoded data - Lower numbers appear more frequently
        setLocationData({
          location1: { name: "Goma", slots: [100, 80, 60, 40, 25, 15, 8, 3] },
          location2: { name: "Butembo", slots: [95, 75, 55, 35, 22, 13, 7, 3] },
          location3: { name: "Beni", slots: [90, 70, 50, 30, 20, 12, 6, 2] },
          location4: { name: "Bukavu", slots: [85, 65, 45, 25, 18, 10, 5, 2] },
          location5: { name: "Kindu", slots: [105, 85, 65, 45, 28, 17, 10, 4] },
          location6: { name: "Kalemie", slots: [95, 75, 58, 38, 24, 16, 9, 4] },
          location7: { name: "Bunia", slots: [90, 70, 52, 35, 22, 14, 8, 4] },
          location8: { name: "Uvira", slots: [88, 68, 50, 32, 20, 13, 7, 3] },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDistributions();
  }, []);

  // Cleanup AudioContext on component unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Wheel segments with colors
  const segments = [
    { number: 1, color: "#FF6B6B", angle: 0 },
    { number: 2, color: "#4ECDC4", angle: 45 },
    { number: 3, color: "#45B7D1", angle: 90 },
    { number: 4, color: "#96CEB4", angle: 135 },
    { number: 5, color: "#FFEAA7", angle: 180 },
    { number: 6, color: "#DDA0DD", angle: 225 },
    { number: 7, color: "#98D8C8", angle: 270 },
    { number: 8, color: "#F7DC6F", angle: 315 },
  ];

  // Initialize AudioContext - keep single context alive for session
  const initializeAudioContext = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.log("AudioContext not supported");
        return false;
      }
      
      // Create AudioContext only if it doesn't exist or is closed
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
        console.log('🔊 AudioContext created. State:', audioContextRef.current.state);
      }

      // Resume AudioContext if suspended (required for mobile browsers)
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('🔊 AudioContext resumed. State:', audioContextRef.current.state);
        } catch (error) {
          console.log('Failed to resume AudioContext:', error);
          return false;
        }
      }

      // Check if context is running
      if (audioContextRef.current.state === 'running') {
        setAudioEnabled(true);
        console.log('✅ AudioContext ready for audio playback. State:', audioContextRef.current.state);
        
        // Immediate synchronous test (no setTimeout to avoid race conditions)
        testAudioPlayback();
        
        console.log('🔊 Audio initialization complete. Enabled:', true, 'Context state:', audioContextRef.current.state);
        return true;
      }

      console.log('❌ AudioContext not running. State:', audioContextRef.current.state);
      setAudioEnabled(false);
      return false;
    } catch (error) {
      console.log("❌ Audio initialization failed:", error);
      setAudioEnabled(false);
      return false;
    }
  };

  // Manual audio unlock for problematic mobile devices
  const unlockAudio = async () => {
    try {
      console.log('🔓 Manual audio unlock initiated');
      const audioReady = await initializeAudioContext();
      
      if (audioReady) {
        // Play a short, audible unlock sound to verify audio works
        const audioContext = audioContextRef.current;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        setShowAudioUnlock(false);
        console.log('🔊 Audio unlocked successfully');
      } else {
        console.log('❌ Audio unlock failed');
      }
    } catch (error) {
      console.log('❌ Audio unlock error:', error);
    }
  };

  // Simple audio test - silent verification that context works
  const testAudioPlayback = () => {
    try {
      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state !== 'running') {
        console.log('❌ Cannot test audio - context not running');
        setAudioEnabled(false);
        return;
      }

      // Create a very brief, very quiet test tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      
      // Nearly silent test (just to verify audio path works)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
      
      console.log('🔊 Audio test completed successfully');
    } catch (error) {
      console.log('❌ Audio test failed:', error);
      setAudioEnabled(false);
    }
  };

  // Get weighted random number based on location slots
  const getWeightedNumber = () => {
    const slots = locationData[currentLocation].slots;
    const weightedNumbers = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < slots[i]; j++) {
        weightedNumbers.push(i + 1);
      }
    }

    // Safety check: if no slots are available, return null
    if (weightedNumbers.length === 0) {
      console.warn("Aucun emplacement disponible pour l'emplacement actuel:", currentLocation);
      return null;
    }

    return weightedNumbers[Math.floor(Math.random() * weightedNumbers.length)];
  };

  // Enhanced multi-phase spin sound system
  const playSpinSound = async () => {
    try {
      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state !== 'running') {
        console.log("AudioContext not ready for spin sound. State:", audioContext?.state);
        return;
      }

      const currentTime = audioContext.currentTime;
      
      // Phase 1: Slow mechanical ticking (0-2.5s)
      createTickingPhase(audioContext, currentTime, 0, 2.5, 150, 200, 0.4, 0.15);
      
      // Phase 2: Accelerating ticks with rising pitch (2.5-5s) 
      createTickingPhase(audioContext, currentTime, 2.5, 2.5, 200, 400, 0.2, 0.12);
      
      // Phase 3: Rapid ticking that gradually slows (5-6.5s)
      createTickingPhase(audioContext, currentTime, 5, 1.5, 400, 250, 0.1, 0.08);
      
      // Phase 4: Final slow clicks (6.5-7s)
      createFinalClicks(audioContext, currentTime, 6.5, 0.5);
      
    } catch (error) {
      console.log("Spin audio playback failed:", error);
    }
  };

  // Helper function to create ticking phases
  const createTickingPhase = (audioContext, startTime, delay, duration, startFreq, endFreq, startInterval, endInterval) => {
    const phaseStart = startTime + delay;
    const phaseEnd = phaseStart + duration;
    let currentTickTime = phaseStart;
    
    while (currentTickTime < phaseEnd) {
      // Calculate progress through this phase (0 to 1)
      const progress = (currentTickTime - phaseStart) / duration;
      
      // Interpolate frequency and interval
      const frequency = startFreq + (endFreq - startFreq) * progress;
      const nextInterval = startInterval + (endInterval - startInterval) * progress;
      
      // Create tick sound
      createTick(audioContext, currentTickTime, frequency, 0.05, 0.15);
      
      currentTickTime += nextInterval;
    }
  };

  // Helper function to create final dramatic clicks
  const createFinalClicks = (audioContext, startTime, delay, duration) => {
    const clickTimes = [delay, delay + 0.15, delay + 0.35]; // Three final clicks
    
    clickTimes.forEach((time, index) => {
      if (time < delay + duration) {
        const frequency = 180 - (index * 30); // Descending pitch
        const volume = 0.2 - (index * 0.04); // Diminishing volume
        createTick(audioContext, startTime + time, frequency, 0.08, volume);
      }
    });
  };

  // Helper function to create individual tick sounds
  const createTick = (audioContext, time, frequency, duration, volume) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    // Simple audio routing: oscillator -> filter -> gain -> destination
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillator
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, time);
    
    // Configure filter for realistic mechanical sound
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(frequency * 1.5, time);
    filter.Q.setValueAtTime(2, time);

    // Configure volume envelope (quick attack, quick decay)
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume * 1.5, time + 0.01); // Moderate volume boost
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Start and stop the oscillator
    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const playWinSound = () => {
    try {
      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state !== 'running') {
        console.log("AudioContext not ready for win sound. State:", audioContext?.state);
        return;
      }

      // Use standard pleasant frequencies
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C progression

      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine"; // Clean sine wave
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.2);
        gainNode.gain.linearRampToValueAtTime(
          0.3, // Moderate volume level
          audioContext.currentTime + index * 0.2 + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + index * 0.2 + 0.5
        );

        oscillator.start(audioContext.currentTime + index * 0.2);
        oscillator.stop(audioContext.currentTime + index * 0.2 + 0.5);
      });
      
      console.log("Win sound played successfully");
    } catch (error) {
      console.log("Win audio playback failed:", error);
    }
  };

  // Special jackpot sound for number 8
  const playJackpotSound = () => {
    try {
      const audioContext = audioContextRef.current;
      if (!audioContext || audioContext.state !== 'running') {
        console.log("AudioContext not ready for jackpot sound. State:", audioContext?.state);
        return;
      }

      // Royal fanfare - extended triumphant sequence
      const fanfareNotes = [
        // First flourish
        { freq: 523.25, start: 0, duration: 0.3, volume: 0.25 }, // C5
        { freq: 659.25, start: 0.1, duration: 0.3, volume: 0.25 }, // E5
        { freq: 783.99, start: 0.2, duration: 0.3, volume: 0.25 }, // G5
        { freq: 1046.5, start: 0.3, duration: 0.5, volume: 0.3 }, // C6
        
        // Second flourish with harmonies
        { freq: 1174.7, start: 0.8, duration: 0.4, volume: 0.3 }, // D6
        { freq: 1318.5, start: 1.0, duration: 0.4, volume: 0.3 }, // E6
        { freq: 1568.0, start: 1.2, duration: 0.6, volume: 0.35 }, // G6
        
        // Final triumphant chord progression
        { freq: 523.25, start: 2.0, duration: 1.0, volume: 0.2 }, // C5
        { freq: 659.25, start: 2.0, duration: 1.0, volume: 0.2 }, // E5
        { freq: 783.99, start: 2.0, duration: 1.0, volume: 0.2 }, // G5
        { freq: 1046.5, start: 2.0, duration: 1.0, volume: 0.25 }, // C6
        { freq: 1568.0, start: 2.0, duration: 1.0, volume: 0.25 }, // G6
      ];

      fanfareNotes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        // Simple audio routing
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure oscillator with slight vibrato
        oscillator.type = "triangle"; // Warmer tone than sine
        oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.start);
        
        // Add slight vibrato for richness
        oscillator.frequency.exponentialRampToValueAtTime(
          note.freq * 1.02, 
          audioContext.currentTime + note.start + note.duration * 0.5
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          note.freq, 
          audioContext.currentTime + note.start + note.duration
        );

        // Configure filter for warmth
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(note.freq * 3, audioContext.currentTime + note.start);
        filter.Q.setValueAtTime(1, audioContext.currentTime + note.start);

        // Configure volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
        gainNode.gain.linearRampToValueAtTime(
          note.volume * 1.2, // Slight volume boost for jackpot
          audioContext.currentTime + note.start + 0.05
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + note.start + note.duration
        );

        oscillator.start(audioContext.currentTime + note.start);
        oscillator.stop(audioContext.currentTime + note.start + note.duration);
      });
      
      console.log("🎺 Jackpot royal fanfare played successfully!");
    } catch (error) {
      console.log("Jackpot audio playback failed:", error);
    }
  };

  // Create confetti effect
  const createConfetti = () => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-piece";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 1 + "s";
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3000);
    }
  };

  // Create special golden confetti for number 8
  const createGoldenConfetti = () => {
    const goldenColors = ["#FFD700", "#FFA500", "#FF8C00", "#FFFF00", "#FFC107"];
    const shapes = ["●", "★", "♦", "♠", "♥", "♣", "✦", "✧"];

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.className = "golden-confetti-piece";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.color = goldenColors[Math.floor(Math.random() * goldenColors.length)];
      confetti.style.fontSize = (10 + Math.random() * 15) + "px";
      confetti.style.animationDelay = Math.random() * 2 + "s";
      confetti.style.animationDuration = (2 + Math.random() * 2) + "s";
      confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      
      // Add golden glow
      confetti.style.textShadow = "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor";
      confetti.style.filter = "drop-shadow(0 0 6px currentColor)";
      
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }
  };

  const spin = async () => {
    if (isSpinning) return;

    // Get target number first
    const targetNumber = getWeightedNumber();

    // Check if no slots are available
    if (targetNumber === null) {
      alert(
        "⚠️ Aucun emplacement disponible à cet endroit. Veuillez contacter le support ou essayer un autre emplacement."
      );
      return;
    }

    setIsSpinning(true);
    setResult(null);
    console.log("🎯 Target number:", targetNumber);

    // Initialize audio context and wait for readiness
    try {
      const audioReady = await initializeAudioContext();
      console.log("🔊 Audio context ready:", audioReady);
      setAudioTested(true);
      
      if (audioReady) {
        // Wait for audio context to be fully stable, then play spin sound
        setTimeout(() => {
          // Debug logging for timing issue
          console.log("🔍 Spin sound verification - Context exists:", !!audioContextRef.current, 
                     "State:", audioContextRef.current?.state, 
                     "AudioEnabled:", audioEnabled);
          
          // Simplified verification - just check if AudioContext exists and is running
          if (audioContextRef.current && audioContextRef.current.state === 'running') {
            console.log("🔊 Playing spin sound - AudioContext verified ready");
            playSpinSound().catch(error => {
              console.log("Spin sound failed:", error);
            });
          } else {
            console.log("⚠️ AudioContext not ready for spin sound. State:", audioContextRef.current?.state);
          }
        }, 150); // Reduced delay since we're being less strict
      } else {
        console.log("⚠️ Audio not available on this device/browser");
        if (isMobile && !audioTested) {
          setShowAudioUnlock(true);
          console.log("📱 Showing audio unlock option for mobile device");
        }
      }
    } catch (error) {
      console.log("Audio initialization failed, proceeding without sound:", error);
      setAudioTested(true);
      if (isMobile && !audioTested) {
        setShowAudioUnlock(true);
        console.log("📱 Showing audio unlock option due to mobile audio failure");
      }
    }

    // Calculate rotation to land on target
    // Each segment is 45 degrees (360/8)
    // Segment 1 is at 0°, segment 2 at 45°, etc.
    const segmentAngle = 45;
    const targetAngle = (targetNumber - 1) * segmentAngle;

    // Add multiple full rotations for dramatic effect
    const spins = 8 + Math.random() * 7; // 8-15 rotations
    // To make the arrow point to the target, we need to rotate so that
    // the target segment comes to the top (where the arrow points)
    const totalRotation = rotation + spins * 360 + (360 - targetAngle);

    console.log("🎪 Rotating to:", totalRotation, "°");

    // Start the visual rotation after audio is ready
    setRotation(totalRotation);

    // Add enhanced spin class for longer transition
    if (wheelRef.current) {
      wheelRef.current.classList.add('enhanced-spin');
      console.log('🎨 Enhanced spin animation activated for rotation:', totalRotation);
    }

    // Wait for animation to complete (7 seconds)
    setTimeout(async () => {
      // Clean up animation classes
      if (wheelRef.current) {
        wheelRef.current.classList.remove('enhanced-spin');
        console.log('🎨 Spin animation completed, final rotation:', totalRotation);
      }
      
      setIsSpinning(false);
      setResult(targetNumber);
      setShowWinning(true);
      
      // Use special effects for number 8 - simplified audio verification
      setTimeout(() => {
        // Simplified verification - just check AudioContext state
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          console.log("🔊 Playing win sound - AudioContext verified ready");
          if (targetNumber === 8) {
            playJackpotSound();
            createGoldenConfetti();
            console.log('🌟 Special number 8 celebration activated!');
          } else {
            playWinSound();
            createConfetti();
          }
        } else {
          console.log("⚠️ AudioContext not ready for win sound. State:", audioContextRef.current?.state);
          if (targetNumber === 8) {
            createGoldenConfetti();
            console.log('🌟 Silent number 8 celebration');
          } else {
            createConfetti();
          }
        }
      }, 200); // Reduced delay
      
      // Hide winning display - 8 seconds for number 8, 5 seconds for others
      const displayDuration = targetNumber === 8 ? 8000 : 5000;
      setTimeout(() => {
        setShowWinning(false);
        setResult(null);
      }, displayDuration);

      // Record the spin result in history
      try {
        await recordSpin({
          location: locationData[currentLocation].name,
          result: targetNumber,
          locationId: currentLocation,
          // Add actual location data if available
          actualLocation: actualLocation ? {
            name: actualLocation.name,
            latitude: actualLocation.latitude,
            longitude: actualLocation.longitude,
            accuracy: actualLocation.accuracy,
            timestamp: actualLocation.timestamp
          } : null,
          locationPermission: locationPermission
        });
        console.log('Spin recorded in history with location data:', actualLocation ? actualLocation.name : 'No real location');
      } catch (err) {
        console.error("Failed to record spin in history:", err);
      }

      // Update slots in Firebase and local state
      const newSlots = locationData[currentLocation].slots.map((slots, index) =>
        index === targetNumber - 1 ? Math.max(0, slots - 1) : slots
      );

      // Update Firebase
      try {
        await updateLocationSlots(currentLocation, newSlots);
      } catch (err) {
        console.error("Failed to update slots in Firebase:", err);
      }

      // Update local state
      setLocationData((prevData) => ({
        ...prevData,
        [currentLocation]: {
          ...prevData[currentLocation],
          slots: newSlots,
        },
      }));
    }, 7000); // Extended to match new 7-second animation
  };

  return (
    <div style={styles.container}>
      {/* Floating particles background */}
      <div style={styles.particleContainer}>
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
              width: `${2 + Math.random() * 6}px`,
              height: `${2 + Math.random() * 6}px`,
              background: `rgba(255,255,255,${0.3 + Math.random() * 0.7})`,
              boxShadow: `0 0 ${4 + Math.random() * 8}px rgba(255,255,255,0.5)`,
            }}
          />
        ))}

        {/* Magical sparkles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              fontSize: `${10 + Math.random() * 20}px`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div style={styles.content}>
        {/* Loading State */}
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <div style={styles.loadingText}>Chargement des emplacements...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.errorText}>⚠️ {error}</div>
            <div style={styles.errorSubtext}>Utilisation des données hors ligne</div>
            <button
              onClick={async () => {
                try {
                  const { doc, setDoc } = await import("firebase/firestore");
                  const distributionsData = {
                    location1: {
                      name: "Goma",
                      slots: [100, 80, 60, 40, 25, 15, 8, 3],
                    },
                    location2: {
                      name: "Butembo",
                      slots: [95, 75, 55, 35, 22, 13, 7, 3],
                    },
                    location3: {
                      name: "Beni",
                      slots: [90, 70, 50, 30, 20, 12, 6, 2],
                    },
                    location4: {
                      name: "Bukavu",
                      slots: [85, 65, 45, 25, 18, 10, 5, 2],
                    },
                    location5: {
                      name: "Kindu",
                      slots: [105, 85, 65, 45, 28, 17, 10, 4],
                    },
                    location6: {
                      name: "Kalemie",
                      slots: [95, 75, 58, 38, 24, 16, 9, 4],
                    },
                    location7: {
                      name: "Bunia",
                      slots: [90, 70, 52, 35, 22, 14, 8, 4],
                    },
                    location8: {
                      name: "Uvira",
                      slots: [88, 68, 50, 32, 20, 13, 7, 3],
                    },
                  };
                  const { db } = await import("./firebase");
                  const distributionsDocRef = doc(
                    db,
                    "locations",
                    "distributions"
                  );
                  await setDoc(distributionsDocRef, distributionsData);
                  alert("✅ Configuration de la base de données terminée! Actualisez la page.");
                } catch (err) {
                  alert("❌ Échec de la configuration: " + err.message);
                }
              }}
              style={styles.setupButton}
            >
              🔧 Configurer la base de données
            </button>
          </div>
        )}

        {!loading && (
          <>
            {/* Winning Display */}
            {showWinning && result && (
              <div className={`winning-display ${result === 8 ? 'number-8-special' : ''}`} style={result === 8 ? {...styles.winningContainer, ...styles.winningContainerSpecial} : styles.winningContainer}>
                <div className={`winning-number ${result === 8 ? 'number-8' : ''}`} style={result === 8 ? {...styles.winningNumber, ...styles.winningNumberSpecial} : styles.winningNumber}>
                  {result}
                </div>
                {result === 8 ? (
                  <>
                    <div style={styles.winningTextSpecial}>
                      🌟 INCROYABLE! VOUS ÊTES LA PERSONNE LA PLUS CHANCEUSE AU MONDE! 🌟
                      <br />
                      <span style={styles.locationTextSpecial}>à {locationData[currentLocation].name}!</span>
                    </div>
                    <div style={styles.winningSubtextSpecial}>
                      🎊 Numéro 8 - Le jackpot suprême! Félicitations extraordinaires! 🎊
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.winningText}>
                      🎊 FÉLICITATIONS! 🎊
                      <br />
                      Vous avez gagné le numéro <strong>{result}</strong>
                      <br />
                      à {locationData[currentLocation].name}!
                    </div>
                    <div style={styles.winningSubtext}>
                      ✨ Fantastique! Vous êtes un gagnant! ✨
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Normal Game View - Hidden during winning display */}
            {!showWinning && (
              <>
                {/* Location Selector */}
                <div style={styles.selectorContainer}>
                  <select
                    value={currentLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    style={styles.select}
                  >
                    <option value="location1">📍 Goma</option>
                    <option value="location2">📍 Butembo</option>
                    <option value="location3">📍 Beni</option>
                    <option value="location4">📍 Bukavu</option>
                    <option value="location5">📍 Kindu</option>
                    <option value="location6">📍 Kalemie</option>
                    <option value="location7">📍 Bunia</option>
                    <option value="location8">📍 Uvira</option>
                  </select>
                </div>

                {/* Wheel Container */}
                <div style={styles.wheelContainer}>
              {/* Wheel */}
              <div style={styles.wheelOuter}>
                <div
                  ref={wheelRef}
                  className={`spinning-wheel ${isSpinning ? 'enhanced-spin' : ''}`}
                  style={{
                    ...styles.wheel,
                    '--total-rotation': `${rotation}deg`,
                    transform: `rotate(${rotation}deg)`,
                    background: `conic-gradient(
                  from 0deg,
                  #FF6B6B 0deg 45deg,
                  #4ECDC4 45deg 90deg,
                  #45B7D1 90deg 135deg,
                  #96CEB4 135deg 180deg,
                  #FFEAA7 180deg 225deg,
                  #DDA0DD 225deg 270deg,
                  #98D8C8 270deg 315deg,
                  #F7DC6F 315deg 360deg
                )`,
                    boxShadow: isSpinning
                      ? "0 0 60px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.4), 0 25px 50px rgba(0,0,0,0.4), inset 0 0 0 3px rgba(255,215,0,0.3)"
                      : "0 0 30px rgba(255,255,255,0.2), 0 25px 50px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(255,255,255,0.1)",
                    animation: !isSpinning
                      ? "glow-pulse 3s ease-in-out infinite"
                      : "none",
                  }}
                >
                  {/* Numbers */}
                  {segments.map((segment) => (
                    <div
                      key={segment.number}
                      style={{
                        ...styles.segmentNumber,
                        transform: `rotate(${segment.angle + 22.5}deg)`,
                      }}
                    >
                      <div
                        style={{
                          ...styles.numberText,
                          transform: `translateY(clamp(-120px, -37vw, -180px)) rotate(${
                            -segment.angle - 22.5
                          }deg)`,
                        }}
                      >
                        {segment.number}
                      </div>
                    </div>
                  ))}

                  {/* Center Circle */}
                  <div style={styles.centerCircle}>🎲</div>
                </div>
              </div>
            </div>

                {/* Audio Unlock Button for Mobile */}
                {showAudioUnlock && (
                  <button
                    onClick={unlockAudio}
                    style={styles.audioUnlockButton}
                  >
                    🔊 Activer le son
                  </button>
                )}

                {/* Spin Button */}
                <button
                  onClick={spin}
                  disabled={isSpinning}
                  className="spin-button"
                  style={{
                    ...styles.spinButton,
                    ...(isSpinning
                      ? styles.spinButtonDisabled
                      : styles.spinButtonActive),
                  }}
                >
                  {isSpinning ? "EN ROTATION..." : "TOURNEZ POUR GAGNER!"}
                  {audioTested && (
                    <span style={styles.audioIndicator}>
                      {audioEnabled ? " 🔊" : " 🔇"}
                    </span>
                  )}
                </button>
              </>
            )}
          </>
        )}
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg) scale(1); 
              filter: brightness(1);
            }
            25% { 
              transform: translateY(-15px) rotate(90deg) scale(1.2); 
              filter: brightness(1.3);
            }
            50% { 
              transform: translateY(-30px) rotate(180deg) scale(0.8); 
              filter: brightness(1.5);
            }
            75% { 
              transform: translateY(-15px) rotate(270deg) scale(1.1); 
              filter: brightness(1.2);
            }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: scale(1); }
            40%, 43% { transform: scale(1.15); }
            70% { transform: scale(1.08); }
            90% { transform: scale(1.03); }
          }

          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg) scale(1);
              opacity: 1;
            }
            50% {
              transform: translateY(50vh) rotate(360deg) scale(1.5);
              opacity: 0.8;
            }
            100% {
              transform: translateY(100vh) rotate(720deg) scale(0.5);
              opacity: 0;
            }
          }

          @keyframes glow-pulse {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.2), 0 0 60px rgba(255,255,255,0.1);
            }
            50% { 
              box-shadow: 0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.3), 0 0 90px rgba(255,255,255,0.2);
            }
          }
          
          .floating-particle {
            position: absolute;
            border-radius: 50%;
            animation: float infinite ease-in-out;
            filter: blur(0.5px);
          }

          .spinning-wheel {
            transition: transform 0.3s ease-out;
          }
          
          .spinning-wheel.enhanced-spin {
            transition: transform 7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          @keyframes enhancedSpinPhysics {
            0% {
              filter: blur(0px);
            }
            /* Fast initial spin phase - matches sound phase 1 */
            35% {
              transform: rotate(calc(var(--total-rotation) * 0.4));
              filter: blur(0.8px);
            }
            /* Peak speed phase - matches sound phase 2 */
            65% {
              transform: rotate(calc(var(--total-rotation) * 0.85));
              filter: blur(1px);
            }
            /* Gradual slowdown - matches sound phase 3 */
            90% {
              transform: rotate(calc(var(--total-rotation) * 0.98));
              filter: blur(0.3px);
            }
            /* Final positioning - matches sound phase 4 */
            100% {
              transform: rotate(var(--total-rotation));
              filter: blur(0px);
            }
          }

          .spin-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255,107,107,0.6);
          }

          .spin-button:active:not(:disabled) {
            transform: translateY(0px);
          }

          .result-display {
            animation: bounce 0.6s ease;
          }

          .confetti-piece {
            position: fixed;
            width: 10px;
            height: 10px;
            pointer-events: none;
            z-index: 9999;
            top: -10px;
            animation: confetti-fall 3s ease-out forwards;
          }

          .golden-confetti-piece {
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            top: -10px;
            font-weight: bold;
            animation: golden-confetti-fall 4s ease-out forwards;
          }

          @keyframes golden-confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg) scale(1);
              opacity: 1;
            }
            25% {
              transform: translateY(25vh) rotate(180deg) scale(1.2);
              opacity: 1;
            }
            50% {
              transform: translateY(50vh) rotate(360deg) scale(1.5);
              opacity: 0.9;
            }
            75% {
              transform: translateY(75vh) rotate(540deg) scale(1.3);
              opacity: 0.7;
            }
            100% {
              transform: translateY(110vh) rotate(720deg) scale(0.8);
              opacity: 0;
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes sparkle {
            0%, 100% { 
              opacity: 0; 
              transform: scale(0) rotate(0deg); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.5) rotate(180deg); 
            }
          }

          .sparkle {
            position: absolute;
            animation: sparkle 3s ease-in-out infinite;
            pointer-events: none;
            z-index: 2;
            filter: drop-shadow(0 0 3px rgba(255,255,255,0.8));
          }

          @keyframes winningPop {
            0% {
              transform: scale3d(0, 0, 1);
              opacity: 0;
            }
            60% {
              transform: scale3d(1.05, 1.05, 1);
              opacity: 1;
            }
            100% {
              transform: scale3d(1, 1, 1);
              opacity: 1;
            }
          }

          @keyframes winningPulse {
            0%, 100% {
              transform: scale3d(1, 1, 1);
              opacity: 1;
            }
            50% {
              transform: scale3d(1.02, 1.02, 1);
              opacity: 0.95;
            }
          }

          .winning-display {
            animation: winningPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            animation-fill-mode: both;
          }

          .winning-number {
            animation: winningPulse 2s ease-in-out infinite;
            animation-fill-mode: both;
          }

          /* Mobile-specific optimizations */
          @media (max-width: 768px) {
            .winning-display {
              margin: 10px auto;
              border-radius: 20px;
              left: 0;
              transform: none;
              position: static;
              maxWidth: 95vw;
            }
            
            .winning-number {
              line-height: 0.8;
            }
          }

          @media (max-width: 480px) {
            .winning-display {
              margin: 5px auto;
              padding: 20px 15px;
              maxWidth: 95vw;
              left: 0;
              transform: none;
              position: static;
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 0.7;
            }
            50% {
              opacity: 1;
            }
          }

          /* Special animations for number 8 */
          @keyframes rainbowPulse {
            0%, 100% {
              background-position: 0% 50%;
              transform: scale(1);
              filter: hue-rotate(0deg) brightness(1.2);
            }
            25% {
              background-position: 100% 50%;
              transform: scale(1.02);
              filter: hue-rotate(90deg) brightness(1.4);
            }
            50% {
              background-position: 200% 50%;
              transform: scale(1.05);
              filter: hue-rotate(180deg) brightness(1.6);
            }
            75% {
              background-position: 300% 50%;
              transform: scale(1.02);
              filter: hue-rotate(270deg) brightness(1.4);
            }
          }

          @keyframes numberFireworks {
            0%, 100% {
              text-shadow: 
                0 0 60px rgba(255,215,0,1), 
                0 0 100px rgba(255,140,0,0.8), 
                0 10px 30px rgba(0,0,0,0.5);
            }
            33% {
              text-shadow: 
                0 0 80px rgba(255,69,0,1), 
                0 0 120px rgba(255,215,0,0.9), 
                0 10px 30px rgba(0,0,0,0.5),
                20px 0 40px rgba(255,140,0,0.6),
                -20px 0 40px rgba(255,140,0,0.6);
            }
            66% {
              text-shadow: 
                0 0 100px rgba(255,255,0,1), 
                0 0 140px rgba(255,69,0,0.9), 
                0 10px 30px rgba(0,0,0,0.5),
                0 20px 50px rgba(255,215,0,0.7),
                0 -20px 50px rgba(255,215,0,0.7);
            }
          }

          @keyframes textCascade {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.8);
            }
            50% {
              opacity: 0.7;
              transform: translateY(-10px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes screenGlow {
            0%, 100% {
              box-shadow: 
                0 0 60px rgba(255,215,0,0.8), 
                0 0 120px rgba(255,140,0,0.6), 
                0 0 180px rgba(255,69,0,0.4), 
                inset 0 0 60px rgba(255,255,255,0.3);
            }
            50% {
              box-shadow: 
                0 0 100px rgba(255,215,0,1), 
                0 0 200px rgba(255,140,0,0.8), 
                0 0 300px rgba(255,69,0,0.6), 
                inset 0 0 80px rgba(255,255,255,0.5);
            }
          }

          @keyframes specialGlow {
            0%, 100% {
              text-shadow: 0 0 20px rgba(255,69,0,0.8), 0 2px 4px rgba(0,0,0,0.2);
            }
            50% {
              text-shadow: 0 0 40px rgba(255,69,0,1), 0 0 60px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.2);
            }
          }

          /* Special number 8 class styles */
          .number-8-special {
            animation: rainbowPulse 2s ease-in-out infinite, screenGlow 3s ease-in-out infinite !important;
          }

          .winning-number.number-8 {
            animation: rainbowPulse 1.5s ease-in-out infinite, numberFireworks 3s ease-in-out infinite !important;
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "calc(100vh - 60px)",
    background:
      "radial-gradient(circle at 20% 50%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #764ba2 0%, transparent 50%), radial-gradient(circle at 40% 80%, #f093fb 0%, transparent 50%), linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    position: "relative",
    overflow: "hidden",
  },
  particleContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 1,
  },
  content: {
    textAlign: "center",
    position: "relative",
    zIndex: 10,
    maxWidth: "600px",
    width: "100%",
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: "bold",
    color: "white",
    marginBottom: "2rem",
    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
    animation: "glow 2s ease-in-out infinite alternate",
  },
  selectorContainer: {
    marginBottom: "2rem",
  },
  select: {
    padding: "12px 40px 12px 24px",
    fontSize: "1.1rem",
    borderRadius: "25px",
    border: "none",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    color: "#333",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    outline: "none",
    appearance: "none",
    backgroundImage:
      'url(\'data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23333" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>\')',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    backgroundSize: "12px",
  },
  wheelContainer: {
    position: "relative",
    marginBottom: "2rem",
  },
  arrow: {
    position: "absolute",
    top: "-8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "15px solid transparent",
    borderRight: "15px solid transparent",
    borderTop: "30px solid #FFD700",
    zIndex: 20,
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
  },
  wheelOuter: {
    position: "relative",
    width: "clamp(260px, 75vw, 400px)",
    height: "clamp(260px, 75vw, 400px)",
    margin: "0 auto",
    maxWidth: "85vw",
    aspectRatio: "1",
  },
  wheel: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    position: "relative",
    overflow: "hidden", // Ensure numbers don't escape the wheel
  },
  segmentNumber: {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transformOrigin: "50% 50%",
  },
  numberText: {
    position: "absolute",
    fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)",
    fontWeight: "bold",
    color: "white",
    textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "clamp(30px, 8vw, 40px)",
    height: "clamp(30px, 8vw, 40px)",
    lineHeight: "1",
  },
  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "clamp(60px, 15vw, 80px)",
    height: "clamp(60px, 15vw, 80px)",
    background:
      "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    boxShadow:
      "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4), 0 4px 15px rgba(0,0,0,0.3)",
    zIndex: 10,
    border: "clamp(2px, 0.8vw, 4px) solid #FFFFFF",
    backdropFilter: "none",
  },
  spinButton: {
    padding: "clamp(12px, 3vw, 15px) clamp(30px, 8vw, 40px)",
    fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
    fontWeight: "bold",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: "clamp(1rem, 4vw, 2rem)",
    outline: "none",
    maxWidth: "90vw",
    minWidth: "200px",
  },
  spinButtonActive: {
    background: "linear-gradient(135deg, #FF6B6B, #FF8E53)",
    boxShadow: "0 6px 20px rgba(255,107,107,0.4)",
  },
  spinButtonDisabled: {
    background: "#999",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  resultContainer: {
    marginTop: "2rem",
    padding: "20px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  resultNumber: {
    fontSize: "4rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  },
  resultText: {
    fontSize: "1.1rem",
    color: "#666",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "2rem",
    color: "white",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    margin: "0 auto 1rem",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  errorContainer: {
    textAlign: "center",
    padding: "1rem",
    background: "rgba(255,107,107,0.2)",
    borderRadius: "10px",
    marginBottom: "1rem",
    backdropFilter: "blur(10px)",
  },
  errorText: {
    color: "#FFD700",
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  errorSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.9rem",
  },
  setupButton: {
    marginTop: "1rem",
    padding: "8px 16px",
    background: "linear-gradient(135deg, #4ECDC4, #45B7D1)",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "bold",
  },
  winningContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "clamp(400px, 70vh, 500px)",
    padding: "clamp(30px, 6vw, 60px) clamp(20px, 5vw, 40px)",
    margin: "0 auto",
    background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,250,240,0.95) 50%, rgba(255,245,220,0.98) 100%)",
    backdropFilter: "blur(25px)",
    borderRadius: "clamp(20px, 5vw, 40px)",
    boxShadow: "0 40px 120px rgba(255,215,0,0.3), 0 20px 60px rgba(0,0,0,0.2), 0 0 0 3px rgba(255,215,0,0.2), inset 0 2px 0 rgba(255,255,255,0.8)",
    position: "relative",
    overflow: "hidden",
    border: "2px solid rgba(255,215,0,0.3)",
    willChange: "transform, opacity",
    transform: "translate3d(0, 0, 0)",
    maxWidth: "min(90vw, 400px)",
    width: "100%",
    boxSizing: "border-box",
  },
  winningNumber: {
    fontSize: "clamp(8rem, 20vw, 16rem)",
    fontWeight: "900",
    fontFamily: '"Impact", "Arial Black", "Helvetica Neue", Arial, sans-serif',
    color: "#FFFFFF",
    marginBottom: "clamp(15px, 4vw, 30px)",
    textShadow: "0 0 30px rgba(255,255,255,0.9), 0 0 60px rgba(255,215,0,0.7), 0 8px 20px rgba(0,0,0,0.6)",
    WebkitTextStroke: "clamp(2px, 0.5vw, 3px) #FFD700",
    position: "relative",
    display: "inline-block",
    willChange: "transform, opacity",
    transform: "translate3d(0, 0, 0)",
    backfaceVisibility: "hidden",
    perspective: "1000px",
  },
  winningText: {
    fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
    fontWeight: "800",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: "clamp(10px, 3vw, 20px)",
    lineHeight: "1.3",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    letterSpacing: "clamp(0.5px, 0.2vw, 1px)",
    padding: "0 20px",
  },
  winningSubtext: {
    fontSize: "clamp(1rem, 3vw, 1.4rem)",
    color: "#8e44ad",
    textAlign: "center",
    fontWeight: "600",
    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
    letterSpacing: "clamp(0.3px, 0.1vw, 0.5px)",
    padding: "0 20px",
  },
  audioIndicator: {
    fontSize: "0.8em",
    opacity: 0.7,
    marginLeft: "8px",
    animation: "pulse 2s ease-in-out infinite",
  },
  audioUnlockButton: {
    padding: "clamp(10px, 2.5vw, 12px) clamp(25px, 6vw, 30px)",
    fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
    fontWeight: "bold",
    color: "white",
    background: "linear-gradient(135deg, #FF9500, #FF6B35)",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: "1rem",
    outline: "none",
    boxShadow: "0 4px 15px rgba(255,149,0,0.4)",
    maxWidth: "90vw",
    minWidth: "200px",
  },
  // Special styles for number 8
  winningContainerSpecial: {
    background: "linear-gradient(135deg, rgba(255,215,0,0.98) 0%, rgba(255,140,0,0.95) 25%, rgba(255,69,0,0.98) 50%, rgba(255,215,0,0.95) 75%, rgba(255,255,0,0.98) 100%)",
    border: "4px solid #FFD700",
    boxShadow: "0 0 60px rgba(255,215,0,0.8), 0 0 120px rgba(255,140,0,0.6), 0 0 180px rgba(255,69,0,0.4), inset 0 0 60px rgba(255,255,255,0.3)",
    transform: "scale(1.05)",
    animation: "rainbowPulse 2s ease-in-out infinite, screenGlow 3s ease-in-out infinite",
  },
  winningNumberSpecial: {
    fontSize: "clamp(12rem, 30vw, 24rem)",
    background: "linear-gradient(45deg, #FFD700, #FF8C00, #FF4500, #FFD700)",
    backgroundSize: "400% 400%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: "0 0 60px rgba(255,215,0,1), 0 0 100px rgba(255,140,0,0.8), 0 10px 30px rgba(0,0,0,0.5)",
    animation: "rainbowPulse 1.5s ease-in-out infinite, numberFireworks 3s ease-in-out infinite",
  },
  winningTextSpecial: {
    fontSize: "clamp(1.8rem, 5vw, 3rem)",
    fontWeight: "900",
    background: "linear-gradient(45deg, #FFD700, #FF8C00, #FF4500, #FFD700)",
    backgroundSize: "400% 400%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textAlign: "center",
    marginBottom: "clamp(15px, 4vw, 30px)",
    lineHeight: "1.2",
    textShadow: "0 0 30px rgba(255,215,0,0.8), 0 4px 8px rgba(0,0,0,0.3)",
    letterSpacing: "clamp(1px, 0.3vw, 2px)",
    padding: "0 15px",
    animation: "textCascade 2s ease-in-out, rainbowPulse 2s ease-in-out infinite 2s",
  },
  winningSubtextSpecial: {
    fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)",
    color: "#FF4500",
    textAlign: "center",
    fontWeight: "700",
    textShadow: "0 0 20px rgba(255,69,0,0.8), 0 2px 4px rgba(0,0,0,0.2)",
    letterSpacing: "clamp(0.5px, 0.2vw, 1px)",
    padding: "0 15px",
    animation: "textCascade 2s ease-in-out 0.5s both, specialGlow 2s ease-in-out infinite 2.5s",
  },
  locationTextSpecial: {
    fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
    fontWeight: "800",
    color: "#FFD700",
    textShadow: "0 0 25px rgba(255,215,0,1), 0 3px 6px rgba(0,0,0,0.3)",
  },
};

export default SpinWheel;
