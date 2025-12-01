// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBihMxSQuLfsjYyjj62aiZNKGl6qdCStrU",
  authDomain: "university-sports-reservation.firebaseapp.com",
  projectId: "university-sports-reservation",
  storageBucket: "university-sports-reservation.firebasestorage.app",
  messagingSenderId: "595850716334",
  appId: "1:595850716334:web:b95d353ee6e58ce38b793f",
  measurementId: "G-TLJLLVLTN0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
