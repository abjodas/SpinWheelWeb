import React, { useState, useEffect } from 'react';
import { getLocationDistributions, updateLocationSlots } from './services/distributionService';

const AdminPage = ({ onBack }) => {
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
      setMessage('Failed to load data from Firebase');
      // Fallback data
      setLocationData({
        location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
        location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
        location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
        location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
        location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
        location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] }
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
      setMessage('Saving changes...');
      
      // Update Firebase with new data
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const distributionsDocRef = doc(db, "locations", "distributions");
      await setDoc(distributionsDocRef, locationData);
      
      setMessage('✅ Changes saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage('❌ Failed to save changes');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all distributions to default values?')) {
      setLocationData({
        location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
        location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
        location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
        location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
        location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
        location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] }
      });
      setMessage('Reset to default values - Remember to save!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <div>Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Wheel
        </button>
        <h1 style={styles.title}>🔧 Admin Panel - Distribution Manager</h1>
        <div style={styles.actions}>
          <button onClick={resetToDefaults} style={styles.resetButton}>
            🔄 Reset Defaults
          </button>
          <button 
            onClick={saveDistributions} 
            disabled={saving}
            style={{...styles.saveButton, ...(saving ? styles.disabled : {})}}
          >
            {saving ? '💾 Saving...' : '💾 Save Changes'}
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
          <div key={locationId} style={styles.locationCard}>
            <h3 style={styles.locationName}>
              {data.name}
              <span style={styles.locationId}>({locationId})</span>
            </h3>
            
            <div style={styles.slotsContainer}>
              <div style={styles.slotsHeader}>
                <span>Number</span>
                <span>Available Slots</span>
              </div>
              
              {data.slots.map((slots, index) => (
                <div key={index} style={styles.slotRow}>
                  <div style={styles.numberCell}>
                    <div style={{
                      ...styles.numberDisplay,
                      backgroundColor: getNumberColor(index + 1)
                    }}>
                      {index + 1}
                    </div>
                  </div>
                  <div style={styles.inputCell}>
                    <input
                      type="number"
                      min="0"
                      value={slots}
                      onChange={(e) => handleSlotChange(locationId, index, e.target.value)}
                      style={styles.slotInput}
                    />
                  </div>
                </div>
              ))}
              
              <div style={styles.totalRow}>
                <strong>Total: {data.slots.reduce((sum, slots) => sum + slots, 0)} slots</strong>
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
    background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
    padding: "20px",
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
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
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    color: "white",
    fontSize: "1.8rem",
    fontWeight: "bold",
    margin: 0,
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    padding: "10px 20px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },
  actions: {
    display: "flex",
    gap: "10px",
  },
  resetButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  saveButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #27ae60, #229954)",
    color: "white",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  disabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  message: {
    textAlign: "center",
    padding: "15px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    borderRadius: "10px",
    marginBottom: "2rem",
    fontSize: "1.1rem",
    fontWeight: "bold",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "2rem",
  },
  locationCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "15px",
    padding: "2rem",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  locationName: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  locationId: {
    fontSize: "1rem",
    color: "#7f8c8d",
    fontWeight: "normal",
    marginLeft: "10px",
  },
  slotsContainer: {
    border: "2px solid #ecf0f1",
    borderRadius: "10px",
    overflow: "hidden",
  },
  slotsHeader: {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    background: "#34495e",
    color: "white",
    padding: "15px",
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  slotRow: {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    borderBottom: "1px solid #ecf0f1",
  },
  numberCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px",
    background: "#f8f9fa",
  },
  numberDisplay: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "1.2rem",
    textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
  },
  inputCell: {
    padding: "15px",
    display: "flex",
    alignItems: "center",
  },
  slotInput: {
    width: "100%",
    padding: "10px 15px",
    fontSize: "1.2rem",
    border: "2px solid #bdc3c7",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
  },
  totalRow: {
    padding: "15px",
    background: "#ecf0f1",
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#2c3e50",
  },
};

export default AdminPage;