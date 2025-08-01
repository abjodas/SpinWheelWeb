import React, { useState, useRef, useEffect } from "react";
import {
  getLocationDistributions,
  updateLocationSlots,
} from "./services/distributionService";

const SpinWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [currentLocation, setCurrentLocation] = useState("location1");
  const [rotation, setRotation] = useState(0);
  const [locationData, setLocationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wheelRef = useRef(null);

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
        setError("Failed to load location data");
        // Fallback to hardcoded data
        setLocationData({
          location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
          location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
          location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
          location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
          location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
          location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDistributions();
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
      console.warn("No slots available for current location:", currentLocation);
      return null;
    }

    return weightedNumbers[Math.floor(Math.random() * weightedNumbers.length)];
  };

  // Create audio context for sounds
  const playSpinSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        800,
        audioContext.currentTime + 2
      );

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  const playWinSound = () => {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.2);
        gainNode.gain.linearRampToValueAtTime(
          0.2,
          audioContext.currentTime + index * 0.2 + 0.1
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + index * 0.2 + 0.5
        );

        oscillator.start(audioContext.currentTime + index * 0.2);
        oscillator.stop(audioContext.currentTime + index * 0.2 + 0.5);
      });
    } catch (error) {
      console.log("Audio not supported");
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

  const spin = () => {
    if (isSpinning) return;

    // Get target number first
    const targetNumber = getWeightedNumber();

    // Check if no slots are available
    if (targetNumber === null) {
      alert(
        "⚠️ No slots available at this location. Please contact support or try another location."
      );
      return;
    }

    setIsSpinning(true);
    setResult(null);
    console.log("🎯 Target number:", targetNumber);

    // Play spin sound
    playSpinSound();

    // Calculate rotation to land on target
    // Each segment is 45 degrees (360/8)
    // Segment 1 is at 0°, segment 2 at 45°, etc.
    const segmentAngle = 45;
    const targetAngle = (targetNumber - 1) * segmentAngle;

    // Add multiple full rotations for effect
    const spins = 5 + Math.random() * 5;
    // To make the arrow point to the target, we need to rotate so that
    // the target segment comes to the top (where the arrow points)
    const totalRotation = rotation + spins * 360 + (360 - targetAngle);

    console.log("🎪 Rotating to:", totalRotation, "°");

    setRotation(totalRotation);

    // Wait for animation to complete
    setTimeout(async () => {
      setIsSpinning(false);
      setResult(targetNumber);
      playWinSound();
      createConfetti();

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
    }, 5000);
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
            <div style={styles.loadingText}>Loading locations...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.errorText}>⚠️ {error}</div>
            <div style={styles.errorSubtext}>Using offline data</div>
            <button
              onClick={async () => {
                try {
                  const { doc, setDoc } = await import("firebase/firestore");
                  const distributionsData = {
                    location1: {
                      name: "Goma",
                      slots: [80, 60, 45, 30, 20, 15, 10, 5],
                    },
                    location2: {
                      name: "Butembo",
                      slots: [75, 55, 40, 25, 18, 12, 8, 4],
                    },
                    location3: {
                      name: "Beni",
                      slots: [70, 50, 35, 20, 15, 10, 5, 2],
                    },
                    location4: {
                      name: "Bukavu",
                      slots: [65, 45, 30, 15, 10, 7, 3, 1],
                    },
                    location5: {
                      name: "Kindu",
                      slots: [85, 65, 48, 32, 22, 16, 11, 6],
                    },
                    location6: {
                      name: "Kalemie",
                      slots: [70, 55, 42, 28, 20, 14, 9, 5],
                    },
                  };
                  const { db } = await import("./firebase");
                  const distributionsDocRef = doc(
                    db,
                    "locations",
                    "distributions"
                  );
                  await setDoc(distributionsDocRef, distributionsData);
                  alert("✅ Database setup complete! Refresh the page.");
                } catch (err) {
                  alert("❌ Setup failed: " + err.message);
                }
              }}
              style={styles.setupButton}
            >
              🔧 Setup Database
            </button>
          </div>
        )}

        {!loading && (
          <>
            {/* Location Selector */}
            <div style={styles.selectorContainer}>
              <select
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                style={styles.select}
              >
                <option value="location1">📍 Goma</option>
                <option value="location2">📍 Butembo</option>
                <option value="location3">📍 Beni</option>
                <option value="location4">📍 Bukavu</option>
                <option value="location5">📍 Kindu</option>
                <option value="location6">📍 Kalemie</option>
              </select>
            </div>

            {/* Wheel Container */}
            <div style={styles.wheelContainer}>
              {/* Wheel */}
              <div style={styles.wheelOuter}>
                <div
                  ref={wheelRef}
                  className="spinning-wheel"
                  style={{
                    ...styles.wheel,
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
                          transform: `translateY(-155px) rotate(${
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
              {isSpinning ? "SPINNING..." : "SPIN TO WIN!"}
            </button>

            {/* Result Display */}
            {result && (
              <div className="result-display" style={styles.resultContainer}>
                <div style={styles.resultNumber}>{result}</div>
                <div style={styles.resultText}>
                  🎊 Felicitations! 🎊
                  <br />
                  Vous avez gagné le numéro <strong>{result}</strong> at{" "}
                  {locationData[currentLocation].name}!
                </div>
              </div>
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
            transition: transform 4s cubic-bezier(0.23, 1, 0.320, 1);
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
    width: "420px",
    height: "420px",
    margin: "0 auto",
  },
  wheel: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    position: "relative",
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
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "white",
    textShadow: "3px 3px 6px rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.3)",
  },
  centerCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80px",
    height: "80px",
    background:
      "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    boxShadow:
      "0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4), 0 4px 15px rgba(0,0,0,0.3)",
    zIndex: 10,
    border: "4px solid #FFFFFF",
    backdropFilter: "none",
  },
  spinButton: {
    padding: "15px 40px",
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: "2rem",
    outline: "none",
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
};

export default SpinWheel;
