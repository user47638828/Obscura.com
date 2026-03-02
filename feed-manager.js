import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
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
  const diff = Math.floor((Date.now() - ts) / 1000)
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

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)

  snap.forEach(async (d) => {
    const post = d.data()
    const likeRef = doc(db, "posts", d.id, "likes", user.uid)
    const liked = (await getDoc(likeRef)).exists()

    const el = document.createElement("div")
    el.className = "feed-post"
    el.innerHTML = `
      <div class="feed-post-time">${timeAgo(post.createdAt.toMillis())}</div>
      <div class="feed-post-header">${post.username}</div>
      <div class="feed-post-content">${post.content}</div>
      <div class="feed-post-meta">
        <span class="like">${liked ? "❤️" : "🩶"} ${post.likes}</span>
        <span class="comment">💬 ${post.comments}</span>
      </div>
    `

    el.querySelector(".like").onclick = async () => {
      if (liked) return
      await addDoc(collection(db, "posts", d.id, "likes"), {
        userId: user.uid
      })
    }

    el.querySelector(".comment").onclick = async () => {
      activePostId = d.id
      commentsList.innerHTML = ""
      modal.classList.remove("hidden")

      const cSnap = await getDocs(collection(db, "posts", d.id, "comments"))
      cSnap.forEach((c) => {
        const el = document.createElement("div")
        el.className = "comment"
        el.textContent = c.data().text
        commentsList.appendChild(el)
      })
    }

    feedEl.appendChild(el)
  })
})

sendCommentBtn.onclick = async () => {
  if (!commentInput.value || !activePostId) return

  await addDoc(collection(db, "posts", activePostId, "comments"), {
    text: commentInput.value,
    createdAt: serverTimestamp()
  })

  const el = document.createElement("div")
  el.className = "comment"
  el.textContent = commentInput.value
  commentsList.appendChild(el)
  commentInput.value = ""
}

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden")
        }
