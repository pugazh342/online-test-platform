// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getAuth, 
  connectAuthEmulator,
  inAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgXTeR0miocuvULOdsBN3DdeA8shT4hFg",
  authDomain: "techquizz-a2a5d.firebaseapp.com",
  projectId: "techquizz-a2a5d",
  storageBucket: "techquizz-a2a5d.appspot.com",
  messagingSenderId: "863443484091",
  appId: "1:863443484091:web:7c0bb30d44b66626e6189e",
  measurementId: "G-3JVDC5ZN8F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Emulator setup (for development)
if (window.location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  console.log("Using Firebase Emulators");
}

export { auth, db };