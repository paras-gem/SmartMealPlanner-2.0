// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWQZ5TYN7ZXUc7lXwAA7wxzxFhUcTqdKQ",
  authDomain: "smartmealplanner-3a081.firebaseapp.com",
  projectId: "smartmealplanner-3a081",
  storageBucket: "smartmealplanner-3a081.firebasestorage.app",
  messagingSenderId: "750069530498",
  appId: "1:750069530498:web:5172a472580e2728bd599b",
  measurementId: "G-DLL8ZBKG7W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics only works on real production domains, not localhost — guard it
export let analytics = null;
isSupported().then(yes => {
  if (yes) analytics = getAnalytics(app);
}).catch(() => {});
