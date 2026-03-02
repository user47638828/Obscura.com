import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const feedEl = document.getElementById("feed-posts")

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    feedEl.innerHTML = "<p>NICHT EINGELOGGT</p>"
    return
  }

  const snap = await getDocs(collection(db, "posts"))

  feedEl.innerHTML = "<p>Docs: " + snap.size + "</p>"

  snap.forEach(d => {
    const p = document.createElement("p")
    p.textContent = JSON.stringify(d.data())
    feedEl.appendChild(p)
  })
})
