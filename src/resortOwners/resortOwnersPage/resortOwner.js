import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// Your Firebase config
import {firebaseConfig} from "../../firebase/firebaseConfig.js"

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Logout function
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "../../../index.html"; // Redirect after logout
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});


const resorts = [
  { name: "Sunny Beach Resort", location: "Palawan", image: "https://via.placeholder.com/300x200" },
  { name: "Mountain View Resort", location: "Baguio", image: "https://via.placeholder.com/300x200" },
];

const bookings = [
  {
    customerName: "Juan Dela Cruz",
    resort: "Sunny Beach Resort",
    checkIn: "2025-06-10",
    checkOut: "2025-06-12"
  },
  {
    customerName: "Maria Clara",
    resort: "Mountain View Resort",
    checkIn: "2025-07-01",
    checkOut: "2025-07-03"
  }
];

function loadPostedResorts() {
  const container = document.getElementById("postedResorts");
  container.innerHTML = "";
  resorts.forEach((resort) => {
    const card = document.createElement("div");
    card.className = "bg-white shadow rounded-lg overflow-hidden";
    card.innerHTML = `
      <img src="${resort.image}" alt="${resort.name}" class="w-full h-40 object-cover" />
      <div class="p-4">
        <h3 class="text-lg font-bold">${resort.name}</h3>
        <p class="text-gray-600">${resort.location}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

function loadBookingRequests() {
  const container = document.getElementById("bookingRequests");
  container.innerHTML = "";
  bookings.forEach((booking, index) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 shadow rounded-md";
    card.innerHTML = `
      <h3 class="text-lg font-semibold">${booking.customerName}</h3>
      <p class="text-sm text-gray-600">Resort: ${booking.resort}</p>
      <p class="text-sm text-gray-600">Check-in: ${booking.checkIn}</p>
      <p class="text-sm text-gray-600">Check-out: ${booking.checkOut}</p>
      <div class="mt-4 flex space-x-3">
        <button class="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600" onclick="acceptBooking(${index})">Accept</button>
        <button class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600" onclick="rejectBooking(${index})">Reject</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function acceptBooking(index) {
  alert(`Accepted booking for ${bookings[index].customerName}`);
}

function rejectBooking(index) {
  alert(`Rejected booking for ${bookings[index].customerName}`);
}

function setupTabs() {
  const links = document.querySelectorAll(".tab-link");
  const sections = document.querySelectorAll(".tab-section");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.tab;

      // Hide all sections
      sections.forEach(sec => sec.classList.add("hidden"));

      // Remove active styles
      links.forEach(l => l.classList.remove("text-blue-600", "font-bold"));

      // Show selected tab section
      document.getElementById(`${target}Tab`).classList.remove("hidden");

      // Highlight the active link
      link.classList.add("text-blue-600", "font-bold");
    });
  });
}

// Initial load
loadPostedResorts();
loadBookingRequests();
setupTabs();
