// Firebase Configuration and Initialization
// This file initializes Firebase services for the AI Learning Platform

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIGRhw_1SnjiLLa6wpFNLA_vGc0PSbaqc",
  authDomain: "ai-learning-platform-ncca.firebaseapp.com",
  projectId: "ai-learning-platform-ncca",
  storageBucket: "ai-learning-platform-ncca.firebasestorage.app",
  messagingSenderId: "151453153772",
  appId: "1:151453153772:web:483526bd45fa735824e8c9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Export app instance
export default app;
