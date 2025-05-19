// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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
const db = getFirestore(app);

// ResortOwners
async function loadResortOwners() {
  const tableBody = document.querySelector("#owners table tbody");
  tableBody.innerHTML = ""; // Clear existing rows

  try {
    const ownersSnapshot = await getDocs(collection(db, "resortOwners"));
    let id = 1;

    ownersSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.classList.add("border-t");

      tr.innerHTML = `
        <td class="px-6 py-4">${id++}</td>
        <td class="px-6 py-4">${data.username || "N/A"}</td>
        <td class="px-6 py-4">${data.email || "N/A"}</td>
        <td class="px-6 py-4">${data.createdAt || "N/A"}</td>
        <td class="px-6 py-4">${data.contact || "N/A"}</td>
        <td class="px-6 py-4">
          <button 
            class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" 
            data-id="${docSnap.id}">
            Delete
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach delete event listeners
    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", async () => {
        const docId = button.getAttribute("data-id");
        const confirmDelete = confirm("Are you sure you want to delete this resort owner?");
        if (!confirmDelete) return;

        try {
          await deleteDoc(doc(db, "resortOwners", docId));
          alert("Resort owner deleted successfully.");
          button.closest("tr").remove(); // remove the row from the UI
        } catch (error) {
          console.error("Error deleting resort owner:", error);
          alert("Failed to delete resort owner. Please try again.");
        }
      });
    });

  } catch (error) {
    console.error("Error loading resort owners:", error);
    alert("Failed to load resort owners.");
  }
}

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

// Tab switching logic
function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(section => section.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('bg-blue-700'));
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.innerText.includes(tabId.split("_")[0]));
  if (activeBtn) activeBtn.classList.add('bg-blue-700');

  if (tabId === 'owners') loadResortOwners(); // ⬅️ Load data when tab is clicked
}

window.showTab = showTab;

// Show default tab on load
window.addEventListener('DOMContentLoaded', () => {
  showTab('dashboard');
});
