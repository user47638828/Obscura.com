import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const usernameEl = document.getElementById("profile-username")
const bioEl = document.getElementById("profile-bio")
const editNameBtn = document.getElementById("edit-name")
const editBioBtn = document.getElementById("edit-bio")

const levelEl = document.getElementById("profile-level")
const xpEl = document.getElementById("profile-xp")
const likesEl = document.getElementById("profile-likes")
const commentsEl = document.getElementById("profile-comments")
const postsEl = document.getElementById("posts")

let userRef
let currentUser

function levelFromXp(xp) {
  return Math.floor(xp / 50) + 1
}

async function isUsernameFree(name) {
  const q = query(collection(db, "users"), where("username", "==", name))
  const snap = await getDocs(q)
  return snap.empty || snap.docs[0].id === currentUser.uid
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }

  currentUser = user
  userRef = doc(db, "users", user.uid)
  const snap = await getDoc(userRef)
  const data = snap.data()

  usernameEl.textContent = data.username
  bioEl.textContent = data.bio || "Keine Bio gesetzt"

  xpEl.textContent = data.xp
  levelEl.textContent = levelFromXp(data.xp)
  likesEl.textContent = data.totalLikes || 0
  commentsEl.textContent = data.totalComments || 0
})

editNameBtn.addEventListener("click", async () => {
  const name = prompt("Neuer Username")
  if (!name) return

  const free = await isUsernameFree(name)
  if (!free) {
    alert("Username bereits vergeben")
    return
  }

  await updateDoc(userRef, { username: name })
  usernameEl.textContent = name
})

editBioBtn.addEventListener("click", async () => {
  const bio = prompt("Neue Bio")
  if (bio === null) return

  await updateDoc(userRef, { bio })
  bioEl.textContent = bio || "Keine Bio gesetzt"
})
