import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const feedEl = document.getElementById("feed-posts")
const modal = document.getElementById("comments-modal")
const commentsList = document.getElementById("comments-list")
const commentInput = document.getElementById("comment-input")
const sendCommentBtn = document.getElementById("send-comment")

let currentUser
let activePostId = null

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

  posts.forEach(post => {
    const el = document.createElement("div")
    el.className = "feed-post"

    el.innerHTML = `
      <div class="feed-post-time">${timeAgo(post.createdAt)}</div>
      <div class="feed-post-header">${post.username}</div>
      <div class="feed-post-content">${post.content}</div>
      <div class="feed-post-meta">
        <span class="like" data-id="${post.id}">🩶 <span class="count">${post.likes || 0}</span></span>
        <span class="comment" data-id="${post.id}">💬 ${post.comments || 0}</span>
      </div>
    `

    feedEl.appendChild(el)
  })

  document.querySelectorAll(".like").forEach(likeEl => {
    const postId = likeEl.dataset.id
    const countEl = likeEl.querySelector(".count")
    const likeRef = doc(db, "posts", postId, "likes", user.uid)

    getDoc(likeRef).then(snap => {
      if (snap.exists()) likeEl.firstChild.textContent = "❤️"
    })

    likeEl.onclick = async () => {
      if ((await getDoc(likeRef)).exists()) return

      await setDoc(likeRef, {
        userId: user.uid,
        createdAt: serverTimestamp()
      })

      likeEl.firstChild.textContent = "❤️"
      countEl.textContent = Number(countEl.textContent) + 1

      await setDoc(doc(db, "posts", postId), {
        likes: Number(countEl.textContent)
      }, { merge: true })
    }
  })

  document.querySelectorAll(".comment").forEach(commentEl => {
    commentEl.onclick = async () => {
      activePostId = commentEl.dataset.id
      commentsList.innerHTML = ""
      modal.classList.remove("hidden")

      const cSnap = await getDocs(collection(db, "posts", activePostId, "comments"))
      cSnap.forEach(c => {
        const el = document.createElement("div")
        el.className = "comment"
        el.textContent = c.data().text
        commentsList.appendChild(el)
      })
    }
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
