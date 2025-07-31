// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXFYWtx5xigV9SxwVTUxni53hyK_ZvOjs",
  authDomain: "spinwebsite-88e4b.firebaseapp.com",
  projectId: "spinwebsite-88e4b",
  storageBucket: "spinwebsite-88e4b.firebasestorage.app",
  messagingSenderId: "943466696393",
  appId: "1:943466696393:web:74cd70ffea95fb06b1c718",
  measurementId: "G-K0MM0EWRJJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);
