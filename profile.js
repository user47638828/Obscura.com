import { auth, db } from "./backend.js"
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const usernameEl = document.getElementById("profile-username")
const bioEl = document.getElementById("profile-bio")
const levelEl = document.getElementById("profile-level")
const xpEl = document.getElementById("profile-xp")
const likesEl = document.getElementById("profile-likes")
const commentsEl = document.getElementById("profile-comments")
const postsContainer = document.getElementById("profile-posts")

function getLevel(xp) {
  return Math.floor(xp / 50) + 1
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }

  const userRef = doc(db, "users", user.uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    await setDoc(userRef, {
      username: user.email.split("@")[0],
      bio: "",
      xp: 0,
      totalLikes: 0,
      totalComments: 0,
      createdAt: Date.now()
    })
  }

  const data = (await getDoc(userRef)).data()

  usernameEl.textContent = data.username
  bioEl.textContent = data.bio || "Keine Bio gesetzt"
  xpEl.textContent = data.xp
  levelEl.textContent = getLevel(data.xp)
  likesEl.textContent = data.totalLikes || 0
  commentsEl.textContent = data.totalComments || 0

  const postsQuery = query(
    collection(db, "posts"),
    where("userId", "==", user.uid)
  )

  const postsSnap = await getDocs(postsQuery)

  postsSnap.forEach((doc) => {
    const post = doc.data()
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
