// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

// Firebase config
export const firebaseConfig = {
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
const db = getFirestore(app);
const auth = getAuth(app);

let selectedResort = null;
let allResorts = [];
let currentUser = null;

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Display resorts
function displayResorts(resorts) {
  const container = document.getElementById("resortsContainer");
  container.innerHTML = "";
  resorts.forEach(resort => {
    const card = document.createElement("div");
    card.className = "rounded-lg overflow-hidden shadow hover:shadow-md transition cursor-pointer";
    card.innerHTML = `
      <img src="${resort.image || 'https://via.placeholder.com/400x200'}" alt="${resort.name}" class="w-full h-48 object-cover">
      <div class="p-4">
        <div class="text-sm text-gray-500">${resort.address || 'Unknown address'}</div>
        <div class="text-sm font-medium">₱${resort.price || 'N/A'} • ${resort.name}</div>
      </div>
    `;
    card.onclick = () => showModal(resort);
    container.appendChild(card);
  });
}

// Load resorts
async function loadResorts() {
  const snapshot = await getDocs(collection(db, "Resorts"));
  allResorts = [];
  snapshot.forEach(doc => {
    const resort = doc.data();
    resort.id = doc.id;
    allResorts.push(resort);
  });
  displayResorts(allResorts);
}

// Filter resorts
window.filterResortsByName = function (searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const filtered = allResorts.filter(resort =>
    resort.name && resort.name.toLowerCase().includes(term)
  );
  displayResorts(filtered);
};

// Modal controls
function showModal(resort) {
  selectedResort = resort;
  document.getElementById("modalImage").src = resort.image || "https://via.placeholder.com/400x200";
  document.getElementById("modalName").textContent = resort.name || "No name";
  document.getElementById("modalAddress").textContent = resort.address || "No address provided";
  document.getElementById("modalPrice").textContent = `₱${resort.price || 'N/A'}`;
  document.getElementById("modalDescription").textContent = resort.description || "No description.";
  document.getElementById("resortModal").classList.remove("hidden");
}

// Book Now button behavior
window.openBookingModal = function () {
  if (!currentUser) {
    alert("You must be logged in to book. Redirecting to login page...");
    window.location.href = "src/users/userSignUpLogin/userSignupLogin.html";
    return;
  }

  document.getElementById("bookingModal").classList.remove("hidden");
  flatpickr("#checkInDate", { minDate: "today", dateFormat: "Y-m-d" });
  flatpickr("#checkOutDate", { minDate: "today", dateFormat: "Y-m-d" });
};

window.closeModal = () => document.getElementById("resortModal").classList.add("hidden");
window.closeBookingModal = () => document.getElementById("bookingModal").classList.add("hidden");

// Booking form submission
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) {
    alert("You must be logged in to submit a booking.");
    return;
  }

  const booking = {
    resortId: selectedResort.id,
    resortName: selectedResort.name,
    guestName: document.getElementById("guestName").value,
    guestEmail: document.getElementById("guestEmail").value,
    checkInDate: document.getElementById("checkInDate").value,
    checkOutDate: document.getElementById("checkOutDate").value,
    numGuests: parseInt(document.getElementById("numGuests").value),
    createdAt: new Date().toISOString(),
    userId: currentUser.uid
  };

  try {
    await addDoc(collection(db, "Bookings"), booking);
    document.getElementById("bookingMessage").classList.remove("hidden");
    document.getElementById("bookingForm").reset();
    setTimeout(() => {
      document.getElementById("bookingMessage").classList.add("hidden");
      closeBookingModal();
      closeModal();
    }, 2000);
  } catch (err) {
    alert("Booking failed: " + err.message);
  }
});

document.getElementById("searchInput").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    filterResortsByName(this.value);
  }
});

loadResorts();
