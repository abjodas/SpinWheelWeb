/* 
 * BROWSER SETUP SCRIPT - Copy and paste this into your browser console
 * 
 * 1. Open your React app in the browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste the entire script below and press Enter
 */

// PASTE THIS IN BROWSER CONSOLE:
/*
(async function setupFirestoreData() {
  // Import Firebase functions (these should be available if your React app loaded)
  const { db } = await import('./firebase.js');
  const { doc, setDoc, getDoc } = await import('firebase/firestore');

  // Define the data you want to store in the 'distributions' document
  const distributionsData = {
    location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
    location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
    location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
    location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
    location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
    location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] },
    location7: { name: "Bunia", slots: [75, 58, 42, 28, 18, 12, 7, 4] },
    location8: { name: "Uvira", slots: [72, 55, 40, 25, 16, 11, 6, 3] }
  };

  try {
    console.log('🚀 Setting up Firestore database...');
    
    const distributionsDocRef = doc(db, "locations", "distributions");
    await setDoc(distributionsDocRef, distributionsData);

    console.log("✅ Document 'distributions' successfully written!");
    
    // Verify the data was written
    const docSnap = await getDoc(distributionsDocRef);
    if (docSnap.exists()) {
      console.log("✅ Verification successful - data retrieved:", docSnap.data());
      console.log("🎉 Your Firebase database is ready! Refresh the page to see it work.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    if (error.code === 'permission-denied') {
      console.error("🔒 Firestore security rules issue. Set rules to allow read/write.");
    }
  }
})();
*/

// Alternative: Add this function to your React component temporarily
export const setupFirestoreInBrowser = async () => {
  const { db } = await import('./firebase.js');
  const { doc, setDoc } = await import('firebase/firestore');

  const distributionsData = {
    location1: { name: "Goma", slots: [80, 60, 45, 30, 20, 15, 10, 5] },
    location2: { name: "Butembo", slots: [75, 55, 40, 25, 18, 12, 8, 4] },
    location3: { name: "Beni", slots: [70, 50, 35, 20, 15, 10, 5, 2] },
    location4: { name: "Bukavu", slots: [65, 45, 30, 15, 10, 7, 3, 1] },
    location5: { name: "Kindu", slots: [85, 65, 48, 32, 22, 16, 11, 6] },
    location6: { name: "Kalemie", slots: [70, 55, 42, 28, 20, 14, 9, 5] },
    location7: { name: "Bunia", slots: [75, 58, 42, 28, 18, 12, 7, 4] },
    location8: { name: "Uvira", slots: [72, 55, 40, 25, 16, 11, 6, 3] }
  };

  try {
    const distributionsDocRef = doc(db, "locations", "distributions");
    await setDoc(distributionsDocRef, distributionsData);
    console.log("✅ Firestore setup complete!");
    return true;
  } catch (error) {
    console.error("❌ Setup failed:", error);
    return false;
  }
};