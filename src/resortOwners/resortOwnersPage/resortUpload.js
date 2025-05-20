import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAch_Ph5WnosCD9gLXeeXorQGwck4_mQqs",
  authDomain: "spot-vibes.firebaseapp.com",
  projectId: "spot-vibes",
  storageBucket: "spot-vibes.appspot.com",
  messagingSenderId: "815189643743",
  appId: "1:815189643743:web:a7e571964f43c73b17f46a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const uploadForm = document.getElementById("uploadForm");
const postBtn = document.getElementById("postResortBtn");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("You must be logged in to post a resort.");
    window.location.href = "/SpotVibes/src/login_signup/resortOwnersSignupLogin.html";
    return;
  }

  uploadForm.classList.remove("hidden");

  postBtn.addEventListener("click", async () => {
    const rName = document.getElementById("rName").value.trim();
    const cPerson = document.getElementById("cPerson").value.trim();
    const cNumber = document.getElementById("cNumber").value.trim();
    const eMail = document.getElementById("eMail").value.trim();
    const desc = document.getElementById("desc").value.trim();
    const price = document.getElementById("price").value.trim();
    const address = document.getElementById("address").value.trim();

    if (
      !rName ||
      !cPerson ||
      !cNumber ||
      !eMail ||
      !desc ||
      !price ||
      !address
    ) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const uuid = crypto.randomUUID();

      const resortData = {
        id: uuid,
        name: rName,
        contact_person: cPerson,
        contact_number: cNumber,
        email: eMail,
        description: desc,
        price: price,
        address: address,
        created_by: user.email,
        image: "",  // empty since no image upload
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, "Resorts", uuid), resortData);

      alert("Resort posted successfully!");

      // Clear inputs
      uploadForm.querySelectorAll("input, textarea").forEach((el) => (el.value = ""));
    } catch (error) {
      console.error("Error saving resort data:", error);
      alert(`Failed to post resort. Error: ${error.message}`);
    }
  });
});
