import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged, updateProfile, updatePassword, deleteUser, signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

import {
  getFirestore, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

import { firebaseConfig } from "../../firebase/firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
getAnalytics(app);

function showAlert(message) {
  const alertBox = document.getElementById("alertbox");
  alertBox.classList.remove("hidden");
  alertBox.textContent = message;
  setTimeout(() => alertBox.classList.add("hidden"), 3000);
}

// Display user info on auth state change
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("profilename").textContent = user.displayName || "No Name";
    document.getElementById("profileemail").textContent = user.email;
    document.getElementById("createddate").textContent = `Joined: ${new Date(user.metadata.creationTime).toLocaleString()}`;
  } else {
    window.location.href = "../../../index.html"; // redirect to login if not authenticated
  }
});

// Update Display Name both in Auth and Firestore
document.getElementById("updatename").addEventListener("click", async () => {
  const newName = document.getElementById("newname").value.trim();
  if (!newName) return showAlert("Display name cannot be empty.");

  try {
    // Update Firebase Authentication
    await updateProfile(auth.currentUser, { displayName: newName });
    
    // Update Firestore document in "Created Users" collection
    const userDocRef = doc(db, "Created Users", auth.currentUser.uid);
    await updateDoc(userDocRef, {
      fullname: newName,
      username: newName
    });

    document.getElementById("profilename").textContent = newName;
    showAlert("Display name updated.");
  } catch (error) {
    console.error(error);
    showAlert("Failed to update name.");
  }
});

// Change password
document.getElementById("changepassword").addEventListener("click", async () => {
  const newPass = document.getElementById("newpassword").value;
  if (!newPass || newPass.length < 6) {
    return showAlert("Password must be at least 6 characters.");
  }

  try {
    await updatePassword(auth.currentUser, newPass);
    showAlert("Password changed.");
  } catch (error) {
    console.error(error);
    showAlert("Failed to change password. You may need to re-login.");
  }
});

// Delete account from both Auth and Firestore
document.getElementById("deleteaccount").addEventListener("click", async () => {
  if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    try {
      // Delete Firestore document
      const userDocRef = doc(db, "Created Users", auth.currentUser.uid);
      await deleteDoc(userDocRef);

      // Delete user from Authentication
      await deleteUser(auth.currentUser);

      showAlert("Account deleted.");
      setTimeout(() => window.location.href = "../../../index.html", 1500);
    } catch (error) {
      console.error(error);
      showAlert("Error deleting account. You may need to re-login and try again.");
    }
  }
});

// Log out
document.getElementById("logoutbtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../../../index.html";
});
