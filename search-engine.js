import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const input = document.getElementById("search-input")
const resultsEl = document.getElementById("search-results")

let currentUser

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }
  currentUser = user
})

input.addEventListener("input", async () => {
  const value = input.value.trim().toLowerCase()
  resultsEl.innerHTML = ""

  if (value.length < 2) return

  const q = query(
    collection(db, "users"),
    where("username", ">=", value),
    where("username", "<=", value + "\uf8ff")
  )

  const snap = await getDocs(q)

  snap.forEach(d => {
    const user = d.data()

    const el = document.createElement("div")
    el.className = "search-result"
    el.innerHTML = `
      <h4>${user.username}</h4>
      <p>${user.bio || "Keine Bio"}</p>
    `

    el.onclick = () => {
      location.href = `profile.html?uid=${d.id}`
    }

    resultsEl.appendChild(el)
  })
})
