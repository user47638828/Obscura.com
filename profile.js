import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const params = new URLSearchParams(location.search)
const profileUid = params.get("uid")

const usernameEl = document.getElementById("profile-username")
const bioEl = document.getElementById("profile-bio")
const levelEl = document.getElementById("profile-level")
const xpEl = document.getElementById("profile-xp")
const likesEl = document.getElementById("profile-likes")
const commentsEl = document.getElementById("profile-comments")
const postsEl = document.getElementById("posts")

const editNameBtn = document.getElementById("edit-name")
const editBioBtn = document.getElementById("edit-bio")
const createPostSection = document.getElementById("create-post")
const postInput = document.getElementById("post-input")
const postBtn = document.getElementById("post-btn")

function levelFromXp(xp) {
  return Math.floor(xp / 50) + 1
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html"
    return
  }

  const uid = profileUid || user.uid
  const isOwnProfile = uid === user.uid

  if (!isOwnProfile) {
    editNameBtn.style.display = "none"
    editBioBtn.style.display = "none"
    createPostSection.style.display = "none"
  }

  const userSnap = await getDoc(doc(db, "users", uid))
  const data = userSnap.data()

  usernameEl.textContent = data.username
  bioEl.textContent = data.bio || "Keine Bio"
  xpEl.textContent = data.xp
  levelEl.textContent = levelFromXp(data.xp)
  likesEl.textContent = data.totalLikes || 0
  commentsEl.textContent = data.totalComments || 0

  const q = query(collection(db, "posts"), where("userId", "==", uid))
  const snap = await getDocs(q)

  snap.forEach(d => {
    const post = d.data()
    const el = document.createElement("div")
    el.className = "profile-post"
    el.innerHTML = `<p>${post.content}</p>`
    postsEl.appendChild(el)
  })

  if (isOwnProfile) {
    postBtn.onclick = async () => {
      const text = postInput.value.trim()
      if (!text) return

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        username: data.username,
        content: text,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      })

      location.reload()
    }
  }
})
