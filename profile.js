import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const usernameEl = document.getElementById("profile-username")
const bioEl = document.getElementById("profile-bio")
const editNameBtn = document.getElementById("edit-name")
const editBioBtn = document.getElementById("edit-bio")

const levelEl = document.getElementById("profile-level")
const xpEl = document.getElementById("profile-xp")
const likesEl = document.getElementById("profile-likes")
const commentsEl = document.getElementById("profile-comments")

const postInput = document.getElementById("post-input")
const postBtn = document.getElementById("post-btn")
const postsEl = document.getElementById("posts")

let userRef
let currentUser
let currentUsername

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

  currentUsername = data.username

  usernameEl.textContent = data.username
  bioEl.textContent = data.bio || "Keine Bio gesetzt"

  xpEl.textContent = data.xp
  levelEl.textContent = levelFromXp(data.xp)
  likesEl.textContent = data.totalLikes || 0
  commentsEl.textContent = data.totalComments || 0

  const q = query(collection(db, "posts"), where("userId", "==", user.uid))
  const postsSnap = await getDocs(q)

  postsSnap.forEach((d) => {
    const post = d.data()
    const el = document.createElement("div")
    el.className = "profile-post"
    el.innerHTML = `<p>${post.content}</p>`
    postsEl.appendChild(el)
  })
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
  currentUsername = name
})

editBioBtn.addEventListener("click", async () => {
  const bio = prompt("Neue Bio")
  if (bio === null) return

  await updateDoc(userRef, { bio })
  bioEl.textContent = bio || "Keine Bio gesetzt"
})

postBtn.addEventListener("click", async () => {
  const text = postInput.value.trim()
  if (!text) return

  await addDoc(collection(db, "posts"), {
    userId: currentUser.uid,
    username: currentUsername,
    content: text,
    likes: 0,
    comments: 0,
    createdAt: serverTimestamp()
  })

  const el = document.createElement("div")
  el.className = "profile-post"
  el.innerHTML = `<p>${text}</p>`
  postsEl.prepend(el)

  postInput.value = ""
})
