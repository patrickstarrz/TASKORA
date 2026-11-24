
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Konfigurasi Firebase TASKORA
const firebaseConfig = {
  apiKey: "AIzaSyDiIhFf5eXij9Fgb6wqO1DKtIORRgffxKQ",
  authDomain: "taskora-f30f1.firebaseapp.com",
  projectId: "taskora-f30f1",
  storageBucket: "taskora-f30f1.firebasestorage.app",
  messagingSenderId: "921445456383",
  appId: "1:921445456383:web:29b55492e701771612afca"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Fungsi login Google
function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

// Fungsi logout
function logoutUser() {
  return signOut(auth);
}

// Pantau status login
function monitorAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export {
  auth,
  loginWithGoogle,
  logoutUser,
  monitorAuth
};
