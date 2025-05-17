// admin.js

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAch_Ph5WnosCD9gLXeeXorQGwck4_mQqs",
  authDomain: "spot-vibes.firebaseapp.com",
  databaseURL: "https://spot-vibes-default-rtdb.firebaseio.com",
  projectId: "spot-vibes",
  storageBucket: "spot-vibes.appspot.com",
  messagingSenderId: "815189643743",
  appId: "1:815189643743:web:a7e571964f43c73b17f46a",
  measurementId: "G-3926TGFZJX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Logout logic
document.getElementById("logoutbtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../../src/resortOwners/resortOwnersSignupLogin/resortOwnersSignupLogin.html";
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Logout failed. Please try again.");
  }
});

// NOTE: Removed onAuthStateChanged check since admin login is handled via preset credentials, not Firebase auth state.

// Tab switching logic
function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(section => {
    section.classList.add('hidden');
  });
  document.getElementById(tabId).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-700');
  });
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.innerText.includes(tabId.split("_")[0]));
  if (activeBtn) {
    activeBtn.classList.add('bg-blue-700');
  }
}

window.showTab = showTab;

// Show default tab on load
window.addEventListener('DOMContentLoaded', () => {
  showTab('dashboard');
});