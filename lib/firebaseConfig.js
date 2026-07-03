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
export const googleProvider = new GoogleAuthProvider();

// Analytics: only runs in browser on real domains
export let analytics = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
}).catch(() => {});
