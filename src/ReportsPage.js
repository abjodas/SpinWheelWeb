import React, { useState, useEffect } from 'react';
import { getSpinHistory, getSpinStatsByDate } from './services/spinHistoryService';

const ReportsPage = ({ onBack }) => {
  // Add CSS animations
  const addStyleSheet = () => {
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes floatUp {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes barGrow {
        from { 
          height: 0%; 
          opacity: 0;
        }
        to { 
          opacity: 1;
        }
      }
      
      @keyframes pieSliceRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes horizontalBarGrow {
        from { 
          width: 0%; 
          opacity: 0;
        }
        to { 
          opacity: 1;
        }
      }
      
      @keyframes donutSliceGrow {
        from { 
          stroke-dasharray: 0 283;
          opacity: 0;
        }
        to { 
          opacity: 1;
        }
      }
      
      .number-card-hover:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1);
      }
      
      .location-card-hover:hover {
        transform: translateY(-6px);
        box-shadow: 0 25px 50px rgba(0,0,0,0.12), 0 8px 25px rgba(0,0,0,0.08);
      }
      
      .date-selector-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 25px 70px rgba(0,0,0,0.2), 0 12px 30px rgba(0,0,0,0.15);
      }
      
      .back-button-hover:hover {
        background: rgba(255,255,255,0.25);
        border-color: rgba(255,255,255,0.6);
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      }
      
      .date-input-hover:hover, .date-input-hover:focus {
        border-color: #667eea;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        transform: translateY(-1px);
      }
      
      @media (max-width: 768px) {
        .actual-location-tag {
          font-size: 0.8rem !important;
          padding: 6px 10px !important;
          max-width: calc(100% - 16px) !important;
          margin: 0 auto !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .actual-location-section {
          padding: 12px !important;
        }
        
        .actual-location-list {
          gap: 6px !important;
          justify-content: center !important;
        }
      }
      
      @media (max-width: 480px) {
        .actual-location-tag {
          font-size: 0.75rem !important;
          padding: 5px 8px !important;
          max-width: calc(100% - 8px) !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;
          text-align: center !important;
          line-height: 1.3 !important;
          margin: 0 auto !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 0 !important;
          flex: 0 1 auto !important;
        }
        
        .actual-location-list {
          justify-content: center !important;
          align-items: center !important;
          gap: 4px !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  };

  React.useEffect(() => {
    addStyleSheet();
  }, []);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState({});
  const [locationStats, setLocationStats] = useState({});
  const [totalSpins, setTotalSpins] = useState(0);
  
  // Filter states
  const [numberFilter, setNumberFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered data
  const [filteredStats, setFilteredStats] = useState({});
  const [filteredLocationStats, setFilteredLocationStats] = useState({});

  useEffect(() => {
    loadDailyReports();
  }, [selectedDate]);

  useEffect(() => {
    applyFilters();
  }, [dailyStats, locationStats, numberFilter, locationFilter, frequencyFilter, searchTerm]);

  const loadDailyReports = async () => {
    try {
      setLoading(true);
      console.log('Loading daily reports for date:', selectedDate);
      
      const stats = await getSpinStatsByDate(selectedDate);
      console.log('Raw stats received:', stats);
      
      // Process the stats to get number frequency per location
      const locationBreakdown = {};
      const numberFrequency = {};
      let total = 0;

      stats.forEach(spin => {
        console.log('Processing spin:', spin);
        const location = spin.location;
        const number = spin.result;
        
        if (!locationBreakdown[location]) {
          locationBreakdown[location] = {
            spins: {},
            actualLocations: [], // Store actual location data
            hasRealLocation: false
          };
        }
        
        if (!locationBreakdown[location].spins[number]) {
          locationBreakdown[location].spins[number] = 0;
        }
        
        locationBreakdown[location].spins[number]++;
        
        // Add actual location data if available
        if (spin.actualLocation && spin.actualLocation.name) {
          locationBreakdown[location].actualLocations.push({
            name: spin.actualLocation.name,
            accuracy: spin.actualLocation.accuracy,
            timestamp: spin.timestamp
          });
          locationBreakdown[location].hasRealLocation = true;
        }
        
        if (!numberFrequency[number]) {
          numberFrequency[number] = 0;
        }
        numberFrequency[number]++;
        total++;
      });

      console.log('Processed location stats:', locationBreakdown);
      console.log('Processed number frequency:', numberFrequency);
      console.log('Total spins:', total);

      setLocationStats(locationBreakdown);
      setDailyStats(numberFrequency);
      setTotalSpins(total);
    } catch (error) {
      console.error('Failed to load daily reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNumberColor = (number) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];
    return colors[number - 1] || "#999";
  };

  const calculatePercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  };

  // Calculate statistical insights
  const calculateInsights = (dailyStats, totalSpins) => {
    if (totalSpins === 0) return {};

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
    const frequencies = numbers.map(num => dailyStats[num] || 0);
    const percentages = frequencies.map(freq => parseFloat(calculatePercentage(freq, totalSpins)));
    
    // Find most and least frequent numbers
    const maxFreq = Math.max(...frequencies);
    const minFreq = Math.min(...frequencies.filter(f => f > 0)); // Exclude zeros
    const mostFrequent = numbers.filter(num => (dailyStats[num] || 0) === maxFreq);
    const leastFrequent = frequencies.some(f => f === 0) 
      ? numbers.filter(num => (dailyStats[num] || 0) === 0)
      : numbers.filter(num => (dailyStats[num] || 0) === minFreq);

    // Calculate distribution fairness (coefficient of variation)
    const mean = totalSpins / 8; // Expected frequency for fair distribution
    const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / 8;
    const stdDev = Math.sqrt(variance);
    const fairnessScore = mean > 0 ? ((1 - (stdDev / mean)) * 100).toFixed(1) : '0';

    // Calculate hot/cold streaks
    const hotNumbers = numbers.filter(num => percentages[num - 1] > 15); // Above 15%
    const coldNumbers = numbers.filter(num => percentages[num - 1] < 10); // Below 10%

    return {
      mostFrequent,
      leastFrequent,
      fairnessScore,
      hotNumbers,
      coldNumbers,
      averagePercentage: (100 / 8).toFixed(1),
      highestPercentage: Math.max(...percentages).toFixed(1),
      lowestPercentage: Math.min(...percentages.filter(p => p > 0)).toFixed(1)
    };
  };

  // Filter functions
  const applyFilters = () => {
    let filtered = { ...dailyStats };
    let filteredLocations = { ...locationStats };
    
    // Apply number filter
    if (numberFilter) {
      const num = parseInt(numberFilter);
      filtered = { [num]: dailyStats[num] || 0 };
      
      // Filter locations to only show data for this number
      Object.keys(filteredLocations).forEach(location => {
        const isNewFormat = filteredLocations[location] && typeof filteredLocations[location] === 'object' && filteredLocations[location].spins;
        const numbers = isNewFormat ? filteredLocations[location].spins : filteredLocations[location];
        if (numbers && numbers[num] !== undefined) {
          if (isNewFormat) {
            filteredLocations[location] = {
              ...filteredLocations[location],
              spins: { [num]: numbers[num] }
            };
          } else {
            filteredLocations[location] = { [num]: numbers[num] };
          }
        } else {
          delete filteredLocations[location];
        }
      });
    }
    
    // Apply location filter
    if (locationFilter) {
      filteredLocations = { [locationFilter]: locationStats[locationFilter] };
    }
    
    // Apply frequency filter
    if (frequencyFilter) {
      const filteredByFrequency = {};
      Object.entries(filtered).forEach(([number, count]) => {
        const percentage = parseFloat(calculatePercentage(count, totalSpins));
        let includeNumber = false;
        
        switch (frequencyFilter) {
          case 'high':
            includeNumber = percentage > 15;
            break;
          case 'medium':
            includeNumber = percentage >= 10 && percentage <= 15;
            break;
          case 'low':
            includeNumber = percentage > 0 && percentage < 10;
            break;
          case 'zero':
            includeNumber = percentage === 0;
            break;
          default:
            includeNumber = true;
        }
        
        if (includeNumber) {
          filteredByFrequency[number] = count;
        }
      });
      filtered = filteredByFrequency;
    }
    
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchingLocations = {};
      
      Object.entries(filteredLocations).forEach(([location, data]) => {
        const isNewFormat = data && typeof data === 'object' && data.spins;
        if (isNewFormat && data.actualLocations) {
          const hasMatch = data.actualLocations.some(actualLoc => 
            actualLoc.name.toLowerCase().includes(searchLower)
          );
          if (hasMatch) {
            matchingLocations[location] = data;
          }
        } else if (location.toLowerCase().includes(searchLower)) {
          matchingLocations[location] = data;
        }
      });
      
      filteredLocations = matchingLocations;
    }
    
    setFilteredStats(filtered);
    setFilteredLocationStats(filteredLocations);
  };
  
  const clearAllFilters = () => {
    setNumberFilter('');
    setLocationFilter('');
    setFrequencyFilter('');
    setSearchTerm('');
  };
  
  const getActiveFiltersCount = () => {
    let count = 0;
    if (numberFilter) count++;
    if (locationFilter) count++;
    if (frequencyFilter) count++;
    if (searchTerm) count++;
    return count;
  };

  // Export data functionality
  const exportData = () => {
    const insights = calculateInsights(dailyStats, totalSpins);
    
    const exportData = {
      date: selectedDate,
      formattedDate: formatDate(selectedDate),
      totalSpins: totalSpins,
      numberFrequency: dailyStats,
      locationStats: locationStats,
      insights: insights,
      exportTime: new Date().toISOString()
    };

    // Create CSV format
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fortune Spin Wheel - Rapport du " + formatDate(selectedDate) + "\n\n";
    csvContent += "Résumé\n";
    csvContent += "Date,Total Tirages,Équité Distribution\n";
    csvContent += `${selectedDate},${totalSpins},${insights.fairnessScore}%\n\n`;
    
    csvContent += "Fréquence des Numéros\n";
    csvContent += "Numéro,Occurrences,Pourcentage\n";
    for (let i = 1; i <= 8; i++) {
      const count = dailyStats[i] || 0;
      const percentage = calculatePercentage(count, totalSpins);
      csvContent += `${i},${count},${percentage}%\n`;
    }

    csvContent += "\nEmplacements\n";
    csvContent += "Emplacement,Total Tirages,Positions Réelles\n";
    Object.entries(locationStats).forEach(([location, data]) => {
      const isNewFormat = data && typeof data === 'object' && data.spins;
      const numbers = isNewFormat ? data.spins : data;
      const locationTotal = Object.values(numbers || {}).reduce((sum, count) => sum + count, 0);
      
      const actualLocs = isNewFormat && data.actualLocations ? 
        [...new Set(data.actualLocations.map(loc => loc.name))].join('; ') : 'Aucune';
      
      csvContent += `${location},${locationTotal},"${actualLocs}"\n`;
    });

    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport-spin-wheel-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📊 Data exported for date:', selectedDate);
  };


  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <div>Chargement des rapports...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton} className="back-button-hover">
          ← Retour
        </button>
        <h1 style={styles.title}>📊 Rapports Quotidiens</h1>
        <div style={styles.headerDecoration}></div>
      </div>

      {/* Enhanced Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.dateSelector} className="date-selector-hover">
          <div style={styles.dateControls}>
            <div style={styles.dateInputGroup}>
              <label style={styles.dateLabel}>📅 Sélectionner une date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={styles.dateInput}
                className="date-input-hover"
              />
            </div>
            
            <div style={styles.actionButtons}>
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                style={styles.todayButton}
              >
                📅 Aujourd'hui
              </button>
              <button 
                onClick={() => setSelectedDate(new Date(Date.now() - 86400000).toISOString().split('T')[0])}
                style={styles.yesterdayButton}
              >
                📅 Hier
              </button>
              <button 
                onClick={() => exportData()}
                style={styles.exportButton}
              >
                📊 Exporter
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div style={styles.filtersSection}>
          <div style={styles.filtersTitle}>🔍 Filtres & Recherche</div>
          <div style={styles.filtersGrid}>
            
            {/* Number Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>🎯 Filtrer par Numéro:</label>
              <select 
                value={numberFilter}
                onChange={(e) => setNumberFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">Tous les numéros</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>Numéro {num}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>📍 Filtrer par Emplacement:</label>
              <select 
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">Tous les emplacements</option>
                {Object.keys(locationStats).map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Frequency Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>📊 Filtrer par Fréquence:</label>
              <select 
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">Toutes les fréquences</option>
                <option value="high">Élevée (&gt;15%)</option>
                <option value="medium">Moyenne (10-15%)</option>
                <option value="low">Faible (&lt;10%)</option>
                <option value="zero">Aucun tirage (0%)</option>
              </select>
            </div>

            {/* Search Box */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>🔍 Rechercher Lieu Réel:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Kinshasa, Goma..."
                style={styles.searchInput}
              />
            </div>

          </div>
          
          {/* Clear Filters */}
          <div style={styles.filterActions}>
            <button 
              onClick={clearAllFilters}
              style={styles.clearFiltersButton}
            >
              🗑️ Effacer tous les filtres
            </button>
            <div style={styles.activeFiltersCount}>
              {getActiveFiltersCount()} filtre(s) actif(s)
            </div>
          </div>
        </div>
      </div>

      <div style={styles.summaryCard}>
        <h2 style={styles.summaryTitle}>
          Résumé du {formatDate(selectedDate)}
        </h2>
        <div style={styles.totalSpins}>
          <strong>Total des tirages: {totalSpins}</strong>
        </div>
      </div>

      {totalSpins > 0 ? (
        <>
          {/* Statistics Dashboard */}
          {(() => {
            const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
            const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
            const insights = calculateInsights(currentStats, currentTotalSpins);
            return (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📈 Analyses Statistiques {getActiveFiltersCount() > 0 && '(Filtré)'}</h3>
                <div style={styles.insightsGrid}>
                  
                  {/* Key Metrics */}
                  <div style={styles.insightCard}>
                    <div style={styles.insightIcon}>🎯</div>
                    <div style={styles.insightContent}>
                      <div style={styles.insightLabel}>Équité de Distribution</div>
                      <div style={styles.insightValue}>{insights.fairnessScore}%</div>
                      <div style={styles.insightDesc}>
                        {parseFloat(insights.fairnessScore) > 80 ? 'Excellente' : 
                         parseFloat(insights.fairnessScore) > 60 ? 'Bonne' : 'Améliorable'}
                      </div>
                    </div>
                  </div>

                  {/* Hot Numbers */}
                  <div style={styles.insightCard}>
                    <div style={styles.insightIcon}>🔥</div>
                    <div style={styles.insightContent}>
                      <div style={styles.insightLabel}>Numéros Chauds</div>
                      <div style={styles.insightNumbers}>
                        {insights.hotNumbers?.length > 0 ? 
                          insights.hotNumbers.map(num => (
                            <span key={num} style={{...styles.insightNumber, backgroundColor: getNumberColor(num)}}>
                              {num}
                            </span>
                          )) : <span style={styles.insightDesc}>Aucun</span>
                        }
                      </div>
                      <div style={styles.insightDesc}>&gt;15% fréquence</div>
                    </div>
                  </div>

                  {/* Cold Numbers */}
                  <div style={styles.insightCard}>
                    <div style={styles.insightIcon}>🧊</div>
                    <div style={styles.insightContent}>
                      <div style={styles.insightLabel}>Numéros Froids</div>
                      <div style={styles.insightNumbers}>
                        {insights.coldNumbers?.length > 0 ? 
                          insights.coldNumbers.map(num => (
                            <span key={num} style={{...styles.insightNumber, backgroundColor: getNumberColor(num)}}>
                              {num}
                            </span>
                          )) : <span style={styles.insightDesc}>Aucun</span>
                        }
                      </div>
                      <div style={styles.insightDesc}>&lt;10% fréquence</div>
                    </div>
                  </div>

                  {/* Most Frequent */}
                  <div style={styles.insightCard}>
                    <div style={styles.insightIcon}>👑</div>
                    <div style={styles.insightContent}>
                      <div style={styles.insightLabel}>Plus Fréquent</div>
                      <div style={styles.insightNumbers}>
                        {insights.mostFrequent?.map(num => (
                          <span key={num} style={{...styles.insightNumber, backgroundColor: getNumberColor(num)}}>
                            {num}
                          </span>
                        ))}
                      </div>
                      <div style={styles.insightDesc}>{insights.highestPercentage}% du total</div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* Visual Charts Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📊 Visualisation Graphique {getActiveFiltersCount() > 0 && '(Filtré)'}</h3>
            
            {/* Bar Chart */}
            <div style={styles.chartContainer}>
              <div style={styles.chartTitle}>📈 Diagramme en Barres - Fréquence des Numéros</div>
              <div style={styles.barChart}>
                <div style={styles.barChartArea}>
                  {(() => {
                    const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                    const numbers = Object.keys(currentStats).length > 0 ? Object.keys(currentStats).map(n => parseInt(n)) : [1, 2, 3, 4, 5, 6, 7, 8];
                    const maxCount = Math.max(...numbers.map(n => currentStats[n] || 0));
                    
                    return numbers.map(number => {
                      const count = currentStats[number] || 0;
                      const heightPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={number} style={styles.barContainer}>
                          <div style={styles.barLabel}>{count}</div>
                          <div 
                            style={{
                              ...styles.bar,
                              height: `${Math.max(heightPercentage, 3)}%`,
                              backgroundColor: getNumberColor(number),
                              animation: `barGrow 1.5s ease-out ${number * 0.1}s both`
                            }}
                          />
                          <div style={styles.barNumber}>{number}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div style={styles.yAxisLabel}>Nombre de tirages</div>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div style={styles.chartContainer}>
              <div style={styles.chartTitle}>📊 Graphique Horizontal - Comparaison des Fréquences</div>
              <div style={styles.horizontalBarChart}>
                {(() => {
                  const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                  const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                  const numbers = Object.keys(currentStats).length > 0 ? Object.keys(currentStats).map(n => parseInt(n)) : [1, 2, 3, 4, 5, 6, 7, 8];
                  
                  return numbers.map(number => {
                    const count = currentStats[number] || 0;
                    const percentage = parseFloat(calculatePercentage(count, currentTotalSpins));
                    return (
                      <div key={number} style={styles.horizontalBarRow}>
                        <div style={styles.horizontalBarLabel}>
                          <div style={{
                            ...styles.horizontalBarNumberIcon,
                            backgroundColor: getNumberColor(number)
                          }}>
                            {number}
                          </div>
                          <span>Numéro {number}</span>
                        </div>
                        <div style={styles.horizontalBarContainer}>
                          <div 
                            style={{
                              ...styles.horizontalBar,
                              width: `${Math.max(percentage, 2)}%`,
                              backgroundColor: getNumberColor(number),
                              animation: `horizontalBarGrow 1.2s ease-out ${number * 0.1}s both`
                            }}
                          />
                          <div style={styles.horizontalBarValue}>
                            {count} ({percentage}%)
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Donut Chart */}
            <div style={styles.chartContainer}>
              <div style={styles.chartTitle}>🍩 Graphique en Anneau - Vue d'Ensemble</div>
              <div style={styles.donutChartContainer}>
                <div style={styles.donutChart}>
                  {(() => {
                    const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                    const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                    const activeNumbers = Object.keys(currentStats).filter(n => (currentStats[n] || 0) > 0).map(n => parseInt(n));
                    let cumulativePercentage = 0;
                    
                    return activeNumbers.map(number => {
                      const count = currentStats[number] || 0;
                      const percentage = currentTotalSpins > 0 ? (count / currentTotalSpins) * 100 : 0;
                      const strokeDasharray = `${percentage * 2.83} ${283 - percentage * 2.83}`;
                      const strokeDashoffset = -cumulativePercentage * 2.83;
                      cumulativePercentage += percentage;
                      
                      return (
                        <svg key={number} style={styles.donutSvg}>
                          <circle
                            cx="100"
                            cy="100" 
                            r="45"
                            fill="none"
                            stroke={getNumberColor(number)}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 100 100)"
                            style={{
                              animation: `donutSliceGrow 1.5s ease-out ${number * 0.1}s both`
                            }}
                          />
                        </svg>
                      );
                    });
                  })()}
                  <div style={styles.donutCenter}>
                    <div style={styles.donutCenterText}>
                      <div style={styles.donutTotal}>
                        {getActiveFiltersCount() > 0 ? Object.values(filteredStats).reduce((sum, count) => sum + count, 0) : totalSpins}
                      </div>
                      <div style={styles.donutLabel}>Total</div>
                    </div>
                  </div>
                </div>
                <div style={styles.donutLegend}>
                  {(() => {
                    const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                    const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                    
                    return Object.keys(currentStats).map(number => {
                      const num = parseInt(number);
                      const count = currentStats[num] || 0;
                      const percentage = calculatePercentage(count, currentTotalSpins);
                      return count > 0 ? (
                        <div key={num} style={styles.legendItem}>
                          <div style={{
                            ...styles.legendColor,
                            backgroundColor: getNumberColor(num)
                          }} />
                          <span style={styles.legendText}>
                            Numéro {num}: {count} ({percentage}%)
                          </span>
                        </div>
                      ) : null;
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Number Frequency */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🎯 Fréquence Globale des Numéros {getActiveFiltersCount() > 0 && '(Filtré)'}</h3>
            <div style={styles.numberGrid}>
              {(() => {
                const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                const numbers = Object.keys(currentStats).length > 0 ? Object.keys(currentStats).map(n => parseInt(n)) : [1, 2, 3, 4, 5, 6, 7, 8];
                
                return numbers.map(number => (
                  <div key={number} style={styles.numberCard} className="number-card-hover">
                    <div style={{
                      ...styles.numberDisplay,
                      backgroundColor: getNumberColor(number)
                    }}>
                      {number}
                    </div>
                    <div style={styles.numberStats}>
                      <div style={styles.count}>
                        {currentStats[number] || 0} fois
                      </div>
                      <div style={styles.percentage}>
                        {calculatePercentage(currentStats[number] || 0, currentTotalSpins)}%
                      </div>
                      <div style={styles.progressBar}>
                        <div 
                          style={{
                            ...styles.progressFill,
                            width: `${calculatePercentage(currentStats[number] || 0, currentTotalSpins)}%`,
                            backgroundColor: getNumberColor(number)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Comparison Analytics */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📊 Analyses Comparatives</h3>
            <div style={styles.comparisonGrid}>
              
              {/* Distribution Comparison */}
              <div style={styles.comparisonCard}>
                <div style={styles.comparisonTitle}>⚖️ Comparaison avec Distribution Idéale</div>
                <div style={styles.comparisonContent}>
                  {(() => {
                    const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                    const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                    const expectedPerSpin = currentTotalSpins / 8; // Ideal distribution
                    
                    return Object.keys(currentStats).length > 0 ? Object.keys(currentStats).map(number => {
                      const num = parseInt(number);
                      const actual = currentStats[num] || 0;
                      const deviation = ((actual - expectedPerSpin) / expectedPerSpin * 100);
                      const isAbove = deviation > 0;
                      
                      return (
                        <div key={num} style={styles.comparisonRow}>
                          <div style={styles.comparisonNumber}>
                            <div style={{
                              ...styles.comparisonNumberIcon,
                              backgroundColor: getNumberColor(num)
                            }}>
                              {num}
                            </div>
                          </div>
                          <div style={styles.comparisonData}>
                            <div style={styles.comparisonActual}>Réel: {actual}</div>
                            <div style={styles.comparisonExpected}>Idéal: {expectedPerSpin.toFixed(1)}</div>
                            <div style={{
                              ...styles.comparisonDeviation,
                              color: isAbove ? '#e74c3c' : '#27ae60'
                            }}>
                              {isAbove ? '+' : ''}{deviation.toFixed(1)}%
                              {isAbove ? ' ⬆️' : ' ⬇️'}
                            </div>
                          </div>
                        </div>
                      );
                    }) : <div style={styles.noComparisonData}>Aucune donnée pour la comparaison</div>;
                  })()}
                </div>
              </div>

              {/* Performance Metrics */}
              <div style={styles.comparisonCard}>
                <div style={styles.comparisonTitle}>🎯 Métriques de Performance</div>
                <div style={styles.metricsGrid}>
                  {(() => {
                    const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                    const currentLocationStats = getActiveFiltersCount() > 0 ? filteredLocationStats : locationStats;
                    const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                    const insights = calculateInsights(currentStats, currentTotalSpins);
                    
                    // Additional metrics
                    const activeNumbers = Object.keys(currentStats).filter(n => currentStats[n] > 0).length;
                    const activeLocations = Object.keys(currentLocationStats).length;
                    const avgSpinsPerNumber = currentTotalSpins > 0 ? (currentTotalSpins / activeNumbers).toFixed(1) : '0';
                    const avgSpinsPerLocation = activeLocations > 0 ? (currentTotalSpins / activeLocations).toFixed(1) : '0';
                    
                    return [
                      { icon: "🎲", label: "Numéros Actifs", value: `${activeNumbers}/8`, color: "#3498db" },
                      { icon: "📍", label: "Emplacements Actifs", value: activeLocations, color: "#9b59b6" },
                      { icon: "📊", label: "Moyenne par Numéro", value: avgSpinsPerNumber, color: "#e67e22" },
                      { icon: "🌍", label: "Moyenne par Lieu", value: avgSpinsPerLocation, color: "#1abc9c" },
                      { icon: "🔥", label: "Numéros Chauds", value: insights.hotNumbers?.length || 0, color: "#e74c3c" },
                      { icon: "🧊", label: "Numéros Froids", value: insights.coldNumbers?.length || 0, color: "#95a5a6" }
                    ].map((metric, index) => (
                      <div key={index} style={styles.metricItem}>
                        <div style={{...styles.metricIcon, backgroundColor: metric.color}}>
                          {metric.icon}
                        </div>
                        <div style={styles.metricContent}>
                          <div style={styles.metricValue}>{metric.value}</div>
                          <div style={styles.metricLabel}>{metric.label}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Trend Analysis */}
              <div style={styles.comparisonCard}>
                <div style={styles.comparisonTitle}>📈 Analyse de Tendance</div>
                <div style={styles.trendContent}>
                  {(() => {
                    const currentStats = getActiveFiltersCount() > 0 ? filteredStats : dailyStats;
                    const currentTotalSpins = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
                    const insights = calculateInsights(currentStats, currentTotalSpins);
                    
                    return [
                      {
                        title: "Distribution",
                        status: parseFloat(insights.fairnessScore) > 80 ? "Excellente" : 
                                parseFloat(insights.fairnessScore) > 60 ? "Bonne" : "À améliorer",
                        color: parseFloat(insights.fairnessScore) > 80 ? "#27ae60" : 
                               parseFloat(insights.fairnessScore) > 60 ? "#f39c12" : "#e74c3c",
                        value: `${insights.fairnessScore}%`
                      },
                      {
                        title: "Équilibre",
                        status: (insights.hotNumbers?.length || 0) + (insights.coldNumbers?.length || 0) < 3 ? "Stable" : "Variable",
                        color: (insights.hotNumbers?.length || 0) + (insights.coldNumbers?.length || 0) < 3 ? "#27ae60" : "#e67e22",
                        value: `${8 - ((insights.hotNumbers?.length || 0) + (insights.coldNumbers?.length || 0))}/8 équilibrés`
                      },
                      {
                        title: "Activité",
                        status: Object.keys(currentStats).filter(n => currentStats[n] > 0).length >= 6 ? "Élevée" : "Modérée",
                        color: Object.keys(currentStats).filter(n => currentStats[n] > 0).length >= 6 ? "#27ae60" : "#f39c12",
                        value: `${Object.keys(currentStats).filter(n => currentStats[n] > 0).length}/8 numéros`
                      }
                    ].map((trend, index) => (
                      <div key={index} style={styles.trendItem}>
                        <div style={styles.trendHeader}>
                          <span style={styles.trendTitle}>{trend.title}</span>
                          <span style={{...styles.trendStatus, backgroundColor: trend.color}}>
                            {trend.status}
                          </span>
                        </div>
                        <div style={styles.trendValue}>{trend.value}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

            </div>
          </div>

          {/* Location Breakdown */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📍 Détail par Emplacement {getActiveFiltersCount() > 0 && '(Filtré)'}</h3>
            <div style={styles.locationsGrid}>
              {Object.entries(getActiveFiltersCount() > 0 ? filteredLocationStats : locationStats).map(([location, data]) => {
                // Handle both old format (numbers) and new format (data object)
                const isNewFormat = data && typeof data === 'object' && data.spins;
                const numbers = isNewFormat ? data.spins : data;
                const locationTotal = Object.values(numbers || {}).reduce((sum, count) => sum + count, 0);
                
                // Get actual locations with counts
                const actualLocationCounts = {};
                if (isNewFormat && data.actualLocations) {
                  data.actualLocations.forEach(loc => {
                    if (actualLocationCounts[loc.name]) {
                      actualLocationCounts[loc.name]++;
                    } else {
                      actualLocationCounts[loc.name] = 1;
                    }
                  });
                }
                const uniqueActualLocations = Object.keys(actualLocationCounts);
                
                return (
                  <div key={location} style={styles.locationCard} className="location-card-hover">
                    <h4 style={styles.locationName}>
                      📍 {location} ({locationTotal} tirages)
                    </h4>
                    
                    {/* Show actual locations if available */}
                    {isNewFormat && data.hasRealLocation && uniqueActualLocations.length > 0 && (
                      <div style={styles.actualLocationSection} className="actual-location-section">
                        <div style={styles.actualLocationTitle}>🌍 Positions réelles détectées:</div>
                        <div style={styles.actualLocationsList} className="actual-location-list">
                          {uniqueActualLocations.map((actualLoc, index) => {
                            const count = actualLocationCounts[actualLoc];
                            return (
                              <span key={index} style={styles.actualLocationTag} className="actual-location-tag">
                                {actualLoc}
                                <span style={styles.locationCount}>({count})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div style={styles.locationNumbers}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(number => (
                        <div key={number} style={styles.locationNumberRow}>
                          <div style={{
                            ...styles.smallNumber,
                            backgroundColor: getNumberColor(number)
                          }}>
                            {number}
                          </div>
                          <div style={styles.locationNumberStats}>
                            <span>{numbers[number] || 0}</span>
                            <span style={styles.smallPercentage}>
                              ({calculatePercentage(numbers[number] || 0, locationTotal)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div style={styles.noData}>
          <div style={styles.noDataIcon}>📊</div>
          <h3>Aucune donnée pour cette date</h3>
          <p>Il n'y a eu aucun tirage enregistré le {formatDate(selectedDate)}</p>
        </div>
      )}
    </div>
  );
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
    alignItems: "center",
    marginBottom: "2rem",
    gap: "1rem",
    position: "relative",
    zIndex: 10,
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
  title: {
    color: "white",
    fontSize: "2.5rem",
    fontWeight: "800",
    margin: 0,
    textShadow: "0 4px 20px rgba(0,0,0,0.3)",
    letterSpacing: "-0.02em",
    flex: 1,
  },
  headerDecoration: {
    width: "60px",
    height: "4px",
    background: "linear-gradient(90deg, #fff, transparent)",
    borderRadius: "2px",
    opacity: 0.7,
  },
  dateSelector: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "2rem",
    marginBottom: "2rem",
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  dateLabel: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  dateInput: {
    padding: "12px 16px",
    fontSize: "1.1rem",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  summaryCard: {
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
    borderRadius: "24px",
    padding: "2.5rem",
    marginBottom: "2rem",
    boxShadow: "0 25px 80px rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.3)",
    position: "relative",
    overflow: "hidden",
  },
  summaryTitle: {
    fontSize: "1.6rem",
    color: "#2c3e50",
    marginBottom: "1rem",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  totalSpins: {
    fontSize: "1.4rem",
    color: "#27ae60",
    fontWeight: "700",
    background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 2px 4px rgba(39, 174, 96, 0.2)",
  },
  section: {
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
    borderRadius: "24px",
    padding: "2.5rem",
    marginBottom: "2rem",
    boxShadow: "0 25px 80px rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.08)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.3)",
    position: "relative",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#2c3e50",
    marginBottom: "1.5rem",
    borderBottom: "3px solid transparent",
    backgroundImage: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)",
    backgroundSize: "100% 3px",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "bottom",
    paddingBottom: "12px",
    fontWeight: "700",
  },
  numberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "1.2rem",
    '@media (max-width: 768px)': {
      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      gap: "1rem",
    },
  },
  numberCard: {
    background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
    borderRadius: "16px",
    padding: "1.5rem",
    textAlign: "center",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.05)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  numberDisplay: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "800",
    fontSize: "1.6rem",
    margin: "0 auto 1.2rem",
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
    position: "relative",
  },
  numberStats: {
    fontSize: "1rem",
  },
  count: {
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "5px",
  },
  percentage: {
    color: "#7f8c8d",
    fontSize: "0.9rem",
    marginBottom: "8px",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    backgroundColor: "#ecf0f1",
    borderRadius: "3px",
    overflow: "hidden",
    marginTop: "4px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    background: "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  locationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
    '@media (max-width: 768px)': {
      gridTemplateColumns: "1fr",
      gap: "1rem",
    },
  },
  locationCard: {
    background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
    borderRadius: "18px",
    padding: "2rem",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08), 0 4px 15px rgba(0,0,0,0.05)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  locationName: {
    color: "#2c3e50",
    fontSize: "1.2rem",
    marginBottom: "1rem",
    textAlign: "center",
    borderBottom: "2px solid transparent",
    backgroundImage: "linear-gradient(90deg, #f093fb, #f5576c)",
    backgroundSize: "100% 2px",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "bottom",
    paddingBottom: "10px",
    fontWeight: "600",
  },
  locationNumbers: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.5rem",
  },
  locationNumberRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "5px 0",
  },
  smallNumber: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "1rem",
    textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
  },
  locationNumberStats: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
  },
  smallPercentage: {
    color: "#7f8c8d",
    fontSize: "0.8rem",
  },
  actualLocationSection: {
    background: "linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "1.5rem",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  actualLocationTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#495057",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actualLocationsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
    justifyContent: "center",
  },
  actualLocationTag: {
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "white",
    fontSize: "0.85rem",
    fontWeight: "500",
    padding: "8px 12px",
    borderRadius: "12px",
    whiteSpace: "normal",
    boxShadow: "0 3px 8px rgba(79, 172, 254, 0.25)",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "calc(100% - 16px)",
    minWidth: "0",
    wordBreak: "break-word",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    hyphens: "auto",
    textAlign: "center",
    margin: "0 auto",
    lineHeight: "1.3",
    flex: "0 1 auto",
  },
  locationCount: {
    fontSize: "0.75em",
    fontWeight: "600",
    marginLeft: "4px",
    opacity: "0.9",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "8px",
    padding: "1px 4px",
    whiteSpace: "nowrap",
  },
  insightsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  insightCard: {
    background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
    borderRadius: "16px",
    padding: "1.5rem",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08), 0 3px 10px rgba(0,0,0,0.05)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
  },
  insightIcon: {
    fontSize: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "60px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
    minWidth: 0,
  },
  insightLabel: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#495057",
    marginBottom: "8px",
  },
  insightValue: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#2c3e50",
    lineHeight: 1,
    marginBottom: "4px",
  },
  insightDesc: {
    fontSize: "0.8rem",
    color: "#6c757d",
    fontWeight: "500",
  },
  insightNumbers: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px",
  },
  insightNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "700",
    fontSize: "0.9rem",
    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  dateControls: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    '@media (min-width: 768px)': {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
  dateInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flex: 1,
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  todayButton: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(39, 174, 96, 0.3)",
  },
  yesterdayButton: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #3498db, #2980b9)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(52, 152, 219, 0.3)",
  },
  exportButton: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #e67e22, #d35400)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(230, 126, 34, 0.3)",
  },
  noData: {
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
    borderRadius: "24px",
    padding: "4rem",
    textAlign: "center",
    boxShadow: "0 25px 80px rgba(0,0,0,0.12), 0 12px 30px rgba(0,0,0,0.08)",
    color: "#6c757d",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.3)",
  },
  noDataIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  
  // Chart styles
  chartContainer: {
    marginBottom: "2.5rem",
    background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
    borderRadius: "20px",
    padding: "2rem",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08), 0 4px 15px rgba(0,0,0,0.05)",
    animation: "fadeInScale 0.6s ease-out",
  },
  
  chartTitle: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "2rem",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  // Bar Chart Styles
  barChart: {
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    gap: "1rem",
    height: "280px",
  },
  
  barChartArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: "1rem",
    height: "220px",
    flex: 1,
    padding: "0 1rem",
    borderLeft: "2px solid #e9ecef",
    borderBottom: "2px solid #e9ecef",
    position: "relative",
  },
  
  barContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    height: "100%",
    position: "relative",
  },
  
  bar: {
    width: "100%",
    maxWidth: "50px",
    borderRadius: "8px 8px 0 0",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    cursor: "pointer",
    position: "relative",
    marginTop: "auto",
  },
  
  barLabel: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "8px",
    textAlign: "center",
  },
  
  barNumber: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#495057",
    marginTop: "8px",
    padding: "4px 8px",
    background: "rgba(0,0,0,0.05)",
    borderRadius: "6px",
  },
  
  yAxisLabel: {
    position: "absolute",
    left: "-40px",
    top: "50%",
    transform: "rotate(-90deg) translateY(50%)",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#495057",
    whiteSpace: "nowrap",
  },
  
  // Legend Styles (shared between charts)
  
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    background: "rgba(0,0,0,0.02)",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
  
  legendColor: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  
  legendText: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#495057",
  },
  
  // Horizontal Bar Chart Styles
  horizontalBarChart: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  
  horizontalBarRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem",
    background: "rgba(0,0,0,0.02)",
    borderRadius: "12px",
    transition: "all 0.2s ease",
  },
  
  horizontalBarLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: "120px",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#495057",
  },
  
  horizontalBarNumberIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "0.8rem",
    fontWeight: "700",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  
  horizontalBarContainer: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  horizontalBar: {
    height: "20px",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    position: "relative",
    overflow: "hidden",
  },
  
  horizontalBarValue: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#495057",
    minWidth: "80px",
    textAlign: "right",
  },
  
  // Donut Chart Styles
  donutChartContainer: {
    display: "flex",
    gap: "2rem",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  
  donutChart: {
    position: "relative",
    width: "200px",
    height: "200px",
  },
  
  donutSvg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "200px",
    height: "200px",
    transform: "rotate(-90deg)",
  },
  
  donutCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    background: "white",
    borderRadius: "50%",
    width: "90px",
    height: "90px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    border: "2px solid #f8f9fa",
  },
  
  donutCenterText: {
    textAlign: "center",
  },
  
  donutTotal: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#2c3e50",
    lineHeight: 1,
  },
  
  donutLabel: {
    fontSize: "0.8rem",
    color: "#6c757d",
    fontWeight: "600",
    marginTop: "2px",
  },
  
  donutLegend: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
    minWidth: "200px",
    maxWidth: "300px",
  },
  
  // Filter Control Styles
  controlsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  
  filtersSection: {
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  
  filtersTitle: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "1.5rem",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  
  filterLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#495057",
  },
  
  filterSelect: {
    padding: "12px 16px",
    fontSize: "1rem",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    outline: "none",
  },
  
  searchInput: {
    padding: "12px 16px",
    fontSize: "1rem",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    outline: "none",
  },
  
  filterActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "1rem",
    borderTop: "2px solid rgba(0,0,0,0.05)",
  },
  
  clearFiltersButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)",
  },
  
  activeFiltersCount: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6c757d",
    background: "rgba(0,0,0,0.05)",
    padding: "8px 16px",
    borderRadius: "20px",
  },
  
  // Comparison Analytics Styles
  comparisonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "2rem",
  },
  
  comparisonCard: {
    background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
    borderRadius: "18px",
    padding: "2rem",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08), 0 4px 15px rgba(0,0,0,0.05)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  
  comparisonTitle: {
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "1.5rem",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  
  comparisonContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  
  comparisonRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem",
    background: "rgba(0,0,0,0.02)",
    borderRadius: "12px",
    transition: "all 0.2s ease",
  },
  
  comparisonNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  comparisonNumberIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "1.1rem",
    fontWeight: "700",
    boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
  },
  
  comparisonData: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  
  comparisonActual: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
  },
  
  comparisonExpected: {
    fontSize: "0.9rem",
    color: "#6c757d",
  },
  
  comparisonDeviation: {
    fontSize: "0.9rem",
    fontWeight: "700",
  },
  
  noComparisonData: {
    textAlign: "center",
    color: "#6c757d",
    fontStyle: "italic",
    padding: "2rem",
  },
  
  // Performance Metrics Styles
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "1rem",
  },
  
  metricItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1rem",
    background: "rgba(0,0,0,0.02)",
    borderRadius: "12px",
    transition: "all 0.2s ease",
  },
  
  metricIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    color: "white",
    boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
  },
  
  metricContent: {
    textAlign: "center",
  },
  
  metricValue: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: "4px",
  },
  
  metricLabel: {
    fontSize: "0.8rem",
    color: "#6c757d",
    fontWeight: "600",
  },
  
  // Trend Analysis Styles
  trendContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  
  trendItem: {
    padding: "1rem",
    background: "rgba(0,0,0,0.02)",
    borderRadius: "12px",
    transition: "all 0.2s ease",
  },
  
  trendHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  
  trendTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#2c3e50",
  },
  
  trendStatus: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "white",
    padding: "4px 8px",
    borderRadius: "12px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  
  trendValue: {
    fontSize: "0.9rem",
    color: "#6c757d",
    fontWeight: "500",
  },
};

export default ReportsPage;