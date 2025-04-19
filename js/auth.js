// js/auth.js
import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const msg = document.getElementById("message");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

// Network state detection
let isOnline = navigator.onLine;
window.addEventListener('online', () => { isOnline = true; });
window.addEventListener('offline', () => { isOnline = false; });

// Enhanced login handler
loginBtn.addEventListener("click", async () => {
  if (!isOnline) {
    showError("No internet connection. Please check your network.");
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!validateInputs(email, password)) return;

  try {
    showLoading(loginBtn);
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    handleAuthError(error);
  } finally {
    resetButton(loginBtn, "Login");
  }
});

// Enhanced signup handler
signupBtn.addEventListener("click", async () => {
  if (!isOnline) {
    showError("No internet connection. Please check your network.");
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!validateInputs(email, password)) return;

  try {
    showLoading(signupBtn);
    // Check if email exists first
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      showError("Email already in use. Please login instead.");
      return;
    }
    
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    handleAuthError(error);
  } finally {
    resetButton(signupBtn, "Sign Up");
  }
});

// Helper functions
function validateInputs(email, password) {
  if (!email || !password) {
    showError("Please enter both email and password");
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("Please enter a valid email address");
    return false;
  }
  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return false;
  }
  return true;
}

function handleAuthError(error) {
  console.error("Auth error:", error);
  
  const errorMap = {
    "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
    "auth/invalid-email": "Invalid email address format.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "Email already in use.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later."
  };

  showError(errorMap[error.code] || "Authentication failed. Please try again.");
}

function showError(message) {
  msg.textContent = message;
  msg.style.color = "#e74c3c";
  msg.style.display = "block";
}

function showLoading(button) {
  button.disabled = true;
  button.innerHTML = `<span class="spinner"></span> Processing...`;
}

function resetButton(button, text) {
  button.disabled = false;
  button.textContent = text;
}

// Test Firebase connection on load
export async function testFirebaseConnection() {
  try {
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`);
    if (!response.ok) throw new Error("Connection test failed");
    console.log("Firebase connection test successful");
    return true;
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    showError("Cannot connect to server. Please check your network.");
    return false;
  }
}

// Initialize connection test
testFirebaseConnection();