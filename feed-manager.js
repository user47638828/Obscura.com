import { auth } from "./backend.js"
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"

const logoutBtn = document.getElementById("logout-btn")

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html"
  }
})

logoutBtn.addEventListener("click", async () => {
  await signOut(auth)
  window.location.href = "index.html"
})
