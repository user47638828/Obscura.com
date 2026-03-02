import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const feedEl = document.getElementById("feed-posts")
const modal = document.getElementById("comments-modal")
const commentsList = document.getElementById("comments-list")
const commentInput = document.getElementById("comment-input")
const sendCommentBtn = document.getElementById("send-comment")

let currentUser
let currentUsername
let activePostId = null
let activePostOwnerId = null

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

  const userSnap = await getDoc(doc(db, "users", user.uid))
  currentUsername = userSnap.data().username

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
        <span class="like" data-id="${post.id}">
          🩶 <span class="count">${post.likes || 0}</span>
        </span>
        <span class="comment" data-id="${post.id}">
          💬 ${post.comments || 0}
        </span>
      </div>
    `

    feedEl.appendChild(el)

    const likeEl = el.querySelector(".like")
    const countEl = el.querySelector(".count")
    const postRef = doc(db, "posts", post.id)
    const likeRef = doc(db, "posts", post.id, "likes", user.uid)

    let liked = false

    getDoc(likeRef).then(snap => {
      if (snap.exists()) {
        liked = true
        likeEl.firstChild.textContent = "❤️"
      }
    })

    likeEl.onclick = async () => {
      if (liked) return

      liked = true
      likeEl.firstChild.textContent = "❤️"
      countEl.textContent = Number(countEl.textContent) + 1

      await setDoc(likeRef, {
        userId: user.uid,
        createdAt: serverTimestamp()
      })

      await updateDoc(postRef, {
        likes: increment(1)
      })

      if (post.userId !== currentUser.uid) {
        await updateDoc(doc(db, "users", post.userId), {
          totalLikes: increment(1),
          xp: increment(1)
        })
      }
    }

    el.querySelector(".comment").onclick = async () => {
      activePostId = post.id
      activePostOwnerId = post.userId
      commentsList.innerHTML = ""
      modal.classList.remove("hidden")

      const cSnap = await getDocs(collection(db, "posts", post.id, "comments"))
      cSnap.forEach(c => {
        const data = c.data()
        const el = document.createElement("div")
        el.className = "comment"
        el.innerHTML = `
          <small>${data.username}</small>
          <div>${data.text}</div>
        `
        commentsList.appendChild(el)
      })
    }
  }
})

sendCommentBtn.onclick = async () => {
  if (!commentInput.value || !activePostId) return

  const text = commentInput.value

  await addDoc(collection(db, "posts", activePostId, "comments"), {
    text,
    userId: currentUser.uid,
    username: currentUsername,
    createdAt: serverTimestamp()
  })

  await updateDoc(doc(db, "posts", activePostId), {
    comments: increment(1)
  })

  if (activePostOwnerId !== currentUser.uid) {
    await updateDoc(doc(db, "users", activePostOwnerId), {
      totalComments: increment(1),
      xp: increment(3)
    })
  }

  const el = document.createElement("div")
  el.className = "comment"
  el.innerHTML = `
    <small>${currentUsername}</small>
    <div>${text}</div>
  `
  commentsList.appendChild(el)

  commentInput.value = ""
}

modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden")
}
