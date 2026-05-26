import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const kayamozFirebaseConfig = {
  apiKey: "AIzaSyB5uih96USvoOmRMmsKCPs4rFW1tCNL5O8",
  authDomain: "kayamoz-debbb.firebaseapp.com",
  databaseURL: "https://kayamoz-debbb-default-rtdb.firebaseio.com",
  projectId: "kayamoz-debbb",
  storageBucket: "kayamoz-debbb.firebasestorage.app",
  messagingSenderId: "99360049373",
  appId: "1:99360049373:web:d33f5d0cdebf42237e7334"
};

const netekFirebaseConfig = {
  apiKey: "AIzaSyDA7CPjYYVe_LPLxJ8WTpFNj-m_0OJqDco",
  authDomain: "gen-lang-client-0239171632.firebaseapp.com",
  projectId: "gen-lang-client-0239171632",
  storageBucket: "gen-lang-client-0239171632.firebasestorage.app",
  messagingSenderId: "582611055635",
  appId: "1:582611055635:web:95ba631d199c4e6c363be6"
};

function getOrInitApp(config: object, name?: string): FirebaseApp {
  const existing = getApps().find(app => app.name === (name || "[DEFAULT]"));
  if (existing) return existing;
  return name ? initializeApp(config, name) : initializeApp(config);
}

// KayaMoz app remains available for the existing real-time chat, marketplace and integrations.
export const app = getOrInitApp(kayamozFirebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Netek Cloud app is the primary auth/profile database requested for user login.
export const netekApp = getOrInitApp(netekFirebaseConfig, "netek-main");
export const netekAuth = getAuth(netekApp);
export const netekFirestore = getFirestore(netekApp);
export const netekStorage = getStorage(netekApp);

export const firebaseProjects = {
  kayamoz: kayamozFirebaseConfig.projectId,
  netek: netekFirebaseConfig.projectId,
};
