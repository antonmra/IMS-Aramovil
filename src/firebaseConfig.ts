// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
    apiKey: "AIzaSyAsk82TcbRL_9juRT6m-B8DHBTHKbWaRe0",
    authDomain: "ims-aramovil-dev.firebaseapp.com",
    projectId: "ims-aramovil-dev",
    storageBucket: "ims-aramovil-dev.firebasestorage.app",
    messagingSenderId: "723446750818",
    appId: "1:723446750818:web:870e55d51f8785ff2a3b3b",
    measurementId: "G-5WH6EXP81H"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
