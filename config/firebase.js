// config/firebase.js
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfu64uC71n-koud4VYD3FTYrfiFl6CEQw",
  authDomain: "luct-reporting-system-2026.firebaseapp.com",
  projectId: "luct-reporting-system-2026",
  storageBucket: "luct-reporting-system-2026.firebasestorage.app",
  messagingSenderId: "579740592046",
  appId: "1:579740592046:web:2d3048fc601674dc11ca3f",
  measurementId: "G-RYEM7M53NK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);