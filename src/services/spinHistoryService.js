import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

// Record a spin result
export const recordSpin = async (spinData) => {
  try {
    const spinRecord = {
      ...spinData,
      timestamp: Timestamp.now(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'spinHistory'), spinRecord);
    console.log('Spin recorded with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error recording spin:', error);
    throw error;
  }
};

// Get all spins for a specific date
export const getSpinStatsByDate = async (dateString) => {
  try {
    console.log('Fetching spins for date:', dateString);
    
    // Try simple query first without orderBy to avoid index issues
    const q = query(
      collection(db, 'spinHistory'),
      where('date', '==', dateString)
    );
    
    const querySnapshot = await getDocs(q);
    const spins = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Found spin record:', data);
      spins.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`Found ${spins.length} spins for ${dateString}`);
    
    // Sort in memory instead of using orderBy in query
    spins.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.seconds - b.timestamp.seconds;
      }
      return 0;
    });
    
    return spins;
  } catch (error) {
    console.error('Error fetching spin stats:', error);
    
    // Fallback: try to get all records and filter manually
    try {
      console.log('Trying fallback approach...');
      const allQuery = query(collection(db, 'spinHistory'));
      const allSnapshot = await getDocs(allQuery);
      const allSpins = [];
      
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date === dateString) {
          allSpins.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`Fallback found ${allSpins.length} spins for ${dateString}`);
      return allSpins;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
};

// Get spin history with optional filters
export const getSpinHistory = async (filters = {}) => {
  try {
    let q = collection(db, 'spinHistory');
    
    // Add filters if provided
    if (filters.startDate) {
      q = query(q, where('date', '>=', filters.startDate));
    }
    
    if (filters.endDate) {
      q = query(q, where('date', '<=', filters.endDate));
    }
    
    if (filters.location) {
      q = query(q, where('location', '==', filters.location));
    }
    
    // Always order by timestamp
    q = query(q, orderBy('timestamp', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const spins = [];
    
    querySnapshot.forEach((doc) => {
      spins.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return spins;
  } catch (error) {
    console.error('Error fetching spin history:', error);
    return [];
  }
};

// Get statistics summary for a date range
export const getStatsummary = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'spinHistory'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const stats = {
      totalSpins: 0,
      numberFrequency: {},
      locationStats: {},
      dailyBreakdown: {}
    };
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalSpins++;
      
      // Number frequency
      if (!stats.numberFrequency[data.result]) {
        stats.numberFrequency[data.result] = 0;
      }
      stats.numberFrequency[data.result]++;
      
      // Location stats
      if (!stats.locationStats[data.location]) {
        stats.locationStats[data.location] = {};
      }
      if (!stats.locationStats[data.location][data.result]) {
        stats.locationStats[data.location][data.result] = 0;
      }
      stats.locationStats[data.location][data.result]++;
      
      // Daily breakdown
      if (!stats.dailyBreakdown[data.date]) {
        stats.dailyBreakdown[data.date] = 0;
      }
      stats.dailyBreakdown[data.date]++;
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    return {
      totalSpins: 0,
      numberFrequency: {},
      locationStats: {},
      dailyBreakdown: {}
    };
  }
};