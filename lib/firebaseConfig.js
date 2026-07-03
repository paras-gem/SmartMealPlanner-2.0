import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDWQZ5TYN7ZXUc7lXwAA7wxzxFhUcTqdKQ",
  authDomain: "smartmealplanner-3a081.firebaseapp.com",
  projectId: "smartmealplanner-3a081",
  storageBucket: "smartmealplanner-3a081.firebasestorage.app",
  messagingSenderId: "750069530498",
  appId: "1:750069530498:web:5172a472580e2728bd599b",
  measurementId: "G-DLL8ZBKG7W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google provider with Calendar scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");
googleProvider.setCustomParameters({
  client_id: "620129041083-1bhgdavns734gtp1natp74f0p6bcvmlo.apps.googleusercontent.com"
});

// Analytics: only runs in browser on real domains
export let analytics = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
}).catch(() => {});
