import React, { useState, useEffect } from 'react';
import { getLocationDistributions, updateLocationSlots } from './services/distributionService';

const AdminPage = ({ onBack, onViewReports }) => {
  // Add CSS animations and styles
  const addStyleSheet = () => {
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes slideIn {
        0% { transform: translateY(30px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .admin-card-hover:hover {
        transform: translateY(-8px);
        box-shadow: 0 25px 60px rgba(0,0,0,0.15), 0 10px 25px rgba(0,0,0,0.1);
      }
      
      .admin-button-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      }
      
      .admin-input-hover:hover, .admin-input-hover:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        transform: scale(1.02);
      }
      
      .number-pulse:hover {
        animation: pulse 1s ease infinite;
      }
    `;
    document.head.appendChild(styleSheet);
  };

  React.useEffect(() => {
    addStyleSheet();
  }, []);
  const [locationData, setLocationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDistributions();
  }, []);

  const loadDistributions = async () => {
    try {
      setLoading(true);
      const data = await getLocationDistributions();
      setLocationData(data);
    } catch (error) {
      console.error('Failed to load distributions:', error);
      setMessage('Échec du chargement des données depuis Firebase');
      // Fallback data
      setLocationData({
        location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
        location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
        location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
        location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
        location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
        location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] },
        location7: { name: "Bunia", slots: [75, 58, 42, 28, 18, 12, 7, 4] },
        location8: { name: "Uvira", slots: [72, 55, 40, 25, 16, 11, 6, 3] }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (locationId, slotIndex, newValue) => {
    const value = Math.max(0, parseInt(newValue) || 0);
    setLocationData(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        slots: prev[locationId].slots.map((slot, index) => 
          index === slotIndex ? value : slot
        )
      }
    }));
  };

  const saveDistributions = async () => {
    try {
      setSaving(true);
      setMessage('Enregistrement des modifications...');
      
      // Update Firebase with new data
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const distributionsDocRef = doc(db, "locations", "distributions");
      await setDoc(distributionsDocRef, locationData);
      
      setMessage('✅ Modifications enregistrées avec succès!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage('❌ Échec de l\'enregistrement des modifications');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les distributions aux valeurs par défaut?')) {
      setLocationData({
        location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
        location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
        location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
        location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
        location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
        location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] },
        location7: { name: "Bunia", slots: [75, 58, 42, 28, 18, 12, 7, 4] },
        location8: { name: "Uvira", slots: [72, 55, 40, 25, 16, 11, 6, 3] }
      });
      setMessage('Réinitialisation aux valeurs par défaut - N\'oubliez pas d\'enregistrer!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <div>Chargement du panneau d'administration...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton} className="admin-button-hover">
          ← Retour à la roue
        </button>
        <h1 style={styles.title}>⚡ Panneau d'Administration</h1>
        <div style={styles.subtitle}>Gestionnaire de Distribution Intelligent</div>
        <div style={styles.actions}>
          <button onClick={onViewReports} style={styles.reportsButton} className="admin-button-hover">
            📊 Voir les rapports
          </button>
          <button onClick={resetToDefaults} style={styles.resetButton} className="admin-button-hover">
            🔄 Réinitialiser par défaut
          </button>
          <button 
            onClick={saveDistributions} 
            disabled={saving}
            style={{...styles.saveButton, ...(saving ? styles.disabled : {})}}
            className={!saving ? "admin-button-hover" : ""}
          >
            {saving ? '💾 Enregistrement...' : '💾 Enregistrer les modifications'}
          </button>
        </div>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.content}>
        {Object.entries(locationData).map(([locationId, data]) => (
          <div key={locationId} style={styles.locationCard} className="admin-card-hover">
            <h3 style={styles.locationName}>
              📍 {data.name}
              <span style={styles.locationId}>({locationId})</span>
            </h3>
            
            <div style={styles.slotsContainer}>
              <div style={styles.slotsHeader}>
                <span>Numéro</span>
                <span>Emplacements disponibles</span>
              </div>
              
              {data.slots.map((slots, index) => (
                <div key={index} style={styles.slotRow}>
                  <div style={styles.numberCell}>
                    <div style={{
                      ...styles.numberDisplay,
                      backgroundColor: getNumberColor(index + 1)
                    }} className="number-pulse">
                      {index + 1}
                    </div>
                  </div>
                  <div style={styles.inputCell}>
                    <input
                      type="text"
                      value={slots}
                      onChange={(e) => handleSlotChange(locationId, index, e.target.value)}
                      style={styles.slotInput}
                      className="admin-input-hover"
                    />
                  </div>
                </div>
              ))}
              
              <div style={styles.totalRow}>
                <strong>Total: {data.slots.reduce((sum, slots) => sum + slots, 0)} emplacements</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getNumberColor = (number) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];
  return colors[number - 1] || "#999";
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)",
    backgroundSize: "400% 400%",
    animation: "gradientShift 15s ease infinite",
    padding: "20px",
    fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
    position: "relative",
    overflow: "hidden",
    '@media (max-width: 768px)': {
      padding: "15px",
    },
    '@media (max-width: 480px)': {
      padding: "10px",
    },
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
    color: "white",
    fontSize: "1.2rem",
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "3rem",
    flexWrap: "wrap",
    gap: "1.5rem",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    position: "relative",
    overflow: "hidden",
  },
  title: {
    color: "white",
    fontSize: "2.2rem",
    fontWeight: "800",
    margin: 0,
    textAlign: "center",
    textShadow: "0 4px 20px rgba(0,0,0,0.3)",
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "1.1rem",
    fontWeight: "500",
    textAlign: "center",
    marginBottom: "1.5rem",
    letterSpacing: "0.5px",
    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
    flex: "0 0 100%",
    order: 2,
  },
  backButton: {
    padding: "12px 24px",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "2px solid rgba(255,255,255,0.4)",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  },
  actions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
    order: 3,
    flex: "0 0 100%",
    '@media (max-width: 768px)': {
      gap: "10px",
    },
  },
  reportsButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #4ECDC4, #45B7D1)",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "700",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 25px rgba(78, 205, 196, 0.3)",
  },
  resetButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "700",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 25px rgba(231, 76, 60, 0.3)",
  },
  saveButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #27ae60, #229954)",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "700",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 8px 25px rgba(39, 174, 96, 0.3)",
  },
  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  message: {
    textAlign: "center",
    padding: "20px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
    color: "#2c3e50",
    borderRadius: "20px",
    marginBottom: "2rem",
    fontSize: "1.2rem",
    fontWeight: "700",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
    animation: "slideIn 0.5s ease-out",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "2.5rem",
    '@media (max-width: 768px)': {
      gridTemplateColumns: "1fr",
      gap: "2rem",
    },
  },
  locationCard: {
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
    borderRadius: "24px",
    padding: "2.5rem",
    boxShadow: "0 25px 80px rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.08)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.3)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    animation: "slideIn 0.6s ease-out",
  },
  locationName: {
    fontSize: "1.6rem",
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: "2rem",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    position: "relative",
  },
  locationId: {
    fontSize: "1rem",
    color: "#7f8c8d",
    fontWeight: "normal",
    marginLeft: "10px",
  },
  slotsContainer: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
    background: "#ffffff",
  },
  slotsHeader: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "18px 20px",
    fontWeight: "700",
    fontSize: "1.1rem",
    letterSpacing: "0.5px",
    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  slotRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
    transition: "all 0.2s ease",
  },
  numberCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    background: "linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%)",
    borderRight: "1px solid rgba(0,0,0,0.05)",
  },
  numberDisplay: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "800",
    fontSize: "1.3rem",
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  inputCell: {
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
  },
  slotInput: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "1.2rem",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "700",
    background: "#ffffff",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    outline: "none",
  },
  totalRow: {
    padding: "20px",
    background: "linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)",
    textAlign: "center",
    fontSize: "1.3rem",
    color: "#2c3e50",
    fontWeight: "700",
    borderTop: "2px solid rgba(102, 126, 234, 0.1)",
  },
};

export default AdminPage;