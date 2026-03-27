import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQ5EJkMEVZ10ni63ktBitNzhGrngoWVv4",
  authDomain: "voxflow-fc3f3.firebaseapp.com",
  projectId: "voxflow-fc3f3",
  storageBucket: "voxflow-fc3f3.firebasestorage.app",
  messagingSenderId: "397915881907",
  appId: "1:397915881907:web:706abbae829acf6636cbc6",
  measurementId: "G-VBJEYQ2GVG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
