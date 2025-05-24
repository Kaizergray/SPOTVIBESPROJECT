import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  collectionGroup,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase/firebaseConfig.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "../../../index.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});

// Load resorts posted by the logged-in user
async function loadPostedResorts(user) {
  const container = document.getElementById("postedResorts");
  container.innerHTML = "";

  try {
    const resortsRef = collection(db, "Resorts");
    const querySnapshot = await getDocs(resortsRef);

    const resorts = querySnapshot.docs
      .map(doc => doc.data())
      .filter(resort => resort["created by"] === user.uid);

    if (resorts.length === 0) {
      container.innerHTML = `<p class="text-gray-500">No resorts posted yet.</p>`;
      return;
    }

    resorts.forEach((resort) => {
      const card = document.createElement("div");
      card.className = "bg-white shadow rounded-lg overflow-hidden";
      card.innerHTML = `
        <img src="${resort.image || 'https://via.placeholder.com/300x200'}" alt="${resort.name}" class="w-full h-40 object-cover" />
        <div class="p-4">
          <h3 class="text-lg font-bold">${resort.name}</h3>
          <p class="text-gray-600">${resort.address || 'No address provided'}</p>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading resorts:", error);
    container.innerHTML = `<p class="text-red-500">Error loading resorts.</p>`;
  }
}

// Load Booking Requests
let currentPage = 1;
const bookingsPerPage = 3;
let allBookings = [];

async function loadBookingRequests(user) {
  const container = document.getElementById("bookingRequests");
  container.innerHTML = "";

  try {
    const waitingRef = collection(db, "Pending Bookings", user.uid, "Waiting for Confirmation");
    const snapshot = await getDocs(waitingRef);

    if (snapshot.empty) {
      container.innerHTML = `<p class="text-gray-500">No pending booking requests.</p>`;
      return;
    }

    // Store all bookings for pagination
    allBookings = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    renderBookingPage(currentPage, user);

  } catch (error) {
    console.error("❌ Error loading booking requests:", error);
    container.innerHTML = `<p class="text-red-500">Failed to load booking requests.</p>`;
  }
}

function renderBookingPage(page, user) {
  const container = document.getElementById("bookingRequests");
  container.innerHTML = "";

  const start = (page - 1) * bookingsPerPage;
  const end = start + bookingsPerPage;
  const bookingsToShow = allBookings.slice(start, end);

  if (bookingsToShow.length === 0) {
    container.innerHTML = `<p class="text-gray-500">No booking requests on this page.</p>`;
    return;
  }

  bookingsToShow.forEach(({ id, data: booking }) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 shadow rounded-md mb-4";
    card.innerHTML = `
      <h3 class="text-lg font-semibold">${booking["Customer Name"] || "Unknown Customer"}</h3>
      <p class="text-sm text-gray-600">Resort: ${booking["Resort Name"] || "N/A"}</p>
      <p class="text-sm text-gray-600">Check-in: ${booking["Check In"] ? booking["Check In"].toDate().toLocaleString() : "N/A"}</p>
      <p class="text-sm text-gray-600">Check-out: ${booking["Check Out"] ? booking["Check Out"].toDate().toLocaleString() : "N/A"}</p>
      <p class="text-sm text-gray-600">Booking Type: ${booking["Booking Type"] || "N/A"}</p>
      <p class="text-sm text-gray-600">Price: ₱${booking["Price"] !== undefined ? booking["Price"] : "N/A"}</p>
      <p class="statusText text-sm text-blue-500">Status: ${booking["Status"] || "Pending Confirmation"}</p>
      <div class="mt-4 flex space-x-3 button-container">
        <button class="acceptBtn bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600" data-id="${id}">Accept</button>
        <button class="rejectBtn bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600" data-id="${id}">Reject</button>
      </div>
    `;
    container.appendChild(card);

    // Hide buttons if already confirmed
    if (booking["Status"] === "Confirmed") {
      card.querySelector(".button-container").style.display = "none";
    }

    // Accept Button
    card.querySelector(".acceptBtn").addEventListener("click", async () => {
      try {
        const bookingRef = doc(db, "Pending Bookings", user.uid, "Waiting for Confirmation", id);
        const resortId = booking["Resort Id"];
        if (!resortId) return alert("❌ Resort ID missing. Cannot confirm booking.");

        const updatedBooking = { ...booking, Status: "Confirmed" };
        const confirmedRef = doc(db, "Bookings", resortId, "Confirmed Booking", id);
        await setDoc(confirmedRef, updatedBooking);
        await updateDoc(bookingRef, { Status: "Confirmed" });

        const invoiceQuery = query(collectionGroup(db, "User Invoices"));
        const invoiceSnapshot = await getDocs(invoiceQuery);
        for (const invoice of invoiceSnapshot.docs) {
          if (invoice.id === id) {
            await updateDoc(invoice.ref, { Status: "Confirmed" });
            break;
          }
        }

        card.querySelector(".statusText").textContent = "Status: Confirmed";
        card.querySelector(".statusText").classList.replace("text-blue-500", "text-green-600");
        card.querySelector(".button-container").style.display = "none";
        alert("✅ Booking confirmed!");
      } catch (err) {
        console.error("❌ Confirm error:", err);
        alert("Failed to confirm booking.");
      }
    });

    // Reject Button
    card.querySelector(".rejectBtn").addEventListener("click", async () => {
      try {
        const invoiceRef = doc(db, "Invoices", "Invoices", "User Invoices", "User Invoices", id);
        await setDoc(invoiceRef, { ...booking, Status: "Rejected", "Time Issued": new Date().toISOString() });
        await deleteDoc(doc(db, "Pending Bookings", user.uid, "Waiting for Confirmation", id));
        card.remove();
        alert("❌ Booking rejected.");
      } catch (err) {
        console.error("❌ Reject error:", err);
        alert("Failed to reject booking.");
      }
    });
  });

  // Pagination Controls
  const totalPages = Math.ceil(allBookings.length / bookingsPerPage);
  const paginationDiv = document.createElement("div");
  paginationDiv.className = "flex justify-between items-center mt-4";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "⏪ Previous";
  prevBtn.className = "px-4 py-1 bg-gray-300 rounded disabled:opacity-50";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderBookingPage(currentPage, user);
    }
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next ⏩";
  nextBtn.className = "px-4 py-1 bg-gray-300 rounded disabled:opacity-50";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderBookingPage(currentPage, user);
    }
  });

  paginationDiv.appendChild(prevBtn);
  paginationDiv.appendChild(document.createTextNode(`Page ${page} of ${totalPages}`));
  paginationDiv.appendChild(nextBtn);
  container.appendChild(paginationDiv);
}


// Tab Switching
function setupTabs(user) {
  const links = document.querySelectorAll(".tab-link");
  const sections = document.querySelectorAll(".tab-section");

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.tab;

      sections.forEach((section) => section.classList.add("hidden"));
      links.forEach((l) => l.classList.remove("text-blue-600", "font-bold"));

      document.getElementById(`${target}Tab`).classList.remove("hidden");
      link.classList.add("text-blue-600", "font-bold");

      if (target === "bookings") {
        loadBookingRequests(user);
      }
    });
  });
}

// Auth Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPostedResorts(user);
    setupTabs(user);
  } else {
    window.location.href = "../../../index.html";
  }
});
