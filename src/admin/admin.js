// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

import {firebaseConfig} from "../firebase/firebaseConfig.js"

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Pagination state for Created Users
let usersPageSize = 10;
let usersLastVisible = null;
let usersPrevStack = [null];  // initialize with null to represent first page cursor

// Pagination state for Resort Owners
let ownersPageSize = 10;
let ownersLastVisible = null;
let ownersPrevStack = [null];

// Utility to clear table body and insert rows
function renderTableRows(tableBody, docs, idField, fields) {
  tableBody.innerHTML = "";
  let id = 1;

  docs.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.classList.add("border-t");

    // Build columns dynamically
    let cols = `<td class="px-6 py-4">${id++}</td>`;
    for (const f of fields) {
      cols += `<td class="px-6 py-4">${data[f] || "N/A"}</td>`;
    }
    cols += `<td class="px-6 py-4">
      <button 
        class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" 
        data-id="${docSnap.id}">
        Delete
      </button>
    </td>`;

    tr.innerHTML = cols;
    tableBody.appendChild(tr);
  });

  // Attach delete handlers
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const docId = button.getAttribute("data-id");
      const confirmDelete = confirm("Are you sure you want to delete this item?");
      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, idField, docId));
        alert("Deleted successfully.");
        button.closest("tr").remove();
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Failed to delete. Please try again.");
      }
    });
  });
}

// LOAD Created Users with pagination
async function loadCreatedUsers(direction = 'next') {
  const tableBody = document.getElementById("users-table-body");
  const collRef = collection(db, "Created Users");
  let q;

  if (direction === 'next') {
    const lastCursor = usersPrevStack[usersPrevStack.length - 1];
    if (lastCursor) {
      q = query(collRef, orderBy("username"), startAfter(lastCursor), limit(usersPageSize));
    } else {
      q = query(collRef, orderBy("username"), limit(usersPageSize));
    }
  } else if (direction === 'prev') {
    if (usersPrevStack.length > 1) {
      usersPrevStack.pop(); // remove current page cursor
      const prevCursor = usersPrevStack[usersPrevStack.length - 1];
      if (prevCursor) {
        q = query(collRef, orderBy("username"), startAfter(prevCursor), limit(usersPageSize));
      } else {
        q = query(collRef, orderBy("username"), limit(usersPageSize));
      }
    } else {
      // already at first page
      alert("You are at the first page.");
      return;
    }
  }

  try {
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      usersLastVisible = snapshot.docs[snapshot.docs.length - 1];
      renderTableRows(tableBody, snapshot.docs, "Created Users", ["username", "fullname", "email"]);

      // Manage cursor stack
      if (direction === 'next') {
        usersPrevStack.push(usersLastVisible);
      }

      // Disable prev button if at first page
      document.getElementById("users-prev-btn").disabled = usersPrevStack.length <= 1;
      // Disable next button if less than page size docs returned (no more pages)
      document.getElementById("users-next-btn").disabled = snapshot.size < usersPageSize;

    } else {
      if (direction === 'next') {
        alert("No more users.");
        document.getElementById("users-next-btn").disabled = true;
      }
    }
  } catch (error) {
    console.error("Error loading created users:", error);
    alert("Failed to load users.");
  }
}

// LOAD Resort Owners with pagination
async function loadResortOwners(direction = 'next') {
  const tableBody = document.getElementById("owners-table-body");
  const collRef = collection(db, "resortOwners");
  let q;

  if (direction === 'next') {
    const lastCursor = ownersPrevStack[ownersPrevStack.length - 1];
    if (lastCursor) {
      q = query(collRef, orderBy("username"), startAfter(lastCursor), limit(ownersPageSize));
    } else {
      q = query(collRef, orderBy("username"), limit(ownersPageSize));
    }
  } else if (direction === 'prev') {
    if (ownersPrevStack.length > 1) {
      ownersPrevStack.pop();
      const prevCursor = ownersPrevStack[ownersPrevStack.length - 1];
      if (prevCursor) {
        q = query(collRef, orderBy("username"), startAfter(prevCursor), limit(ownersPageSize));
      } else {
        q = query(collRef, orderBy("username"), limit(ownersPageSize));
      }
    } else {
      alert("You are at the first page.");
      return;
    }
  }

  try {
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      ownersLastVisible = snapshot.docs[snapshot.docs.length - 1];
      renderTableRows(tableBody, snapshot.docs, "resortOwners", ["username", "email", "createdAt", "contact"]);

      if (direction === 'next') {
        ownersPrevStack.push(ownersLastVisible);
      }

      document.getElementById("owners-prev-btn").disabled = ownersPrevStack.length <= 1;
      document.getElementById("owners-next-btn").disabled = snapshot.size < ownersPageSize;
    } else {
      if (direction === 'next') {
        alert("No more resort owners.");
        document.getElementById("owners-next-btn").disabled = true;
      }
    }
  } catch (error) {
    console.error("Error loading resort owners:", error);
    alert("Failed to load resort owners.");
  }
}


// Pagination state for Google Users
let googleUsersPageSize = 10;
let googleUsersLastVisible = null;
let googleUsersPrevStack = [null];

async function loadGoogleUsers(direction = 'next') {
  const tableBody = document.getElementById("google-users-table-body");
  const collRef = collection(db, "Google Users");
  let q;

  if (direction === 'next') {
    const lastCursor = googleUsersPrevStack[googleUsersPrevStack.length - 1];
    q = lastCursor 
      ? query(collRef, orderBy("fullname"), startAfter(lastCursor), limit(googleUsersPageSize))
      : query(collRef, orderBy("fullname"), limit(googleUsersPageSize));
  } else if (direction === 'prev') {
    if (googleUsersPrevStack.length > 1) {
      googleUsersPrevStack.pop();
      const prevCursor = googleUsersPrevStack[googleUsersPrevStack.length - 1];
      q = prevCursor
        ? query(collRef, orderBy("fullname"), startAfter(prevCursor), limit(googleUsersPageSize))
        : query(collRef, orderBy("fullname"), limit(googleUsersPageSize));
    } else {
      alert("You are at the first page.");
      return;
    }
  }

  try {
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      googleUsersLastVisible = snapshot.docs[snapshot.docs.length - 1];
      renderTableRows(tableBody, snapshot.docs, "Google Users", ["fullname", "email", "userId"]);

      if (direction === 'next') {
        googleUsersPrevStack.push(googleUsersLastVisible);
      }

      document.getElementById("google-users-prev-btn").disabled = googleUsersPrevStack.length <= 1;
      document.getElementById("google-users-next-btn").disabled = snapshot.size < googleUsersPageSize;
    } else {
      if (direction === 'next') {
        alert("No more Google users.");
        document.getElementById("google-users-next-btn").disabled = true;
      }
    }
  } catch (error) {
    console.error("Error loading Google Users:", error);
    alert("Failed to load Google Users.");
  }
}

// Fetch Pending Resorts
async function fetchPendingResorts() {
  const tableBody = document.getElementById("pending-resorts-table-body");
  tableBody.innerHTML = '';

  try {
    const snapshot = await getDocs(collection(db, "Pending Resorts"));
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const row = document.createElement("tr");
        row.dataset.id = docSnap.id; // Store ID for event delegation

        row.innerHTML = `
          <td class="px-6 py-4">
            <img src="${data.image || ''}" alt="${data.name || ''}" class="w-20 h-16 object-cover rounded-md" />
          </td>
          <td class="px-6 py-4">${data.name || 'N/A'}</td>
          <td class="px-6 py-4">${data.address || 'N/A'}</td>
          <td class="px-6 py-4">₱${data.price || 0}</td>
          <td class="px-6 py-4">${data.contact_person || 'N/A'}</td>
          <td class="px-6 py-4">
            <button class="approve-btn bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
              Approve
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-4 text-center text-gray-500">
            No pending resorts found.
          </td>
        </tr>`;
    }
  } catch (error) {
    console.error("Error fetching pending resorts:", error);
  }
}

// Approve a pending resort
async function approveResort(resortId) {
  const pendingRef = doc(db, "Pending Resorts", resortId);
  const approvedRef = doc(db, "Resorts", resortId);

  try {
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      const data = pendingSnap.data();

      await setDoc(approvedRef, data);       // Move to "Resorts"
      await deleteDoc(pendingRef);           // Remove from "Pending Resorts"

      alert("Resort approved successfully!");

      fetchPendingResorts(); // Refresh tables
      fetchApprovedResorts();
    } else {
      alert("Resort not found.");
    }
  } catch (error) {
    console.error("Error approving resort:", error);
    alert("An error occurred while approving.");
  }
}

// Fetch Approved Resorts
async function fetchApprovedResorts() {
  const tableBody = document.getElementById("resorts-table-body");
  tableBody.innerHTML = '';

  try {
    const snapshot = await getDocs(collection(db, "Resorts"));
    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const row = document.createElement("tr");

        row.innerHTML = `
          <td class="px-6 py-4">
            <img src="${data.image || ''}" alt="${data.name || ''}" class="w-20 h-16 object-cover rounded-md" />
          </td>
          <td class="px-6 py-4">${data.name || 'N/A'}</td>
          <td class="px-6 py-4">${data.address || 'N/A'}</td>
          <td class="px-6 py-4">₱${data.price || 0}</td>
          <td class="px-6 py-4">${data.contact_person || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">
            No approved resorts found.
          </td>
        </tr>`;
    }
  } catch (error) {
    console.error("Error fetching approved resorts:", error);
  }
}

// 🧠 Event Delegation for Approve Button
document.getElementById("pending-resorts-table-body").addEventListener("click", (e) => {
  if (e.target.classList.contains("approve-btn")) {
    const row = e.target.closest("tr");
    const resortId = row?.dataset.id;
    if (resortId) {
      approveResort(resortId);
    }
  }
});

// Initial load
fetchPendingResorts();
fetchApprovedResorts();


// Pagination buttons
document.getElementById("google-users-next-btn").addEventListener("click", () => loadGoogleUsers('next'));
document.getElementById("google-users-prev-btn").addEventListener("click", () => loadGoogleUsers('prev'));
// Pagination buttons event listeners
document.getElementById("resorts-next-btn").addEventListener("click", () => fetchApprovedResorts());
document.getElementById("resorts-prev-btn").addEventListener("click", () => fetchApprovedResorts());
// Pagination buttons event listeners
document.getElementById("pending-resorts-next-btn").addEventListener("click", () => fetchPendingResorts());
document.getElementById("pending-resorts-prev-btn").addEventListener("click", () => fetchPendingResorts());


// Event listeners for pagination buttons
document.getElementById("users-next-btn").addEventListener("click", () => loadCreatedUsers('next'));
document.getElementById("users-prev-btn").addEventListener("click", () => loadCreatedUsers('prev'));
document.getElementById("owners-next-btn").addEventListener("click", () => loadResortOwners('next'));
document.getElementById("owners-prev-btn").addEventListener("click", () => loadResortOwners('prev'));

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

  if (tabId === 'owners') loadResortOwners();
  if (tabId === 'users') loadCreatedUsers();
  if (tabId === 'google_users') loadGoogleUsers();
  if (tabId === 'pendingResorts') fetchPendingResorts();
  if (tabId === 'Resorts') fetchApprovedResorts();
}


window.showTab = showTab;

// On page load, show default tab and load users
window.addEventListener('DOMContentLoaded', () => {
  showTab('dashboard');
  loadCreatedUsers();
});
