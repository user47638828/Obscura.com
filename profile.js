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

const usernameInput = document.getElementById("profile-username")
const bioInput = document.getElementById("profile-bio")
const saveBtn = document.getElementById("save-profile")
const levelEl = document.getElementById("profile-level")
const xpEl = document.getElementById("profile-xp")
const likesEl = document.getElementById("profile-likes")
const commentsEl = document.getElementById("profile-comments")
const postsContainer = document.getElementById("profile-posts")

function getLevel(xp) {
  return Math.floor(xp / 50) + 1
}

let currentUserRef = null

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }

  currentUserRef = doc(db, "users", user.uid)
  const snap = await getDoc(currentUserRef)
  const data = snap.data()

  usernameInput.value = data.username
  bioInput.value = data.bio || ""
  xpEl.textContent = data.xp
  levelEl.textContent = getLevel(data.xp)
  likesEl.textContent = data.totalLikes || 0
  commentsEl.textContent = data.totalComments || 0

  const q = query(
    collection(db, "posts"),
    where("userId", "==", user.uid)
  )

  const postsSnap = await getDocs(q)
  postsSnap.forEach((d) => {
    const post = d.data()
    const el = document.createElement("div")
    el.className = "profile-post"
    el.innerHTML = `
      <p>${post.content}</p>
      <div class="profile-post-meta">
        <span>❤️ ${post.likes}</span>
        <span>💬 ${post.comments || 0}</span>
      </div>
    `
    postsContainer.appendChild(el)
  })
})

saveBtn.addEventListener("click", async () => {
  if (!currentUserRef) return

  const username = usernameInput.value.trim()
  const bio = bioInput.value.trim()

  if (!username) return

  await updateDoc(currentUserRef, {
    username,
    bio
  })
})
