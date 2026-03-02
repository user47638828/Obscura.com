import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const feedEl = document.getElementById("feed-posts")
const modal = document.getElementById("comments-modal")
const commentsList = document.getElementById("comments-list")
const commentInput = document.getElementById("comment-input")
const sendCommentBtn = document.getElementById("send-comment")

let currentUser
let activePostId

function timeAgo(ts) {
  if (!ts) return "gerade eben"
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (diff < 60) return diff + "s"
  if (diff < 3600) return Math.floor(diff / 60) + "m"
  if (diff < 86400) return Math.floor(diff / 3600) + "h"
  return Math.floor(diff / 86400) + "d"
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }

  currentUser = user
  feedEl.innerHTML = ""

  const snap = await getDocs(collection(db, "posts"))

  const posts = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

  for (const post of posts) {
    const el = document.createElement("div")
    el.className = "feed-post"

    el.innerHTML = `
      <div class="feed-post-time">${timeAgo(post.createdAt)}</div>
      <div class="feed-post-header">${post.username}</div>
      <div class="feed-post-content">${post.content}</div>
      <div class="feed-post-meta">
        <span class="like">🩶 <span class="like-count">${post.likes || 0}</span></span>
        <span class="comment">💬 ${post.comments || 0}</span>
      </div>
    `

    feedEl.appendChild(el)

    const likeEl = el.querySelector(".like")
    const likeCountEl = el.querySelector(".like-count")

    const likeRef = doc(db, "posts", post.id, "likes", user.uid)
    const likedSnap = await getDoc(likeRef)

    if (likedSnap.exists()) {
      likeEl.firstChild.textContent = "❤️"
    }

    likeEl.onclick = async () => {
      if ((await getDoc(likeRef)).exists()) return

      await setDoc(likeRef, {
        userId: user.uid,
        createdAt: serverTimestamp()
      })

      likeEl.firstChild.textContent = "❤️"
      likeCountEl.textContent = Number(likeCountEl.textContent) + 1
    }
  }
})

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden")
}
