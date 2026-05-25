import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5uih96USvoOmRMmsKCPs4rFW1tCNL5O8",
  authDomain: "kayamoz-debbb.firebaseapp.com",
  databaseURL: "https://kayamoz-debbb-default-rtdb.firebaseio.com",
  projectId: "kayamoz-debbb",
  storageBucket: "kayamoz-debbb.firebasestorage.app",
  messagingSenderId: "99360049373",
  appId: "1:99360049373:web:d33f5d0cdebf42237e7334"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
