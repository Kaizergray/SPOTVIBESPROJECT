// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updateProfile, updatePassword, deleteUser,
  GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

import {
  getFirestore, collection, doc, addDoc, setDoc, getDocs
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
  const contact = document.getElementById("scontact").value;

  if (!email || !password || !confirmPassword || !username || !contact) {
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

    // 🔥 Firestore: Get current count for incremental ID
    const usersCollection = collection(db, "resortOwners");
    const snapshot = await getDocs(usersCollection);
    const newId = snapshot.size + 1;

    const creationDate = new Date().toISOString(); // or use `user.metadata.creationTime`

    await setDoc(doc(db, "resortOwners", user.uid), {
      uid: user.uid,
      email: user.email,
      username: username,
      contact: contact,
      createdAt: creationDate
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

    // Check for hardcoded admin credentials
  if (email === "adminlogin" && password === "admin123") {
    showAlert("Admin login successful! Redirecting...");
    setTimeout(() => window.location.href = "../../admin/admin.html", 1500);
    return;
  }

  document.getElementById("logtext").textContent = "Logging in...";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showAlert("Login successful! Redirecting...");
    setTimeout(() => window.location.href = "../resortOwnersPage/resortOwner.html", 1500);
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
    showAlert(`Google login successful! Welcome ${result.user.displayName}`);
    setTimeout(() => window.location.href = "../resortOwnersPage/resortOwner.html", 1500);
  } catch (error) {
    console.error("Google login error:", error);
    showAlert(`Google login failed: ${error.message}`);
  }
});

// Auth Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("loginform")?.classList.add("hidden");
    document.getElementById("signupform")?.classList.add("hidden");
    document.getElementById("profilesection")?.classList.remove("hidden");

    document.getElementById("profilename").textContent = user.displayName || "No Name";
    document.getElementById("profileemail").textContent = user.email;
    const createdDate = new Date(user.metadata.creationTime).toLocaleString();
    document.getElementById("createddate").textContent = `Joined: ${createdDate}`;
  } else {
    document.getElementById("profilesection")?.classList.add("hidden");
    document.getElementById("loginform")?.classList.remove("hidden");
  }
});

// Update Display Name
document.getElementById("updatename")?.addEventListener("click", async () => {
  const newName = document.getElementById("newname").value.trim();
  if (!newName) return showAlert("Display name cannot be empty.");

  try {
    await updateProfile(auth.currentUser, { displayName: newName });
    document.getElementById("profilename").textContent = newName;
    document.getElementById("newname").value = "";
    showAlert("Display name updated.");
  } catch (error) {
    console.error("Update name error:", error);
    showAlert("Failed to update name.");
  }
});

// Change Password
document.getElementById("changepassword")?.addEventListener("click", async () => {
  const newPass = document.getElementById("newpassword").value;
  if (!newPass || newPass.length < 6) {
    return showAlert("Password must be at least 6 characters.");
  }

  try {
    await updatePassword(auth.currentUser, newPass);
    document.getElementById("newpassword").value = "";
    showAlert("Password changed successfully.");
  } catch (error) {
    console.error("Password change error:", error);
    showAlert("Failed to change password.");
  }
});

// Delete Account
document.getElementById("deleteaccount")?.addEventListener("click", async () => {
  if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
    try {
      await deleteUser(auth.currentUser);
      showAlert("Account deleted.");
    } catch (error) {
      console.error("Delete account error:", error);
      showAlert("Account deletion failed. Try re-logging in.");
    }
  }
});

// Logout
document.getElementById("logoutbtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showAlert("Logged out successfully.");
  } catch (error) {
    console.error("Logout error:", error);
    showAlert("Logout failed!");
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
