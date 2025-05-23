// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile,
  GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

import {
  getFirestore, collection, doc, setDoc, getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Firebase config
import {firebaseConfig} from "../../firebase/firebaseConfig.js"

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const analytics = getAnalytics(app);
const db = getFirestore(app);

function showAlert(message) {
  const alertBox = document.getElementById("alertbox");
  if (alertBox) {
    alertBox.classList.remove("hidden");
    alertBox.textContent = message;
    alertBox.style.display = "block";
    setTimeout(() => alertBox.style.display = "none", 3000);
  }
}

// Sign Up
document.getElementById("signupbutton")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("semail").value;
  const password = document.getElementById("spassword").value;
  const confirmPassword = document.getElementById("sconfirmpassword").value;
  const username = document.getElementById("susername").value;

  if (!email || !password || !confirmPassword || !username) {
    return showAlert("Please fill in all fields to Sign Up");
  }
  if (password !== confirmPassword) {
    return showAlert("Passwords do not match!");
  }

  document.getElementById("signtext").textContent = "Signing up...";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    const usersCollection = collection(db, "Created Users");
    const snapshot = await getDocs(usersCollection);
    const newId = snapshot.size + 1;

    await setDoc(doc(db, "Created Users", user.uid), {
      fullname: username,
      username: username,
      email: email,
      userId: user.uid
    });

    document.getElementById("signform").reset();
    showAlert(`Signup successful! Welcome, ${username}`);
  } catch (error) {
    console.error("Signup error:", error);
    showAlert(`Signup failed: ${error.message}`);
  }

  document.getElementById("signtext").textContent = "Sign Up";
});

// Login
document.getElementById("loginbutton")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    return showAlert("Please input both fields to Login");
  }

  document.getElementById("logtext").textContent = "Logging in...";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showAlert("Login successful! Redirecting...");
    setTimeout(() => window.location.href = "../../../index.html", 1500);
  } catch (error) {
    console.error("Login error:", error);
    showAlert(`Login failed: ${error.message}`);
  }
  document.getElementById("logtext").textContent = "Login";
});

// Google Sign-In
document.getElementById("googleSignIn")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "Google Users", user.uid), {
      email: user.email,
      userId: user.uid,
      fullname: user.displayName
    });

    showAlert(`Google login successful! Welcome ${user.displayName}`);
    setTimeout(() => window.location.href = "../../../index.html", 1500);
  } catch (error) {
    console.error("Google login error:", error);
    showAlert(`Google login failed: ${error.message}`);
  }
});

// Toggle Password Visibility
function toggleVisibility(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  toggle?.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggle.textContent = isPassword ? "Hide" : "Show";
  });
}
toggleVisibility("togglePassword", "password");
toggleVisibility("toggleSignPassword", "spassword");
toggleVisibility("toggleConfirmPassword", "sconfirmpassword");

// Toggle Forms
document.getElementById("signup")?.addEventListener("click", () => {
  document.getElementById("loginform").classList.add("hidden");
  document.getElementById("signupform").classList.remove("hidden");
});
document.getElementById("login")?.addEventListener("click", () => {
  document.getElementById("signupform").classList.add("hidden");
  document.getElementById("loginform").classList.remove("hidden");
});

// Enter Key Submit
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (!document.getElementById("loginform").classList.contains("hidden")) {
      document.getElementById("loginbutton").click();
    } else {
      document.getElementById("signupbutton").click();
    }
  }
});