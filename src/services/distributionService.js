import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const getLocationDistributions = async () => {
  try {
    console.log('Attempting to fetch from Firebase...');
    const docRef = doc(db, 'locations', 'distributions');
    console.log('Document reference created:', docRef.path);
    
    const docSnap = await getDoc(docRef);
    console.log('Document snapshot received, exists:', docSnap.exists());
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Document data:', data);
      return data;
    } else {
      throw new Error('Document "distributions" does not exist in "locations" collection. Please run the setup script first.');
    }
  } catch (error) {
    console.error('Detailed error fetching distributions:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

export const updateLocationSlots = async (locationId, newSlots) => {
  try {
    const docRef = doc(db, 'locations', 'distributions');
    await updateDoc(docRef, {
      [`${locationId}.slots`]: newSlots
    });
  } catch (error) {
    console.error('Error updating slots:', error);
    throw error;
  }
};