import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  query,
  where,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const input = document.getElementById("search-input")
const resultsEl = document.getElementById("search-results")

let currentUser

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html"
    return
  }

  currentUser = user
  loadSuggestions()
})

async function loadSuggestions() {
  resultsEl.innerHTML = ""
  const snap = await getDocs(query(collection(db, "users"), limit(10)))

  snap.forEach(d => renderUser(d.id, d.data()))
}

input.addEventListener("input", async () => {
  const value = input.value.trim().toLowerCase()
  resultsEl.innerHTML = ""

  if (value.length < 2) {
    loadSuggestions()
    return
  }

  const q = query(
    collection(db, "users"),
    where("username", ">=", value),
    where("username", "<=", value + "\uf8ff")
  )

  const snap = await getDocs(q)
  snap.forEach(d => renderUser(d.id, d.data()))
})

function renderUser(uid, user) {
  const el = document.createElement("div")
  el.className = "search-result"
  el.innerHTML = `
    <h4>${user.username}</h4>
    <p>${user.bio || "Keine Bio"}</p>
  `
  el.onclick = () => location.href = `profile.html?uid=${uid}`
  resultsEl.appendChild(el)
}
